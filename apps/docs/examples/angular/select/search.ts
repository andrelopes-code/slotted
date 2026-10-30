import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';

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

@Component({
  selector: 'app-select-search',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Ship-to country</label>
      <sl-select
        search
        placeholder="Choose a country"
        value="US"
        [items]="countries"
        [messages]="{ searchPlaceholder: 'Filter countries' }"
      >
        @for (country of countries; track country.value) {
          <sl-select-item [value]="country.value" [label]="country.label" />
        }
      </sl-select>
    </div>
  `,
})
export class SelectSearch {
  protected readonly countries = COUNTRIES;
}
