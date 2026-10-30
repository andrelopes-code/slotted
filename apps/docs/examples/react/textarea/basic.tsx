import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaBasic() {
  return (
    <Field>
      <FieldLabel>Delivery instructions</FieldLabel>
      <Textarea placeholder="Gate code, loading dock, opening hours" />
      <FieldDescription>Printed on the packing slip for the carrier.</FieldDescription>
    </Field>
  );
}
