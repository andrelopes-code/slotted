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
  numberFieldMessages,
  type NumberFieldMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import {
  STEP_REPEAT_DELAY,
  STEP_REPEAT_DELAY_COARSE,
  STEP_REPEAT_INTERVAL,
} from '@slotted/core/number';
import { SlField } from '@slotted/angular/field';

import { injectNumberFieldDefaults, SlNumberFieldControl } from './number-field-defaults';
import type {
  NumberFieldSize,
  NumberFieldStepper,
  NumberFieldVariant,
} from './number-field-defaults';

export type {
  NumberFieldClamp,
  NumberFieldSize,
  NumberFieldStepper,
  NumberFieldVariant,
} from './number-field-defaults';

/**
 * The frame: one number, and the two buttons that move it.
 *
 * **It is not the control.** The element carrying `data-ui` is the consumer's
 * own box with no role; the `input` inside it holds the value, the identifier
 * and the APG's `spinbutton` role. WAI-ARIA settles the shape: a `spinbutton`
 * may hold only non-interactive presentational children, so the two steppers
 * are the control's siblings rather than its children.
 *
 * **The split arrangement is written in the order it is painted.** Decrement
 * before the value and increment after it, rather than one box reordered with
 * `order`, so the reading order and the painted order are the same one.
 *
 * **Angular pays one element for that frame, and React pays none.** React can
 * render a wrapper from inside a component; an Angular directive cannot create
 * a box around its own host. `slNumberFieldInput` injects this class, so a
 * control written without the frame is a compile-time failure rather than a
 * silent one.
 */
@Component({
  selector: '[slNumberField]',
  standalone: true,
  exportAs: 'slNumberField',
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
    <ng-content select="[slNumberFieldStart]" />
    <ng-content />
    <ng-content select="[slNumberFieldEnd]" />
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
  styleUrl: '../../../styles/src/number-field/number-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'number-field',
    'data-ui-number-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-stepper]': 'resolvedStepper()',
    '[attr.data-disabled]': "control()?.resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "control()?.resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "control()?.resolvedReadOnly() === true ? '' : null",
    '[attr.data-scrubbing]': "scrubbing() ? '' : null",
  },
})
export class SlNumberField {
  /** Defaults to the field, then to the token, then to `md`. */
  readonly size = input<NumberFieldSize | undefined>(undefined);
  /** Defaults to the token, then to `outline`. */
  readonly variant = input<NumberFieldVariant | undefined>(undefined);
  /** Where the two steppers sit. Defaults to the token, then to `stacked`. */
  readonly stepper = input<NumberFieldStepper | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * `increment` and `decrement` buttons' accessible names.
   */
  readonly messages = input<PartialMessages<NumberFieldMessages> | undefined>(undefined);

  private readonly defaults = injectNumberFieldDefaults();
  private readonly field = inject(SlField, { optional: true });

  /**
   * The control inside. It provides itself as `SlNumberFieldControl`, so the
   * frame can read the bounds, the submission name and the shared states
   * without either directive importing the other.
   */
  readonly control = contentChild(SlNumberFieldControl, { descendants: true });

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedStepper = computed(() => this.stepper() ?? this.defaults.stepper);
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(numberFieldMessages, this.messages);

  /** Whether a `slNumberFieldScrub` inside is being dragged. */
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
    const value = this.control()?.numberValue() ?? null;
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
    /* Focus stays on the value: the button is out of the tab order and the
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
