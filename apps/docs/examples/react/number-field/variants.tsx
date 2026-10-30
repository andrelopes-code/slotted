import { Field, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldVariants() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Unit price</FieldLabel>
        <NumberField
          defaultValue={18}
          format={{ currency: 'USD', style: 'currency' }}
          min={0}
          variant="outline"
        />
      </Field>
      <Field>
        <FieldLabel>Discount</FieldLabel>
        <NumberField
          defaultValue={0.05}
          format={{ style: 'percent' }}
          max={1}
          min={0}
          step={0.01}
          variant="subtle"
        />
      </Field>
      <Field>
        <FieldLabel>Freight</FieldLabel>
        <NumberField
          defaultValue={32.38}
          format={{ currency: 'USD', style: 'currency' }}
          min={0}
          stepper="none"
          variant="plain"
        />
      </Field>
    </Stack>
  );
}
