import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

export default function NumberFieldControlled() {
  const [limit, setLimit] = useState<number | null>(5000);

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Credit limit for Ernst Handel</FieldLabel>
        <NumberField
          format={{ currency: 'USD', style: 'currency' }}
          min={0}
          onValueChange={setLimit}
          step={500}
          stepFrom={5000}
          value={limit}
        />
      </Field>
      <Inline gap={3} justify="between">
        <span>{limit === null ? 'No credit limit' : `Orders up to ${USD.format(limit)}`}</span>
        <Button disabled={limit === null} onClick={() => setLimit(null)} variant="outline">
          Remove limit
        </Button>
      </Inline>
    </Stack>
  );
}
