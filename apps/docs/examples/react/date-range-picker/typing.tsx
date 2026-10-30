import { useState } from 'react';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker, type DateRangePickerValueReason } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { toISODate, type PlainDate } from '@slotted/core/date';

const HOW: Record<DateRangePickerValueReason, string> = {
  blur: 'completed when the field lost focus',
  clear: 'cleared',
  keyboard: 'typed',
  pointer: 'pressed',
  programmatic: 'set from code',
  select: 'chosen in the calendar',
};
const iso = (date: PlainDate | null) => (date === null ? 'open' : toISODate(date));

export default function DateRangePickerTyping() {
  const [period, setPeriod] = useState<DateRange | null>(null);
  const [last, setLast] = useState('Type both dates, or choose two days in the calendar.');

  return (
    <Field>
      <FieldLabel>Audit window</FieldLabel>
      <DateRangePicker
        onValueChange={(value, request) => {
          setPeriod(value);
          setLast(
            value === null
              ? `No dates, ${HOW[request.reason as DateRangePickerValueReason]}.`
              : `${iso(value.start)} to ${iso(value.end)}, ${HOW[request.reason as DateRangePickerValueReason]}.`,
          );
        }}
        value={period}
      />
      <FieldDescription>{last}</FieldDescription>
    </Field>
  );
}
