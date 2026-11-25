import {
  afterNextRender,
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
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { AfterViewInit, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { asDates, injectCalendarDefaults, SlCalendar } from '@slotted/angular/calendar';
import type { CalendarValue, CalendarView } from '@slotted/angular/calendar';
import { SlClock, SlClockSlot } from '@slotted/angular/clock';
import type { ClockChangeRequest } from '@slotted/angular/clock';
import { SlDateTimeField, SlDateTimeFieldEnd } from '@slotted/angular/datetime-field';
import { SlField } from '@slotted/angular/field';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import {
  isOpenChord,
  pickerDraft,
  PickerLayer,
  PickerValue,
  SlPickerBody,
  SlPickerFooter,
  SlPickerGroup,
  SlPickerHead,
  SlPickerJump,
  SlPickerLayer,
  SlPickerPanel,
  SlPickerRail,
  SlPickerSide,
  SlPickerStep,
  SlPickerTimeHead,
  SlPickerTrigger,
} from '@slotted/angular/picker-panel';
import type { PickerShowing } from '@slotted/angular/picker-panel';
import { SlTimeField } from '@slotted/angular/time-field';
import {
  clockFinest,
  createDateTimeFormat,
  dateBoundsOf,
  dayTimes,
  durationLabel,
  isRefusedDay,
  isRefusedMoment,
  isSameDateTime,
  isSameMomentDraft,
  momentDraft,
  momentMeta,
  momentOf,
  nowDateTimeIn,
  stepToDay,
} from '@slotted/core/date';
import type {
  MomentDraft,
  MomentRules,
  PickerPreset,
  PlainDate,
  PlainDateTime,
  PlainTime,
  PlainYearMonth,
  TimeGranularity,
} from '@slotted/core/date';
import { datetimePickerMessages, pickerPanelMessages } from '@slotted/core/i18n';
import type { DatetimePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import {
  DATE_TIME_PICKER_OFFSETS,
  dateTimeHead,
  momentOffsetViews,
  momentPresetViews,
} from './datetime-panel';
import { SlDateTimePickerFooter } from './datetime-picker-parts';
import { injectDateTimePickerDefaults } from './datetime-picker-defaults';
import type {
  DateTimePickerHourCycle,
  DateTimePickerPlacement,
  DateTimePickerSize,
  DateTimePickerVariant,
} from './datetime-picker-defaults';

/** An input an attribute may state, and `undefined` leaves to what is around the picker. */
function optionalBoolean(value: boolean | string | undefined): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

/**
 * A datetime field, a trigger, and a month beside a clock behind them.
 *
 * **The panel keeps a draft.** A day and a time are two presses and Apply
 * writes both; Escape and a press outside leave the value as it was.
 *
 * **The clock answers the day in the draft.** Its hours are the ones that day
 * is open for, so a closed Saturday refuses every one of them while the reader
 * is still deciding.
 *
 * **Two pairs of bounds apply at once.** `min`/`max` bound the whole value and
 * `minTime`/`maxTime` bound every day inside the range.
 */
@Component({
  selector: '[slDateTimePicker]',
  standalone: true,
  exportAs: 'slDateTimePicker',
  imports: [
    NgTemplateOutlet,
    SlCalendar,
    SlClock,
    SlClockSlot,
    SlDateTimeField,
    SlDateTimeFieldEnd,
    SlPickerBody,
    SlPickerFooter,
    SlPickerGroup,
    SlPickerHead,
    SlPickerJump,
    SlPickerLayer,
    SlPickerPanel,
    SlPickerRail,
    SlPickerSide,
    SlPickerStep,
    SlPickerTimeHead,
    SlPickerTrigger,
    SlTimeField,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDateTimePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateTimePicker), multi: true },
  ],
  template: `
    <div data-part="control" data-part-control="" (keydown)="onControlKeydown($event)">
      <div
        slDateTimeField
        #field="slDateTimeField"
        [locale]="resolvedLocale()"
        [timeZone]="resolvedTimeZone()"
        [hourCycle]="resolvedHourCycle()"
        [granularity]="resolvedGranularity()"
        [calendar]="resolvedCalendar()"
        [firstDayOfWeek]="firstDayOfWeek()"
        [referenceDateTime]="referenceDateTime()"
        [size]="resolvedSize()"
        [variant]="resolvedVariant()"
        [min]="min()"
        [max]="max()"
        [minTime]="minTime()"
        [maxTime]="maxTime()"
        [isDateUnavailable]="isDateUnavailable()"
        [isTimeUnavailable]="isTimeUnavailable()"
        [clearable]="clears()"
        [relative]="relative()"
        [name]="name()"
        [disabled]="resolvedDisabled()"
        [readOnly]="readOnly()"
        [invalid]="invalid()"
        [required]="required()"
        [value]="state.held()"
        (valueChange)="request($event.value, $event.reason, $event.source)"
        (focusout)="onControlFocusOut($event)"
      >
        <span slDateTimeFieldEnd>
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
        <div slPickerPanel kind="datetime" [showing]="showing()">
          @if (presetViews().length > 0) {
            <div slPickerRail [presets]="presetViews()">
              <div
                slPickerJump
                [locale]="resolvedLocale()"
                [max]="dates().max"
                [min]="dates().min"
                [months]="1"
                [selected]="selectedMonths()"
                [shown]="shownPage()"
                [today]="now().date"
                (jump)="jump($event)"
              ></div>
            </div>
          }

          <div
            slPickerHead
            [empty]="head().empty"
            [invalid]="refused()"
            [meta]="head().meta"
            [shown]="layer.narrow() ? showing() === 'day' : undefined"
            [value]="head().value"
            (revealed)="showing.set('day')"
          >
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
          </div>

          <div slPickerBody>
            <div
              slCalendar
              #calendar="slCalendar"
              [locale]="resolvedLocale()"
              [timeZone]="resolvedTimeZone()"
              [today]="statedToday()"
              [firstDayOfWeek]="firstDayOfWeek()"
              [min]="dates().min"
              [max]="dates().max"
              [defaultFocusedDate]="anchor()"
              [focusedDate]="focused()"
              [isDateUnavailable]="refusesDay()"
              [fixedWeeks]="true"
              [weekNumbers]="weekNumbers()"
              [readOnly]="!editable()"
              [value]="draft().date"
              [view]="view()"
              (focusedDateChange)="focused.set($event.value)"
              (pageChange)="page.set($event)"
              (viewChange)="view.set($event)"
              (valueChange)="takeDay($event)"
            ></div>
          </div>

          <div slPickerSide>
            <div
              slPickerTimeHead
              [label]="words('time')"
              [meta]="timeMeta()"
              [shown]="layer.narrow() ? showing() === 'time' : undefined"
              (revealed)="showing.set('time')"
            >
              <div
                slTimeField
                size="sm"
                variant="plain"
                [attr.aria-label]="words('time')"
                [locale]="resolvedLocale()"
                [timeZone]="resolvedTimeZone()"
                [hourCycle]="resolvedHourCycle()"
                [granularity]="resolvedGranularity()"
                [readOnly]="!editable()"
                [value]="draft().time"
                (valueChange)="typeTime($event.value, $event.source)"
              ></div>
            </div>

            <div slPickerBody>
              <div
                slClock
                [attr.aria-label]="words('time')"
                [locale]="resolvedLocale()"
                [hourCycle]="resolvedHourCycle()"
                [granularity]="resolvedGranularity()"
                [min]="times().min"
                [max]="times().max"
                [isTimeUnavailable]="times().isTimeUnavailable"
                [now]="now().time"
                [options]="options()"
                [readOnly]="!editable()"
                [step]="resolvedStep()"
                [value]="draft().time"
                (valueChange)="takeTime($event)"
              >
                @if (slot(); as slot) {
                  <ng-template slClockSlot let-time let-state="state">
                    <ng-container
                      [ngTemplateOutlet]="slot.template"
                      [ngTemplateOutletContext]="{ $implicit: time, date: draft().date, state }"
                    />
                  </ng-template>
                }
              </div>

              @if (offsetViews().length > 0) {
                <div
                  slPickerGroup
                  part="offsets"
                  [chips]="offsetViews()"
                  [label]="words('now')"
                ></div>
              }
            </div>
          </div>

          @if (footerShown()) {
            <div
              slPickerFooter
              [clearable]="clears()"
              [canApply]="canApply()"
              [canClear]="!isEmpty()"
              [confirm]="resolvedConfirm()"
              [hint]="hint()"
              [invalid]="refused()"
              (applied)="apply($event)"
              (cleared)="clear($event)"
            >
              <ng-content select="[slDateTimePickerFooter]">{{ hint() }}</ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: '../../../styles/src/datetime-picker/datetime-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'datetime-picker',
    'data-ui-datetime-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-open]': "layer.isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDateTimePicker implements AfterViewInit, ControlValueAccessor, Validator, OnInit {
  readonly value = input<PlainDateTime | null | undefined>(undefined);
  readonly defaultValue = input<PlainDateTime | null | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  /** The earliest whole value: where the range starts. */
  readonly min = input<PlainDateTime | undefined>(undefined);
  /** The latest whole value: where the range ends. */
  readonly max = input<PlainDateTime | undefined>(undefined);
  /** The earliest time of every day inside the range, beside `min`. */
  readonly minTime = input<PlainTime | undefined>(undefined);
  /** The latest time of every day inside the range, beside `max`. */
  readonly maxTime = input<PlainTime | undefined>(undefined);
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime, date: PlainDate) => boolean) | undefined>(
    undefined,
  );

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /**
   * The times to offer, stated rather than stepped: a clinic open at 09:00,
   * 09:20 and 13:45.
   */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);

  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /**
   * The day it is, stated by the application: a business date, a day a server
   * answers. Unset, the clock answers in `timeZone`.
   */
  readonly today = input<PlainDate | undefined>(undefined);
  readonly hourCycle = input<DateTimePickerHourCycle | undefined>(undefined);
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  readonly calendar = input<'gregory' | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /**
   * The moment it is: what an empty field steps from, and what the panel counts
   * the distance and the steps from. Unset, the clock is read.
   */
  readonly referenceDateTime = input<PlainDateTime | undefined>(undefined);

  readonly size = input<DateTimePickerSize | undefined>(undefined);
  readonly variant = input<DateTimePickerVariant | undefined>(undefined);
  readonly placement = input<DateTimePickerPlacement | undefined>(undefined);
  /**
   * Whether the panel keeps a draft until Apply. `false` writes a whole moment
   * on every press, and closes on the one that completes it. On by default.
   */
  readonly confirm = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  readonly clearable = input(false, { transform: booleanAttribute });
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly name = input<string | undefined>(undefined);

  /** The consumer's own shortcuts, after `Now`. The panel writes what each one is. */
  readonly presets = input<readonly PickerPreset<PlainDateTime>[]>([]);
  /** Steps from now, in seconds. An empty list draws none. */
  readonly offsets = input<readonly number[]>(DATE_TIME_PICKER_OFFSETS);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, and what the panel says of a refused moment.
   */
  readonly messages = input<PartialMessages<DatetimePickerMessages> | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<PlainDateTime | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();

  /** What one whole time of `options` draws. The button around it is the clock's. */
  protected readonly slot = contentChild(SlClockSlot);
  private readonly calendarRef = viewChild<SlCalendar>('calendar');
  private readonly clockRef = viewChild(SlClock);
  private readonly field = viewChild<SlDateTimeField>('field');
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDateTimePickerDefaults();
  private readonly appLocale = injectLocale();
  private readonly enclosing = inject(SlField, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly t = injectMessages(datetimePickerMessages, this.messages);
  protected readonly words = injectMessages(pickerPanelMessages);

  private readonly clock = signal<PlainDateTime>({
    date: { year: 2026, month: 1, day: 1 },
    time: { hour: 12, minute: 0, second: 0 },
  });
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly focused = signal<PlainDate | undefined>(undefined);
  protected readonly page = signal<PlainYearMonth | null>(null);
  protected readonly showing = signal<PickerShowing>('day');
  protected readonly view = signal<CalendarView>('day');

  private onChangeFn: (value: PlainDateTime | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedHourCycle = computed(
    () => this.hourCycle() ?? this.defaults.hourCycle,
  );
  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly resolvedStep = computed(() => this.step() ?? this.defaults.step);
  protected readonly resolvedConfirm = computed(() => this.confirm() ?? this.defaults.confirm);
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
  private readonly ownFooter = contentChild(SlDateTimePickerFooter);
  /** With nothing to say and no action to offer, there is no footer. */
  protected readonly footerShown = computed(
    () =>
      this.clears() ||
      this.resolvedConfirm() ||
      this.refused() ||
      this.hint() !== '' ||
      this.ownFooter() !== undefined,
  );
  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  protected readonly state = new PickerValue<PlainDateTime | null>(
    this.value,
    null,
    isSameDateTime,
    (request) => this.valueChange.emit(request),
  );
  protected readonly layer = new PickerLayer({
    focusPanel: (panel) => this.focusDay(panel),
    left: () => {
      this.draft.set(momentDraft(this.state.held()));
      this.showing.set('day');
    },
    onEscape: () => this.walkDown(),
    open: this.open,
    placement: computed(() => this.placement() ?? this.defaults.placement),
    requested: (request) => this.openChange.emit(request),
    root: this.element,
    trigger: () => this.trigger()?.nativeElement,
  });
  protected readonly draft = pickerDraft<MomentDraft>(
    computed(() => momentDraft(this.state.held())),
    isSameMomentDraft,
  );

  private readonly rules = computed((): MomentRules => ({
    isDateUnavailable: this.isDateUnavailable(),
    isTimeUnavailable: this.isTimeUnavailable(),
    max: this.max(),
    maxTime: this.maxTime(),
    min: this.min(),
    minTime: this.minTime(),
  }));
  protected readonly dates = computed(() => dateBoundsOf(this.rules()));
  protected readonly refusesDay = computed(() => {
    const rules = this.rules();

    return (date: PlainDate) => isRefusedDay(date, rules);
  });
  protected readonly times = computed(() => dayTimes(this.draft().date, this.rules()));

  private readonly calendarDefaults = injectCalendarDefaults();
  /** The day the application states: on the picker, on its provider, or on the calendars'. */
  protected readonly statedToday = computed(
    () => this.today() ?? this.defaults.today ?? this.calendarDefaults.today,
  );
  /** The moment it is, on the day the application states. */
  protected readonly now = computed(() => {
    const now = this.referenceDateTime() ?? this.clock();
    const today = this.statedToday();

    return today === undefined ? now : { ...now, date: today };
  });

  /**
   * Validity the family owns, beside the validity the consumer states: both
   * pairs of bounds, and both predicates.
   */
  protected readonly resolvedInvalid = computed(() => {
    const held = this.state.held();
    if (held !== null && isRefusedMoment(held, this.rules())) return true;

    return this.invalid() ?? this.enclosing?.invalid();
  });

  /**
   * The trigger's accessible name. Focus returns here when the surface closes,
   * so this is where the reader is told what was chosen.
   */
  protected readonly triggerLabel = computed(() => {
    const held = this.state.held();
    if (held === null) return this.t('choose');

    const format = createDateTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.resolvedHourCycle(),
      locale: this.resolvedLocale(),
    });

    return this.t('change', { date: format.describe(held) });
  });

  private readonly moment = computed(() => momentOf(this.draft()));
  protected readonly refused = computed(() => {
    const moment = this.moment();

    return moment !== null && isRefusedMoment(moment, this.rules());
  });
  protected readonly isEmpty = computed(
    () => this.draft().date === null && this.draft().time === null,
  );
  protected readonly canApply = computed(() =>
    this.moment() === null ? this.isEmpty() && this.state.held() !== null : !this.refused(),
  );

  protected readonly anchor = computed(() => this.draft().date ?? this.now().date);
  protected readonly shownPage = computed(() => this.page() ?? this.focused() ?? this.anchor());
  protected readonly selectedMonths = computed((): readonly [number, number] | null => {
    const date = this.draft().date;
    if (date === null) return null;

    const month = date.year * 12 + date.month;

    return [month, month];
  });

  protected readonly head = computed(() =>
    dateTimeHead(this.draft().date, this.now().date, this.resolvedLocale(), this.words),
  );
  protected readonly timeMeta = computed(() => {
    const moment = this.moment();
    const zone = this.resolvedTimeZone();
    if (zone !== undefined) return zone;

    return moment === null ? '' : momentMeta(moment, this.now(), this.resolvedLocale(), this.words);
  });
  protected readonly hint = computed(() => {
    if (this.refused()) return this.t('refused');
    if (this.options() !== undefined) return '';

    const length = durationLabel(this.resolvedStep(), this.resolvedLocale(), 'second');

    return this.words('every', { length });
  });

  private readonly shortcuts = computed(() => ({
    choose: (moment: PlainDateTime, event: Event) => this.choose(moment, event),
    granularity: this.resolvedGranularity(),
    hourCycle: this.resolvedHourCycle(),
    locale: this.resolvedLocale(),
    moment: this.moment(),
    now: this.now(),
    rules: this.rules(),
  }));
  /* A stated list holds the only times there are: no Now, and no steps from it. */
  protected readonly presetViews = computed(() => {
    const stated = this.presets();
    if (stated.length === 0) return [];

    const first =
      this.options() === undefined ? [{ label: this.words('now'), value: this.now() }] : [];

    return momentPresetViews({ ...this.shortcuts(), presets: [...first, ...stated] });
  });
  protected readonly offsetViews = computed(() =>
    momentOffsetViews({
      ...this.shortcuts(),
      offsets: this.options() === undefined ? this.offsets() : [],
    }),
  );

  constructor() {
    /* A rule that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.rules();
      this.onValidatorChangeFn();
    });

    /* A native reset restores the hidden input and tells nothing. A picker bound
       to a form model takes the model's reset value through `writeValue`. */
    afterNextRender(() => {
      const form = this.element.closest('form');
      const reset = (event: Event) => {
        if (!this.formBound) this.state.reset(event);
      };
      form?.addEventListener('reset', reset);
      this.destroyRef.onDestroy(() => form?.removeEventListener('reset', reset));
    });
  }

  ngOnInit(): void {
    const { date, time } = nowDateTimeIn(this.resolvedTimeZone());
    this.layer.start(this.defaultOpen());
    this.state.start(this.defaultValue() ?? null);
    this.clock.set({ date, time: { ...time, second: 0 } });
  }

  /**
   * A day typed without a time leaves the value `null`, so the picker's own
   * value never moves; the field's validity does. The field says so on every
   * edit, and the form is told.
   */
  ngAfterViewInit(): void {
    this.field()?.registerOnValidatorChange(() => this.onValidatorChangeFn());
  }

  writeValue(value: PlainDateTime | null | undefined): void {
    this.state.start(value ?? null);
  }

  registerOnChange(fn: (value: PlainDateTime | null) => void): void {
    this.onChangeFn = fn;
    this.formBound = true;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChangeFn = fn;
  }

  /**
   * The rules no other validator can see, under the names `datetime-field`
   * reports them with, because the field holds the bounds, the predicates and
   * the half the reader has not written. `required` is left to Angular's own.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    return this.field()?.validate(control) ?? null;
  }

  /** Puts focus on the first segment of the field. */
  focus(): void {
    this.field()?.focus();
  }

  openSurface(source?: Event): void {
    this.layer.show('keyboard', source);
  }

  closeSurface(source?: Event): void {
    this.layer.setOpen(false, 'keyboard', source);
  }

  protected onControlKeydown(event: KeyboardEvent): void {
    if (!this.editable() || !isOpenChord(event)) return;

    event.preventDefault();
    this.layer.show('keyboard', event, false);
  }

  protected onControlFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.contains(next)) return;

    this.onTouchedFn();
  }

  protected request(next: PlainDateTime | null, reason: ChangeReason, source: unknown): void {
    if (this.state.request(next, reason, source)) this.onChangeFn(next);
  }

  /**
   * A day is half of the answer: the time is next, unless it is already there
   * and both are on screen.
   */
  protected takeDay({ source, value }: ChangeRequest<CalendarValue>): void {
    const date = asDates(value)[0];
    if (date === undefined) return;

    const time = this.draft().time;
    this.draft.set({ date, time });
    if (this.layer.narrow()) this.showing.set('time');
    if (this.layer.narrow() || time === null) this.focusClock();
    this.keep(source);
  }

  protected takeTime({ source, unit, value }: ClockChangeRequest): void {
    const finest = clockFinest(this.resolvedGranularity(), this.resolvedStep());
    const complete = unit === 'slot' || unit === finest;
    this.draft.set({ ...this.draft(), time: value });

    const moment = this.moment();
    if (complete && moment === null && this.layer.narrow()) this.showing.set('day');
    if (complete && moment !== null && !this.resolvedConfirm()) this.write(moment, source);
  }

  /** Typed in the head: without a draft to confirm, a whole moment is written as it is. */
  protected typeTime(time: PlainTime | null, source: unknown): void {
    this.draft.set({ ...this.draft(), time });

    const moment = this.moment();
    if (!this.resolvedConfirm() && moment !== null) this.request(moment, 'select', source);
  }

  protected stepDay(direction: 1 | -1, source: Event): void {
    const from =
      this.draft().date ??
      stepToDay(this.now().date, direction === 1 ? -1 : 1, () => false) ??
      this.now().date;
    const date = stepToDay(from, direction, this.refusesDay());
    if (date === null) return;

    this.focused.set(date);
    this.draft.set({ ...this.draft(), date });
    this.keep(source);
  }

  protected jump({ month, year }: PlainYearMonth): void {
    this.view.set('day');
    this.focused.set({ year, month, day: 1 });
  }

  protected apply(source: Event): void {
    if (this.canApply()) this.write(this.moment(), source);
  }

  protected clear(source: Event): void {
    this.draft.set(momentDraft(null));
    if (!this.resolvedConfirm()) this.write(null, source, 'clear');
  }

  /* A shortcut is a whole answer: without a draft to confirm, it is written. */
  private choose(moment: PlainDateTime, source: Event): void {
    this.focused.set(moment.date);
    this.draft.set(moment);
    if (!this.resolvedConfirm()) this.write(moment, source);
  }

  /** Without a draft to confirm, a whole moment is written and the panel stays. */
  private keep(source: unknown): void {
    const moment = this.moment();
    if (this.resolvedConfirm() || moment === null || this.refused()) return;

    this.request(moment, 'select', source);
  }

  private write(
    next: PlainDateTime | null,
    source: unknown,
    reason: ChangeReason = 'select',
  ): void {
    this.request(next, reason, source);
    this.layer.finish(source);
  }

  /** Escape walks the calendar's view down before it closes the panel. */
  private walkDown(): boolean {
    if (this.view() === 'day') return false;

    this.view.set(this.view() === 'year' ? 'month' : 'day');

    return true;
  }

  /** The grid pages to the chosen day first, and focus waits for that render. */
  private focusDay(panel: HTMLElement): void {
    this.calendarRef()?.focusDate(this.anchor());
    afterNextRender(
      () =>
        panel
          .querySelector<HTMLElement>('[data-part="day"][tabindex="0"]')
          ?.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }

  /** In one column the clock is on screen only after the part changes. */
  private focusClock(): void {
    afterNextRender(() => this.clockRef()?.focus(), { injector: this.injector });
  }
}
