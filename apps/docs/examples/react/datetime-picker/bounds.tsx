import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerBounds() {
  return (
    <Field>
      <FieldLabel>Container collection</FieldLabel>
      <DateTimePicker
        defaultValue={plainDateTime(plainDate(2026, 10, 1), plainTime(13, 0))}
        max={plainDateTime(plainDate(2026, 10, 9), plainTime(12, 0))}
        maxTime={plainTime(17, 0)}
        min={plainDateTime(plainDate(2026, 10, 1), plainTime(13, 0))}
        minTime={plainTime(8, 0)}
        step={3600}
      />
      <FieldDescription>
        From October 1 at 1:00 PM to October 9 at 12:00 PM, between 8:00 AM and 5:00 PM.
      </FieldDescription>
    </Field>
  );
}
