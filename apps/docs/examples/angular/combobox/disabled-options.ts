import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

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

@Component({
  selector: 'app-combobox-disabled-options',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Shipping service</label>
      <sl-combobox placeholder="Search services">
        @for (service of services; track service.id) {
          <sl-combobox-item
            [value]="service.id"
            [label]="service.name"
            [description]="service.note"
            [disabled]="service.disabled"
          />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxDisabledOptions {
  protected readonly services = SERVICES;
}
