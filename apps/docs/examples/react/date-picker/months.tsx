import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerMonths() {
  return (
    <Field>
      <FieldLabel>Installation appointment</FieldLabel>
      <DatePicker defaultValue={plainDate(2026, 10, 20)} months={2} />
      <FieldDescription>Technicians book up to eight weeks ahead.</FieldDescription>
    </Field>
  );
}
