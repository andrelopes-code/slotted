import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';

export default function NumberFieldBasic() {
  return (
    <Field required>
      <FieldLabel>Reorder point</FieldLabel>
      <NumberField defaultValue={25} end="units" max={500} min={0} step={5} />
      <FieldDescription>Chai is reordered when stock falls to this level.</FieldDescription>
    </Field>
  );
}
