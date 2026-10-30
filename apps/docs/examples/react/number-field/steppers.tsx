import { Field, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldSteppers() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Reorder quantity</FieldLabel>
        <NumberField defaultValue={40} min={0} step={10} stepper="stacked" />
      </Field>
      <Field>
        <FieldLabel>Quantity</FieldLabel>
        <NumberField defaultValue={3} max={99} min={1} stepper="split" />
      </Field>
      <Field>
        <FieldLabel>Units in stock</FieldLabel>
        <NumberField defaultValue={39} min={0} stepper="none" />
      </Field>
    </Stack>
  );
}
