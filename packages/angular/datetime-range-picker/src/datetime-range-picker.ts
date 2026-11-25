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
import type { OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { injectCalendarDefaults, isRange, SlCalendar } from '@slotted/angular/calendar';
import type { CalendarValue, CalendarView } from '@slotted/angular/calendar';
import { SlClock, SlClockSlot } from '@slotted/angular/clock';
import type { ClockChangeRequest } from '@slotted/angular/clock';
import { SlDateTimeField } from '@slotted/angular/datetime-field';
import { SlField } from '@slotted/angular/field';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  pickerDraft,
  PickerLayer,
  PickerValue,
  SlPickerBody,
  SlPickerClocks,
  SlPickerCurrent,
  SlPickerFooter,
  SlPickerGroup,
  SlPickerHalf,
  SlPickerHalfPart,
  SlPickerJump,
  SlPickerLayer,
  SlPickerPanel,
  SlPickerRail,
  SlPickerRangeHead,
  SlPickerSpan,
  SlPickerTrigger,
} from '@slotted/angular/picker-panel';
import type { PickerShowing } from '@slotted/angular/picker-panel';
import {
  clockFinest,
  closingMoments,
  dateBoundsOf,
  dateTimeRangeProblems,
  dayTimes,
  isPastRunLimit,
  isSameMomentRunDraft,
  missingHalf,
  momentDraft,
  momentOf,
  momentRunDraft,
  momentRunOf,
  nowDateTimeIn,
  orderedRun,
  runDayRefusal,
  toISODateTime,
  withRunDays,
} from '@slotted/core/date';
import type {
  MomentDraft,
  MomentRunDraft,
  MomentRunRules,
  PickerPreset,
  PlainDate,
  PlainDateTime,
  PlainTime,
  PlainYearMonth,
} from '@slotted/core/date';
import { datetimeRangePickerMessages, pickerPanelMessages } from '@slotted/core/i18n';
import type { DatetimeRangePickerMessages, PartialMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import {
  DATETIME_RANGE_PICKER_DURATIONS,
  momentRunDurationViews,
  momentRunPresetViews,
  momentRunSpanView,
} from './datetime-range-panel';
import { SlDateTimeRangePickerFooter } from './datetime-range-picker-parts';
import { injectDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type {
  DateTimeRange,
  DateTimeRangePickerCalendar,
  DateTimeRangePickerDefaults,
  DateTimeRangePickerHourCycle,
  DateTimeRangePickerPlacement,
  DateTimeRangePickerPosition,
  DateTimeRangePickerSize,
  DateTimeRangePickerVariant,
} from './datetime-range-picker-defaults';
import {
  isSameDateTimeRange,
  isTakenRun,
  momentEndWords,
  momentLimitWords,
  momentRefusalWords,
  momentSummary,
  momentTriggerName,
  normalizeMoments,
} from './datetime-range-words';
import type { DateTimeRangeWords } from './datetime-range-words';

/** An input an attribute may state, and `undefined` leaves to what is around the picker. */
function optionalBoolean(value: boolean | string | undefined): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null ? undefined : numberAttribute(value);
}

/**
 * A one-line frame — the run in words, a clear and the trigger — and behind it
 * the months of the run over a clock for each end.
 *
 * **The frame is one line at any width.** Two segmented fields in it broke it
 * into two lines in any column narrower than they are. They live in the head
 * of the panel, where the width is the panel's.
 *
 * **The press that leaves a half missing brings its grid.** A day, then its
 * time, then the other end: four presses, and the reader is never asked which
 * grid comes next.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the run as it was.
 */
@Component({
  selector: '[slDateTimeRangePicker]',
  standalone: true,
  exportAs: 'slDateTimeRangePicker',
  imports: [
    NgTemplateOutlet,
    SlCalendar,
    SlClock,
    SlClockSlot,
    SlDateTimeField,
    SlGlyph,
    SlIcon,
    SlPickerBody,
    SlPickerClocks,
    SlPickerCurrent,
    SlPickerFooter,
    SlPickerGroup,
    SlPickerHalf,
    SlPickerHalfPart,
    SlPickerJump,
    SlPickerLayer,
    SlPickerPanel,
    SlPickerRail,
    SlPickerRangeHead,
    SlPickerSpan,
    SlPickerTrigger,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlDateTimeRangePicker),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateTimeRangePicker), multi: true },
  ],
  template: `
    <div data-part="control" data-part-control="">
      <button
        #trigger
        slPickerTrigger
        glyph="calendar"
        [disabled]="!editable()"
        [label]="triggerLabel()"
        [layer]="layer"
        (blur)="onTriggerBlur()"
      >
        <span
          data-part="summary"
          data-part-summary=""
          [attr.data-placeholder]="summary() === null ? '' : null"
          >{{ summary() ?? t('choose') }}</span
        >
      </button>
      @if (clears() && state.held() !== null) {
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
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="startName() ?? null"
        [value]="posted(state.held()?.start)"
      />
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="endName() ?? null"
        [value]="posted(state.held()?.end)"
      />
    </div>

    @if (layer.isOpen()) {
      <div slPickerLayer [label]="triggerLabel()" [layer]="layer" (applied)="apply($event)">
        <div slPickerPanel kind="datetime-range" [showing]="showing()">
          @if (presetViews().length > 0 || durationViews().length > 0) {
            <div slPickerRail [presets]="presetViews()">
              @if (durationViews().length > 0) {
                <div slPickerGroup [chips]="durationViews()" [label]="words('duration')"></div>
              }
              <div
                slPickerJump
                [locale]="resolvedLocale()"
                [max]="dates().max"
                [min]="dates().min"
                [months]="shownMonths()"
                [selected]="selectedMonths()"
                [shown]="shownPage()"
                [today]="now().date"
                (jump)="jump($event)"
              ></div>
            </div>
          }

          <div slPickerRangeHead>
            <div
              slPickerHalf
              [current]="currentPosition() === 'start'"
              [empty]="startWords().empty"
              [label]="t('start')"
              [meta]="startWords().meta"
              (entered)="enter('start', 'pointer')"
            >
              @if (isTyped(draft().start)) {
                <div
                  slDateTimeField
                  size="sm"
                  variant="plain"
                  [attr.aria-label]="t('start')"
                  [label]="t('start')"
                  [locale]="resolvedLocale()"
                  [timeZone]="resolvedTimeZone()"
                  [hourCycle]="resolvedHourCycle()"
                  [granularity]="resolvedGranularity()"
                  [calendar]="resolvedCalendar()"
                  [firstDayOfWeek]="resolvedFirstDayOfWeek()"
                  [yearPivot]="yearPivot()"
                  [referenceDateTime]="referenceDateTime()"
                  [relative]="relative()"
                  [min]="min()"
                  [max]="max()"
                  [minTime]="minTime()"
                  [maxTime]="maxTime()"
                  [isDateUnavailable]="isDateUnavailable()"
                  [isTimeUnavailable]="isTimeUnavailable()"
                  [readOnly]="!editable()"
                  [value]="moments().start"
                  (valueChange)="type('start', $event.value, $event.source)"
                ></div>
              } @else {
                <button
                  slPickerHalfPart="day"
                  [current]="currentPosition() === 'start'"
                  (click)="bring('start', 'day', $event)"
                >
                  {{ startWords().day }}
                </button>
                <button
                  slPickerHalfPart="time"
                  [current]="currentPosition() === 'start'"
                  (click)="bring('start', 'time', $event)"
                >
                  {{ startWords().time }}
                </button>
              }
            </div>
            <div slPickerSpan [span]="span()"></div>
            <div
              slPickerHalf
              [current]="currentPosition() === 'end'"
              [empty]="endWords().empty"
              [invalid]="refusal() !== null"
              [label]="t('end')"
              [meta]="endWords().meta"
              (entered)="enter('end', 'pointer')"
            >
              @if (isTyped(draft().end)) {
                <div
                  slDateTimeField
                  size="sm"
                  variant="plain"
                  [attr.aria-label]="t('end')"
                  [label]="t('end')"
                  [locale]="resolvedLocale()"
                  [timeZone]="resolvedTimeZone()"
                  [hourCycle]="resolvedHourCycle()"
                  [granularity]="resolvedGranularity()"
                  [calendar]="resolvedCalendar()"
                  [firstDayOfWeek]="resolvedFirstDayOfWeek()"
                  [yearPivot]="yearPivot()"
                  [referenceDateTime]="referenceDateTime()"
                  [relative]="relative()"
                  [min]="min()"
                  [max]="max()"
                  [minTime]="minTime()"
                  [maxTime]="maxTime()"
                  [isDateUnavailable]="isDateUnavailable()"
                  [isTimeUnavailable]="isTimeUnavailable()"
                  [readOnly]="!editable()"
                  [value]="moments().end"
                  (valueChange)="type('end', $event.value, $event.source)"
                ></div>
              } @else {
                <button
                  slPickerHalfPart="day"
                  [current]="currentPosition() === 'end'"
                  (click)="bring('end', 'day', $event)"
                >
                  {{ endWords().day }}
                </button>
                <button
                  slPickerHalfPart="time"
                  [current]="currentPosition() === 'end'"
                  (click)="bring('end', 'time', $event)"
                >
                  {{ endWords().time }}
                </button>
              }
            </div>
          </div>

          <div slPickerBody>
            <div
              slCalendar
              #calendar="slCalendar"
              selectionMode="range"
              [locale]="resolvedLocale()"
              [timeZone]="resolvedTimeZone()"
              [today]="statedToday()"
              [firstDayOfWeek]="resolvedFirstDayOfWeek()"
              [min]="dates().min"
              [max]="dates().max"
              [defaultFocusedDate]="anchor()"
              [focusedDate]="focused()"
              [isDateOver]="isOver()"
              [isDateUnavailable]="refusesDay()"
              [months]="shownMonths()"
              [weekNumbers]="weekNumbers()"
              [fixedWeeks]="fixedWeeks()"
              [readOnly]="!editable()"
              [value]="calendarValue()"
              [view]="view()"
              (focusedDateChange)="focused.set($event.value)"
              (pageChange)="page.set($event)"
              (viewChange)="view.set($event)"
              (previewChange)="preview.set($event)"
              (valueChange)="takeDays($event)"
            ></div>
          </div>

          <div slPickerClocks>
            <div
              slClock
              #startClock="slClock"
              [slPickerCurrent]="currentPosition() === 'start'"
              [attr.aria-label]="t('start')"
              [locale]="resolvedLocale()"
              [hourCycle]="resolvedHourCycle()"
              [granularity]="resolvedGranularity()"
              [min]="startTimes().min"
              [max]="startTimes().max"
              [isTimeUnavailable]="startTimes().isTimeUnavailable"
              [now]="now().time"
              [options]="options()"
              [readOnly]="!editable()"
              [step]="resolvedStep()"
              [value]="draft().start.time"
              (focusin)="enter('start', 'keyboard')"
              (valueChange)="takeTime('start', $event)"
            >
              @if (slot(); as slot) {
                <ng-template slClockSlot let-time let-state="state">
                  <ng-container
                    [ngTemplateOutlet]="slot.template"
                    [ngTemplateOutletContext]="{
                      $implicit: time,
                      date: draft().start.date,
                      position: 'start',
                      state,
                    }"
                  />
                </ng-template>
              }
            </div>
            <div
              slClock
              #endClock="slClock"
              [slPickerCurrent]="currentPosition() === 'end'"
              [attr.aria-label]="t('end')"
              [locale]="resolvedLocale()"
              [hourCycle]="resolvedHourCycle()"
              [granularity]="resolvedGranularity()"
              [min]="endTimes().min"
              [max]="endTimes().max"
              [isTimeUnavailable]="endTimes().isTimeUnavailable"
              [now]="now().time"
              [options]="options()"
              [readOnly]="!editable()"
              [step]="resolvedStep()"
              [value]="draft().end.time"
              (focusin)="enter('end', 'keyboard')"
              (valueChange)="takeTime('end', $event)"
            >
              @if (slot(); as slot) {
                <ng-template slClockSlot let-time let-state="state">
                  <ng-container
                    [ngTemplateOutlet]="slot.template"
                    [ngTemplateOutletContext]="{
                      $implicit: time,
                      date: draft().end.date,
                      position: 'end',
                      state,
                    }"
                  />
                </ng-template>
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
              [invalid]="refusal() !== null"
              (applied)="apply($event)"
              (cleared)="clearDraft($event)"
            >
              <ng-content select="[slDateTimeRangePickerFooter]">{{ hint() }}</ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: '../../../styles/src/datetime-range-picker/datetime-range-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'datetime-range-picker',
    'data-ui-datetime-range-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-open]': "layer.isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDateTimeRangePicker implements ControlValueAccessor, Validator, OnInit {
  readonly value = input<DateTimeRange | null | undefined>(undefined);
  readonly defaultValue = input<DateTimeRange | null | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Present means the consumer owns which end is being edited. */
  readonly position = input<DateTimeRangePickerPosition | undefined>(undefined);
  readonly defaultPosition = input<DateTimeRangePickerPosition>('start');

  /** The whole-value bounds: where the range starts and ends. */
  readonly min = input<PlainDateTime | undefined>(undefined);
  readonly max = input<PlainDateTime | undefined>(undefined);
  /** The bounds of every day inside the range, applied together with the two above. */
  readonly minTime = input<PlainTime | undefined>(undefined);
  readonly maxTime = input<PlainTime | undefined>(undefined);
  /** Answers a whole day and feeds the grid. */
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);
  /** Answers one time on one day and feeds the clocks. */
  readonly isTimeUnavailable = input<((time: PlainTime, date: PlainDate) => boolean) | undefined>(
    undefined,
  );
  /**
   * Whether a run may cross an unavailable day. On, and with a start chosen,
   * the days beyond the first unavailable one are refused in the grid, and on
   * the same day the times beyond the first unavailable one in the clock of the
   * end.
   */
  readonly contiguous = input(true, { transform: booleanAttribute });
  /** The shortest and longest run allowed, in seconds. */
  readonly minLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly lengthLabel = input<DateTimeRangePickerDefaults['lengthLabel'] | undefined>(undefined);

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** The times to offer, stated rather than stepped; the same list for both ends. */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);

  readonly months = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /** Six rows whatever the months need. Off: two months end where the longer one does. */
  readonly fixedWeeks = input(false, { transform: booleanAttribute });

  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /**
   * The day it is, stated by the application: a business date, a day a server
   * answers. Unset, the clock answers in `timeZone`.
   */
  readonly today = input<PlainDate | undefined>(undefined);
  readonly hourCycle = input<DateTimeRangePickerHourCycle | undefined>(undefined);
  readonly granularity = input<DateTimeRangePickerDefaults['granularity'] | undefined>(undefined);
  readonly calendar = input<DateTimeRangePickerCalendar | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly yearPivot = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** What "now" is, for a story or a test; the clock otherwise. */
  readonly referenceDateTime = input<PlainDateTime | undefined>(undefined);

  readonly size = input<DateTimeRangePickerSize | undefined>(undefined);
  readonly variant = input<DateTimeRangePickerVariant | undefined>(undefined);
  readonly placement = input<DateTimeRangePickerPlacement | undefined>(undefined);
  /**
   * Whether the panel keeps a draft until Apply. `false` writes a whole run on
   * every press, and closes on the one that completes it. On by default.
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

  /** Draws one clear on the frame, which empties both ends. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Whether the fields of the two ends take the relative expression. */
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  /** The consumer's own shortcuts. The panel writes the run each one is. */
  readonly presets = input<readonly PickerPreset<DateTimeRange>[]>([]);
  /** Lengths the run can take from its start, in seconds. An empty list draws none. */
  readonly durations = input<readonly number[]>(DATETIME_RANGE_PICKER_DURATIONS);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's names, the two ends, the limits, and what is said of a refused run.
   */
  readonly messages = input<PartialMessages<DatetimeRangePickerMessages> | undefined>(undefined);
  /** The names of the two hidden inputs a plain form post reads. */
  readonly startName = input<string | undefined>(undefined);
  readonly endName = input<string | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<DateTimeRange | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly positionChange = output<ChangeRequest<DateTimeRangePickerPosition>>();

  /** What one whole time of `options` draws. The button around it is the clock's. */
  protected readonly slot = contentChild(SlClockSlot);
  private readonly calendarRef = viewChild<SlCalendar>('calendar');
  private readonly startClock = viewChild<SlClock>('startClock');
  private readonly endClock = viewChild<SlClock>('endClock');
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDateTimeRangePickerDefaults();
  private readonly appLocale = injectLocale();
  private readonly enclosing = inject(SlField, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  protected readonly t = injectMessages(datetimeRangePickerMessages, this.messages);
  protected readonly words = injectMessages(pickerPanelMessages);

  private readonly clock = signal<PlainDateTime>({
    date: { year: 2026, month: 1, day: 1 },
    time: { hour: 12, minute: 0, second: 0 },
  });
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private readonly ownPosition = signal<DateTimeRangePickerPosition>('start');
  protected readonly focused = signal<PlainDate | undefined>(undefined);
  protected readonly page = signal<PlainYearMonth | null>(null);
  protected readonly preview = signal<PlainDate | null>(null);
  protected readonly showing = signal<PickerShowing>('day');
  protected readonly view = signal<CalendarView>('day');

  private onChangeFn: (value: DateTimeRange | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly currentPosition = computed(() => this.position() ?? this.ownPosition());
  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedHourCycle = computed(
    () => this.hourCycle() ?? this.defaults.hourCycle,
  );
  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly resolvedFirstDayOfWeek = computed(
    () => this.firstDayOfWeek() ?? this.defaults.firstDayOfWeek,
  );
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
  private readonly ownFooter = contentChild(SlDateTimeRangePickerFooter);
  /** With nothing to say and no action to offer, there is no footer. */
  protected readonly footerShown = computed(
    () =>
      this.clears() ||
      this.resolvedConfirm() ||
      this.refusal() !== null ||
      this.hint() !== '' ||
      this.ownFooter() !== undefined,
  );
  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  protected readonly state = new PickerValue<DateTimeRange | null>(
    computed(() => {
      const value = this.value();

      return value === undefined ? undefined : normalizeMoments(value);
    }),
    null,
    isSameDateTimeRange,
    (request) => this.valueChange.emit(request),
  );
  protected readonly layer = new PickerLayer({
    focusPanel: (panel) => this.focusDay(panel),
    left: () => {
      this.draft.set(momentRunDraft(this.state.held()));
      this.showing.set('day');
    },
    onEscape: () => this.walkDown(),
    open: this.open,
    placement: computed(() => this.placement() ?? this.defaults.placement),
    requested: (request) => this.openChange.emit(request),
    root: this.element,
    trigger: () => this.trigger()?.nativeElement,
  });
  protected readonly shownMonths = computed(() =>
    this.layer.narrow() ? 1 : (this.months() ?? this.defaults.months),
  );
  protected readonly draft = pickerDraft<MomentRunDraft>(
    computed(() => momentRunDraft(this.state.held())),
    isSameMomentRunDraft,
  );
  protected readonly moments = computed(() => ({
    end: momentOf(this.draft().end),
    start: momentOf(this.draft().start),
  }));

  private readonly rules = computed((): MomentRunRules => ({
    contiguous: this.contiguous(),
    max: this.max(),
    maxLength: this.maxLength(),
    maxTime: this.maxTime(),
    min: this.min(),
    minLength: this.minLength(),
    minTime: this.minTime(),
    options: this.options(),
    step: this.resolvedStep(),
    unavailableDay: this.isDateUnavailable(),
    unavailableTime: this.isTimeUnavailable(),
  }));
  private readonly rangeWords = computed((): DateTimeRangeWords => ({
    granularity: this.resolvedGranularity(),
    hourCycle: this.resolvedHourCycle(),
    lengthLabel: this.lengthLabel() ?? this.defaults.lengthLabel,
    locale: this.resolvedLocale(),
    rules: this.rules(),
    t: this.t,
    timeZone: this.resolvedTimeZone(),
    today: this.now().date,
    words: this.words,
  }));

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
  protected readonly dates = computed(() => dateBoundsOf(this.rules()));

  /** The start whose end the next press in the grid closes. */
  private readonly openStart = computed((): MomentDraft => {
    const { end, start } = this.draft();
    const isOpen = start.date !== null && (this.currentPosition() === 'end' || end.date === null);

    return isOpen ? start : momentDraft(null);
  });
  protected readonly calendarValue = computed<CalendarValue>(() => {
    const { end, start } = this.draft();

    return this.openStart().date === null
      ? { start: start.date, end: end.date }
      : { start: start.date, end: null };
  });
  protected readonly refusesDay = computed(() => runDayRefusal(this.openStart(), this.rules()));
  protected readonly isOver = computed(() => {
    const [draft, rules] = [this.draft(), this.rules()];

    return (date: PlainDate) => isPastRunLimit(draft, date, rules);
  });
  protected readonly startTimes = computed(() => {
    const rules = this.rules();

    return dayTimes(this.draft().start.date, {
      ...rules,
      isDateUnavailable: rules.unavailableDay,
      isTimeUnavailable: rules.unavailableTime,
    });
  });
  protected readonly endTimes = computed(() =>
    closingMoments(this.moments().start, this.draft().end.date, this.rules()),
  );

  private readonly problems = computed(() =>
    dateTimeRangeProblems(this.state.held(), this.rules()),
  );
  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicates, the order of the two ends and the duration.
   */
  protected readonly resolvedInvalid = computed(() => {
    if (this.invalid() !== undefined) return this.invalid();
    if (this.problems().length > 0) return true;

    return this.enclosing?.invalid();
  });

  protected readonly summary = computed(() => momentSummary(this.state.held(), this.rangeWords()));
  protected readonly triggerLabel = computed(() =>
    momentTriggerName(this.state.held(), this.rangeWords()),
  );
  protected readonly startWords = computed(() =>
    momentEndWords(this.draft().start, this.rangeWords()),
  );
  protected readonly endWords = computed(() => momentEndWords(this.draft().end, this.rangeWords()));

  private readonly run = computed(() => momentRunOf(this.draft()));
  protected readonly refusal = computed(() => momentRefusalWords(this.run(), this.rangeWords()));
  protected readonly hint = computed(() => this.refusal() ?? momentLimitWords(this.rangeWords()));
  protected readonly isEmpty = computed(() =>
    isSameMomentRunDraft(this.draft(), momentRunDraft(null)),
  );
  protected readonly canApply = computed(() => {
    if (this.refusal() !== null) return false;
    if (this.isEmpty()) return this.state.held() !== null;

    return this.moments().start !== null && this.moments().end !== null;
  });

  protected readonly anchor = computed(
    () => this.draft()[this.currentPosition()].date ?? this.draft().start.date ?? this.now().date,
  );
  protected readonly shownPage = computed(() => this.page() ?? this.focused() ?? this.anchor());
  protected readonly selectedMonths = computed((): readonly [number, number] | null => {
    const months = [this.draft().start.date, this.draft().end.date]
      .filter((date) => date !== null)
      .map(({ month, year }) => year * 12 + month);

    return months.length === 0 ? null : [Math.min(...months), Math.max(...months)];
  });

  private readonly views = computed(() => {
    const [open, pending] = [this.openStart().date, this.preview()];

    return {
      choose: (run: DateTimeRange, event: Event) => this.choose(run, event),
      draft: this.draft(),
      shown:
        open === null || pending === null
          ? this.draft()
          : withRunDays(this.draft(), orderedRun(open, pending)),
      take: (run: MomentRunDraft, event: Event) => this.take(run, event),
      words: this.rangeWords(),
    };
  });
  protected readonly span = computed(() => momentRunSpanView(this.views()));
  protected readonly presetViews = computed(() =>
    momentRunPresetViews(this.presets(), this.views()),
  );
  protected readonly durationViews = computed(() =>
    momentRunDurationViews(this.durations(), this.views()),
  );

  constructor() {
    /* A rule that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.rules();
      this.onValidatorChangeFn();
    });

    /* A native reset restores the hidden inputs and tells nothing. A picker
       bound to a form model takes the model's reset value through `writeValue`. */
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
    this.ownPosition.set(this.defaultPosition());
    this.state.start(normalizeMoments(this.defaultValue() ?? null));
    this.clock.set({ date, time: { ...time, second: 0 } });
  }

  writeValue(value: DateTimeRange | null | undefined): void {
    this.state.start(normalizeMoments(value ?? null));
  }

  registerOnChange(fn: (value: DateTimeRange | null) => void): void {
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
   * The rules no other validator can see: the bounds, the predicates, the order
   * of the two ends and the duration. `required` is left to Angular's own,
   * because a form already has a word for it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const actual = normalizeMoments((control.value as DateTimeRange | null | undefined) ?? null);
    const problems = dateTimeRangeProblems(actual, this.rules());
    if (problems.length === 0) return null;

    const { max, maxLength, min, minLength } = this.rules();
    const errors: ValidationErrors = {};
    if (problems.includes('order')) errors['slottedDateTimeRangeOrder'] = { actual };
    if (problems.includes('min')) errors['slottedDateTimeRangeMin'] = { min, actual };
    if (problems.includes('max')) errors['slottedDateTimeRangeMax'] = { max, actual };
    if (problems.includes('unavailable')) errors['slottedDateTimeRangeUnavailable'] = { actual };
    if (problems.includes('length')) {
      errors['slottedDateTimeRangeLength'] = { minLength, maxLength, actual };
    }

    return errors;
  }

  /** Puts focus on the trigger, which is the frame. */
  focus(): void {
    this.trigger()?.nativeElement.focus();
  }

  openSurface(source?: Event): void {
    this.layer.show('programmatic', source);
  }

  closeSurface(source?: Event): void {
    this.layer.setOpen(false, 'programmatic', source);
  }

  protected posted(moment: PlainDateTime | null | undefined): string {
    return moment == null ? '' : toISODateTime(moment);
  }

  protected onTriggerBlur(): void {
    this.onTouchedFn();
  }

  protected clear(source: Event): void {
    this.request(null, 'clear', source);
    this.setPosition('start', 'clear', source);
    this.focus();
  }

  /** A field writes whole moments: an end with one half is written in words instead. */
  protected isTyped({ date, time }: MomentDraft): boolean {
    return !this.layer.narrow() && (date === null) === (time === null);
  }

  /** The end the next press writes, its day brought to the screen. */
  protected enter(
    next: DateTimeRangePickerPosition,
    reason: 'keyboard' | 'pointer',
    source?: Event,
  ): void {
    const day = this.draft()[next].date;
    if (day !== null) this.focused.set(day);
    if (next !== this.currentPosition()) this.setPosition(next, reason, source);
  }

  protected bring(next: DateTimeRangePickerPosition, part: PickerShowing, source: Event): void {
    this.enter(next, 'pointer', source);
    this.showing.set(part);
  }

  /** Typed in a half: without a draft to confirm, it is written as it is. */
  protected type(
    which: DateTimeRangePickerPosition,
    moment: PlainDateTime | null,
    source: unknown,
  ): void {
    const next = { ...this.draft(), [which]: momentDraft(moment) };
    if (isSameMomentRunDraft(next, this.draft())) return;

    this.draft.set(next);
    if (!this.resolvedConfirm()) this.request(momentRunOf(next), 'keyboard', source);
  }

  protected takeDays({ source, value }: ChangeRequest<CalendarValue>): void {
    if (!isRange(value)) return;

    const next = withRunDays(this.draft(), value);
    this.draft.set(next);
    this.advance(next, 'start', source);
    this.keep(next, source);
  }

  protected takeTime(which: DateTimeRangePickerPosition, request: ClockChangeRequest): void {
    const next = { ...this.draft(), [which]: { ...this.draft()[which], time: request.value } };
    const finest = clockFinest(this.resolvedGranularity(), this.resolvedStep());
    this.draft.set(next);
    if (request.unit !== 'slot' && request.unit !== finest) return;

    if (!this.resolvedConfirm() && isTakenRun(next, this.rangeWords())) {
      this.write(next, request.source);
    } else {
      this.advance(next, which, request.source);
    }
  }

  protected jump({ month, year }: PlainYearMonth): void {
    this.view.set('day');
    this.focused.set({ year, month, day: 1 });
  }

  protected apply(source: Event): void {
    if (this.canApply()) this.write(this.draft(), source);
  }

  protected clearDraft(source: Event): void {
    this.draft.set(momentRunDraft(null));
    this.moveTo('start', source);
    this.showing.set('day');
    if (!this.resolvedConfirm()) this.write(momentRunDraft(null), source, 'clear');
  }

  private choose(run: DateTimeRange, source: Event): void {
    const next = momentRunDraft(run);
    if (run.start !== null) this.focused.set(run.start.date);
    this.draft.set(next);
    this.moveTo('start', source);
    if (!this.resolvedConfirm()) this.write(next, source);
  }

  /** The run moved by a step or a length. Without a draft to confirm, it is written. */
  private take(next: MomentRunDraft, source: Event): void {
    this.draft.set(next);
    if (next.end.date !== null) this.focused.set(next.end.date);
    this.keep(next, source);
  }

  private keep(next: MomentRunDraft, source: unknown): void {
    if (this.resolvedConfirm() || !isTakenRun(next, this.rangeWords())) return;

    this.request(momentRunOf(next), 'select', source);
  }

  /** On to the half that is missing; on a whole run, back to its start. */
  private advance(next: MomentRunDraft, from: DateTimeRangePickerPosition, source: unknown): void {
    const half = missingHalf(next, from);
    this.moveTo(half?.position ?? 'start', source);
    if (half === null) return;

    this.showing.set(half.part);
    afterNextRender(
      () => {
        if (half.part === 'day') this.calendarRef()?.focus();
        else this.clockOf(half.position)?.focus();
      },
      { injector: this.injector },
    );
  }

  private write(next: MomentRunDraft, source: unknown, reason: ChangeReason = 'select'): void {
    this.request(momentRunOf(next), reason, source);
    this.moveTo('start', source);
    this.layer.finish(source);
  }

  private request(next: DateTimeRange | null, reason: ChangeReason, source: unknown): void {
    if (this.state.request(next, reason, source)) this.onChangeFn(next);
  }

  private moveTo(next: DateTimeRangePickerPosition, source: unknown): void {
    if (next !== this.currentPosition()) this.setPosition(next, 'select', source);
  }

  private setPosition(
    next: DateTimeRangePickerPosition,
    reason: ChangeReason,
    source: unknown,
  ): void {
    const state = createControllable<DateTimeRangePickerPosition>({
      controlled: this.position(),
      initial: this.currentPosition(),
      onRequest: (request) => this.positionChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownPosition.set(next);
  }

  private clockOf(position: DateTimeRangePickerPosition): SlClock | undefined {
    return position === 'start' ? this.startClock() : this.endClock();
  }

  /** Escape walks the calendar's view down before it closes the panel. */
  private walkDown(): boolean {
    if (this.view() === 'day') return false;

    this.view.set(this.view() === 'year' ? 'month' : 'day');

    return true;
  }

  /** The grid pages to the current end first, and focus waits for that render. */
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
}
