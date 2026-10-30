import { createContext, useContext } from 'react';

import type { DateFieldDefaults, DateFieldDefaultsProviderProps } from './date-field.types';

/**
 * Two typed digits up to twenty years ahead of this year are this century, and
 * anything above them is the last: `30` is 2030 and `80` is 1980 in 2026.
 *
 * A birth-date field sets it to `0`, and then only a year already past can be
 * typed in two digits. The number is stated rather than inferred because the
 * alternative is two bindings guessing, differently, at what `26` means.
 */
export const DATE_FIELD_YEAR_PIVOT = 20;

const FALLBACK: DateFieldDefaults = {
  calendar: 'gregory',
  firstDayOfWeek: undefined,
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
  yearPivot: DATE_FIELD_YEAR_PIVOT,
};

const DateFieldDefaultsContext = createContext<DateFieldDefaults>(FALLBACK);

/** What a date field renders as here, before it states anything of its own. */
export function useDateFieldDefaults(): DateFieldDefaults {
  return useContext(DateFieldDefaultsContext);
}

/**
 * An application decides once what its dates look like, which zone answers
 * "today" and how a two-digit year resolves, rather than repeating the same
 * props on every control in a form. A control that states any of them itself
 * still wins. The locale that writes the dates, and the clear button's name,
 * come from the language in force (`SlottedProvider`).
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one.
 */
export function DateFieldDefaultsProvider({
  children,
  ...defaults
}: DateFieldDefaultsProviderProps) {
  const inherited = useDateFieldDefaults();

  return (
    <DateFieldDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        firstDayOfWeek: defaults.firstDayOfWeek ?? inherited.firstDayOfWeek,
        size: defaults.size ?? inherited.size,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        variant: defaults.variant ?? inherited.variant,
        yearPivot: defaults.yearPivot ?? inherited.yearPivot,
      }}
    >
      {children}
    </DateFieldDefaultsContext.Provider>
  );
}
