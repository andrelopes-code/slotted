import { Component, signal } from '@angular/core';
import { SlCombobox, SlComboboxGroup, SlComboboxItem } from '@slotted/angular/combobox';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const CUSTOMERS = [
  { id: 'brightline', name: 'Brightline Studio', city: 'Portland, OR' },
  { id: 'harbor-pine', name: 'Harbor & Pine', city: 'Seattle, WA' },
  { id: 'northgate', name: 'Northgate Labs', city: 'Austin, TX' },
];
const ORDERS = [
  { id: '10482', customer: 'Brightline Studio', total: '$1,284.00' },
  { id: '10479', customer: 'Atlas Freight', total: '$356.40' },
  { id: '10471', customer: 'Northgate Labs', total: '$2,910.15' },
];
const LABELS = new Map<string, string>([
  ...CUSTOMERS.map((customer) => [`customer:${customer.id}`, customer.name] as const),
  ...ORDERS.map((order) => [`order:${order.id}`, `Order ${order.id}`] as const),
]);

@Component({
  selector: 'app-combobox-global-search',
  imports: [SlCombobox, SlComboboxGroup, SlComboboxItem, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <sl-combobox
        aria-label="Search Northwind"
        openOn="focus"
        placeholder="Search customers and orders"
        size="sm"
        (valueChange)="opened.set($event)"
      >
        <sl-combobox-group label="Customers">
          @for (customer of customers; track customer.id) {
            <sl-combobox-item
              icon="person"
              [value]="'customer:' + customer.id"
              [label]="customer.name"
              [description]="customer.city"
            />
          }
        </sl-combobox-group>
        <sl-combobox-group label="Orders">
          @for (order of orders; track order.id) {
            <sl-combobox-item
              icon="file-text"
              [value]="'order:' + order.id"
              [label]="'Order ' + order.id"
              [description]="order.customer + ' · ' + order.total"
            />
          }
        </sl-combobox-group>
      </sl-combobox>
      <span slText size="sm" tone="muted">
        @if (opened(); as key) {
          Opening {{ labels.get(key) }}
        } @else {
          Focus the field to see every result.
        }
      </span>
    </div>
  `,
})
export class ComboboxGlobalSearch {
  protected readonly customers = CUSTOMERS;
  protected readonly orders = ORDERS;
  protected readonly labels = LABELS;
  protected readonly opened = signal<string | null>(null);
}
