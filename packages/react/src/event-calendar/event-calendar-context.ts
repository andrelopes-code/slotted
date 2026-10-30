import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import type {
  CalendarEvent,
  EventCalendarCalendar,
  EventCalendarView,
  EventOccurrence,
  WorkingHours,
} from '@slotted/core/event-calendar';
import type { EventCalendarMessages, FamilyTranslator } from '@slotted/core/i18n';
import { createContext, useContext } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';

import type {
  DayContentContext,
  EventCalendarHourCycle,
  EventCalendarSelection,
  EventCalendarSelectionMode,
  EventRenderContext,
} from './event-calendar.types';

/** Which row of a time grid holds the tab stop. The month has one kind of cell. */
export type GridRow = 'header' | 'all-day' | 'timed';

/**
 * What the views of one calendar share. It is the family's own wiring between
 * its parts, not a public surface: a consumer reaches the same facts through
 * the props and the handle.
 */
export interface EventCalendarModel {
  readonly id: string;
  /** The family's words in the language in force, with this calendar's `messages` laid over them. */
  readonly t: FamilyTranslator<EventCalendarMessages>;
  readonly locale: string;
  readonly hourCycle: EventCalendarHourCycle | undefined;
  readonly timeZone: string | undefined;
  readonly view: EventCalendarView;
  readonly date: PlainDate;
  readonly today: PlainDate | null;
  readonly now: PlainDateTime | null;
  readonly calendars: readonly EventCalendarCalendar[];
  readonly openKey: string | null;
  readonly hostsDetail: boolean;
  readonly selection: EventCalendarSelection | null;
  readonly pendingSelection: EventCalendarSelection | null;
  readonly selectionMode: EventCalendarSelectionMode;
  readonly narrow: boolean;
  readonly weekNumbers: boolean;
  readonly maxEvents: number;
  readonly maxColumns: number;
  /** Minutes between the lighter rules, 5 to 120. */
  readonly slotDuration: number;
  readonly dayHours: readonly [number, number];
  readonly workingHours: readonly WorkingHours[];
  readonly row: GridRow;
  readonly moreDate: string | null;
  readonly headingLevel: number;
  readonly renderEvent:
    | ((occurrence: EventOccurrence<CalendarEvent>, context: EventRenderContext) => ReactNode)
    | undefined;
  readonly renderDayContent:
    ((date: PlainDate, context: DayContentContext) => ReactNode) | undefined;
  canEdit(occurrence: EventOccurrence<CalendarEvent>): boolean;
  /** The occurrence a pointer is moving, drawn where it would land. */
  readonly draggingKey: string | null;
  /** Whether `canDrop` refuses where the dragged occurrence would land. */
  readonly dropInvalid: boolean;
  /** The event a context menu is open on. */
  readonly contextKey: string | null;
  activate(
    occurrence: EventOccurrence<CalendarEvent>,
    element: HTMLElement,
    reason: 'pointer' | 'keyboard',
    event: SyntheticEvent,
  ): void;
  drill(date: PlainDate, reason: 'pointer' | 'keyboard', event: SyntheticEvent): void;
  openMore(date: PlainDate, element: HTMLElement): void;
  registerEvent(key: string, element: HTMLElement | null): void;
  calendarLabel(key: string | undefined): string | undefined;
  colorOf(key: string | undefined): number | null;
}

export const EventCalendarContext = createContext<EventCalendarModel | null>(null);

export function useEventCalendarModel(): EventCalendarModel {
  const model = useContext(EventCalendarContext);
  if (model === null) throw new Error('An event calendar part has to be inside EventCalendar.');
  return model;
}
