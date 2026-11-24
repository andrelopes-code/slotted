import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-visually-hidden-table-heading',
  imports: [
    SlButton,
    SlGlyph,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlVisuallyHidden,
  ],
  template: `
    <div slTable [columns]="3">
      <div slTableContent>
        <caption slTableCaption>
          Orders placed today
        </caption>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader numeric>Total</th>
            <th slTableColumnHeader><span slVisuallyHidden>Actions</span></th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of orders; track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader>{{ order.id }}</th>
              <td slTableCell numeric>{{ order.total }}</td>
              <td slTableCell>
                <button slButton tone="danger" variant="ghost">
                  <svg slGlyph name="trash"></svg>
                  <span slVisuallyHidden>Cancel order {{ order.id }}</span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class VisuallyHiddenTableHeading {
  protected readonly orders = [
    { id: 'SO-10421', total: '$1,240.00' },
    { id: 'SO-10422', total: '$860.50' },
    { id: 'SO-10423', total: '$3,410.25' },
  ] as const;
}
