import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@slotted/react/select';

export default function SelectEmpty() {
  return (
    <Field>
      <FieldLabel>Purchase order to receive</FieldLabel>
      <Select messages={{ empty: 'No open purchase orders for Kiln & Co.' }}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a purchase order" />
        </SelectTrigger>
        <SelectContent />
      </Select>
      <FieldDescription>Only orders awaiting receipt are listed.</FieldDescription>
    </Field>
  );
}
