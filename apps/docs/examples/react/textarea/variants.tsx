import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaVariants() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Return reason</FieldLabel>
        <Textarea variant="outline" rows={2} defaultValue="Two jars arrived with broken seals." />
      </Field>
      <Field>
        <FieldLabel>Warehouse note</FieldLabel>
        <Textarea variant="subtle" rows={2} defaultValue="Restock on shelf B4 after inspection." />
      </Field>
      <Field>
        <FieldLabel>Picker comment</FieldLabel>
        <Textarea variant="plain" rows={2} defaultValue="Counted twice, 46 units on hand." />
      </Field>
    </Stack>
  );
}
