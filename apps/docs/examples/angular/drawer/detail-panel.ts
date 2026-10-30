import { Component, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerTitle,
} from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
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
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

const ORDERS = [
  {
    id: 'SO-1182',
    customer: 'Contoso Foods',
    city: 'Seattle, WA',
    status: 'Ready to ship',
    tone: 'accent',
    items: '14 cases, 3 products',
    total: '$1,240.00',
  },
  {
    id: 'SO-1183',
    customer: 'Fabrikam Grocers',
    city: 'Portland, OR',
    status: 'Shipped',
    tone: 'success',
    items: '6 cases, 2 products',
    total: '$386.50',
  },
  {
    id: 'SO-1184',
    customer: 'Tailspin Market',
    city: 'Boise, ID',
    status: 'On hold',
    tone: 'warning',
    items: '22 cases, 5 products',
    total: '$2,075.25',
  },
  {
    id: 'SO-1185',
    customer: 'Adventure Works',
    city: 'Denver, CO',
    status: 'Ready to ship',
    tone: 'accent',
    items: '9 cases, 4 products',
    total: '$918.00',
  },
] as const;

type Order = (typeof ORDERS)[number];

@Component({
  selector: 'app-drawer-detail-panel',
  imports: [
    SlBadge,
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerTitle,
    SlInline,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
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
                  [attr.aria-label]="'View ' + row.id"
                  (click)="view(row)"
                >
                  View
                </button>
              </td>
            </tr>
          }
        </tbody>
      </div>
    </div>
    <sl-drawer [modal]="false" outsidePress="none" [scrimFrom]="1" size="sm" [(open)]="open">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Order {{ order().id }}</h2>
        <p slDrawerDescription>{{ order().customer }}, {{ order().city }}</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slStack [gap]="4">
          <div slInline>
            <span slBadge [tone]="order().tone">{{ order().status }}</span>
          </div>
          <div slDescriptionList>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Items</dt>
              <dd slDescriptionListDescription>{{ order().items }}</dd>
            </div>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Total</dt>
              <dd slDescriptionListDescription>{{ order().total }}</dd>
            </div>
          </div>
        </div>
      </div>
    </sl-drawer>
  `,
})
export class DrawerDetailPanel {
  readonly orders = ORDERS;
  readonly open = signal(false);
  readonly order = signal<Order>(ORDERS[0]);

  view(row: Order): void {
    this.order.set(row);
    this.open.set(true);
  }
}
