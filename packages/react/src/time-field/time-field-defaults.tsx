import { createContext, useContext } from 'react';

import type { TimeFieldDefaults, TimeFieldDefaultsProviderProps } from './time-field.types';

const FALLBACK: TimeFieldDefaults = {
  granularity: 'minute',
  hourCycle: undefined,
  relative: true,
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
};

const TimeFieldDefaultsContext = createContext<TimeFieldDefaults>(FALLBACK);

/** What a time field renders as here, before it states anything of its own. */
export function useTimeFieldDefaults(): TimeFieldDefaults {
  return useContext(TimeFieldDefaultsContext);
}

/**
 * An application decides once what its times look like, which clock they run
 * on and which zone answers "now", rather than repeating the same props on
 * every control in a form. A control that states any of them itself still
 * wins. The locale that writes the times, and the words, come from the
 * language in force (`SlottedProvider`).
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one.
 */
export function TimeFieldDefaultsProvider({
  children,
  ...defaults
}: TimeFieldDefaultsProviderProps) {
  const inherited = useTimeFieldDefaults();

  return (
    <TimeFieldDefaultsContext.Provider
      value={{
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        relative: defaults.relative ?? inherited.relative,
        size: defaults.size ?? inherited.size,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TimeFieldDefaultsContext.Provider>
  );
}
