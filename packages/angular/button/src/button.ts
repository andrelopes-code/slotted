import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';

import { blockActivation, buttonState } from './button-appearance';
import {
  BUTTON_DEFAULTS,
  type ButtonSize,
  type ButtonTone,
  type ButtonType,
  type ButtonVariant,
} from './button.constants';

@Component({
  selector: 'button[slButton]',
  standalone: true,
  template: `
    <span
      class="slotted-button__content"
      [attr.aria-hidden]="replacesAccessibleLabel() ? 'true' : null"
      [attr.data-loading-hidden]="loading() ? '' : null"
    >
      <span data-part="leading"><ng-content select="[slButtonLeading]"></ng-content></span>
      <span data-part="label"><ng-content></ng-content></span>
      <span data-part="trailing"><ng-content select="[slButtonTrailing]"></ng-content></span>
    </span>
    @if (loading()) {
      <span class="slotted-button__loading">
        <span aria-hidden="true" data-part="loading-indicator">
          <ng-content select="[slButtonLoadingIndicator]"></ng-content>
          <span class="slotted-button__spinner"></span>
        </span>
        @if (hasMeaningfulLoadingText()) {
          <span>{{ loadingText() }}</span>
        }
      </span>
    }
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button',
    'data-slotted-component': 'button',
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
export class SlButton {
  readonly ariaBusy = input<boolean | string | null>(null, { alias: 'aria-busy' });
  readonly ariaDisabled = input<boolean | string | null>(null, { alias: 'aria-disabled' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingText = input<string | undefined>(undefined);
  readonly size = input<ButtonSize>(BUTTON_DEFAULTS.size);
  readonly tone = input<ButtonTone>(BUTTON_DEFAULTS.tone);
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>(BUTTON_DEFAULTS.variant);

  readonly hasMeaningfulLoadingText = computed(() => {
    const loadingText = this.loadingText();
    return typeof loadingText === 'string' && loadingText.trim().length > 0;
  });
  readonly replacesAccessibleLabel = computed(
    () => this.loading() && this.hasMeaningfulLoadingText(),
  );
  readonly interactionBlocked = computed(
    () => this.loading() || this.ariaDisabled() === true || this.ariaDisabled() === 'true',
  );
  readonly state = computed(() =>
    buttonState({ disabled: this.disabled(), loading: this.loading() }),
  );

  constructor() {
    const element = inject(ElementRef<HTMLButtonElement>).nativeElement;
    const listener = (event: Event) => this.handleClick(event);
    element.addEventListener('click', listener, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      element.removeEventListener('click', listener, { capture: true }),
    );
  }

  handleClick(event: Event) {
    if (this.interactionBlocked()) blockActivation(event);
  }
}
