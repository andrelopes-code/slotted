import { Component, computed, signal } from '@angular/core';
import { createFilterPredicate, type SetFilter } from '@slotted/core/filter';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnActions,
  SlTableColumnHeader,
  SlTableContent,
  SlTableFooter,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSelect,
  SlTableSelectAll,
  SlTableSetFilter,
  SlTableSort,
  type TableSortDescriptor,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const CUSTOMERS = [
  'Alfreds Futterkiste',
  "Bon app'",
  'Ernst Handel',
  'Folk och fä HB',
  'Hanari Carnes',
  'Island Trading',
  'QUICK-Stop',
];
const STATUS_CYCLE = ['Processing', 'Shipped', 'On hold', 'Delivered', 'Processing'];

const ORDERS = Array.from({ length: 20 }, (_, index) => ({
  id: `SO-${10421 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  status: STATUS_CYCLE[index % STATUS_CYCLE.length],
  total: 140 + ((index * 733) % 4100),
}));

type Order = (typeof ORDERS)[number];

const STATUSES = ['Processing', 'On hold', 'Shipped', 'Delivered'].map((value) => ({
  value,
  count: ORDERS.filter((order) => order.status === value).length,
}));

const PAGE_SIZE = 6;

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
  selector: 'app-table-orders-list',
  imports: [
    SlButton,
    SlInline,
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnActions,
    SlTableColumnHeader,
    SlTableContent,
    SlTableFooter,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSelect,
    SlTableSelectAll,
    SlTableSetFilter,
    SlTableSort,
    SlText,
  ],
  template: `
    <div slTable [columns]="5" selectionMode="multiple" [(sort)]="sort" [(value)]="chosen">
      <div slTableContent aria-label="Orders" [totalRowCount]="matching().length">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableSelectAll></th>
            <th slTableColumnHeader column="id"><button slTableSort>Order</button></th>
            <th slTableColumnHeader column="customer"><button slTableSort>Customer</button></th>
            <th slTableColumnHeader>
              Status
              <span slTableColumnActions>
                <span
                  slTableSetFilter
                  columnLabel="status"
                  [options]="statuses"
                  [value]="status()"
                  (valueChange)="filter($event)"
                ></span>
              </span>
            </th>
            <th slTableColumnHeader column="total" numeric><button slTableSort>Total</button></th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of rows(); track order.id; let index = $index) {
            <tr slTableRow [value]="order.id" [rowIndex]="first() + index + 1">
              <td slTableSelect></td>
              <th slTableRowHeader text="nowrap">{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell>{{ order.status }}</td>
              <td slTableCell numeric>{{ usd.format(order.total) }}</td>
            </tr>
          }
        </tbody>
      </div>
      <div slTableFooter>
        <div slInline align="center" [gap]="3">
          <span slText size="sm" tone="muted">{{ chosen().length }} selected</span>
          <button
            slButton
            type="button"
            size="sm"
            variant="outline"
            [disabled]="chosen().length === 0"
          >
            Print packing slips
          </button>
        </div>
        <nav
          slPagination
          [count]="matching().length"
          [page]="page()"
          [pageSize]="pageSize"
          (pageChange)="page.set($event.value)"
        >
          <button slPaginationPrevious type="button"></button>
          <sl-pagination-items></sl-pagination-items>
          <button slPaginationNext type="button"></button>
        </nav>
      </div>
    </div>
  `,
})
export class TableOrdersList {
  readonly statuses = STATUSES;
  readonly pageSize = PAGE_SIZE;
  readonly usd = USD;
  readonly sort = signal<TableSortDescriptor | null>({ column: 'id', direction: 'descending' });
  readonly status = signal<SetFilter | null>(null);
  readonly chosen = signal<readonly string[]>([]);
  readonly page = signal(1);

  readonly matching = computed(() => {
    const keep = createFilterPredicate(this.status());
    return sortOrders(
      ORDERS.filter((order) => keep(order.status)),
      this.sort(),
    );
  });
  readonly first = computed(() => (this.page() - 1) * PAGE_SIZE);
  readonly rows = computed(() => this.matching().slice(this.first(), this.first() + PAGE_SIZE));

  filter(next: SetFilter | null): void {
    this.status.set(next);
    this.page.set(1);
  }
}
