import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

const QUARTER = { start: plainDate(2026, 7, 1), end: plainDate(2026, 9, 30) };

export default function DateRangePickerVariants() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Outline</FieldLabel>
        <DateRangePicker variant="outline" defaultValue={QUARTER} />
      </Field>
      <Field>
        <FieldLabel>Subtle</FieldLabel>
        <DateRangePicker variant="subtle" defaultValue={QUARTER} />
      </Field>
      <Field>
        <FieldLabel>Plain</FieldLabel>
        <DateRangePicker variant="plain" defaultValue={QUARTER} />
      </Field>
    </Stack>
  );
}
