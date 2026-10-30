import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldNecessity() {
  return (
    <Stack gap={5}>
      <Field required>
        <FieldLabel>Company name</FieldLabel>
        <TextField />
      </Field>
      <Field necessity="optional">
        <FieldLabel>Purchase order</FieldLabel>
        <TextField />
      </Field>
      <Field necessity="words" required>
        <FieldLabel>Tax ID</FieldLabel>
        <TextField />
      </Field>
    </Stack>
  );
}
