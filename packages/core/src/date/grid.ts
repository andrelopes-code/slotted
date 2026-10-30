/**
 * The grid a calendar draws, and the two pages behind it.
 *
 * A month grid is not a collection: its cells are derived from an arithmetic
 * rather than keyed from a set, it moves by seven and pages by a calendar
 * month, and neither is an index arithmetic. That is why it lives here and not
 * under `collection` —.
 *
 * Nothing here touches the DOM or a framework.
 */

import { addDays, daysBetween, daysInMonth, isoWeekNumber, startOfWeek } from './plain-date';
import type { PlainDate } from './plain-date';

export interface CalendarDay {
  readonly date: PlainDate;
  /** A day of the previous or the following month, shown to fill the row. */
  readonly outsideMonth: boolean;
}

export interface CalendarWeek {
  /** The ISO 8601 week number, for the row header a product may ask for. */
  readonly weekNumber: number;
  readonly days: readonly CalendarDay[];
}

export interface MonthGridOptions {
  readonly year: number;
  readonly month: number;
  /** `0` is Sunday. Comes from the locale unless a product fixes it. */
  readonly firstDayOfWeek: number;
  /**
   * Always six rows, so paging does not change the surface's height.
   *
   * A month can open on five rows or on six, and a popover that grows under
   * the pointer between one press of "next" and the next moves the target the
   * reader was aiming at. Off for a calendar standing on a page of its own,
   * where the extra row is a row of grey numbers nobody asked for.
   */
  readonly fixedWeeks?: boolean | undefined;
}

/** Six rows is the most any month needs; a 31-day month opening on the last day of the week fills them. */
const MAX_WEEKS = 6;

export function monthGrid({
  year,
  month,
  firstDayOfWeek,
  fixedWeeks = false,
}: MonthGridOptions): CalendarWeek[] {
  const first = { year, month, day: 1 };
  const start = startOfWeek(first, firstDayOfWeek);
  const length = daysInMonth(year, month);
  const spanned = daysBetween(start, { year, month, day: length }) + 1;
  const weeks = fixedWeeks ? MAX_WEEKS : Math.ceil(spanned / 7);

  return Array.from({ length: weeks }, (_, week) => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, week * 7 + index);
      return { date, outsideMonth: date.year !== year || date.month !== month };
    });
    return { weekNumber: isoWeekNumber((days[0] as CalendarDay).date), days };
  });
}

/** The months a multi-month calendar shows, starting at the one it is on. */
export function visibleMonths(
  from: Pick<PlainDate, 'year' | 'month'>,
  count: number,
): { year: number; month: number }[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const absolute = from.year * 12 + (from.month - 1) + index;
    return { year: Math.floor(absolute / 12), month: (((absolute % 12) + 12) % 12) + 1 };
  });
}

/**
 * The page of years the year view shows, anchored so the year the reader is on
 * keeps its place between pages: a grid that recentred on every press would
 * move every cell under the pointer.
 */
export function yearPage(year: number, size = 12): number[] {
  const start = Math.floor(year / size) * size;
  return Array.from({ length: size }, (_, index) => start + index);
}
