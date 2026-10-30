import {
  boundSegment,
  clearSegment,
  commitTyping,
  createTimeFormat,
  EMPTY_SEGMENTS,
  fieldRange,
  isRelativeKey,
  isSameTime,
  isTimeInRange,
  nowIn,
  parseDuration,
  plainDate,
  resolveRelative,
  segmentsOfTime,
  stepSegment,
  timeOf,
  toISOTime,
  typeDayPeriod,
  typeDigit,
} from '@slotted/core/date';
import type {
  PlainTime,
  SegmentReference,
  SegmentState,
  TimeFieldName,
  TimeGranularity,
} from '@slotted/core/date';
import {
  timeFieldMessages,
  type PartialMessages,
  type TimeFieldMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlField } from '@slotted/angular/field';

import { injectTimeFieldDefaults } from './time-field-defaults';
import type { TimeFieldHourCycle, TimeFieldSize, TimeFieldVariant } from './time-field-defaults';

/**
 * How far `PageUp` and `PageDown` move each field.
 *
 * The APG spin-button example pages every button by five. Fifteen minutes is
 * the page a reader of a time field means and the step a quarter-hour panel
 * offers, so the two agree; three hours is a quarter of a twelve-hour cycle.
 */
const PAGE_STEP: Record<TimeFieldName, number> = {
  hour: 3,
  minute: 15,
  second: 15,
  dayPeriod: 1,
};

/**
 * The date half of the reference, which a time field never draws and the engine
 * still asks for. One `SegmentState` holds both halves — that is what
 * `datetime-field` needs — so the reference carries both as well.
 */
const REFERENCE_DATE = plainDate(2000, 1, 1);

/**
 * The hidden element carrying the whole time needs an identifier the group can
 * point `aria-labelledby` at, and Angular has no `useId`. A module counter is
 * what the framework leaves: stable for a given render order, which is what
 * hydration needs, and never on the public surface.
 */
let sequence = 0;

/**
 * What a request carries beyond the value: the segments, so a half-typed time
 * can be saved, and whether the duration that produced it ran past midnight.
 */
export interface TimeFieldChangeRequest extends ChangeRequest<PlainTime | null> {
  readonly segments: SegmentState;
  readonly crossesMidnight: boolean;
}

/**
 * A segmented time control: one spin button per field, in the order the locale
 * writes them.
 *
 * **The frame is not the control.** The element carrying `data-ui` is the
 * consumer's own box with no role; `role="group"` is on the row of segments,
 * which is what the APG's spin-button example names.
 *
 * **Angular is a component with a template and a `ControlValueAccessor`**,
 * because a time belongs in a Reactive Form and Angular has the integration
 * point for it. It also implements `Validator`: `min`, `max` and
 * `isTimeUnavailable` are validity this control owns and no other validator can
 * see. React has no equivalent, and `references/frameworks.md` asks for that
 * asymmetry to be recorded rather than levelled away.
 *
 * **A time can be written as a duration.** `+`, `-` and `=` open one expression
 * region in place of the segments, and what it resolves to is drawn beside it
 * before `Enter` commits anything.
 */
@Component({
  selector: '[slTimeField]',
  standalone: true,
  exportAs: 'slTimeField',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content select="[slTimeFieldStart]" />
    @if (expression() !== null) {
      <input
        #duration
        data-part="duration"
        data-part-duration=""
        type="text"
        placeholder="+40m"
        [attr.aria-label]="t('duration')"
        [attr.aria-describedby]="describedBy()"
        [value]="expression()"
        (input)="onExpressionInput($event)"
        (keydown)="onExpressionKeyDown($event)"
        (blur)="commitExpression()"
      />
      <span
        data-part="preview"
        data-part-preview=""
        role="status"
        aria-live="polite"
        [attr.data-resolved]="resolved() === null ? null : ''"
        [attr.data-crosses-midnight]="crossesMidnight() ? '' : null"
        ><span slIcon directional><svg slGlyph name="chevron-right"></svg></span
        >{{ previewText() }}</span
      >
    } @else {
      <div
        data-part="segments"
        data-part-segments=""
        role="group"
        [attr.id]="controlId()"
        [attr.aria-label]="label() ?? writtenLabel"
        [attr.aria-labelledby]="labelledBy()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-required]="ariaRequired()"
        [attr.aria-readonly]="ariaReadonly()"
        [attr.aria-disabled]="ariaDisabled()"
        (paste)="onPaste($event)"
      >
        @for (part of format().pattern; track $index) {
          @if (part.type === 'literal') {
            <span data-part="literal" data-part-literal="" aria-hidden="true">{{
              part.value
            }}</span>
          } @else {
            <div
              data-part="segment"
              data-part-segment=""
              role="spinbutton"
              [attr.data-field]="part.type"
              [attr.data-placeholder]="valueOf(part.type) === null ? '' : null"
              [attr.aria-label]="t(part.type)"
              [attr.aria-valuenow]="valueOf(part.type)"
              [attr.aria-valuemin]="rangeOf(part.type).min"
              [attr.aria-valuemax]="rangeOf(part.type).max"
              [attr.aria-valuetext]="spokenOf(part.type)"
              [attr.aria-disabled]="ariaDisabled()"
              [attr.aria-readonly]="ariaReadonly()"
              [tabindex]="tabIndexOf(part.type)"
              (mousedown)="onSegmentMouseDown($event)"
              (focus)="activeField.set(part.type)"
              (blur)="onBlur()"
            >
              {{ textOf(part.type) }}
            </div>
          }
        }
      </div>
    }
    <span data-part="value-text" data-part-value-text="" hidden [attr.id]="valueTextId">{{
      spokenTime()
    }}</span>
    @if (showClear()) {
      <button
        data-part="clear"
        data-part-clear=""
        type="button"
        [attr.aria-label]="t('clear')"
        (click)="clear($event)"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    }
    <ng-content select="[slTimeFieldEnd]" />
    <input
      data-part="hidden-input"
      data-part-hidden-input=""
      type="hidden"
      readonly
      [attr.name]="name()"
      [value]="iso()"
    />`,
  styleUrl: '../../../styles/src/time-field/time-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTimeField), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlTimeField), multi: true },
  ],
  host: {
    'data-ui': 'time-field',
    'data-ui-time-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '(mousedown)': 'onRootMouseDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-cycle]': 'dataCycle()',
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-relative]': "expression() === null ? null : ''",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlTimeField implements ControlValueAccessor, Validator, OnInit {
  /** Present means the consumer owns the value. */
  readonly value = input<PlainTime | null | undefined>(undefined);
  /** The value the control starts from when nobody else writes one. */
  readonly defaultValue = input<PlainTime | null | undefined>(undefined);

  /** The earliest time the control accepts. Also a form validity rule. */
  readonly min = input<PlainTime | undefined>(undefined);
  /** The latest time the control accepts. Also a form validity rule. */
  readonly max = input<PlainTime | undefined>(undefined);
  /** Refuses particular times — a lunch break, a booked slot, a closed shop. */
  readonly isTimeUnavailable = input<((time: PlainTime) => boolean) | undefined>(undefined);

  /**
   * BCP 47. Decides the field order, the separators and the placeholder.
   * Unset, the language in force (`provideSlotted`) decides.
   */
  readonly locale = input<string | undefined>(undefined);
  /** Which zone answers "what time is it now", and nothing else. */
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<TimeFieldHourCycle | undefined>(undefined);
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  /**
   * What an empty segment steps from, and what a duration resolves against.
   * Unset, both are the current time in `timeZone`.
   */
  readonly referenceTime = input<PlainTime | undefined>(undefined);

  readonly size = input<TimeFieldSize | undefined>(undefined);
  readonly variant = input<TimeFieldVariant | undefined>(undefined);

  /** Unstated rather than `false`, so the control defers to the field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /** Draws a button that empties the value and returns focus to the control. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Whether `+`, `-` and `=` open the duration expression. */
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear button, the duration region's name and the next-day preview.
   */
  readonly messages = input<PartialMessages<TimeFieldMessages> | undefined>(undefined);
  /** The name a plain form post carries the `HH:mm:ss` string under. */
  readonly name = input<string | undefined>(undefined);

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the segments, whether a duration crossed midnight, the reason, the
   * originating event and `cancel()`. There is no `[(value)]`, because a
   * two-way binding has one slot and can carry none of those.
   */
  /**
   * The accessible name, when it is bound rather than written: a static
   * `aria-label` is read once from the host, and a family naming this field
   * from its own input — `time-range-picker` names its two ends — has no
   * static attribute to write.
   */
  readonly label = input<string | undefined>(undefined);

  readonly valueChange = output<TimeFieldChangeRequest>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectTimeFieldDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(timeFieldMessages, this.messages);
  private readonly field = inject(SlField, { optional: true });

  /** Read before the host binding computes, so it never writes over it. */
  protected readonly writtenLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });

  protected readonly valueTextId = `sl-time-field-${String((sequence += 1))}`;

  private readonly segments = signal<SegmentState>(EMPTY_SEGMENTS);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /**
   * What time it is, resolved after construction rather than during it, so a
   * server and a browser never disagree about the markup. Nothing is drawn from
   * it: it is the time an empty segment steps to and a duration resolves from.
   */
  private readonly clock = signal<PlainTime>({ hour: 12, minute: 0, second: 0 });
  protected readonly activeField = signal<TimeFieldName | undefined>(undefined);
  /** The duration being written, or `null` while the segments are showing. */
  protected readonly expression = signal<string | null>(null);

  private onChangeFn: (value: PlainTime | null) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );

  protected readonly format = computed(() =>
    createTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.hourCycle() ?? this.defaults.hourCycle,
      locale: this.locale() ?? this.appLocale(),
    }),
  );

  protected readonly dataCycle = computed(() => (this.format().usesDayPeriod ? '12' : '24'));

  protected readonly fields = computed(() =>
    this.format()
      .pattern.filter((part) => part.type !== 'literal')
      .map((part) => part.type as TimeFieldName),
  );

  /** What an empty segment steps from, in the shape the engine reads. */
  private readonly reference = computed<SegmentReference>(() => {
    const anchor = this.anchor();
    const shown = this.format().toDisplay(anchor.hour);
    return {
      ...REFERENCE_DATE,
      dayPeriod: shown.dayPeriod ?? 0,
      hour: shown.hour,
      hourCycle: this.format().hourCycle,
      minute: anchor.minute,
      second: anchor.second,
    };
  });

  private readonly anchor = computed(() => this.referenceTime() ?? this.clock());

  /** The time the segments make, or `null` while any drawn field is unfilled. */
  readonly time = computed(() => timeOf(this.segments(), this.format()));
  protected readonly iso = computed(() => {
    const time = this.time();
    return time === null ? '' : toISOTime(time);
  });
  protected readonly spokenTime = computed(() => {
    const time = this.time();
    return time === null ? '' : this.format().describe(time);
  });

  /* ── The duration expression ─────────────────────────────────────────── */

  protected readonly resolved = computed(() => {
    const written = this.expression();
    if (written === null) return null;
    const seconds = parseDuration(written);
    return seconds === null ? null : resolveRelative(this.anchor(), seconds);
  });

  protected readonly crossesMidnight = computed(() => (this.resolved()?.days ?? 0) !== 0);

  protected readonly previewText = computed(() => {
    const step = this.resolved();
    if (step === null) return '';
    const written = this.format().format(step.time);
    return step.days === 0 ? written : this.t('nextDay', { time: written });
  });

  /* ── What the field around it decides ────────────────────────────────── */

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedRequired = computed(() => this.required() ?? this.field?.required());

  /**
   * Validity the family owns, beside the validity the consumer states. A time
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  readonly resolvedInvalid = computed(() => {
    const time = this.time();
    if (time !== null && !isTimeInRange(time, this.min(), this.max())) return true;
    if (time !== null && this.isTimeUnavailable()?.(time) === true) return true;
    return this.invalid() ?? this.field?.invalid();
  });

  protected readonly controlId = computed(
    () => this.writtenId ?? this.field?.ids().control ?? null,
  );
  protected readonly labelledBy = computed(() => {
    if (this.label() !== undefined || this.writtenLabel !== null) return null;
    const merged = [this.writtenLabelledBy ?? this.field?.ids().label, this.valueTextId].filter(
      Boolean,
    );
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.field?.describedBy()].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly ariaInvalid = computed(() =>
    this.resolvedInvalid() === true ? 'true' : null,
  );
  protected readonly ariaRequired = computed(() =>
    this.resolvedRequired() === true ? 'true' : null,
  );
  protected readonly ariaReadonly = computed(() =>
    this.resolvedReadOnly() === true ? 'true' : null,
  );
  protected readonly ariaDisabled = computed(() =>
    this.resolvedDisabled() === true ? 'true' : null,
  );

  private readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  protected readonly showClear = computed(() => {
    if (!this.clearable() || !this.editable() || this.expression() !== null) return false;
    const held = this.segments();
    return this.fields().some((name) => held[name] !== null);
  });

  constructor() {
    /**
     * A consumer's own value writes the segments, and only when it names a
     * different time: written on every change detection it would throw away a
     * half-typed time on the keystroke that completes a different one.
     */
    effect(() => {
      const next = this.value();
      if (next === undefined) return;
      const segments = this.segments();
      /* A run of digits still being typed is not a value the consumer refused:
         with a controlled `null`, the first minute digit after a whole hour
         read as a time the consumer had not written back, and the segments
         were reset under the reader's fingers. Found by `time-range-picker`,
         which binds the field to its work. */
      if (segments.typing !== null) return;
      if (isSameTime(timeOf(segments, this.format()), next)) return;
      this.segments.set(segmentsOfTime(next, this.format()));
    });

    /* The expression region is focused the moment it replaces the segments,
       with the caret after the character that opened it. */
    effect(() => {
      if (this.expression() === null) return;
      queueMicrotask(() => {
        const input = this.element.querySelector<HTMLInputElement>('[data-part="duration"]');
        if (input === null) return;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      });
    });
  }

  ngOnInit() {
    this.segments.set(segmentsOfTime(this.value() ?? this.defaultValue() ?? null, this.format()));
    this.clock.set(nowIn(this.timeZone() ?? this.defaults.timeZone));
  }

  /* ── The value ───────────────────────────────────────────────────────── */

  writeValue(value: PlainTime | null | undefined) {
    this.segments.set(segmentsOfTime(value ?? null, this.format()));
  }

  registerOnChange(fn: (value: PlainTime | null) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  registerOnValidatorChange(fn: () => void) {
    this.onValidatorChangeFn = fn;
  }

  /**
   * The rules no other validator can see. `required` is left to Angular's own,
   * because a form already has a word for it and two would disagree.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const time = control.value as PlainTime | null;
    if (time === null || time === undefined) return null;

    const min = this.min();
    const max = this.max();
    if (!isTimeInRange(time, min, max)) {
      return { slottedTimeRange: { min, max, actual: time } };
    }
    if (this.isTimeUnavailable()?.(time) === true) {
      return { slottedTimeUnavailable: { actual: time } };
    }
    return null;
  }

  /** Puts focus on the first segment, which is where typing starts. */
  focus() {
    const first = this.fields()[0];
    if (first !== undefined) this.focusField(first);
  }

  /**
   * Where a press on the frame puts the reader: the first field still waiting
   * for a value, and the first field of the time when none is. Every text
   * control on the page answers a press anywhere inside its border.
   */
  focusEntry() {
    const held = this.segments();
    const empty = this.fields().find((name) => held[name] === null);
    const target = empty ?? this.fields()[0];
    if (target !== undefined) this.focusField(target);
  }

  protected onRootMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-part="segment"], button, a, input, select, textarea') != null) {
      return;
    }
    event.preventDefault();
    if (this.expression() === null) this.focusEntry();
  }

  /**
   * Safari does not focus a `div` on a press even when it carries a
   * `tabindex`, so the press says so itself rather than relying on it.
   */
  protected onSegmentMouseDown(event: MouseEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).focus();
  }

  /** Empties every segment, with the `clear` reason. */
  clear(source?: Event) {
    this.commit(EMPTY_SEGMENTS, 'clear', source);
    this.focus();
  }

  /* ── The keyboard ────────────────────────────────────────────────────── */

  /**
   * A key the field acted on is the field's, and nothing above it sees it. A
   * `div` with `role="spinbutton"` is invisible to every "is the target
   * editable" guard an application writes, and `preventDefault` alone does not
   * help: a shortcut handler reads the key, not the default.
   */
  private consume(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * The keys are handled on the host rather than on each segment, so a
   * consumer's own `(keydown)` on the same element still runs before the family
   * stops the event — which is the composition React gets by calling the
   * consumer's handler first.
   */
  protected onKeyDown(event: KeyboardEvent) {
    const segment = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-part="segment"]',
    );
    const name = segment?.dataset['field'] as TimeFieldName | undefined;
    if (name === undefined) return;

    /* An inline direction is a physical pair of keys and a logical order, so
       the arrow that walks forward is the one pointing along the writing
       direction rather than the one pointing right. */
    const rtl = getComputedStyle(this.element).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === forward) {
      this.consume(event);
      this.moveBy(name, 1);
      return;
    }
    if (event.key === backward) {
      this.consume(event);
      this.moveBy(name, -1);
      return;
    }

    if (!this.editable()) return;

    /**
     * `Alt` with an arrow is not this control's chord. `time-picker` opens its
     * panel with `Alt`+`ArrowDown`, and a segment that stepped on it would eat
     * the only shortcut the surface has.
     */
    if (event.altKey) return;

    if ((this.relative() ?? this.defaults.relative) && isRelativeKey(event.key)) {
      this.consume(event);
      this.expression.set(event.key);
      return;
    }

    const held = this.segments();
    const reference = this.reference();

    switch (event.key) {
      case 'ArrowUp':
        this.consume(event);
        this.commit(stepSegment(held, name, 1, reference), 'keyboard', event);
        return;
      case 'ArrowDown':
        this.consume(event);
        this.commit(stepSegment(held, name, -1, reference), 'keyboard', event);
        return;
      case 'PageUp':
        this.consume(event);
        this.commit(stepSegment(held, name, PAGE_STEP[name], reference), 'keyboard', event);
        return;
      case 'PageDown':
        this.consume(event);
        this.commit(stepSegment(held, name, -PAGE_STEP[name], reference), 'keyboard', event);
        return;
      case 'Home':
        this.consume(event);
        this.commit(boundSegment(held, name, 'min', reference), 'keyboard', event);
        return;
      case 'End':
        this.consume(event);
        this.commit(boundSegment(held, name, 'max', reference), 'keyboard', event);
        return;
      case 'Backspace':
      case 'Delete':
        this.consume(event);
        this.commit(clearSegment(held, name), 'clear', event);
        return;
      default:
        break;
    }

    /* The day period holds two words rather than digits, and the platform's own
       control takes it by the first letter of either. */
    if (name === 'dayPeriod' && /^\p{L}$/u.test(event.key)) {
      const typed = typeDayPeriod(held, event.key, this.format());
      if (typed === null) return;
      this.consume(event);
      this.commit(typed.segments, 'keyboard', event);
      if (typed.advance) this.moveBy(name, 1);
      return;
    }

    if (/^\d$/.test(event.key)) {
      this.consume(event);
      const typed = typeDigit(held, name, Number(event.key), this.format(), reference);
      this.commit(typed.segments, 'keyboard', event);
      if (typed.advance) this.moveBy(name, 1);
    }
  }

  protected onExpressionInput(event: Event) {
    this.expression.set((event.target as HTMLInputElement).value);
  }

  protected onExpressionKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      /* An expression inside a form must not submit it: `Enter` is this
         control's commit and nothing above it needs to hear the key. */
      this.consume(event);
      this.commitExpression(event);
      this.focus();
      return;
    }

    if (event.key === 'Escape') {
      /* Abandoned whole, and the segments come back exactly as they were. The
         key is stopped so an overlay above does not close on the same press —
         the field takes it first while an expression is open. */
      this.consume(event);
      this.expression.set(null);
      this.focus();
    }
  }

  /** Commits the expression when it resolves, and abandons it when it does not. */
  protected commitExpression(source?: Event) {
    const step = this.resolved();
    if (step === null) {
      this.expression.set(null);
      return;
    }
    this.commit(segmentsOfTime(step.time, this.format()), 'keyboard', source, step.days !== 0);
    this.expression.set(null);
  }

  /**
   * A whole time, pasted. The locale's shape is read first and ISO 8601 after
   * it; text that is neither but reads as a duration opens the expression, so
   * pasting `+40m` does what typing it does.
   */
  protected onPaste(event: ClipboardEvent) {
    if (!this.editable()) return;
    const text = event.clipboardData?.getData('text/plain') ?? '';

    const parsed = this.format().parse(text);
    if (parsed !== null) {
      event.preventDefault();
      this.commit(segmentsOfTime(parsed, this.format()), 'keyboard', event);
      return;
    }

    if ((this.relative() ?? this.defaults.relative) && parseDuration(text) !== null) {
      event.preventDefault();
      this.expression.set(text.trim());
    }
  }

  /** A run of typed digits ends when focus leaves. */
  protected onBlur() {
    this.activeField.set(undefined);
    this.onTouchedFn();
    const held = this.segments();
    if (held.typing === null) return;
    this.commit(commitTyping(held, this.format(), this.reference()), 'blur', undefined);
  }

  /* ── What the template reads ─────────────────────────────────────────── */

  protected valueOf(field: TimeFieldName): number | null {
    return this.segments()[field];
  }

  protected rangeOf(field: TimeFieldName) {
    return fieldRange(field, { hourCycle: this.format().hourCycle });
  }

  /**
   * What a reader hears instead of the number. The day period is why it is not
   * optional: `aria-valuenow` there is `0` or `1`, which is not a name in any
   * language.
   */
  protected spokenOf(field: TimeFieldName): string | null {
    const raw = this.segments()[field];
    if (raw === null) return null;
    if (field !== 'dayPeriod') return String(raw);
    return this.format().dayPeriodNames()[raw === 1 ? 1 : 0];
  }

  /**
   * What one field shows. A finished value is padded to the field's width so
   * the columns hold their place; a value still being typed is not, because a
   * padded run shows numbers nobody typed.
   */
  protected textOf(field: TimeFieldName): string {
    const held = this.segments();
    const raw = held[field];
    if (raw === null) {
      return this.format().pattern.find((part) => part.type === field)?.value ?? '';
    }

    const typing = held.typing;
    if (typing !== null && typing.field === field) {
      return String(raw).padStart(typing.digits, '0');
    }

    return this.format().formatValue(raw, field);
  }

  /** Exactly one segment is in the tab sequence, which is the roving model. */
  protected tabIndexOf(field: TimeFieldName): number {
    if (this.resolvedDisabled() === true) return -1;
    return field === (this.activeField() ?? this.fields()[0]) ? 0 : -1;
  }

  /* ── The machinery ───────────────────────────────────────────────────── */

  private focusField(name: TimeFieldName) {
    this.activeField.set(name);
    this.element.querySelector<HTMLElement>(`[data-part="segment"][data-field="${name}"]`)?.focus();
  }

  private moveBy(name: TimeFieldName, step: number) {
    const next = this.fields()[this.fields().indexOf(name) + step];
    if (next !== undefined) this.focusField(next);
  }

  /**
   * Moves the segments, and asks before the derived value moves with them.
   *
   * A run of typed digits moves the display and not the value: typing `23` into
   * an hour passes through `2` on the way, and `2` is a time the arithmetic
   * accepts and nobody meant. The request is emitted when the run ends.
   */
  private commit(
    next: SegmentState,
    reason: ChangeReason,
    source: Event | undefined,
    crossesMidnight = false,
  ) {
    const previous = this.time();
    this.segments.set(next);
    if (next.typing !== null) return;

    const nextValue = timeOf(next, this.format());
    let cancelled = false;
    const state = createControllable<PlainTime | null>({
      controlled: undefined,
      initial: previous,
      equals: isSameTime,
      onRequest: (request) => {
        this.valueChange.emit({ ...request, crossesMidnight, segments: next });
        cancelled = request.cancelled;
      },
    });
    state.request(nextValue, reason, source);

    if (cancelled) return;
    this.onChangeFn(nextValue);
    this.onValidatorChangeFn();
  }
}
