import { Component, computed, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';

interface Order {
  id: string;
  customer: string;
  placed: string;
  total: number;
}

const ORDERS: Order[] = [
  { id: 'SO-10482', customer: 'Northwind Traders', placed: '2026-10-02', total: 1240 },
  { id: 'SO-10483', customer: 'Contoso Foods', placed: '2026-10-03', total: 860.5 },
  { id: 'SO-10484', customer: 'Fabrikam Supply', placed: '2026-10-01', total: 2315.75 },
  { id: 'SO-10485', customer: 'Adventure Works', placed: '2026-10-04', total: 412 },
];

const SORTS: { value: string; label: string; compare: (a: Order, b: Order) => number }[] = [
  { value: 'newest', label: 'Newest first', compare: (a, b) => b.placed.localeCompare(a.placed) },
  { value: 'oldest', label: 'Oldest first', compare: (a, b) => a.placed.localeCompare(b.placed) },
  { value: 'total-desc', label: 'Highest total', compare: (a, b) => b.total - a.total },
  { value: 'total-asc', label: 'Lowest total', compare: (a, b) => a.total - b.total },
  {
    value: 'customer',
    label: 'Customer, A to Z',
    compare: (a, b) => a.customer.localeCompare(b.customer),
  },
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

@Component({
  selector: 'app-menu-sort-menu',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuItem,
    SlMenuRadioGroup,
    SlMenuTrigger,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slStack align="end" [gap]="3">
      <button slButton size="sm" variant="outline" [slMenuTriggerFor]="sortMenu">
        Sort: {{ current().label }}
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #sortMenu align="end">
        <sl-menu-radio-group aria-label="Sort orders" [(value)]="sort">
          @for (option of sorts; track option.value) {
            <button slMenuRadioItem [value]="option.value">{{ option.label }}</button>
          }
        </sl-menu-radio-group>
      </sl-menu>
      <div slTable [columns]="4">
        <div slTableContent>
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Order</th>
              <th slTableColumnHeader>Customer</th>
              <th slTableColumnHeader>Placed</th>
              <th slTableColumnHeader numeric>Total</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (order of rows(); track order.id) {
              <tr slTableRow [value]="order.id">
                <th slTableRowHeader>{{ order.id }}</th>
                <td slTableCell>{{ order.customer }}</td>
                <td slTableCell>{{ order.placed }}</td>
                <td slTableCell numeric>{{ format(order.total) }}</td>
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class MenuSortMenu {
  protected readonly sorts = SORTS;
  protected readonly sort = signal<string | undefined>('newest');
  protected readonly current = computed(
    () => SORTS.find((option) => option.value === this.sort()) ?? SORTS[0]!,
  );
  protected readonly rows = computed(() => [...ORDERS].sort(this.current().compare));

  protected format(total: number): string {
    return money.format(total);
  }
}
