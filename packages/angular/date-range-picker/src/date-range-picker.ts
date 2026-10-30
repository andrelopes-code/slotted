import {
  blockedAround,
  compareDate,
  createDateFormat,
  isDateRefusedInRun,
  isSameDate,
  orderedRun,
  rangeLength,
  rangeProblems,
} from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { tabbables } from '@slotted/core/focus';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  dateRangePickerMessages,
  type DateRangePickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { SlCalendar, isSameValue } from '@slotted/angular/calendar';
import type { CalendarValue, CalendarView, DateRange } from '@slotted/angular/calendar';
import { SlDateField } from '@slotted/angular/date-field';
import { SlField } from '@slotted/angular/field';

import { injectDateRangePickerDefaults } from './date-range-picker-defaults';
import type {
  DateRangePickerCalendar,
  DateRangePickerCloseOnSelect,
  DateRangePickerCount,
  DateRangePickerPlacement,
  DateRangePickerPosition,
  DateRangePickerSize,
  DateRangePickerVariant,
} from './date-range-picker-defaults';

/** The reasons the contract's `stateModel.open` lists, and no other. */
type OpenReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select'
>;

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * The query is here as well as in the stylesheet because the DOM has to say
 * which presentation it is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';
/** How far `contiguous` looks for an unavailable day when no `maxLength` bounds it. */
const CONTIGUOUS_SEARCH = 366;
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

/** The one word for nothing: a value whose both ends are `null` is `null`. */
function normalize(range: DateRange | null | undefined): DateRange | null {
  return range === null || range === undefined || (range.start === null && range.end === null)
    ? null
    : range;
}

/**
 * Two date fields in one frame, a trigger, and `calendar` in range mode behind
 * them.
 *
 * **It composes the three and redraws none of them.** The two fields keep their
 * `data-ui` and so does the calendar; this family owns the frame, the trigger,
 * the layer, and the band that says what the reader has so far.
 *
 * **The band says how long the run is while it is being drawn.** The calendar
 * reports the pending end — the day under the pointer, or the focused day —
 * and `length` says "4 nights" for it, in a live region.
 *
 * **A press that leaves the run with one end is a draft, not the value.** The
 * second press emits the whole run; `Escape`, an outside press and the trigger
 * abandon the draft and the previous value stands.
 */
@Component({
  selector: '[slDateRangePicker]',
  standalone: true,
  exportAs: 'slDateRangePicker',
  imports: [SlCalendar, SlDateField, SlGlyph, SlIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDateRangePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateRangePicker), multi: true },
  ],
  template: `<div
      data-part="control"
      data-part-control=""
      [attr.role]="enclosing === null ? null : 'group'"
      [attr.id]="enclosing?.ids()?.control ?? null"
      [attr.aria-labelledby]="enclosing?.ids()?.label ?? null"
      (keydown)="onControlKeyDown($event)"
      (pointerdown)="pointerFocus = true"
      (focusout)="onControlFocusOut($event)"
    >
      <div
        data-part="start"
        data-part-start=""
        [attr.data-current]="currentPosition() === 'start' ? '' : null"
        (focusin)="onFieldFocus('start', $event)"
      >
        <div
          slDateField
          #startField="slDateField"
          variant="plain"
          [label]="t('start')"
          [groupId]="contentId + '-start'"
          [locale]="resolvedLocale()"
          [timeZone]="resolvedTimeZone()"
          [firstDayOfWeek]="firstDayOfWeek()"
          [yearPivot]="yearPivot()"
          [calendar]="resolvedCalendar()"
          [size]="resolvedSize()"
          [min]="min()"
          [max]="startMax()"
          [isDateUnavailable]="isDateUnavailable()"
          [name]="startName()"
          [disabled]="resolvedDisabled()"
          [readOnly]="resolvedReadOnly()"
          [required]="resolvedRequired()"
          [value]="start()"
          (valueChange)="onFieldValue('start', $event)"
        ></div>
      </div>
      <span data-part="separator" data-part-separator="" aria-hidden="true">–</span>
      <div
        data-part="end"
        data-part-end=""
        [attr.data-current]="currentPosition() === 'end' ? '' : null"
        (focusin)="onFieldFocus('end', $event)"
      >
        <div
          slDateField
          #endField="slDateField"
          variant="plain"
          [label]="t('end')"
          [groupId]="contentId + '-end'"
          [locale]="resolvedLocale()"
          [timeZone]="resolvedTimeZone()"
          [firstDayOfWeek]="firstDayOfWeek()"
          [yearPivot]="yearPivot()"
          [calendar]="resolvedCalendar()"
          [size]="resolvedSize()"
          [min]="endMin()"
          [max]="max()"
          [isDateUnavailable]="isDateUnavailable()"
          [invalid]="reversed() ? true : undefined"
          [name]="endName()"
          [disabled]="resolvedDisabled()"
          [readOnly]="resolvedReadOnly()"
          [required]="resolvedRequired()"
          [value]="end()"
          (valueChange)="onFieldValue('end', $event)"
        ></div>
      </div>
      @if (clearable() && held() !== null) {
        <button
          data-part="clear"
          data-part-clear=""
          type="button"
          [attr.aria-label]="t('clear')"
          [disabled]="!editable()"
          (click)="clear($event)"
        >
          <span slIcon><svg slGlyph name="x"></svg></span>
        </button>
      }
      <button
        #trigger
        data-part="trigger"
        data-part-trigger=""
        type="button"
        aria-haspopup="dialog"
        [attr.aria-label]="triggerLabel()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="isOpen() ? contentId : null"
        [disabled]="!editable()"
        (click)="toggle($event)"
      >
        <span slIcon><svg slGlyph name="calendar"></svg></span>
      </button>
    </div>

    @if (isOpen()) {
      <div
        #layer
        data-ui="date-range-picker"
        data-ui-date-range-picker=""
        data-part="positioner"
        data-part-positioner=""
        data-open
        [attr.data-presentation]="sheet() ? 'sheet' : 'popover'"
      >
        <div
          data-part="content"
          data-part-content=""
          role="dialog"
          [attr.id]="contentId"
          [attr.aria-label]="triggerLabel()"
          (keydown)="onContentKeyDown($event)"
        >
          @if (sheet()) {
            <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
          }
          <div data-part="head" data-part-head="">
            <span
              data-part="head-start"
              data-part-head-start=""
              [attr.data-placeholder]="shownStart() === null ? '' : null"
              [attr.data-pending]="startPending() ? '' : null"
              >{{ shownStart() === null ? t('start') : writeShort(shownStart()!) }}</span
            >
            –
            <span
              data-part="head-end"
              data-part-head-end=""
              [attr.data-placeholder]="shownEnd() === null ? '' : null"
              [attr.data-pending]="endPending() ? '' : null"
              >{{ shownEnd() === null ? t('end') : writeShort(shownEnd()!) }}</span
            >
            <span
              data-part="length"
              data-part-length=""
              aria-live="polite"
              [attr.data-pending]="pendingRun() === null ? null : ''"
              >{{ spokenLength() }}</span
            >
            @if (limitText() !== null) {
              <span data-part="limit" data-part-limit="">{{ limitText() }}</span>
            }
          </div>
          <div data-part="panels" data-part-panels="">
            <ng-content select="[slDateRangePickerPresets]" />
            <div
              slCalendar
              #calendar="slCalendar"
              selectionMode="range"
              [locale]="resolvedLocale()"
              [timeZone]="resolvedTimeZone()"
              [firstDayOfWeek]="firstDayOfWeek()"
              [min]="min()"
              [max]="max()"
              [isDateUnavailable]="gridUnavailable()"
              [months]="resolvedMonths()"
              [weekNumbers]="weekNumbers()"
              [fixedWeeks]="fixedWeeks()"
              [readOnly]="resolvedReadOnly()"
              [value]="calendarValue()"
              [view]="view()"
              (viewChange)="view.set($event)"
              (previewChange)="preview.set($event)"
              (valueChange)="onCalendarValue($event)"
            ></div>
          </div>
          <ng-content select="[slDateRangePickerFooter]" />
        </div>
      </div>
    }`,
  styleUrl: '../../../styles/src/date-range-picker/date-range-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'date-range-picker',
    'data-ui-date-range-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-count]': 'resolvedCount()',
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDateRangePicker implements ControlValueAccessor, Validator, OnInit {
  readonly value = input<DateRange | null | undefined>(undefined);
  readonly defaultValue = input<DateRange | null | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Present means the consumer owns which end is being edited. */
  readonly position = input<DateRangePickerPosition | undefined>(undefined);
  readonly defaultPosition = input<DateRangePickerPosition>('start');

  readonly min = input<PlainDate | undefined>(undefined);
  readonly max = input<PlainDate | undefined>(undefined);
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);
  /**
   * Whether a run may cross an unavailable day. On, and with a start chosen,
   * the days beyond the first unavailable one are unavailable too, and a typed
   * run that crosses one is invalid; off, the run may jump over it and only
   * its two ends are checked.
   */
  readonly contiguous = input(true, { transform: booleanAttribute });
  /** The shortest and longest run allowed, in the unit `count` names. */
  readonly minLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly count = input<DateRangePickerCount | undefined>(undefined);

  readonly months = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Six rows whatever the month needs, so a press of "next" moves no target. */
  readonly fixedWeeks = input(true, { transform: booleanAttribute });

  /** BCP 47. Writes both fields, the grid and the trigger's dates. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly yearPivot = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly calendar = input<DateRangePickerCalendar | undefined>(undefined);

  readonly size = input<DateRangePickerSize | undefined>(undefined);
  readonly variant = input<DateRangePickerVariant | undefined>(undefined);
  readonly placement = input<DateRangePickerPlacement | undefined>(undefined);
  readonly closeOnSelect = input<DateRangePickerCloseOnSelect | undefined>(undefined);

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

  /** Draws one clear on the frame, which empties both ends. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, the clear, the names of the two ends, and the
   * phrases that count the run (`days.length`, `nights.between`, …).
   */
  readonly messages = input<PartialMessages<DateRangePickerMessages> | undefined>(undefined);
  /** The names of the two hidden inputs a plain form post reads. */
  readonly startName = input<string | undefined>(undefined);
  readonly endName = input<string | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<DateRange | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly positionChange = output<ChangeRequest<DateRangePickerPosition>>();

  @ViewChild('layer') protected layer?: ElementRef<HTMLElement>;
  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('startField') protected startField?: SlDateField;
  @ViewChild('endField') protected endField?: SlDateField;
  @ViewChild('calendar') protected calendarRef?: SlCalendar;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly defaults = injectDateRangePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(dateRangePickerMessages, this.messages);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  /**
   * The field around it. Inside one, the frame takes the field's control
   * identifier and its label, and the two ends inside it keep their own
   * names: two date fields each taking the field's identifier wrote it twice
   * and left the label naming neither.
   */
  protected readonly enclosing = inject(SlField, { optional: true });

  protected readonly contentId = `sl-date-range-picker-${String((sequence += 1))}`;

  private readonly ownOpen = signal(false);
  private readonly ownValue = signal<DateRange | null>(null);
  private readonly ownPosition = signal<DateRangePickerPosition>('start');
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly view = signal<CalendarView>('day');
  protected readonly sheet = signal(false);
  /**
   * The start the reader pressed in the grid while the run is still open. It
   * is not the value: a half-drawn run never reaches a form without the reader
   * having seen it in the field.
   */
  private readonly draft = signal<PlainDate | null>(null);
  /** The pending end the calendar reports, or `null` while no run is open. */
  protected readonly preview = signal<PlainDate | null>(null);
  /** A pointer press before focus names the reason a field became current. */
  protected pointerFocus = false;
  /**
   * Whether the next opening moves focus into the calendar. Set by the trigger
   * and by `openSurface()`; the chord leaves focus in the field so typing keeps
   * working, and a first render that starts open leaves focus where the page
   * put it.
   */
  private focusOnOpen = false;

  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseGrip: (() => void) | null = null;

  private onChangeFn: (value: DateRange | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly isOpen = computed(() => this.open() ?? this.ownOpen());
  protected readonly held = computed(() => {
    const value = this.value();
    return value === undefined ? this.ownValue() : normalize(value);
  });
  /** The range the picker holds. Public, so a preset can compare itself to it. */
  readonly selection = computed(() => this.held());
  protected readonly currentPosition = computed(() => this.position() ?? this.ownPosition());
  protected readonly start = computed(() => this.held()?.start ?? null);
  protected readonly end = computed(() => this.held()?.end ?? null);
  private readonly ordered = computed(() => {
    const start = this.start();
    const end = this.end();
    return start !== null && end !== null && compareDate(start, end) <= 0;
  });
  protected readonly reversed = computed(() => this.problems().includes('order'));

  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.enclosing?.resolvedSize() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedPlacement = computed(
    () => this.placement() ?? this.defaults.placement,
  );
  protected readonly resolvedCount = computed(() => this.count() ?? this.defaults.count);
  protected readonly resolvedMonths = computed(() => this.months() ?? this.defaults.months);
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.enclosing?.resolvedDisabled(),
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.enclosing?.resolvedReadOnly(),
  );
  protected readonly resolvedRequired = computed(
    () => this.required() ?? this.enclosing?.required(),
  );
  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicate over every day of the run, the order of the two
   * ends and the length.
   */
  private readonly problems = computed(() =>
    rangeProblems(this.held(), {
      contiguous: this.contiguous(),
      count: this.resolvedCount(),
      max: this.max(),
      maxLength: this.maxLength(),
      min: this.min(),
      minLength: this.minLength(),
      unavailable: this.isDateUnavailable(),
    }),
  );
  protected readonly resolvedInvalid = computed(() => {
    if (this.invalid() !== undefined) return this.invalid();
    if (this.problems().length > 0) return true;
    return this.enclosing?.invalid();
  });

  /* Crossed bounds, while the order holds: the start cannot step past the
     end nor the end before the start. Reversed, each field keeps the outer
     bounds and the end field alone says the order is wrong. */
  protected readonly startMax = computed(() => {
    const end = this.end();
    const max = this.max();
    if (!this.ordered() || end === null) return max;
    return max === undefined || compareDate(end, max) < 0 ? end : max;
  });
  protected readonly endMin = computed(() => {
    const start = this.start();
    const min = this.min();
    if (!this.ordered() || start === null) return min;
    return min === undefined || compareDate(start, min) > 0 ? start : min;
  });

  /**
   * What the calendar is shown. A pressed start replaces the value while the
   * run is open; with the end as the current position, the end is withheld so
   * the next press writes it instead of restarting the run.
   */
  protected readonly calendarValue = computed<CalendarValue>(() => {
    const draft = this.draft();
    if (draft !== null) return { start: draft, end: null };
    const start = this.start();
    if (this.currentPosition() === 'end' && start !== null) return { start, end: null };
    return this.held();
  });
  private readonly openStart = computed(() => {
    const value = this.calendarValue();
    if (value === null || Array.isArray(value) || !('start' in value)) return null;
    return value.end === null ? value.start : null;
  });

  /** The block on either side of the chosen start, found once per start. */
  private readonly blocked = computed(() => {
    const openStart = this.openStart();
    if (openStart === null || !this.contiguous()) return { before: null, after: null };
    return blockedAround(
      openStart,
      this.isDateUnavailable() ?? (() => false),
      this.maxLength() ?? CONTIGUOUS_SEARCH,
    );
  });
  protected readonly gridUnavailable = computed(() => {
    const openStart = this.openStart();
    const unavailable = this.isDateUnavailable();
    if (openStart === null) return unavailable;
    const rules = {
      contiguous: this.contiguous(),
      count: this.resolvedCount(),
      maxLength: this.maxLength(),
      minLength: this.minLength(),
      unavailable,
    };
    const blocked = this.blocked();
    return (date: PlainDate) => isDateRefusedInRun(openStart, date, rules, blocked);
  });

  /** The run as it would close on the pending end. */
  protected readonly pendingRun = computed(() => {
    const openStart = this.openStart();
    const preview = this.preview();
    return openStart !== null && preview !== null ? orderedRun(openStart, preview) : null;
  });
  protected readonly shownStart = computed(
    () => this.pendingRun()?.start ?? this.draft() ?? this.start(),
  );
  protected readonly shownEnd = computed(
    () => this.pendingRun()?.end ?? (this.draft() !== null ? null : this.end()),
  );
  protected readonly startPending = computed(() => {
    const pending = this.pendingRun();
    return pending !== null && !isSameDate(pending.start, this.openStart());
  });
  protected readonly endPending = computed(
    () => this.pendingRun() !== null && !this.startPending(),
  );

  /** "4 nights": the run's length, in the unit `count` names. */
  protected readonly spokenLength = computed(() => {
    const count = this.resolvedCount();
    const length = (days: number) => this.t(`${count}.length` as const, { count: days });
    const pending = this.pendingRun();
    if (pending !== null) return length(rangeLength(pending.start, pending.end, count));
    const start = this.start();
    const end = this.end();
    if (this.ordered() && start !== null && end !== null) {
      return length(rangeLength(start, end, count));
    }
    return '';
  });
  /** "2 to 7 nights", "at least 2 nights", "at most 7 nights". */
  protected readonly limitText = computed(() => {
    const min = this.minLength();
    const max = this.maxLength();
    const count = this.resolvedCount();
    if (min !== undefined && max !== undefined) {
      return this.t(`${count}.between` as const, { min, max });
    }
    if (min !== undefined) return this.t(`${count}.atLeast` as const, { min });
    if (max !== undefined) return this.t(`${count}.atMost` as const, { max });
    return null;
  });

  /** The trigger's accessible name: focus returns here when the surface closes. */
  protected readonly triggerLabel = computed(() => {
    const start = this.start();
    const end = this.end();
    if (!this.ordered() || start === null || end === null) {
      return this.t('choose');
    }
    const format = createDateFormat({ locale: this.resolvedLocale() });
    return this.t('change', {
      start: format.describe(start),
      end: format.describe(end),
      length: this.spokenLength(),
    });
  });

  /* The band writes each end short — "12 Sep" — because the whole date in
     words is the trigger's, and a band that repeats it twice runs past the
     panel at 240 pixels. */
  private readonly short = computed(
    () =>
      new Intl.DateTimeFormat(this.resolvedLocale(), {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
  );

  constructor() {
    /* The layer is created and torn down with the surface, not with the
       component: a layer that outlived its content would hold a place in the
       single stack that nothing occupies. */
    effect(() => {
      const open = this.isOpen();
      if (!open) {
        this.release();
        this.draft.set(null);
        return;
      }
      afterNextRender(() => this.attach(), { injector: this.injector });
    });

    /* A rule that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.problems();
      this.onValidatorChangeFn();
    });

    this.destroyRef.onDestroy(() => this.release());
  }

  ngOnInit() {
    this.ownOpen.set(this.defaultOpen());
    this.ownValue.set(normalize(this.defaultValue()));
    this.ownPosition.set(this.defaultPosition());

    /* A native reset restores the hidden inputs and tells nothing, so the
       picker would keep the last run chosen in a form that had been reset. The
       value returns to `defaultValue` through `valueChange`, reason
       `programmatic`, and a start pressed in the grid without its end is
       dropped with it. A picker bound to a form model takes the model's reset
       value through `writeValue` instead. */
    const form = this.element.closest('form');
    if (form !== null) {
      const onReset = (event: Event) => {
        if (this.formBound) return;
        this.draft.set(null);
        this.commit(this.defaultValue() ?? null, 'programmatic', event);
      };
      form.addEventListener('reset', onReset);
      this.destroyRef.onDestroy(() => form.removeEventListener('reset', onReset));
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(SHEET_QUERY);
    const read = () => this.sheet.set(query.matches);
    read();
    query.addEventListener('change', read);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', read));
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  writeValue(value: DateRange | null | undefined) {
    this.ownValue.set(normalize(value));
  }

  registerOnChange(fn: (value: DateRange | null) => void) {
    this.onChangeFn = fn;
    this.formBound = true;
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
   * The rules no other validator can see: the bounds, the predicate over the
   * run, the order of the two ends and the length. `required` is left to
   * Angular's own, because a form already has a word for it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = normalize(control.value as DateRange | null | undefined);
    if (value === null) return null;
    const problems = rangeProblems(value, {
      contiguous: this.contiguous(),
      count: this.resolvedCount(),
      max: this.max(),
      maxLength: this.maxLength(),
      min: this.min(),
      minLength: this.minLength(),
      unavailable: this.isDateUnavailable(),
    });
    if (problems.length === 0) return null;
    const errors: ValidationErrors = {};
    if (problems.includes('order')) errors['slottedDateRangeOrder'] = { actual: value };
    if (problems.includes('min'))
      errors['slottedDateRangeMin'] = { min: this.min(), actual: value };
    if (problems.includes('max'))
      errors['slottedDateRangeMax'] = { max: this.max(), actual: value };
    if (problems.includes('unavailable')) errors['slottedDateRangeUnavailable'] = { actual: value };
    if (problems.includes('length')) {
      errors['slottedDateRangeLength'] = {
        minLength: this.minLength(),
        maxLength: this.maxLength(),
        actual: value,
      };
    }
    return errors;
  }

  /* ── Imperative ────────────────────────────────────────────────────── */

  /** Puts focus on the first segment of one end; the current end by default. */
  focus(position: DateRangePickerPosition = this.currentPosition()) {
    (position === 'end' ? this.endField : this.startField)?.focus();
  }

  openSurface(source?: Event) {
    this.setOpen(true, 'keyboard', source, true);
  }

  closeSurface(source?: Event) {
    this.setOpen(false, 'keyboard', source);
  }

  /** A preset writes its range through here, with the `select` reason. */
  choose(range: DateRange, source?: Event) {
    this.draft.set(null);
    this.commit(range, 'select', source);
    this.setPosition('start', 'select', source);
    this.closeAfter(true, source);
  }

  /* ── Handlers ──────────────────────────────────────────────────────── */

  protected writeShort(date: PlainDate): string {
    return this.short().format(Date.UTC(date.year, date.month - 1, date.day));
  }

  protected toggle(source: Event) {
    this.setOpen(!this.isOpen(), 'pointer', source, true);
  }

  /** Tab and Shift+Tab wrap inside the surface while it is open. */
  protected onContentKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const content = event.currentTarget as HTMLElement;
    const items = tabbables(content);
    const first = items[0];
    const last = items[items.length - 1];
    if (first === undefined || last === undefined) return;
    const current = content.ownerDocument.activeElement;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected clear(source: Event) {
    this.commit(null, 'clear', source);
    this.setPosition('start', 'clear', source);
    this.focus('start');
  }

  protected onControlKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    /* ChromeOS turns the chord into PageDown before the browser sees it, which
       is why the trigger button is always drawn and this is only a shortcut. */
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.setOpen(true, 'keyboard', event);
    }
  }

  protected onFieldFocus(which: DateRangePickerPosition, source: Event) {
    const reason: ChangeReason = this.pointerFocus ? 'pointer' : 'keyboard';
    this.pointerFocus = false;
    if (which !== this.currentPosition()) this.setPosition(which, reason, source);
  }

  protected onControlFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.contains(next)) return;
    this.onTouchedFn();
  }

  protected onFieldValue(
    which: DateRangePickerPosition,
    request: { value: PlainDate | null; reason: ChangeReason; source?: unknown },
  ) {
    const next =
      which === 'start'
        ? { start: request.value, end: this.end() }
        : { start: this.start(), end: request.value };
    this.commit(next, request.reason, request.source);
  }

  protected onCalendarValue(request: ChangeRequest<CalendarValue>) {
    const next = request.value;
    if (next === null || Array.isArray(next) || !('start' in next)) return;
    if (next.end === null) {
      /* The first press: a draft, and the next press writes the end. */
      this.draft.set(next.start);
      this.setPosition('end', 'select', request.source);
      this.closeAfter(false, request.source);
      return;
    }
    this.draft.set(null);
    this.commit(next, 'select', request.source);
    this.setPosition('start', 'select', request.source);
    this.closeAfter(true, request.source);
  }

  private closeAfter(whole: boolean, source: unknown) {
    const axis = this.closeOnSelect() ?? this.defaults.closeOnSelect;
    if (!(axis === 'always' || (axis === 'auto' && whole))) return;
    this.setOpen(false, 'select', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  private commit(next: DateRange | null, reason: ChangeReason, source: unknown) {
    const normalized = normalize(next);
    let cancelled = false;
    const state = createControllable<DateRange | null>({
      controlled: this.value() === undefined ? undefined : this.held(),
      initial: this.held(),
      equals: (a, b) => isSameValue(a, b),
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    if (!state.request(normalized, reason, source) || cancelled) return;
    if (this.value() === undefined) this.ownValue.set(normalized);
    this.onChangeFn(normalized);
  }

  private setPosition(next: DateRangePickerPosition, reason: ChangeReason, source: unknown) {
    const state = createControllable<DateRangePickerPosition>({
      controlled: this.position(),
      initial: this.currentPosition(),
      onRequest: (request) => this.positionChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownPosition.set(next);
  }

  private setOpen(next: boolean, reason: OpenReason, source: unknown, moveFocus = false) {
    const state = createControllable<boolean>({
      controlled: this.open(),
      initial: this.isOpen(),
      onRequest: (request) => {
        this.openChange.emit(request);
        this.focusOnOpen = moveFocus && request.value && !request.cancelled;
      },
    });
    if (state.request(next, reason, source)) this.ownOpen.set(next);
  }

  /** Places the layer and puts it in the single stack. */
  private attach() {
    const layer = this.layer?.nativeElement;
    if (layer === undefined) return;
    this.release();

    /* A pull down on the sheet's grip dismisses it, as the grip of every other sheet does. */
    const grip = this.sheet()
      ? layer.querySelector<HTMLElement>(':scope > [data-part="content"] > [data-part="grip"]')
      : null;
    if (grip !== null) {
      this.releaseGrip = attachGripDismiss({
        grip,
        sheet: layer,
        onDismiss: (event) => {
          this.setOpen(false, 'pointer', event);
        },
      });
    }

    if (!this.sheet()) {
      const anchor =
        this.element.querySelector<HTMLElement>('[data-part="control"]') ?? this.element;
      const [side, align] = this.resolvedPlacement().split('-') as [
        'top' | 'bottom',
        'start' | 'end' | undefined,
      ];
      this.positioner = createPositioner(anchor, layer, { align: align ?? 'center', side });
      /* The positioner writes `data-positioned` with the side, on the element, in
         the task that opened the layer; a binding to say it again was a frame later. */
      void this.positioner.update();
    }

    const trigger = this.triggerRef?.nativeElement;
    this.dismissable = createDismissableLayer(layer, {
      branches: trigger === undefined ? [] : [trigger],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (request) => {
        /* The view first, the surface second: the layer asks in the capture
           phase, so the decision is taken here and the layer simply not asked. */
        if (request.reason === 'escape' && this.view() !== 'day') {
          this.view.set(this.view() === 'year' ? 'month' : 'day');
          return;
        }
        this.setOpen(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source,
        );
        if (request.reason === 'escape') {
          this.triggerRef?.nativeElement.focus({ preventScroll: true });
        }
      },
    });

    /* Opened from the trigger or the handle, focus lands on the cell of the
       current end, or on today when it is empty — the APG's rule for its
       "Choose Date" button. The grid pages to that cell first, and focus waits
       for the render that draws it. Opened with the chord, focus stays in the
       field so typing keeps working. */
    if (this.focusOnOpen) {
      this.focusOnOpen = false;
      const target = this.currentPosition() === 'end' ? this.end() : this.start();
      if (target !== null) this.calendarRef?.focusDate(target);
      afterNextRender(
        () =>
          layer
            .querySelector<HTMLElement>('[data-part="day"][tabindex="0"]')
            ?.focus({ preventScroll: true }),
        { injector: this.injector },
      );
    }
  }

  private release() {
    this.releaseGrip?.();
    this.releaseGrip = null;
    this.positioner?.destroy();
    this.positioner = null;
    this.dismissable?.destroy();
    this.dismissable = null;
    this.layer?.nativeElement.removeAttribute('data-positioned');
  }
}

/**
 * One shortcut. It writes its range with the `select` reason and carries
 * `data-selected` while the value equals it. The list is the product's — "last
 * 7 days" is a business calendar — and the family ships the button, not the
 * list.
 */
@Directive({
  selector: 'button[slDateRangePickerPreset]',
  standalone: true,
  exportAs: 'slDateRangePickerPreset',
  host: {
    'data-part': 'preset',
    'data-part-preset': '',
    type: 'button',
    '[attr.data-selected]': "selected() ? '' : null",
    '(click)': 'choose($event)',
  },
})
export class SlDateRangePickerPreset {
  /** The range the press writes, or a function resolving it at the press. */
  readonly range = input.required<DateRange | (() => DateRange)>({
    alias: 'slDateRangePickerPreset',
  });

  private readonly picker = inject(SlDateRangePicker);

  protected readonly selected = computed(() => {
    const range = this.range();
    return isSameValue(this.picker.selection(), typeof range === 'function' ? range() : range);
  });

  protected choose(event: Event) {
    if (event.defaultPrevented) return;
    const range = this.range();
    this.picker.choose(typeof range === 'function' ? range() : range, event);
  }
}
