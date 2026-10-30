import { Component, computed, signal } from '@angular/core';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSort,
  type TableSortDescriptor,
} from '@slotted/angular/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const ORDERS = [
  { id: 'SO-10421', customer: 'Alfreds Futterkiste', placed: '2026-09-28', total: 1240 },
  { id: 'SO-10422', customer: "Bon app'", placed: '2026-09-29', total: 860.5 },
  { id: 'SO-10423', customer: 'Ernst Handel', placed: '2026-09-27', total: 3410.25 },
  { id: 'SO-10424', customer: 'Folk och fä HB', placed: '2026-09-30', total: 512 },
];

type Order = (typeof ORDERS)[number];

function sortOrders(rows: readonly Order[], sort: TableSortDescriptor | null): readonly Order[] {
  if (sort === null) return rows;
  const key = sort.column as keyof Order;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) =>
    typeof a[key] === 'number'
      ? ((a[key] as number) - (b[key] as number)) * sign
      : String(a[key]).localeCompare(String(b[key])) * sign,
  );
}

@Component({
  selector: 'app-table-sorting',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSort,
  ],
  template: `
    <div slTable [columns]="4" [(sort)]="sort">
      <div slTableContent aria-label="Recent orders">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader column="id"><button slTableSort>Order</button></th>
            <th slTableColumnHeader column="customer"><button slTableSort>Customer</button></th>
            <th slTableColumnHeader column="placed"><button slTableSort>Placed</button></th>
            <th slTableColumnHeader column="total" numeric><button slTableSort>Total</button></th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of rows(); track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader text="nowrap">{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell text="nowrap">{{ order.placed }}</td>
              <td slTableCell numeric>{{ usd.format(order.total) }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableSorting {
  readonly sort = signal<TableSortDescriptor | null>({ column: 'placed', direction: 'descending' });
  readonly rows = computed(() => sortOrders(ORDERS, this.sort()));
  readonly usd = USD;
}
