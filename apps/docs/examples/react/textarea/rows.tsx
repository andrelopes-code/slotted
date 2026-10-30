import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaRows() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Gift message</FieldLabel>
        <Textarea rows={2} resize="none" defaultValue="Happy birthday, Laura. Enjoy the tea." />
      </Field>
      <Field>
        <FieldLabel>Incident report</FieldLabel>
        <Textarea rows={5} placeholder="What happened, when, and who was involved" />
      </Field>
      <Field>
        <FieldLabel>Reply draft</FieldLabel>
        <Textarea resize="both" placeholder="Drag the corner to resize in both directions" />
      </Field>
    </Stack>
  );
}
