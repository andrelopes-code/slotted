import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerClearable() {
  return (
    <Field>
      <FieldLabel>Hold shipment until</FieldLabel>
      <DateTimePicker
        clearable
        defaultValue={plainDateTime(plainDate(2026, 10, 9), plainTime(17, 0))}
      />
      <FieldDescription>Clear the date and time to release the shipment.</FieldDescription>
    </Field>
  );
}
