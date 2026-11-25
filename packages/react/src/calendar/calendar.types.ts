import type { CalendarMessages, PartialMessages } from '@slotted/core/i18n';
import type { PlainDate } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react';

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

/** Where the content of a day stands in the `fill` layout. */
export type CalendarDayAlign = 'center' | 'start';

/** How the `fill` layout marks today. */
export type CalendarTodayMark = 'dot' | 'disc';

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
  'data-day-align'?: 'start' | undefined;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-lines'?: '' | undefined;
  'data-months'?: string | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-today-mark'?: 'disc' | undefined;
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
  /**
   * Replaces the day's generated accessible name, for a day whose content
   * says more than a count: "October 20; 2 items, 1 open".
   */
  dayLabel?: ((date: PlainDate) => string) | undefined;
  /**
   * `cells` draws square cells of `--slotted-calendar-cell-size`; `fill` shares
   * the inline size between the seven columns and takes the row height from
   * `--slotted-calendar-day-height`, for a month view with content in its days.
   */
  layout?: 'cells' | 'fill' | undefined;
  /**
   * What a day holds under its number: `CalendarDayMarks`, `CalendarDayValue`.
   * The family keeps the day's button, focus, selection, today and
   * outside-day states; the content is part of the day's name unless
   * `dayLabel` names it.
   */
  renderDay?: ((date: PlainDate, state: CalendarDayState) => ReactNode) | undefined;
  /**
   * What a tooltip says of a day, or nothing for a day without one. The day
   * itself is its trigger, by the pointer and by the keyboard focus.
   */
  renderDayTooltip?: ((date: PlainDate, state: CalendarDayState) => ReactNode) | undefined;
  /**
   * The name of the page and the controls that turn it. `false` leaves them
   * out, for a page with a month control of its own: the grid is then named by
   * its caption, and `focusedDate` turns the page.
   */
  header?: boolean | undefined;
  /** Hairlines between the days of the `fill` layout. */
  lines?: boolean | undefined;
  /**
   * Where the content of a day stands in the `fill` layout. `start` puts the
   * number on the start of the first line, the figure on the end of its own and
   * the marks, written last, on the start of the last line.
   */
  dayAlign?: CalendarDayAlign | undefined;
  /**
   * How the `fill` layout marks today: a `dot` under the number, or the number
   * in a `disc` of the accent solid.
   */
  todayMark?: CalendarTodayMark | undefined;
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
  /**
   * The days that hold nothing to choose, as the days of a month of records
   * that have none: plain text, with no button, tooltip or label of their own.
   * The arrow keys cross them. A day that is both is inert, not unavailable.
   */
  isDateInert?: ((date: PlainDate) => boolean) | undefined;

  /**
   * The days of a run that are past its limit: the band and its end are drawn
   * in the danger tone there. It refuses nothing.
   */
  isDateOver?: ((date: PlainDate) => boolean) | undefined;

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

/** What a day is, for the content `renderDay` draws in it. */
export interface CalendarDayState {
  readonly outside: boolean;
  readonly selected: boolean;
  readonly today: boolean;
  readonly unavailable: boolean;
}

export interface CalendarDayMarkProps extends ComponentPropsWithoutRef<'span'> {
  /** A tone or a data palette slot (`data-1` to `data-8`). Defaults to `accent`. */
  tone?:
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | `data-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
    | undefined;
  /** An open record: the mark is a ring rather than a dot, so state is not color alone. */
  hollow?: boolean | undefined;
}
