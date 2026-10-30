import { useState } from 'react';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const CARRIERS: MultiSelectOption[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
  { value: 'dhl', label: 'DHL Express' },
];

/** Stands in for a request to the shipping rates API. */
const fetchCarriers = () =>
  new Promise<MultiSelectOption[]>((resolve) => setTimeout(() => resolve(CARRIERS), 1500));

export default function MultiSelectLoading() {
  const [carriers, setCarriers] = useState<MultiSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async (open: boolean) => {
    if (!open || loaded || loading) return;
    setLoading(true);
    setCarriers(await fetchCarriers());
    setLoading(false);
    setLoaded(true);
  };

  return (
    <Field>
      <FieldLabel>Carriers offered at checkout</FieldLabel>
      <MultiSelect
        loading={loading}
        items={carriers}
        messages={{ loading: 'Fetching carriers…' }}
        onOpenChange={(open) => void load(open)}
      >
        <MultiSelectControl placeholder="Add a carrier" />
        <MultiSelectContent>
          {carriers.map((carrier) => (
            <MultiSelectItem key={carrier.value} value={carrier.value}>
              {carrier.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>Carriers load from the rates service when the list opens.</FieldDescription>
    </Field>
  );
}
