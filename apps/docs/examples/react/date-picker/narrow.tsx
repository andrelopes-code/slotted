import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

const PRESETS = [
  { label: 'Pickup', value: plainDate(2026, 9, 28) },
  { label: 'Promised', value: plainDate(2026, 9, 30) },
];

export default function DatePickerNarrow() {
  return (
    <Field>
      <FieldLabel>Proof of delivery date</FieldLabel>
      <DatePicker presets={PRESETS} />
    </Field>
  );
}
