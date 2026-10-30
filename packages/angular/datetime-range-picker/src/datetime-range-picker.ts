import {
  blockedAround,
  compareDateTime,
  createDateTimeFormat,
  createTimeFormat,
  dateTimeRangeProblems,
  dateTimeRangeSeconds,
  dayWindow,
  firstUnavailableIndex,
  hourJump,
  isDateRefusedInRun,
  isSameDate,
  isSameTime,
  isTruncated,
  nearestIndex,
  openingIndex as openingIndexOf,
  nowDateTimeIn,
  orderedRun,
  runRefusal,
  timeList,
  toISODateTime,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime, TimeOption } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import {
  datetimeRangePickerMessages,
  type DatetimeRangePickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChild,
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
  TemplateRef,
  untracked,
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
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlCalendar } from '@slotted/angular/calendar';
import type { CalendarValue, CalendarView } from '@slotted/angular/calendar';
import { SlDateTimeField } from '@slotted/angular/datetime-field';
import type { DateTimeFieldChangeRequest } from '@slotted/angular/datetime-field';
import { SlField } from '@slotted/angular/field';

import { injectDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type {
  DateTimeRange,
  DateTimeRangePickerCalendar,
  DateTimeRangePickerCloseOnSelect,
  DateTimeRangePickerDefaults,
  DateTimeRangePickerHighlight,
  DateTimeRangePickerHourCycle,
  DateTimeRangePickerPlacement,
  DateTimeRangePickerPosition,
  DateTimeRangePickerSize,
  DateTimeRangePickerUnavailableOptions,
  DateTimeRangePickerVariant,
} from './datetime-range-picker-defaults';
import { SlDateTimeRangePickerOption } from './datetime-range-picker-parts';

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * The query is here as well as in the stylesheet because the DOM has to say
 * which presentation it is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

/** One end of the work: its two halves, each of which may still be missing. */
interface Half {
  readonly date: PlainDate | null;
  readonly time: PlainTime | null;
}
interface Work {
  readonly start: Half;
  readonly end: Half;
}

const NO_HALF: Half = { date: null, time: null };
const EMPTY: Work = { start: NO_HALF, end: NO_HALF };
const MIDNIGHT: PlainTime = { hour: 0, minute: 0, second: 0 };
/** How far `contiguous` looks for an unavailable day when no `maxLength` bounds it. */
const CONTIGUOUS_SEARCH = 366;
const NO_HIGHLIGHT: DateTimeRangePickerHighlight = { start: null, end: null };

/** The one word for nothing: a value whose both ends are `null` is `null`. */
function normalize(range: DateTimeRange | null | undefined): DateTimeRange | null {
  return range === null || range === undefined || (range.start === null && range.end === null)
    ? null
    : range;
}

function isSameDateTime(a: PlainDateTime | null, b: PlainDateTime | null): boolean {
  if (a === null || b === null) return a === b;
  return compareDateTime(a, b) === 0;
}

export function isSameDateTimeRange(a: DateTimeRange | null, b: DateTimeRange | null): boolean {
  if (a === null || b === null) return a === b;
  return isSameDateTime(a.start, b.start) && isSameDateTime(a.end, b.end);
}

/**
 * Scrolls the list alone. `scrollIntoView` would scroll every ancestor too,
 * and a page with an open surface must not jump when a list opens on its
 * highlight. Centred when the list opens, and by the least that lands the row
 * whole when a key moves the highlight. jsdom measures nothing, so it is a
 * no-op there rather than a throw.
 */
function revealRow(list: HTMLElement, row: HTMLElement, centre: boolean) {
  const box = list.getBoundingClientRect();
  const cell = row.getBoundingClientRect();
  if (box.height === 0 || cell.height === 0) return;
  const above = cell.top - box.top;
  if (centre) list.scrollTop += above - (box.height - cell.height) / 2;
  else if (above < 0) list.scrollTop += above;
  else if (cell.bottom > box.bottom) list.scrollTop += cell.bottom - box.bottom;
}

function other(position: DateTimeRangePickerPosition): DateTimeRangePickerPosition {
  return position === 'start' ? 'end' : 'start';
}

function halfOf(value: PlainDateTime | null): Half {
  return value === null ? NO_HALF : { date: value.date, time: value.time };
}

function wholeOf(half: Half): PlainDateTime | null {
  return half.date === null || half.time === null ? null : { date: half.date, time: half.time };
}

function workOf(range: DateTimeRange | null): Work {
  return range === null ? EMPTY : { start: halfOf(range.start), end: halfOf(range.end) };
}

function rangeOf(work: Work): DateTimeRange | null {
  return normalize({ start: wholeOf(work.start), end: wholeOf(work.end) });
}

/**
 * A one-line frame — the value in words, a clear and the trigger — and behind
 * it one end at a time: two tabs, the field of the current end, a hint, the
 * range calendar and the list of that end.
 *
 * **The frame is one line at any width**, for the reason `time-range-picker`
 * records. The field lives in the panel's band, where the reader types.
 *
 * **One calendar for the two dates, and the list of the current end.** The
 * grid draws the run and its pending band the way `date-range-picker` does;
 * the list runs on the day of the current end — or on the grid's focused day
 * while the end has none — and says the duration beside each row while the
 * two ends are on the same day.
 *
 * **The press that leaves the work incomplete carries focus to the half that
 * is missing; the press that completes it closes the panel.** The rule
 * `datetime-picker` wrote, once per end.
 */
@Component({
  selector: '[slDateTimeRangePicker]',
  standalone: true,
  exportAs: 'slDateTimeRangePicker',
  imports: [NgTemplateOutlet, SlCalendar, SlDateTimeField, SlGlyph, SlIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlDateTimeRangePicker),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateTimeRangePicker), multi: true },
  ],
  template: `<div data-part="control" data-part-control="" (focusout)="onControlFocusOut($event)">
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
        (keydown)="onTriggerKeyDown($event)"
      >
        <span
          data-part="summary"
          data-part-summary=""
          [attr.data-placeholder]="summary() === null ? '' : null"
          >{{ summary() ?? t('choose') }}</span
        >
        <span slIcon><svg slGlyph name="calendar"></svg></span>
      </button>
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
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="startName()"
        [value]="startIso()"
      />
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="endName()"
        [value]="endIso()"
      />
    </div>

    @if (isOpen()) {
      <div
        #layer
        data-ui="datetime-range-picker"
        data-ui-datetime-range-picker=""
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
        >
          @if (sheet()) {
            <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
          }
          <div data-part="head" data-part-head="">
            <div data-part="tabs" data-part-tabs="" role="tablist">
              @for (position of positions; track position) {
                <button
                  data-part="tab"
                  data-part-tab=""
                  role="tab"
                  type="button"
                  [attr.id]="contentId + '-tab-' + position"
                  [attr.data-position]="position"
                  [attr.aria-selected]="currentPosition() === position"
                  [attr.aria-controls]="contentId + '-panel'"
                  [attr.data-current]="currentPosition() === position ? '' : null"
                  [attr.data-placeholder]="isEmptyHalf(position) ? '' : null"
                  [tabindex]="currentPosition() === position ? 0 : -1"
                  [disabled]="!editable()"
                  (click)="selectTab(position, $event)"
                  (keydown)="onTabKeyDown($event)"
                >
                  <span data-part="tab-label" data-part-tab-label="">{{ labelFor(position) }}</span>
                  <span data-part="tab-value" data-part-tab-value="">{{ tabValue(position) }}</span>
                </button>
              }
            </div>
            <div
              #fieldBox
              data-part="field"
              data-part-field=""
              [attr.data-position]="currentPosition()"
            >
              <div
                slDateTimeField
                #field="slDateTimeField"
                variant="plain"
                size="sm"
                [label]="labelFor(currentPosition())"
                [locale]="resolvedLocale()"
                [timeZone]="resolvedTimeZone()"
                [hourCycle]="resolvedHourCycle()"
                [granularity]="resolvedGranularity()"
                [calendar]="resolvedCalendar()"
                [firstDayOfWeek]="resolvedFirstDayOfWeek()"
                [yearPivot]="yearPivot()"
                [referenceDateTime]="referenceDateTime()"
                [relative]="relative()"
                [min]="currentPosition() === 'end' ? endMin() : min()"
                [max]="currentPosition() === 'start' ? startMax() : max()"
                [minTime]="minTime()"
                [maxTime]="maxTime()"
                [isDateUnavailable]="isDateUnavailable()"
                [isTimeUnavailable]="isTimeUnavailable()"
                [invalid]="currentPosition() === 'end' && workReversed() ? true : undefined"
                [disabled]="resolvedDisabled()"
                [readOnly]="resolvedReadOnly()"
                [required]="resolvedRequired()"
                [value]="currentPosition() === 'start' ? workStart() : workEnd()"
                (valueChange)="onFieldValue($event)"
              ></div>
            </div>
            <button
              data-part="now"
              data-part-now=""
              type="button"
              [disabled]="!editable()"
              (click)="chooseNow($event)"
            >
              {{ t('now') }}
            </button>
            <span
              data-part="hint"
              data-part-hint=""
              [attr.id]="contentId + '-hint'"
              [attr.data-invalid]="hintProblem() === undefined ? null : ''"
              >{{ hint() }}</span
            >
            <span
              data-part="length"
              data-part-length=""
              aria-live="polite"
              [attr.data-pending]="pending() === null ? null : ''"
              >{{ spokenLength() }}</span
            >
            @if (limitText() !== null) {
              <span data-part="limit" data-part-limit="">{{ limitText() }}</span>
            }
          </div>
          <ng-content select="[slDateTimeRangePickerPresets]" />
          @if (currentPosition(); as position) {
            <div
              data-part="panel"
              data-part-panel=""
              [attr.id]="contentId + '-panel'"
              [attr.data-position]="position"
            >
              <div data-part="date-panel" data-part-date-panel="">
                <div
                  slCalendar
                  #calendar="slCalendar"
                  selectionMode="range"
                  [locale]="resolvedLocale()"
                  [timeZone]="resolvedTimeZone()"
                  [firstDayOfWeek]="resolvedFirstDayOfWeek()"
                  [min]="min()?.date"
                  [max]="max()?.date"
                  [isDateUnavailable]="gridUnavailable()"
                  [months]="resolvedMonths()"
                  [weekNumbers]="weekNumbers()"
                  [fixedWeeks]="fixedWeeks()"
                  [readOnly]="resolvedReadOnly()"
                  [focusedDate]="focusedDate()"
                  [value]="calendarValue()"
                  [view]="view()"
                  (viewChange)="view.set($event)"
                  (focusedDateChange)="focusedDate.set($event.value)"
                  (previewChange)="preview.set($event)"
                  (valueChange)="onCalendarValue($event)"
                ></div>
              </div>
              @if (lists()[position].length === 0) {
                <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
              } @else {
                <div
                  data-part="list"
                  data-part-list=""
                  role="listbox"
                  [attr.aria-labelledby]="contentId + '-tab-' + position"
                  [attr.aria-describedby]="hint() === '' ? null : contentId + '-hint'"
                  [attr.aria-description]="truncated() ? t('truncated') : null"
                  [attr.data-truncated]="truncated() ? '' : null"
                  (keydown)="onListKeyDown(position, $event)"
                  (focusin)="listFocused.set(true)"
                  (focusout)="onListFocusOut($event)"
                  (pointerleave)="hovered.set(null)"
                >
                  @for (option of lists()[position]; track $index) {
                    <div
                      data-part="option"
                      data-part-option=""
                      role="option"
                      [attr.aria-selected]="isSelected(position, option)"
                      [attr.aria-disabled]="option.unavailable ? 'true' : null"
                      [attr.data-disabled]="option.unavailable ? '' : null"
                      [attr.data-selected]="isSelected(position, option) ? '' : null"
                      [attr.data-current]="$index === highlightIndex(position) ? '' : null"
                      [tabindex]="$index === highlightIndex(position) ? 0 : -1"
                      (click)="select(position, option, $event)"
                      (pointerenter)="hover(position, option)"
                    >
                      @if (optionTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="optionTemplate"
                          [ngTemplateOutletContext]="contextFor(position, option, $index)"
                        />
                      } @else {
                        {{ labels()[position][$index] }}
                        @if (durationOf(position, option); as duration) {
                          <span data-part="option-duration" data-part-option-duration="">{{
                            duration
                          }}</span>
                        }
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
          <div data-part="footer" data-part-footer="">
            <ng-content select="[slDateTimeRangePickerFooter]" />
            <button data-part="done" data-part-done="" type="button" (click)="done($event)">
              {{ t('done') }}
            </button>
          </div>
        </div>
      </div>
    }`,
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
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-open]': "isOpen() ? '' : null",
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
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Present means the consumer owns which end is being edited. */
  readonly position = input<DateTimeRangePickerPosition | undefined>(undefined);
  readonly defaultPosition = input<DateTimeRangePickerPosition>('start');
  /** Where the reader is in each list. Present means the consumer owns it. */
  readonly highlighted = input<DateTimeRangePickerHighlight | undefined>(undefined);
  readonly defaultHighlighted = input<DateTimeRangePickerHighlight | undefined>(undefined);

  /** The whole-value bounds: where the range starts and ends. */
  readonly min = input<PlainDateTime | undefined>(undefined);
  readonly max = input<PlainDateTime | undefined>(undefined);
  /** The bounds of every day inside the range, applied together with the two above. */
  readonly minTime = input<PlainTime | undefined>(undefined);
  readonly maxTime = input<PlainTime | undefined>(undefined);
  /** Answers a whole day and feeds the grid. */
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);
  /** Answers one time on one day and feeds the lists. */
  readonly isTimeUnavailable = input<((time: PlainTime, date: PlainDate) => boolean) | undefined>(
    undefined,
  );
  /**
   * Whether a run may cross an unavailable day. On, and with a start chosen,
   * the days beyond the first unavailable one are refused in the grid, and on
   * the same day the times beyond the first unavailable one in the end list.
   */
  readonly contiguous = input(true, { transform: booleanAttribute });
  /** The shortest and longest run allowed, in seconds. */
  readonly minLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly lengthLabel = input<DateTimeRangePickerDefaults['lengthLabel'] | undefined>(undefined);

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** The times to offer, stated rather than stepped; the same list for both ends. */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);
  readonly maxOptions = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly unavailableOptions = input<DateTimeRangePickerUnavailableOptions | undefined>(undefined);

  readonly months = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Six rows whatever the month needs, so a press of "next" moves no target. */
  readonly fixedWeeks = input(true, { transform: booleanAttribute });

  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<DateTimeRangePickerHourCycle | undefined>(undefined);
  readonly granularity = input<DateTimeRangePickerDefaults['granularity'] | undefined>(undefined);
  readonly calendar = input<DateTimeRangePickerCalendar | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly yearPivot = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** What "now" is, for a story or a test; the clock otherwise. */
  readonly referenceDateTime = input<PlainDateTime | undefined>(undefined);

  readonly size = input<DateTimeRangePickerSize | undefined>(undefined);
  readonly variant = input<DateTimeRangePickerVariant | undefined>(undefined);
  readonly placement = input<DateTimeRangePickerPlacement | undefined>(undefined);
  readonly closeOnSelect = input<DateTimeRangePickerCloseOnSelect | undefined>(undefined);

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
  /** Whether the two fields in the band take the relative expression. */
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's names, the two ends, the hint, the limit, and what a panel says
   * when it is empty or cut short.
   */
  readonly messages = input<PartialMessages<DatetimeRangePickerMessages> | undefined>(undefined);
  /** The names of the two hidden inputs a plain form post reads. */
  readonly startName = input<string | undefined>(undefined);
  readonly endName = input<string | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<DateTimeRange | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly positionChange = output<ChangeRequest<DateTimeRangePickerPosition>>();
  readonly highlightedChange = output<ChangeRequest<DateTimeRangePickerHighlight>>();

  /** What one row draws; a template, because it is re-rendered once per option. */
  @ContentChild(SlDateTimeRangePickerOption, { read: TemplateRef })
  protected optionTemplate?: TemplateRef<unknown>;
  @ViewChild('layer') protected layer?: ElementRef<HTMLElement>;
  /** Whether the lists were scrolled to their highlight since the surface opened. */
  private revealed = false;
  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('field') protected field?: SlDateTimeField;
  @ViewChild('fieldBox') protected fieldBox?: ElementRef<HTMLElement>;
  @ViewChild('calendar') protected calendarRef?: SlCalendar;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly defaults = injectDateTimeRangePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(datetimeRangePickerMessages, this.messages);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enclosing = inject(SlField, { optional: true });

  protected readonly contentId = `sl-datetime-range-picker-${String((sequence += 1))}`;
  protected readonly positions: readonly DateTimeRangePickerPosition[] = ['start', 'end'];

  private readonly ownOpen = signal(false);
  private readonly ownValue = signal<DateTimeRange | null>(null);
  private readonly ownPosition = signal<DateTimeRangePickerPosition>('start');
  private readonly ownHighlight = signal<DateTimeRangePickerHighlight>(NO_HIGHLIGHT);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private readonly clock = signal<PlainDateTime>({
    date: { year: 2026, month: 1, day: 1 },
    time: { hour: 12, minute: 0, second: 0 },
  });
  protected readonly view = signal<CalendarView>('day');
  /** The pending end the calendar reports, or `null` while no run is open. */
  protected readonly preview = signal<PlainDate | null>(null);
  /**
   * The day the grid has focused. The family holds it — rather than the
   * calendar alone — because a list of an end with no date runs on it.
   */
  protected readonly focusedDate = signal<PlainDate>({ year: 2026, month: 1, day: 1 });
  protected readonly sheet = signal(false);
  /**
   * The work: the two ends as the reader left them while the panel is open. A
   * press in a list writes it; the value is asked for when it is whole. Closed
   * by anything, it is rebuilt from the value on the next open.
   */
  protected readonly work = signal<Work>(EMPTY);
  protected readonly workStart = computed(() => wholeOf(this.work().start));
  protected readonly workEnd = computed(() => wholeOf(this.work().end));
  /** The option under the pointer, which enters the duration and nothing else. */
  protected readonly hovered = signal<{
    position: DateTimeRangePickerPosition;
    time: PlainTime;
  } | null>(null);
  /** Which list holds focus, so its highlight is the pending end. */
  protected readonly listFocused = signal(false);
  /** A pointer press before focus names the reason a field became current. */
  /** Where focus lands once the surface is drawn. */
  private focusOnOpen: 'field' | 'grid' | null = null;

  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseGrip: (() => void) | null = null;
  private readonly typeaheads: Record<DateTimeRangePickerPosition, TypeaheadHandle | null> = {
    start: null,
    end: null,
  };

  private onChangeFn: (value: DateTimeRange | null) => void = () => undefined;
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
  protected readonly highlight = computed(() => this.highlighted() ?? this.ownHighlight());
  protected readonly start = computed(() => this.held()?.start ?? null);
  protected readonly end = computed(() => this.held()?.end ?? null);
  protected readonly startIso = computed(() => {
    const start = this.start();
    return start === null ? '' : toISODateTime(start);
  });
  protected readonly endIso = computed(() => {
    const end = this.end();
    return end === null ? '' : toISODateTime(end);
  });

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
  protected readonly resolvedMonths = computed(() => this.months() ?? this.defaults.months);
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.enclosing?.resolvedSize() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedPlacement = computed(
    () => this.placement() ?? this.defaults.placement,
  );
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

  private readonly format = computed(() =>
    createDateTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.resolvedHourCycle(),
      locale: this.resolvedLocale(),
      ...(this.resolvedFirstDayOfWeek() === undefined
        ? {}
        : { firstDayOfWeek: this.resolvedFirstDayOfWeek() }),
      ...(this.yearPivot() === undefined ? {} : { yearPivot: this.yearPivot() }),
    }),
  );
  /* A time alone in a tab — the reader chose an hour before a day. */
  private readonly timeFormat = computed(() =>
    createTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.resolvedHourCycle(),
      locale: this.resolvedLocale(),
    }),
  );
  private readonly anchor = computed(() => this.referenceDateTime() ?? this.clock());
  private readonly bounds = computed(() => ({
    max: this.max(),
    maxTime: this.maxTime(),
    min: this.min(),
    minTime: this.minTime(),
  }));
  private readonly lengthOf = computed(() => {
    const label = this.lengthLabel() ?? this.defaults.lengthLabel;
    const locale = this.resolvedLocale();
    return (seconds: number) => label(seconds, locale);
  });

  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicate, the order of the two ends and the duration.
   */
  private readonly problems = computed(() =>
    dateTimeRangeProblems(this.held(), {
      contiguous: this.contiguous(),
      max: this.max(),
      maxLength: this.maxLength(),
      maxTime: this.maxTime(),
      min: this.min(),
      minLength: this.minLength(),
      minTime: this.minTime(),
      unavailableDay: this.isDateUnavailable(),
      unavailableTime: this.isTimeUnavailable(),
    }),
  );
  protected readonly reversed = computed(() => this.problems().includes('order'));
  protected readonly resolvedInvalid = computed(() => {
    if (this.invalid() !== undefined) return this.invalid();
    if (this.problems().length > 0) return true;
    return this.enclosing?.invalid();
  });

  /* Crossed bounds, while the order holds. Reversed, each field keeps the
     outer bounds and the end field alone says the order is wrong. */
  private readonly workOrdered = computed(() => {
    const start = this.workStart();
    const end = this.workEnd();
    return start !== null && end !== null && compareDateTime(start, end) <= 0;
  });
  protected readonly startMax = computed(() => {
    const end = this.workEnd();
    const max = this.max();
    if (!this.workOrdered() || end === null) return max;
    return max === undefined || compareDateTime(end, max) < 0 ? end : max;
  });
  protected readonly endMin = computed(() => {
    const start = this.workStart();
    const min = this.min();
    if (!this.workOrdered() || start === null) return min;
    return min === undefined || compareDateTime(start, min) > 0 ? start : min;
  });

  /* ── The grid ──────────────────────────────────────────────────────── */

  /**
   * What the calendar is shown: the two dates of the work, with the end
   * withheld while the end is the current position so the next press writes
   * it instead of restarting the run — `date-range-picker`'s rule.
   */
  protected readonly calendarValue = computed<CalendarValue>(() => {
    const { start, end } = this.work();
    if (start.date === null) return null;
    if (this.currentPosition() === 'end' && end.date !== null) {
      return { start: start.date, end: null };
    }
    return { start: start.date, end: end.date };
  });
  private readonly openStart = computed(() => {
    const value = this.calendarValue();
    if (value === null || Array.isArray(value) || !('start' in value)) return null;
    return value.end === null ? value.start : null;
  });
  private readonly blocked = computed(() => {
    const openStart = this.openStart();
    if (openStart === null || !this.contiguous()) return { before: null, after: null };
    const maxLength = this.maxLength();
    return blockedAround(
      openStart,
      this.isDateUnavailable() ?? (() => false),
      maxLength === undefined ? CONTIGUOUS_SEARCH : Math.ceil(maxLength / 86_400) + 1,
    );
  });
  protected readonly gridUnavailable = computed(() => {
    const bounds = this.bounds();
    const openStart = this.openStart();
    const unavailable = this.isDateUnavailable();
    const rules = { contiguous: this.contiguous(), count: 'days' as const, unavailable };
    const blocked = this.blocked();
    return (date: PlainDate) => {
      if (dayWindow(date, bounds) === null) return true;
      if (openStart === null) return unavailable?.(date) === true;
      return isDateRefusedInRun(openStart, date, rules, blocked);
    };
  });

  /** The day each list serves: the date of its end, or the grid's focused day. */
  protected dayFor(position: DateTimeRangePickerPosition): PlainDate {
    return this.work()[position].date ?? this.focusedDate();
  }

  protected isEmptyHalf(position: DateTimeRangePickerPosition): boolean {
    const half = this.work()[position];
    return half.date === null && half.time === null;
  }

  /** The end written short in the tab — a whole, a day alone, a time alone — or a dash. */
  protected tabValue(position: DateTimeRangePickerPosition): string {
    const half = this.work()[position];
    const whole = wholeOf(half);
    if (whole !== null) return this.writeShort(whole);
    if (half.date !== null) return this.format().describeDate(half.date, 'short');
    if (half.time !== null) return this.timeFormat().format(half.time);
    return '—';
  }

  /** The problems of the work as it stands, once it is whole. */
  private readonly workProblems = computed(() => {
    const whole = rangeOf(this.work());
    if (whole?.start == null || whole.end === null) return [];
    return dateTimeRangeProblems(whole, {
      contiguous: this.contiguous(),
      max: this.max(),
      maxLength: this.maxLength(),
      maxTime: this.maxTime(),
      min: this.min(),
      minLength: this.minLength(),
      minTime: this.minTime(),
      unavailableDay: this.isDateUnavailable(),
      unavailableTime: this.isTimeUnavailable(),
    });
  });
  protected readonly workReversed = computed(() => this.workProblems().includes('order'));
  protected readonly hintProblem = computed(() => this.workProblems()[0]);

  /**
   * What the next press should be, or what is wrong: the difference between a
   * panel that refuses and a panel that explains. Empty while the work is
   * whole and valid, when the length says the duration.
   */
  protected readonly hint = computed(() => {
    const position = this.currentPosition();
    const half = this.work()[position];
    if (half.date === null) return this.t('chooseDay', { end: this.labelFor(position) });
    if (half.time === null) {
      return this.t('chooseTime', {
        end: this.labelFor(position),
        day: this.format().describeDate(half.date, 'short'),
      });
    }
    const problem = this.hintProblem();
    if (problem === undefined) return '';
    return this.t(problem === 'min' || problem === 'max' ? 'bounds' : problem);
  });

  /* ── The two lists ─────────────────────────────────────────────────── */

  protected readonly truncated = computed(() =>
    isTruncated({
      maxOptions: this.maxOptions() ?? this.defaults.maxOptions,
      options: this.options(),
      step: this.step() ?? this.defaults.step,
    }),
  );

  /**
   * The list of one end: the day's window from both pairs of bounds, the
   * predicate on that day, and — on the same day as the other end — what the
   * other end of the work refuses. The duration limits apply across days.
   */
  protected readonly lists = computed<Record<DateTimeRangePickerPosition, TimeOption[]>>(() => ({
    start: this.listFor('start'),
    end: this.listFor('end'),
  }));
  protected readonly labels = computed<Record<DateTimeRangePickerPosition, string[]>>(() => {
    const format = this.format().time;
    const lists = this.lists();
    return {
      start: lists.start.map((option) => format.format(option.time)),
      end: lists.end.map((option) => format.format(option.time)),
    };
  });

  private listFor(position: DateTimeRangePickerPosition): TimeOption[] {
    const day = this.dayFor(position);
    const window = dayWindow(day, this.bounds());
    if (window === null || this.isDateUnavailable()?.(day) === true) return [];
    const isTimeUnavailable = this.isTimeUnavailable();
    const base = timeList({
      isTimeUnavailable:
        isTimeUnavailable === undefined ? undefined : (time) => isTimeUnavailable(time, day),
      max: window.latest,
      maxOptions: this.maxOptions() ?? this.defaults.maxOptions,
      min: window.earliest,
      options: this.options(),
      step: this.step() ?? this.defaults.step,
    });
    const otherEnd = wholeOf(this.work()[other(position)]);
    let refused: (option: TimeOption, index: number) => boolean = () => false;
    if (otherEnd !== null) {
      const direction: 1 | -1 = position === 'end' ? 1 : -1;
      const sameDay = isSameDate(day, otherEnd.date);
      const wall =
        sameDay && this.contiguous()
          ? firstUnavailableIndex(base, nearestIndex(base, otherEnd.time), direction)
          : -1;
      const rules = { maxLength: this.maxLength(), minLength: this.minLength() };
      refused = (option, index) => {
        const candidate = { date: day, time: option.time };
        const seconds =
          position === 'end'
            ? dateTimeRangeSeconds(otherEnd, candidate)
            : dateTimeRangeSeconds(candidate, otherEnd);
        if (runRefusal(0, seconds, 1, rules)) return true;
        return sameDay && wall >= 0 && (direction === 1 ? index >= wall : index <= wall);
      };
    }
    const marked = base.map((option, index) =>
      option.unavailable || !refused(option, index) ? option : { ...option, unavailable: true },
    );
    const hide = (this.unavailableOptions() ?? this.defaults.unavailableOptions) === 'hide';
    return hide ? marked.filter((option) => !option.unavailable) : marked;
  }

  protected highlightIndex(position: DateTimeRangePickerPosition): number {
    const time = this.highlight()[position];
    if (time === null) return -1;
    return this.lists()[position].findIndex((option) => isSameTime(option.time, time));
  }

  protected isSelected(position: DateTimeRangePickerPosition, option: TimeOption): boolean {
    return isSameTime(option.time, this.work()[position].time);
  }

  /** The name of one end: the field's, its tab's and the hint's `{end}`. */
  protected labelFor(position: DateTimeRangePickerPosition): string {
    return this.t(position);
  }

  /** The duration a row would make with the other end, on the same day only. */
  protected durationOf(position: DateTimeRangePickerPosition, option: TimeOption): string | null {
    const otherEnd = wholeOf(this.work()[other(position)]);
    const day = this.dayFor(position);
    if (otherEnd === null || option.unavailable || !isSameDate(day, otherEnd.date)) return null;
    const candidate = { date: day, time: option.time };
    const seconds =
      position === 'end'
        ? dateTimeRangeSeconds(otherEnd, candidate)
        : dateTimeRangeSeconds(candidate, otherEnd);
    return this.lengthOf()(seconds);
  }

  protected contextFor(position: DateTimeRangePickerPosition, option: TimeOption, index: number) {
    return {
      $implicit: option.time,
      current: index === this.highlightIndex(position),
      date: this.dayFor(position),
      duration: this.durationOf(position, option),
      label: this.labels()[position][index] ?? '',
      position,
      selected: this.isSelected(position, option),
      unavailable: option.unavailable,
    };
  }

  /* ── What is said ──────────────────────────────────────────────────── */

  /**
   * The pending end: the option under the pointer, or the highlighted option
   * of the list that has focus.
   */
  private readonly pendingTime = computed(() => {
    const hovered = this.hovered();
    if (hovered !== null) return hovered;
    if (!this.listFocused()) return null;
    const position = this.currentPosition();
    const time = this.highlight()[position];
    return time === null ? null : { position, time };
  });
  /** The pending run: a time under the pointer or highlighted, or the grid's pending day. */
  protected readonly pending = computed<Work | null>(() => {
    const time = this.pendingTime();
    const work = this.work();
    if (time !== null) {
      return { ...work, [time.position]: { date: this.dayFor(time.position), time: time.time } };
    }
    const openStart = this.openStart();
    const preview = this.preview();
    if (openStart === null || preview === null) return null;
    /* A pending day enters with the time that end already holds, or midnight. */
    const run = orderedRun(openStart, preview);
    return {
      start: { date: run.start, time: work.start.time ?? MIDNIGHT },
      end: { date: run.end, time: work.end.time ?? MIDNIGHT },
    };
  });
  protected readonly spokenLength = computed(() => {
    const run = this.pending() ?? this.work();
    const start = wholeOf(run.start);
    const end = wholeOf(run.end);
    if (start === null || end === null || compareDateTime(start, end) > 0) return '';
    return this.lengthOf()(dateTimeRangeSeconds(start, end));
  });
  protected readonly limitText = computed(() => {
    const min = this.minLength();
    const max = this.maxLength();
    const length = this.lengthOf();
    if (min !== undefined && max !== undefined) {
      return this.t('limit.between', { min: length(min), max: length(max) });
    }
    if (min !== undefined) return this.t('limit.atLeast', { min: length(min) });
    if (max !== undefined) return this.t('limit.atMost', { max: length(max) });
    return null;
  });

  /** The trigger's accessible name: focus returns here when the surface closes. */
  protected readonly triggerLabel = computed(() => {
    const start = this.start();
    const end = this.end();
    if (start === null || end === null) return this.t('choose');
    const format = this.format();
    const ends = { start: format.describe(start), end: format.describe(end) };
    return compareDateTime(start, end) <= 0
      ? this.t('change', { ...ends, length: this.lengthOf()(dateTimeRangeSeconds(start, end)) })
      : this.t('changeReversed', ends);
  });
  /* The frame writes each end short — "12 Sep, 14:00" — because the whole
     value in words is the trigger's. */
  private readonly short = computed(
    () =>
      new Intl.DateTimeFormat(this.resolvedLocale(), {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
        timeZone: 'UTC',
        ...(this.resolvedHourCycle() === undefined
          ? {}
          : { hour12: this.resolvedHourCycle() === 12 }),
      }),
  );
  private writeShort(item: PlainDateTime): string {
    return this.short().format(
      Date.UTC(
        item.date.year,
        item.date.month - 1,
        item.date.day,
        item.time.hour,
        item.time.minute,
      ),
    );
  }
  /** The value in words, one line; `null` while nothing is chosen. */
  protected readonly summary = computed(() => {
    if (this.held() === null) return null;
    const start = this.start();
    const end = this.end();
    return `${start === null ? '' : this.writeShort(start)} – ${end === null ? '' : this.writeShort(end)}`.trim();
  });

  constructor() {
    /* The layer is created and torn down with the surface, not with the
       component: a layer that outlived its content would hold a place in the
       single stack that nothing occupies. The work starts from the value
       every time the panel opens. */
    effect(() => {
      const open = this.isOpen();
      if (!open) {
        this.release();
        return;
      }
      /* Read untracked: the work is rebuilt when the panel opens, and not
         again when the value or the position moves while it is open. */
      untracked(() => {
        const held = this.held();
        this.work.set(workOf(held));
        this.hovered.set(null);
        this.preview.set(null);
        const missing: DateTimeRangePickerPosition | null =
          held?.start == null ? 'start' : held.end === null ? 'end' : null;
        if (missing !== null && missing !== this.currentPosition()) {
          this.setPosition(missing, 'programmatic', undefined);
        }
        const position = this.currentPosition();
        this.focusedDate.set(
          (position === 'end' ? held?.end?.date : held?.start?.date) ?? this.anchor().date,
        );
      });
      afterNextRender(() => this.attach(), { injector: this.injector });
    });

    /* The highlight of each list lands where the list opens, and follows the
       lists under it. */
    effect(() => {
      if (!this.isOpen()) return;
      const lists = this.lists();
      const current = this.highlight();
      const next = { ...current };
      for (const position of this.positions) {
        const index = this.openingIndex(position);
        next[position] = index < 0 ? null : (lists[position][index]?.time ?? null);
      }
      if (!isSameTime(next.start, current.start) || !isSameTime(next.end, current.end)) {
        this.setHighlight(next, 'programmatic', undefined);
      }
    });

    /* The lists open on their highlight once the layer is rendered, and follow
       it while the lists under it change. */
    effect(() => {
      if (!this.isOpen()) {
        this.revealed = false;
        return;
      }
      this.highlight();
      this.lists();
      this.currentPosition();
      afterNextRender(
        () => {
          this.revealHighlights(!this.revealed);
          this.revealed = true;
        },
        { injector: this.injector },
      );
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
    this.ownHighlight.set(this.defaultHighlighted() ?? NO_HIGHLIGHT);
    this.clock.set(nowDateTimeIn(this.resolvedTimeZone()));
    this.focusedDate.set(this.clock().date);

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(SHEET_QUERY);
    const read = () => this.sheet.set(query.matches);
    read();
    query.addEventListener('change', read);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', read));
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  writeValue(value: DateTimeRange | null | undefined) {
    this.ownValue.set(normalize(value));
  }

  registerOnChange(fn: (value: DateTimeRange | null) => void) {
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
   * The rules no other validator can see: the bounds, the predicate, the
   * order of the two ends and the duration. `required` is left to Angular's
   * own, because a form already has a word for it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = normalize(control.value as DateTimeRange | null | undefined);
    if (value === null) return null;
    const problems = dateTimeRangeProblems(value, {
      contiguous: this.contiguous(),
      max: this.max(),
      maxLength: this.maxLength(),
      maxTime: this.maxTime(),
      min: this.min(),
      minLength: this.minLength(),
      minTime: this.minTime(),
      unavailableDay: this.isDateUnavailable(),
      unavailableTime: this.isTimeUnavailable(),
    });
    if (problems.length === 0) return null;
    const errors: ValidationErrors = {};
    if (problems.includes('order')) errors['slottedDateTimeRangeOrder'] = { actual: value };
    if (problems.includes('min'))
      errors['slottedDateTimeRangeMin'] = { min: this.min(), actual: value };
    if (problems.includes('max'))
      errors['slottedDateTimeRangeMax'] = { max: this.max(), actual: value };
    if (problems.includes('unavailable'))
      errors['slottedDateTimeRangeUnavailable'] = { actual: value };
    if (problems.includes('length')) {
      errors['slottedDateTimeRangeLength'] = {
        minLength: this.minLength(),
        maxLength: this.maxLength(),
        actual: value,
      };
    }
    return errors;
  }

  /* ── Imperative ────────────────────────────────────────────────────── */

  /** Puts focus on the trigger, which is the frame. */
  focus() {
    this.triggerRef?.nativeElement.focus();
  }

  openSurface(source?: Event) {
    this.setOpen(true, 'programmatic', source);
  }

  closeSurface(source?: Event) {
    this.setOpen(false, 'programmatic', source);
  }

  /** A preset writes its range through here, with the `select` reason. */
  choose(range: DateTimeRange, source?: Event) {
    this.work.set(workOf(range));
    this.commit(range, 'select', source);
    this.setPosition('start', 'select', source);
    this.closeAfter(true, source);
  }

  /* ── Handlers ──────────────────────────────────────────────────────── */

  protected toggle(source: Event) {
    this.focusOnOpen = 'field';
    this.setOpen(!this.isOpen(), 'pointer', source);
  }

  protected clear(source: Event) {
    this.work.set(EMPTY);
    this.commit(null, 'clear', source);
    this.setPosition('start', 'clear', source);
    this.focus();
  }

  protected onTriggerKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    /* ChromeOS turns the chord into PageDown before the browser sees it, which
       is why the trigger is the guaranteed way in and the chord a shortcut. */
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusOnOpen = 'grid';
      if (!this.isOpen()) this.setOpen(true, 'keyboard', event);
      else this.enterGrid(this.work()[this.currentPosition()].date ?? this.anchor().date);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.focusOnOpen = 'field';
      this.setOpen(!this.isOpen(), 'keyboard', event);
    }
  }

  protected selectTab(position: DateTimeRangePickerPosition, source: Event) {
    if (position !== this.currentPosition()) this.setPosition(position, 'pointer', source);
  }

  /** Automatic activation: the arrow moves the position with it. */
  protected onTabKeyDown(event: KeyboardEvent) {
    const next: DateTimeRangePickerPosition | null =
      event.key === 'ArrowRight' || event.key === 'End'
        ? 'end'
        : event.key === 'ArrowLeft' || event.key === 'Home'
          ? 'start'
          : null;
    if (next === null) return;
    event.preventDefault();
    if (next !== this.currentPosition()) this.setPosition(next, 'keyboard', event);
    this.layer?.nativeElement
      .querySelector<HTMLElement>(`[data-part="tab"][data-position="${next}"]`)
      ?.focus({ preventScroll: true });
  }

  /**
   * The way out of a sheet that fills the screen, and of an edit left half
   * way: a whole work is the value; a half alone stays as it is.
   */
  protected done(source: Event) {
    const whole = rangeOf(this.work());
    if (whole?.start != null && whole.end !== null && !isSameDateTimeRange(whole, this.held())) {
      this.commit(whole, 'select', source);
    }
    this.setOpen(false, 'pointer', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  protected onControlFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.contains(next)) return;
    this.onTouchedFn();
  }

  protected onListFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && (event.currentTarget as HTMLElement).contains(next)) return;
    this.listFocused.set(false);
  }

  protected hover(position: DateTimeRangePickerPosition, option: TimeOption) {
    this.hovered.set(option.unavailable ? null : { position, time: option.time });
  }

  /**
   * A field in the band writes its end to the work at every request it emits,
   * with the field's own reason, and an open end is a value on its own.
   */
  protected onFieldValue(request: DateTimeFieldChangeRequest) {
    const next: Work = { ...this.work(), [this.currentPosition()]: halfOf(request.value) };
    this.work.set(next);
    this.commit(
      { start: wholeOf(next.start), end: wholeOf(next.end) },
      request.reason,
      request.source,
    );
  }

  protected chooseNow(source: Event) {
    if (!this.editable()) return;
    const before = this.work();
    const position = this.currentPosition();
    this.settle({ ...before, [position]: halfOf(this.anchor()) }, before, position, source);
  }

  protected select(position: DateTimeRangePickerPosition, option: TimeOption, source: Event) {
    if (option.unavailable || !this.editable()) return;
    const before = this.work();
    const half: Half = { date: before[position].date ?? this.dayFor(position), time: option.time };
    this.setHighlight({ ...this.highlight(), [position]: option.time }, 'pointer', source);
    this.settle({ ...before, [position]: half }, before, position, source);
  }

  protected onCalendarValue(request: ChangeRequest<CalendarValue>) {
    const next = request.value;
    if (next === null || Array.isArray(next) || !('start' in next)) return;
    const before = this.work();
    if (next.end === null) {
      /* The first press: the run restarts on this start; the end's date is
         withheld and its time kept. */
      this.settle(
        { start: { ...before.start, date: next.start }, end: { ...before.end, date: null } },
        before,
        'start',
        request.source,
      );
      return;
    }
    /* The second press: the grid ordered the two dates; the times stay with
       the end they were on. */
    this.settle(
      { start: { ...before.start, date: next.start }, end: { ...before.end, date: next.end } },
      before,
      'end',
      request.source,
    );
  }

  /**
   * After a press wrote a half: whole, the work is the value and the panel
   * closes when the press completed it; incomplete, focus carries to the half
   * that is missing — this end's first, then the other end's.
   */
  private settle(next: Work, before: Work, pressed: DateTimeRangePickerPosition, source: unknown) {
    const wasWhole = wholeOf(before.start) !== null && wholeOf(before.end) !== null;
    this.work.set(next);
    if (wholeOf(next.start) !== null && wholeOf(next.end) !== null) {
      this.commit(rangeOf(next), 'select', source);
      this.setPosition(pressed, 'select', source);
      this.closeAfter(!wasWhole, source);
      return;
    }
    for (const position of [pressed, other(pressed)]) {
      const half = next[position];
      if (half.date !== null && half.time !== null) continue;
      if (half.date === null) {
        this.setPosition(position, 'select', source);
        this.enterGrid(next[other(position)].date);
      } else {
        this.enterList(position, source);
      }
      return;
    }
  }

  private enterGrid(date: PlainDate | null) {
    afterNextRender(
      () => {
        if (date !== null) this.calendarRef?.focusDate(date);
        this.calendarRef?.focus();
      },
      { injector: this.injector },
    );
  }

  private closeAfter(completed: boolean, source: unknown) {
    const axis = this.closeOnSelect() ?? this.defaults.closeOnSelect;
    if (!(axis === 'always' || (axis === 'auto' && completed))) return;
    this.setOpen(false, 'select', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  /** Where a list opens: on its end, on the nearest step to now, or on the first available option. */
  private openingIndex(position: DateTimeRangePickerPosition): number {
    const work = this.work();
    const across = work[other(position)];
    const otherEnd =
      across.date !== null && across.time !== null && isSameDate(across.date, this.dayFor(position))
        ? across.time
        : null;
    return openingIndexOf(
      this.lists()[position],
      work[position].time ?? otherEnd ?? this.anchor().time,
      otherEnd,
      position,
    );
  }

  /**
   * Into the list of one end: the tab moves there when it is not the current
   * one, and focus lands on its highlight after the render that drew it.
   */
  private enterList(position: DateTimeRangePickerPosition, source?: unknown) {
    if (position !== this.currentPosition()) this.setPosition(position, 'select', source);
    afterNextRender(
      () => {
        const at = this.highlightIndex(position);
        const index = at >= 0 ? at : this.openingIndex(position);
        if (index < 0) {
          this.field?.focus();
          return;
        }
        const option = this.lists()[position][index];
        if (option !== undefined) {
          this.setHighlight(
            { ...this.highlight(), [position]: option.time },
            'keyboard',
            undefined,
          );
        }
        this.focusOption(position, index);
      },
      { injector: this.injector },
    );
  }

  private focusOption(position: DateTimeRangePickerPosition, index: number) {
    const rows = this.layer?.nativeElement.querySelectorAll<HTMLElement>(
      `[data-part="panel"][data-position="${position}"] [data-part="option"]`,
    );
    const row = rows?.[index];
    row?.focus();
    const list = row?.closest<HTMLElement>('[data-part="list"]');
    if (row !== undefined && list) revealRow(list, row, false);
  }

  /** The list scrolled to its highlight: centred as the surface opens, by the least after. */
  private revealHighlights(centre: boolean) {
    const index = this.highlightIndex(this.currentPosition());
    if (index < 0) return;
    const list = this.layer?.nativeElement.querySelector<HTMLElement>('[data-part="list"]');
    const row = list?.querySelectorAll<HTMLElement>('[data-part="option"]')[index];
    if (list && row !== undefined) revealRow(list, row, centre);
  }

  /** The field, or the grid where the field is not drawn (a coarse pointer). */
  private focusField() {
    const box = this.fieldBox?.nativeElement;
    if (box !== undefined && getComputedStyle(box).display === 'none') {
      this.enterGrid(this.work()[this.currentPosition()].date ?? this.anchor().date);
      return;
    }
    this.field?.focus();
  }

  /* ── The keyboard ──────────────────────────────────────────────────── */

  protected onListKeyDown(position: DateTimeRangePickerPosition, event: KeyboardEvent) {
    const list = this.lists()[position];
    const found = this.highlightIndex(position);
    const at = found >= 0 ? found : 0;

    const move = (index: number) => {
      event.preventDefault();
      const clamped = Math.max(0, Math.min(list.length - 1, index));
      const option = list[clamped];
      if (option === undefined) return;
      this.setHighlight({ ...this.highlight(), [position]: option.time }, 'keyboard', event);
      this.focusOption(position, clamped);
    };

    switch (event.key) {
      case 'ArrowDown':
        move(at + 1);
        return;
      case 'ArrowUp':
        move(at - 1);
        return;
      case 'Home':
        move(0);
        return;
      case 'End':
        move(list.length - 1);
        return;
      case 'PageDown':
        move(hourJump(list, at, 1));
        return;
      case 'PageUp':
        move(hourJump(list, at, -1));
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = list[at];
        if (option !== undefined) this.select(position, option, event);
        return;
      }
      default:
        break;
    }

    const typeahead = this.typeaheads[position];
    if (typeahead === null) return;
    if (!isPrintable(event.key, typeahead.query.length > 0)) return;
    const found2 = typeahead.match(event.key, this.labels()[position], at);
    if (found2 < 0) return;
    move(found2);
  }

  /* ── The machinery ─────────────────────────────────────────────────── */

  private commit(next: DateTimeRange | null, reason: ChangeReason, source: unknown) {
    const normalized = normalize(next);
    let cancelled = false;
    const state = createControllable<DateTimeRange | null>({
      controlled: this.value() === undefined ? undefined : this.held(),
      initial: this.held(),
      equals: isSameDateTimeRange,
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    if (!state.request(normalized, reason, source) || cancelled) return;
    if (this.value() === undefined) this.ownValue.set(normalized);
    this.onChangeFn(normalized);
  }

  private setPosition(next: DateTimeRangePickerPosition, reason: ChangeReason, source: unknown) {
    const state = createControllable<DateTimeRangePickerPosition>({
      controlled: this.position(),
      initial: this.currentPosition(),
      onRequest: (request) => this.positionChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownPosition.set(next);
  }

  private setHighlight(next: DateTimeRangePickerHighlight, reason: ChangeReason, source: unknown) {
    const state = createControllable<DateTimeRangePickerHighlight>({
      controlled: this.highlighted(),
      initial: this.highlight(),
      equals: (a, b) => isSameTime(a.start, b.start) && isSameTime(a.end, b.end),
      onRequest: (request) => this.highlightedChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownHighlight.set(next);
  }

  private setOpen(next: boolean, reason: ChangeReason, source: unknown) {
    const state = createControllable<boolean>({
      controlled: this.open(),
      initial: this.isOpen(),
      onRequest: (request) => this.openChange.emit(request),
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
        /* A field with an expression open takes Escape first: the layer asks
           in the capture phase, so the field's own attribute is what says so. */
        if (request.reason === 'escape') {
          if (layer.querySelector('[data-ui="datetime-field"][data-relative]') !== null) return;
          if (this.view() !== 'day') {
            this.view.set(this.view() === 'year' ? 'month' : 'day');
            return;
          }
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

    for (const position of this.positions) {
      this.typeaheads[position] = createTypeahead({ locale: () => this.resolvedLocale() });
    }

    /* Opened by Enter, Space or a press, focus lands on the first segment of
       the current end's field; by an arrow, in that end's list. */
    const where = this.focusOnOpen;
    this.focusOnOpen = null;
    if (where === 'grid') {
      this.enterGrid(this.work()[this.currentPosition()].date ?? this.anchor().date);
    } else if (where === 'field') {
      this.focusField();
    }
  }

  private release() {
    this.releaseGrip?.();
    this.releaseGrip = null;
    this.positioner?.destroy();
    this.positioner = null;
    this.dismissable?.destroy();
    this.dismissable = null;
    for (const position of this.positions) {
      this.typeaheads[position]?.destroy();
      this.typeaheads[position] = null;
    }
    this.layer?.nativeElement.removeAttribute('data-positioned');
  }
}

/**
 * One shortcut. It writes its range with the `select` reason and carries
 * `data-selected` while the value equals it. The list is the product's — "the
 * morning shift" is a business clock — and the family ships the button, not
 * the list.
 */
@Directive({
  selector: 'button[slDateTimeRangePickerPreset]',
  standalone: true,
  exportAs: 'slDateTimeRangePickerPreset',
  host: {
    'data-part': 'preset',
    'data-part-preset': '',
    type: 'button',
    '[attr.data-selected]': "selected() ? '' : null",
    '(click)': 'choose($event)',
  },
})
export class SlDateTimeRangePickerPreset {
  /** The range the press writes, or a function resolving it at the press. */
  readonly range = input.required<DateTimeRange | (() => DateTimeRange)>({
    alias: 'slDateTimeRangePickerPreset',
  });

  private readonly picker = inject(SlDateTimeRangePicker);

  protected readonly selected = computed(() => {
    const range = this.range();
    return isSameDateTimeRange(
      this.picker.selection(),
      typeof range === 'function' ? range() : range,
    );
  });

  protected choose(event: Event) {
    if (event.defaultPrevented) return;
    const range = this.range();
    this.picker.choose(typeof range === 'function' ? range() : range, event);
  }
}
