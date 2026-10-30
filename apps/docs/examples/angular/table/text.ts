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

const NOTES = [
  {
    id: 'SO-10421',
    note: 'Leave at the loading dock behind the warehouse; the front office closes at noon on Fridays.',
    tracking: '1Z999AA10123456784',
  },
  {
    id: 'SO-10422',
    note: 'Customer asked for the invoice to be emailed to accounts payable rather than printed.',
    tracking: '1Z999AA10123456785',
  },
];

@Component({
  selector: 'app-table-text',
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
    <div slTable [columns]="3" layout="fixed">
      <div slTableContent aria-label="Delivery notes">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Note</th>
            <th slTableColumnHeader>Tracking</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (row of notes; track row.id) {
            <tr slTableRow [value]="row.id">
              <th slTableRowHeader text="nowrap">{{ row.id }}</th>
              <td slTableCell text="truncate">{{ row.note }}</td>
              <td slTableCell text="wrap">{{ row.tracking }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableText {
  readonly notes = NOTES;
}
