import { createContext, useContext } from 'react';

import type { DatePickerDefaults, DatePickerDefaultsProviderProps } from './date-picker.types';

const FALLBACK: DatePickerDefaults = {
  calendar: 'gregory',
  confirm: undefined,
  placement: 'bottom-start',
  size: 'md',
  timeZone: undefined,
  today: undefined,
  variant: 'outline',
};

const DatePickerDefaultsContext = createContext<DatePickerDefaults>(FALLBACK);

/** What a date picker renders as here, before it states anything of its own. */
export function useDatePickerDefaults(): DatePickerDefaults {
  return useContext(DatePickerDefaultsContext);
}

/**
 * An application decides once which zone answers "today" and where its
 * surfaces open — rather than repeating the same props on every picker in a
 * form. The locale that writes its dates and the trigger's names come from the
 * language in force (`SlottedProvider`).
 */
export function DatePickerDefaultsProvider({
  children,
  ...defaults
}: DatePickerDefaultsProviderProps) {
  const inherited = useDatePickerDefaults();

  return (
    <DatePickerDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        confirm: defaults.confirm ?? inherited.confirm,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        today: defaults.today ?? inherited.today,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DatePickerDefaultsContext.Provider>
  );
}
