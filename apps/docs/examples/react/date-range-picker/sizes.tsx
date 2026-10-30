import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerSizes() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Created between</FieldLabel>
        <DateRangePicker
          size="sm"
          defaultValue={{ start: plainDate(2026, 9, 1), end: plainDate(2026, 9, 30) }}
        />
      </Field>
      <Field>
        <FieldLabel>Billing period</FieldLabel>
        <DateRangePicker
          size="md"
          defaultValue={{ start: plainDate(2026, 10, 1), end: plainDate(2026, 10, 31) }}
        />
      </Field>
      <Field>
        <FieldLabel>Lease term</FieldLabel>
        <DateRangePicker
          size="lg"
          defaultValue={{ start: plainDate(2026, 11, 1), end: plainDate(2027, 10, 31) }}
        />
      </Field>
    </Stack>
  );
}
