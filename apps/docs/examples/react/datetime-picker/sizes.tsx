import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerSizes() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Created after</FieldLabel>
        <DateTimePicker
          defaultValue={plainDateTime(plainDate(2026, 9, 1), plainTime(0, 0))}
          size="sm"
        />
      </Field>
      <Field>
        <FieldLabel>Pickup</FieldLabel>
        <DateTimePicker
          defaultValue={plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0))}
          size="md"
        />
      </Field>
      <Field>
        <FieldLabel>Store opening</FieldLabel>
        <DateTimePicker
          defaultValue={plainDateTime(plainDate(2026, 11, 2), plainTime(10, 0))}
          size="lg"
        />
      </Field>
    </Stack>
  );
}
