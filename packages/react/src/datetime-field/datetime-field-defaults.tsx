import { createContext, useContext } from 'react';

import type {
  DateTimeFieldDefaults,
  DateTimeFieldDefaultsProviderProps,
} from './datetime-field.types';

const FALLBACK: DateTimeFieldDefaults = {
  calendar: 'gregory',
  firstDayOfWeek: undefined,
  granularity: 'minute',
  hourCycle: undefined,
  relative: true,
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
  yearPivot: undefined,
};

const DateTimeFieldDefaultsContext = createContext<DateTimeFieldDefaults>(FALLBACK);

/** What a datetime field renders as here, before it states anything of its own. */
export function useDateTimeFieldDefaults(): DateTimeFieldDefaults {
  return useContext(DateTimeFieldDefaultsContext);
}

/**
 * An application decides once what its datetimes look like, which clock they
 * run on and which zone answers "now", rather than repeating the same props on
 * every control in a form. A control that states any of them itself still
 * wins. The locale that writes them, and the words the controls announce, come
 * from the language in force (`SlottedProvider`).
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one.
 */
export function DateTimeFieldDefaultsProvider({
  children,
  ...defaults
}: DateTimeFieldDefaultsProviderProps) {
  const inherited = useDateTimeFieldDefaults();

  return (
    <DateTimeFieldDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        firstDayOfWeek: defaults.firstDayOfWeek ?? inherited.firstDayOfWeek,
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        relative: defaults.relative ?? inherited.relative,
        size: defaults.size ?? inherited.size,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        variant: defaults.variant ?? inherited.variant,
        yearPivot: defaults.yearPivot ?? inherited.yearPivot,
      }}
    >
      {children}
    </DateTimeFieldDefaultsContext.Provider>
  );
}
