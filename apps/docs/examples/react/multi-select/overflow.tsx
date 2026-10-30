import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
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
  { value: 'ONT', label: 'Ontario, CA' },
  { value: 'SEA', label: 'Kent, WA' },
  { value: 'DFW', label: 'Dallas, TX' },
  { value: 'JOT', label: 'Joliet, IL' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'ABE', label: 'Allentown, PA' },
  { value: 'EWR', label: 'Edison, NJ' },
];

const STOCKED = ['RNO', 'ONT', 'SEA', 'DFW', 'JOT', 'CMH', 'SAV'];

const options = WAREHOUSES.map((warehouse) => (
  <MultiSelectItem key={warehouse.value} value={warehouse.value}>
    {warehouse.label}
  </MultiSelectItem>
));

export default function MultiSelectOverflow() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Stocking warehouses</FieldLabel>
        <MultiSelect overflow="wrap" defaultValue={STOCKED} items={WAREHOUSES}>
          <MultiSelectControl />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldDescription>Wrap: every chip stays in view, up to three rows.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Stocking warehouses</FieldLabel>
        <MultiSelect overflow="collapse" defaultValue={STOCKED} items={WAREHOUSES}>
          <MultiSelectControl />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldDescription>Collapse: one row, and a count of the rest.</FieldDescription>
      </Field>
    </Stack>
  );
}
