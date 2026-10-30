import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldKeyboard() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Shipping weight</FieldLabel>
        <NumberField
          defaultValue={12.5}
          format={{ maximumFractionDigits: 1, style: 'unit', unit: 'kilogram' }}
          largeStep={10}
          min={0}
          smallStep={0.1}
          step={1}
        />
        <FieldDescription>Arrows: 1 kg. Shift or Page keys: 10 kg. Alt: 0.1 kg.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Safety stock</FieldLabel>
        <NumberField defaultValue={15} min={0} wheel />
        <FieldDescription>
          With the field focused, the mouse wheel steps the value.
        </FieldDescription>
      </Field>
    </Stack>
  );
}
