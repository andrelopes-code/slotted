import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  currencyFieldMessages,
  type CurrencyFieldMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import {
  STEP_REPEAT_DELAY,
  STEP_REPEAT_DELAY_COARSE,
  STEP_REPEAT_INTERVAL,
} from '@slotted/core/number';
import { SlField } from '@slotted/angular/field';

import { injectCurrencyFieldDefaults, SlCurrencyFieldControl } from './currency-field-defaults';
import type {
  CurrencyFieldAlign,
  CurrencyFieldAppearance,
  CurrencyFieldSize,
  CurrencyFieldStepper,
  CurrencyFieldVariant,
} from './currency-field-defaults';

export type {
  CurrencyFieldAlign,
  CurrencyFieldAppearance,
  CurrencyFieldClamp,
  CurrencyFieldDisplay,
  CurrencyFieldEntry,
  CurrencyFieldSize,
  CurrencyFieldStepper,
  CurrencyFieldVariant,
} from './currency-field-defaults';

/**
 * The frame: one amount, and the two buttons that move it when a product asks
 * for them.
 *
 * **It is not the control.** The element carrying `data-ui` is the consumer's
 * own box with no role; the `input` inside it holds the amount, the identifier
 * and the APG's `spinbutton` role. WAI-ARIA settles the shape: a `spinbutton`
 * may hold only non-interactive presentational children, so the two steppers
 * are the control's siblings rather than its children.
 *
 * **The steppers are withdrawn by default**, where `number-field` ships them:
 * an invoice total is typed, not nudged.
 *
 * **Angular pays one element for the frame, and React pays none.** React can
 * render a wrapper from inside a component; an Angular directive cannot create
 * a box around its own host. `slCurrencyFieldInput` injects this class, so a
 * control written without the frame is a compile-time failure rather than a
 * silent one.
 */
@Component({
  selector: '[slCurrencyField]',
  standalone: true,
  exportAs: 'slCurrencyField',
  imports: [SlGlyph, SlIcon],
  template: `@if (resolvedStepper() === 'split') {
      <button
        data-part="decrement"
        data-part-decrement=""
        type="button"
        tabindex="-1"
        [attr.aria-controls]="control()?.controlId()"
        [attr.aria-label]="t('decrement')"
        [disabled]="decrementDisabled()"
        (pointerdown)="press(-1, $event)"
        (pointerup)="release()"
        (pointerleave)="release()"
        (pointercancel)="release()"
      >
        <span slIcon><svg slGlyph name="minus"></svg></span>
      </button>
    }
    <ng-content select="[slCurrencyFieldStart]" />
    @if (control()?.affix(); as affix) {
      @if (affix.position === 'start') {
        <span data-part="symbol" data-part-symbol="">{{ affix.text }}</span>
      }
    }
    <ng-content />
    @if (control()?.affix(); as affix) {
      @if (affix.position === 'end') {
        <span data-part="symbol" data-part-symbol="">{{ affix.text }}</span>
      }
    }
    <ng-content select="[slCurrencyFieldEnd]" />
    @if (resolvedStepper() === 'split') {
      <button
        data-part="increment"
        data-part-increment=""
        type="button"
        tabindex="-1"
        [attr.aria-controls]="control()?.controlId()"
        [attr.aria-label]="t('increment')"
        [disabled]="incrementDisabled()"
        (pointerdown)="press(1, $event)"
        (pointerup)="release()"
        (pointerleave)="release()"
        (pointercancel)="release()"
      >
        <span slIcon><svg slGlyph name="plus"></svg></span>
      </button>
    } @else if (resolvedStepper() === 'stacked') {
      <span data-part="stepper" data-part-stepper="">
        <button
          data-part="increment"
          data-part-increment=""
          type="button"
          tabindex="-1"
          [attr.aria-controls]="control()?.controlId()"
          [attr.aria-label]="t('increment')"
          [disabled]="incrementDisabled()"
          (pointerdown)="press(1, $event)"
          (pointerup)="release()"
          (pointerleave)="release()"
          (pointercancel)="release()"
        >
          <!-- Both halves draw the down chevron; the stylesheet turns the
               increment's half a turn. -->
          <span slIcon><svg slGlyph name="chevron-down"></svg></span>
        </button>
        <button
          data-part="decrement"
          data-part-decrement=""
          type="button"
          tabindex="-1"
          [attr.aria-controls]="control()?.controlId()"
          [attr.aria-label]="t('decrement')"
          [disabled]="decrementDisabled()"
          (pointerdown)="press(-1, $event)"
          (pointerup)="release()"
          (pointerleave)="release()"
          (pointercancel)="release()"
        >
          <span slIcon><svg slGlyph name="chevron-down"></svg></span>
        </button>
      </span>
    }
    @if (control()?.submissionName(); as submissionName) {
      <input
        type="hidden"
        [attr.name]="submissionName"
        [attr.form]="control()?.submissionForm()"
        [value]="hiddenValue()"
      />
    }`,
  styleUrl: '../../../styles/src/currency-field/currency-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'currency-field',
    'data-ui-currency-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-align]': 'resolvedAlign()',
    '[attr.data-appearance]': 'resolvedAppearance()',
    '[attr.data-entry]': 'resolvedEntry()',
    '[attr.data-stepper]': 'resolvedStepper()',
    '[attr.data-disabled]': "control()?.resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "control()?.resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "control()?.resolvedReadOnly() === true ? '' : null",
    '[attr.data-scrubbing]': "scrubbing() ? '' : null",
  },
})
export class SlCurrencyField {
  /** Defaults to the field, then to the token, then to `md`. */
  readonly size = input<CurrencyFieldSize | undefined>(undefined);
  /** Defaults to the token, then to `outline`. */
  readonly variant = input<CurrencyFieldVariant | undefined>(undefined);
  /**
   * A field among fields, or the headline amount of an entry sheet. Defaults
   * to `control`. `display` sets its own type step and draws a rule rather
   * than a box, so `size` and `variant` do not apply to it.
   */
  readonly appearance = input<CurrencyFieldAppearance | undefined>(undefined);
  readonly resolvedAppearance = computed(() => this.appearance() ?? 'control');
  /** Which edge the amount is set against. Defaults to the token, then `end`. */
  readonly align = input<CurrencyFieldAlign | undefined>(undefined);
  /** Where the two steppers sit. Defaults to the token, then `none`. */
  readonly stepper = input<CurrencyFieldStepper | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * `increment` and `decrement` buttons' accessible names.
   */
  readonly messages = input<PartialMessages<CurrencyFieldMessages> | undefined>(undefined);

  private readonly defaults = injectCurrencyFieldDefaults();
  private readonly field = inject(SlField, { optional: true });

  /**
   * The control inside. It provides itself as `SlCurrencyFieldControl`, so the
   * frame can read the bounds, the submission name and the shared states
   * without either directive importing the other.
   */
  readonly control = contentChild(SlCurrencyFieldControl, { descendants: true });

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedStepper = computed(() => this.stepper() ?? this.defaults.stepper);
  /**
   * The entry model belongs to the control, because it is behavior before it
   * is an axis: the frame only paints what the control resolved. Two inputs
   * for one decision would let the box and the element disagree about how the
   * next keystroke is read.
   */
  readonly resolvedEntry = computed(() => this.control()?.resolvedEntry() ?? this.defaults.entry);
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(currencyFieldMessages, this.messages);

  /** Whether a `slCurrencyFieldScrub` inside is being dragged. */
  readonly scrubbing = signal(false);

  /** A control nobody can change has two buttons that would lie about it. */
  readonly inert = computed(() => {
    const control = this.control();
    return control?.resolvedDisabled() === true || control?.resolvedReadOnly() === true;
  });

  protected readonly incrementDisabled = computed(
    () => this.inert() || this.control()?.atMax() === true,
  );
  protected readonly decrementDisabled = computed(
    () => this.inert() || this.control()?.atMin() === true,
  );

  protected readonly hiddenValue = computed(() => {
    const value = this.control()?.submittedValue() ?? null;
    return value === null ? '' : String(value);
  });

  private delay: ReturnType<typeof setTimeout> | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    /* A button unmounted mid-press would otherwise leave a timer running. */
    inject(DestroyRef).onDestroy(() => this.release());
  }

  /**
   * One step now, then repeating while the button is held. A coarse pointer
   * waits longer before the first repeat, because a finger that is starting to
   * scroll rests on the button first.
   */
  protected press(direction: 1 | -1, event: PointerEvent) {
    if (event.button !== 0) return;
    /* Focus stays on the amount: the button is out of the tab order and the
       caret is what the reader came back to. */
    event.preventDefault();
    const control = this.control();
    if (control === undefined) return;
    control.stepBy(direction, event);

    this.release();
    const wait = event.pointerType === 'touch' ? STEP_REPEAT_DELAY_COARSE : STEP_REPEAT_DELAY;
    this.delay = setTimeout(() => {
      this.interval = setInterval(() => control.stepBy(direction, undefined), STEP_REPEAT_INTERVAL);
    }, wait);
  }

  protected release() {
    clearTimeout(this.delay);
    clearInterval(this.interval);
    this.delay = undefined;
    this.interval = undefined;
  }
}
