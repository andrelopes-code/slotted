import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
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
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

const ORDERS = [
  { id: 'SO-1182', customer: 'Contoso Foods', total: '$1,240.00', amount: '1240.00', card: '4242' },
  { id: 'SO-1183', customer: 'Fabrikam Grocers', total: '$386.50', amount: '386.50', card: '1881' },
  {
    id: 'SO-1184',
    customer: 'Tailspin Market',
    total: '$2,075.25',
    amount: '2075.25',
    card: '0005',
  },
];

type Order = (typeof ORDERS)[number];

@Component({
  selector: 'app-dialog-row-action',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlField,
    SlFieldLabel,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTextField,
    SlTextFieldInput,
    SlVisuallyHidden,
  ],
  template: `
    <div slTable [columns]="4">
      <div slTableContent>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader numeric>Total</th>
            <th slTableColumnHeader><span slVisuallyHidden>Actions</span></th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (row of orders; track row.id) {
            <tr slTableRow [value]="row.id">
              <th slTableRowHeader>{{ row.id }}</th>
              <td slTableCell>{{ row.customer }}</td>
              <td slTableCell numeric>{{ row.total }}</td>
              <td slTableCell>
                <button
                  slButton
                  size="sm"
                  tone="secondary"
                  variant="ghost"
                  [attr.aria-label]="'Refund ' + row.id"
                  (click)="refund(row)"
                >
                  Refund
                </button>
              </td>
            </tr>
          }
        </tbody>
      </div>
    </div>
    <sl-dialog size="sm" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>Refund {{ order().id }}</h2>
        <p slDialogDescription>
          {{ order().customer }} paid {{ order().total }} with the card ending {{ order().card }}.
        </p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slField>
          <label slFieldLabel>Amount in US dollars</label>
          <div slTextField>
            <input slTextFieldInput inputmode="decimal" [value]="order().amount" />
          </div>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">Cancel</button>
        <button slButton (click)="open.set(false)">Issue refund</button>
      </footer>
    </sl-dialog>
  `,
})
export class DialogRowAction {
  readonly orders = ORDERS;
  readonly open = signal(false);
  readonly order = signal<Order>(ORDERS[0]!);

  refund(row: Order): void {
    this.order.set(row);
    this.open.set(true);
  }
}
