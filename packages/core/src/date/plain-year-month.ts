import { compareDate, daysInMonth, plainDate } from './plain-date';
import type { PlainDate } from './plain-date';

/**
 * A month of a year, with no day: a card statement, a budget month, a period
 * a form asks for whole. It is its own shape rather than a `PlainDate` on the
 * first, because a value that says "the 1st" says a day nobody chose.
 */
export interface PlainYearMonth {
  readonly year: number;
  readonly month: number;
}

const ISO_YEAR_MONTH = /^(\d{4,6})-(\d{2})$/;

/** Builds a month, refusing one the calendar does not have. */
export function plainYearMonth(year: number, month: number): PlainYearMonth {
  if (!Number.isInteger(year)) throw new RangeError(`year must be an integer, got ${year}`);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`month must be 1 to 12, got ${month}`);
  }
  return { year, month };
}

/** A year and a month and no day: a `PlainDate` is not one. */
export function isPlainYearMonth(value: unknown): value is PlainYearMonth {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PlainYearMonth> & { day?: unknown };
  return (
    Number.isInteger(candidate.year) &&
    Number.isInteger(candidate.month) &&
    candidate.day === undefined
  );
}

/** `YYYY-MM`, the form an `input type="month"` and an API both carry. */
export function toISOYearMonth(value: PlainYearMonth): string {
  return `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}`;
}

/** The month a `YYYY-MM` string names, or `null` for anything else. */
export function parseISOYearMonth(text: string): PlainYearMonth | null {
  const match = ISO_YEAR_MONTH.exec(text.trim());
  if (match === null) return null;
  const [, year, month] = match as unknown as [string, string, string];
  try {
    return plainYearMonth(Number(year), Number(month));
  } catch {
    return null;
  }
}

export function compareYearMonth(a: PlainYearMonth, b: PlainYearMonth): number {
  return a.year !== b.year ? a.year - b.year : a.month - b.month;
}

export function isSameYearMonth(
  a: PlainYearMonth | null | undefined,
  b: PlainYearMonth | null | undefined,
): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  return compareYearMonth(a, b) === 0;
}

export function isYearMonthInRange(
  value: PlainYearMonth,
  min: PlainYearMonth | undefined,
  max: PlainYearMonth | undefined,
): boolean {
  if (min !== undefined && compareYearMonth(value, min) < 0) return false;
  return max === undefined || compareYearMonth(value, max) <= 0;
}

/** The month a date falls in. */
export function yearMonthOf(date: PlainDate): PlainYearMonth {
  return { year: date.year, month: date.month };
}

/** The first day of the month, which is where a day-based bound for it starts. */
export function firstDayOf(value: PlainYearMonth): PlainDate {
  return plainDate(value.year, value.month, 1);
}

/** The last day of the month, which is where a day-based bound for it ends. */
export function lastDayOf(value: PlainYearMonth): PlainDate {
  return plainDate(value.year, value.month, daysInMonth(value.year, value.month));
}

/** Whether a date falls in the month. */
export function isInYearMonth(date: PlainDate, value: PlainYearMonth): boolean {
  return compareDate(date, firstDayOf(value)) >= 0 && compareDate(date, lastDayOf(value)) <= 0;
}
