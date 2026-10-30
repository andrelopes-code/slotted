/**
 * A repeating date, as the subset of RFC 5545 RRULE that a calendar of events
 * needs, and nothing that one does not.
 *
 * The rule repeats dates, not instants. A meeting at 09:00 every Monday is
 * still at 09:00 on the Monday after the clocks change, which is what the
 * standard does for a rule written with a TZID and what every surveyed
 * implementation that holds instants has to re-derive by hand. This library
 * holds wall-clock values (`@slotted/core/date`), so the time is the event's
 * and the rule never sees it.
 *
 * Refused by name, so a rule that uses them parses to `null` and the event
 * degrades to its first occurrence: BYSETPOS, BYYEARDAY, BYWEEKNO, BYHOUR,
 * BYMINUTE, BYSECOND and the frequencies below a day. Each is a question an
 * event calendar's reader does not ask — "the second-to-last weekday of the
 * month" is BYSETPOS — and each would double the expansion below.
 *
 * Nothing here touches the DOM or a framework.
 */

import {
  addDays,
  compareDate,
  dayOfWeek,
  daysBetween,
  daysInMonth,
  isSameDate,
  startOfWeek,
} from '../date';
import type { PlainDate } from '../date';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** A weekday with an ordinal: `{ weekday: 2, nth: 2 }` is the second Tuesday, `nth: -1` the last. */
export interface WeekdayOrdinal {
  readonly weekday: number;
  readonly nth: number;
}

export interface RecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  /** Every how many periods. One when absent. */
  readonly interval?: number;
  /** How many occurrences, the first date included. Not with `until`. */
  readonly count?: number;
  /** The last date an occurrence may fall on, inclusive. Not with `count`. */
  readonly until?: PlainDate;
  /** Sunday is 0. An ordinal only means something to a monthly or yearly rule. */
  readonly byWeekday?: readonly (number | WeekdayOrdinal)[];
  /** 1 to 31, or -1 to -31 counting from the month's last day. */
  readonly byMonthDay?: readonly number[];
  /** 1 to 12. */
  readonly byMonth?: readonly number[];
  /** The day a weekly rule's week starts on. Monday when absent, as the standard says. */
  readonly weekStart?: number;
}

/**
 * How many periods an expansion walks before it stops. Fifty thousand daily
 * periods is 137 years; a rule that has produced nothing in that span — the
 * thirtieth of February — produces nothing at all, and a hostile rule costs a
 * bounded loop instead of a frozen page.
 */
export const MAX_PERIODS = 50_000;

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
const FREQUENCIES: Record<string, RecurrenceFrequency> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};
const KEYS = new Set([
  'FREQ',
  'INTERVAL',
  'COUNT',
  'UNTIL',
  'BYDAY',
  'BYMONTHDAY',
  'BYMONTH',
  'WKST',
]);
const WEEKDAY = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/;
const UNTIL = /^(\d{4})(\d{2})(\d{2})(T\d{6}Z?)?$/;
const INTEGER = /^[+-]?\d+$/;

function integers(text: string, min: number, max: number, zero: boolean): number[] | null {
  const values: number[] = [];
  for (const piece of text.split(',')) {
    if (!INTEGER.test(piece)) return null;
    const value = Number(piece);
    if (value < min || value > max || (!zero && value === 0)) return null;
    values.push(value);
  }
  return values;
}

function weekdays(text: string): (number | WeekdayOrdinal)[] | null {
  const values: (number | WeekdayOrdinal)[] = [];
  for (const piece of text.split(',')) {
    const match = WEEKDAY.exec(piece);
    if (match === null) return null;
    const weekday = DAY_CODES.indexOf(match[2] as (typeof DAY_CODES)[number]);
    if (match[1] === undefined) {
      values.push(weekday);
      continue;
    }
    const nth = Number(match[1]);
    if (nth === 0 || nth < -53 || nth > 53) return null;
    values.push({ weekday, nth });
  }
  return values;
}

/**
 * Reads an RRULE, with or without its `RRULE:` prefix. Total: an unknown key, a
 * frequency outside the four, a malformed value, a repeated key or `COUNT`
 * beside `UNTIL` gives `null` rather than an error, which is the rule
 * `parseFilter` states — a rule written by a newer system degrades to a single
 * occurrence instead of breaking the first paint.
 */
export function parseRRule(text: string): RecurrenceRule | null {
  const body = text.trim().replace(/^RRULE:/i, '');
  if (body === '') return null;

  const fields = new Map<string, string>();
  for (const pair of body.split(';')) {
    const [key, value, ...rest] = pair.split('=');
    if (key === undefined || value === undefined || rest.length > 0 || value === '') return null;
    const name = key.toUpperCase();
    if (!KEYS.has(name) || fields.has(name)) return null;
    fields.set(name, value.toUpperCase());
  }

  const frequency = FREQUENCIES[fields.get('FREQ') ?? ''];
  if (frequency === undefined) return null;
  const rule: {
    frequency: RecurrenceFrequency;
    interval?: number;
    count?: number;
    until?: PlainDate;
    byWeekday?: (number | WeekdayOrdinal)[];
    byMonthDay?: number[];
    byMonth?: number[];
    weekStart?: number;
  } = { frequency };

  const interval = fields.get('INTERVAL');
  if (interval !== undefined) {
    const [value] = integers(interval, 1, Number.MAX_SAFE_INTEGER, false) ?? [];
    if (value === undefined || interval.includes(',')) return null;
    rule.interval = value;
  }

  const count = fields.get('COUNT');
  if (count !== undefined) {
    const [value] = integers(count, 1, Number.MAX_SAFE_INTEGER, false) ?? [];
    if (value === undefined || count.includes(',')) return null;
    rule.count = value;
  }

  const until = fields.get('UNTIL');
  if (until !== undefined) {
    if (count !== undefined) return null;
    const match = UNTIL.exec(until);
    if (match === null) return null;
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
    rule.until = { year, month, day };
  }

  const byDay = fields.get('BYDAY');
  if (byDay !== undefined) {
    const value = weekdays(byDay);
    if (value === null) return null;
    rule.byWeekday = value;
  }

  const byMonthDay = fields.get('BYMONTHDAY');
  if (byMonthDay !== undefined) {
    const value = integers(byMonthDay, -31, 31, false);
    if (value === null) return null;
    rule.byMonthDay = value;
  }

  const byMonth = fields.get('BYMONTH');
  if (byMonth !== undefined) {
    const value = integers(byMonth, 1, 12, false);
    if (value === null) return null;
    rule.byMonth = value;
  }

  const weekStart = fields.get('WKST');
  if (weekStart !== undefined) {
    const value = DAY_CODES.indexOf(weekStart as (typeof DAY_CODES)[number]);
    if (value < 0) return null;
    rule.weekStart = value;
  }

  return rule;
}

const pad = (value: number, width: number) => String(value).padStart(width, '0');

/** Writes the rule back as an RRULE value, without the `RRULE:` prefix. */
export function formatRRule(rule: RecurrenceRule): string {
  const parts = [`FREQ=${rule.frequency.toUpperCase()}`];
  if (rule.interval !== undefined && rule.interval !== 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.count !== undefined) parts.push(`COUNT=${rule.count}`);
  if (rule.until !== undefined) {
    const { year, month, day } = rule.until;
    parts.push(`UNTIL=${pad(year, 4)}${pad(month, 2)}${pad(day, 2)}`);
  }
  if (rule.byWeekday !== undefined && rule.byWeekday.length > 0) {
    const days = rule.byWeekday.map((entry) =>
      typeof entry === 'number' ? DAY_CODES[entry] : `${entry.nth}${DAY_CODES[entry.weekday]}`,
    );
    parts.push(`BYDAY=${days.join(',')}`);
  }
  if (rule.byMonthDay !== undefined && rule.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
  }
  if (rule.byMonth !== undefined && rule.byMonth.length > 0) {
    parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
  }
  if (rule.weekStart !== undefined && rule.weekStart !== 1) {
    parts.push(`WKST=${DAY_CODES[rule.weekStart]}`);
  }
  return parts.join(';');
}

/** The day of `month` that a month-day number names, or null when the month has no such day. */
function monthDay(year: number, month: number, value: number): number | null {
  const length = daysInMonth(year, month);
  const day = value > 0 ? value : length + value + 1;
  return day >= 1 && day <= length ? day : null;
}

/** Every date in `[first, last]` falling on `weekday`, in order. */
function weekdaysIn(first: PlainDate, last: PlainDate, weekday: number): PlainDate[] {
  const dates: PlainDate[] = [];
  let date = addDays(first, (weekday - dayOfWeek(first) + 7) % 7);
  while (compareDate(date, last) <= 0) {
    dates.push(date);
    date = addDays(date, 7);
  }
  return dates;
}

/** The dates a BYDAY list names inside `[first, last]`, an ordinal counting within that span. */
function byWeekdayIn(
  first: PlainDate,
  last: PlainDate,
  entries: readonly (number | WeekdayOrdinal)[],
): PlainDate[] {
  const dates: PlainDate[] = [];
  for (const entry of entries) {
    const weekday = typeof entry === 'number' ? entry : entry.weekday;
    const all = weekdaysIn(first, last, weekday);
    if (typeof entry === 'number') {
      dates.push(...all);
      continue;
    }
    const picked = entry.nth > 0 ? all[entry.nth - 1] : all[all.length + entry.nth];
    if (picked !== undefined) dates.push(picked);
  }
  return dates;
}

/** The candidates one month contributes, before BYMONTH filters it. */
function monthCandidates(year: number, month: number, rule: RecurrenceRule, start: PlainDate) {
  const first = { year, month, day: 1 };
  const last = { year, month, day: daysInMonth(year, month) };
  const byDays = rule.byMonthDay
    ?.map((value) => monthDay(year, month, value))
    .filter((day): day is number => day !== null)
    .map((day) => ({ year, month, day }));

  if (rule.byWeekday !== undefined && rule.byWeekday.length > 0) {
    const byWeek = byWeekdayIn(first, last, rule.byWeekday);
    return byDays === undefined
      ? byWeek
      : byWeek.filter((date) => byDays.some((other) => isSameDate(date, other)));
  }
  if (byDays !== undefined) return byDays;
  const day = monthDay(year, month, start.day);
  return day === null || day !== start.day ? [] : [{ year, month, day }];
}

function matchesFilters(date: PlainDate, rule: RecurrenceRule): boolean {
  if (rule.byMonth !== undefined && !rule.byMonth.includes(date.month)) return false;
  if (rule.byMonthDay !== undefined) {
    const hit = rule.byMonthDay.some(
      (value) => monthDay(date.year, date.month, value) === date.day,
    );
    if (!hit) return false;
  }
  if (rule.byWeekday !== undefined && rule.byWeekday.length > 0) {
    const weekday = dayOfWeek(date);
    const hit = rule.byWeekday.some((entry) =>
      typeof entry === 'number' ? entry === weekday : entry.weekday === weekday,
    );
    if (!hit) return false;
  }
  return true;
}

/** The candidates of period `index`, in order. */
function periodDates(rule: RecurrenceRule, start: PlainDate, index: number): PlainDate[] {
  const interval = rule.interval ?? 1;
  switch (rule.frequency) {
    case 'daily': {
      const date = addDays(start, index * interval);
      return matchesFilters(date, rule) ? [date] : [];
    }
    case 'weekly': {
      const week = addDays(startOfWeek(start, rule.weekStart ?? 1), index * interval * 7);
      const days = rule.byWeekday?.length
        ? rule.byWeekday.map((entry) => (typeof entry === 'number' ? entry : entry.weekday))
        : [dayOfWeek(start)];
      return days
        .map((weekday) => addDays(week, (weekday - (rule.weekStart ?? 1) + 7) % 7))
        .filter((date) => rule.byMonth === undefined || rule.byMonth.includes(date.month))
        .sort(compareDate);
    }
    case 'monthly': {
      const absolute = start.year * 12 + (start.month - 1) + index * interval;
      const year = Math.floor(absolute / 12);
      const month = (absolute % 12) + 1;
      if (rule.byMonth !== undefined && !rule.byMonth.includes(month)) return [];
      return monthCandidates(year, month, rule, start).sort(compareDate);
    }
    case 'yearly': {
      const year = start.year + index * interval;
      if (rule.byWeekday?.length && rule.byMonth === undefined && rule.byMonthDay === undefined) {
        return byWeekdayIn(
          { year, month: 1, day: 1 },
          { year, month: 12, day: 31 },
          rule.byWeekday,
        ).sort(compareDate);
      }
      const months = rule.byMonth ?? [start.month];
      return months.flatMap((month) => monthCandidates(year, month, rule, start)).sort(compareDate);
    }
  }
}

/** The first period worth walking when nothing has to be counted from the start. */
function firstPeriod(rule: RecurrenceRule, start: PlainDate, from: PlainDate): number {
  if (rule.count !== undefined || compareDate(from, start) <= 0) return 0;
  const interval = rule.interval ?? 1;
  switch (rule.frequency) {
    case 'daily':
      return Math.floor(daysBetween(start, from) / interval);
    case 'weekly':
      return Math.max(0, Math.floor(daysBetween(start, from) / (7 * interval)) - 1);
    case 'monthly': {
      const months = (from.year - start.year) * 12 + (from.month - start.month);
      return Math.max(0, Math.floor(months / interval) - 1);
    }
    case 'yearly':
      return Math.max(0, Math.floor((from.year - start.year) / interval) - 1);
  }
}

/**
 * The dates the rule gives inside `[from, to]`, both inclusive, in order.
 *
 * `start` is always the first occurrence and counts toward `count`, as
 * DTSTART does in the standard, whether or not the rule would have produced
 * it. `exceptions` are removed after counting, as EXDATE is. Dates a month
 * cannot hold — the thirty-first of April — are skipped, not clamped.
 */
export function occurrenceDates(
  rule: RecurrenceRule,
  start: PlainDate,
  from: PlainDate,
  to: PlainDate,
  exceptions: readonly PlainDate[] = [],
): PlainDate[] {
  const dates: PlainDate[] = [];
  if (compareDate(to, start) < 0 || compareDate(to, from) < 0) return dates;

  const excluded = (date: PlainDate) => exceptions.some((other) => isSameDate(date, other));
  const inWindow = (date: PlainDate) => compareDate(date, from) >= 0 && compareDate(date, to) <= 0;
  let counted = 0;

  const take = (date: PlainDate): boolean => {
    if (rule.until !== undefined && compareDate(date, rule.until) > 0) return false;
    if (rule.count !== undefined && counted >= rule.count) return false;
    counted += 1;
    if (inWindow(date) && !excluded(date)) dates.push(date);
    return true;
  };

  const skip = firstPeriod(rule, start, from);
  if (skip === 0 && !take(start)) return dates;

  for (let index = skip; index < skip + MAX_PERIODS; index += 1) {
    const candidates = periodDates(rule, start, index);
    for (const date of candidates) {
      if (compareDate(date, start) <= 0) continue;
      if (compareDate(date, to) > 0) return dates;
      if (!take(date)) return dates;
    }
  }
  return dates;
}
