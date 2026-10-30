import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { dayOfWeek, toISODate, type PlainDate } from '@slotted/core/date';

const HOLIDAYS = new Set(['2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);

const isNonWorkingDay = (date: PlainDate) =>
  dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || HOLIDAYS.has(toISODate(date));

export default function DateRangePickerAcrossUnavailable() {
  return (
    <Field>
      <FieldLabel>Vacation</FieldLabel>
      <DateRangePicker contiguous={false} isDateUnavailable={isNonWorkingDay} />
      <FieldDescription>
        Start and end on a working day. Weekends and holidays inside the vacation are fine.
      </FieldDescription>
    </Field>
  );
}
