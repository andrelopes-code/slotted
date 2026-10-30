import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
];

const CHANNELS: MultiSelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
];

export default function MultiSelectForm() {
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const warehouses = data.getAll('warehouses');
    setMissing(warehouses.length === 0);
    setSaved(
      warehouses.length === 0
        ? null
        : `Saved with ${warehouses.length} of ${WAREHOUSES.length} warehouses.`,
    );
  };

  const reset = () => {
    setMissing(false);
    setSaved(null);
  };

  return (
    <form noValidate onSubmit={submit} onReset={reset}>
      <Stack gap={5}>
        <Field required invalid={missing ? true : undefined}>
          <FieldLabel>Stocking warehouses</FieldLabel>
          <MultiSelect name="warehouses" items={WAREHOUSES} onValueChange={() => setMissing(false)}>
            <MultiSelectControl placeholder="Add a warehouse" />
            <MultiSelectContent>
              {WAREHOUSES.map((warehouse) => (
                <MultiSelectItem key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
          <FieldError live="polite" reserve>
            {missing ? 'Choose at least one warehouse to stock this product.' : ''}
          </FieldError>
        </Field>
        <Field>
          <FieldLabel>Sales channels</FieldLabel>
          <MultiSelect name="channels" defaultValue={['web']} items={CHANNELS}>
            <MultiSelectControl />
            <MultiSelectContent>
              {CHANNELS.map((channel) => (
                <MultiSelectItem key={channel.value} value={channel.value}>
                  {channel.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
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
