import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { dayOfWeek, plainDate, toISODate, type PlainDate } from '@slotted/core/date';

/** Columbus Day, Veterans Day, Thanksgiving and Christmas Day, 2026. */
const HOLIDAYS = new Set(['2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);

const isClosed = (date: PlainDate) =>
  dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || HOLIDAYS.has(toISODate(date));

export default function DatePickerUnavailable() {
  return (
    <Field>
      <FieldLabel>Pickup date</FieldLabel>
      <DatePicker defaultValue={plainDate(2026, 10, 13)} isDateUnavailable={isClosed} />
      <FieldDescription>The Reno dock is closed on weekends and federal holidays.</FieldDescription>
    </Field>
  );
}
