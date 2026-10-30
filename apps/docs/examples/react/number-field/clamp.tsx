import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldClamp() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Line discount</FieldLabel>
        <NumberField clamp="blur" defaultValue={10} end="%" max={25} min={0} />
        <FieldDescription>Type 40 and leave the field: it returns to 25.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Order discount</FieldLabel>
        <NumberField clamp="strict" defaultValue={10} end="%" max={25} min={0} />
        <FieldDescription>A keystroke that would pass 25 is refused.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Contract discount</FieldLabel>
        <NumberField clamp="none" defaultValue={10} end="%" max={25} min={0} />
        <FieldDescription>40 stays, and the field is marked invalid.</FieldDescription>
      </Field>
    </Stack>
  );
}
