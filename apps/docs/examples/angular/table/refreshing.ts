import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
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

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const PURCHASE_ORDERS = [
  { id: 'PO-7710', supplier: 'Exotic Liquids', expected: 'Oct 3', value: 4120 },
  { id: 'PO-7711', supplier: 'Tokyo Traders', expected: 'Oct 6', value: 2875.5 },
  { id: 'PO-7712', supplier: 'Pavlova, Ltd.', expected: 'Oct 8', value: 9310 },
];

@Component({
  selector: 'app-table-refreshing',
  imports: [
    SlButton,
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
    <div slStack align="start" [gap]="3">
      <button
        slButton
        type="button"
        size="sm"
        variant="outline"
        [loading]="loading()"
        (click)="refresh()"
      >
        Refresh
      </button>
      <div slTable [columns]="4" [loading]="loading()">
        <div slTableContent aria-label="Purchase orders">
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Purchase order</th>
              <th slTableColumnHeader>Supplier</th>
              <th slTableColumnHeader>Expected</th>
              <th slTableColumnHeader numeric>Value</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (order of orders; track order.id) {
              <tr slTableRow [value]="order.id">
                <th slTableRowHeader text="nowrap">{{ order.id }}</th>
                <td slTableCell>{{ order.supplier }}</td>
                <td slTableCell>{{ order.expected }}</td>
                <td slTableCell numeric>{{ usd.format(order.value) }}</td>
              </tr>
            }
          </tbody>
        </div>
      </div>
    </div>
  `,
})
export class TableRefreshing {
  readonly orders = PURCHASE_ORDERS;
  readonly usd = USD;
  readonly loading = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  refresh(): void {
    this.loading.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.loading.set(false), 1500);
  }
}
