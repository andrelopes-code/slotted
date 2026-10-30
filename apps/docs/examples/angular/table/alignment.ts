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
} from '@slotted/angular/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const INVOICES = [
  { id: 'INV-2041', customer: 'Alfreds Futterkiste', region: 'EU', due: 'Oct 4', amount: 1240 },
  {
    id: 'INV-2042',
    customer: 'Great Lakes Food Market',
    region: 'NA',
    due: 'Oct 9',
    amount: 18402.75,
  },
  { id: 'INV-2043', customer: 'Hanari Carnes', region: 'SA', due: 'Oct 12', amount: 86.4 },
];

@Component({
  selector: 'app-table-alignment',
  imports: [
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
    <div slTable [columns]="4">
      <div slTableContent aria-label="Invoices due">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader align="center">Region</th>
            <th slTableColumnHeader align="end">Due</th>
            <th slTableColumnHeader numeric>Amount</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (invoice of invoices; track invoice.id) {
            <tr slTableRow [value]="invoice.id">
              <th slTableRowHeader>{{ invoice.customer }}</th>
              <td slTableCell align="center">{{ invoice.region }}</td>
              <td slTableCell align="end">{{ invoice.due }}</td>
              <td slTableCell numeric>{{ usd.format(invoice.amount) }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableAlignment {
  readonly invoices = INVOICES;
  readonly usd = USD;
}
