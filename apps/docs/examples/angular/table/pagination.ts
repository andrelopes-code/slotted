import { Component, computed, signal } from '@angular/core';
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
  SlTableColumnHeader,
  SlTableContent,
  SlTableFooter,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
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

const INVOICES = Array.from({ length: 23 }, (_, index) => ({
  id: `INV-${2041 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  amount: 120 + ((index * 613) % 3900),
}));

const PAGE_SIZE = 5;

@Component({
  selector: 'app-table-pagination',
  imports: [
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableFooter,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
  ],
  template: `
    <div slTable [columns]="3">
      <div slTableContent aria-label="Invoices" [totalRowCount]="invoices.length">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Invoice</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader numeric>Amount</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (invoice of rows(); track invoice.id; let index = $index) {
            <tr slTableRow [value]="invoice.id" [rowIndex]="first() + index + 1">
              <th slTableRowHeader text="nowrap">{{ invoice.id }}</th>
              <td slTableCell>{{ invoice.customer }}</td>
              <td slTableCell numeric>{{ usd.format(invoice.amount) }}</td>
            </tr>
          }
        </tbody>
      </div>
      <div slTableFooter>
        <span slText size="sm" tone="muted"
          >{{ first() + 1 }}–{{ first() + rows().length }} of {{ invoices.length }}</span
        >
        <nav
          slPagination
          [count]="invoices.length"
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
export class TablePagination {
  readonly invoices = INVOICES;
  readonly pageSize = PAGE_SIZE;
  readonly usd = USD;
  readonly page = signal(1);
  readonly first = computed(() => (this.page() - 1) * PAGE_SIZE);
  readonly rows = computed(() => INVOICES.slice(this.first(), this.first() + PAGE_SIZE));
}
