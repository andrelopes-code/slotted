import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { buttonMessages, type ButtonMessages, type PartialMessages } from '@slotted/core/i18n';

import {
  BUTTON_WAIT,
  blockActivation,
  resolveAppearance,
  resolveInertness,
  resolveLoadingIndicator,
  SlButtonEnd,
  SlButtonStart,
  stateAttribute,
} from './button-appearance';
import type { ButtonWait } from './button-appearance';
import {
  BUTTON_DEFAULTS,
  type ButtonJustify,
  type ButtonSize,
  type ButtonTone,
  type ButtonType,
  type ButtonVariant,
} from './button.constants';

/**
 * A momentary action. Persistent state belongs to SlToggleButton, and
 * navigation to SlButtonLink, so this member never grows an `aria-pressed` or
 * an `href`.
 *
 * There is no `render` input, and there is no need for one: the component is a
 * directive on the element the consumer wrote, so substituting the element is
 * something the consumer does by writing a different one.
 */
@Component({
  selector: 'button[slButton]',
  standalone: true,
  template: `<ng-content select="[slButtonStart]"></ng-content
    ><span data-part="label" data-part-label=""><ng-content></ng-content></span
    ><ng-content select="[slButtonEnd]"></ng-content>
    @if (waiting() && !hasVisualSlot()) {
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
    }`,
  styleUrls: ['../../../styles/src/button/button.css', '../../../styles/src/spinner/spinner.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slButton',
  providers: [{ provide: BUTTON_WAIT, useExisting: forwardRef(() => SlButton) }],
  host: {
    'data-ui': 'button',
    'data-ui-button': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-disabled]': 'inert.ariaDisabled()',
    '[attr.data-tone]': 'appearance.tone()',
    '[attr.data-variant]': 'appearance.variant()',
    '[attr.data-size]': 'appearance.size()',
    '[attr.data-full-width]': 'stateAttribute(fullWidth())',
    '[attr.data-justify]': 'justify()',
    '[attr.data-disabled]': 'stateAttribute(disabled())',
    '[attr.data-loading]': 'stateAttribute(loading())',
    '[disabled]': 'inert.nativelyDisabled()',
    '[attr.type]': 'type()',
  },
})
export class SlButton implements ButtonWait {
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Keeps an unavailable control in the tab sequence, announcing
   * `aria-disabled` instead of carrying the attribute that removes it. The
   * activation is refused either way.
   */
  readonly focusableWhenDisabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /**
   * Where the content sits along the inline axis. `between` sets the label at
   * the start and the end slot at the inline end, as a field trigger reads;
   * the start slot stays beside the label.
   */
  readonly justify = input<ButtonJustify>('center');
  readonly loading = input(false, { transform: booleanAttribute });
  /** How long the wait lasts before the ring is drawn. The refusal is immediate. */
  readonly loadingDelay = input(0, { transform: numberAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: what the
   * ring announces itself as (`loading`). It is a progress bar, so it has a name.
   */
  readonly messages = input<PartialMessages<ButtonMessages> | undefined>(undefined);
  /** The family's words in the language in force, with this button's `messages` laid over them. */
  readonly t = injectMessages(buttonMessages, this.messages);
  readonly size = input<ButtonSize | undefined>(undefined);
  readonly tone = input<ButtonTone | undefined>(undefined);
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant | undefined>(undefined);

  readonly stateAttribute = stateAttribute;
  protected readonly appearance = resolveAppearance(this, BUTTON_DEFAULTS);
  protected readonly inert = resolveInertness(this);
  readonly waiting = resolveLoadingIndicator(this.loading, this.loadingDelay);

  private readonly start = contentChild(SlButtonStart);
  private readonly end = contentChild(SlButtonEnd);
  readonly hasStart = computed(() => this.start() !== undefined);
  /**
   * A control with a visual slot gives the ring that box, and the slot draws
   * it. Only a control with neither draws one of its own, centerd over the
   * label the stylesheet then fades.
   */
  protected readonly hasVisualSlot = computed(
    () => this.start() !== undefined || this.end() !== undefined,
  );

  /**
   * The capture phase, because a control that is unavailable or still working
   * must refuse the activation before any listener the consumer attached to it
   * can run — including the submit a `type="submit"` button would perform while
   * it keeps its place in the tab sequence.
   */
  constructor() {
    const element = inject(ElementRef<HTMLButtonElement>).nativeElement;
    const listener = (event: Event) => {
      if (this.inert.refuses()) blockActivation(event);
    };
    element.addEventListener('click', listener, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      element.removeEventListener('click', listener, { capture: true }),
    );
  }
}
