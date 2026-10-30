import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const FIRST_PICKUP = plainDateTime(plainDate(2026, 9, 30), plainTime(9, 0));

export default function DateTimePickerBasic() {
  return (
    <Field>
      <FieldLabel>Pickup date and time</FieldLabel>
      <DateTimePicker name="pickupAt" referenceDateTime={FIRST_PICKUP} />
      <FieldDescription>
        Type the date and time, or choose them from the calendar and the list.
      </FieldDescription>
    </Field>
  );
}
