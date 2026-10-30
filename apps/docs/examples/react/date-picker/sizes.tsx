import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DatePickerSizes() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Shipped after</FieldLabel>
        <DatePicker size="sm" defaultValue={plainDate(2026, 9, 1)} />
      </Field>
      <Field>
        <FieldLabel>Ship date</FieldLabel>
        <DatePicker size="md" defaultValue={plainDate(2026, 9, 30)} />
      </Field>
      <Field>
        <FieldLabel>Move-in date</FieldLabel>
        <DatePicker size="lg" defaultValue={plainDate(2026, 11, 2)} />
      </Field>
    </Stack>
  );
}
