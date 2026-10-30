import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
  { value: 'ONT', label: 'Ontario, CA' },
  { value: 'ABE', label: 'Allentown, PA' },
];

export default function MultiSelectInitialValue() {
  return (
    <Field>
      <FieldLabel>Stocking warehouses</FieldLabel>
      <MultiSelect defaultValue={['RNO', 'CMH']} items={WAREHOUSES}>
        <MultiSelectControl placeholder="Add a warehouse" />
        <MultiSelectContent>
          {WAREHOUSES.map((warehouse) => (
            <MultiSelectItem key={warehouse.value} value={warehouse.value}>
              {warehouse.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>Earl Grey, 100 bags is stocked at two warehouses.</FieldDescription>
    </Field>
  );
}
