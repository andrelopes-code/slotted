import { Field, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const WAREHOUSES: (MultiSelectOption & { description: string })[] = [
  { value: 'RNO', label: 'Reno, NV', description: '142 pallet spaces free' },
  { value: 'CMH', label: 'Columbus, OH', description: '38 pallet spaces free' },
  {
    value: 'SAV',
    label: 'Savannah, GA',
    description: 'At capacity until November 3',
    disabled: true,
  },
  { value: 'DFW', label: 'Dallas, TX', description: '210 pallet spaces free' },
  {
    value: 'ONT',
    label: 'Ontario, CA',
    description: 'Closed for a stock count this week',
    disabled: true,
  },
];

export default function MultiSelectDisabledOptions() {
  return (
    <Field>
      <FieldLabel>Receiving warehouses</FieldLabel>
      <MultiSelect defaultValue={['RNO']} items={WAREHOUSES}>
        <MultiSelectControl placeholder="Add a warehouse" />
        <MultiSelectContent>
          {WAREHOUSES.map((warehouse) => (
            <MultiSelectItem
              key={warehouse.value}
              value={warehouse.value}
              description={warehouse.description}
              disabled={warehouse.disabled ?? false}
            >
              {warehouse.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    </Field>
  );
}
