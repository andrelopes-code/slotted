import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const DEPARTURE = plainDateTime(plainDate(2026, 9, 30), plainTime(18, 45));

export default function DateTimePickerHourCycle() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Departure, 12-hour clock</FieldLabel>
        <DateTimePicker defaultValue={DEPARTURE} hourCycle={12} />
      </Field>
      <Field>
        <FieldLabel>Departure, 24-hour clock</FieldLabel>
        <DateTimePicker defaultValue={DEPARTURE} hourCycle={24} />
      </Field>
    </Stack>
  );
}
