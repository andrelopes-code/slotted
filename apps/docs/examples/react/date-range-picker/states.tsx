import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Campaign dates</FieldLabel>
        <DateRangePicker
          defaultValue={{ start: plainDate(2026, 10, 12), end: plainDate(2026, 10, 5) }}
        />
        <FieldError>The end date is before the start date.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Fiscal quarter</FieldLabel>
        <DateRangePicker
          defaultValue={{ start: plainDate(2026, 7, 1), end: plainDate(2026, 9, 30) }}
        />
        <FieldDescription>Set by finance when the quarter opens.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Price freeze</FieldLabel>
        <DateRangePicker
          defaultValue={{ start: plainDate(2026, 11, 23), end: plainDate(2026, 12, 31) }}
        />
        <FieldDescription>Unlocks once the pricing review is approved.</FieldDescription>
      </Field>
    </Stack>
  );
}
