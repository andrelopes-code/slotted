import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldRange() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Pallets on the trailer</FieldLabel>
        <NumberField defaultValue={26} max={26} min={0} />
        <FieldDescription>A 53-foot trailer holds 26 pallets.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Bottles of Chartreuse verte</FieldLabel>
        <NumberField defaultValue={12} min={6} snapToStep step={6} />
        <FieldDescription>Sold in cases of 6. Type 20 and leave the field.</FieldDescription>
      </Field>
    </Stack>
  );
}
