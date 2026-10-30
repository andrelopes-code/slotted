import { durationLabel } from '@slotted/core/date';
import { createContext, useContext } from 'react';

import type {
  DateTimeRangePickerDefaults,
  DateTimeRangePickerDefaultsProviderProps,
} from './datetime-range-picker.types';

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const DATETIME_RANGE_PICKER_STEP = 900;
/** A whole day at a one-minute step: the finest whole-day list any surveyed implementation offers. */
export const DATETIME_RANGE_PICKER_MAX_OPTIONS = 1440;

/** "3 days 21 hr": the duration the band and the rows say, in the family's locale. */
export function dateTimeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

/** One month: two lists stand beside the grid, and two months beside two lists do not fit in 720 pixels. */
export const DATETIME_RANGE_PICKER_MONTHS = 1;

const FALLBACK: DateTimeRangePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  firstDayOfWeek: undefined,
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: dateTimeRangePickerLengthLabel,
  maxOptions: DATETIME_RANGE_PICKER_MAX_OPTIONS,
  months: DATETIME_RANGE_PICKER_MONTHS,
  placement: 'bottom-start',
  size: 'md',
  step: DATETIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  unavailableOptions: 'disable',
  variant: 'outline',
};

const DateTimeRangePickerDefaultsContext = createContext<DateTimeRangePickerDefaults>(FALLBACK);

/** What a time range picker renders as here, before it states anything of its own. */
export function useDateTimeRangePickerDefaults(): DateTimeRangePickerDefaults {
  return useContext(DateTimeRangePickerDefaultsContext);
}

/**
 * An application decides once what its times look like, what step its lists
 * offer and how a duration is written — rather than repeating the same props
 * on every picker in a form. A picker that states any of them itself still
 * wins. The locale and the words come from the language in force
 * (`SlottedProvider`).
 */
export function DateTimeRangePickerDefaultsProvider({
  children,
  ...defaults
}: DateTimeRangePickerDefaultsProviderProps) {
  const inherited = useDateTimeRangePickerDefaults();

  return (
    <DateTimeRangePickerDefaultsContext.Provider
      value={{
        calendar: defaults.calendar ?? inherited.calendar,
        closeOnSelect: defaults.closeOnSelect ?? inherited.closeOnSelect,
        firstDayOfWeek: defaults.firstDayOfWeek ?? inherited.firstDayOfWeek,
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        lengthLabel: defaults.lengthLabel ?? inherited.lengthLabel,
        maxOptions: defaults.maxOptions ?? inherited.maxOptions,
        months: defaults.months ?? inherited.months,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        step: defaults.step ?? inherited.step,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        unavailableOptions: defaults.unavailableOptions ?? inherited.unavailableOptions,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DateTimeRangePickerDefaultsContext.Provider>
  );
}
