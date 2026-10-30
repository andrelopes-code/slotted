import { Component, computed, signal } from '@angular/core';
import { createFilterPredicate, type SetFilter } from '@slotted/core/filter';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnActions,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSetFilter,
} from '@slotted/angular/table';

const ORDERS = [
  { id: 'SO-10421', customer: 'Alfreds Futterkiste', warehouse: 'Reno', status: 'Shipped' },
  { id: 'SO-10422', customer: "Bon app'", warehouse: 'Columbus', status: 'Processing' },
  { id: 'SO-10423', customer: 'Ernst Handel', warehouse: 'Savannah', status: 'On hold' },
  { id: 'SO-10424', customer: 'Folk och fä HB', warehouse: 'Reno', status: 'Delivered' },
  { id: 'SO-10425', customer: 'QUICK-Stop', warehouse: 'Columbus', status: 'Shipped' },
  { id: 'SO-10426', customer: 'Hanari Carnes', warehouse: 'Savannah', status: 'Processing' },
];

const STATUSES = ['Processing', 'On hold', 'Shipped', 'Delivered'].map((value) => ({
  value,
  count: ORDERS.filter((order) => order.status === value).length,
}));

@Component({
  selector: 'app-table-filter',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnActions,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSetFilter,
  ],
  template: `
    <div slTable [columns]="4">
      <div slTableContent aria-label="Open orders">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Warehouse</th>
            <th slTableColumnHeader>
              Status
              <span slTableColumnActions>
                <span
                  slTableSetFilter
                  columnLabel="status"
                  [options]="statuses"
                  [(value)]="status"
                ></span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of rows(); track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader text="nowrap">{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell>{{ order.warehouse }}</td>
              <td slTableCell>{{ order.status }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableFilter {
  readonly statuses = STATUSES;
  readonly status = signal<SetFilter | null>(null);
  readonly rows = computed(() => {
    const keep = createFilterPredicate(this.status());
    return ORDERS.filter((order) => keep(order.status));
  });
}
