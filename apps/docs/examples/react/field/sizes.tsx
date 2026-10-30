import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldSizes() {
  return (
    <Stack gap={5}>
      <Field size="sm">
        <FieldLabel>SKU</FieldLabel>
        <TextField defaultValue="NW-CHAI-24" />
      </Field>
      <Field size="md">
        <FieldLabel>Product name</FieldLabel>
        <TextField defaultValue="Chai tea, 24 bags" />
      </Field>
      <Field size="lg">
        <FieldLabel>Shelf label</FieldLabel>
        <TextField defaultValue="Chai — spiced black tea" />
      </Field>
    </Stack>
  );
}
