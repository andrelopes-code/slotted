import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DatePickerStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Delivery date</FieldLabel>
        <DatePicker defaultValue={plainDate(2026, 9, 28)} />
        <FieldError>The delivery date is before the order date, September 30, 2026.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Order date</FieldLabel>
        <DatePicker defaultValue={plainDate(2026, 9, 30)} />
        <FieldDescription>Set when the order was placed.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Return by</FieldLabel>
        <DatePicker defaultValue={plainDate(2026, 10, 30)} />
        <FieldDescription>Returns open once the order is delivered.</FieldDescription>
      </Field>
    </Stack>
  );
}
