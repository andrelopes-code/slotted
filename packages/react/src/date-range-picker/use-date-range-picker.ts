import { useMemo } from 'react';
import { rangeProblems } from '@slotted/core/date';

import { useStatedToday, useToday } from '../date-picker/use-date-picker';
import { useField } from '../field';
import { useLocale } from '../i18n';
import { useDateRangePickerDefaults } from './date-range-picker-defaults';
import type { DateRange, DateRangePickerProps } from './date-range-picker.types';

/** What a picker renders as: its own word, then the field's, then the application's. */
export function useDateRangePickerConfig(props: DateRangePickerProps) {
  const field = useField();
  const defaults = useDateRangePickerDefaults();
  const appLocale = useLocale();
  const timeZone = props.timeZone ?? defaults.timeZone;
  const statedToday = useStatedToday(props.today, defaults.today);
  const disabled = props.disabled ?? field?.disabled;
  const readOnly = props.readOnly ?? field?.readOnly;

  return {
    calendar: props.calendar ?? defaults.calendar,
    confirm: props.confirm ?? defaults.confirm,
    count: props.count ?? defaults.count,
    disabled,
    editable: disabled !== true && readOnly !== true,
    fieldInvalid: field?.invalid,
    locale: props.locale ?? appLocale,
    months: props.months ?? defaults.months,
    placement: props.placement ?? defaults.placement,
    readOnly,
    required: props.required ?? field?.required,
    size: props.size ?? field?.size ?? defaults.size,
    statedToday,
    timeZone,
    today: useToday(timeZone, statedToday),
    variant: props.variant ?? defaults.variant,
  };
}

/** The rules of a run, held still while none of them moves. */
export function useRangeRules(props: DateRangePickerProps, count: 'days' | 'nights') {
  const { contiguous = true, isDateUnavailable, max, maxLength, min, minLength } = props;

  return useMemo(
    () => ({ contiguous, count, max, maxLength, min, minLength, unavailable: isDateUnavailable }),
    [contiguous, count, isDateUnavailable, max, maxLength, min, minLength],
  );
}

/** What a held run fails, read by the frame and by the field of the end. */
export function useRangeProblems(held: DateRange | null, rules: ReturnType<typeof useRangeRules>) {
  return useMemo(() => rangeProblems(held, rules), [held, rules]);
}
