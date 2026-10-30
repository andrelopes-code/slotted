import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Pickup</FieldLabel>
        <DateTimePicker defaultValue={plainDateTime(plainDate(2026, 9, 29), plainTime(16, 0))} />
        <FieldError>The pickup is before the order was placed, September 30 at 9:00 AM.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Order placed</FieldLabel>
        <DateTimePicker defaultValue={plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0))} />
        <FieldDescription>Set when the order was placed.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Delivered</FieldLabel>
        <DateTimePicker />
        <FieldDescription>Filled in by the carrier on delivery.</FieldDescription>
      </Field>
    </Stack>
  );
}
