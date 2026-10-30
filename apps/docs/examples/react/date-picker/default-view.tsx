import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerDefaultView() {
  return (
    <Field>
      <FieldLabel>Date of incorporation</FieldLabel>
      <DatePicker defaultView="year" max={plainDate(2026, 9, 30)} />
      <FieldDescription>As printed on the certificate of incorporation.</FieldDescription>
    </Field>
  );
}
