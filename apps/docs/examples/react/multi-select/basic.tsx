import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from '@slotted/react/multi-select';

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
  { value: 'ONT', label: 'Ontario, CA' },
  { value: 'ABE', label: 'Allentown, PA' },
];

export default function MultiSelectBasic() {
  return (
    <Field>
      <FieldLabel>Stocking warehouses</FieldLabel>
      <MultiSelect>
        <MultiSelectControl placeholder="Add a warehouse" />
        <MultiSelectContent>
          {WAREHOUSES.map((warehouse) => (
            <MultiSelectItem key={warehouse.value} value={warehouse.value}>
              {warehouse.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>
        Chai tea, 24 bags is reordered at each of these warehouses.
      </FieldDescription>
    </Field>
  );
}
