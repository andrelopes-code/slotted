import { useState } from 'react';
import { Checkbox } from '@slotted/react/checkbox';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function CheckboxControlled() {
  const [sameAddress, setSameAddress] = useState(true);

  return (
    <Stack gap={4}>
      <Checkbox
        checked={sameAddress}
        onCheckedChange={(checked) => setSameAddress(checked)}
        description="Ships to 12 Orchestra Terrace, Walla Walla, WA 99362."
      >
        Bill to the shipping address
      </Checkbox>
      {sameAddress ? null : (
        <Field required>
          <FieldLabel>Billing address</FieldLabel>
          <TextField autoComplete="billing street-address" />
        </Field>
      )}
    </Stack>
  );
}
