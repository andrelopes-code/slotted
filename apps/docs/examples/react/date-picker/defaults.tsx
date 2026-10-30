import { DatePicker, DatePickerDefaultsProvider } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DatePickerDefaults() {
  return (
    <DatePickerDefaultsProvider size="sm" variant="subtle" placement="bottom-end">
      <Stack gap={4}>
        <Field>
          <FieldLabel>Posted after</FieldLabel>
          <DatePicker defaultValue={plainDate(2026, 9, 1)} />
        </Field>
        <Field>
          <FieldLabel>Due before</FieldLabel>
          <DatePicker defaultValue={plainDate(2026, 10, 31)} />
        </Field>
      </Stack>
    </DatePickerDefaultsProvider>
  );
}
