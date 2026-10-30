import { Field, FieldControl, FieldDescription, FieldLabel } from '@slotted/react/field';

export default function FieldCustomControl() {
  return (
    <Field>
      <FieldLabel>Brand color</FieldLabel>
      <FieldControl type="color" defaultValue="#2f6fde" />
      <FieldDescription>Used on invoices and in the customer portal.</FieldDescription>
    </Field>
  );
}
