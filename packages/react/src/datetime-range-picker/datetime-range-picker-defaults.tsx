import { durationLabel } from '@slotted/core/date';
import { createContext, useContext } from 'react';

import type {
  DateTimeRangePickerDefaults,
  DateTimeRangePickerDefaultsProviderProps,
} from './datetime-range-picker.types';

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const DATETIME_RANGE_PICKER_STEP = 900;

/** "3 days 21 hr": the duration the head says, in the family's locale. */
export function dateTimeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

/** Two months: a run of moments crosses from one to the next more often than not. */
export const DATETIME_RANGE_PICKER_MONTHS = 2;

const FALLBACK: DateTimeRangePickerDefaults = {
  calendar: 'gregory',
  confirm: true,
  firstDayOfWeek: undefined,
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: dateTimeRangePickerLengthLabel,
  months: DATETIME_RANGE_PICKER_MONTHS,
  placement: 'bottom-start',
  size: 'md',
  step: DATETIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  variant: 'outline',
};

const DateTimeRangePickerDefaultsContext = createContext<DateTimeRangePickerDefaults>(FALLBACK);

/** What a datetime range picker renders as here, before it states anything of its own. */
export function useDateTimeRangePickerDefaults(): DateTimeRangePickerDefaults {
  return useContext(DateTimeRangePickerDefaultsContext);
}

/**
 * An application decides once what its times look like, what step its clocks
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
        confirm: defaults.confirm ?? inherited.confirm,
        firstDayOfWeek: defaults.firstDayOfWeek ?? inherited.firstDayOfWeek,
        granularity: defaults.granularity ?? inherited.granularity,
        hourCycle: defaults.hourCycle ?? inherited.hourCycle,
        lengthLabel: defaults.lengthLabel ?? inherited.lengthLabel,
        months: defaults.months ?? inherited.months,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        step: defaults.step ?? inherited.step,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DateTimeRangePickerDefaultsContext.Provider>
  );
}
