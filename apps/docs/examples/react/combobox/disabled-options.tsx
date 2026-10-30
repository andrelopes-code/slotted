import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const SERVICES = [
  { id: 'usps-priority', name: 'USPS Priority Mail', note: '1–3 business days', disabled: false },
  { id: 'ups-ground', name: 'UPS Ground', note: '1–5 business days', disabled: false },
  { id: 'fedex-2day', name: 'FedEx 2Day', note: '2 business days', disabled: false },
  {
    id: 'dhl-express',
    name: 'DHL Express Worldwide',
    note: 'International shipments only',
    disabled: true,
  },
  { id: 'ups-next-day', name: 'UPS Next Day Air', note: 'Cutoff passed for today', disabled: true },
];

export default function ComboboxDisabledOptions() {
  return (
    <Field>
      <FieldLabel>Shipping service</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search services" />
        <ComboboxContent>
          {SERVICES.map((service) => (
            <ComboboxItem
              key={service.id}
              value={service.id}
              description={service.note}
              disabled={service.disabled}
            >
              {service.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
