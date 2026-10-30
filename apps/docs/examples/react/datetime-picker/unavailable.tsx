import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  dayOfWeek,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDate,
  type PlainTime,
} from '@slotted/core/date';

const isWeekend = (date: PlainDate) => dayOfWeek(date) === 0 || dayOfWeek(date) === 6;
const isLunch = (time: PlainTime) => time.hour === 12;

export default function DateTimePickerUnavailable() {
  return (
    <Field>
      <FieldLabel>Warehouse inspection</FieldLabel>
      <DateTimePicker
        isDateUnavailable={isWeekend}
        isTimeUnavailable={isLunch}
        maxTime={plainTime(17, 0)}
        minTime={plainTime(8, 0)}
        referenceDateTime={plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0))}
        step={1800}
      />
      <FieldDescription>
        Weekdays from 8:00 AM to 5:00 PM, closed for lunch at noon.
      </FieldDescription>
    </Field>
  );
}
