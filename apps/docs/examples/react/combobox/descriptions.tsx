import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const WAREHOUSES = [
  { code: 'RNO', city: 'Reno, NV', detail: 'West · same-day cutoff 2:00 pm PT' },
  { code: 'CMH', city: 'Columbus, OH', detail: 'Midwest · same-day cutoff 3:00 pm ET' },
  { code: 'SAV', city: 'Savannah, GA', detail: 'Southeast · port of entry for ocean freight' },
  { code: 'DFW', city: 'Dallas, TX', detail: 'South · opens November 2026' },
];

export default function ComboboxDescriptions() {
  return (
    <Field>
      <FieldLabel>Ship from</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search warehouses" />
        <ComboboxContent>
          {WAREHOUSES.map((warehouse) => (
            <ComboboxItem
              key={warehouse.code}
              value={warehouse.code}
              description={warehouse.detail}
            >
              {warehouse.city}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
