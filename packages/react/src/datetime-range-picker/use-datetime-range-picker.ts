import { isSameDateTime, nowDateTimeIn } from '@slotted/core/date';
import type { PlainDateTime } from '@slotted/core/date';
import { datetimeRangePickerMessages, pickerPanelMessages } from '@slotted/core/i18n';
import { useEffect, useMemo, useState } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { useDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type { DateTimeRangePickerProps } from './datetime-range-picker.types';
import type { DateTimeRangeWords } from './datetime-range-words';

/** What an empty panel opens at before the browser has said what time it is. */
const SSR_REFERENCE: PlainDateTime = {
  date: { year: 2026, month: 1, day: 1 },
  time: { hour: 12, minute: 0, second: 0 },
};

/** What a picker renders as: its own word, then the field's, then the application's. */
export function useDateTimeRangePickerConfig(props: DateTimeRangePickerProps) {
  const field = useField();
  const defaults = useDateTimeRangePickerDefaults();
  const appLocale = useLocale();
  const timeZone = props.timeZone ?? defaults.timeZone;
  const now = useMomentNow(props.referenceDateTime, timeZone);
  const disabled = props.disabled ?? field?.disabled;
  const readOnly = props.readOnly ?? field?.readOnly;

  return {
    calendar: props.calendar ?? defaults.calendar,
    confirm: props.confirm ?? defaults.confirm,
    disabled,
    editable: disabled !== true && readOnly !== true,
    fieldInvalid: field?.invalid,
    firstDayOfWeek: props.firstDayOfWeek ?? defaults.firstDayOfWeek,
    granularity: props.granularity ?? defaults.granularity,
    hourCycle: props.hourCycle ?? defaults.hourCycle,
    lengthLabel: props.lengthLabel ?? defaults.lengthLabel,
    locale: props.locale ?? appLocale,
    months: props.months ?? defaults.months,
    now,
    placement: props.placement ?? defaults.placement,
    readOnly,
    required: props.required ?? field?.required,
    size: props.size ?? field?.size ?? defaults.size,
    step: props.step ?? defaults.step,
    timeZone,
    variant: props.variant ?? defaults.variant,
  };
}

/** The rules of a run, and the words it is written in. */
export function useDateTimeRangeWords(
  props: DateTimeRangePickerProps,
  config: ReturnType<typeof useDateTimeRangePickerConfig>,
): DateTimeRangeWords {
  const t = useMessages(datetimeRangePickerMessages, props.messages);
  const words = useMessages(pickerPanelMessages);
  const { granularity, hourCycle, lengthLabel, locale, now, step, timeZone } = config;
  const { contiguous = true, isDateUnavailable, isTimeUnavailable, max, maxLength } = props;
  const { maxTime, min, minLength, minTime, options } = props;

  const rules = useMemo(
    () => ({
      contiguous,
      max,
      maxLength,
      maxTime,
      min,
      minLength,
      minTime,
      options,
      step,
      unavailableDay: isDateUnavailable,
      unavailableTime: isTimeUnavailable,
    }),
    [
      contiguous,
      isDateUnavailable,
      isTimeUnavailable,
      max,
      maxLength,
      maxTime,
      min,
      minLength,
      minTime,
      options,
      step,
    ],
  );

  return {
    granularity,
    hourCycle,
    lengthLabel,
    locale,
    rules,
    t,
    timeZone,
    today: now.date,
    words,
  };
}

/** The moment it is, read once the browser can say it. */
function useMomentNow(
  reference: PlainDateTime | undefined,
  timeZone: string | undefined,
): PlainDateTime {
  const [clock, setClock] = useState(SSR_REFERENCE);
  useEffect(() => {
    const { date, time } = nowDateTimeIn(timeZone);
    const read = { date, time: { ...time, second: 0 } };
    setClock((previous) => (isSameDateTime(previous, read) ? previous : read));
  }, [timeZone]);

  return reference ?? clock;
}
