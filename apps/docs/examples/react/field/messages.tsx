import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldMessages() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Purchase order</FieldLabel>
        <TextField defaultValue="PO-20418" />
        <FieldDescription>
          Printed on the invoice so your accounts team can match it.
        </FieldDescription>
      </Field>
      <Field invalid>
        <FieldLabel>Postal code</FieldLabel>
        <TextField defaultValue="981" />
        <FieldDescription>Five digits, as on the shipping label.</FieldDescription>
        <FieldError>Enter all five digits.</FieldError>
      </Field>
      <Field>
        <FieldLabel>Discount</FieldLabel>
        <TextField defaultValue="45%" />
        <FieldError tone="warning">Above 40% the order waits for a manager's approval.</FieldError>
      </Field>
    </Stack>
  );
}
