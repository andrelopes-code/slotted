import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const CUSTOMERS = [
  { id: 'brightline', name: 'Brightline Studio' },
  { id: 'harbor-pine', name: 'Harbor & Pine' },
  { id: 'northgate', name: 'Northgate Labs' },
  { id: 'quill', name: 'Quill & Co.' },
  { id: 'solstice', name: 'Solstice Outdoor' },
  { id: 'verde', name: 'Verde Kitchen' },
  { id: 'atlas', name: 'Atlas Freight' },
  { id: 'juniper', name: 'Juniper Health' },
];

export default function ComboboxBasic() {
  return (
    <Field>
      <FieldLabel>Customer</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search customers" />
        <ComboboxContent>
          {CUSTOMERS.map((customer) => (
            <ComboboxItem key={customer.id} value={customer.id}>
              {customer.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
