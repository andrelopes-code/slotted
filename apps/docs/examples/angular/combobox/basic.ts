import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const CUSTOMERS = [
  { id: 'brightline', name: 'Brightline Studio' },
  { id: 'harbor-pine', name: 'Harbor & Pine' },
  { id: 'northgate', name: 'Northgate Labs' },
  { id: 'quill', name: 'Quill & Co.' },
  { id: 'solstice', name: 'Solstice Outdoor' },
  { id: 'verde', name: 'Verde Kitchen' },
  { id: 'atlas', name: 'Atlas Freight' },
  { id: 'juniper', name: 'Juniper Health' },
];

@Component({
  selector: 'app-combobox-basic',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Customer</label>
      <sl-combobox placeholder="Search customers">
        @for (customer of customers; track customer.id) {
          <sl-combobox-item [value]="customer.id" [label]="customer.name" />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxBasic {
  protected readonly customers = CUSTOMERS;
}
