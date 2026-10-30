import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const CARRIERS: { value: string; label: string; disabled?: boolean; description?: string }[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  {
    value: 'dhl',
    label: 'DHL Express',
    disabled: true,
    description: 'Account on hold until invoice INV-21462 is paid.',
  },
  { value: 'usps', label: 'USPS Priority Mail' },
];

export default function SelectDisabledOptions() {
  return (
    <Field>
      <FieldLabel>Carrier</FieldLabel>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose a carrier" />
        </SelectTrigger>
        <SelectContent>
          {CARRIERS.map((carrier) => (
            <SelectItem
              key={carrier.value}
              value={carrier.value}
              disabled={carrier.disabled ?? false}
              description={carrier.description}
            >
              {carrier.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
