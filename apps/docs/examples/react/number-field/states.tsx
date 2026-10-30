import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldStates() {
  return (
    <Stack gap={5}>
      <Field invalid>
        <FieldLabel>Quantity to ship</FieldLabel>
        <NumberField defaultValue={120} min={1} />
        <FieldError>Only 39 units of Chai are in stock.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Units on order</FieldLabel>
        <NumberField defaultValue={40} />
        <FieldDescription>Counted from open purchase orders.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Units reserved</FieldLabel>
        <NumberField defaultValue={12} />
        <FieldDescription>Released when the order ships.</FieldDescription>
      </Field>
    </Stack>
  );
}
