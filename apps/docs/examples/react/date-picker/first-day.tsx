import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerFirstDay() {
  return (
    <Field>
      <FieldLabel>Shift starts</FieldLabel>
      <DatePicker defaultValue={plainDate(2026, 9, 30)} firstDayOfWeek={1} locale="en-US" />
      <FieldDescription>Rosters run Monday to Sunday.</FieldDescription>
    </Field>
  );
}
