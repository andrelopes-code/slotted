import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  isDevMode,
} from '@angular/core';

import { blockActivation, buttonState } from './button-appearance';
import {
  ICON_BUTTON_DEFAULTS,
  type ButtonSize,
  type ButtonTone,
  type ButtonType,
  type ButtonVariant,
} from './button.constants';

@Component({
  selector: 'button[slIconButton]',
  standalone: true,
  template: `
    <span class="slotted-button__content" [attr.data-loading-hidden]="loading() ? '' : null">
      <span data-part="icon"><ng-content></ng-content></span>
    </span>
    @if (loading()) {
      <span class="slotted-button__loading">
        <span aria-hidden="true" data-part="loading-indicator">
          <ng-content select="[slButtonLoadingIndicator]"></ng-content>
          <span class="slotted-button__spinner"></span>
        </span>
      </span>
    }
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button',
    'data-slotted-component': 'icon-button',
    'data-part-root': 'icon',
    '[attr.aria-busy]': 'loading() || ariaBusy()',
    '[attr.aria-disabled]': 'loading() || ariaDisabled()',
    '[attr.data-full-width]': "fullWidth() ? '' : null",
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'state()',
    '[disabled]': 'disabled()',
    '[attr.type]': 'type()',
  },
})
export class SlIconButton implements AfterViewInit {
  readonly ariaBusy = input<boolean | string | null>(null, { alias: 'aria-busy' });
  readonly ariaDisabled = input<boolean | string | null>(null, { alias: 'aria-disabled' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly size = input<ButtonSize>(ICON_BUTTON_DEFAULTS.size);
  readonly tone = input<ButtonTone>(ICON_BUTTON_DEFAULTS.tone);
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>(ICON_BUTTON_DEFAULTS.variant);

  readonly interactionBlocked = computed(
    () => this.loading() || this.ariaDisabled() === true || this.ariaDisabled() === 'true',
  );
  readonly state = computed(() =>
    buttonState({ disabled: this.disabled(), loading: this.loading() }),
  );

  private readonly element = inject(ElementRef<HTMLButtonElement>).nativeElement;

  constructor() {
    const listener = (event: Event) => this.handleClick(event);
    this.element.addEventListener('click', listener, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      this.element.removeEventListener('click', listener, { capture: true }),
    );
  }

  ngAfterViewInit() {
    if (!isDevMode()) return;

    const ariaLabel = this.element.getAttribute('aria-label');
    const ariaLabelledBy = this.element.getAttribute('aria-labelledby');
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
      throw new Error('IconButton requires aria-label or aria-labelledby');
    }
  }

  handleClick(event: Event) {
    if (this.interactionBlocked()) blockActivation(event);
  }
}
