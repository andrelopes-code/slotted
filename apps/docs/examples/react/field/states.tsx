import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Card number</FieldLabel>
        <TextField inputMode="numeric" defaultValue="4242 4242 42" />
        <FieldError>Six digits are missing.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Account ID</FieldLabel>
        <TextField defaultValue="acct_9f2c41" />
        <FieldDescription>Quote this ID when you contact support.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Workspace URL</FieldLabel>
        <TextField defaultValue="northwind.slotted.app" />
        <FieldDescription>Only the workspace owner can change the URL.</FieldDescription>
      </Field>
    </Stack>
  );
}
