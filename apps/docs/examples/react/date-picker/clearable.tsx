import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerClearable() {
  return (
    <Field>
      <FieldLabel>Hold shipment until</FieldLabel>
      <DatePicker clearable defaultValue={plainDate(2026, 10, 9)} />
      <FieldDescription>Clear the date to release the shipment.</FieldDescription>
    </Field>
  );
}
