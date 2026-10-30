import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerStep() {
  return (
    <Field>
      <FieldLabel>Dock appointment</FieldLabel>
      <DateTimePicker
        maxTime={plainTime(16, 45)}
        minTime={plainTime(7, 15)}
        referenceDateTime={plainDateTime(plainDate(2026, 9, 30), plainTime(7, 15))}
        step={1800}
      />
      <FieldDescription>Appointments start every 30 minutes from 7:15 AM.</FieldDescription>
    </Field>
  );
}
