import {
  addDays,
  clampDate,
  createDateFormat,
  endOfWeek,
  isDateInRange,
  isSameDate,
  monthGrid,
  plainDate,
  startOfWeek,
  stepMonth,
  stepYear,
  todayIn,
  toISODate,
  visibleMonths,
  yearPage,
} from '@slotted/core/date';
import type { CalendarDay, CalendarWeek, PlainDate } from '@slotted/core/date';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { calendarMessages, type CalendarMessages, type PartialMessages } from '@slotted/core/i18n';

import { injectCalendarDefaults } from './calendar-defaults';
import type {
  CalendarCalendar,
  CalendarGranularity,
  CalendarMark,
  CalendarOutsideDays,
  CalendarSelectionMode,
  CalendarValue,
  CalendarView,
} from './calendar-defaults';
import {
  isRange,
  isSameValue,
  isSelected,
  nextValue,
  previewRun,
  rangeStateOf,
} from './calendar-selection';

/** How many years one page of the year view holds. */
const YEAR_PAGE = 12;
/** The heading needs an identifier every grid can point `aria-labelledby` at. */
let sequence = 0;

/**
 * A month grid, and the two pages above it.
 *
 * **It is a real `table` with the `grid` role on it.** The APG's own note is
 * why nothing here writes `row`, `columnheader` or `gridcell`: those are
 * implied by `tr`, `th` and `td`, and writing them again would duplicate
 * semantics the platform already gives.
 *
 * **The date the reader is on and the date the reader has chosen are two
 * values**, and each has a model of its own — a product that pages a calendar
 * from outside it has nowhere else to say so.
 *
 * **A date the predicate refuses stays reachable.** It carries `aria-disabled`
 * rather than being taken out of the grid, so a reader can arrow onto it, hear
 * why it is out, and arrow past it.
 */
@Component({
  selector: '[slCalendar]',
  standalone: true,
  exportAs: 'slCalendar',
  imports: [SlGlyph, SlIcon],
  template: `<div data-part="header" data-part-header="">
      <button
        data-part="previous"
        data-part-previous=""
        type="button"
        [attr.aria-label]="pageNames()[0]"
        [disabled]="!editable()"
        (click)="turnPage(-1, $event)"
      >
        <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
      </button>
      <!--
        The heading is a live region: paging with a key changes nothing that
        focus lands on, so without this nothing announces the new month.
      -->
      <button
        data-part="heading"
        data-part-heading=""
        type="button"
        aria-live="polite"
        [attr.id]="headingId"
        [disabled]="!editable() || currentView() === 'year'"
        (click)="walkUp()"
      >
        {{ heading() }}
        @if (currentView() !== 'year') {
          <span slIcon><svg slGlyph name="chevron-down"></svg></span>
        }
      </button>
      <button
        data-part="next"
        data-part-next=""
        type="button"
        [attr.aria-label]="pageNames()[1]"
        [disabled]="!editable()"
        (click)="turnPage(1, $event)"
      >
        <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
      </button>
    </div>

    @switch (currentView()) {
      @case ('day') {
        <div data-part="grids" data-part-grids="">
          @for (month of shownMonths(); track month.year * 12 + month.month) {
            <table
              data-part="grid"
              data-part-grid=""
              role="grid"
              [attr.aria-labelledby]="headingId"
            >
              <caption data-part="grid-caption" data-part-grid-caption="">
                {{
                  captionOf(month)
                }}
              </caption>
              <thead>
                <tr data-part="week-headers" data-part-week-headers="">
                  @if (resolvedWeekNumbers()) {
                    <th data-part="week-number" data-part-week-number="" aria-hidden="true"></th>
                  }
                  @for (name of weekdayNarrow(); track $index) {
                    <th
                      data-part="week-header"
                      data-part-week-header=""
                      scope="col"
                      [attr.abbr]="weekdayLong()[$index]"
                    >
                      {{ name }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (week of weeksOf(month); track week.weekNumber) {
                  <tr data-part="week" data-part-week="">
                    @if (resolvedWeekNumbers()) {
                      <th data-part="week-number" data-part-week-number="" scope="row">
                        {{ week.weekNumber }}
                      </th>
                    }
                    @for (
                      day of week.days;
                      track day.date.year * 400 + day.date.month * 32 + day.date.day
                    ) {
                      <!-- A hidden day is an empty cell and nothing else. It
                           carried the marks of the date it stood for, so a
                           range across a month boundary painted a band with no
                           digits under it. -->
                      <td
                        data-part="cell"
                        data-part-cell=""
                        [attr.data-outside-month]="day.outsideMonth ? '' : null"
                        [attr.data-unavailable]="
                          !drawn(day) ? null : unavailable(day.date) ? '' : null
                        "
                        [attr.data-selected]="!drawn(day) ? null : chosen(day.date) ? '' : null"
                        [attr.data-range-start]="
                          drawn(day) && rangeState(day.date) === 'start' ? '' : null
                        "
                        [attr.data-range-end]="
                          drawn(day) && rangeState(day.date) === 'end' ? '' : null
                        "
                        [attr.data-in-range]="
                          drawn(day) && rangeState(day.date) === 'inside' ? '' : null
                        "
                        [attr.data-preview]="drawn(day) && proposed(day.date) ? '' : null"
                      >
                        @if (drawn(day)) {
                          <!-- The mark's words follow the number with no space, so the name reads "12, 2 items". -->
                          <!-- prettier-ignore -->
                          <span
                            data-part="day"
                            data-part-day=""
                            role="button"
                            [attr.data-today]="isToday(day.date) ? '' : null"
                            [attr.aria-selected]="chosen(day.date) ? 'true' : null"
                            [attr.aria-disabled]="refused(day) ? 'true' : null"
                            [tabindex]="tabIndexOf(day.date)"
                            (click)="!refused(day) && select(day.date, 'pointer', $event)"
                            (pointerenter)="hovered.set(day.date)"
                            (pointerleave)="hovered.set(null)"
                          >{{ day.date.day }}@if (markOf(day.date); as mark) {<span
                                data-part="mark"
                                data-part-mark=""
                                [attr.data-tone]="mark.tone ?? null"
                              ><span data-ui="visually-hidden" data-ui-visually-hidden="">, {{ markName(mark) }}</span></span>}</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
      @case ('month') {
        @if (monthly()) {
          <div data-part="months" data-part-months="">
            @for (name of monthNames(); track $index) {
              <button
                data-part="period"
                data-part-period=""
                type="button"
                [attr.aria-label]="monthLabel($index + 1)"
                [attr.data-selected]="heldMonth($index + 1) ? '' : null"
                [attr.aria-selected]="heldMonth($index + 1) ? 'true' : null"
                [attr.aria-disabled]="monthUnavailable($index + 1) ? 'true' : null"
                [attr.data-unavailable]="monthUnavailable($index + 1) ? '' : null"
                [attr.data-focused]="focused().month === $index + 1 ? '' : null"
                [tabindex]="focused().month === $index + 1 ? 0 : -1"
                (click)="selectMonth(focused().year, $index + 1, 'pointer', $event)"
              >
                {{ name }}
              </button>
            }
          </div>
        } @else {
          <div data-part="months" data-part-months="">
            @for (name of monthNames(); track $index) {
              <button
                data-part="period"
                data-part-period=""
                type="button"
                [attr.data-selected]="focused().month === $index + 1 ? '' : null"
                [attr.aria-selected]="focused().month === $index + 1 ? 'true' : null"
                (click)="pickMonth($index + 1, $event)"
              >
                {{ name }}
              </button>
            }
          </div>
        }
      }
      @default {
        <div data-part="years" data-part-years="">
          @for (year of years(); track year) {
            <button
              data-part="period"
              data-part-period=""
              type="button"
              [attr.data-selected]="focused().year === year ? '' : null"
              [attr.aria-selected]="focused().year === year ? 'true' : null"
              (click)="pickYear(year, $event)"
            >
              {{ year }}
            </button>
          }
        </div>
      }
    }`,
  styleUrls: [
    '../../../styles/src/calendar/calendar.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'calendar',
    'data-ui-calendar': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-view]': 'currentView()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-months]': 'resolvedMonths() > 1 ? resolvedMonths() : null',
    '[attr.data-week-numbers]': "resolvedWeekNumbers() ? '' : null",
    '[attr.data-disabled]': "disabled() === true ? '' : null",
    '[attr.data-readonly]': "readOnly() === true ? '' : null",
    '[attr.data-invalid]': "invalid() === true ? '' : null",
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlCalendar implements OnInit {
  /** Present means the consumer owns the value. */
  readonly value = input<CalendarValue | undefined>(undefined);
  readonly defaultValue = input<CalendarValue | undefined>(undefined);
  /** The date the reader is on. Present means the consumer owns it. */
  readonly focusedDate = input<PlainDate | undefined>(undefined);
  readonly defaultFocusedDate = input<PlainDate | undefined>(undefined);

  readonly min = input<PlainDate | undefined>(undefined);
  readonly max = input<PlainDate | undefined>(undefined);
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);

  readonly selectionMode = input<CalendarSelectionMode>('single');
  readonly months = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** Present means the consumer owns which grid is showing. */
  readonly view = input<CalendarView | undefined>(undefined);
  readonly defaultView = input<CalendarView | undefined>(undefined);
  /** What a choice is: a day, or a month of a year. Defaults to `day`. */
  readonly granularity = input<CalendarGranularity | undefined>(undefined);

  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly fixedWeeks = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly outsideDays = input<CalendarOutsideDays | undefined>(undefined);
  /**
   * What falls on a day, keyed by its ISO date (`2026-09-12`): a `mark` part under the number,
   * in the given tone, and its count in the day's accessible name ("12, 2 items"). It composes
   * with every selection mode, `min`, `max` and `outsideDays`.
   */
  readonly marks = input<ReadonlyMap<string, CalendarMark> | undefined>(undefined);

  /** The locale that writes months and days. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly calendar = input<CalendarCalendar | undefined>(undefined);

  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * names of the previous and next triggers.
   */
  readonly messages = input<PartialMessages<CalendarMessages> | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<CalendarValue>>();
  readonly focusedDateChange = output<ChangeRequest<PlainDate>>();
  readonly viewChange = output<CalendarView>();
  /**
   * The pending end of an open run: the day under the pointer, or the focused
   * day when no pointer is over the grid, and `null` while no run is open. A
   * fact the grid states rather than a value the consumer owns, which is why
   * it is an output and not a model — `date-range-picker` reads it to say how
   * long the run would be.
   */
  readonly previewChange = output<PlainDate | null>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly defaults = injectCalendarDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this calendar's `messages` laid over them. */
  readonly t = injectMessages(calendarMessages, this.messages);

  protected markOf(date: PlainDate): CalendarMark | undefined {
    return this.marks()?.get(toISODate(date));
  }

  protected markName(mark: CalendarMark): string {
    return mark.count === undefined ? this.t('marked') : this.t('markCount', { count: mark.count });
  }

  protected readonly headingId = `sl-calendar-${String((sequence += 1))}`;

  private readonly ownValue = signal<CalendarValue>(null);
  private readonly ownFocused = signal<PlainDate>(plainDate(2026, 1, 1));
  private readonly ownView = signal<CalendarView>('day');
  /**
   * The first month on screen, which is **not** the month the reader is on.
   *
   * Drawing two months from the focused date meant that choosing a day in the
   * second one scrolled the pair: a reader looking at June and July who chose
   * 9 June was shown July and August, with half of what they had just chosen
   * off screen. The page moves only when the reader leaves it.
   */
  private readonly page = signal<{ year: number; month: number }>({ year: 2026, month: 1 });
  private readonly today = signal<PlainDate | null>(null);
  /** Focus is only moved into the DOM after a key, never on a render. */
  private restoreFocus = false;

  protected readonly held = computed(() => this.value() ?? this.ownValue());
  protected readonly focused = computed(() => this.focusedDate() ?? this.ownFocused());
  /**
   * Under `granularity="month"` the months of a year are where a choice is
   * made: the calendar opens there and never goes below it, so a view asked
   * for as `day` is read as `month`.
   */
  protected readonly monthly = computed(() => this.granularity() === 'month');
  /** Which grid is showing. Public, so a template reaches it through `exportAs`. */
  readonly currentView = computed((): CalendarView => {
    const asked = this.view() ?? this.ownView();
    return this.monthly() && asked === 'day' ? 'month' : asked;
  });

  protected readonly resolvedMonths = computed(() =>
    Math.max(1, this.months() ?? this.defaults.months),
  );
  protected readonly resolvedWeekNumbers = computed(
    () => this.weekNumbers() ?? this.defaults.weekNumbers,
  );
  protected readonly resolvedFixedWeeks = computed(
    () => this.fixedWeeks() ?? this.defaults.fixedWeeks,
  );
  /**
   * One month draws the days either side of it, because a week that starts on
   * the 30th of the month before has to say what that cell is. Two months
   * cannot: September's grid ends with the first three days of October and
   * October's begins with the last four of September, so a range across the
   * boundary is painted twice and a reader sees an interval twice as long as
   * the one chosen. Every surveyed multi-month calendar hides them, and so
   * does this one — until the consumer says otherwise, on the instance or on
   * the provider.
   */
  protected readonly resolvedOutsideDays = computed(
    () =>
      this.outsideDays() ??
      this.defaults.outsideDays ??
      (this.resolvedMonths() > 1 ? 'hidden' : 'shown'),
  );
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly editable = computed(
    () => this.disabled() !== true && this.readOnly() !== true,
  );

  protected readonly format = computed(() =>
    createDateFormat({
      locale: this.locale() ?? this.appLocale(),
      firstDayOfWeek: this.firstDayOfWeek() ?? this.defaults.firstDayOfWeek,
    }),
  );

  protected readonly weekdayLong = computed(() => this.format().weekdayNames('long'));
  protected readonly weekdayNarrow = computed(() => this.format().weekdayNames('narrow'));
  protected readonly monthNames = computed(() => this.format().monthNames('short'));
  /** Each paging button is named for the step it takes in the view showing. */
  protected readonly pageNames = computed(() => {
    const view = this.currentView();
    if (view === 'day') return [this.t('previousMonth'), this.t('nextMonth')];
    if (view === 'month') return [this.t('previousYear'), this.t('nextYear')];
    return [this.t('previousYears'), this.t('nextYears')];
  });
  protected readonly years = computed(() => yearPage(this.focused().year, YEAR_PAGE));
  protected readonly shownMonths = computed(() =>
    visibleMonths(this.page(), this.resolvedMonths()),
  );

  protected readonly heading = computed(() => {
    const focused = this.focused();
    const format = this.format();
    if (this.currentView() === 'year') {
      const years = this.years();
      return `${String(years[0] ?? focused.year)} – ${String(years.at(-1) ?? focused.year)}`;
    }
    if (this.currentView() === 'month') return String(focused.year);

    const page = this.page();
    const start = plainDate(page.year, page.month, 1);
    if (this.resolvedMonths() === 1) return format.monthYear(start);
    const last = stepMonth(start, this.resolvedMonths() - 1).date;
    return `${format.monthYear(start, 'short')} – ${format.monthYear(last, 'short')}`;
  });

  constructor() {
    /**
     * The page follows the reader, and only when the reader has left it.
     * Written as an effect rather than inside the request, so a consumer who
     * owns `focusedDate` and moves it from outside is followed too.
     */
    /* The pending end, reported once per change and never while it is the
       same day: a pointer crossing a cell twice is one fact, not two. */
    let reported: PlainDate | null = null;
    effect(() => {
      const end = this.previewEnd();
      if (isSameDate(reported, end)) return;
      reported = end;
      this.previewChange.emit(end);
    });

    effect(() => {
      const focused = this.focused();
      const held = this.page();
      const span = this.resolvedMonths();
      const start = held.year * 12 + (held.month - 1);
      const wanted = focused.year * 12 + (focused.month - 1);
      if (wanted >= start && wanted < start + span) return;
      /* Outside the span: the page moves by whole pages, so a reader stepping
         past the edge lands where the arrows would have taken them. */
      const moved = start + Math.floor((wanted - start) / span) * span;
      this.page.set({ year: Math.floor(moved / 12), month: (moved % 12) + 1 });
    });
  }

  ngOnInit() {
    this.ownValue.set(this.defaultValue() ?? null);
    this.ownView.set(this.defaultView() ?? (this.monthly() ? 'month' : 'day'));
    this.today.set(todayIn(this.timeZone() ?? this.defaults.timeZone));
    const start = this.startingDate();
    this.ownFocused.set(start);
    this.page.set({ year: start.year, month: start.month });
  }

  /** Puts focus on the cell holding the roving tab stop. */
  focus() {
    this.element
      .querySelector<HTMLElement>(
        '[data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
      )
      ?.focus();
  }

  /** Moves the reader to a date, paging the grid to reach it. */
  focusDate(date: PlainDate) {
    this.requestFocused(date, 'programmatic', undefined);
  }

  /** The date, the run or the set the calendar holds. */
  readonly selection = computed(() => this.held());

  protected captionOf(month: { year: number; month: number }) {
    return this.format().monthYear(plainDate(month.year, month.month, 1));
  }

  protected weeksOf(month: { year: number; month: number }): CalendarWeek[] {
    return monthGrid({
      ...month,
      firstDayOfWeek: this.format().firstDayOfWeek,
      fixedWeeks: this.resolvedFixedWeeks(),
    });
  }

  protected unavailable(date: PlainDate): boolean {
    if (!isDateInRange(date, this.min(), this.max())) return true;
    return this.isDateUnavailable()?.(date) === true;
  }

  /** Unavailable, or an outside day the axis says may not be chosen. */
  /** Whether the cell carries a day at all, or stands empty to fill the row. */
  protected drawn(day: CalendarDay): boolean {
    return !(day.outsideMonth && this.resolvedOutsideDays() === 'hidden');
  }

  /**
   * The grid already knows which month a day belongs to, and asking the first
   * shown month instead refused every day of the second one in a pair.
   */
  protected refused(day: CalendarDay): boolean {
    if (this.unavailable(day.date)) return true;
    return day.outsideMonth && this.resolvedOutsideDays() === 'shown';
  }

  protected chosen(date: PlainDate): boolean {
    return isSelected(date, this.held());
  }

  /**
   * The day under the pointer, held only to name the pending end of an open
   * run. It never moves the roving focus: a pointer crossing the grid is not
   * the reader choosing where they are.
   */
  protected readonly hovered = signal<PlainDate | null>(null);

  /** The run as it would close on the pending end; `null` while no run is open. */
  private readonly pending = computed(() =>
    this.selectionMode() === 'range' && this.editable()
      ? previewRun(this.held(), this.hovered() ?? this.focused())
      : null,
  );

  private readonly previewEnd = computed(() => {
    const pending = this.pending();
    const held = this.held();
    if (pending === null) return null;
    return isRange(held) && held.start !== null && isSameDate(pending.start, held.start)
      ? pending.end
      : pending.start;
  });

  protected rangeState(date: PlainDate) {
    return rangeStateOf(date, this.pending() ?? this.held());
  }

  /** Every cell of the pending band is a proposal except the start the reader chose. */
  protected proposed(date: PlainDate): boolean {
    return this.pending() !== null && this.rangeState(date) !== null && !this.chosen(date);
  }

  protected isToday(date: PlainDate): boolean {
    const today = this.today();
    return today !== null && isSameDate(date, today);
  }

  protected tabIndexOf(date: PlainDate): number {
    return isSameDate(date, this.focused()) && this.editable() ? 0 : -1;
  }

  protected select(date: PlainDate, reason: ChangeReason, source: Event | undefined) {
    if (!this.editable() || this.unavailable(date)) return;
    this.requestValue(nextValue(date, this.held(), this.selectionMode()), reason, source);
    this.requestFocused(date, reason, source);
  }

  /** A month cell's name: the month and the year, which the cell alone does not say. */
  protected monthLabel(month: number): string {
    return this.format().monthYear(plainDate(this.focused().year, month, 1));
  }

  /** Whether the value's month is this cell of the year on screen. */
  protected heldMonth(month: number): boolean {
    const held = this.held();
    if (held === null || Array.isArray(held) || isRange(held)) return false;
    return held.year === this.focused().year && held.month === month;
  }

  /**
   * A month the bounds leave no day of. The bounds are days, so a month is
   * refused only when it ends before `min` or starts after `max`.
   */
  protected monthUnavailable(month: number, year = this.focused().year): boolean {
    const at = year * 12 + month;
    const min = this.min();
    const max = this.max();
    return (
      (min !== undefined && at < min.year * 12 + min.month) ||
      (max !== undefined && at > max.year * 12 + max.month)
    );
  }

  /** The value of a month cell is the first day of the month. */
  protected selectMonth(
    year: number,
    month: number,
    reason: ChangeReason,
    source: Event | undefined,
  ) {
    if (!this.editable() || this.monthUnavailable(month, year)) return;
    const date = plainDate(year, month, 1);
    this.requestValue(date, reason, source);
    this.requestFocused(date, reason, source);
  }

  /** The reader moves with the page rather than staying behind it. */
  protected turnPage(direction: 1 | -1, source: Event) {
    const focused = this.focused();
    if (this.currentView() === 'day') {
      this.requestFocused(
        stepMonth(focused, direction * this.resolvedMonths()).date,
        'pointer',
        source,
      );
      return;
    }
    const step = this.currentView() === 'month' ? direction : direction * YEAR_PAGE;
    this.requestFocused(stepYear(focused, step).date, 'pointer', source);
  }

  protected walkUp() {
    this.setView(this.currentView() === 'day' ? 'month' : 'year');
  }

  protected pickMonth(month: number, source: Event) {
    this.requestFocused({ ...this.focused(), month, day: 1 }, 'pointer', source);
    this.setView('day');
  }

  protected pickYear(year: number, source: Event) {
    this.requestFocused({ ...this.focused(), year, day: 1 }, 'pointer', source);
    this.setView('month');
  }

  protected onKeyDown(event: KeyboardEvent) {
    const rtl = getComputedStyle(this.element).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    const focused = this.focused();
    const first = this.format().firstDayOfWeek;

    /**
     * A key the grid acted on is the grid's, and nothing above it sees it.
     * An application that binds a bare key guards it with "is the target an
     * editable element", and a `td` is not one — so the arrows a reader walks
     * a month with would fire every shortcut on the page.
     */
    const consume = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    const move = (next: PlainDate) => {
      consume();
      this.requestFocused(next, 'keyboard', event);
    };

    /**
     * The months of a year, as a grid of four columns: the arrows move one
     * month or one row, Home and End reach January and December, the page
     * keys move a year, and Enter or Space chooses. Escape is left alone, so
     * the surface above the calendar may close on it.
     */
    if (this.monthly() && this.currentView() === 'month') {
      const toMonth = (delta: number) => {
        const index = focused.year * 12 + (focused.month - 1) + delta;
        return plainDate(Math.floor(index / 12), (index % 12) + 1, 1);
      };
      switch (event.key) {
        case forward:
          return move(toMonth(1));
        case backward:
          return move(toMonth(-1));
        case 'ArrowUp':
          return move(toMonth(-4));
        case 'ArrowDown':
          return move(toMonth(4));
        case 'Home':
          return move(plainDate(focused.year, 1, 1));
        case 'End':
          return move(plainDate(focused.year, 12, 1));
        case 'PageUp':
          return move(toMonth(-12));
        case 'PageDown':
          return move(toMonth(12));
        case 'Enter':
        case ' ':
          consume();
          this.selectMonth(focused.year, focused.month, 'keyboard', event);
          return;
        default:
          break;
      }
    }

    switch (event.key) {
      case forward:
        return move(addDays(focused, 1));
      case backward:
        return move(addDays(focused, -1));
      case 'ArrowUp':
        return move(addDays(focused, -7));
      case 'ArrowDown':
        return move(addDays(focused, 7));
      case 'Home':
        return move(startOfWeek(focused, first));
      case 'End':
        return move(endOfWeek(focused, first));
      case 'PageUp':
        return move(event.shiftKey ? stepYear(focused, -1).date : stepMonth(focused, -1).date);
      case 'PageDown':
        return move(event.shiftKey ? stepYear(focused, 1).date : stepMonth(focused, 1).date);
      case 'Enter':
      case ' ':
        consume();
        this.select(focused, 'keyboard', event);
        return;
      case 'Escape':
        /* The view closes before the surface does, which is the staging
           `dismissable-layer` asks a family to do: the key is simply not
           passed on, and no layer is asked to close. */
        /* In the day view the key is left alone, so a surface above the
           calendar may still close on it. */
        if (this.currentView() === 'day' || (this.monthly() && this.currentView() === 'month')) {
          return;
        }
        consume();
        this.setView(this.currentView() === 'year' ? 'month' : 'day');
        return;
      default:
        return;
    }
  }

  /**
   * The first date the reader is put on: what a consumer said, then the value
   * it holds, then today. A calendar that opened on an arbitrary month would
   * make the reader page to now before doing anything at all.
   */
  private startingDate(): PlainDate {
    const stated = this.defaultFocusedDate() ?? this.focusedDate();
    if (stated !== undefined) return stated;
    const held = this.defaultValue() ?? this.value() ?? null;
    if (held !== null) {
      if (Array.isArray(held)) {
        const first = held[0];
        if (first !== undefined) return first;
      } else if ('start' in held) {
        if (held.start !== null) return held.start;
      } else {
        return held;
      }
    }
    return clampDate(this.today() ?? plainDate(2026, 1, 1), this.min(), this.max());
  }

  private setView(next: CalendarView) {
    if (this.view() === undefined) this.ownView.set(next);
    this.viewChange.emit(next);
  }

  private requestValue(next: CalendarValue, reason: ChangeReason, source: Event | undefined) {
    const state = createControllable<CalendarValue>({
      controlled: this.value(),
      initial: this.held(),
      equals: isSameValue,
      onRequest: (request) => this.valueChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownValue.set(next);
  }

  private requestFocused(next: PlainDate, reason: ChangeReason, source: Event | undefined) {
    const bounded = clampDate(next, this.min(), this.max());
    const state = createControllable<PlainDate>({
      controlled: this.focusedDate(),
      initial: this.focused(),
      equals: (a, b) => isSameDate(a, b),
      onRequest: (request) => this.focusedDateChange.emit(request),
    });
    this.restoreFocus = reason === 'keyboard';
    if (state.request(bounded, reason, source)) this.ownFocused.set(bounded);
    if (this.restoreFocus) this.followFocus();
  }

  /**
   * Focus follows a key onto the cell that holds the roving tab stop, once the
   * page holding it is rendered.
   *
   * A key that crosses the month edge lands on the old page's trailing day
   * first, and the page follows one render later. Focused before that, the
   * cell was replaced under the reader and focus fell to the document — which
   * a consumer owning `focusedDate` met on every crossing. Focus is moved only
   * while it is still in the calendar or was lost to the document, so a
   * consumer that refused the move never has focus taken from elsewhere.
   */
  private followFocus() {
    afterNextRender(
      () => {
        if (!this.restoreFocus) return;
        const active = this.element.ownerDocument.activeElement;
        const lost = active === null || active === this.element.ownerDocument.body;
        if (!lost && !this.element.contains(active)) {
          this.restoreFocus = false;
          return;
        }
        const stop = this.element.querySelector<HTMLElement>(
          '[data-part="cell"]:not([data-outside-month]) [data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
        );
        if (stop !== null) {
          this.restoreFocus = false;
          stop.focus();
          return;
        }
        if (this.element.querySelector('[data-part="day"][tabindex="0"]') === null) {
          this.restoreFocus = false;
          return;
        }
        this.followFocus();
      },
      { injector: this.injector },
    );
  }
}
