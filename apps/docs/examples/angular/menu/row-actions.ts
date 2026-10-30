import { Component, signal } from '@angular/core';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import {
  SlAlertDialog,
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
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

interface Order {
  id: string;
  customer: string;
  total: string;
}

const ORDERS: Order[] = [
  { id: 'SO-10482', customer: 'Northwind Traders', total: '$1,240.00' },
  { id: 'SO-10483', customer: 'Contoso Foods', total: '$860.50' },
  { id: 'SO-10484', customer: 'Fabrikam Supply', total: '$2,315.75' },
];

@Component({
  selector: 'app-menu-row-actions',
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
    SlButton,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlGlyph,
    SlIconButton,
    SlMenu,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
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
      <div slTableContent>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader numeric>Total</th>
            <th slTableColumnHeader align="end">Actions</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of orders(); track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader>{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell numeric>{{ order.total }}</td>
              <td slTableCell align="end">
                <button
                  slIconButton
                  size="sm"
                  [attr.aria-label]="'Actions for ' + order.id"
                  [slMenuTriggerFor]="actions"
                >
                  <svg slGlyph name="ellipsis"></svg>
                </button>
                <sl-menu #actions align="end">
                  <button slMenuItem>View order</button>
                  <button slMenuItem shortcut="Mod+D">Duplicate</button>
                  <hr slMenuSeparator />
                  <button slMenuItem tone="danger" (select)="confirm(order)">Delete order…</button>
                </sl-menu>
              </td>
            </tr>
          }
        </tbody>
      </div>
    </div>
    <sl-alert-dialog [(open)]="confirming">
      <header slDialogHeader>
        <span slAlertDialogIcon></span>
        <h2 slDialogTitle>Delete {{ pending()?.id }}?</h2>
        <p slDialogDescription>
          The order for {{ pending()?.customer }} and its invoice are removed. This cannot be
          undone.
        </p>
      </header>
      <footer slDialogFooter>
        <button slButton slAlertDialogCancel tone="secondary" variant="outline">Keep order</button>
        <button slButton slAlertDialogAction tone="danger" (click)="remove()">Delete order</button>
      </footer>
    </sl-alert-dialog>
  `,
})
export class MenuRowActions {
  protected readonly orders = signal(ORDERS);
  protected readonly pending = signal<Order | null>(null);
  protected readonly confirming = signal(false);

  protected confirm(order: Order): void {
    this.pending.set(order);
    this.confirming.set(true);
  }

  protected remove(): void {
    const id = this.pending()?.id;
    this.orders.update((rows) => rows.filter((row) => row.id !== id));
  }
}
