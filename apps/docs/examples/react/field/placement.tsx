import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldPlacement() {
  return (
    <Stack gap={4}>
      <Field labelPlacement="side" required>
        <FieldLabel>Legal name</FieldLabel>
        <TextField defaultValue="Northwind Traders Ltd." />
      </Field>
      <Field labelPlacement="side" required>
        <FieldLabel>Billing email</FieldLabel>
        <TextField type="email" defaultValue="billing@northwind.example" />
        <FieldDescription>Invoices and payment receipts are sent here.</FieldDescription>
      </Field>
      <Field labelPlacement="side">
        <FieldLabel>VAT number</FieldLabel>
        <TextField defaultValue="GB 284 9113 07" />
      </Field>
    </Stack>
  );
}
