import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { compareDate, plainDate, type PlainDate } from '@slotted/core/date';

const BOOKED_FROM = plainDate(2026, 10, 14);
const BOOKED_TO = plainDate(2026, 10, 16);

const isBooked = (date: PlainDate) =>
  compareDate(date, BOOKED_FROM) >= 0 && compareDate(date, BOOKED_TO) <= 0;

export default function DateRangePickerUnavailable() {
  return (
    <Field>
      <FieldLabel>Training room</FieldLabel>
      <DateRangePicker isDateUnavailable={isBooked} />
      <FieldDescription>
        Booked October 14 to 16. A booking cannot run across those days.
      </FieldDescription>
    </Field>
  );
}
