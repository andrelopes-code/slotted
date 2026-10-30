import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DatePickerVariants() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Invoice date</FieldLabel>
        <DatePicker variant="outline" defaultValue={plainDate(2026, 9, 30)} />
      </Field>
      <Field>
        <FieldLabel>Posting date</FieldLabel>
        <DatePicker variant="subtle" defaultValue={plainDate(2026, 9, 30)} />
      </Field>
      <Field>
        <FieldLabel>Value date</FieldLabel>
        <DatePicker variant="plain" defaultValue={plainDate(2026, 10, 1)} />
      </Field>
    </Stack>
  );
}
