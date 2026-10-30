/**
 * The arithmetic of a calendar of events: what a view covers, how it steps,
 * which occurrences a series gives, and where each one is drawn.
 *
 * Every value is wall-clock (`@slotted/core/date`). The zone enters in two
 * places only — which minute its clocks move (`offsetChangeOn`) and what its
 * offset is called (`zoneLabel`) — and neither changes a value this module
 * returns. The policy the family declares for the hour a spring change skips
 * and the hour an autumn change repeats follows from that: a skipped hour is
 * drawn and holds nothing, and two events at the same wall-clock reading are
 * laid out as overlapping, because on the wall they are.
 *
 * Nothing here touches the DOM or a framework, so `event-calendar` in React
 * and in Angular cannot disagree about where a block goes.
 */

import {
  addDateTimeSeconds,
  addDays,
  compareDate,
  compareDateTime,
  dayOfWeek,
  daysBetween,
  endOfMonth,
  isPlainDateTime,
  isSameDate,
  monthGrid,
  plainDateTime,
  secondsOfDay,
  startOfMonth,
  startOfWeek,
  stepMonth,
  timeOfSeconds,
  toISODate,
  wallClockIn,
} from '../date';
import type { PlainDate, PlainDateTime, PlainTime } from '../date';
import { occurrenceDates, parseRRule } from '../recurrence';
import type { RecurrenceRule } from '../recurrence';

export type EventCalendarView = 'month' | 'week' | 'day' | 'list';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type EventCalendarWeekends = 'shown' | 'hidden';
export type EventCalendarListRange = 'week' | 'month';

/**
 * An event as the consumer holds it. The kind of `start` decides whether it
 * takes a whole day: there is no `allDay` flag that could contradict the type.
 * An all-day `end` is the last day, inclusive; a timed `end` is the moment it
 * stops, exclusive. A missing `end`, an `end` before `start`, or an `end` of
 * the other kind gives a point occurrence.
 */
export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly start: PlainDate | PlainDateTime;
  readonly end?: PlainDate | PlainDateTime | undefined;
  /** The key of the calendar the event belongs to. */
  readonly calendar?: string | undefined;
  readonly status?: EventStatus | undefined;
  readonly location?: string | undefined;
  readonly href?: string | undefined;
  /** A rule, or its RRULE text. A text `parseRRule` refuses gives a single occurrence. */
  readonly recurrence?: RecurrenceRule | string | undefined;
  /** Dates the series skips (EXDATE). */
  readonly exceptions?: readonly PlainDate[] | undefined;
  /** This event replaces the occurrence of series `recurrenceOf` on `occurrence` (RECURRENCE-ID). */
  readonly recurrenceOf?: string | undefined;
  readonly occurrence?: PlainDate | undefined;
}

/** A calendar the events are sorted into, and the slot of the data scale it is painted with. */
export interface EventCalendarCalendar {
  readonly key: string;
  readonly label: string;
  /** 1 to 8, a slot of `--slotted-data-*`. Its position in the list when absent. */
  readonly color?: number | undefined;
}

/** One drawn instance of an event. Everything that lays out or sorts reads this. */
export interface EventOccurrence<E extends CalendarEvent = CalendarEvent> {
  /** `id`, or `id@YYYY-MM-DD` for an occurrence of a series; a replacement keeps the key. */
  readonly key: string;
  readonly event: E;
  readonly allDay: boolean;
  /** An all-day occurrence starts at 00:00 of its first day. */
  readonly start: PlainDateTime;
  /** Exclusive. An all-day occurrence ends at 00:00 of the day after its last. */
  readonly end: PlainDateTime;
  readonly recurring: boolean;
}

export interface ViewOptions {
  /** `0` is Sunday. */
  readonly firstDayOfWeek: number;
  readonly weekends: EventCalendarWeekends;
  readonly fixedWeeks?: boolean | undefined;
  readonly listRange?: EventCalendarListRange | undefined;
}

export interface VisibleRange {
  /** The first day drawn. */
  readonly start: PlainDate;
  /** The last day drawn, inclusive. */
  readonly end: PlainDate;
  /** Every day drawn, in order; hidden weekend days are not in it. */
  readonly days: readonly PlainDate[];
  /** The month grid's rows; one row of `days` for the other views. */
  readonly weeks: readonly (readonly PlainDate[])[];
}

const START_OF_DAY: PlainTime = { hour: 0, minute: 0, second: 0 };
const midnight = (date: PlainDate): PlainDateTime => ({ date, time: START_OF_DAY });
const isWeekend = (date: PlainDate) => dayOfWeek(date) === 0 || dayOfWeek(date) === 6;

function visible(days: readonly PlainDate[], weekends: EventCalendarWeekends): PlainDate[] {
  return weekends === 'hidden' ? days.filter((date) => !isWeekend(date)) : [...days];
}

function weekOf(date: PlainDate, options: ViewOptions): PlainDate[] {
  const first = startOfWeek(date, options.firstDayOfWeek);
  return visible(
    Array.from({ length: 7 }, (_, index) => addDays(first, index)),
    options.weekends,
  );
}

function rangeOf(weeks: PlainDate[][]): VisibleRange {
  const days = weeks.flat();
  return {
    start: days[0] as PlainDate,
    end: days[days.length - 1] as PlainDate,
    days,
    weeks,
  };
}

/** The days a view draws around `date`. */
export function viewRange(
  view: EventCalendarView,
  date: PlainDate,
  options: ViewOptions,
): VisibleRange {
  switch (view) {
    case 'month': {
      const weeks = monthGrid({
        year: date.year,
        month: date.month,
        firstDayOfWeek: options.firstDayOfWeek,
        fixedWeeks: options.fixedWeeks,
      }).map((week) =>
        visible(
          week.days.map((day) => day.date),
          options.weekends,
        ),
      );
      return rangeOf(weeks);
    }
    case 'week':
      return rangeOf([weekOf(date, options)]);
    case 'day':
      return rangeOf([[date]]);
    case 'list': {
      if (options.listRange === 'month') {
        const first = startOfMonth(date);
        const length = daysBetween(first, endOfMonth(date)) + 1;
        return rangeOf([
          visible(
            Array.from({ length }, (_, index) => addDays(first, index)),
            options.weekends,
          ),
        ]);
      }
      return rangeOf([weekOf(date, options)]);
    }
  }
}

/** The nearest drawn day from `date` in `direction`, `date` included. */
function drawnFrom(date: PlainDate, direction: 1 | -1, options: ViewOptions): PlainDate {
  let day = date;
  while (options.weekends === 'hidden' && isWeekend(day)) day = addDays(day, direction);
  return day;
}

/** One period of the view back or forward. The month clamps the day. */
export function stepView(
  view: EventCalendarView,
  date: PlainDate,
  direction: 1 | -1,
  options: ViewOptions,
): PlainDate {
  switch (view) {
    case 'month':
      return stepMonth(date, direction).date;
    case 'week':
      return addDays(date, 7 * direction);
    case 'day':
      return drawnFrom(addDays(date, direction), direction, options);
    case 'list':
      return options.listRange === 'month'
        ? stepMonth(date, direction).date
        : addDays(date, 7 * direction);
  }
}

/** The moves the grid's keys ask for. Left and right are already resolved against the direction. */
export type DateMove =
  | 'previous'
  | 'next'
  | 'up'
  | 'down'
  | 'rowStart'
  | 'rowEnd'
  | 'periodStart'
  | 'periodEnd'
  | 'pageBack'
  | 'pageForward'
  | 'yearBack'
  | 'yearForward';

/**
 * Where a key takes the reader's date. `previous` and `next` step over the
 * days the grid does not draw, and page into the next period at the edge,
 * which is what a reader holding the arrow expects of a calendar.
 */
export function moveDate(
  view: EventCalendarView,
  date: PlainDate,
  move: DateMove,
  options: ViewOptions,
): PlainDate {
  const row = weekOf(date, options);
  switch (move) {
    case 'previous':
      return drawnFrom(addDays(date, -1), -1, options);
    case 'next':
      return drawnFrom(addDays(date, 1), 1, options);
    case 'up':
      return view === 'month' ? addDays(date, -7) : date;
    case 'down':
      return view === 'month' ? addDays(date, 7) : date;
    case 'rowStart':
      return view === 'day' ? date : (row[0] ?? date);
    case 'rowEnd':
      return view === 'day' ? date : (row[row.length - 1] ?? date);
    case 'periodStart':
      return view === 'month' ? drawnFrom(startOfMonth(date), 1, options) : (row[0] ?? date);
    case 'periodEnd':
      return view === 'month'
        ? drawnFrom(endOfMonth(date), -1, options)
        : (row[row.length - 1] ?? date);
    case 'pageBack':
      return view === 'month' ? stepMonth(date, -1).date : stepView(view, date, -1, options);
    case 'pageForward':
      return view === 'month' ? stepMonth(date, 1).date : stepView(view, date, 1, options);
    case 'yearBack':
      return stepMonth(date, -12).date;
    case 'yearForward':
      return stepMonth(date, 12).date;
  }
}

/* ── Occurrences ─────────────────────────────────────────────────────────── */

const secondsBetween = (from: PlainDateTime, to: PlainDateTime) =>
  daysBetween(from.date, to.date) * 86_400 + secondsOfDay(to.time) - secondsOfDay(from.time);

interface Span {
  readonly allDay: boolean;
  readonly start: PlainDateTime;
  readonly end: PlainDateTime;
}

function spanOf(event: CalendarEvent): Span {
  if (isPlainDateTime(event.start)) {
    const start = event.start;
    const end =
      event.end !== undefined && isPlainDateTime(event.end) && compareDateTime(event.end, start) > 0
        ? event.end
        : start;
    return { allDay: false, start, end };
  }
  const first = event.start;
  const last =
    event.end !== undefined && !isPlainDateTime(event.end) && compareDate(event.end, first) >= 0
      ? event.end
      : first;
  return { allDay: true, start: midnight(first), end: midnight(addDays(last, 1)) };
}

function ruleOf(event: CalendarEvent): RecurrenceRule | null {
  if (event.recurrence === undefined) return null;
  return typeof event.recurrence === 'string' ? parseRRule(event.recurrence) : event.recurrence;
}

/** Whether `[start, end)` meets `[from, to)`; a point meets the window it stands in. */
function meets(start: PlainDateTime, end: PlainDateTime, from: PlainDateTime, to: PlainDateTime) {
  if (compareDateTime(start, to) >= 0) return false;
  if (compareDateTime(end, start) === 0) return compareDateTime(start, from) >= 0;
  return compareDateTime(end, from) > 0;
}

let collator: Intl.Collator | undefined;

/**
 * The order occurrences are laid out and listed in: start, then the longer
 * first, so a bar takes the lane above the events it covers; then all-day
 * before timed; then the title by the locale's collator; then the key, so
 * two identical events never swap between renders.
 */
export function compareOccurrences(
  a: EventOccurrence,
  b: EventOccurrence,
  by: Intl.Collator = (collator ??= new Intl.Collator()),
): number {
  return (
    compareDateTime(a.start, b.start) ||
    compareDateTime(b.end, a.end) ||
    Number(b.allDay) - Number(a.allDay) ||
    by.compare(a.event.title, b.event.title) ||
    (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  );
}

/**
 * The occurrences that meet the days `[from, to]`, sorted. A series is expanded
 * inside the window only, with its exceptions removed; an event carrying
 * `recurrenceOf` and `occurrence` takes the place of that date and keeps its
 * key, so focus does not jump when the application moves one meeting.
 */
export function occurrencesIn<E extends CalendarEvent>(
  events: readonly E[],
  from: PlainDate,
  to: PlainDate,
  options: { collator?: Intl.Collator | undefined } = {},
): EventOccurrence<E>[] {
  const windowStart = midnight(from);
  const windowEnd = midnight(addDays(to, 1));
  const replaced = new Map<string, Set<string>>();
  for (const event of events) {
    if (event.recurrenceOf === undefined || event.occurrence === undefined) continue;
    const dates = replaced.get(event.recurrenceOf) ?? new Set<string>();
    dates.add(toISODate(event.occurrence));
    replaced.set(event.recurrenceOf, dates);
  }

  const found: EventOccurrence<E>[] = [];
  for (const event of events) {
    const span = spanOf(event);
    if (event.recurrenceOf !== undefined && event.occurrence !== undefined) {
      if (meets(span.start, span.end, windowStart, windowEnd)) {
        const key = `${event.recurrenceOf}@${toISODate(event.occurrence)}`;
        found.push({ key, event, ...span, recurring: true });
      }
      continue;
    }

    const rule = ruleOf(event);
    if (rule === null) {
      if (meets(span.start, span.end, windowStart, windowEnd)) {
        found.push({ key: event.id, event, ...span, recurring: false });
      }
      continue;
    }

    const length = secondsBetween(span.start, span.end);
    const reach = Math.ceil(length / 86_400);
    const skipped = replaced.get(event.id);
    const dates = occurrenceDates(
      rule,
      span.start.date,
      addDays(from, -reach),
      to,
      event.exceptions ?? [],
    );
    for (const date of dates) {
      const iso = toISODate(date);
      if (skipped?.has(iso)) continue;
      const start = { date, time: span.start.time };
      const end = addDateTimeSeconds(start, length);
      if (!meets(start, end, windowStart, windowEnd)) continue;
      found.push({
        key: `${event.id}@${iso}`,
        event,
        allDay: span.allDay,
        start,
        end,
        recurring: true,
      });
    }
  }

  const by = options.collator ?? (collator ??= new Intl.Collator());
  return found.sort((a, b) => compareOccurrences(a, b, by));
}

/** Whether the occurrence holds any of `date`. An end at 00:00 does not reach the day it names. */
export function touchesDay(occurrence: EventOccurrence, date: PlainDate): boolean {
  return meets(occurrence.start, occurrence.end, midnight(date), midnight(addDays(date, 1)));
}

export function occurrencesOn<E extends CalendarEvent>(
  occurrences: readonly EventOccurrence<E>[],
  date: PlainDate,
): EventOccurrence<E>[] {
  return occurrences.filter((occurrence) => touchesDay(occurrence, date));
}

/**
 * The ends of an occurrence that fall on `date`: `start` is null when it began
 * on an earlier day, `end` is null when it goes on past this one. An all-day
 * occurrence has neither.
 */
export function occurrenceTimes(
  occurrence: EventOccurrence,
  date: PlainDate,
): { start: PlainTime | null; end: PlainTime | null } {
  if (occurrence.allDay) return { start: null, end: null };
  const start = isSameDate(occurrence.start.date, date) ? occurrence.start.time : null;
  const endsToday =
    isSameDate(occurrence.end.date, date) ||
    (compareDateTime(occurrence.end, occurrence.start) === 0 && start !== null);
  return { start, end: endsToday ? occurrence.end.time : null };
}

/** Whether an occurrence is drawn as a bar across days rather than inside one day. */
export function isMultiDay(occurrence: EventOccurrence): boolean {
  if (occurrence.allDay) return daysBetween(occurrence.start.date, occurrence.end.date) > 1;
  const lastDay =
    occurrence.end.time.hour === 0 &&
    occurrence.end.time.minute === 0 &&
    occurrence.end.time.second === 0
      ? addDays(occurrence.end.date, -1)
      : occurrence.end.date;
  return compareDate(lastDay, occurrence.start.date) > 0;
}

/* ── A row of days: the month's weeks and the all-day row ────────────────── */

export interface RowSegment<E extends CalendarEvent = CalendarEvent> {
  readonly occurrence: EventOccurrence<E>;
  /** From 0. */
  readonly lane: number;
  /** The index in the row of the first day it covers. */
  readonly start: number;
  /** How many of the row's days it covers. */
  readonly span: number;
  readonly continuesBefore: boolean;
  readonly continuesAfter: boolean;
}

/**
 * Lanes for a row of days. Each occurrence, in `compareOccurrences` order,
 * takes the first lane that is free on every day it covers in the row. With
 * `allDayOnly`, the row is the all-day row of a time grid, and a timed
 * occurrence belongs to the columns under it instead.
 */
export function layoutRow<E extends CalendarEvent>(
  occurrences: readonly EventOccurrence<E>[],
  days: readonly PlainDate[],
  options: { allDayOnly?: boolean | undefined },
): { segments: RowSegment<E>[]; lanes: number } {
  const taken: boolean[][] = [];
  const segments: RowSegment<E>[] = [];
  for (const occurrence of occurrences) {
    if (options.allDayOnly && !occurrence.allDay) continue;
    const covered = days.flatMap((day, index) => (touchesDay(occurrence, day) ? [index] : []));
    if (covered.length === 0) continue;
    const start = covered[0] as number;
    const last = covered[covered.length - 1] as number;
    let lane = 0;
    while (taken[lane]?.slice(start, last + 1).some(Boolean)) lane += 1;
    const row = (taken[lane] ??= []);
    for (let index = start; index <= last; index += 1) row[index] = true;
    segments.push({
      occurrence,
      lane,
      start,
      span: last - start + 1,
      continuesBefore: compareDateTime(occurrence.start, midnight(days[start] as PlainDate)) < 0,
      continuesAfter:
        compareDateTime(occurrence.end, midnight(addDays(days[last] as PlainDate, 1))) > 0,
    });
  }
  return { segments, lanes: taken.length };
}

/** Per day of the row, how many occurrences sit in lanes at or past `limit`. */
export function overflowByDay(
  segments: readonly RowSegment[],
  dayCount: number,
  limit: number,
): number[] {
  const counts = Array.from({ length: dayCount }, () => 0);
  for (const segment of segments) {
    if (segment.lane < limit) continue;
    for (let index = segment.start; index < segment.start + segment.span; index += 1) {
      counts[index] = (counts[index] ?? 0) + 1;
    }
  }
  return counts;
}

/* ── A column of one day: week and day ───────────────────────────────────── */

export interface ColumnItem<E extends CalendarEvent = CalendarEvent> {
  readonly occurrence: EventOccurrence<E>;
  /** Minutes from the first visible hour. */
  readonly start: number;
  /** Minutes it lasts inside the visible hours; zero for a point. */
  readonly length: number;
  readonly column: number;
  readonly columns: number;
  readonly span: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
  readonly continuesBefore: boolean;
  readonly continuesAfter: boolean;
}

export interface ColumnMore<E extends CalendarEvent = CalendarEvent> {
  readonly occurrences: readonly EventOccurrence<E>[];
  readonly start: number;
  readonly length: number;
  readonly column: number;
  readonly columns: number;
  /**
   * The day holds one column: the events of the first are drawn at its full
   * width and the rest become a count laid over them, not a column of its own
   * — a cluster that was a single "+5" named none of its events.
   */
  readonly overlay: boolean;
}

export interface ColumnOptions {
  /** The first visible hour, 0 to 23. */
  readonly startHour: number;
  /** The hour the grid stops at, 1 to 24. */
  readonly endHour: number;
  /** Columns a cluster may take before the rest folds into one `more`. */
  readonly maxColumns: number;
  /** The shortest block drawn, in minutes, which is what decides whether two short events touch. */
  readonly minLength: number;
}

interface Placed<E extends CalendarEvent> {
  occurrence: EventOccurrence<E>;
  start: number;
  length: number;
  extent: number;
  column: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

/**
 * Columns for one day. Occurrences linked by transitive overlap form a
 * cluster; each takes the first column whose last occurrence has ended, then
 * spans the free columns to its right for the whole of its extent. A cluster
 * wider than `maxColumns` draws `maxColumns - 1` of them and one `more` in the
 * last column, over the time of everything it holds. No text is ever covered
 * by another block, which is the policy the family declares instead of the
 * stacked overlap two surveyed libraries default to.
 */
export function layoutColumn<E extends CalendarEvent>(
  occurrences: readonly EventOccurrence<E>[],
  date: PlainDate,
  options: ColumnOptions,
): { items: ColumnItem<E>[]; more: ColumnMore<E>[] } {
  const first = options.startHour * 60;
  const last = options.endHour * 60;
  const placed: Placed<E>[] = [];

  for (const occurrence of occurrences) {
    if (occurrence.allDay || !touchesDay(occurrence, date)) continue;
    const continuesBefore = compareDate(occurrence.start.date, date) < 0;
    const continuesAfter =
      compareDate(occurrence.end.date, date) > 0 &&
      compareDateTime(occurrence.end, midnight(addDays(date, 1))) > 0;
    const from = continuesBefore ? 0 : secondsOfDay(occurrence.start.time) / 60;
    const to = continuesAfter
      ? 1440
      : isSameDate(occurrence.end.date, date)
        ? secondsOfDay(occurrence.end.time) / 60
        : 1440;
    const start = Math.min(Math.max(from, first), last);
    const end = Math.min(Math.max(to, first), last);
    placed.push({
      occurrence,
      start: start - first,
      length: Math.max(0, end - start),
      extent: Math.max(end - start, options.minLength),
      column: 0,
      clippedStart: from < first || from > last,
      clippedEnd: to > last || (to < first && to !== from),
      continuesBefore,
      continuesAfter,
    });
  }

  placed.sort((a, b) => a.start - b.start || b.extent - a.extent);

  const items: ColumnItem<E>[] = [];
  const more: ColumnMore<E>[] = [];
  let cluster: Placed<E>[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const ends: number[] = [];
    for (const entry of cluster) {
      let column = ends.findIndex((end) => end <= entry.start);
      if (column < 0) column = ends.length;
      ends[column] = entry.start + entry.extent;
      entry.column = column;
    }
    const columns = ends.length;
    const folded = columns > options.maxColumns;
    const overlay = folded && options.maxColumns <= 1;
    const shown = overlay ? 1 : folded ? options.maxColumns - 1 : columns;
    const width = overlay ? 1 : folded ? options.maxColumns : columns;
    const hidden: Placed<E>[] = [];

    for (const entry of cluster) {
      if (entry.column >= shown) {
        hidden.push(entry);
        continue;
      }
      let span = 1;
      while (entry.column + span < shown) {
        const next = entry.column + span;
        const blocked = cluster.some(
          (other) =>
            other.column === next &&
            other.start < entry.start + entry.extent &&
            entry.start < other.start + other.extent,
        );
        if (blocked) break;
        span += 1;
      }
      items.push({
        occurrence: entry.occurrence,
        start: entry.start,
        length: entry.length,
        column: entry.column,
        columns: width,
        span,
        clippedStart: entry.clippedStart,
        clippedEnd: entry.clippedEnd,
        continuesBefore: entry.continuesBefore,
        continuesAfter: entry.continuesAfter,
      });
    }

    if (hidden.length > 0) {
      const start = Math.min(...hidden.map((entry) => entry.start));
      const end = Math.max(...hidden.map((entry) => entry.start + Math.max(entry.length, 0)));
      more.push({
        occurrences: hidden.map((entry) => entry.occurrence),
        start,
        length: end - start,
        column: overlay ? 0 : options.maxColumns - 1,
        columns: overlay ? 1 : options.maxColumns,
        overlay,
      });
    }
    cluster = [];
  };

  for (const entry of placed) {
    if (entry.start >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.start + entry.extent);
  }
  flush();

  return { items, more };
}

/* ── Working hours ───────────────────────────────────────────────────── */

/**
 * When the calendar's owner is available: a clinic open 08:00–18:00 on
 * weekdays, a room bookable 09:00–12:00 and 14:00–17:00. Several entries make a
 * split day; a weekday no entry names is not a working day. `end` is exclusive
 * and 00:00 means the end of the day.
 */
export interface WorkingHours {
  /** `0` is Sunday. */
  readonly days: readonly number[];
  readonly start: PlainTime;
  readonly end: PlainTime;
}

/** Whether any entry of `hours` names the weekday of `date`. With no entries, every day is. */
export function isWorkingDay(date: PlainDate, hours: readonly WorkingHours[]): boolean {
  if (hours.length === 0) return true;
  const weekday = dayOfWeek(date);
  return hours.some((entry) => entry.days.includes(weekday));
}

/**
 * The stretches of `date` outside working hours, inside the visible hours, as
 * minutes from the first visible hour — the shape `layoutColumn` gives an
 * event, so the stylesheet places both the same way. With no entries nothing
 * is off; on a day no entry names the whole visible range is.
 */
export function offHoursOn(
  date: PlainDate,
  hours: readonly WorkingHours[],
  options: { startHour: number; endHour: number },
): { start: number; length: number }[] {
  if (hours.length === 0) return [];
  const first = options.startHour * 60;
  const last = options.endHour * 60;
  const weekday = dayOfWeek(date);
  const open = hours
    .filter((entry) => entry.days.includes(weekday))
    .map((entry) => {
      const from = secondsOfDay(entry.start) / 60;
      const to = secondsOfDay(entry.end) / 60;
      return [from, to === 0 ? 1440 : to] as const;
    })
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0]);

  const off: { start: number; length: number }[] = [];
  let cursor = first;
  for (const [from, to] of open) {
    const start = Math.max(from, first);
    const end = Math.min(to, last);
    if (end <= cursor) continue;
    if (start > cursor) off.push({ start: cursor - first, length: Math.min(start, last) - cursor });
    cursor = Math.max(cursor, end);
    if (cursor >= last) break;
  }
  if (cursor < last) off.push({ start: cursor - first, length: last - cursor });
  return off.filter((entry) => entry.length > 0);
}

/* ── Editing ─────────────────────────────────────────────────────────── */

/**
 * Where an occurrence stands, in the one shape every edit is computed in: two
 * wall-clock ends, the second exclusive, and whether it takes whole days.
 */
export interface EventPlacement {
  readonly start: PlainDateTime;
  readonly end: PlainDateTime;
  readonly allDay: boolean;
}

/** How far an edit moves an end: whole days, and minutes on a timed occurrence. */
export interface EventShift {
  readonly days: number;
  readonly minutes: number;
}

export function placementOf(occurrence: EventOccurrence): EventPlacement {
  return { start: occurrence.start, end: occurrence.end, allDay: occurrence.allDay };
}

const shiftBy = (value: PlainDateTime, shift: EventShift, allDay: boolean) =>
  addDateTimeSeconds(
    { date: addDays(value.date, shift.days), time: value.time },
    allDay ? 0 : shift.minutes * 60,
  );

/** The placement moved as a whole: its length is kept, to the second. */
export function movePlacement(placement: EventPlacement, shift: EventShift): EventPlacement {
  return {
    allDay: placement.allDay,
    start: shiftBy(placement.start, shift, placement.allDay),
    end: shiftBy(placement.end, shift, placement.allDay),
  };
}

/**
 * The placement with its end moved. It is never shorter than one step — a
 * day for an all-day occurrence, `minimum` minutes for a timed one — because an
 * edit that inverts an event is not an edit anybody meant.
 */
export function resizePlacement(
  placement: EventPlacement,
  shift: EventShift,
  minimum: number,
): EventPlacement {
  const end = shiftBy(placement.end, shift, placement.allDay);
  const shortest = placement.allDay
    ? { date: addDays(placement.start.date, 1), time: START_OF_DAY }
    : addDateTimeSeconds(placement.start, minimum * 60);
  return { ...placement, end: compareDateTime(end, shortest) < 0 ? shortest : end };
}

export interface AllowedPlacementOptions {
  /** Minutes between the grid's lighter rules: the step and the shortest resize. */
  slot: number;
  /** The visible hours, `[start, end]`: how far a step of minutes may travel. */
  hours: readonly [number, number];
  /** The application's `canDrop`, asked about the placement it would be asked for. */
  allowed: (placement: EventPlacement) => boolean;
}

/**
 * The placement one key press lands on when some destinations are refused:
 * the first of `shift`, twice `shift`, three times… that `allowed` accepts,
 * moved or resized as `kind` says. A step of minutes travels at most the
 * visible hours and a step of days six weeks, the size of a month; past that
 * nothing is allowed and the answer is `null`, so the event stays.
 */
export function nextAllowedPlacement(
  from: EventPlacement,
  shift: EventShift,
  kind: 'move' | 'resize',
  options: AllowedPlacementOptions,
): EventPlacement | null {
  const [startHour, endHour] = options.hours;
  const steps =
    shift.minutes !== 0
      ? Math.max(1, Math.floor(((endHour - startHour) * 60) / Math.abs(shift.minutes)))
      : Math.max(1, Math.floor(42 / Math.max(1, Math.abs(shift.days))));
  for (let step = 1; step <= steps; step += 1) {
    const reach = { days: shift.days * step, minutes: shift.minutes * step };
    const placement =
      kind === 'move' ? movePlacement(from, reach) : resizePlacement(from, reach, options.slot);
    if (options.allowed(placement)) return placement;
  }
  return null;
}

/**
 * A placement written back in the kind the event holds: dates with the last
 * day inclusive for an all-day event, date-times with the end exclusive for a
 * timed one — what the consumer puts in `start` and `end`.
 */
export function placeOccurrence(
  placement: EventPlacement,
): { start: PlainDate; end: PlainDate } | { start: PlainDateTime; end: PlainDateTime } {
  if (!placement.allDay) return { start: placement.start, end: placement.end };
  return { start: placement.start.date, end: addDays(placement.end.date, -1) };
}

/**
 * The occurrences with one of them drawn where an edit would put it, for the
 * preview while a pointer is still down. The list is returned as it came when
 * no occurrence has the key, so a caller can compare it by identity.
 */
export function withPlacement<E extends CalendarEvent>(
  occurrences: readonly EventOccurrence<E>[],
  key: string,
  placement: EventPlacement,
): readonly EventOccurrence<E>[] {
  if (!occurrences.some((occurrence) => occurrence.key === key)) return occurrences;
  return occurrences
    .map((occurrence) =>
      occurrence.key === key
        ? { ...occurrence, start: placement.start, end: placement.end }
        : occurrence,
    )
    .sort((a, b) => compareOccurrences(a, b));
}

/* ── The list ────────────────────────────────────────────────────────────── */

export interface ListDay<E extends CalendarEvent = CalendarEvent> {
  readonly date: PlainDate;
  readonly occurrences: readonly EventOccurrence<E>[];
}

/** The days of `days` that hold an occurrence, each with its occurrences in order. */
export function listDays<E extends CalendarEvent>(
  occurrences: readonly EventOccurrence<E>[],
  days: readonly PlainDate[],
): ListDay<E>[] {
  return days.flatMap((date) => {
    const held = occurrencesOn(occurrences, date);
    return held.length > 0 ? [{ date, occurrences: held }] : [];
  });
}

/* ── The zone ────────────────────────────────────────────────────────────── */

const OFFSET = /GMT(?:([+-])(\d{1,2})(?::?(\d{2}))?)?/;

function offsetAt(instant: number, timeZone: string | undefined): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(new Date(instant))
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = OFFSET.exec(name);
  if (match === null || match[1] === undefined) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

/** The instant of 00:00 on `date` in the zone, to the minute, ignoring a change at midnight itself. */
function localMidnight(date: PlainDate, timeZone: string | undefined): number {
  const utc = Date.UTC(date.year, date.month - 1, date.day);
  return utc - offsetAt(utc, timeZone) * 60_000;
}

/**
 * The minute the zone's clocks move on `date`, read on the clock before the
 * move, and by how many minutes: `{ at: 02:00, minutes: 60 }` is a spring
 * change, `-60` an autumn one. `null` on every other day.
 *
 * Found by bisection over `Intl.DateTimeFormat`'s `longOffset`, so it needs no
 * zone database of its own and agrees with whatever the engine knows.
 */
export function offsetChangeOn(
  date: PlainDate,
  timeZone?: string | undefined,
): { at: PlainTime; minutes: number } | null {
  let low = localMidnight(date, timeZone);
  let high = localMidnight(addDays(date, 1), timeZone);
  const before = offsetAt(low, timeZone);
  const after = offsetAt(high - 1, timeZone);
  if (before === after) return null;
  while (high - low > 60_000) {
    const middle = low + Math.floor((high - low) / 120_000) * 60_000;
    if (offsetAt(middle, timeZone) === before) low = middle;
    else high = middle;
  }
  const reading = wallClockIn(high + before * 60_000, 'UTC');
  return { at: reading.time, minutes: after - before };
}

/** The zone's offset on `date`, as the locale writes it short: "GMT-3". */
export function zoneLabel(
  date: PlainDate,
  timeZone?: string | undefined,
  locale?: string | undefined,
): string {
  const noon = Date.UTC(date.year, date.month - 1, date.day, 12);
  return (
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(new Date(noon))
      .find((part) => part.type === 'timeZoneName')?.value ?? ''
  );
}

/**
 * The minutes between the lighter rules of the hours, and the step a
 * selection, a drag and Alt with an arrow move by: any whole number of
 * minutes from 5 to 120. Five is the finest a pointer can place; two hours is
 * the coarsest that still draws a rule inside a working day. A step that does
 * not divide the hour — 45 for a session length — draws its rules off the
 * hour lines, which is what such a schedule looks like.
 */
export function slotMinutes(minutes: number): number {
  return Number.isFinite(minutes) ? Math.min(120, Math.max(5, Math.round(minutes))) : 30;
}

/**
 * A stretch of the grid: days with the last one inclusive, or date-times with
 * the end exclusive — the shape a selection has in both bindings.
 */
export type CalendarStretch =
  | { readonly start: PlainDate; readonly end: PlainDate }
  | { readonly start: PlainDateTime; readonly end: PlainDateTime };

export interface ContextSlotOptions {
  /** The day under the pointer, or the focused day. */
  date: PlainDate;
  /** The minute of the day under the pointer in a timed column; `null` for a day cell or the keyboard. */
  minute: number | null;
  /** Whether the day was pointed at in a timed column. */
  timed: boolean;
  /** The selection, or the one being drawn. */
  held: CalendarStretch | null;
  /** The step, in minutes. */
  slot: number;
  /** The last minute the hours draw. */
  endMinute: number;
}

const minuteOfDay = (value: PlainDateTime) => value.time.hour * 60 + value.time.minute;

/**
 * What a context menu opened on an empty part of the grid acts on. Inside the
 * selection it is the selection, so "New event" over a dragged stretch makes
 * that stretch; elsewhere in a timed column it is one step at the pointer, and
 * in a day cell, or from the keyboard on a column, it is the day.
 */
export function contextSlot(options: ContextSlotOptions): CalendarStretch {
  const { date, held, minute } = options;
  if (held !== null && isPlainDateTime(held.start)) {
    const end = held.end as PlainDateTime;
    const inside =
      options.timed &&
      isSameDate(held.start.date, date) &&
      (minute === null ||
        (minute >= minuteOfDay(held.start) &&
          (!isSameDate(end.date, date) || minute < minuteOfDay(end))));
    if (inside) return held;
  } else if (held !== null && !options.timed) {
    const start = held.start as PlainDate;
    const end = held.end as PlainDate;
    if (compareDate(start, date) <= 0 && compareDate(date, end) <= 0) return held;
  }
  if (!options.timed || minute === null) return { start: date, end: date };
  /* The last step of the day starts one step before the end, not at it. */
  const from = Math.max(0, Math.min(minute, options.endMinute - options.slot));
  const at = (value: number): PlainDateTime =>
    value >= 1440
      ? plainDateTime(addDays(date, 1), timeOfSeconds(0))
      : plainDateTime(date, timeOfSeconds(value * 60));
  return { start: at(from), end: at(Math.min(from + options.slot, options.endMinute)) };
}

/* ── Words ───────────────────────────────────────────────────────────────── */

const utcOf = (date: PlainDate, time: PlainTime = START_OF_DAY) =>
  new Date(Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, time.second));

/**
 * A day of the list, in the two parts it is written in: the weekday and the
 * date without it. Written as two lines, the date never breaks inside itself —
 * "Tuesday, September" over a lone "1" was the one-line form in a narrow
 * column.
 */
export function listDayParts(
  date: PlainDate,
  locale?: string,
): { readonly weekday: string; readonly date: string; readonly label: string } {
  const at = utcOf(date);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(at);
  return {
    weekday: format({ weekday: 'long' }),
    date: format({ month: 'long', day: 'numeric' }),
    /* The name the heading is read by: the one-line form, with its punctuation. */
    label: format({ weekday: 'long', month: 'long', day: 'numeric' }),
  };
}

/** The heading of a view: the month, the run of a week, or the day. */
export function viewTitle(
  view: EventCalendarView,
  range: VisibleRange,
  date: PlainDate,
  options: { locale?: string | undefined; listRange?: EventCalendarListRange | undefined },
): string {
  const { locale } = options;
  if (view === 'month' || (view === 'list' && options.listRange === 'month')) {
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(utcOf(date));
  }
  if (view === 'day') {
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(utcOf(date));
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatRange(utcOf(range.start), utcOf(range.end));
}

export interface TimeFormatOptions {
  readonly locale?: string | undefined;
  readonly hourCycle?: 'h12' | 'h23' | undefined;
}

/** A time of day as the locale writes it, in its hour cycle unless one is named. */
export function formatTime(time: PlainTime, options: TimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(options.locale, {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    ...(options.hourCycle === undefined ? {} : { hourCycle: options.hourCycle }),
  }).format(utcOf({ year: 2000, month: 1, day: 1 }, time));
}

/**
 * Two times of one day as the locale writes a range, which shares what the two
 * ends share: "10:00 – 11:00 AM" rather than "10:00 AM – 11:00 AM". The same
 * time twice is written once.
 */
export function formatTimeRange(
  start: PlainTime,
  end: PlainTime,
  options: TimeFormatOptions = {},
): string {
  const day = { year: 2000, month: 1, day: 1 };
  const format = new Intl.DateTimeFormat(options.locale, {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    ...(options.hourCycle === undefined ? {} : { hourCycle: options.hourCycle }),
  });
  return secondsOfDay(start) === secondsOfDay(end)
    ? format.format(utcOf(day, start))
    : format.formatRange(utcOf(day, start), utcOf(day, end));
}

/**
 * An hour label for the gutter of a time grid. A locale on a 12-hour clock
 * writes the hour and its period, "10 AM", and one on a 24-hour clock the
 * hour and its minutes, "10:00": a bare "10" in a column of numbers reads as
 * a count, and "10:00 AM" does not fit the gutter at the type the grid uses.
 */
export function formatHour(hour: number, options: TimeFormatOptions = {}): string {
  const cycle =
    options.hourCycle ??
    new Intl.DateTimeFormat(options.locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  const twelve = cycle === 'h11' || cycle === 'h12';
  return new Intl.DateTimeFormat(options.locale, {
    timeZone: 'UTC',
    hour: twelve ? 'numeric' : '2-digit',
    ...(twelve ? {} : { minute: '2-digit' }),
    ...(options.hourCycle === undefined ? {} : { hourCycle: options.hourCycle }),
  }).format(utcOf({ year: 2000, month: 1, day: 1 }, { hour, minute: 0, second: 0 }));
}

/**
 * The whole span of an occurrence in words, for its accessible name: the days
 * of an all-day one, the times of a timed one, and both when it crosses a day.
 */
export function formatOccurrence(
  occurrence: EventOccurrence,
  options: TimeFormatOptions = {},
): string {
  const { locale } = options;
  const cycle = options.hourCycle === undefined ? {} : { hourCycle: options.hourCycle };
  if (occurrence.allDay) {
    const last = addDays(occurrence.end.date, -1);
    const format = new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return isSameDate(last, occurrence.start.date)
      ? format.format(utcOf(last))
      : format.formatRange(utcOf(occurrence.start.date), utcOf(last));
  }
  const start = utcOf(occurrence.start.date, occurrence.start.time);
  const end = utcOf(occurrence.end.date, occurrence.end.time);
  if (isSameDate(occurrence.start.date, occurrence.end.date)) {
    const format = new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      ...cycle,
    });
    return compareDateTime(occurrence.start, occurrence.end) === 0
      ? format.format(start)
      : format.formatRange(start, end);
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    ...cycle,
  }).formatRange(start, end);
}

/**
 * When an occurrence happens, in the two parts a detail writes it in: the day,
 * and the hours. A timed occurrence inside one day has both; one that is all
 * day or crosses midnight is its range alone, which already names its days.
 * Written as two unbreakable parts, the line wraps between them and never
 * inside "2:30 PM".
 */
export function occurrenceWhen(
  occurrence: EventOccurrence,
  options: TimeFormatOptions = {},
): { readonly day: string | null; readonly range: string } {
  const range = formatOccurrence(occurrence, options);
  if (occurrence.allDay || !isSameDate(occurrence.start.date, occurrence.end.date)) {
    return { day: null, range };
  }
  const day = new Intl.DateTimeFormat(options.locale, {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(utcOf(occurrence.start.date));
  return { day, range };
}

/**
 * The slot of the data scale a calendar is painted with: its own `color`,
 * else its position in `calendars` from 1. A ninth calendar has none and is
 * drawn neutral — the scale is assigned in order and never cycled, so two
 * neighbours never share a colour.
 */
export function calendarColor(
  key: string | undefined,
  calendars: readonly EventCalendarCalendar[],
): number | null {
  if (key === undefined) return null;
  const index = calendars.findIndex((calendar) => calendar.key === key);
  if (index < 0) return null;
  const color = calendars[index]?.color ?? index + 1;
  return color >= 1 && color <= 8 ? color : null;
}
