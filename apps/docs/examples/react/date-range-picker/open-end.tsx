import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerOpenEnd() {
  return (
    <Field>
      <FieldLabel>Price valid</FieldLabel>
      <DateRangePicker clearable defaultValue={{ start: plainDate(2026, 10, 1), end: null }} />
      <FieldDescription>Leave the end empty for a price with no end date.</FieldDescription>
    </Field>
  );
}
