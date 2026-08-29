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
  output,
} from '@angular/core';

import { blockActivation, buttonState } from './button-appearance';
import {
  TOGGLE_BUTTON_DEFAULTS,
  type ButtonSize,
  type ButtonTone,
  type ButtonType,
  type ButtonVariant,
} from './button.constants';

@Component({
  selector: 'button[slToggleButton]',
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
    'data-slotted-component': 'toggle-button',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.data-full-width]': "fullWidth() ? '' : null",
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'state()',
    '[disabled]': 'disabled()',
    '[attr.type]': 'type()',
  },
})
export class SlToggleButton implements AfterViewInit {
  readonly ariaDisabled = input<boolean | string | null>(null, { alias: 'aria-disabled' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly pressed = input(false, { transform: booleanAttribute });
  readonly size = input<ButtonSize>(TOGGLE_BUTTON_DEFAULTS.size);
  readonly tone = input<ButtonTone>(TOGGLE_BUTTON_DEFAULTS.tone);
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>(TOGGLE_BUTTON_DEFAULTS.variant);
  readonly pressedChange = output<boolean>();

  readonly interactionBlocked = computed(
    () => this.disabled() || this.ariaDisabled() === true || this.ariaDisabled() === 'true',
  );
  readonly state = computed(() =>
    buttonState({ disabled: this.disabled(), pressed: this.pressed() }),
  );

  private readonly element = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const listener = (event: Event) => {
      if (this.interactionBlocked()) blockActivation(event);
    };
    this.element.addEventListener('click', listener, { capture: true });
    this.destroyRef.onDestroy(() =>
      this.element.removeEventListener('click', listener, { capture: true }),
    );
  }

  ngAfterViewInit() {
    const listener = (event: Event) => {
      if (!this.interactionBlocked() && !event.defaultPrevented)
        this.pressedChange.emit(!this.pressed());
    };
    this.element.addEventListener('click', listener);
    this.destroyRef.onDestroy(() => this.element.removeEventListener('click', listener));
  }
}
