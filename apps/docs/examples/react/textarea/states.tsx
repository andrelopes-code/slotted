import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Damage report</FieldLabel>
        <Textarea rows={2} defaultValue="Box dented." />
        <FieldError>Describe the damage in at least 20 characters.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Customer note</FieldLabel>
        <Textarea
          rows={2}
          defaultValue="Please ring the bell twice. The office is on the second floor."
        />
        <FieldDescription>Written by the customer at checkout.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Carrier instructions</FieldLabel>
        <Textarea rows={2} defaultValue="Leave with the building manager." />
        <FieldDescription>Locked once the shipment is booked.</FieldDescription>
      </Field>
    </Stack>
  );
}
