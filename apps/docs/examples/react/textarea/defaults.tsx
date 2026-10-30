import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Textarea, TextareaDefaultsProvider } from '@slotted/react/textarea';

export default function TextareaDefaults() {
  return (
    <TextareaDefaultsProvider variant="subtle" resize="none">
      <Stack gap={5}>
        <Field>
          <FieldLabel>Reply to the customer</FieldLabel>
          <Textarea rows={2} defaultValue="Your refund was issued today." />
        </Field>
        <Field>
          <FieldLabel>Internal note</FieldLabel>
          <Textarea rows={2} defaultValue="Refund approved by finance." />
        </Field>
        <Field>
          <FieldLabel>Escalation summary</FieldLabel>
          <Textarea variant="outline" rows={2} defaultValue="Second refund request this quarter." />
        </Field>
      </Stack>
    </TextareaDefaultsProvider>
  );
}
