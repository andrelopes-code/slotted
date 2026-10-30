import { Component } from '@angular/core';
import {
  SlTable,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableLoader,
  SlTableRow,
} from '@slotted/angular/table';

@Component({
  selector: 'app-table-loading',
  imports: [SlTable, SlTableColumnHeader, SlTableContent, SlTableHead, SlTableLoader, SlTableRow],
  template: `
    <div slTable [columns]="4">
      <div slTableContent aria-label="Purchase orders">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Purchase order</th>
            <th slTableColumnHeader>Supplier</th>
            <th slTableColumnHeader>Expected</th>
            <th slTableColumnHeader numeric>Value</th>
          </tr>
        </thead>
        <tbody slTableLoader [skeletonRows]="4"></tbody>
      </div>
    </div>
  `,
})
export class TableLoading {}
