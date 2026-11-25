import {
  addDays,
  createDateFormat,
  firstDayOf,
  isDateInRange,
  isPlainDate,
  isPlainYearMonth,
  lastDayOf,
  presetValue,
  todayIn,
  yearMonthOf,
} from '@slotted/core/date';
import type { PickerPreset, PlainDate, PlainYearMonth } from '@slotted/core/date';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  ViewChild,
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
import {
  datePickerMessages,
  pickerPanelMessages,
  type DatePickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import {
  asDates,
  injectCalendarDefaults,
  isRange,
  isSameValue,
  SlCalendar,
} from '@slotted/angular/calendar';
import type { CalendarSelectionMode, CalendarValue, CalendarView } from '@slotted/angular/calendar';
import { SlDateField, SlDateFieldEnd } from '@slotted/angular/date-field';
import { SlField } from '@slotted/angular/field';
import {
  isOpenChord,
  pickerDraft,
  PickerLayer,
  SlPickerBody,
  SlPickerFooter,
  SlPickerHead,
  SlPickerJump,
  SlPickerLayer,
  SlPickerPanel,
  SlPickerRail,
  SlPickerStep,
  SlPickerTrigger,
} from '@slotted/angular/picker-panel';
import type { PickerPresetView } from '@slotted/angular/picker-panel';

import { SlDatePickerFooter } from './date-picker-parts';
import { dateHead, dateResult, isRefusedDate, isWholeDate, monthsOf } from './date-panel';
import { injectDatePickerDefaults } from './date-picker-defaults';
import type {
  DatePickerCalendar,
  DatePickerPlacement,
  DatePickerSize,
  DatePickerVariant,
} from './date-picker-defaults';

/**
 * A date field, a trigger, and a calendar behind them.
 *
 * **It composes the other two families and redraws neither.** The field keeps
 * its own `data-ui` and the calendar keeps its own; this family owns the box the
 * positioner measures, the trigger inside the field's end slot, and the layer
 * the calendar stands on.
 *
 * **The trigger's name carries the chosen date.** Focus returns to it when the
 * surface closes, so the name is where the reader is told what was chosen —
 * which the APG's own example names as an accessibility feature.
 *
 * **`Escape` is staged.** `dismissable-layer` asks in the capture phase, so a
 * handler inside the surface is too late; the family decides there instead, and
 * walks the calendar's view down rather than closing while a month or year grid
 * is showing.
 */
@Component({
  selector: '[slDatePicker]',
  standalone: true,
  exportAs: 'slDatePicker',
  imports: [
    SlCalendar,
    SlDateField,
    SlDateFieldEnd,
    SlPickerBody,
    SlPickerFooter,
    SlPickerHead,
    SlPickerJump,
    SlPickerLayer,
    SlPickerPanel,
    SlPickerRail,
    SlPickerStep,
    SlPickerTrigger,
  ],
  template: `<div data-part="control" data-part-control="" (keydown)="onControlKeyDown($event)">
      <div
        slDateField
        #field="slDateField"
        [locale]="resolvedLocale()"
        [timeZone]="resolvedTimeZone()"
        [firstDayOfWeek]="firstDayOfWeek()"
        [yearPivot]="yearPivot()"
        [calendar]="resolvedCalendar()"
        [size]="resolvedSize()"
        [variant]="resolvedVariant()"
        [min]="minDay()"
        [max]="maxDay()"
        [granularity]="granularity()"
        [isDateUnavailable]="isDateUnavailable()"
        [clearable]="clears()"
        [name]="name()"
        [disabled]="resolvedDisabled()"
        [readOnly]="readOnly()"
        [invalid]="invalid()"
        [required]="required()"
        [value]="singleValue()"
        (valueChange)="onFieldValue($event)"
        (focusout)="onControlFocusOut($event)"
      >
        <span slDateFieldEnd>
          <button
            #trigger
            slPickerTrigger
            glyph="calendar"
            [disabled]="!editable()"
            [label]="triggerLabel()"
            [layer]="layer"
          ></button>
        </span>
      </div>
    </div>

    @if (layer.isOpen()) {
      <div slPickerLayer [label]="triggerLabel()" [layer]="layer" (applied)="apply($event)">
        <div slPickerPanel kind="date">
          @if (presetViews().length > 0) {
            <div slPickerRail [presets]="presetViews()">
              @if (!monthly()) {
                <div
                  slPickerJump
                  [locale]="resolvedLocale()"
                  [max]="maxDay()"
                  [min]="minDay()"
                  [months]="shownMonths()"
                  [selected]="selectedMonths()"
                  [shown]="shownPage()"
                  [today]="currentToday()"
                  (jump)="jump($event)"
                ></div>
              }
            </div>
          }

          <div
            slPickerHead
            [empty]="head().empty"
            [invalid]="refused()"
            [meta]="head().meta"
            [value]="head().value"
          >
            @if (editable() && single() && !monthly()) {
              <button
                slPickerStep="previous"
                [label]="words('previousDay')"
                (click)="stepDay(-1, $event)"
              ></button>
              <button
                slPickerStep="next"
                [label]="words('nextDay')"
                (click)="stepDay(1, $event)"
              ></button>
            }
          </div>

          <div slPickerBody>
            <div
              slCalendar
              [locale]="resolvedLocale()"
              [timeZone]="resolvedTimeZone()"
              [today]="statedToday()"
              [firstDayOfWeek]="firstDayOfWeek()"
              [min]="minDay()"
              [max]="maxDay()"
              [granularity]="granularity()"
              [isDateUnavailable]="isDateUnavailable()"
              [selectionMode]="selectionMode()"
              [months]="shownMonths()"
              [weekNumbers]="weekNumbers()"
              [fixedWeeks]="fixedWeeks() && shownMonths() === 1"
              [readOnly]="!editable()"
              [focusedDate]="focused()"
              [value]="draft()"
              [view]="view()"
              (focusedDateChange)="focused.set($event.value)"
              (pageChange)="page.set($event)"
              (viewChange)="view.set($event)"
              (valueChange)="take($event)"
            ></div>
          </div>

          @if (footerShown()) {
            <div
              slPickerFooter
              [clearable]="clears()"
              [canApply]="canApply()"
              [canClear]="hasDraft()"
              [confirm]="resolvedConfirm()"
              [hint]="hint()"
              [invalid]="refused()"
              (applied)="apply($event)"
              (cleared)="clear($event)"
            >
              <ng-content select="[slDatePickerFooter]">{{ hint() }}</ng-content>
            </div>
          }
        </div>
      </div>
    }`,
  styleUrl: '../../../styles/src/date-picker/date-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDatePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDatePicker), multi: true },
  ],
  host: {
    'data-ui': 'date-picker',
    'data-ui-date-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-open]': "layer.isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDatePicker<V extends CalendarValue | PlainYearMonth = CalendarValue>
  implements ControlValueAccessor, Validator, OnInit
{
  /**
   * The date, the run or the set; under `granularity="month"`, a
   * `PlainYearMonth`. Present means the consumer owns it. Its type is the
   * type `valueChange` reports.
   */
  readonly value = input<V | undefined>(undefined);
  readonly defaultValue = input<V | undefined>(undefined);
  /**
   * What a choice is. `month` opens the calendar on the months of a year and
   * chooses a month cell; the field shows the month and the year; `value`,
   * `defaultValue`, `min` and `max` are `PlainYearMonth`, `valueChange`
   * reports one, and `name` submits `YYYY-MM`.
   */
  readonly granularity = input<'day' | 'month' | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  readonly min = input<PlainDate | PlainYearMonth | undefined>(undefined);
  readonly max = input<PlainDate | PlainYearMonth | undefined>(undefined);
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);

  readonly selectionMode = input<CalendarSelectionMode>('single');
  readonly months = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly defaultView = input<CalendarView | undefined>(undefined);
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Six rows whatever the month needs, on by default here and off in a bare
   * calendar: a surface that grows a row between one press of "next" and the
   * next moves the target the reader was aiming at.
   */
  readonly fixedWeeks = input(true, { transform: booleanAttribute });

  /** BCP 47. Writes the field, the grid and the trigger's date. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /**
   * The day it is, stated by the application: a business date, a day a server
   * answers. Unset, the clock answers in `timeZone`.
   */
  readonly today = input<PlainDate | undefined>(undefined);
  /** 0 is Sunday. Unset, the locale decides. */
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** How a two-digit typed year resolves in the field. */
  readonly yearPivot = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly calendar = input<DatePickerCalendar | undefined>(undefined);

  readonly size = input<DatePickerSize | undefined>(undefined);
  readonly variant = input<DatePickerVariant | undefined>(undefined);
  readonly placement = input<DatePickerPlacement | undefined>(undefined);
  /**
   * Whether the panel keeps a draft until Apply. Off for one date or one
   * month, which a press finishes; on for a run and for a set.
   */
  readonly confirm = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

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

  readonly clearable = input(false, { transform: booleanAttribute });
  readonly name = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's name before (`choose`) and after (`change`) a date is chosen.
   */
  readonly messages = input<PartialMessages<DatePickerMessages> | undefined>(undefined);
  /** The consumer's own shortcuts. The panel writes what each one is. */
  readonly presets = input<readonly PickerPreset<CalendarValue | PlainYearMonth>[]>([]);

  readonly valueChange = output<ChangeRequest<V | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();

  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('field') protected field?: SlDateField;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDatePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(datePickerMessages, this.messages);
  protected readonly words = injectMessages(pickerPanelMessages);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enclosing = inject(SlField, { optional: true });

  private readonly ownValue = signal<CalendarValue>(null);
  protected readonly view = signal<CalendarView>('day');
  protected readonly focused = signal<PlainDate | undefined>(undefined);
  protected readonly page = signal<PlainYearMonth | null>(null);
  private readonly clockToday = signal<PlainDate>({ year: 2026, month: 1, day: 1 });
  private readonly calendarDefaults = injectCalendarDefaults();
  /** The day the application states: on the picker, on its provider, or on the calendars'. */
  protected readonly statedToday = computed(
    () => this.today() ?? this.defaults.today ?? this.calendarDefaults.today,
  );
  /** The day it is: the one stated, else the clock's. */
  protected readonly currentToday = computed(() => this.statedToday() ?? this.clockToday());
  private readonly formDisabled = signal<boolean | undefined>(undefined);

  private onChangeFn: (value: V | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly layer = new PickerLayer({
    focusPanel: (panel) =>
      panel
        .querySelector<HTMLElement>(
          '[data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
        )
        ?.focus({ preventScroll: true }),
    left: () => this.draft.set(this.held()),
    onEscape: () => this.walkDown(),
    open: this.open,
    placement: computed(() => this.placement() ?? this.defaults.placement),
    requested: (request) => this.openChange.emit(request),
    root: this.element,
    trigger: () => this.triggerRef?.nativeElement,
  });

  /**
   * A month is its own value. Under `granularity="month"` the picker holds a
   * `PlainYearMonth`; the field and the calendar below it hold the first day of
   * that month, and the bounds become the first day of `min` and the last day
   * of `max`, so a month the bounds touch is a month the reader may choose.
   */
  protected readonly monthly = computed(() => this.granularity() === 'month');
  protected readonly held = computed(() => {
    const value = this.value();
    return value === undefined ? this.ownValue() : this.toDay(value);
  });
  protected readonly minDay = computed(() => {
    const min = this.min();
    return isPlainYearMonth(min) ? firstDayOf(min) : min;
  });
  protected readonly maxDay = computed(() => {
    const max = this.max();
    return isPlainYearMonth(max) ? lastDayOf(max) : max;
  });

  /** A month as the day the field and the calendar hold for it. */
  private toDay(value: CalendarValue | PlainYearMonth | null | undefined): CalendarValue {
    if (value === undefined || value === null) return null;
    return isPlainYearMonth(value) ? firstDayOf(value) : value;
  }

  /** What leaves the picker: the month under `month`, the value otherwise. */
  private outward(value: CalendarValue): V | null {
    if (!this.monthly()) return value as V | null;
    return (isPlainDate(value) ? yearMonthOf(value) : null) as V | null;
  }

  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.enclosing?.resolvedSize() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.enclosing?.resolvedDisabled(),
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.enclosing?.resolvedReadOnly(),
  );
  protected readonly resolvedRequired = computed(
    () => this.required() ?? this.enclosing?.required(),
  );
  /** A required value offers no control that empties it. */
  protected readonly clears = computed(() => this.clearable() && this.resolvedRequired() !== true);
  /** The application's own words for the footer. */
  private readonly ownFooter = contentChild(SlDatePickerFooter);
  /** With nothing to say and no action to offer, there is no footer. */
  protected readonly footerShown = computed(
    () =>
      this.clears() ||
      this.resolvedConfirm() ||
      this.refused() ||
      this.hint() !== '' ||
      this.ownFooter() !== undefined,
  );

  /**
   * Validity the family owns, beside the validity the consumer states: a date
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  protected readonly resolvedInvalid = computed(() => {
    const refused = asDates(this.held()).some(
      (date) =>
        !isDateInRange(date, this.minDay(), this.maxDay()) ||
        this.isDateUnavailable()?.(date) === true,
    );
    if (refused) return true;
    return this.invalid() ?? this.enclosing?.invalid();
  });

  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  /**
   * The value the field shows, which is a single date or nothing at all. `null`
   * reaches the field as `null`, so a value emptied from outside — a form
   * reset, a controlled clear — empties the segments too.
   */
  protected readonly singleValue = computed(() => {
    const held = this.held();
    if (held !== null && (Array.isArray(held) || 'start' in held)) return undefined;
    return held;
  });

  /**
   * The trigger's accessible name. Focus returns here when the surface closes,
   * so this is where the reader is told what was chosen.
   */
  protected readonly triggerLabel = computed(() => {
    const chosen = asDates(this.held());
    if (chosen.length === 0) return this.t('choose');
    const format = createDateFormat({ locale: this.resolvedLocale() });
    const words = (date: PlainDate) =>
      this.monthly() ? format.monthYear(date) : format.describe(date);
    return this.t('change', { date: chosen.map(words).join(' – ') });
  });

  protected readonly single = computed(() => this.selectionMode() === 'single');
  protected readonly resolvedConfirm = computed(
    () => this.confirm() ?? this.defaults.confirm ?? !this.single(),
  );

  /* ── What the panel composes ───────────────────────────────────────── */

  protected readonly draft = pickerDraft(this.held, isSameValue);
  protected readonly hasDraft = computed(() => asDates(this.draft()).length > 0);
  protected readonly shownMonths = computed(() =>
    this.layer.narrow() ? 1 : Math.max(1, this.months() ?? 1),
  );

  private readonly rules = computed(() => ({
    isDateUnavailable: this.isDateUnavailable(),
    max: this.maxDay(),
    min: this.minDay(),
  }));

  private readonly dateWords = computed(() => ({
    format: createDateFormat({ locale: this.resolvedLocale() }),
    locale: this.resolvedLocale(),
    monthly: this.monthly(),
    t: this.words,
    today: this.currentToday(),
  }));

  protected readonly refused = computed(() => isRefusedDate(this.draft(), this.rules()));
  protected readonly head = computed(() => dateHead(this.draft(), this.dateWords()));
  protected readonly selectedMonths = computed(() => monthsOf(this.draft()));

  protected readonly shownPage = computed(
    () => this.page() ?? this.focused() ?? asDates(this.draft())[0] ?? this.currentToday(),
  );

  protected readonly canApply = computed(
    () =>
      !this.refused() && (isWholeDate(this.draft()) || (!this.hasDraft() && this.held() !== null)),
  );

  protected readonly hint = computed(() => {
    if (this.refused()) return this.t('refused');
    if (this.layer.narrow()) return '';

    return this.words(this.monthly() ? 'yearKeys' : 'pageKeys');
  });

  protected readonly presetViews = computed(() => {
    const stated = this.presets();
    if (stated.length === 0) return [];

    const today = { label: this.words('today'), value: this.currentToday() as CalendarValue };
    const first = this.single() && !this.monthly() ? [today] : [];

    return [...first, ...stated].map((preset): PickerPresetView => {
      const value = this.toDay(presetValue(preset as PickerPreset<CalendarValue | PlainYearMonth>));

      return {
        disabled: isRefusedDate(value, this.rules()),
        label: preset.label,
        press: (event) => this.choose(value, event),
        result: dateResult(value, this.dateWords()),
        selected: isSameValue(this.draft(), value),
      };
    });
  });

  constructor() {
    /* A bound that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.min();
      this.max();
      this.isDateUnavailable();
      this.onValidatorChangeFn();
    });
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  writeValue(value: CalendarValue | PlainYearMonth | undefined) {
    this.ownValue.set(this.toDay(value));
  }

  registerOnChange(fn: (value: V | null) => void) {
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
   * The rules no other validator can see, under the names `date-field` reports
   * them with. `required` is left to Angular's own.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const dates = asDates(this.toDay(control.value as CalendarValue | PlainYearMonth | undefined));
    const min = this.minDay();
    const max = this.maxDay();
    const outside = dates.find((date) => !isDateInRange(date, min, max));
    if (outside !== undefined) return { slottedDateRange: { min, max, actual: outside } };
    const refused = dates.find((date) => this.isDateUnavailable()?.(date) === true);
    if (refused !== undefined) return { slottedDateUnavailable: { actual: refused } };
    return null;
  }

  ngOnInit() {
    this.layer.start(this.defaultOpen());
    this.clockToday.set(todayIn(this.resolvedTimeZone()));
    this.ownValue.set(this.toDay(this.defaultValue()));
    this.view.set(this.defaultView() ?? this.lowestView());

    /* A native reset restores the hidden input and tells nothing, so the
       picker would keep the last date chosen in a form that had been reset.
       The value returns to `defaultValue` through `valueChange`, reason
       `programmatic`. A picker bound to a form model takes the model's reset
       value through `writeValue` instead. */
    const form = this.element.closest('form');
    if (form !== null) {
      const onReset = (event: Event) => {
        if (!this.formBound) this.commit(this.toDay(this.defaultValue()), 'programmatic', event);
      };
      form.addEventListener('reset', onReset);
      this.destroyRef.onDestroy(() => form.removeEventListener('reset', onReset));
    }
  }

  /** Puts focus on the first segment of the field. */
  focus() {
    this.field?.focus();
  }

  openSurface(source?: Event) {
    this.layer.show('keyboard', source);
  }

  closeSurface(source?: Event) {
    this.layer.setOpen(false, 'keyboard', source);
  }

  protected onControlKeyDown(event: KeyboardEvent) {
    if (!this.editable() || !isOpenChord(event)) return;

    event.preventDefault();
    this.layer.show('keyboard', event);
  }

  protected onControlFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.contains(next)) return;
    this.onTouchedFn();
  }

  protected onFieldValue(request: {
    value: PlainDate | null;
    reason: ChangeReason;
    source?: unknown;
  }) {
    this.commit(request.value, request.reason, request.source);
  }

  /* Without a draft to confirm, what a press completes is written: one date and
     a whole run close the panel, and a set stays open for the next press. */
  protected take({ reason, source, value }: ChangeRequest<CalendarValue>) {
    this.draft.set(value);
    if (this.resolvedConfirm() || (isRange(value) && !isWholeDate(value))) return;
    if (this.selectionMode() === 'multiple') this.commit(value, reason, source);
    else this.write(value, source, reason);
  }

  protected apply(source: Event) {
    if (this.canApply()) this.write(this.draft(), source);
  }

  protected clear(source: Event) {
    this.draft.set(null);
    if (!this.resolvedConfirm()) this.write(null, source, 'clear');
  }

  protected jump({ month, year }: PlainYearMonth) {
    this.view.set('day');
    this.focused.set({ year, month, day: 1 });
  }

  /** One day either way, over the days the rules refuse. The panel stays. */
  protected stepDay(direction: 1 | -1, source: Event) {
    const from = asDates(this.draft())[0] ?? addDays(this.currentToday(), -direction);
    const days = Array.from({ length: 366 }, (_, index) => addDays(from, (index + 1) * direction));
    const next = days.find((date) => !isRefusedDate(date, this.rules()));
    if (next === undefined) return;

    this.focused.set(next);
    this.draft.set(next);
    if (!this.resolvedConfirm()) this.commit(next, 'select', source);
  }

  private choose(next: CalendarValue, source: Event) {
    this.focused.set(asDates(next)[0]);
    if (this.resolvedConfirm()) this.draft.set(next);
    else this.write(next, source);
  }

  private write(next: CalendarValue, source: unknown, reason: ChangeReason = 'select') {
    this.commit(next, reason, source);
    this.layer.finish(source);
  }

  /** Escape walks the calendar's view down before it closes the panel. */
  private walkDown(): boolean {
    if (this.view() === this.lowestView()) return false;

    this.view.set(this.view() === 'year' ? 'month' : this.lowestView());

    return true;
  }

  /** The lowest view is where a choice is made: the days, or the months. */
  protected lowestView(): CalendarView {
    return this.monthly() ? 'month' : 'day';
  }

  private commit(next: CalendarValue, reason: ChangeReason, source: unknown) {
    let cancelled = false;
    const state = createControllable<CalendarValue>({
      controlled: this.value() === undefined ? undefined : this.held(),
      initial: this.held(),
      equals: () => false,
      onRequest: (request) => {
        /* The request keeps its own `cancel` and `cancelled`, and carries the
           months instead of the days under `month`. */
        const asked = this.monthly()
          ? (Object.create(request, {
              previous: { enumerable: true, value: this.outward(request.previous) },
              value: { enumerable: true, value: this.outward(request.value) },
            }) as ChangeRequest<V | null>)
          : (request as ChangeRequest<V | null>);
        this.valueChange.emit(asked);
        cancelled = request.cancelled;
      },
    });
    state.request(next, reason, source);
    if (cancelled) return;
    if (this.value() === undefined) this.ownValue.set(next);
    this.onChangeFn(this.outward(next));
  }
}
