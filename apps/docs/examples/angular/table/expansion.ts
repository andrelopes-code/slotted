import { Component, signal } from '@angular/core';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableDetail,
  SlTableExpander,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const RETURNS = [
  {
    id: 'RMA-0811',
    order: 'SO-10398',
    customer: 'Ernst Handel',
    refund: 214.5,
    detail:
      'Two cases of Chang arrived crushed. Carrier claim filed with UPS on Sep 24; refund issued to the original card.',
  },
  {
    id: 'RMA-0812',
    order: 'SO-10402',
    customer: 'QUICK-Stop',
    refund: 58,
    detail:
      'Wrong flavour shipped. Replacement sent from Columbus; the returned jar goes back to stock after inspection.',
  },
  {
    id: 'RMA-0813',
    order: 'SO-10407',
    customer: 'Hanari Carnes',
    refund: 1120,
    detail:
      'Order cancelled after dispatch. Pallet returned to Savannah unopened; restocking fee waived by account manager.',
  },
];

@Component({
  selector: 'app-table-expansion',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableDetail,
    SlTableExpander,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slTable [columns]="5" [(expanded)]="expanded">
      <div slTableContent aria-label="Returns">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader></th>
            <th slTableColumnHeader>Return</th>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader numeric>Refund</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (item of returns; track item.id) {
            <tr slTableRow [value]="item.id" #row="slTableRow">
              <td slTableCell><button slTableExpander></button></td>
              <th slTableRowHeader text="nowrap">{{ item.id }}</th>
              <td slTableCell>{{ item.order }}</td>
              <td slTableCell>{{ item.customer }}</td>
              <td slTableCell numeric>{{ usd.format(item.refund) }}</td>
            </tr>
            @if (row.expanded()) {
              <tr slTableDetail [value]="item.id">
                {{
                  item.detail
                }}
              </tr>
            }
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableExpansion {
  readonly returns = RETURNS;
  readonly usd = USD;
  readonly expanded = signal<readonly string[]>(['RMA-0811']);
}
