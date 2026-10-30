import { Fragment } from 'react';
import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  type SelectOptionGroup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const METHODS: SelectOptionGroup[] = [
  {
    label: 'Ground',
    options: [
      { value: 'ups-ground', label: 'UPS Ground' },
      { value: 'fedex-ground', label: 'FedEx Ground' },
    ],
  },
  {
    label: 'Express',
    options: [
      { value: 'ups-2day', label: 'UPS 2nd Day Air' },
      { value: 'fedex-overnight', label: 'FedEx Priority Overnight' },
    ],
  },
  {
    label: 'Freight',
    options: [{ value: 'ltl', label: 'LTL freight, palletised' }],
  },
];

export default function SelectGroups() {
  return (
    <Field>
      <FieldLabel>Shipping method</FieldLabel>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose a method" />
        </SelectTrigger>
        <SelectContent>
          {METHODS.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 ? <SelectSeparator /> : null}
              <SelectGroup label={group.label}>
                {group.options.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
