import { Component, signal } from '@angular/core';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSelect,
} from '@slotted/angular/table';

const RATES = [
  { id: 'ups-ground', carrier: 'UPS Ground', days: '3–5 days', price: '$18.40' },
  { id: 'fedex-2day', carrier: 'FedEx 2Day', days: '2 days', price: '$31.15' },
  { id: 'usps-priority', carrier: 'USPS Priority', days: '1–3 days', price: '$24.90' },
];

@Component({
  selector: 'app-table-single-selection',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSelect,
  ],
  template: `
    <div slTable [columns]="4" selectionMode="single" [(value)]="rate">
      <div slTableContent aria-label="Shipping rates for SO-10423">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader></th>
            <th slTableColumnHeader>Carrier</th>
            <th slTableColumnHeader>Transit</th>
            <th slTableColumnHeader numeric>Price</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (option of rates; track option.id) {
            <tr slTableRow [value]="option.id">
              <td slTableSelect></td>
              <th slTableRowHeader>{{ option.carrier }}</th>
              <td slTableCell>{{ option.days }}</td>
              <td slTableCell numeric>{{ option.price }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableSingleSelection {
  readonly rates = RATES;
  readonly rate = signal<readonly string[]>(['ups-ground']);
}
