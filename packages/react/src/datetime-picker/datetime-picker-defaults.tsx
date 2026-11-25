import { createContext, useContext } from 'react';

import type {
  DateTimePickerDefaults,
  DateTimePickerDefaultsProviderProps,
} from './datetime-picker.types';

const FALLBACK: DateTimePickerDefaults = {
  calendar: 'gregory',
  confirm: true,
  granularity: 'minute',
  hourCycle: undefined,
  placement: 'bottom-start',
  size: 'md',
  step: 900,
  timeZone: undefined,
  variant: 'outline',
};

const DateTimePickerDefaultsContext = createContext<DateTimePickerDefaults>(FALLBACK);

/** What a datetime picker renders as here, before it states anything itself. */
export function useDateTimePickerDefaults(): DateTimePickerDefaults {
  return useContext(DateTimePickerDefaultsContext);
}

/**
 * An application decides once how its datetime pickers behave — which clock
 * they run on, which step they offer, whether the panel confirms — rather than
 * repeating the same props on every control in a form. A control that states
 * any of them itself still wins. The locale that writes them and
 * every word they say come from the language in force (`SlottedProvider`).
 */
export function DateTimePickerDefaultsProvider({
  children,
  ...defaults
}: DateTimePickerDefaultsProviderProps) {
  const inherited = useDateTimePickerDefaults();

  return (
    <DateTimePickerDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        confirm: defaults.confirm ?? inherited.confirm,
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        step: defaults.step ?? inherited.step,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DateTimePickerDefaultsContext.Provider>
  );
}
