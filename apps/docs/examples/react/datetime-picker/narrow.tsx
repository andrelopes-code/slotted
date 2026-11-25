import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

export default function DateTimePickerNarrow() {
  return (
    <Field>
      <FieldLabel>Delivery appointment</FieldLabel>
      <DateTimePicker
        presets={[
          { label: 'End of today', value: plainDateTime(TODAY, plainTime(17, 0)) },
          { label: 'Tomorrow early', value: plainDateTime(addDays(TODAY, 1), plainTime(9, 0)) },
        ]}
        referenceDateTime={plainDateTime(TODAY, plainTime(9, 0))}
        step={1800}
      />
    </Field>
  );
}
