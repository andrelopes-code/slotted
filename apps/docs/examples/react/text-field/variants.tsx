import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldVariants() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Customer</FieldLabel>
        <TextField defaultValue="Northwind Traders" variant="outline" />
      </Field>
      <Field>
        <FieldLabel>Purchase order</FieldLabel>
        <TextField defaultValue="PO-2026-0412" variant="subtle" />
      </Field>
      <Field>
        <FieldLabel>SKU</FieldLabel>
        <TextField defaultValue="NW-TEA-1042" mono variant="plain" />
      </Field>
    </Stack>
  );
}
