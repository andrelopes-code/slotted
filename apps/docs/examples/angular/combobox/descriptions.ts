import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const WAREHOUSES = [
  { code: 'RNO', city: 'Reno, NV', detail: 'West · same-day cutoff 2:00 pm PT' },
  { code: 'CMH', city: 'Columbus, OH', detail: 'Midwest · same-day cutoff 3:00 pm ET' },
  { code: 'SAV', city: 'Savannah, GA', detail: 'Southeast · port of entry for ocean freight' },
  { code: 'DFW', city: 'Dallas, TX', detail: 'South · opens November 2026' },
];

@Component({
  selector: 'app-combobox-descriptions',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Ship from</label>
      <sl-combobox placeholder="Search warehouses">
        @for (warehouse of warehouses; track warehouse.code) {
          <sl-combobox-item
            [value]="warehouse.code"
            [label]="warehouse.city"
            [description]="warehouse.detail"
          />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxDescriptions {
  protected readonly warehouses = WAREHOUSES;
}
