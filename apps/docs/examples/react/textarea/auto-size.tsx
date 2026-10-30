import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaAutoSize() {
  return (
    <Field>
      <FieldLabel>Picking note</FieldLabel>
      <Textarea
        autoSize
        rows={2}
        maxRows={6}
        defaultValue="Use the reinforced boxes for the olive oil."
      />
      <FieldDescription>Shown to the picker on the warehouse screen.</FieldDescription>
    </Field>
  );
}
