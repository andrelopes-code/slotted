import { createContext, useContext } from 'react';

import type {
  DateRangePickerDefaults,
  DateRangePickerDefaultsProviderProps,
} from './date-range-picker.types';

const FALLBACK: DateRangePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  count: 'days',
  months: 2,
  placement: 'bottom-start',
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
};

const DateRangePickerDefaultsContext = createContext<DateRangePickerDefaults>(FALLBACK);

/** What a range picker renders as here, before it states anything of its own. */
export function useDateRangePickerDefaults(): DateRangePickerDefaults {
  return useContext(DateRangePickerDefaultsContext);
}

/**
 * An application decides once what a run counts, which zone answers "today"
 * and how many months it shows — rather than repeating the same props on every
 * picker in a form. The locale that writes its dates and every word it says
 * come from the language in force (`SlottedProvider`).
 */
export function DateRangePickerDefaultsProvider({
  children,
  ...defaults
}: DateRangePickerDefaultsProviderProps) {
  const inherited = useDateRangePickerDefaults();

  return (
    <DateRangePickerDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        closeOnSelect: defaults.closeOnSelect ?? inherited.closeOnSelect,
        count: defaults.count ?? inherited.count,
        months: defaults.months ?? inherited.months,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DateRangePickerDefaultsContext.Provider>
  );
}
