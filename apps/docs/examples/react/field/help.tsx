import { Field, FieldHeader, FieldHelp, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldHelpExample() {
  return (
    <Stack gap={5}>
      <Field required>
        <FieldHeader>
          <FieldLabel>Cost centre</FieldLabel>
          <FieldHelp>
            The four-digit code finance assigns to your team. It appears on every invoice line.
          </FieldHelp>
        </FieldHeader>
        <TextField inputMode="numeric" defaultValue="4120" />
      </Field>
      <Field disabled>
        <FieldHeader>
          <FieldLabel>Billing currency</FieldLabel>
          <FieldHelp>Set when the workspace was created. Contact support to change it.</FieldHelp>
        </FieldHeader>
        <TextField defaultValue="USD — US dollar" />
      </Field>
    </Stack>
  );
}
