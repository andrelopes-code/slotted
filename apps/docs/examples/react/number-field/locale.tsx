import { Field, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldLocale() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Invoice total, United States</FieldLabel>
        <NumberField
          defaultValue={14800.5}
          format={{ currency: 'USD', style: 'currency' }}
          locale="en-US"
        />
      </Field>
      <Field>
        <FieldLabel>Invoice total, Germany</FieldLabel>
        <NumberField
          defaultValue={14800.5}
          format={{ currency: 'EUR', style: 'currency' }}
          locale="de-DE"
        />
      </Field>
      <Field>
        <FieldLabel>Invoice total, Egypt</FieldLabel>
        <NumberField
          defaultValue={14800.5}
          format={{ currency: 'EGP', style: 'currency' }}
          locale="ar-EG"
        />
      </Field>
    </Stack>
  );
}
