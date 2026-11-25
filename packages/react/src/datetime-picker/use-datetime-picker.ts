import { isSameDateTime, nowDateTimeIn } from '@slotted/core/date';
import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import { useEffect, useState } from 'react';

import { useStatedToday } from '../date-picker/use-date-picker';
import { useField } from '../field';
import { useLocale } from '../i18n';
import { useDateTimePickerDefaults } from './datetime-picker-defaults';
import type { DateTimePickerProps } from './datetime-picker.types';

/** What an empty panel steps from before the browser has said what time it is. */
const SSR_REFERENCE: PlainDateTime = {
  date: { year: 2026, month: 1, day: 1 },
  time: { hour: 12, minute: 0, second: 0 },
};

/** What a picker renders as: its own word, then the field's, then the application's. */
export function useDateTimePickerConfig(props: DateTimePickerProps) {
  const field = useField();
  const defaults = useDateTimePickerDefaults();
  const appLocale = useLocale();
  const timeZone = props.timeZone ?? defaults.timeZone;
  const statedToday = useStatedToday(props.today, defaults.today);
  const now = useMomentNow(props.referenceDateTime, timeZone, statedToday);
  const disabled = props.disabled ?? field?.disabled;
  const readOnly = props.readOnly ?? field?.readOnly;

  return {
    calendar: props.calendar ?? defaults.calendar,
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
    statedToday,
    timeZone,
    variant: props.variant ?? defaults.variant,
  };
}

/** The moment it is, read once the browser can say it, on the day the application states. */
function useMomentNow(
  reference: PlainDateTime | undefined,
  timeZone: string | undefined,
  today: PlainDate | undefined,
): PlainDateTime {
  const [clock, setClock] = useState(SSR_REFERENCE);
  useEffect(() => {
    const { date, time } = nowDateTimeIn(timeZone);
    const read = { date, time: { ...time, second: 0 } };
    setClock((previous) => (isSameDateTime(previous, read) ? previous : read));
  }, [timeZone]);

  const now = reference ?? clock;

  return today === undefined ? now : { ...now, date: today };
}
