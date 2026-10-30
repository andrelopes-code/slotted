import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const DEPARTURES = [
  plainTime(5, 40),
  plainTime(8, 15),
  plainTime(11, 50),
  plainTime(16, 5),
  plainTime(21, 30),
];

export default function DateTimePickerOptions() {
  return (
    <Field>
      <FieldLabel>Line-haul departure</FieldLabel>
      <DateTimePicker
        options={DEPARTURES}
        referenceDateTime={plainDateTime(plainDate(2026, 9, 30), plainTime(8, 15))}
      />
      <FieldDescription>The Chicago to Memphis trailer leaves five times a day.</FieldDescription>
    </Field>
  );
}
