import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

const CARRIERS: SelectOption[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
];

const labelOf = (options: SelectOption[], value: FormDataEntryValue | null) =>
  options.find((option) => option.value === value)?.label;

export default function SelectForm() {
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const warehouse = labelOf(WAREHOUSES, data.get('warehouse'));
    const carrier = labelOf(CARRIERS, data.get('carrier'));
    setMissing(warehouse === undefined);
    setSaved(warehouse === undefined ? null : `Ships from ${warehouse} by ${carrier}.`);
  };

  const reset = () => {
    setMissing(false);
    setSaved(null);
  };

  return (
    <form noValidate onSubmit={submit} onReset={reset}>
      <Stack gap={5}>
        <Field required invalid={missing ? true : undefined}>
          <FieldLabel>Fulfilment warehouse</FieldLabel>
          <Select name="warehouse" items={WAREHOUSES} onValueChange={() => setMissing(false)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a warehouse" />
            </SelectTrigger>
            <SelectContent>
              {WAREHOUSES.map((warehouse) => (
                <SelectItem key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError live="polite" reserve>
            {missing ? 'Choose the warehouse that ships this order.' : ''}
          </FieldError>
        </Field>
        <Field>
          <FieldLabel>Carrier</FieldLabel>
          <Select name="carrier" defaultValue="ups" items={CARRIERS}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARRIERS.map((carrier) => (
                <SelectItem key={carrier.value} value={carrier.value}>
                  {carrier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Save</Button>
          <Button type="reset" tone="secondary" variant="outline">
            Reset
          </Button>
          {saved && (
            <Text size="sm" tone="muted">
              {saved}
            </Text>
          )}
        </Inline>
      </Stack>
    </form>
  );
}
