import { useState } from 'react';
import { Field, FieldLabel } from '@slotted/react/field';
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

const labelOf = (value: string) => WAREHOUSES.find((option) => option.value === value)?.label;

export default function MultiSelectControlled() {
  const [warehouses, setWarehouses] = useState<readonly string[]>(['RNO', 'CMH']);
  const [reason, setReason] = useState<string | null>(null);

  return (
    <Stack gap={3}>
      <Field>
        <FieldLabel>Stocking warehouses</FieldLabel>
        <MultiSelect
          value={warehouses}
          items={WAREHOUSES}
          onValueChange={(next, request) => {
            setWarehouses(next);
            setReason(request.reason);
          }}
        >
          <MultiSelectControl placeholder="Add a warehouse" />
          <MultiSelectContent>
            {WAREHOUSES.map((warehouse) => (
              <MultiSelectItem key={warehouse.value} value={warehouse.value}>
                {warehouse.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Field>
      <Text size="sm" tone="muted">
        {warehouses.length === 0
          ? 'Not stocked anywhere'
          : `Stocked at ${warehouses.map(labelOf).join('; ')}`}
        {reason === null ? '' : ` · last change: ${reason}`}
      </Text>
    </Stack>
  );
}
