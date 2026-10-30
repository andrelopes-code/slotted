import {
  boundSegment,
  clearSegment,
  commitTyping,
  createDateFormat,
  dateOf,
  EMPTY_SEGMENTS,
  fieldRange,
  isDateInRange,
  isSameDate,
  parseISOYearMonth,
  plainDate,
  segmentsOf,
  stepSegment,
  toISODate,
  toISOYearMonth,
  todayIn,
  typeDigit,
  yearMonthPattern,
} from '@slotted/core/date';
import type { DateFieldName, PlainDate, SegmentState } from '@slotted/core/date';
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
  numberAttribute,
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
  dateFieldMessages,
  type DateFieldMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { SlField } from '@slotted/angular/field';

import { injectDateFieldDefaults } from './date-field-defaults';
import type { DateFieldCalendar, DateFieldSize, DateFieldVariant } from './date-field-defaults';

/**
 * How far `PageUp` and `PageDown` move each field.
 *
 * Five is the APG spin-button example's step, adopted for the day and the
 * month. The year departs: five years is not a page of years, and ten is the
 * step the calendar's own year view pages by, so the two agree. The cost is
 * written in `specs/components/date-field/contract.json` under `departures`.
 */
const PAGE_STEP: Record<DateFieldName, number> = { day: 5, month: 5, year: 10 };

/**
 * The hidden element carrying the whole date needs an identifier the group can
 * point `aria-labelledby` at, and Angular has no `useId`. A module counter is
 * what the framework leaves: it is stable for a given render order, which is
 * what hydration needs, and it never reaches the public surface.
 */
let sequence = 0;

/** What a request carries beyond the value. */
export interface DateFieldChangeRequest extends ChangeRequest<PlainDate | null> {
  readonly segments: SegmentState;
}

/**
 * A segmented date control: one spin button per field, in the order the locale
 * writes them.
 *
 * **The frame is not the control.** The element carrying `data-ui` is the
 * consumer's own box with no role; `role="group"` is on the row of segments,
 * which is what the APG's spin-button example names as the thing that tells a
 * screen-reader user that three buttons are one date.
 *
 * **Angular renders the segments and React renders the segments.** The two
 * bindings share the arithmetic in `@slotted/core/date` and nothing else: this
 * one is a component with a template and a `ControlValueAccessor`, because a
 * date belongs in a Reactive Form and Angular has the integration point for it.
 * It also implements `Validator`, which React has no equivalent of and which is
 * the asymmetry `references/frameworks.md` asks to be recorded rather than
 * levelled away — `min`, `max` and `isDateUnavailable` are validity this
 * control owns and no other validator can see.
 *
 * **The segments are the state and the value is derived.** A date with a day
 * and a month and no year is not a date, so the value is `null` — and that is
 * not the same as an empty field. The request carries the segments so a
 * consumer can tell them apart.
 */
@Component({
  selector: '[slDateField]',
  standalone: true,
  exportAs: 'slDateField',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content select="[slDateFieldStart]" />
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
      @for (part of pattern(); track $index) {
        @if (part.type === 'literal') {
          <span data-part="literal" data-part-literal="" aria-hidden="true">{{ part.value }}</span>
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
    <span data-part="value-text" data-part-value-text="" hidden [attr.id]="valueTextId">{{
      spokenDate()
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
    <ng-content select="[slDateFieldEnd]" />
    <input
      data-part="hidden-input"
      data-part-hidden-input=""
      type="hidden"
      readonly
      [attr.name]="name()"
      [value]="iso()"
    />`,
  styleUrl: '../../../styles/src/date-field/date-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDateField), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateField), multi: true },
  ],
  host: {
    'data-ui': 'date-field',
    'data-ui-date-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '(mousedown)': 'onRootMouseDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDateField implements ControlValueAccessor, Validator, OnInit {
  /** Present means the consumer owns the value. */
  readonly value = input<PlainDate | null | undefined>(undefined);
  /** The value the control starts from when nobody else writes one. */
  readonly defaultValue = input<PlainDate | null | undefined>(undefined);

  /**
   * What the control holds: a day, or a month of a year. Under `month` the
   * field shows the month and the year segments in the locale's order, its
   * value is the first day of that month, and the hidden input submits
   * `YYYY-MM`. Defaults to `day`.
   */
  readonly granularity = input<'day' | 'month' | undefined>(undefined);

  /** The earliest date the control accepts. Also a form validity rule. */
  readonly min = input<PlainDate | undefined>(undefined);
  /** The latest date the control accepts. Also a form validity rule. */
  readonly max = input<PlainDate | undefined>(undefined);
  /** Refuses particular dates — a weekend, a holiday, a booked day. */
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);

  /**
   * BCP 47. Decides the field order, the separators and the placeholder.
   * Unset, the language in force decides.
   */
  readonly locale = input<string | undefined>(undefined);
  /** Which zone answers "what is today", and nothing else. */
  readonly timeZone = input<string | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly yearPivot = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly calendar = input<DateFieldCalendar | undefined>(undefined);

  readonly size = input<DateFieldSize | undefined>(undefined);
  readonly variant = input<DateFieldVariant | undefined>(undefined);

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
  /** Words laid over the catalog of the language in force, key by key: the clear button's name. */
  readonly messages = input<PartialMessages<DateFieldMessages> | undefined>(undefined);
  /** The name a plain form post carries the ISO string under. */
  readonly name = input<string | undefined>(undefined);
  /**
   * The accessible name, when it is bound rather than written: a static
   * `aria-label` is read once from the host, and a family naming this field
   * from its own input — `date-range-picker` names its two ends — has no
   * static attribute to write.
   */
  readonly label = input<string | undefined>(undefined);
  /**
   * The group's identifier, when it is bound rather than written: a family
   * holding two of these inside one field — `date-range-picker` — gives each
   * its own, where both would otherwise take the field's.
   */
  readonly groupId = input<string | undefined>(undefined);

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the segments, the reason, the originating event and `cancel()`. There is no
   * `[(value)]`, because a two-way binding has one slot and can carry none of
   * those; a form gets the same movement through `ControlValueAccessor`.
   */
  readonly valueChange = output<DateFieldChangeRequest>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDateFieldDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(dateFieldMessages, this.messages);
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

  /** The whole date in words, for the group's own accessible name. */
  protected readonly valueTextId = `sl-date-field-${String((sequence += 1))}`;

  private readonly segments = signal<SegmentState>(EMPTY_SEGMENTS);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /**
   * Which day it is, resolved after construction rather than during it, so a
   * server and a browser in different zones never disagree about the markup.
   * Nothing is drawn from it: it is the date an empty segment steps to.
   */
  private readonly reference = signal<PlainDate>(plainDate(2000, 1, 1));
  protected readonly activeField = signal<DateFieldName | undefined>(undefined);

  private onChangeFn: (value: PlainDate | null) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly format = computed(() =>
    createDateFormat({
      locale: this.locale() ?? this.appLocale(),
      firstDayOfWeek: this.firstDayOfWeek() ?? this.defaults.firstDayOfWeek,
      yearPivot: this.yearPivot() ?? this.defaults.yearPivot,
    }),
  );

  /** A field that holds a month draws the locale's pattern without its day. */
  protected readonly monthly = computed(() => this.granularity() === 'month');
  protected readonly pattern = computed(() =>
    this.monthly() ? yearMonthPattern(this.format().pattern) : this.format().pattern,
  );

  protected readonly fields = computed(() =>
    this.pattern()
      .filter((part) => part.type !== 'literal')
      .map((part) => part.type as DateFieldName),
  );

  /** The date the segments make, or `null` while any of them is unfilled. */
  readonly date = computed(() => dateOf(this.segments()));
  protected readonly iso = computed(() => {
    const date = this.date();
    if (date === null) return '';
    return this.monthly()
      ? toISOYearMonth({ year: date.year, month: date.month })
      : toISODate(date);
  });
  protected readonly spokenDate = computed(() => {
    const date = this.date();
    if (date === null) return '';
    return this.monthly() ? this.format().monthYear(date) : this.format().describe(date);
  });

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedRequired = computed(() => this.required() ?? this.field?.required());

  /**
   * Validity the family owns, beside the validity the consumer states. A date
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  readonly resolvedInvalid = computed(() => {
    const date = this.date();
    if (date !== null && !isDateInRange(date, this.min(), this.max())) return true;
    if (date !== null && this.isDateUnavailable()?.(date) === true) return true;
    return this.invalid() ?? this.field?.invalid();
  });

  protected readonly controlId = computed(
    () => this.groupId() ?? this.writtenId ?? this.field?.ids().control ?? null,
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
    if (!this.clearable() || !this.editable()) return false;
    const held = this.segments();
    return this.fields().some((name) => held[name] !== null);
  });

  /**
   * Angular creates a component before it binds any input, so the starting
   * value is read here rather than in the constructor: read there, both
   * `value` and `defaultValue` are `undefined` and the control starts empty.
   */
  constructor() {
    /**
     * A consumer's own value writes the segments, and only when it names a
     * different date: written on every change detection it would throw away a
     * half-typed date on the keystroke that completes a different one.
     *
     * Without it a controlled `[value]` only ever reached the control once, in
     * `ngOnInit` — which is what the first run of `date-picker`'s spec showed
     * as a field still holding the ninth after the calendar had chosen the
     * seventeenth.
     */
    effect(() => {
      const next = this.value();
      if (next === undefined) return;
      const segments = this.segments();
      /* A run of digits still being typed is not a value the consumer refused;
         the guard `time-field` records, taken here for the same reason. */
      if (segments.typing !== null) return;
      if (isSameDate(dateOf(segments), next)) return;
      this.segments.set(segmentsOf(next));
    });
  }

  ngOnInit() {
    this.segments.set(segmentsOf(this.value() ?? this.defaultValue() ?? null));
    this.reference.set(todayIn(this.timeZone() ?? this.defaults.timeZone));
  }

  /* ── The value ───────────────────────────────────────────────────────── */

  writeValue(value: PlainDate | null | undefined) {
    this.segments.set(segmentsOf(value ?? null));
  }

  registerOnChange(fn: (value: PlainDate | null) => void) {
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
    const date = control.value as PlainDate | null;
    if (date === null || date === undefined) return null;

    const min = this.min();
    const max = this.max();
    if (!isDateInRange(date, min, max)) {
      return { slottedDateRange: { min, max, actual: date } };
    }
    if (this.isDateUnavailable()?.(date) === true) {
      return { slottedDateUnavailable: { actual: date } };
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
   * for a value, and the first field of the date when none is.
   *
   * A press that landed on the frame's own padding, on the gap between two
   * fields or on an adornment did nothing at all — the reader saw a control
   * that looked like a text field and answered like a picture. Every text
   * control on the page answers a press anywhere inside its border, and this
   * one has to as well.
   */
  focusEntry() {
    const held = this.segments();
    const empty = this.fields().find((name) => held[name] === null);
    const target = empty ?? this.fields()[0];
    if (target !== undefined) this.focusField(target);
  }

  /**
   * A press inside the frame that landed on nothing of its own. The default is
   * prevented so the press does not immediately blur the field it just gave
   * focus to, which is what a `mousedown` on a non-focusable box would do.
   */
  protected onRootMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-part="segment"], button, a, input, select, textarea') != null) {
      return;
    }
    event.preventDefault();
    this.focusEntry();
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
   * A key the field acted on is the field's, and nothing above it sees it.
   *
   * Every application that binds a bare key guards it with "is the target an
   * editable element", and that guard tests for `input`, `textarea` and
   * `contenteditable`. A `div` with `role="spinbutton"` is none of the three,
   * so a reader typing a date into this control fires every single-key
   * shortcut on the page: in Storybook, pressing `1` moved focus out of the
   * story and into the sidebar, and the date could not be typed at all.
   *
   * `preventDefault` alone does not help — a shortcut handler reads the key,
   * not the default. The event has to stop.
   */
  private consume(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * The keys are handled on the host rather than on each segment, so a
   * consumer's own `(keydown)` on the same element still runs before the
   * family stops the event — which is the composition React gets by calling
   * the consumer's handler first.
   */
  protected onKeyDown(event: KeyboardEvent) {
    const segment = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-part="segment"]',
    );
    const name = segment?.dataset['field'] as DateFieldName | undefined;
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
     * `Alt` with an arrow is not this control's chord. `date-picker` opens its
     * calendar with `Alt`+`ArrowDown`, and a segment that stepped on it would
     * eat the only shortcut the surface has.
     */
    if (event.altKey) return;

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

    if (/^\d$/.test(event.key)) {
      this.consume(event);
      const typed = typeDigit(held, name, Number(event.key), this.format(), reference);
      this.commit(typed.segments, 'keyboard', event);
      if (typed.advance) this.moveBy(name, 1);
    }
  }

  /**
   * A whole date, pasted. The locale's shape is read first and ISO 8601 after
   * it, so `12/03/2026` is December to an American and March to a Brazilian
   * while `2026-09-09` is the ninth to both.
   */
  protected onPaste(event: ClipboardEvent) {
    if (!this.editable()) return;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    const month = this.monthly() ? parseISOYearMonth(text) : null;
    const parsed =
      month === null ? this.format().parse(text) : plainDate(month.year, month.month, 1);
    if (parsed === null) return;
    event.preventDefault();
    this.commit(segmentsOf(parsed), 'keyboard', event);
  }

  /** A run of typed digits ends when focus leaves, and a short year resolves. */
  protected onBlur() {
    this.activeField.set(undefined);
    this.onTouchedFn();
    const held = this.segments();
    if (held.typing === null) return;
    this.commit(commitTyping(held, this.format(), this.reference()), 'blur', undefined);
  }

  /* ── What the template reads ─────────────────────────────────────────── */

  protected valueOf(field: DateFieldName): number | null {
    return this.segments()[field];
  }

  protected rangeOf(field: DateFieldName) {
    const held = this.segments();
    const reference = this.reference();
    return fieldRange(field, {
      year: held.year ?? reference.year,
      month: held.month ?? reference.month,
    });
  }

  /** What a reader hears instead of the number: a month says its own name. */
  protected spokenOf(field: DateFieldName): string | null {
    const raw = this.segments()[field];
    if (raw === null) return null;
    if (field !== 'month') return String(raw);
    return this.format().monthNames('long')[raw - 1] ?? String(raw);
  }

  /**
   * What one field shows.
   *
   * A finished value is padded to the field's width, so the three columns hold
   * their place: `9` and `09` occupy the same box and the separators never step
   * sideways. A value still being typed is **not** padded — it is the digits
   * the reader has put in, in the order they put them. Padded, a year on its
   * way to 2026 read `0002`, then `0020`, then `0202`, which is three numbers
   * nobody typed.
   */
  protected textOf(field: DateFieldName): string {
    const held = this.segments();
    const raw = held[field];
    if (raw === null) {
      return this.format().pattern.find((part) => part.type === field)?.value ?? '';
    }

    const typing = held.typing;
    if (typing !== null && typing.field === field) {
      return String(raw).padStart(typing.digits, '0');
    }

    const reference = this.reference();
    return this.format().formatField(
      {
        year: held.year ?? reference.year,
        month: held.month ?? reference.month,
        day: held.day ?? reference.day,
      },
      field,
    );
  }

  /** Exactly one segment is in the tab sequence, which is the roving model. */
  protected tabIndexOf(field: DateFieldName): number {
    if (this.resolvedDisabled() === true) return -1;
    return field === (this.activeField() ?? this.fields()[0]) ? 0 : -1;
  }

  /* ── The machinery ───────────────────────────────────────────────────── */

  private focusField(name: DateFieldName) {
    this.activeField.set(name);
    this.element.querySelector<HTMLElement>(`[data-part="segment"][data-field="${name}"]`)?.focus();
  }

  private moveBy(name: DateFieldName, step: number) {
    const next = this.fields()[this.fields().indexOf(name) + step];
    if (next !== undefined) this.focusField(next);
  }

  /**
   * Moves the segments, and asks before the derived value moves with them.
   *
   * A run of typed digits moves the display and not the value: typing `2026`
   * into a year passes through 2, 20 and 202 on the way, and a request per
   * digit would ask a consumer's server about the year 2. The request is
   * emitted when the run ends.
   */
  private commit(given: SegmentState, reason: ChangeReason, source: Event | undefined) {
    /* A month has no day segment to fill, so the day is the first of it. */
    const next = this.monthly() && given.day !== 1 ? { ...given, day: 1, intendedDay: 1 } : given;
    const previous = this.date();
    this.segments.set(next);
    if (next.typing !== null) return;

    const nextValue = dateOf(next);
    let cancelled = false;
    const state = createControllable<PlainDate | null>({
      controlled: undefined,
      initial: previous,
      equals: isSameDate,
      onRequest: (request) => {
        this.valueChange.emit({ ...request, segments: next });
        cancelled = request.cancelled;
      },
    });
    state.request(nextValue, reason, source);

    if (cancelled) return;
    this.onChangeFn(nextValue);
    this.onValidatorChangeFn();
  }
}
