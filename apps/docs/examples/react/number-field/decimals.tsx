import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldDecimals() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Exchange rate, EUR to USD</FieldLabel>
        <NumberField
          defaultValue={1.0842}
          format={{ maximumFractionDigits: 4, minimumFractionDigits: 4 }}
          min={0}
          step={0.0001}
        />
        <FieldDescription>Four decimals: 1.1 becomes 1.1000 on blur.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Cartons</FieldLabel>
        <NumberField defaultValue={40} format={{ maximumFractionDigits: 0 }} min={0} />
        <FieldDescription>Whole cartons: the decimal separator is refused.</FieldDescription>
      </Field>
    </Stack>
  );
}
