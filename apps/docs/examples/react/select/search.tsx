import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const COUNTRIES: SelectOption[] = [
  { value: 'AR', label: 'Argentina' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CI', label: 'Côte d’Ivoire' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'MX', label: 'Mexico' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NO', label: 'Norway' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Spain' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'TR', label: 'Türkiye' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VN', label: 'Vietnam' },
];

export default function SelectSearch() {
  return (
    <Field>
      <FieldLabel>Ship-to country</FieldLabel>
      <Select
        search
        defaultValue="US"
        items={COUNTRIES}
        messages={{ searchPlaceholder: 'Filter countries' }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
