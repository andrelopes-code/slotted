import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaSizes() {
  return (
    <Stack gap={5}>
      <Field size="sm">
        <FieldLabel>Line item note</FieldLabel>
        <Textarea rows={2} defaultValue="Pack the glass bottles separately." />
      </Field>
      <Field size="md">
        <FieldLabel>Order note</FieldLabel>
        <Textarea rows={2} defaultValue="The customer asked for delivery before noon on Friday." />
      </Field>
      <Field size="lg">
        <FieldLabel>Message to the supplier</FieldLabel>
        <Textarea rows={2} defaultValue="Please confirm the revised quantities by Wednesday." />
      </Field>
    </Stack>
  );
}
