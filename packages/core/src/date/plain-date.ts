/**
 * One calendar date, with no time and no zone, and the arithmetic over it.
 *
 * `Date` is an instant. A birthday, an invoice date and a check-in are not
 * instants: they are the same day everywhere, and holding one in a `Date`
 * means a zone decides which day it is — the defect that moves a date west of
 * Greenwich by one day and appears only for readers in the wrong hemisphere.
 *
 * So the value is three numbers. `Date` still does the counting, in UTC, where
 * no offset and no daylight rule can reach it; nothing here ever returns one.
 *
 * The calendar is the proleptic Gregorian one, and only that one. A second
 * calendar system is a second arithmetic rather than an option, which is why
 * `calendar` is an axis on the families with one value today rather than a
 * silence —.
 *
 * Nothing here touches the DOM or a framework.
 */

export interface PlainDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * A month step's result. The date is where the step landed; `intendedDay` is
 * the day the reader asked for, which survives a month that could not hold it.
 *
 * Every surveyed implementation returns the clamped date alone, so a reader who
 * steps 31 January forward reaches 28 February and then 30 April — the 31 is
 * gone after one short month. Carrying the asked-for day back into the next
 * step is what makes the sequence 31 → 28 → 31 → 30 → 31.
 */
export interface DateStep {
  readonly date: PlainDate;
  readonly intendedDay: number;
  /** The month had no such day, so the date was pulled back to its last. */
  readonly clamped: boolean;
}

const MS_PER_DAY = 86_400_000;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** `YYYY-MM-DD` and nothing after it. An instant is refused, not truncated. */
const ISO_DATE = /^(\d{4,6})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return month === 2 && isLeapYear(year) ? 29 : (MONTH_LENGTHS[month - 1] ?? 0);
}

export function isPlainDate(value: unknown): value is PlainDate {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PlainDate>;
  return (
    Number.isInteger(candidate.year) &&
    Number.isInteger(candidate.month) &&
    Number.isInteger(candidate.day)
  );
}

/**
 * Builds a date, refusing one the calendar does not have. 29 February 2025 is
 * a typo or a bug in the caller, and returning 1 March instead would hide it.
 */
export function plainDate(year: number, month: number, day: number): PlainDate {
  if (!Number.isInteger(year)) throw new RangeError(`year must be an integer, got ${year}`);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`month must be 1 to 12, got ${month}`);
  }
  const length = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > length) {
    throw new RangeError(`${year}-${month} has ${length} days, got ${day}`);
  }
  return { year, month, day };
}

/**
 * The count `Date` performs, in UTC. It is the only place a `Date` is built,
 * and the value never leaves this file.
 */
function epochDay(date: PlainDate): number {
  const utc = Date.UTC(date.year, date.month - 1, date.day);
  /* `Date.UTC` maps a two-digit year onto 19xx; the calendar has years below
     100 and they are not the nineteen hundreds. */
  if (date.year >= 0 && date.year < 100) {
    const corrected = new Date(utc);
    corrected.setUTCFullYear(date.year);
    return Math.floor(corrected.getTime() / MS_PER_DAY);
  }
  return Math.floor(utc / MS_PER_DAY);
}

function fromEpochDay(days: number): PlainDate {
  const at = new Date(days * MS_PER_DAY);
  return { year: at.getUTCFullYear(), month: at.getUTCMonth() + 1, day: at.getUTCDate() };
}

export function toISODate(date: PlainDate): string {
  const year = String(date.year).padStart(4, '0');
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Reads `YYYY-MM-DD`, and nothing else.
 *
 * A server that sends `2026-09-09T00:00:00Z` is sending an instant, and the
 * day it names depends on where the reader is. Truncating it is the silent
 * wrong answer; `null` is the one the caller can act on.
 */
export function parseISODate(text: string): PlainDate | null {
  const match = ISO_DATE.exec(text.trim());
  if (match === null) return null;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  try {
    return plainDate(Number(year), Number(month), Number(day));
  } catch {
    return null;
  }
}

export function compareDate(a: PlainDate, b: PlainDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isSameDate(a: PlainDate | null, b: PlainDate | null): boolean {
  if (a === null || b === null) return a === b;
  return compareDate(a, b) === 0;
}

export function clampDate(
  date: PlainDate,
  min: PlainDate | undefined,
  max: PlainDate | undefined,
): PlainDate {
  if (min !== undefined && compareDate(date, min) < 0) return min;
  if (max !== undefined && compareDate(date, max) > 0) return max;
  return date;
}

export function isDateInRange(
  date: PlainDate,
  min: PlainDate | undefined,
  max: PlainDate | undefined,
): boolean {
  if (min !== undefined && compareDate(date, min) < 0) return false;
  return max === undefined || compareDate(date, max) <= 0;
}

/** Sunday is 0, which is the numbering `Intl` and `Date` both already use. */
export function dayOfWeek(date: PlainDate): number {
  return (((epochDay(date) + 4) % 7) + 7) % 7;
}

export function addDays(date: PlainDate, days: number): PlainDate {
  return fromEpochDay(epochDay(date) + days);
}

export function daysBetween(from: PlainDate, to: PlainDate): number {
  return epochDay(to) - epochDay(from);
}

export function startOfMonth(date: PlainDate): PlainDate {
  return { year: date.year, month: date.month, day: 1 };
}

export function endOfMonth(date: PlainDate): PlainDate {
  return { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) };
}

export function startOfWeek(date: PlainDate, firstDayOfWeek: number): PlainDate {
  const offset = (dayOfWeek(date) - firstDayOfWeek + 7) % 7;
  return addDays(date, -offset);
}

export function endOfWeek(date: PlainDate, firstDayOfWeek: number): PlainDate {
  return addDays(startOfWeek(date, firstDayOfWeek), 6);
}

/**
 * The ISO 8601 week number: week 1 is the one holding the year's first
 * Thursday, so a January date can belong to the previous year's week 53.
 *
 * The Thursday of the date's own week decides which year the week belongs to,
 * which is the whole rule stated once instead of as four boundary cases.
 */
export function isoWeekNumber(date: PlainDate): number {
  const thursday = addDays(startOfWeek(date, 1), 3);
  const firstThursday = addDays(startOfWeek({ year: thursday.year, month: 1, day: 4 }, 1), 3);
  return Math.round(daysBetween(firstThursday, thursday) / 7) + 1;
}

/**
 * Steps whole months. `intendedDay` is the day a previous step asked for and
 * could not have; pass it back in and the day returns as soon as a month can
 * hold it.
 */
export function stepMonth(date: PlainDate, months: number, intendedDay?: number): DateStep {
  const wanted = intendedDay ?? date.day;
  const absolute = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(absolute / 12);
  const month = (((absolute % 12) + 12) % 12) + 1;
  const length = daysInMonth(year, month);
  const day = Math.min(wanted, length);
  return { date: { year, month, day }, intendedDay: wanted, clamped: day !== wanted };
}

/** Steps whole years, which is twelve months and the same clamp on 29 February. */
export function stepYear(date: PlainDate, years: number, intendedDay?: number): DateStep {
  return stepMonth(date, years * 12, intendedDay);
}

/**
 * Which day it is, in one zone.
 *
 * The only question a time zone answers for a family whose value has none: two
 * places on opposite sides of the date line are a day apart at the same
 * instant, and a calendar that marks the wrong cell as today is wrong for half
 * the planet. The zone is not part of any value this module returns.
 */
export function todayIn(timeZone?: string): PlainDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    era: 'short',
  }).formatToParts(new Date());

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);

  const year = read('year');
  const beforeCommonEra = parts.find((part) => part.type === 'era')?.value === 'BC';
  return { year: beforeCommonEra ? 1 - year : year, month: read('month'), day: read('day') };
}
