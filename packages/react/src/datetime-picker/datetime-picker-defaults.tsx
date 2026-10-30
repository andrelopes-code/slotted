import { createContext, useContext } from 'react';

import type {
  DateTimePickerDefaults,
  DateTimePickerDefaultsProviderProps,
} from './datetime-picker.types';

/**
 * A whole day at a one-minute step, which is the finest whole-day list any
 * surveyed implementation offers. A day at a one-second step is 86 400 rows and
 * is a configuration mistake rather than a list.
 */
export const DATE_TIME_PICKER_MAX_OPTIONS = 1440;

const FALLBACK: DateTimePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  granularity: 'minute',
  hourCycle: undefined,
  maxOptions: DATE_TIME_PICKER_MAX_OPTIONS,
  openTo: 'date',
  placement: 'bottom-start',
  size: 'md',
  step: 900,
  timeZone: undefined,
  unavailableOptions: 'disable',
  variant: 'outline',
};

const DateTimePickerDefaultsContext = createContext<DateTimePickerDefaults>(FALLBACK);

/** What a datetime picker renders as here, before it states anything itself. */
export function useDateTimePickerDefaults(): DateTimePickerDefaults {
  return useContext(DateTimePickerDefaultsContext);
}

/**
 * An application decides once how its datetime pickers behave — which clock
 * they run on, which step the list offers, which surface focus opens on —
 * rather than repeating the same props on every control in a form. A control
 * that states any of them itself still wins. The locale that writes them and
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
        closeOnSelect: defaults.closeOnSelect ?? inherited.closeOnSelect,
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        maxOptions: defaults.maxOptions ?? inherited.maxOptions,
        openTo: defaults.openTo ?? inherited.openTo,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        step: defaults.step ?? inherited.step,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        unavailableOptions: defaults.unavailableOptions ?? inherited.unavailableOptions,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DateTimePickerDefaultsContext.Provider>
  );
}
