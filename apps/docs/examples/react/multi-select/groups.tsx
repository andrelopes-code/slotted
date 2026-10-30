import { Fragment } from 'react';
import { Field, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectGroup,
  MultiSelectItem,
  type MultiSelectOptionGroup,
  MultiSelectSeparator,
} from '@slotted/react/multi-select';

const REGIONS: MultiSelectOptionGroup[] = [
  {
    label: 'West',
    options: [
      { value: 'RNO', label: 'Reno, NV' },
      { value: 'ONT', label: 'Ontario, CA' },
      { value: 'SEA', label: 'Kent, WA' },
    ],
  },
  {
    label: 'Central',
    options: [
      { value: 'DFW', label: 'Dallas, TX' },
      { value: 'JOT', label: 'Joliet, IL' },
      { value: 'CMH', label: 'Columbus, OH' },
    ],
  },
  {
    label: 'East',
    options: [
      { value: 'SAV', label: 'Savannah, GA' },
      { value: 'ABE', label: 'Allentown, PA' },
      { value: 'EWR', label: 'Edison, NJ' },
    ],
  },
];

export default function MultiSelectGroups() {
  return (
    <Field>
      <FieldLabel>Stocking warehouses</FieldLabel>
      <MultiSelect defaultValue={['RNO', 'SAV']} items={REGIONS}>
        <MultiSelectControl placeholder="Add a warehouse" />
        <MultiSelectContent>
          {REGIONS.map((region, index) => (
            <Fragment key={region.label}>
              {index > 0 && <MultiSelectSeparator />}
              <MultiSelectGroup label={region.label}>
                {region.options.map((warehouse) => (
                  <MultiSelectItem key={warehouse.value} value={warehouse.value}>
                    {warehouse.label}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </Fragment>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    </Field>
  );
}
