import { createContext, useContext } from 'react';

import type { TimePickerDefaults, TimePickerDefaultsProviderProps } from './time-picker.types';

/**
 * A quarter of an hour, which is the slot a booking flow asks in and the step
 * every surveyed panel defaults to within a factor of two.
 */
export const TIME_PICKER_STEP = 900;

const FALLBACK: TimePickerDefaults = {
  confirm: true,
  granularity: 'minute',
  hourCycle: undefined,
  placement: 'bottom-start',
  size: 'md',
  step: TIME_PICKER_STEP,
  timeZone: undefined,
  variant: 'outline',
};

const TimePickerDefaultsContext = createContext<TimePickerDefaults>(FALLBACK);

/** What a time picker renders as here, before it states anything of its own. */
export function useTimePickerDefaults(): TimePickerDefaults {
  return useContext(TimePickerDefaultsContext);
}

/**
 * An application decides once what its times look like and what step its
 * panels offer, rather than repeating the same props on every picker in a
 * product. A picker that states any of them itself still wins. The locale and
 * the words come from the language in force (`SlottedProvider`).
 *
 * `step` is the one worth setting first: a product books in twenty-minute slots
 * and a quarter-hour default puts a panel of the wrong times in front of every
 * reader.
 */
export function TimePickerDefaultsProvider({
  children,
  ...defaults
}: TimePickerDefaultsProviderProps) {
  const inherited = useTimePickerDefaults();

  return (
    <TimePickerDefaultsContext.Provider
      value={{
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
    </TimePickerDefaultsContext.Provider>
  );
}
