import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const REGIONS = [
  {
    region: 'Americas',
    countries: [
      { code: 'BR', name: 'Brazil', detail: 'BRL · +55' },
      { code: 'CA', name: 'Canada', detail: 'CAD · +1' },
      { code: 'MX', name: 'Mexico', detail: 'MXN · +52' },
      { code: 'US', name: 'United States', detail: 'USD · +1' },
    ],
  },
  {
    region: 'Europe',
    countries: [
      { code: 'FR', name: 'France', detail: 'EUR · +33' },
      { code: 'DE', name: 'Germany', detail: 'EUR · +49' },
      { code: 'PL', name: 'Poland', detail: 'PLN · +48' },
      { code: 'CH', name: 'Switzerland', detail: 'CHF · +41' },
      { code: 'TR', name: 'Türkiye', detail: 'TRY · +90' },
      { code: 'GB', name: 'United Kingdom', detail: 'GBP · +44' },
    ],
  },
  {
    region: 'Asia Pacific',
    countries: [
      { code: 'AU', name: 'Australia', detail: 'AUD · +61' },
      { code: 'JP', name: 'Japan', detail: 'JPY · +81' },
      { code: 'SG', name: 'Singapore', detail: 'SGD · +65' },
      { code: 'VN', name: 'Việt Nam', detail: 'VND · +84' },
    ],
  },
  {
    region: 'Middle East and Africa',
    countries: [
      { code: 'CI', name: 'Côte d’Ivoire', detail: 'XOF · +225' },
      { code: 'EG', name: 'Egypt', detail: 'EGP · +20' },
      { code: 'KE', name: 'Kenya', detail: 'KES · +254' },
      { code: 'AE', name: 'United Arab Emirates', detail: 'AED · +971' },
    ],
  },
];

export default function ComboboxCountryPicker() {
  return (
    <Field required>
      <FieldLabel>Country or region</FieldLabel>
      <Combobox autoHighlight name="country">
        <ComboboxInput placeholder="Search countries" />
        <ComboboxContent>
          {REGIONS.map((group) => (
            <ComboboxGroup key={group.region} label={group.region}>
              {group.countries.map((country) => (
                <ComboboxItem key={country.code} value={country.code} description={country.detail}>
                  {country.name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Sets the currency and the phone prefix on the invoice.</FieldDescription>
    </Field>
  );
}
