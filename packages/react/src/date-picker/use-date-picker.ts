import { todayIn } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { useEffect, useState } from 'react';

import { useCalendarDefaults } from '../calendar';
import { useField } from '../field';
import { useLocale } from '../i18n';
import { useDatePickerDefaults } from './date-picker-defaults';
import type { DatePickerDayProps } from './date-picker.types';

/** What an empty panel is anchored on before the browser has said what day it is. */
const SSR_TODAY: PlainDate = { year: 2026, month: 1, day: 1 };

type ConfigProps = Pick<
  DatePickerDayProps,
  | 'calendar'
  | 'confirm'
  | 'disabled'
  | 'locale'
  | 'placement'
  | 'readOnly'
  | 'required'
  | 'selectionMode'
  | 'size'
  | 'timeZone'
  | 'today'
  | 'variant'
>;

/** What a picker renders as: its own word, then the field's, then the application's. */
export function useDatePickerConfig(props: ConfigProps) {
  const field = useField();
  const defaults = useDatePickerDefaults();
  const appLocale = useLocale();
  const timeZone = props.timeZone ?? defaults.timeZone;
  const statedToday = useStatedToday(props.today, defaults.today);
  const disabled = props.disabled ?? field?.disabled;
  const readOnly = props.readOnly ?? field?.readOnly;
  const selectionMode = props.selectionMode ?? 'single';

  return {
    calendar: props.calendar ?? defaults.calendar,
    confirm: props.confirm ?? defaults.confirm ?? selectionMode !== 'single',
    disabled,
    editable: disabled !== true && readOnly !== true,
    fieldInvalid: field?.invalid,
    locale: props.locale ?? appLocale,
    placement: props.placement ?? defaults.placement,
    readOnly,
    required: props.required ?? field?.required,
    selectionMode,
    size: props.size ?? field?.size ?? defaults.size,
    statedToday,
    timeZone,
    today: useToday(timeZone, statedToday),
    variant: props.variant ?? defaults.variant,
  };
}

/** The day the application states: on the picker, on its provider, or on the calendars'. */
export function useStatedToday(
  own: PlainDate | undefined,
  provided: PlainDate | undefined,
): PlainDate | undefined {
  const calendar = useCalendarDefaults();

  return own ?? provided ?? calendar.today;
}

/** The day it is: the one stated, else the clock's, read once the browser can say it. */
export function useToday(timeZone: string | undefined, stated: PlainDate | undefined): PlainDate {
  const [today, setToday] = useState(SSR_TODAY);
  useEffect(() => setToday(todayIn(timeZone)), [timeZone]);

  return stated ?? today;
}
