import {
  boundSegment,
  clearSegment,
  commitTyping,
  createDateTimeFormat,
  DATE_TIME_UNITS,
  dateTimeOf,
  dayWindow,
  EMPTY_SEGMENTS,
  fieldRange,
  halfOfField,
  incompleteHalf,
  isDateTimeInRange,
  isRelativeKey,
  isSameDateTime,
  isTimeInRange,
  nowDateTimeIn,
  parseDuration,
  resolveRelativeDateTime,
  segmentsOfDateTime,
  stepSegment,
  toISODateTime,
  typeDayPeriod,
  typeDigit,
} from '@slotted/core/date';
import type {
  DateTimeHalf,
  DateTimePatternPart,
  PlainDate,
  PlainDateTime,
  PlainTime,
  SegmentFieldName,
  SegmentReference,
  SegmentState,
  TimeGranularity,
} from '@slotted/core/date';
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
import {
  datetimeFieldMessages,
  type DatetimeFieldMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { SlField } from '@slotted/angular/field';

import { injectDateTimeFieldDefaults } from './datetime-field-defaults';
import type {
  DateTimeFieldHourCycle,
  DateTimeFieldSize,
  DateTimeFieldVariant,
} from './datetime-field-defaults';

/**
 * How far `PageUp` and `PageDown` move each field.
 *
 * Each half pages the way its own family already pages: year 10, month 5 and
 * day 5 from `date-field`, hour 3, minute 15, second 15 and day period 1 from
 * `time-field`. Two fields drawing the same segment and paging it differently
 * would be one behaviour with two answers.
 */
const PAGE_STEP: Record<SegmentFieldName, number> = {
  year: 10,
  month: 5,
  day: 5,
  hour: 3,
  minute: 15,
  second: 15,
  dayPeriod: 1,
};

/**
 * The hidden element carrying the whole value needs an identifier the group can
 * point `aria-labelledby` at, and Angular has no `useId`. A module counter is
 * what the framework leaves: stable for a given render order, which is what
 * hydration needs, and never on the public surface.
 */
let sequence = 0;

/**
 * What a request carries beyond the value: the segments, so a half-written
 * value can be saved, and which half is still missing.
 *
 * There is no `crossesMidnight` here. `time-field` raises that flag because a
 * `PlainTime` has no day to put a crossing in, and names this family as the
 * consumer that would answer it — here the day exists, so the crossing is
 * already in the value.
 */
export interface DateTimeFieldChangeRequest extends ChangeRequest<PlainDateTime | null> {
  readonly segments: SegmentState;
  readonly incomplete: DateTimeHalf | null;
}

/**
 * A segmented datetime control: one spin button per field, in the order the
 * locale writes them, with all seven fields in one row.
 *
 * **It is not a `slDateField` beside a `slTimeField`.** Two nested family roots
 * would be two groups, two values and two `SegmentState`s. The order of the
 * halves and the literal between them come from one combined
 * `Intl.DateTimeFormat` that neither of them can see, and a digit that fills
 * the last date segment advances across the boundary into the first time
 * segment — which two roots cannot do.
 *
 * **Angular is a component with a template and a `ControlValueAccessor`**,
 * because a datetime belongs in a Reactive Form and Angular has the integration
 * point for it. It also implements `Validator`, and it reports five rules where
 * Kendo — the only surveyed implementation that validates at all — reports
 * three: `dateTimeParse`, `dateTimeIncomplete`, `dateTimeMin`, `dateTimeMax`
 * and `dateTimeUnavailable`.
 *
 * **The missing half is said out loud**, on the root, on the request and in the
 * validator. Every surveyed implementation reports an empty control and loses
 * what was written.
 */
@Component({
  selector: '[slDateTimeField]',
  standalone: true,
  exportAs: 'slDateTimeField',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content select="[slDateTimeFieldStart]" />
    @if (expression() !== null) {
      <input
        #duration
        data-part="duration"
        data-part-duration=""
        type="text"
        placeholder="+40m, 1h30, +2d"
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
        [attr.data-rolls-day]="rollsDay() ? '' : null"
      >
        <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
        @if (rollsDay()) {
          <span data-part="preview-date" data-part-preview-date="">{{ previewDate() }}</span
          >, {{ previewTime() }}
        } @else {
          {{ previewTime() }}
        }
      </span>
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
        @for (group of halves(); track group.half) {
          <span data-part="half" data-part-half="" [attr.data-half]="group.half">
            @for (part of group.parts; track $index) {
              @if (part.type === 'literal') {
                @if (part.boundary !== true || part.drawn !== false) {
                  <span
                    data-part="literal"
                    data-part-literal=""
                    aria-hidden="true"
                    [attr.data-boundary]="part.boundary === true ? '' : null"
                    >{{ part.value }}</span
                  >
                }
              } @else {
                <div
                  data-part="segment"
                  data-part-segment=""
                  role="spinbutton"
                  [attr.data-field]="part.type"
                  [attr.data-half]="halfOf(part.type)"
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
          </span>
        }
      </div>
    }
    <span data-part="value-text" data-part-value-text="" hidden [attr.id]="valueTextId">{{
      spokenValue()
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
    <ng-content select="[slDateTimeFieldEnd]" />
    <input
      data-part="hidden-input"
      data-part-hidden-input=""
      type="hidden"
      readonly
      [attr.name]="name()"
      [value]="iso()"
    />`,
  styleUrl: '../../../styles/src/datetime-field/datetime-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDateTimeField), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateTimeField), multi: true },
  ],
  host: {
    'data-ui': 'datetime-field',
    'data-ui-datetime-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '(mousedown)': 'onRootMouseDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-cycle]': 'dataCycle()',
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-incomplete]': 'incomplete()',
    '[attr.data-relative]': "expression() === null ? null : ''",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDateTimeField implements ControlValueAccessor, Validator, OnInit {
  /** Present means the consumer owns the value. */
  readonly value = input<PlainDateTime | null | undefined>(undefined);
  /** The value the control starts from when nobody else writes one. */
  readonly defaultValue = input<PlainDateTime | null | undefined>(undefined);

  /** The earliest whole value: where the range starts. Also a form rule. */
  readonly min = input<PlainDateTime | undefined>(undefined);
  /** The latest whole value: where the range ends. Also a form rule. */
  readonly max = input<PlainDateTime | undefined>(undefined);
  /**
   * The earliest time of **every** day inside the range.
   *
   * It applies beside `min` rather than instead of it, which MUI's own
   * validation page records that it cannot do.
   */
  readonly minTime = input<PlainTime | undefined>(undefined);
  /** The latest time of every day inside the range, beside `max`. */
  readonly maxTime = input<PlainTime | undefined>(undefined);
  /** Refuses particular days — a holiday, a closed shop, a booked room. */
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);
  /**
   * Refuses particular times on a particular day. Two predicates rather than
   * one, because a day-level answer cannot be derived from a datetime-level
   * predicate without probing every step of that day.
   */
  readonly isTimeUnavailable = input<((time: PlainTime, date: PlainDate) => boolean) | undefined>(
    undefined,
  );

  /**
   * BCP 47. Decides the field order, the separators and the placeholder.
   * Unset, the language in force decides.
   */
  readonly locale = input<string | undefined>(undefined);
  /** Which zone answers "what is the time now", and nothing else. */
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<DateTimeFieldHourCycle | undefined>(undefined);
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  readonly calendar = input<'gregory' | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined>(undefined);
  readonly yearPivot = input<number | undefined>(undefined);
  /**
   * What an empty segment steps from, and what a duration resolves against.
   * Unset, both are the current datetime in `timeZone`.
   */
  readonly referenceDateTime = input<PlainDateTime | undefined>(undefined);

  readonly size = input<DateTimeFieldSize | undefined>(undefined);
  readonly variant = input<DateTimeFieldVariant | undefined>(undefined);

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

  /** Draws a button that empties both halves and returns focus to the control. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Whether `+`, `-` and `=` open the duration expression. */
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear button's name and the duration expression's name.
   */
  readonly messages = input<PartialMessages<DatetimeFieldMessages> | undefined>(undefined);
  /** The name a plain form post carries the ISO string under. */
  readonly name = input<string | undefined>(undefined);

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the segments, the half that is still missing, the reason, the originating
   * event and `cancel()`. There is no `[(value)]`, because a two-way binding
   * has one slot and can carry none of those.
   */
  /**
   * The accessible name, when it is bound rather than written: a static
   * `aria-label` is read once from the host, and a family naming this field
   * from its own input — `datetime-range-picker` names its two ends — has no
   * static attribute to write.
   */
  readonly label = input<string | undefined>(undefined);

  readonly valueChange = output<DateTimeFieldChangeRequest>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDateTimeFieldDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(datetimeFieldMessages, this.messages);
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

  protected readonly valueTextId = `sl-datetime-field-${String((sequence += 1))}`;

  private readonly segments = signal<SegmentState>(EMPTY_SEGMENTS);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /**
   * What datetime it is, resolved after construction rather than during it, so
   * a server and a browser never disagree about the markup. Nothing is drawn
   * from it: it is the value an empty segment steps to and a duration resolves
   * from.
   */
  private readonly clock = signal<PlainDateTime>({
    date: { year: 2000, month: 1, day: 1 },
    time: { hour: 12, minute: 0, second: 0 },
  });
  protected readonly activeField = signal<SegmentFieldName | undefined>(undefined);
  /** The duration being written, or `null` while the segments are showing. */
  protected readonly expression = signal<string | null>(null);

  private onChangeFn: (value: PlainDateTime | null) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);

  protected readonly format = computed(() => {
    const firstDayOfWeek = this.firstDayOfWeek() ?? this.defaults.firstDayOfWeek;
    const yearPivot = this.yearPivot() ?? this.defaults.yearPivot;
    return createDateTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.hourCycle() ?? this.defaults.hourCycle,
      locale: this.locale() ?? this.appLocale(),
      ...(firstDayOfWeek === undefined ? {} : { firstDayOfWeek }),
      ...(yearPivot === undefined ? {} : { yearPivot }),
    });
  });

  protected readonly dataCycle = computed(() => (this.format().usesDayPeriod ? '12' : '24'));

  protected readonly fields = computed(() =>
    this.format()
      .pattern.filter((part) => part.type !== 'literal')
      .map((part) => part.type as SegmentFieldName),
  );

  /**
   * One box per half, and the only place the row is allowed to break.
   *
   * Flexbox breaks a line between any two items and offers no way to forbid one
   * place, so the boundary has to be a box rather than a rule.
   */
  protected readonly halves = computed(() => {
    const groups: { half: DateTimeHalf; parts: DateTimePatternPart[] }[] = [];
    for (const part of this.format().pattern) {
      const owner = part.half ?? 'date';
      const last = groups[groups.length - 1];
      if (last !== undefined && last.half === owner) last.parts.push(part);
      else groups.push({ half: owner, parts: [part] });
    }
    return groups;
  });

  /** What an empty segment steps from, in the shape the engine reads. */
  private readonly reference = computed<SegmentReference>(() => {
    const anchor = this.anchor();
    const shown = this.format().toDisplay(anchor.time.hour);
    return {
      ...anchor.date,
      dayPeriod: shown.dayPeriod ?? 0,
      hour: shown.hour,
      hourCycle: this.format().hourCycle,
      minute: anchor.time.minute,
      second: anchor.time.second,
    };
  });

  private readonly anchor = computed(() => this.referenceDateTime() ?? this.clock());

  /** The value the segments make, or `null` while either half is unfinished. */
  readonly dateTime = computed(() => dateTimeOf(this.segments(), this.format()));
  /** Which half is still missing, and `null` when none is. */
  readonly incomplete = computed(() => incompleteHalf(this.segments(), this.format()));

  protected readonly iso = computed(() => {
    const value = this.dateTime();
    return value === null ? '' : toISODateTime(value);
  });
  protected readonly spokenValue = computed(() => {
    const value = this.dateTime();
    return value === null ? '' : this.format().describe(value);
  });

  /* ── The duration expression ─────────────────────────────────────────── */

  protected readonly resolved = computed(() => {
    const written = this.expression();
    if (written === null) return null;
    const seconds = parseDuration(written, { units: DATE_TIME_UNITS });
    return seconds === null ? null : resolveRelativeDateTime(this.anchor(), seconds);
  });

  /** Whether the expression landed on a different day from the anchor's. */
  protected readonly rollsDay = computed(() => {
    const step = this.resolved();
    if (step === null) return false;
    const from = this.anchor().date;
    return (
      step.date.year !== from.year || step.date.month !== from.month || step.date.day !== from.day
    );
  });

  protected readonly previewTime = computed(() => {
    const step = this.resolved();
    return step === null ? '' : this.format().time.format(step.time);
  });
  protected readonly previewDate = computed(() => {
    const step = this.resolved();
    return step === null ? '' : this.format().describeDate(step.date, 'short');
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
   * Validity the family owns, beside the validity the consumer states.
   *
   * Both pairs of bounds apply at once — the whole-value one and the window
   * that repeats on every day — which is the combination MUI's own validation
   * page records that it cannot ship.
   */
  readonly resolvedInvalid = computed(() => {
    const value = this.dateTime();
    if (value !== null && this.refuses(value)) return true;
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
     * different value: written on every change detection it would throw away a
     * half-typed value on the keystroke that completes a different one.
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
      if (isSameDateTime(dateTimeOf(segments, this.format()), next)) return;
      this.segments.set(segmentsOfDateTime(next, this.format()));
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
    this.segments.set(
      segmentsOfDateTime(this.value() ?? this.defaultValue() ?? null, this.format()),
    );
    this.clock.set(nowDateTimeIn(this.timeZone() ?? this.defaults.timeZone));
  }

  /* ── The value ───────────────────────────────────────────────────────── */

  writeValue(value: PlainDateTime | null | undefined) {
    this.segments.set(segmentsOfDateTime(value ?? null, this.format()));
  }

  registerOnChange(fn: (value: PlainDateTime | null) => void) {
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
   * The rules no other validator can see, and one no surveyed implementation
   * reports at all.
   *
   * `dateTimeIncomplete` is that one: a reader who wrote a day and left is not
   * an empty control, and a form that says "required" there is answering a
   * different question. `required` itself is left to Angular's own, because a
   * form already has a word for it and two would disagree.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value as PlainDateTime | null;

    if (value === null || value === undefined) {
      const half = this.incomplete();
      return half === null ? null : { slottedDateTimeIncomplete: { missing: half } };
    }

    const min = this.min();
    const max = this.max();
    if (!isDateTimeInRange(value, min, max)) {
      return { slottedDateTimeRange: { min, max, actual: value } };
    }

    const window = dayWindow(value.date, {
      max,
      maxTime: this.maxTime(),
      min,
      minTime: this.minTime(),
    });
    if (window === null || !isTimeInRange(value.time, window.earliest, window.latest)) {
      return { slottedDateTimeWindow: { actual: value } };
    }

    if (
      this.isDateUnavailable()?.(value.date) === true ||
      this.isTimeUnavailable()?.(value.time, value.date) === true
    ) {
      return { slottedDateTimeUnavailable: { actual: value } };
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
   * for a value, and the first field of the value when none is.
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

  /** Empties both halves at once, with the `clear` reason. */
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
    const name = segment?.dataset['field'] as SegmentFieldName | undefined;
    if (name === undefined) return;

    /* An inline direction is a physical pair of keys and a logical order, so
       the arrow that walks forward is the one pointing along the writing
       direction rather than the one pointing right. It walks the whole row,
       across the boundary between the halves. */
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
     * `Alt` with an arrow is not this control's chord. `datetime-picker` opens
     * its panel with `Alt`+`ArrowDown`, and a segment that stepped on it would
     * eat the only shortcut the surface has.
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
      const typed = typeDayPeriod(held, event.key, this.format().time);
      if (typed === null) return;
      this.consume(event);
      this.commit(typed.segments, 'keyboard', event);
      if (typed.advance) this.moveBy(name, 1);
      return;
    }

    if (/^\d$/.test(event.key)) {
      this.consume(event);
      const typed = typeDigit(held, name, Number(event.key), this.format().time, reference);
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
         the field takes it first while an expression is open, which is the
         staging `datetime-picker` depends on. */
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
    this.commit(segmentsOfDateTime(step, this.format()), 'keyboard', source);
    this.expression.set(null);
  }

  /**
   * A whole value, pasted. The locale's shape is read first and ISO 8601 after
   * it; text that is neither but reads as a duration opens the expression, so
   * pasting `+2d` does what typing it does.
   */
  protected onPaste(event: ClipboardEvent) {
    if (!this.editable()) return;
    const text = event.clipboardData?.getData('text/plain') ?? '';

    const parsed = this.format().parse(text);
    if (parsed !== null) {
      event.preventDefault();
      this.commit(segmentsOfDateTime(parsed, this.format()), 'keyboard', event);
      return;
    }

    if (
      (this.relative() ?? this.defaults.relative) &&
      parseDuration(text, { units: DATE_TIME_UNITS }) !== null
    ) {
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
    this.commit(commitTyping(held, this.format().time, this.reference()), 'blur', undefined);
  }

  /* ── What the template reads ─────────────────────────────────────────── */

  protected halfOf(field: SegmentFieldName): DateTimeHalf {
    return halfOfField(field);
  }

  protected valueOf(field: SegmentFieldName): number | null {
    return this.segments()[field];
  }

  /**
   * The day's own maximum is the month's, which is why the range is asked with
   * the year and the month rather than assumed to be 31.
   */
  protected rangeOf(field: SegmentFieldName) {
    const held = this.segments();
    return fieldRange(field, {
      hourCycle: this.format().hourCycle,
      ...(held.month === null ? {} : { month: held.month }),
      ...(held.year === null ? {} : { year: held.year }),
    });
  }

  /**
   * What a reader hears instead of the number. The day period is why it is not
   * optional: `aria-valuenow` there is `0` or `1`, which is not a name in any
   * language — and a month reads better as its own name than as a number.
   */
  protected spokenOf(field: SegmentFieldName): string | null {
    const raw = this.segments()[field];
    if (raw === null) return null;
    if (field === 'dayPeriod') return this.format().dayPeriodNames()[raw === 1 ? 1 : 0];
    if (field === 'month') return this.format().date.monthNames('long')[raw - 1] ?? String(raw);
    return String(raw);
  }

  /**
   * What one field shows. A finished value is padded to the field's width so
   * the columns hold their place; a value still being typed is not, because a
   * padded run shows numbers nobody typed.
   */
  protected textOf(field: SegmentFieldName): string {
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
  protected tabIndexOf(field: SegmentFieldName): number {
    if (this.resolvedDisabled() === true) return -1;
    return field === (this.activeField() ?? this.fields()[0]) ? 0 : -1;
  }

  /* ── The machinery ───────────────────────────────────────────────────── */

  /** Whether both pairs of bounds, or either predicate, refuse a whole value. */
  private refuses(value: PlainDateTime): boolean {
    const min = this.min();
    const max = this.max();
    if (!isDateTimeInRange(value, min, max)) return true;

    const window = dayWindow(value.date, {
      max,
      maxTime: this.maxTime(),
      min,
      minTime: this.minTime(),
    });
    if (window === null || !isTimeInRange(value.time, window.earliest, window.latest)) return true;

    return (
      this.isDateUnavailable()?.(value.date) === true ||
      this.isTimeUnavailable()?.(value.time, value.date) === true
    );
  }

  private focusField(name: SegmentFieldName) {
    this.activeField.set(name);
    this.element.querySelector<HTMLElement>(`[data-part="segment"][data-field="${name}"]`)?.focus();
  }

  private moveBy(name: SegmentFieldName, step: number) {
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
  private commit(next: SegmentState, reason: ChangeReason, source: Event | undefined) {
    const previous = this.dateTime();
    this.segments.set(next);
    if (next.typing !== null) return;

    const nextValue = dateTimeOf(next, this.format());
    let cancelled = false;
    const state = createControllable<PlainDateTime | null>({
      controlled: undefined,
      initial: previous,
      equals: isSameDateTime,
      onRequest: (request) => {
        this.valueChange.emit({
          ...request,
          incomplete: incompleteHalf(next, this.format()),
          segments: next,
        });
        cancelled = request.cancelled;
      },
    });
    state.request(nextValue, reason, source);

    if (cancelled) return;
    this.onChangeFn(nextValue);
    this.onValidatorChangeFn();
  }
}
