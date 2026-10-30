import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

export default function DatePickerBasic() {
  return (
    <Field>
      <FieldLabel>Requested delivery date</FieldLabel>
      <DatePicker name="deliveryDate" />
      <FieldDescription>Type the date or choose it from the calendar.</FieldDescription>
    </Field>
  );
}
