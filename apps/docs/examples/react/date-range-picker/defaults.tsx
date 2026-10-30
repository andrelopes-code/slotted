import { DateRangePicker, DateRangePickerDefaultsProvider } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerDefaults() {
  return (
    <DateRangePickerDefaultsProvider count="nights" months={1} variant="subtle">
      <Stack gap={4}>
        <Field>
          <FieldLabel>Lisbon hotel</FieldLabel>
          <DateRangePicker
            defaultValue={{ start: plainDate(2026, 11, 9), end: plainDate(2026, 11, 12) }}
          />
        </Field>
        <Field>
          <FieldLabel>Porto hotel</FieldLabel>
          <DateRangePicker
            defaultValue={{ start: plainDate(2026, 11, 12), end: plainDate(2026, 11, 14) }}
          />
        </Field>
      </Stack>
    </DateRangePickerDefaultsProvider>
  );
}
