import { isSameTime, nowIn } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { clockMessages, pickerPanelMessages, timeRangePickerMessages } from '@slotted/core/i18n';
import { useEffect, useMemo, useState } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { useTimeRangePickerDefaults } from './time-range-picker-defaults';
import type { TimeRangePickerProps } from './time-range-picker.types';
import type { TimeRangeWords } from './time-range-words';

/** What an empty panel opens at before the browser has said what time it is. */
const SSR_REFERENCE: PlainTime = { hour: 12, minute: 0, second: 0 };

/** What a picker renders as: its own word, then the field's, then the application's. */
export function useTimeRangePickerConfig(props: TimeRangePickerProps) {
  const field = useField();
  const defaults = useTimeRangePickerDefaults();
  const appLocale = useLocale();
  const timeZone = props.timeZone ?? defaults.timeZone;
  const now = useClockNow(props.referenceTime, timeZone);
  const disabled = props.disabled ?? field?.disabled;
  const readOnly = props.readOnly ?? field?.readOnly;

  return {
    confirm: props.confirm ?? defaults.confirm,
    disabled,
    editable: disabled !== true && readOnly !== true,
    fieldInvalid: field?.invalid,
    granularity: props.granularity ?? defaults.granularity,
    hourCycle: props.hourCycle ?? defaults.hourCycle,
    lengthLabel: props.lengthLabel ?? defaults.lengthLabel,
    locale: props.locale ?? appLocale,
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
export function useTimeRangeWords(
  props: TimeRangePickerProps,
  config: ReturnType<typeof useTimeRangePickerConfig>,
): TimeRangeWords {
  const t = useMessages(timeRangePickerMessages, props.messages);
  const clock = useMessages(clockMessages);
  const words = useMessages(pickerPanelMessages);
  const { granularity, hourCycle, lengthLabel, locale, step } = config;
  const { contiguous = true, isTimeUnavailable, max, maxLength, min, minLength, options } = props;

  const rules = useMemo(
    () => ({
      contiguous,
      max,
      maxLength,
      min,
      minLength,
      options,
      step,
      unavailable: isTimeUnavailable,
    }),
    [contiguous, isTimeUnavailable, max, maxLength, min, minLength, options, step],
  );

  return { clock, granularity, hourCycle, lengthLabel, locale, rules, t, words };
}

/** The time it is, read once the browser can say it. */
function useClockNow(reference: PlainTime | undefined, timeZone: string | undefined): PlainTime {
  const [clock, setClock] = useState(SSR_REFERENCE);
  useEffect(() => {
    const read = nowIn(timeZone);
    setClock((previous) => (isSameTime(previous, read) ? previous : read));
  }, [timeZone]);

  return reference ?? { ...clock, second: 0 };
}
