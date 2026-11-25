import {
  blockedAround,
  compareDate,
  createDateFormat,
  isDateRefusedInRun,
  isPastLimit,
  lengthOf,
  orderedRun,
  presetValue,
  rangeProblems,
  stepRun,
  todayIn,
} from '@slotted/core/date';
import type { PickerPreset, PlainDate, PlainYearMonth } from '@slotted/core/date';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
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
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  dateRangePickerMessages,
  pickerPanelMessages,
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
import {
  injectCalendarDefaults,
  isRange,
  isSameValue,
  SlCalendar,
} from '@slotted/angular/calendar';
import type { CalendarValue, CalendarView, DateRange } from '@slotted/angular/calendar';
import { SlDateField } from '@slotted/angular/date-field';
import { SlField } from '@slotted/angular/field';
import {
  isOpenChord,
  pickerDraft,
  PickerLayer,
  SlPickerBody,
  SlPickerFooter,
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
import type { PickerPresetView, PickerSpanView } from '@slotted/angular/picker-panel';

import { SlDateRangePickerFooter } from './date-range-picker-parts';
import { injectDateRangePickerDefaults } from './date-range-picker-defaults';
import type {
  DateRangePickerCalendar,
  DateRangePickerCount,
  DateRangePickerPlacement,
  DateRangePickerPosition,
  DateRangePickerSize,
  DateRangePickerVariant,
} from './date-range-picker-defaults';
import {
  endWords,
  limitWords,
  normalizeRange,
  refusalWords,
  resultWords,
  spanWords,
} from './range-words';

/** How far `contiguous` looks for an unavailable day when no `maxLength` bounds it. */
const CONTIGUOUS_SEARCH = 366;
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

/**
 * Two date fields in one frame, a trigger, and the months of a run behind them.
 *
 * **It composes the fields, the calendar and the panel and redraws none of
 * them.** This family owns the frame, the trigger and which end is being
 * edited.
 *
 * **The head says how long the run is while it is being drawn.** The calendar
 * reports the pending end — the day under the pointer, or the focused day —
 * and the length between the two halves says "4 nights" for it, in a live
 * region.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the run as it was.
 */
@Component({
  selector: '[slDateRangePicker]',
  standalone: true,
  exportAs: 'slDateRangePicker',
  imports: [
    SlCalendar,
    SlDateField,
    SlGlyph,
    SlIcon,
    SlPickerBody,
    SlPickerFooter,
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
      @if (clears() && held() !== null) {
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
        slPickerTrigger
        glyph="calendar"
        [disabled]="!editable()"
        [label]="triggerLabel()"
        [layer]="layer"
      ></button>
    </div>

    @if (layer.isOpen()) {
      <div slPickerLayer [label]="triggerLabel()" [layer]="layer" (applied)="apply($event)">
        <div slPickerPanel kind="date-range">
          @if (presetViews().length > 0) {
            <div slPickerRail [presets]="presetViews()">
              <div
                slPickerJump
                [locale]="resolvedLocale()"
                [max]="max()"
                [min]="min()"
                [months]="shownMonths()"
                [selected]="selectedMonths()"
                [shown]="shownPage()"
                [today]="currentToday()"
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
              (entered)="enter('start')"
            >
              <button slPickerHalfPart="day" (click)="enter('start', $event)">
                {{ startWords().text }}
              </button>
            </div>
            <div slPickerSpan [span]="span()"></div>
            <div
              slPickerHalf
              [current]="currentPosition() === 'end'"
              [empty]="endWords().empty"
              [invalid]="refusal() !== null"
              [label]="t('end')"
              [meta]="endWords().meta"
              (entered)="enter('end')"
            >
              <button slPickerHalfPart="day" (click)="enter('end', $event)">
                {{ endWords().text }}
              </button>
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
              [firstDayOfWeek]="firstDayOfWeek()"
              [min]="min()"
              [max]="max()"
              [defaultFocusedDate]="anchor()"
              [focusedDate]="focused()"
              [isDateOver]="isOver()"
              [isDateUnavailable]="gridUnavailable()"
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
              (valueChange)="take($event)"
            ></div>
          </div>

          @if (footerShown()) {
            <div
              slPickerFooter
              [clearable]="clears()"
              [canApply]="canApply()"
              [canClear]="draft() !== null"
              [confirm]="resolvedConfirm()"
              [hint]="hint()"
              [invalid]="refusal() !== null"
              (applied)="apply($event)"
              (cleared)="clearDraft($event)"
            >
              <ng-content select="[slDateRangePickerFooter]">{{ hint() }}</ng-content>
            </div>
          }
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
    '[attr.data-open]': "layer.isOpen() ? '' : null",
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
  /** Six rows whatever the months need. Off: two months end where the longer one does. */
  readonly fixedWeeks = input(false, { transform: booleanAttribute });

  /** BCP 47. Writes both fields, the grid and the trigger's dates. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /**
   * The day it is, stated by the application: a business date, a day a server
   * answers. Unset, the clock answers in `timeZone`.
   */
  readonly today = input<PlainDate | undefined>(undefined);
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
  /**
   * Whether the panel keeps a draft until Apply. `false` writes the run on the
   * press that closes it. On by default.
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

  /** Draws one clear on the frame, which empties both ends. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, the clear, the names of the two ends, and the
   * phrases that count the run (`days.length`, `nights.between`, …).
   */
  readonly messages = input<PartialMessages<DateRangePickerMessages> | undefined>(undefined);
  /** The consumer's own shortcuts. The panel writes the run each one is. */
  readonly presets = input<readonly PickerPreset<DateRange>[]>([]);
  /** The names of the two hidden inputs a plain form post reads. */
  readonly startName = input<string | undefined>(undefined);
  readonly endName = input<string | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<DateRange | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly positionChange = output<ChangeRequest<DateRangePickerPosition>>();

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

  private readonly ownValue = signal<DateRange | null>(null);
  private readonly ownPosition = signal<DateRangePickerPosition>('start');
  private readonly formDisabled = signal<boolean | undefined>(undefined);
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
  /** The pending end the calendar reports, or `null` while no run is open. */
  protected readonly preview = signal<PlainDate | null>(null);
  /** A pointer press before focus names the reason a field became current. */
  protected pointerFocus = false;

  private onChangeFn: (value: DateRange | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly held = computed(() => {
    const value = this.value();
    return value === undefined ? this.ownValue() : normalizeRange(value ?? null);
  });
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
  /** A required value offers no control that empties it. */
  protected readonly clears = computed(() => this.clearable() && this.resolvedRequired() !== true);
  /** The application's own words for the footer. */
  private readonly ownFooter = contentChild(SlDateRangePickerFooter);
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

  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicate over every day of the run, the order of the two
   * ends and the length.
   */
  private readonly rules = computed(() => ({
    contiguous: this.contiguous(),
    count: this.resolvedCount(),
    max: this.max(),
    maxLength: this.maxLength(),
    min: this.min(),
    minLength: this.minLength(),
    unavailable: this.isDateUnavailable(),
  }));
  private readonly problems = computed(() => rangeProblems(this.held(), this.rules()));
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

  /* ── What the panel composes ───────────────────────────────────────── */

  protected readonly words = injectMessages(pickerPanelMessages);
  protected readonly layer = new PickerLayer({
    focusPanel: (panel) => this.focusPanel(panel),
    left: () => this.draft.set(this.held()),
    onEscape: () => this.walkDown(),
    open: this.open,
    placement: computed(() => this.placement() ?? this.defaults.placement),
    requested: (request) => this.openChange.emit(request),
    root: this.element,
    trigger: () => this.triggerRef?.nativeElement,
  });
  protected readonly resolvedConfirm = computed(() => this.confirm() ?? this.defaults.confirm);
  protected readonly shownMonths = computed(() =>
    this.layer.narrow() ? 1 : (this.months() ?? this.defaults.months),
  );

  protected readonly draft = pickerDraft(this.held, isSameValue);
  private readonly draftStart = computed(() => this.draft()?.start ?? null);
  private readonly draftEnd = computed(() => this.draft()?.end ?? null);

  /**
   * What the calendar is shown. With the end as the current position, the end
   * is withheld so the next press writes it instead of starting another run.
   */
  protected readonly calendarValue = computed<CalendarValue>(() => {
    const start = this.draftStart();

    return this.currentPosition() === 'end' && start !== null ? { start, end: null } : this.draft();
  });
  private readonly openStart = computed(() => {
    const value = this.calendarValue();

    return isRange(value) && value.end === null ? value.start : null;
  });

  /** The block on either side of the chosen start, found once per start. */
  private readonly blocked = computed(() => {
    const openStart = this.openStart();
    const { contiguous, maxLength, unavailable } = this.rules();

    return openStart === null || !contiguous
      ? { before: null, after: null }
      : blockedAround(openStart, unavailable ?? (() => false), maxLength ?? CONTIGUOUS_SEARCH);
  });
  protected readonly gridUnavailable = computed(() => {
    const openStart = this.openStart();
    const rules = this.rules();
    if (openStart === null) return rules.unavailable;

    const blocked = this.blocked();

    return (date: PlainDate) => isDateRefusedInRun(openStart, date, rules, blocked);
  });
  protected readonly isOver = computed(() => {
    const [draft, rules] = [this.draft(), this.rules()];

    return (date: PlainDate) => isPastLimit(draft, date, rules);
  });

  /** The run as it would close on the pending end. */
  private readonly pendingRun = computed(() => {
    const openStart = this.openStart();
    const preview = this.preview();

    return openStart !== null && preview !== null ? orderedRun(openStart, preview) : null;
  });

  private readonly rangeWords = computed(() => ({
    locale: this.resolvedLocale(),
    rules: this.rules(),
    t: this.t,
    today: this.currentToday(),
    words: this.words,
  }));
  protected readonly startWords = computed(() => endWords(this.draftStart(), this.rangeWords()));
  protected readonly endWords = computed(() => endWords(this.draftEnd(), this.rangeWords()));
  protected readonly refusal = computed(() => refusalWords(this.draft(), this.rangeWords()));
  protected readonly hint = computed(() => this.refusal() ?? limitWords(this.rangeWords()));

  protected readonly anchor = computed(
    () =>
      (this.currentPosition() === 'end' ? this.draftEnd() : this.draftStart()) ??
      this.draftStart() ??
      this.currentToday(),
  );
  protected readonly shownPage = computed(() => this.page() ?? this.anchor());
  protected readonly selectedMonths = computed((): readonly [number, number] | null => {
    const months = [this.draftStart(), this.draftEnd()]
      .filter((date) => date !== null)
      .map(({ month, year }) => year * 12 + month);

    return months.length === 0 ? null : [Math.min(...months), Math.max(...months)];
  });

  protected readonly canApply = computed(() => {
    if (this.refusal() !== null) return false;
    if (this.draft() === null) return this.held() !== null;

    return this.draftStart() !== null && this.draftEnd() !== null;
  });

  protected readonly span = computed((): PickerSpanView => {
    const [draft, rules] = [this.draft(), this.rules()];
    const shown = this.pendingRun() ?? draft;
    const stepped = (direction: 1 | -1) =>
      draft === null ? null : stepRun(draft, direction, rules);

    return {
      canDecrease: stepped(-1) !== null,
      canIncrease: stepped(1) !== null,
      empty: lengthOf(shown, rules) === 0,
      step: (direction, event) => this.lengthen(stepped(direction), event),
      text: spanWords(shown, this.rangeWords()),
    };
  });

  protected readonly presetViews = computed(() =>
    this.presets().map((preset): PickerPresetView => {
      const value = presetValue(preset);

      return {
        disabled: refusalWords(value, this.rangeWords()) !== null,
        label: preset.label,
        press: (event) => this.choose(value, event),
        result: resultWords(value, this.rangeWords()),
        selected: isSameValue(this.draft(), value),
      };
    }),
  );

  /** The trigger's accessible name: focus returns here when the surface closes. */
  protected readonly triggerLabel = computed(() => {
    const start = this.start();
    const end = this.end();
    if (!this.ordered() || start === null || end === null) return this.t('choose');

    const format = createDateFormat({ locale: this.resolvedLocale() });

    return this.t('change', {
      start: format.describe(start),
      end: format.describe(end),
      length: spanWords(this.held(), this.rangeWords()),
    });
  });

  constructor() {
    /* A rule that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.problems();
      this.onValidatorChangeFn();
    });
  }

  ngOnInit() {
    this.layer.start(this.defaultOpen());
    this.clockToday.set(todayIn(this.resolvedTimeZone()));
    this.ownValue.set(normalizeRange(this.defaultValue() ?? null));
    this.ownPosition.set(this.defaultPosition());

    /* A native reset restores the hidden inputs and tells nothing, so the
       picker would keep the last run chosen in a form that had been reset. The
       value returns to `defaultValue` through `valueChange`, reason
       `programmatic`. A picker bound to a form model takes the model's reset
       value through `writeValue` instead. */
    const form = this.element.closest('form');
    if (form !== null) {
      const onReset = (event: Event) => {
        if (!this.formBound) this.commit(this.defaultValue() ?? null, 'programmatic', event);
      };
      form.addEventListener('reset', onReset);
      this.destroyRef.onDestroy(() => form.removeEventListener('reset', onReset));
    }
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  writeValue(value: DateRange | null | undefined) {
    this.ownValue.set(normalizeRange(value ?? null));
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
    const value = normalizeRange((control.value as DateRange | null | undefined) ?? null);
    if (value === null) return null;
    const problems = rangeProblems(value, this.rules());
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
    this.layer.show('keyboard', source);
  }

  closeSurface(source?: Event) {
    this.layer.setOpen(false, 'keyboard', source);
  }

  /* ── Handlers ──────────────────────────────────────────────────────── */

  protected clear(source: Event) {
    this.commit(null, 'clear', source);
    this.setPosition('start', 'clear', source);
    this.focus('start');
  }

  protected onControlKeyDown(event: KeyboardEvent) {
    if (!this.editable() || !isOpenChord(event)) return;

    event.preventDefault();
    this.layer.show('keyboard', event, false);
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

  /** A day pressed in the grid: the first opens a run, and the second closes it. */
  protected take({ source, value }: ChangeRequest<CalendarValue>) {
    if (!isRange(value)) return;

    this.draft.set(value);
    this.moveTo(value.end === null ? 'end' : 'start', source);
    if (value.end !== null && !this.resolvedConfirm()) this.write(value, source);
  }

  protected apply(source: Event) {
    if (this.canApply()) this.write(this.draft(), source);
  }

  protected clearDraft(source: Event) {
    this.draft.set(null);
    this.moveTo('start', source);
    if (!this.resolvedConfirm()) this.write(null, source, 'clear');
  }

  /** The end the next press writes, its day brought to the screen. */
  protected enter(next: DateRangePickerPosition, source?: Event) {
    const day = next === 'end' ? this.draftEnd() : this.draftStart();
    if (day !== null) this.focused.set(day);
    this.moveTo(next, source);
  }

  protected jump({ month, year }: PlainYearMonth) {
    this.view.set('day');
    this.focused.set({ year, month, day: 1 });
  }

  private choose(next: DateRange, source: Event) {
    if (next.start !== null) this.focused.set(next.start);
    this.draft.set(next);
    this.moveTo('start', source);
    if (!this.resolvedConfirm()) this.write(next, source);
  }

  private lengthen(next: DateRange | null, source: Event) {
    if (next === null) return;

    this.draft.set(next);
    if (next.end !== null) this.focused.set(next.end);
    if (!this.resolvedConfirm()) this.commit(next, 'select', source);
  }

  private write(next: DateRange | null, source: unknown, reason: ChangeReason = 'select') {
    this.commit(next, reason, source);
    this.moveTo('start', source);
    this.layer.finish(source);
  }

  private moveTo(next: DateRangePickerPosition, source: unknown) {
    if (next !== this.currentPosition()) this.setPosition(next, 'select', source);
  }

  /** Escape walks the calendar's view down before it closes the panel. */
  private walkDown(): boolean {
    if (this.view() === 'day') return false;

    this.view.set(this.view() === 'year' ? 'month' : 'day');

    return true;
  }

  /**
   * Focus lands on the cell of the current end, or on today when it is empty.
   * The grid pages to that cell first, and focus waits for the render that
   * draws it.
   */
  private focusPanel(panel: HTMLElement) {
    this.calendarRef?.focusDate(this.anchor());
    afterNextRender(
      () =>
        panel
          .querySelector<HTMLElement>('[data-part="day"][tabindex="0"]')
          ?.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }

  private commit(next: DateRange | null, reason: ChangeReason, source: unknown) {
    const normalized = normalizeRange(next);
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
}
