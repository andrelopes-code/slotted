import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const ACCOUNTS: { id: string; label: string; description?: string }[] = [
  {
    id: '4010',
    label:
      '4010 · Revenue, wholesale channel, net of returns, allowances and early-payment discounts',
  },
  { id: '4020', label: '4020 · Revenue, online store' },
  {
    id: 'urn',
    label: 'urn:northwind:ledger:4030-9f2c41ab8de07c5511903fbe',
    description: 'Imported from the previous ledger',
  },
  {
    id: '5100',
    label: '5100 · Cost of goods sold, including inbound freight and duties',
    description: 'Posted when an order ships, at the weighted average cost of the warehouse',
  },
];

@Component({
  selector: 'app-combobox-long-labels',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Ledger account</label>
      <sl-combobox placeholder="Search accounts">
        @for (account of accounts; track account.id) {
          <sl-combobox-item
            [value]="account.id"
            [label]="account.label"
            [description]="account.description"
          />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxLongLabels {
  protected readonly accounts = ACCOUNTS;
}
