import { Component } from '@angular/core';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSummary,
} from '@slotted/angular/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const CUSTOMERS = [
  'Alfreds Futterkiste',
  "Bon app'",
  'Ernst Handel',
  'Folk och fä HB',
  'Hanari Carnes',
  'Island Trading',
  'QUICK-Stop',
  'Wartian Herkku',
];
const WAREHOUSES = ['Reno', 'Columbus', 'Savannah'];

const ORDERS = Array.from({ length: 30 }, (_, index) => ({
  id: `SO-${10400 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  warehouse: WAREHOUSES[index % WAREHOUSES.length],
  total: 180 + ((index * 397) % 2400),
}));

@Component({
  selector: 'app-table-sticky',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSummary,
  ],
  template: `
    <div slTable [columns]="4" stickyFooter stickyHeader>
      <div slTableContent aria-label="September orders" style="max-block-size: 20rem">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Warehouse</th>
            <th slTableColumnHeader numeric>Total</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of orders; track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader text="nowrap">{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell>{{ order.warehouse }}</td>
              <td slTableCell numeric>{{ usd.format(order.total) }}</td>
            </tr>
          }
        </tbody>
        <tfoot slTableSummary>
          <tr slTableRow>
            <td slTableCell [attr.colspan]="3">{{ orders.length }} orders</td>
            <td slTableCell numeric>{{ usd.format(total) }}</td>
          </tr>
        </tfoot>
      </div>
    </div>
  `,
})
export class TableSticky {
  readonly orders = ORDERS;
  readonly total = ORDERS.reduce((sum, order) => sum + order.total, 0);
  readonly usd = USD;
}
