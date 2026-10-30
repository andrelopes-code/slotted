import { createContext, useContext } from 'react';

import type { CalendarDefaults, CalendarDefaultsProviderProps } from './calendar.types';

const FALLBACK: CalendarDefaults = {
  calendar: 'gregory',
  firstDayOfWeek: undefined,
  fixedWeeks: false,
  months: 1,
  outsideDays: undefined,
  timeZone: undefined,
  weekNumbers: false,
};

const CalendarDefaultsContext = createContext<CalendarDefaults>(FALLBACK);

/** What a calendar renders as here, before it states anything of its own. */
export function useCalendarDefaults(): CalendarDefaults {
  return useContext(CalendarDefaultsContext);
}

/**
 * An application decides once which day its weeks start on, which zone answers
 * "today" and whether its calendars keep a fixed six-row grid — rather than
 * repeating the same props on every instance. Its words and the locale that
 * writes its months come from the language in force (`SlottedProvider`).
 *
 * `fixedWeeks` is the one worth setting where calendars live in popovers: a
 * surface that grows a row between one press of "next" and the next moves the
 * target the reader was aiming at.
 */
export function CalendarDefaultsProvider({ children, ...defaults }: CalendarDefaultsProviderProps) {
  const inherited = useCalendarDefaults();

  return (
    <CalendarDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        firstDayOfWeek: defaults.firstDayOfWeek ?? inherited.firstDayOfWeek,
        fixedWeeks: defaults.fixedWeeks ?? inherited.fixedWeeks,
        months: defaults.months ?? inherited.months,
        outsideDays: defaults.outsideDays ?? inherited.outsideDays,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        weekNumbers: defaults.weekNumbers ?? inherited.weekNumbers,
      }}
    >
      {children}
    </CalendarDefaultsContext.Provider>
  );
}
