import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerFooter() {
  return (
    <Field>
      <FieldLabel>Stock count date</FieldLabel>
      <DatePicker
        confirm
        defaultValue={plainDate(2026, 10, 3)}
        footer="The warehouse closes at noon"
      />
      <FieldDescription>The date changes when you press Apply.</FieldDescription>
    </Field>
  );
}
