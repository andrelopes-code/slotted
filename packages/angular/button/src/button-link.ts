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
  type ButtonVariant,
} from './button.constants';

@Component({
  selector: 'a[slButtonLink]',
  standalone: true,
  template: `
    <span class="slotted-button__content">
      <span data-part="leading"><ng-content select="[slButtonLeading]"></ng-content></span>
      <span data-part="label"><ng-content></ng-content></span>
      <span data-part="trailing"><ng-content select="[slButtonTrailing]"></ng-content></span>
    </span>
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button',
    'data-slotted-component': 'button-link',
    '[attr.aria-disabled]': 'disabled() ? true : ariaDisabled()',
    '[attr.data-full-width]': "fullWidth() ? '' : null",
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'state()',
    '[attr.tabindex]': 'disabled() ? (tabIndex() ?? -1) : tabIndex()',
    '(click)': 'handleClick($event)',
    '(auxclick)': 'handleAuxClick($event)',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class SlButtonLink {
  readonly ariaDisabled = input<boolean | string | null>(null, { alias: 'aria-disabled' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly tabIndex = input<number | string | null>(null, { alias: 'tabIndex' });
  readonly size = input<ButtonSize>(BUTTON_DEFAULTS.size);
  readonly tone = input<ButtonTone>(BUTTON_DEFAULTS.tone);
  readonly variant = input<ButtonVariant>(BUTTON_DEFAULTS.variant);

  readonly interactionBlocked = computed(
    () => this.disabled() || this.ariaDisabled() === true || this.ariaDisabled() === 'true',
  );
  readonly state = computed(() => buttonState({ disabled: this.disabled() }));

  constructor() {
    const element = inject(ElementRef<HTMLAnchorElement>).nativeElement;
    const destroyRef = inject(DestroyRef);
    this.addCaptureListener(element, 'click', (event) => this.handleClick(event), destroyRef);
    this.addCaptureListener(element, 'auxclick', (event) => this.handleAuxClick(event), destroyRef);
    this.addCaptureListener(
      element,
      'keydown',
      (event) => this.handleKeydown(event as KeyboardEvent),
      destroyRef,
    );
  }

  handleClick(event: Event) {
    if (this.interactionBlocked()) blockActivation(event);
  }

  handleAuxClick(event: Event) {
    if (this.interactionBlocked()) blockActivation(event);
  }

  handleKeydown(event: KeyboardEvent) {
    if (this.interactionBlocked() && (event.key === 'Enter' || event.key === ' '))
      blockActivation(event);
  }

  private addCaptureListener(
    element: HTMLAnchorElement,
    type: 'click' | 'auxclick' | 'keydown',
    listener: EventListener,
    destroyRef: DestroyRef,
  ) {
    element.addEventListener(type, listener, { capture: true });
    destroyRef.onDestroy(() => element.removeEventListener(type, listener, { capture: true }));
  }
}
