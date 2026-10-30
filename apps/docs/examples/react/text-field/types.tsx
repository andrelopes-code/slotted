import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldTypes() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Work email</FieldLabel>
        <TextField autoComplete="email" placeholder="name@northwind.com" type="email" />
      </Field>
      <Field>
        <FieldLabel>Phone</FieldLabel>
        <TextField autoComplete="tel" placeholder="+1 206 555 0134" type="tel" />
      </Field>
      <Field>
        <FieldLabel>Website</FieldLabel>
        <TextField autoComplete="url" placeholder="https://northwind.com" type="url" />
      </Field>
      <Field>
        <FieldLabel>ZIP code</FieldLabel>
        <TextField autoComplete="postal-code" inputMode="numeric" placeholder="98101" />
      </Field>
    </Stack>
  );
}
