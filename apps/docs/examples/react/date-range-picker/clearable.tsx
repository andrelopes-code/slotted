import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerClearable() {
  return (
    <Field>
      <FieldLabel>Order date</FieldLabel>
      <DateRangePicker
        clearable
        defaultValue={{ start: plainDate(2026, 9, 14), end: plainDate(2026, 9, 27) }}
      />
      <FieldDescription>Clear the dates to list orders from any date.</FieldDescription>
    </Field>
  );
}
