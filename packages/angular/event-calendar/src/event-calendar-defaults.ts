import { inject, InjectionToken } from '@angular/core';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import type {
  CalendarEvent,
  EventCalendarCalendar,
  EventCalendarListRange,
  EventCalendarView,
  EventCalendarWeekends,
  EventOccurrence,
  WorkingHours,
} from '@slotted/core/event-calendar';

export type {
  CalendarEvent,
  EventCalendarCalendar,
  EventCalendarListRange,
  EventCalendarView,
  EventCalendarWeekends,
  EventOccurrence,
  WorkingHours,
};

/**
 * What the reader chose to act on: a run of days, the last one inclusive, or a
 * stretch of one day's hours, the end exclusive — the two ends a calendar's
 * events already have.
 */
export type EventCalendarSelection =
  | { readonly start: PlainDate; readonly end: PlainDate }
  | { readonly start: PlainDateTime; readonly end: PlainDateTime };

export type EventCalendarSelectionMode = 'none' | 'range';
/** What happens to the month and the week below the compact size class. */
export type EventCalendarCompact = 'list' | 'keep';
export type EventCalendarHourCycle = 'h12' | 'h23';

/**
 * Where the reader asked an occurrence to go: dates with the last day
 * inclusive for an all-day event, date-times with the end exclusive for a
 * timed one — what the application writes back into the event. `occurrence`
 * is the date the occurrence stood on, which is what an application moving
 * one occurrence of a series writes as its `occurrence`.
 */
export type EventCalendarEventChange = {
  readonly key: string;
  readonly event: CalendarEvent;
  readonly occurrence: PlainDate;
  readonly recurring: boolean;
  readonly kind: 'move' | 'resize';
} & (
  | { readonly start: PlainDate; readonly end: PlainDate }
  | { readonly start: PlainDateTime; readonly end: PlainDateTime }
);

/** The period in view, emitted after it changes so an application can fetch it. */
export interface EventCalendarRange {
  readonly start: PlainDate;
  /** The last day drawn, inclusive. */
  readonly end: PlainDate;
  readonly view: EventCalendarView;
}

/** What an application sets once for every event calendar under it. */
export interface EventCalendarDefaults {
  compact: EventCalendarCompact;
  dayHours: readonly [number, number];
  firstDayOfWeek: number | undefined;
  fixedWeeks: boolean;
  hourCycle: EventCalendarHourCycle | undefined;
  listRange: EventCalendarListRange;
  loadingDelay: number;
  loadingMinDuration: number;
  maxColumns: number;
  maxEvents: number;
  scrollTime: PlainTime;
  /** Minutes, 5 to 120: the lighter rules and the step of a selection or a drag. */
  slotDuration: number;
  timeZone: string | undefined;
  weekends: EventCalendarWeekends;
  weekNumbers: boolean;
}

export const EVENT_CALENDAR_FALLBACK: EventCalendarDefaults = {
  compact: 'list',
  dayHours: [0, 24],
  firstDayOfWeek: undefined,
  fixedWeeks: false,
  hourCycle: undefined,
  listRange: 'week',
  loadingDelay: 200,
  loadingMinDuration: 400,
  maxColumns: 6,
  maxEvents: 3,
  scrollTime: { hour: 7, minute: 0, second: 0 },
  slotDuration: 30,
  timeZone: undefined,
  weekends: 'shown',
  weekNumbers: false,
};

export const EVENT_CALENDAR_DEFAULTS = new InjectionToken<EventCalendarDefaults>(
  'slotted event calendar defaults',
  { providedIn: 'root', factory: () => EVENT_CALENDAR_FALLBACK },
);

/**
 * An application decides once which zone answers "today", when its working
 * day starts and how tall an hour is. The locale and the words come from the
 * language in force (`provideSlotted`).
 */
export function provideEventCalendarDefaults(defaults: Partial<EventCalendarDefaults>) {
  return {
    provide: EVENT_CALENDAR_DEFAULTS,
    useFactory: (): EventCalendarDefaults => ({ ...EVENT_CALENDAR_FALLBACK, ...defaults }),
  };
}

export function injectEventCalendarDefaults(): EventCalendarDefaults {
  return inject(EVENT_CALENDAR_DEFAULTS);
}

/** What `ng-template[slEventCalendarEvent]` receives. */
export interface EventCalendarEventContext {
  readonly $implicit: EventOccurrence;
  readonly layout: 'lane' | 'bar' | 'block' | 'list';
  readonly date: PlainDate;
  /** The time the family would write, for a template that keeps it. */
  readonly time: string | null;
}

/** What `ng-template[slEventCalendarDetail]` receives. */
export interface EventCalendarDetailContext {
  readonly $implicit: EventOccurrence;
  /** Asks to close the detail, with the reason `programmatic`. */
  readonly close: () => void;
}

/**
 * What a secondary click, a long press or `Shift+F10` pointed at: an event,
 * or a stretch of the grid — the selection when the pointer was inside it,
 * otherwise one step of the hours or one day.
 */
export type EventCalendarContextTarget =
  | { readonly kind: 'event'; readonly occurrence: EventOccurrence }
  | { readonly kind: 'slot'; readonly slot: EventCalendarSelection };

/** What `ng-template[slEventCalendarContextMenu]` receives. */
export interface EventCalendarContextMenuContext {
  readonly $implicit: EventCalendarContextTarget;
}

/** What `ng-template[slEventCalendarDayContent]` receives. */
export interface EventCalendarDayContentContext {
  readonly $implicit: PlainDate;
  readonly view: EventCalendarView;
}
