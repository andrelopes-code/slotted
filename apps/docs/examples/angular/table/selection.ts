import { Component, computed, signal } from '@angular/core';
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
  SlTableSelect,
  SlTableSelectAll,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const INVOICES = [
  { id: 'INV-2041', customer: 'Alfreds Futterkiste', status: 'Overdue', amount: 1240 },
  { id: 'INV-2042', customer: 'Great Lakes Food Market', status: 'Overdue', amount: 18402.75 },
  { id: 'INV-2043', customer: 'Hanari Carnes', status: 'Draft', amount: 86.4 },
  { id: 'INV-2044', customer: 'Island Trading', status: 'Sent', amount: 2310 },
  { id: 'INV-2045', customer: 'Lonesome Pine Restaurant', status: 'Sent', amount: 645.2 },
];

@Component({
  selector: 'app-table-selection',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableFooter,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSelect,
    SlTableSelectAll,
    SlText,
  ],
  template: `
    <div slTable [columns]="5" selectionMode="multiple" [(value)]="chosen">
      <div slTableContent aria-label="Invoices to send reminders for">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableSelectAll></th>
            <th slTableColumnHeader>Invoice</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Status</th>
            <th slTableColumnHeader numeric>Amount</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (invoice of invoices; track invoice.id) {
            <tr slTableRow [value]="invoice.id" [disabled]="invoice.status === 'Draft'">
              <td slTableSelect></td>
              <th slTableRowHeader text="nowrap">{{ invoice.id }}</th>
              <td slTableCell>{{ invoice.customer }}</td>
              <td slTableCell>{{ invoice.status }}</td>
              <td slTableCell numeric>{{ usd.format(invoice.amount) }}</td>
            </tr>
          }
        </tbody>
      </div>
      <div slTableFooter>
        <span slText size="sm" tone="muted"
          >{{ chosen().length }} selected · {{ usd.format(total()) }}</span
        >
      </div>
    </div>
  `,
})
export class TableSelection {
  readonly invoices = INVOICES;
  readonly usd = USD;
  readonly chosen = signal<readonly string[]>(['INV-2041']);
  readonly total = computed(() =>
    INVOICES.filter((invoice) => this.chosen().includes(invoice.id)).reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    ),
  );
}
