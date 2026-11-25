import { firstDayOf, isPlainDate, lastDayOf, presetValue, yearMonthOf } from '@slotted/core/date';
import type { PlainYearMonth } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

import type { DatePickerDayProps, DatePickerMonthProps } from './date-picker.types';

/** The props of the picker underneath: a date, at one granularity or the other. */
export type DatePickerBaseProps = Omit<DatePickerDayProps, 'granularity'> & {
  granularity?: 'day' | 'month' | undefined;
};

/**
 * The month picker, as the day picker over the first day of each month. The
 * bounds become the first day of `min` and the last day of `max`, so a month
 * the bounds touch is a month the reader may choose.
 */
export function dayPropsOf(props: DatePickerMonthProps): DatePickerBaseProps {
  const { defaultValue, max, min, onValueChange, presets, value, ...rest } = props;

  return {
    ...rest,
    ...(value === undefined ? {} : { value: toDate(value) }),
    ...(defaultValue === undefined ? {} : { defaultValue: toDate(defaultValue) }),
    ...(min === undefined ? {} : { min: firstDayOf(min) }),
    ...(max === undefined ? {} : { max: lastDayOf(max) }),
    ...(presets === undefined
      ? {}
      : {
          presets: presets.map((preset) => ({
            label: preset.label,
            value: () => firstDayOf(presetValue(preset)),
          })),
        }),
    onValueChange: (next, request) => {
      if (onValueChange === undefined) return;

      /* The request keeps its own `cancel` and `cancelled`, which are what the
         picker reads back, and carries the months instead of the days. */
      const asked = Object.create(request, {
        previous: { enumerable: true, value: toMonth(request.previous) },
        value: { enumerable: true, value: toMonth(next) },
      }) as ChangeRequest<PlainYearMonth | null>;
      onValueChange(asked.value, asked);
    },
  };
}

function toDate(month: PlainYearMonth | null) {
  return month === null ? null : firstDayOf(month);
}

function toMonth(value: unknown): PlainYearMonth | null {
  return isPlainDate(value) ? yearMonthOf(value) : null;
}
