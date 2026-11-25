import { isSameTime, isTimeInRange, nowIn } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { useEffect, useState } from 'react';

import { useField } from '../field';
import { useLocale } from '../i18n';
import { useTimePickerDefaults } from './time-picker-defaults';
import type { TimePickerProps } from './time-picker.types';

/** What an empty panel steps from before the browser has said what time it is. */
const SSR_REFERENCE: PlainTime = { hour: 12, minute: 0, second: 0 };

/** What a picker renders as: its own word, then the field's, then the application's. */
export function useTimePickerConfig(props: TimePickerProps) {
  const field = useField();
  const defaults = useTimePickerDefaults();
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

/**
 * Validity the family owns, beside the validity the consumer states. A time
 * outside the bounds or refused by the predicate is invalid whatever the field
 * around it says, because this control is the only thing that knows.
 */
export function isRefusedTime(
  time: PlainTime | null,
  { isTimeUnavailable, max, min }: Pick<TimePickerProps, 'isTimeUnavailable' | 'max' | 'min'>,
): boolean {
  return time !== null && (!isTimeInRange(time, min, max) || isTimeUnavailable?.(time) === true);
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
