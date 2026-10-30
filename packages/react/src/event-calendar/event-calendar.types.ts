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
import type { EventCalendarMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

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

export type EventCalendarDateReason = 'pointer' | 'keyboard' | 'programmatic';
export type EventCalendarViewReason = 'pointer' | 'keyboard' | 'programmatic';
export type EventCalendarSelectionReason = 'pointer' | 'keyboard' | 'escape' | 'programmatic';
export type EventCalendarOpenReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'programmatic';

/**
 * Where the reader asked an occurrence to go: dates with the last day
 * inclusive for an all-day event, date-times with the end exclusive for a
 * timed one — what the application writes back into the event. `occurrence`
 * is the date the occurrence stood on, which is what an application moving
 * one occurrence of a series writes as its `occurrence`.
 */
export type EventCalendarEventChange<E extends CalendarEvent = CalendarEvent> = {
  readonly key: string;
  readonly event: E;
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
  /** The first visible hour and the hour the grid stops at, 0 to 24. */
  dayHours: readonly [number, number];
  /** `0` is Sunday. Unset means the locale decides. */
  firstDayOfWeek: number | undefined;
  fixedWeeks: boolean;
  /** Unset means the locale's own clock. */
  hourCycle: EventCalendarHourCycle | undefined;
  listRange: EventCalendarListRange;
  loadingDelay: number;
  loadingMinDuration: number;
  maxColumns: number;
  maxEvents: number;
  scrollTime: PlainTime;
  /** Minutes, 5 to 120: the lighter rules and the step of a selection or a drag. */
  slotDuration: number;
  /** Which zone answers today and now. Unset means the runtime's own. */
  timeZone: string | undefined;
  weekends: EventCalendarWeekends;
  weekNumbers: boolean;
}

export interface EventCalendarDefaultsProviderProps extends Partial<EventCalendarDefaults> {
  children?: ReactNode;
}

/** Where an event is being drawn, for `renderEvent`. */
export interface EventRenderContext {
  /** `lane`: a line in the month; `bar`: across days; `block`: a column; `list`: a row. */
  readonly layout: 'lane' | 'bar' | 'block' | 'list';
  /** The day the drawing stands in. */
  readonly date: PlainDate;
  /** The default content, for a renderer that only adds to it. */
  readonly content: ReactNode;
}

export interface EventDetailContext {
  /** Asks to close the detail, with the reason `programmatic`. */
  readonly close: () => void;
}

/**
 * What a secondary click, a long press or `Shift+F10` pointed at: an event,
 * or a stretch of the grid — the selection when the pointer was inside it,
 * otherwise one step of the hours or one day.
 */
export type EventCalendarContextTarget<E extends CalendarEvent = CalendarEvent> =
  | { readonly kind: 'event'; readonly occurrence: EventOccurrence<E> }
  | { readonly kind: 'slot'; readonly slot: EventCalendarSelection };

export interface DayContentContext {
  readonly view: EventCalendarView;
}

export interface EventCalendarRootProps extends HTMLAttributes<HTMLElement> {
  'data-layout': 'grid' | 'list';
  'data-loading'?: '' | undefined;
  'data-part': 'root';
  'data-slot-duration': string;
  'data-ui': 'event-calendar';
  'data-view': EventCalendarView;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface EventCalendarHandle {
  /** The root element. */
  readonly element: HTMLElement | null;
  /** Puts focus on the cell holding the grid's tab stop, or the first event of a list. */
  focus(): void;
  /** Moves the calendar to a date and focuses its cell. */
  focusDate(date: PlainDate): void;
  /** Focuses an occurrence that is drawn, by key; returns whether one was. */
  focusEvent(key: string): boolean;
  /** Scrolls the hours so `time` is at the top. */
  scrollToTime(time: PlainTime): void;
}

export interface EventCalendarProps<E extends CalendarEvent = CalendarEvent> extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'defaultValue' | 'onChange' | 'ref'
> {
  events: readonly E[];
  calendars?: readonly EventCalendarCalendar[] | undefined;

  /** The day the calendar is on. Present means the consumer owns it. */
  date?: PlainDate | undefined;
  defaultDate?: PlainDate | undefined;
  onDateChange?: ((date: PlainDate, request: ChangeRequest<PlainDate>) => void) | undefined;

  /**
   * Now, in the calendar's zone. Present means the consumer owns it: the
   * calendar stops reading the clock, so a page dated by its content marks
   * the same today on every machine and at every minute.
   */
  now?: PlainDateTime | undefined;

  view?: EventCalendarView | undefined;
  defaultView?: EventCalendarView | undefined;
  onViewChange?:
    ((view: EventCalendarView, request: ChangeRequest<EventCalendarView>) => void) | undefined;
  /** The views the switcher offers, in order. */
  views?: readonly EventCalendarView[] | undefined;

  /** Keys of the calendars drawn. Absent and uncontrolled starts with all of them. */
  visibleCalendars?: readonly string[] | undefined;
  defaultVisibleCalendars?: readonly string[] | undefined;
  onVisibleCalendarsChange?:
    ((keys: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;

  selectionMode?: EventCalendarSelectionMode | undefined;
  selection?: EventCalendarSelection | null | undefined;
  defaultSelection?: EventCalendarSelection | null | undefined;
  onSelectionChange?:
    | ((
        selection: EventCalendarSelection | null,
        request: ChangeRequest<EventCalendarSelection | null>,
      ) => void)
    | undefined;

  /** The key of the occurrence whose detail is open. */
  openEvent?: string | null | undefined;
  defaultOpenEvent?: string | null | undefined;
  onOpenEventChange?:
    ((key: string | null, request: ChangeRequest<string | null>) => void) | undefined;
  /** Given, the family opens its own popover with this content, anchored to the event. */
  renderEventDetail?:
    ((occurrence: EventOccurrence<E>, context: EventDetailContext) => ReactNode) | undefined;

  /**
   * Given, a secondary click, a long press or `Shift+F10` on the grid opens a
   * `context-menu` with these items — `MenuItem`, `MenuSeparator`, a nested
   * `Menu` — for the target. Nothing returned keeps the browser's own menu
   * for that target.
   */
  renderContextMenu?: ((target: EventCalendarContextTarget<E>) => ReactNode) | undefined;

  onRangeChange?: ((range: EventCalendarRange) => void) | undefined;
  /**
   * Whether events can be moved and resized — by dragging, or Alt with the
   * arrows — for all of them or per occurrence.
   */
  editable?: boolean | ((occurrence: EventOccurrence<E>) => boolean) | undefined;
  /**
   * Asks to put an occurrence somewhere else. The family holds no event: the
   * application answers by changing `events`, and `cancel()` or no change
   * leaves it where it was.
   */
  onEventChange?:
    | ((
        change: EventCalendarEventChange<E>,
        request: ChangeRequest<EventCalendarEventChange<E>>,
      ) => void)
    | undefined;
  /**
   * Whether an event may land where it is being moved, asked with the change
   * `onEventChange` would receive: at every step of a drag, and at every step
   * Alt and an arrow try. A refused destination is drawn as refused, and
   * letting go there puts the event back and asks for nothing.
   */
  canDrop?: ((change: EventCalendarEventChange<E>) => boolean) | undefined;
  /** Keeps an occurrence when it returns true — a search, a `filter-bar` predicate. */
  filter?: ((occurrence: EventOccurrence<E>) => boolean) | undefined;
  renderEvent?:
    ((occurrence: EventOccurrence<E>, context: EventRenderContext) => ReactNode) | undefined;
  renderDayContent?: ((date: PlainDate, context: DayContentContext) => ReactNode) | undefined;

  /** The consumer's controls, at the end of the header. */
  actions?: ReactNode;
  /** `false` draws no header, for a calendar driven entirely from outside. */
  header?: boolean | undefined;
  /** Content of the list layout's empty state, after its sentence: the action that creates one. */
  empty?: ReactNode;
  /** A message and a retry, above the grid. The grid stays usable. */
  error?: ReactNode;
  loading?: boolean | undefined;
  workingHours?: readonly WorkingHours[] | undefined;
  /** The heading level of the title, 2 to 5; each list day is one level below. */
  level?: 2 | 3 | 4 | 5 | undefined;

  compact?: EventCalendarCompact | undefined;
  dayHours?: readonly [number, number] | undefined;
  firstDayOfWeek?: number | undefined;
  fixedWeeks?: boolean | undefined;
  hourCycle?: EventCalendarHourCycle | undefined;
  listRange?: EventCalendarListRange | undefined;
  loadingDelay?: number | undefined;
  loadingMinDuration?: number | undefined;
  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * toolbar, the views, the empty and loading states, the counts and the
   * sentences said aloud.
   */
  messages?: PartialMessages<EventCalendarMessages> | undefined;
  maxColumns?: number | undefined;
  maxEvents?: number | undefined;
  scrollTime?: PlainTime | undefined;
  /** Minutes, 5 to 120: the lighter rules and the step of a selection or a drag. */
  slotDuration?: number | undefined;
  timeZone?: string | undefined;
  weekends?: EventCalendarWeekends | undefined;
  weekNumbers?: boolean | undefined;

  render?: ((props: EventCalendarRootProps) => ReactNode) | undefined;
  ref?: Ref<EventCalendarHandle> | undefined;
}
