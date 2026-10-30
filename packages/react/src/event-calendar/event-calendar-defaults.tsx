import { createContext, useContext } from 'react';

import type {
  EventCalendarDefaults,
  EventCalendarDefaultsProviderProps,
} from './event-calendar.types';

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

const EventCalendarDefaultsContext = createContext<EventCalendarDefaults>(EVENT_CALENDAR_FALLBACK);

/** What an event calendar renders as here, before it states anything of its own. */
export function useEventCalendarDefaults(): EventCalendarDefaults {
  return useContext(EventCalendarDefaultsContext);
}

/**
 * An application decides once which zone answers "today", when its working
 * day starts and how tall an hour is — rather than repeating the same props on
 * every instance. A nested provider changes what it names and inherits the
 * rest. The locale and the words come from the language in force
 * (`SlottedProvider`).
 */
export function EventCalendarDefaultsProvider({
  children,
  ...defaults
}: EventCalendarDefaultsProviderProps) {
  const inherited = useEventCalendarDefaults();
  const merged = { ...inherited } as Record<string, unknown>;
  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined) merged[key] = value;
  }

  return (
    <EventCalendarDefaultsContext.Provider value={merged as unknown as EventCalendarDefaults}>
      {children}
    </EventCalendarDefaultsContext.Provider>
  );
}
