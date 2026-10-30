import { Field, FieldDefaultsProvider, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldDefaults() {
  return (
    <FieldDefaultsProvider size="sm" labelPlacement="side" necessity="optional">
      <Stack gap={3}>
        <Field required>
          <FieldLabel>Warehouse</FieldLabel>
          <TextField defaultValue="Seattle — Pier 91" />
        </Field>
        <Field required>
          <FieldLabel>Bin location</FieldLabel>
          <TextField defaultValue="A-14-03" />
        </Field>
        <Field>
          <FieldLabel>Picking note</FieldLabel>
          <TextField />
        </Field>
      </Stack>
    </FieldDefaultsProvider>
  );
}
