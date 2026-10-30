import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

export default function DateRangePickerLimits() {
  return (
    <Field>
      <FieldLabel>Forklift rental</FieldLabel>
      <DateRangePicker maxLength={14} minLength={2} />
      <FieldDescription>Rentals run from 2 to 14 days.</FieldDescription>
    </Field>
  );
}
