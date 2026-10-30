import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerMonths() {
  return (
    <Field>
      <FieldLabel>Promotion window</FieldLabel>
      <DateRangePicker
        defaultValue={{ start: plainDate(2026, 10, 5), end: plainDate(2026, 10, 18) }}
        months={1}
      />
      <FieldDescription>Promotions run inside one month.</FieldDescription>
    </Field>
  );
}
