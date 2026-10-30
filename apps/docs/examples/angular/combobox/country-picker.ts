import { Component } from '@angular/core';
import { SlCombobox, SlComboboxGroup, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

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

@Component({
  selector: 'app-combobox-country-picker',
  imports: [SlCombobox, SlComboboxGroup, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField required>
      <label slFieldLabel>Country or region</label>
      <sl-combobox autoHighlight name="country" placeholder="Search countries">
        @for (group of regions; track group.region) {
          <sl-combobox-group [label]="group.region">
            @for (country of group.countries; track country.code) {
              <sl-combobox-item
                [value]="country.code"
                [label]="country.name"
                [description]="country.detail"
              />
            }
          </sl-combobox-group>
        }
      </sl-combobox>
      <span slFieldDescription>Sets the currency and the phone prefix on the invoice.</span>
    </div>
  `,
})
export class ComboboxCountryPicker {
  protected readonly regions = REGIONS;
}
