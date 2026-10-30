import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const PICKUP = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));

export default function DateTimePickerVariants() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Pickup</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} variant="outline" />
      </Field>
      <Field>
        <FieldLabel>Loading starts</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} variant="subtle" />
      </Field>
      <Field>
        <FieldLabel>Gate opens</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} variant="plain" />
      </Field>
    </Stack>
  );
}
