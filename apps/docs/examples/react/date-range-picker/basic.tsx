import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

export default function DateRangePickerBasic() {
  return (
    <Field>
      <FieldLabel>Reporting period</FieldLabel>
      <DateRangePicker endName="periodEnd" startName="periodStart" />
      <FieldDescription>Type both dates or choose them from the calendar.</FieldDescription>
    </Field>
  );
}
