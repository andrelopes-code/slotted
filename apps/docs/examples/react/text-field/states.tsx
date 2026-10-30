import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldStates() {
  return (
    <Stack gap={5}>
      <Field invalid>
        <FieldLabel>VAT number</FieldLabel>
        <TextField defaultValue="DE 81234" />
        <FieldError>A German VAT number has nine digits after DE.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Order number</FieldLabel>
        <TextField defaultValue="SO-2026-00418" mono />
        <FieldDescription>Assigned when the order was placed.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Currency</FieldLabel>
        <TextField defaultValue="USD" />
        <FieldDescription>Set by the customer’s price list.</FieldDescription>
      </Field>
    </Stack>
  );
}
