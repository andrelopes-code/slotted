import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerBounds() {
  return (
    <Field>
      <FieldLabel>Delivery window</FieldLabel>
      <DatePicker
        defaultValue={plainDate(2026, 10, 15)}
        max={plainDate(2026, 10, 31)}
        min={plainDate(2026, 10, 1)}
      />
      <FieldDescription>Carriers book October 2026 only.</FieldDescription>
    </Field>
  );
}
