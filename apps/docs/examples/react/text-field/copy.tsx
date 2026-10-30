import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldCopy() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Invite link</FieldLabel>
        <TextField copyable defaultValue="https://northwind.slotted.app/join/8f3a2c" readOnly />
        <FieldDescription>Anyone with the link joins as a viewer.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Webhook signing secret</FieldLabel>
        <TextField copyable defaultValue="whsec_4f9c2a7e1b8d6350" mono readOnly />
      </Field>
    </Stack>
  );
}
