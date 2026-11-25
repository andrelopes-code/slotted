import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerFooter() {
  return (
    <Field>
      <FieldLabel>Stock count freeze</FieldLabel>
      <DateRangePicker
        confirm={false}
        defaultValue={{ start: plainDate(2026, 10, 30), end: plainDate(2026, 11, 1) }}
        footer="No shipments leave on these days"
      />
      <FieldDescription>The second press sets the freeze.</FieldDescription>
    </Field>
  );
}
