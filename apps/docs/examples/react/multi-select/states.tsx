import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
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

const options = WAREHOUSES.map((warehouse) => (
  <MultiSelectItem key={warehouse.value} value={warehouse.value}>
    {warehouse.label}
  </MultiSelectItem>
));

export default function MultiSelectStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Stocking warehouses</FieldLabel>
        <MultiSelect items={WAREHOUSES}>
          <MultiSelectControl placeholder="Add a warehouse" />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldError>Choose at least one warehouse before publishing.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Warehouses holding stock</FieldLabel>
        <MultiSelect defaultValue={['RNO', 'SAV']} items={WAREHOUSES}>
          <MultiSelectControl />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldDescription>Updated by the nightly inventory sync.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Transfer warehouses</FieldLabel>
        <MultiSelect defaultValue={['CMH']} items={WAREHOUSES}>
          <MultiSelectControl />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldDescription>Transfers open once the purchase order is received.</FieldDescription>
      </Field>
    </Stack>
  );
}
