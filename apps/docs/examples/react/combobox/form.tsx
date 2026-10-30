import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const WAREHOUSES = [
  { code: 'RNO', city: 'Reno, NV' },
  { code: 'CMH', city: 'Columbus, OH' },
  { code: 'SAV', city: 'Savannah, GA' },
];

export default function ComboboxForm() {
  const [missing, setMissing] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const warehouse = new FormData(event.currentTarget).get('warehouse');
    setMissing(!warehouse);
    setSubmitted(warehouse ? `warehouse=${String(warehouse)}` : null);
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <Field required invalid={missing}>
          <FieldLabel>Fulfil from</FieldLabel>
          <Combobox name="warehouse" onValueChange={(next) => next && setMissing(false)}>
            <ComboboxInput placeholder="Search warehouses" />
            <ComboboxContent>
              {WAREHOUSES.map((warehouse) => (
                <ComboboxItem key={warehouse.code} value={warehouse.code}>
                  {warehouse.city}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
          {missing && <FieldError>Choose the warehouse that ships this order.</FieldError>}
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Create transfer</Button>
          {submitted && (
            <Text size="sm" tone="muted">
              Submitted {submitted}
            </Text>
          )}
        </Inline>
      </Stack>
    </form>
  );
}
