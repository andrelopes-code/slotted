import { Field, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldAdornments() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Purchase price</FieldLabel>
        <NumberField
          defaultValue={1480}
          end="USD"
          format={{ minimumFractionDigits: 2 }}
          min={0}
          start="$"
        />
      </Field>
      <Field>
        <FieldLabel>Lead time</FieldLabel>
        <NumberField defaultValue={14} end="days" max={120} min={0} />
      </Field>
    </Stack>
  );
}
