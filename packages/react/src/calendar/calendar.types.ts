import type { CalendarMessages, PartialMessages } from '@slotted/core/i18n';
import type { PlainDate } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

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

/**
 * The calendar system the value is written in. One value today, and an axis
 * rather than a silence: a second calendar system is a second arithmetic, and
 * declaring the axis now is what keeps its arrival from being a contract break.
 */
export type CalendarCalendar = 'gregory';

export type CalendarValueReason = Extract<
  ChangeRequest<CalendarValue>['reason'],
  'pointer' | 'keyboard' | 'clear' | 'programmatic'
>;

/** What an application sets once for every calendar under it. */
export interface CalendarDefaults {
  calendar: CalendarCalendar;
  /** `0` is Sunday. Unset means the locale decides. */
  firstDayOfWeek: number | undefined;
  /** Always six rows, so paging does not change the surface's height. */
  fixedWeeks: boolean;
  months: number;
  /**
   * Unset is not `shown`: a calendar showing one month draws the days either
   * side of it, and a calendar showing two would draw the same six days in
   * both grids. See the resolution in `calendar.tsx`.
   */
  outsideDays: CalendarOutsideDays | undefined;
  /** Which zone answers "what is today". Unset means the runtime's own. */
  timeZone: string | undefined;
  weekNumbers: boolean;
}

export interface CalendarDefaultsProviderProps extends Partial<CalendarDefaults> {
  children?: ReactNode | undefined;
}

export interface CalendarRootProps extends HTMLAttributes<HTMLElement> {
  'data-calendar': CalendarCalendar;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-months'?: string | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-ui': string;
  'data-view': CalendarView;
  'data-week-numbers'?: '' | undefined;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface CalendarHandle {
  /** Puts focus on the cell holding the roving tab stop. */
  focus(): void;
  /** Moves the reader to a date, paging the grid to reach it. */
  focusDate(date: PlainDate): void;
}

/** What falls on a day. */
export interface CalendarMark {
  count?: number | undefined;
  tone?: 'accent' | 'info' | 'success' | 'warning' | 'danger' | undefined;
}

export interface CalendarProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: CalendarValue | undefined;
  defaultValue?: CalendarValue | undefined;
  onValueChange?:
    ((value: CalendarValue, request: ChangeRequest<CalendarValue>) => void) | undefined;

  /** The date the reader is on. Present means the consumer owns it. */
  focusedDate?: PlainDate | undefined;
  defaultFocusedDate?: PlainDate | undefined;
  onFocusedDateChange?: ((date: PlainDate, request: ChangeRequest<PlainDate>) => void) | undefined;

  min?: PlainDate | undefined;
  max?: PlainDate | undefined;
  /** Refuses particular dates. A refused date stays focusable and is not selectable. */
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;

  selectionMode?: CalendarSelectionMode | undefined;
  /** How many months are drawn side by side. They wrap when they do not fit. */
  months?: number | undefined;
  view?: CalendarView | undefined;
  defaultView?: CalendarView | undefined;
  onViewChange?: ((view: CalendarView) => void) | undefined;
  /** What a choice is: a day, or a month of a year. Defaults to `day`. */
  granularity?: CalendarGranularity | undefined;
  /**
   * The pending end of an open run: the day under the pointer, or the focused
   * day when no pointer is over the grid, and `null` while no run is open. A
   * fact the grid states rather than a value the consumer owns, which is why
   * it is not a state model — `date-range-picker` reads it to say how long the
   * run would be.
   */
  onPreviewChange?: ((date: PlainDate | null) => void) | undefined;

  weekNumbers?: boolean | undefined;
  fixedWeeks?: boolean | undefined;
  outsideDays?: CalendarOutsideDays | undefined;
  /**
   * What falls on a day, keyed by its ISO date (`2026-09-12`): a `mark` part under the number,
   * in the given tone, and its count in the day's accessible name ("12, 2 items"). It composes
   * with every selection mode, `min`, `max` and `outsideDays`.
   */
  marks?: ReadonlyMap<string, CalendarMark> | undefined;

  /** The locale that writes months and days. Unset, the language in force decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  firstDayOfWeek?: number | undefined;
  calendar?: CalendarCalendar | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * names of the previous and next triggers.
   */
  messages?: PartialMessages<CalendarMessages> | undefined;

  render?: ((props: CalendarRootProps) => ReactNode) | undefined;
  ref?: Ref<CalendarHandle> | undefined;
}
