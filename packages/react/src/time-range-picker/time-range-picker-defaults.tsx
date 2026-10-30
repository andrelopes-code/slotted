import { durationLabel } from '@slotted/core/date';
import { createContext, useContext } from 'react';

import type {
  TimeRangePickerDefaults,
  TimeRangePickerDefaultsProviderProps,
} from './time-range-picker.types';

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const TIME_RANGE_PICKER_STEP = 900;
/** A whole day at a one-minute step: the finest whole-day list any surveyed implementation offers. */
export const TIME_RANGE_PICKER_MAX_OPTIONS = 1440;

/** "2 hr 30 min": the duration the band and the rows say, in the family's locale. */
export function timeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

const FALLBACK: TimeRangePickerDefaults = {
  closeOnSelect: 'auto',
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: timeRangePickerLengthLabel,
  maxOptions: TIME_RANGE_PICKER_MAX_OPTIONS,
  placement: 'bottom-start',
  size: 'md',
  step: TIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  unavailableOptions: 'disable',
  variant: 'outline',
};

const TimeRangePickerDefaultsContext = createContext<TimeRangePickerDefaults>(FALLBACK);

/** What a time range picker renders as here, before it states anything of its own. */
export function useTimeRangePickerDefaults(): TimeRangePickerDefaults {
  return useContext(TimeRangePickerDefaultsContext);
}

/**
 * An application decides once what its times look like, what step its lists
 * offer and how a duration is written — rather than repeating the same props
 * on every picker in a form. A picker that states any of them itself still
 * wins. The locale and the words come from the language in force
 * (`SlottedProvider`).
 */
export function TimeRangePickerDefaultsProvider({
  children,
  ...defaults
}: TimeRangePickerDefaultsProviderProps) {
  const inherited = useTimeRangePickerDefaults();

  return (
    <TimeRangePickerDefaultsContext.Provider
      value={{
        closeOnSelect: defaults.closeOnSelect ?? inherited.closeOnSelect,
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        lengthLabel: defaults.lengthLabel ?? inherited.lengthLabel,
        maxOptions: defaults.maxOptions ?? inherited.maxOptions,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        step: defaults.step ?? inherited.step,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        unavailableOptions: defaults.unavailableOptions ?? inherited.unavailableOptions,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TimeRangePickerDefaultsContext.Provider>
  );
}
