import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldBasic() {
  return (
    <Field required>
      <FieldLabel>Company name</FieldLabel>
      <TextField autoComplete="organization" clearable defaultValue="Northwind Traders" />
      <FieldDescription>Printed on every invoice and packing slip.</FieldDescription>
    </Field>
  );
}
