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

const STOCK = [
  { sku: 'PRD-0412', product: 'Chai', warehouse: 'Reno', onHand: 390, reserved: 42 },
  { sku: 'PRD-0413', product: 'Chang', warehouse: 'Reno', onHand: 170, reserved: 12 },
  { sku: 'PRD-0414', product: 'Aniseed Syrup', warehouse: 'Columbus', onHand: 130, reserved: 70 },
  {
    sku: 'PRD-0415',
    product: "Chef Anton's Cajun Seasoning",
    warehouse: 'Savannah',
    onHand: 530,
    reserved: 0,
  },
  {
    sku: 'PRD-0416',
    product: "Grandma's Boysenberry Spread",
    warehouse: 'Columbus',
    onHand: 120,
    reserved: 25,
  },
  {
    sku: 'PRD-0417',
    product: 'Northwoods Cranberry Sauce',
    warehouse: 'Reno',
    onHand: 60,
    reserved: 60,
  },
];

@Component({
  selector: 'app-table-striped',
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
    <div slTable [columns]="5" striped>
      <div slTableContent aria-label="Stock on hand">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>SKU</th>
            <th slTableColumnHeader>Product</th>
            <th slTableColumnHeader>Warehouse</th>
            <th slTableColumnHeader numeric>On hand</th>
            <th slTableColumnHeader numeric>Reserved</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (item of stock; track item.sku) {
            <tr slTableRow [value]="item.sku">
              <th slTableRowHeader text="nowrap">{{ item.sku }}</th>
              <td slTableCell>{{ item.product }}</td>
              <td slTableCell>{{ item.warehouse }}</td>
              <td slTableCell numeric>{{ item.onHand }}</td>
              <td slTableCell numeric>{{ item.reserved }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableStriped {
  readonly stock = STOCK;
}
