import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DatePickerPlacement() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Opens above, from the start edge</FieldLabel>
        <DatePicker defaultValue={plainDate(2026, 9, 30)} placement="top-start" />
      </Field>
      <Field>
        <FieldLabel>Opens below, from the end edge</FieldLabel>
        <DatePicker defaultValue={plainDate(2026, 9, 30)} placement="bottom-end" />
      </Field>
    </Stack>
  );
}
