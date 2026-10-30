import { Component } from '@angular/core';
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
import { SlTag, SlTagBody } from '@slotted/angular/tag';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const TONE = {
  Delivered: 'success',
  'On hold': 'warning',
  Processing: 'accent',
  Shipped: 'secondary',
} as const;

const ORDERS = [
  {
    id: 'SO-10421',
    customer: 'Alfreds Futterkiste',
    warehouse: 'Reno',
    status: 'Shipped',
    total: 1240,
  },
  {
    id: 'SO-10422',
    customer: "Bon app'",
    warehouse: 'Columbus',
    status: 'Processing',
    total: 860.5,
  },
  {
    id: 'SO-10423',
    customer: 'Ernst Handel',
    warehouse: 'Savannah',
    status: 'On hold',
    total: 3410.25,
  },
  {
    id: 'SO-10424',
    customer: 'Folk och fä HB',
    warehouse: 'Reno',
    status: 'Delivered',
    total: 512,
  },
  {
    id: 'SO-10425',
    customer: 'QUICK-Stop',
    warehouse: 'Columbus',
    status: 'Shipped',
    total: 2088.9,
  },
] as const;

@Component({
  selector: 'app-table-basic',
  imports: [
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTag,
    SlTagBody,
  ],
  template: `
    <div slTable [columns]="5">
      <div slTableContent>
        <caption slTableCaption>
          Orders placed today
        </caption>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Warehouse</th>
            <th slTableColumnHeader>Status</th>
            <th slTableColumnHeader numeric>Total</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of orders; track order.id) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader text="nowrap">{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell>{{ order.warehouse }}</td>
              <td slTableCell>
                <span slTag [tone]="tone[order.status]"
                  ><span slTagBody>{{ order.status }}</span></span
                >
              </td>
              <td slTableCell numeric>{{ usd.format(order.total) }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableBasic {
  readonly orders = ORDERS;
  readonly tone = TONE;
  readonly usd = USD;
}
