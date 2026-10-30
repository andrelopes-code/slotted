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
  numberAttribute,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { buttonMessages, type ButtonMessages, type PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';

import {
  blockActivation,
  optionalBoolean,
  PressedState,
  resolveAppearance,
  resolveInertness,
  resolveLoadingIndicator,
  stateAttribute,
} from './button-appearance';
import {
  ICON_BUTTON_DEFAULTS,
  type ButtonShape,
  type ButtonSize,
  type ButtonTone,
  type ButtonType,
  type ButtonVariant,
} from './button.constants';

/**
 * The same control as SlButton with no room for a label, so the accessible
 * name is an explicit attribute, checked in development because an attribute
 * cannot be made mandatory by a template.
 *
 * It takes `pressed` directly instead of being paired with a toggle component
 * of its own: its name is already an attribute that must not change with the
 * state, so toggling adds no obligation a separate component would exist to
 * enforce. `aria-pressed` appears only once the consumer opts in.
 *
 * The glyph's own box holds the ring while the control waits: it is already
 * the size of the ring, so nothing moves, and the glyph is the one thing this
 * member can afford to hide, because it carries no name.
 */
@Component({
  selector: 'button[slIconButton]',
  standalone: true,
  template: `<span data-part="icon" data-part-icon=""
    ><ng-content></ng-content>
    @if (waiting()) {
      <span
        data-part="indicator"
        data-part-indicator=""
        data-ui="spinner"
        data-ui-spinner=""
        role="progressbar"
        [attr.aria-label]="t('loading')"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    }
  </span>`,
  styleUrls: ['../../../styles/src/button/button.css', '../../../styles/src/spinner/spinner.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slIconButton',
  host: {
    'data-ui': 'button',
    'data-ui-button': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-disabled]': 'inert.ariaDisabled()',
    '[attr.aria-pressed]': 'toggles() ? isPressed() : null',
    '[attr.data-tone]': 'appearance.tone()',
    '[attr.data-variant]': 'appearance.variant()',
    '[attr.data-size]': 'appearance.size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-disabled]': 'stateAttribute(disabled())',
    '[attr.data-loading]': 'stateAttribute(loading())',
    '[attr.data-pressed]': 'stateAttribute(toggles() && isPressed())',
    '[disabled]': 'inert.nativelyDisabled()',
    '[attr.type]': 'type()',
  },
})
export class SlIconButton implements AfterViewInit {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly focusableWhenDisabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingDelay = input(0, { transform: numberAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: what the
   * ring announces itself as (`loading`). It is a progress bar, so it has a name.
   */
  readonly messages = input<PartialMessages<ButtonMessages> | undefined>(undefined);
  /** The family's words in the language in force, with this button's `messages` laid over them. */
  readonly t = injectMessages(buttonMessages, this.messages);
  readonly shape = input<ButtonShape>(ICON_BUTTON_DEFAULTS.shape);
  readonly size = input<ButtonSize | undefined>(undefined);
  readonly tone = input<ButtonTone | undefined>(undefined);
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant | undefined>(undefined);

  /** Present means controlled, for the life of the component. */
  readonly pressed = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly defaultPressed = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(pressed)]`
   * because a two-way binding has one slot and can carry none of those.
   */
  readonly pressedChange = output<ChangeRequest<boolean>>();

  readonly stateAttribute = stateAttribute;
  protected readonly appearance = resolveAppearance(this, ICON_BUTTON_DEFAULTS);
  protected readonly inert = resolveInertness(this);
  readonly waiting = resolveLoadingIndicator(this.loading, this.loadingDelay);

  private readonly state = new PressedState({
    pressed: this.pressed,
    defaultPressed: this.defaultPressed,
    emit: (request) => this.pressedChange.emit(request),
  });
  readonly isPressed = computed(() => this.state.value());
  /**
   * Whether the consumer opted into the toggle capability at all. Passing
   * either half of the state model is the opt-in, in both bindings: an icon
   * button that announced `aria-pressed` without one would be announcing a
   * state it does not have.
   */
  readonly toggles = computed(
    () => this.pressed() !== undefined || this.defaultPressed() !== undefined,
  );

  private readonly element = inject(ElementRef<HTMLButtonElement>).nativeElement;

  private readonly destroyRef = inject(DestroyRef);

  /**
   * The capture phase, because a control that is unavailable or still working
   * must refuse the activation before any listener the consumer attached to it
   * can run.
   */
  constructor() {
    const capture = (event: Event) => {
      if (this.inert.refuses()) blockActivation(event);
    };
    this.element.addEventListener('click', capture, { capture: true });
    this.destroyRef.onDestroy(() =>
      this.element.removeEventListener('click', capture, { capture: true }),
    );
  }

  ngAfterViewInit() {
    /**
     * After the view, not in the constructor. A `(click)` written on the same
     * element is bound when the view is created, so a listener registered any
     * earlier runs first and reads `defaultPrevented` before the consumer has
     * had the chance to set it.
     */
    const activate = (event: Event) => {
      if (this.inert.refuses() || event.defaultPrevented || !this.toggles()) return;
      this.state.request(event);
    };
    this.element.addEventListener('click', activate);
    this.destroyRef.onDestroy(() => this.element.removeEventListener('click', activate));

    if (!isDevMode()) return;

    const label = this.element.getAttribute('aria-label');
    const labelledBy = this.element.getAttribute('aria-labelledby');
    if (!label?.trim() && !labelledBy?.trim()) {
      throw new Error('SlIconButton requires aria-label or aria-labelledby');
    }
  }
}
