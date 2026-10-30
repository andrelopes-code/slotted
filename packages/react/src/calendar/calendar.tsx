import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/calendar/calendar.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

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
import type { PlainDate } from '@slotted/core/date';
import { calendarMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useCalendarDefaults } from './calendar-defaults';
import {
  isRange,
  isSameValue,
  isSelected,
  nextValue,
  previewRun,
  rangeStateOf,
} from './calendar-selection';
import type {
  CalendarMark,
  CalendarProps,
  CalendarRootProps,
  CalendarValue,
  CalendarView,
  DateRange,
} from './calendar.types';

/** The month and year views are drawn four across; a week is seven. */
const VIEW_COLUMNS: Record<CalendarView, number> = { day: 7, month: 4, year: 4 };
/** How many years one page of the year view holds. */
const YEAR_PAGE = 12;

/**
 * A month grid, and the two pages above it.
 *
 * **It is a real `table` with the `grid` role on it.** The APG's own note is
 * why nothing here writes `row`, `columnheader` or `gridcell`: those are
 * implied by `tr`, `th` and `td`, and writing them again would duplicate
 * semantics the platform already gives.
 *
 * **The date the reader is on and the date the reader has chosen are two
 * values.** Every surveyed implementation holds both; three of the seven let a
 * consumer own the second one, and so does this — `focusedDate` is a mutable
 * capability with a model of its own, because a product that pages a calendar
 * from outside it has nowhere else to say so.
 *
 * **A date the predicate refuses stays reachable.** It carries `aria-disabled`
 * rather than being taken out of the grid, so a reader can arrow onto it, hear
 * why it is out, and arrow past it.
 *
 * **Nothing is withdrawn when the box is narrow.** The cell is the room there
 * is divided by the columns there are, bounded by the control height above and
 * the WCAG minimum below, and a month that no longer fits beside another wraps
 * under it. A calendar with a day missing is not a calendar.
 */
export function Calendar({
  calendar,
  className,
  defaultFocusedDate,
  defaultValue,
  defaultView,
  disabled,
  firstDayOfWeek,
  fixedWeeks,
  focusedDate,
  granularity,
  invalid,
  isDateUnavailable,
  locale,
  max,
  min,
  messages,
  months,
  onFocusedDateChange,
  onKeyDown,
  onPreviewChange,
  onValueChange,
  onViewChange,
  marks,
  outsideDays,
  readOnly,
  ref,
  render,
  selectionMode = 'single',
  style,
  timeZone,
  value,
  view,
  weekNumbers,
  ...nativeProps
}: CalendarProps) {
  const defaults = useCalendarDefaults();
  const appLocale = useLocale();
  const t = useMessages(calendarMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  const resolvedLocale = locale ?? appLocale;
  const resolvedFirstDay = firstDayOfWeek ?? defaults.firstDayOfWeek;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const resolvedMonths = Math.max(1, months ?? defaults.months);
  const resolvedWeekNumbers = weekNumbers ?? defaults.weekNumbers;
  const resolvedFixedWeeks = fixedWeeks ?? defaults.fixedWeeks;
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
  const resolvedOutsideDays =
    outsideDays ?? defaults.outsideDays ?? (resolvedMonths > 1 ? 'hidden' : 'shown');
  const resolvedCalendar = calendar ?? defaults.calendar;
  const editable = disabled !== true && readOnly !== true;

  const format = useMemo(
    () => createDateFormat({ locale: resolvedLocale, firstDayOfWeek: resolvedFirstDay }),
    [resolvedFirstDay, resolvedLocale],
  );

  /**
   * Which day it is, resolved after the first paint rather than during it. A
   * server and a browser in different zones disagree about today, and a value
   * read during render would hydrate to different markup on the two sides.
   */
  const [today, setToday] = useState<PlainDate | null>(null);
  useEffect(() => setToday(todayIn(resolvedTimeZone)), [resolvedTimeZone]);

  const [ownValue, setOwnValue] = useState<CalendarValue>(defaultValue ?? null);
  const held = value ?? ownValue;

  /**
   * The date the first page opens on: the one stated, else the first date held
   * — controlled or not — else today, once the effect below resolves it. A
   * controlled `value` counts: a date picker hands its calendar the value
   * rather than a default, and opened on today's month it showed a page that
   * did not hold the chosen date.
   */
  const heldAtStart = defaultValue ?? value ?? null;
  const firstHeld =
    heldAtStart === null
      ? null
      : Array.isArray(heldAtStart)
        ? (heldAtStart[0] ?? null)
        : 'start' in heldAtStart
          ? heldAtStart.start
          : heldAtStart;
  const anchored =
    defaultFocusedDate !== undefined || focusedDate !== undefined || firstHeld !== null;
  const anchor = defaultFocusedDate ?? focusedDate ?? firstHeld ?? plainDate(2026, 1, 1);

  const [ownFocused, setOwnFocused] = useState<PlainDate>(anchor);
  const focused = focusedDate ?? ownFocused;
  /** The focus is only moved into the DOM after a key, never on a render. */
  const shouldRestoreFocus = useRef(false);

  /**
   * Under `granularity="month"` the months of a year are where a choice is
   * made: the calendar opens there and never goes below it, so a view asked
   * for as `day` is read as `month`.
   */
  const monthly = granularity === 'month';
  const [ownView, setOwnView] = useState<CalendarView>(defaultView ?? (monthly ? 'month' : 'day'));
  const askedView = view ?? ownView;
  const currentView: CalendarView = monthly && askedView === 'day' ? 'month' : askedView;

  /**
   * The day under the pointer, held only to name the pending end of an open
   * run. It never moves the roving focus: a pointer crossing the grid is not
   * the reader choosing where they are.
   */
  const [hovered, setHovered] = useState<PlainDate | null>(null);
  const pending =
    selectionMode === 'range' && editable ? previewRun(held, hovered ?? focused) : null;
  const previewEnd =
    pending === null
      ? null
      : isRange(held) && held.start !== null && isSameDate(pending.start, held.start)
        ? pending.end
        : pending.start;
  const reported = useRef<PlainDate | null>(null);
  useEffect(() => {
    if (isSameDate(reported.current, previewEnd)) return;
    reported.current = previewEnd;
    onPreviewChange?.(previewEnd);
  }, [onPreviewChange, previewEnd]);

  /**
   * The first month on screen, which is **not** the month the reader is on.
   *
   * Drawing two months from the focused date meant that choosing a day in the
   * second one scrolled the pair: a reader looking at June and July who chose
   * 9 June was shown July and August, with half of what they had just chosen
   * off screen. The page moves only when the reader leaves it — which is what
   * every surveyed implementation does and what `pageBehavior` is named for.
   */
  const [page, setPage] = useState<{ year: number; month: number }>(() => ({
    year: anchor.year,
    month: anchor.month,
  }));

  const pageFor = useCallback(
    (date: PlainDate, from: { year: number; month: number }) => {
      const held = from.year * 12 + (from.month - 1);
      const wanted = date.year * 12 + (date.month - 1);
      if (wanted >= held && wanted < held + resolvedMonths) return from;
      /* Outside the span: the page moves to hold the date, and it moves by
         whole pages so a reader stepping past the edge lands where the arrows
         would have taken them. */
      const steps = Math.floor((wanted - held) / resolvedMonths);
      const start = held + steps * resolvedMonths;
      return { year: Math.floor(start / 12), month: (start % 12) + 1 };
    },
    [resolvedMonths],
  );

  /* The reader's first calendar opens on today rather than on an arbitrary
     month, and only while nobody has said otherwise. */
  useEffect(() => {
    if (today === null || anchored) return;
    const start = clampDate(today, min, max);
    setOwnFocused((previous) => (isSameDate(previous, anchor) ? start : previous));
    /* The page starts on today's month, as it would on a stated date. Left to
       follow focus from the placeholder month, two months paged in whole pages
       from January and opened in October on September and October. */
    setPage((held) =>
      held.year === anchor.year && held.month === anchor.month
        ? { year: start.year, month: start.month }
        : held,
    );
    /* Only on the first resolution of today: the anchor and the bounds are
       read once, and a later change to either is the consumer's to apply. */
  }, [today]);

  const requestValue = useCallback(
    (next: CalendarValue, reason: 'pointer' | 'keyboard' | 'clear', source: unknown) => {
      const state = createControllable<CalendarValue>({
        controlled: value,
        initial: held,
        equals: isSameValue,
        onRequest: (request) => onValueChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnValue(next);
    },
    [held, onValueChange, value],
  );

  const requestFocused = useCallback(
    (next: PlainDate, reason: 'pointer' | 'keyboard', source: unknown) => {
      const bounded = clampDate(next, min, max);
      const state = createControllable<PlainDate>({
        controlled: focusedDate,
        initial: focused,
        equals: (a, b) => isSameDate(a, b),
        onRequest: (request) => onFocusedDateChange?.(request.value, request),
      });
      shouldRestoreFocus.current = reason === 'keyboard';
      if (state.request(bounded, reason, source)) setOwnFocused(bounded);
    },
    [focused, focusedDate, max, min, onFocusedDateChange],
  );

  /**
   * The page follows the reader, and only when the reader has left it. Written
   * here rather than inside the request, so a consumer who owns `focusedDate`
   * and moves it from outside is followed too.
   */
  useEffect(() => {
    setPage((held) => pageFor(focused, held));
  }, [focused, pageFor]);

  const changeView = useCallback(
    (next: CalendarView) => {
      if (view === undefined) setOwnView(next);
      onViewChange?.(next);
    },
    [onViewChange, view],
  );

  /**
   * The cell holding the roving tab stop takes focus back after a key moved
   * it, and only then: a calendar that focused itself on every render would
   * steal the reader's place on the page.
   */
  useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    const root = rootRef.current;
    const stop = root?.querySelector<HTMLElement>(
      '[data-part="cell"]:not([data-outside-month]) [data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
    );
    /* A key that crossed the month edge lands on the old page's trailing day
       first, and the page follows one render later. Focus waits for the page
       that holds the date, or the cell it took would be replaced under it —
       which a consumer owning `focusedDate` met as focus falling to the
       document. */
    if (stop === null || stop === undefined) {
      if (root?.querySelector('[data-part="day"][tabindex="0"]') == null) {
        shouldRestoreFocus.current = false;
      }
      return;
    }
    shouldRestoreFocus.current = false;
    stop.focus();
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        rootRef.current
          ?.querySelector<HTMLElement>(
            '[data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
          )
          ?.focus();
      },
      focusDate: (date: PlainDate) => requestFocused(date, 'keyboard', undefined),
    }),
    [requestFocused],
  );

  const unavailable = useCallback(
    (date: PlainDate) => !isDateInRange(date, min, max) || isDateUnavailable?.(date) === true,
    [isDateUnavailable, max, min],
  );

  const select = (date: PlainDate, reason: 'pointer' | 'keyboard', source: unknown) => {
    if (!editable || unavailable(date)) return;
    requestValue(nextValue(date, held, selectionMode), reason, source);
    requestFocused(date, reason, source);
  };

  /**
   * A month the bounds leave no day of. The bounds are days, so a month is
   * refused only when it ends before `min` or starts after `max`; a month
   * `min` falls inside is still a month the reader may choose.
   */
  const monthUnavailable = (year: number, month: number) =>
    (min !== undefined && year * 12 + month < min.year * 12 + min.month) ||
    (max !== undefined && year * 12 + month > max.year * 12 + max.month);

  /** The value of a month cell is the first day of the month. */
  const selectMonth = (
    year: number,
    month: number,
    reason: 'pointer' | 'keyboard',
    source: unknown,
  ) => {
    if (!editable || monthUnavailable(year, month)) return;
    const date = plainDate(year, month, 1);
    requestValue(date, reason, source);
    requestFocused(date, reason, source);
  };

  /** The value's month, which is the month cell marked as chosen. */
  const heldMonth =
    held === null || Array.isArray(held) || isRange(held)
      ? null
      : { year: held.year, month: held.month };

  const onGridKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    /* The reader's own handler first, and it always runs. */
    onKeyDown?.(event as never);
    if (event.defaultPrevented) return;

    const rtl = rootRef.current !== null && getComputedStyle(rootRef.current).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

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
      requestFocused(next, 'keyboard', event);
    };

    /**
     * The months of a year, as a grid of four columns: the arrows move one
     * month or one row, Home and End reach January and December, the page
     * keys move a year, and Enter or Space chooses. Escape is left alone, so
     * the surface above the calendar may close on it.
     */
    if (monthly && currentView === 'month') {
      const toMonth = (delta: number) => {
        const index = focused.year * 12 + (focused.month - 1) + delta;
        return plainDate(Math.floor(index / 12), (index % 12) + 1, 1);
      };
      const columns = VIEW_COLUMNS.month;
      switch (event.key) {
        case forward:
          return move(toMonth(1));
        case backward:
          return move(toMonth(-1));
        case 'ArrowUp':
          return move(toMonth(-columns));
        case 'ArrowDown':
          return move(toMonth(columns));
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
          selectMonth(focused.year, focused.month, 'keyboard', event);
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
        return move(startOfWeek(focused, format.firstDayOfWeek));
      case 'End':
        return move(endOfWeek(focused, format.firstDayOfWeek));
      case 'PageUp':
        return move(event.shiftKey ? stepYear(focused, -1).date : stepMonth(focused, -1).date);
      case 'PageDown':
        return move(event.shiftKey ? stepYear(focused, 1).date : stepMonth(focused, 1).date);
      case 'Enter':
      case ' ':
        consume();
        select(focused, 'keyboard', event);
        return;
      case 'Escape':
        /* The view closes before the surface does, which is the staging
           `dismissable-layer` asks a family to do: the key is simply not
           passed on, and no layer is asked to close. */
        /* In the day view the key is left alone, so a surface above the
           calendar may still close on it. */
        if (currentView === 'day' || (monthly && currentView === 'month')) return;
        consume();
        changeView(currentView === 'year' ? 'month' : 'day');
        return;
      default:
        return;
    }
  };

  const turnPage = (direction: 1 | -1) => (event: MouseEvent<HTMLButtonElement>) => {
    if (currentView === 'day') {
      /* The reader moves with the page rather than staying behind it, so the
         cell holding the tab stop is always one they can see. */
      requestFocused(stepMonth(focused, direction * resolvedMonths).date, 'pointer', event);
      return;
    }
    requestFocused(
      currentView === 'month'
        ? stepYear(focused, direction).date
        : stepYear(focused, direction * YEAR_PAGE).date,
      'pointer',
      event,
    );
  };

  const pageStart = plainDate(page.year, page.month, 1);
  const heading =
    currentView === 'day'
      ? resolvedMonths === 1
        ? format.monthYear(pageStart)
        : `${format.monthYear(pageStart, 'short')} – ${format.monthYear(stepMonth(pageStart, resolvedMonths - 1).date, 'short')}`
      : currentView === 'month'
        ? String(focused.year)
        : `${String(yearPage(focused.year, YEAR_PAGE)[0] ?? focused.year)} – ${String(yearPage(focused.year, YEAR_PAGE).at(-1) ?? focused.year)}`;

  const grids: ReactNode =
    currentView === 'day' ? (
      <div data-part="grids" data-part-grids="">
        {visibleMonths(page, resolvedMonths).map((month) => (
          <MonthTable
            editable={editable}
            firstDayOfWeek={format.firstDayOfWeek}
            fixedWeeks={resolvedFixedWeeks}
            focused={focused}
            format={format}
            headingId={headingId}
            key={`${String(month.year)}-${String(month.month)}`}
            month={month}
            onHover={setHovered}
            marks={marks}
            markName={(mark) =>
              mark.count === undefined ? t('marked') : t('markCount', { count: mark.count })
            }
            onSelect={select}
            outsideDays={resolvedOutsideDays}
            pending={pending}
            today={today}
            unavailable={unavailable}
            value={held}
            weekNumbers={resolvedWeekNumbers}
          />
        ))}
      </div>
    ) : currentView === 'month' && monthly ? (
      <div data-part="months" data-part-months="">
        {format.monthNames('short').map((name, index) => {
          const month = index + 1;
          const refused = monthUnavailable(focused.year, month);
          const chosen = heldMonth?.year === focused.year && heldMonth.month === month;
          return (
            <button
              aria-label={format.monthYear(plainDate(focused.year, month, 1))}
              data-part="period"
              data-part-period=""
              key={name}
              onClick={(event) => selectMonth(focused.year, month, 'pointer', event)}
              tabIndex={focused.month === month ? 0 : -1}
              type="button"
              {...(chosen ? { 'aria-selected': true, 'data-selected': '' } : {})}
              {...(refused ? { 'aria-disabled': true, 'data-unavailable': '' } : {})}
              {...(focused.month === month ? { 'data-focused': '' } : {})}
            >
              {name}
            </button>
          );
        })}
      </div>
    ) : currentView === 'month' ? (
      <div data-part="months" data-part-months="">
        {format.monthNames('short').map((name, index) => (
          <button
            data-part="period"
            data-part-period=""
            key={name}
            onClick={(event) => {
              requestFocused({ ...focused, month: index + 1, day: 1 }, 'pointer', event);
              changeView('day');
            }}
            type="button"
            {...(focused.month === index + 1 ? { 'aria-selected': true, 'data-selected': '' } : {})}
          >
            {name}
          </button>
        ))}
      </div>
    ) : (
      <div data-part="years" data-part-years="">
        {yearPage(focused.year, YEAR_PAGE).map((year) => (
          <button
            data-part="period"
            data-part-period=""
            key={year}
            onClick={(event) => {
              requestFocused({ ...focused, year, day: 1 }, 'pointer', event);
              changeView('month');
            }}
            type="button"
            {...(focused.year === year ? { 'aria-selected': true, 'data-selected': '' } : {})}
          >
            {year}
          </button>
        ))}
      </div>
    );

  /* Each paging button is named for the step it takes in the view showing. */
  const [previousName, nextName] =
    currentView === 'day'
      ? [t('previousMonth'), t('nextMonth')]
      : currentView === 'month'
        ? [t('previousYear'), t('nextYear')]
        : [t('previousYears'), t('nextYears')];

  const children: ReactNode = (
    <>
      <div data-part="header" data-part-header="">
        <button
          aria-label={previousName}
          data-part="previous"
          data-part-previous=""
          disabled={!editable}
          onClick={turnPage(-1)}
          type="button"
        >
          <Icon directional>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
        {/* The heading is a live region: paging with a key changes nothing
            focus lands on, so without this nothing announces the new month. */}
        <button
          aria-live="polite"
          data-part="heading"
          data-part-heading=""
          disabled={!editable || currentView === 'year'}
          id={headingId}
          onClick={() => changeView(currentView === 'day' ? 'month' : 'year')}
          type="button"
        >
          {heading}
          {currentView === 'year' ? null : (
            <Icon>
              <Glyph name="chevron-down" />
            </Icon>
          )}
        </button>
        <button
          aria-label={nextName}
          data-part="next"
          data-part-next=""
          disabled={!editable}
          onClick={turnPage(1)}
          type="button"
        >
          <Icon directional>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
      </div>
      {grids}
    </>
  );

  const rootProps: CalendarRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    onKeyDown: onGridKeyDown,
    style,
    ...(disabled === true ? { 'data-disabled': '' } : {}),
    ...(invalid === true ? { 'data-invalid': '' } : {}),
    ...(readOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedWeekNumbers ? { 'data-week-numbers': '' } : {}),
    ...(resolvedMonths > 1 ? { 'data-months': String(resolvedMonths) } : {}),
    'data-calendar': resolvedCalendar,
    'data-columns': String(VIEW_COLUMNS[currentView]),
    'data-part': 'root',
    'data-ui': 'calendar',
    'data-view': currentView,
    ref: rootRef,
  }) as CalendarRootProps;

  return render === undefined ? (
    <div {...(rootProps as CalendarRootProps & { ref?: React.Ref<HTMLDivElement> })} />
  ) : (
    render(rootProps)
  );
}

/** One month, as the `table` the grid role belongs on. */
function MonthTable({
  editable,
  firstDayOfWeek,
  fixedWeeks,
  focused,
  format,
  headingId,
  markName,
  marks,
  month,
  onHover,
  onSelect,
  outsideDays,
  pending,
  today,
  unavailable,
  value,
  weekNumbers,
}: {
  markName: (mark: CalendarMark) => string;
  marks: ReadonlyMap<string, CalendarMark> | undefined;
  editable: boolean;
  firstDayOfWeek: number;
  fixedWeeks: boolean;
  focused: PlainDate;
  format: ReturnType<typeof createDateFormat>;
  headingId: string;
  month: { year: number; month: number };
  onHover: (date: PlainDate | null) => void;
  onSelect: (date: PlainDate, reason: 'pointer' | 'keyboard', source: unknown) => void;
  outsideDays: 'shown' | 'selectable' | 'hidden';
  /** The run as drawn, which is the value's own once the run is whole. */
  pending: DateRange | null;
  today: PlainDate | null;
  unavailable: (date: PlainDate) => boolean;
  value: CalendarValue;
  weekNumbers: boolean;
}) {
  const weeks = monthGrid({ ...month, firstDayOfWeek, fixedWeeks });
  const caption = format.monthYear(plainDate(month.year, month.month, 1));
  const long = format.weekdayNames('long');
  const narrow = format.weekdayNames('narrow');

  return (
    <table aria-labelledby={headingId} data-part="grid" data-part-grid="" role="grid">
      <caption data-part="grid-caption" data-part-grid-caption="">
        {caption}
      </caption>
      <thead>
        <tr data-part="week-headers" data-part-week-headers="">
          {weekNumbers ? (
            <th aria-hidden="true" data-part="week-number" data-part-week-number="" />
          ) : null}
          {narrow.map((name, index) => (
            /* Two characters is what a column holds and is not a weekday; the
               full name reaches assistive technology through `abbr`, which is
               the APG's own answer. */
            <th
              abbr={long[index]}
              data-part="week-header"
              data-part-week-header=""
              key={long[index]}
              scope="col"
            >
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr data-part="week" data-part-week="" key={week.weekNumber}>
            {weekNumbers ? (
              <th data-part="week-number" data-part-week-number="" scope="row">
                {week.weekNumber}
              </th>
            ) : null}
            {week.days.map((day) => {
              const outside = day.outsideMonth;
              const hidden = outside && outsideDays === 'hidden';
              const refused = unavailable(day.date) || (outside && outsideDays === 'shown');
              const chosen = isSelected(day.date, value);
              const run = rangeStateOf(day.date, pending ?? value);
              /* Every cell of the pending band is a proposal except the start
                 the reader already chose. */
              const proposed = pending !== null && run !== null && !chosen;
              const roving = isSameDate(day.date, focused);
              const mark = hidden ? undefined : marks?.get(toISODate(day.date));

              return (
                /* A hidden day is an empty cell and nothing else. It carried
                   the marks of the date it stood for, so a range across a
                   month boundary painted a band with no digits under it. */
                <td
                  data-part="cell"
                  data-part-cell=""
                  key={`${String(day.date.month)}-${String(day.date.day)}`}
                  {...(outside ? { 'data-outside-month': '' } : {})}
                  {...(!hidden && unavailable(day.date) ? { 'data-unavailable': '' } : {})}
                  {...(!hidden && chosen ? { 'data-selected': '' } : {})}
                  {...(!hidden && run === 'start' ? { 'data-range-start': '' } : {})}
                  {...(!hidden && run === 'end' ? { 'data-range-end': '' } : {})}
                  {...(!hidden && run === 'inside' ? { 'data-in-range': '' } : {})}
                  {...(!hidden && proposed ? { 'data-preview': '' } : {})}
                >
                  {hidden ? null : (
                    <span
                      aria-disabled={refused ? true : undefined}
                      aria-selected={chosen ? true : undefined}
                      data-part="day"
                      data-part-day=""
                      {...(today !== null && isSameDate(day.date, today)
                        ? { 'data-today': '' }
                        : {})}
                      onClick={(event) => {
                        if (!refused) onSelect(day.date, 'pointer', event);
                      }}
                      onPointerEnter={() => onHover(day.date)}
                      onPointerLeave={() => onHover(null)}
                      role="button"
                      tabIndex={roving && editable ? 0 : -1}
                    >
                      {day.date.day}
                      {mark === undefined ? null : (
                        <span
                          data-part="mark"
                          data-part-mark=""
                          {...(mark.tone === undefined ? {} : { 'data-tone': mark.tone })}
                        >
                          <span data-ui="visually-hidden" data-ui-visually-hidden="">
                            {`, ${markName(mark)}`}
                          </span>
                        </span>
                      )}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
