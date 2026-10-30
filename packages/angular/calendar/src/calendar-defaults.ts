import { inject, InjectionToken } from '@angular/core';
import type { PlainDate } from '@slotted/core/date';

/** A run of days, either end of which may still be open while it is drawn. */
export interface DateRange {
  readonly start: PlainDate | null;
  readonly end: PlainDate | null;
}

/**
 * What the calendar holds, which depends on what it was asked to collect: one
 * date, a run of them, or a set.
 */
export type CalendarValue = PlainDate | DateRange | PlainDate[] | null;

/** How many dates the reader may choose. */
export type CalendarSelectionMode = 'single' | 'range' | 'multiple';

/** Which grid the calendar is showing. The heading walks up; Escape walks down. */
export type CalendarView = 'day' | 'month' | 'year';

/**
 * The smallest thing the reader chooses. `month` makes the months of a year
 * the grid a choice is made in: the calendar opens there, a month cell is the
 * value, written as the first day of that month, and the day grid is never
 * shown.
 */
export type CalendarGranularity = 'day' | 'month';

/** What happens to a day belonging to the month either side. */
export type CalendarOutsideDays = 'shown' | 'selectable' | 'hidden';

/** What falls on a day. */
export interface CalendarMark {
  count?: number;
  tone?: 'accent' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * The calendar system the value is written in. One value today, and an axis
 * rather than a silence: a second calendar system is a second arithmetic, and
 * declaring the axis now is what keeps its arrival from being a contract break.
 */
export type CalendarCalendar = 'gregory';

export interface CalendarDefaults {
  calendar: CalendarCalendar;
  firstDayOfWeek: number | undefined;
  fixedWeeks: boolean;
  months: number;
  /**
   * Unset is not `shown`: a calendar showing one month draws the days either
   * side of it, and a calendar showing two would draw the same six days in
   * both grids. See the resolution in `calendar.ts`.
   */
  outsideDays: CalendarOutsideDays | undefined;
  timeZone: string | undefined;
  weekNumbers: boolean;
}

const FALLBACK: CalendarDefaults = {
  calendar: 'gregory',
  firstDayOfWeek: undefined,
  fixedWeeks: false,
  months: 1,
  outsideDays: undefined,
  timeZone: undefined,
  weekNumbers: false,
};

export const CALENDAR_DEFAULTS = new InjectionToken<CalendarDefaults>('slotted calendar defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once which day its weeks start on, which zone answers
 * "today" and whether its calendars keep a fixed six-row grid — rather than
 * repeating the same inputs on every instance. Its words and the locale that
 * writes its months come from the language in force (`provideSlotted`).
 *
 * `fixedWeeks` is the one worth setting where calendars live in popovers: a
 * surface that grows a row between one press of "next" and the next moves the
 * target the reader was aiming at.
 */
export function provideCalendarDefaults(defaults: Partial<CalendarDefaults>) {
  return {
    provide: CALENDAR_DEFAULTS,
    useFactory: (): CalendarDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a calendar renders as here, before it states anything of its own. */
export function injectCalendarDefaults(): CalendarDefaults {
  return inject(CALENDAR_DEFAULTS);
}
