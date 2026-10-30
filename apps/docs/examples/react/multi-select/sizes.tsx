import { Field, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import { Stack } from '@slotted/react/stack';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
];

const SIZES = [
  { size: 'sm', label: 'Filter by warehouse' },
  { size: 'md', label: 'Stocking warehouses' },
  { size: 'lg', label: 'Return warehouses' },
] as const;

export default function MultiSelectSizes() {
  return (
    <Stack gap={5}>
      {SIZES.map(({ size, label }) => (
        <Field key={size} size={size}>
          <FieldLabel>{label}</FieldLabel>
          <MultiSelect defaultValue={['RNO', 'CMH']} items={WAREHOUSES}>
            <MultiSelectControl />
            <MultiSelectContent>
              {WAREHOUSES.map((warehouse) => (
                <MultiSelectItem key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </Field>
      ))}
    </Stack>
  );
}
