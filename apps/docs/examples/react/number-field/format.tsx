import { Field, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldFormat() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Credit limit</FieldLabel>
        <NumberField
          defaultValue={25000}
          format={{ currency: 'USD', style: 'currency' }}
          min={0}
          step={500}
        />
      </Field>
      <Field>
        <FieldLabel>Sales tax</FieldLabel>
        <NumberField
          defaultValue={0.0825}
          format={{ maximumFractionDigits: 2, style: 'percent' }}
          max={1}
          min={0}
          step={0.0025}
        />
      </Field>
      <Field>
        <FieldLabel>Pallet volume</FieldLabel>
        <NumberField
          defaultValue={1.8}
          format={{ style: 'unit', unit: 'liter', unitDisplay: 'long' }}
          min={0}
          step={0.1}
        />
      </Field>
    </Stack>
  );
}
