import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldCount() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Email subject</FieldLabel>
        <TextField defaultValue="Your order SO-2026-00418 has shipped" maxLength={60} showCount />
      </Field>
      <Field>
        <FieldLabel>SMS sender name</FieldLabel>
        <TextField countMax={11} defaultValue="Northwind" showCount />
        <FieldDescription>Carriers cut sender names after 11 characters.</FieldDescription>
      </Field>
    </Stack>
  );
}
