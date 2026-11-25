import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerFooter() {
  return (
    <Field>
      <FieldLabel>Maintenance window starts</FieldLabel>
      <DateTimePicker
        confirm={false}
        defaultValue={plainDateTime(plainDate(2026, 10, 3), plainTime(22, 0))}
        footer="Four hours from this time"
        step={3600}
      />
      <FieldDescription>Conveyors stop for four hours from this time.</FieldDescription>
    </Field>
  );
}
