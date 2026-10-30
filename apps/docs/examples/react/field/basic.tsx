import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { TextField } from '@slotted/react/text-field';

export default function FieldBasic() {
  return (
    <Field required>
      <FieldLabel>Email</FieldLabel>
      <TextField type="email" autoComplete="email" />
      <FieldDescription>Invoices are sent to this address.</FieldDescription>
    </Field>
  );
}
