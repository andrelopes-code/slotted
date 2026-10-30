import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldFormatOn() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Annual purchase budget</FieldLabel>
        <NumberField format={{ currency: 'USD', style: 'currency' }} formatOn="change" min={0} />
        <FieldDescription>Type 1250000: the grouping appears with each digit.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Amount from bank statement</FieldLabel>
        <NumberField format={{ currency: 'USD', style: 'currency' }} formatOn="commit" min={0} />
        <FieldDescription>Your text stays as typed until Enter or blur.</FieldDescription>
      </Field>
    </Stack>
  );
}
