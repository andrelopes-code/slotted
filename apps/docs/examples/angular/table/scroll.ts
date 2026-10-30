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

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const SHIPMENTS = [
  {
    id: 'SH-3301',
    order: 'SO-10421',
    customer: 'Alfreds Futterkiste',
    origin: 'Reno, NV',
    destination: 'Berlin, DE',
    carrier: 'UPS Worldwide',
    shipped: 'Sep 28, 2026',
    cost: 412.8,
  },
  {
    id: 'SH-3302',
    order: 'SO-10422',
    customer: "Bon app'",
    origin: 'Columbus, OH',
    destination: 'Marseille, FR',
    carrier: 'FedEx International',
    shipped: 'Sep 29, 2026',
    cost: 288.15,
  },
  {
    id: 'SH-3303',
    order: 'SO-10423',
    customer: 'Ernst Handel',
    origin: 'Savannah, GA',
    destination: 'Graz, AT',
    carrier: 'DHL Express',
    shipped: 'Sep 29, 2026',
    cost: 506.4,
  },
  {
    id: 'SH-3304',
    order: 'SO-10425',
    customer: 'QUICK-Stop',
    origin: 'Columbus, OH',
    destination: 'Cunewalde, DE',
    carrier: 'UPS Worldwide',
    shipped: 'Sep 30, 2026',
    cost: 347.9,
  },
];

@Component({
  selector: 'app-table-scroll',
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
    <div slTable [columns]="8">
      <div slTableContent aria-label="International shipments">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader sticky="start" text="nowrap">Shipment</th>
            <th slTableColumnHeader text="nowrap">Order</th>
            <th slTableColumnHeader text="nowrap">Customer</th>
            <th slTableColumnHeader text="nowrap">Origin</th>
            <th slTableColumnHeader text="nowrap">Destination</th>
            <th slTableColumnHeader text="nowrap">Carrier</th>
            <th slTableColumnHeader text="nowrap">Shipped</th>
            <th slTableColumnHeader numeric text="nowrap">Cost</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (shipment of shipments; track shipment.id) {
            <tr slTableRow [value]="shipment.id">
              <th slTableRowHeader sticky="start" text="nowrap">{{ shipment.id }}</th>
              <td slTableCell text="nowrap">{{ shipment.order }}</td>
              <td slTableCell text="nowrap">{{ shipment.customer }}</td>
              <td slTableCell text="nowrap">{{ shipment.origin }}</td>
              <td slTableCell text="nowrap">{{ shipment.destination }}</td>
              <td slTableCell text="nowrap">{{ shipment.carrier }}</td>
              <td slTableCell text="nowrap">{{ shipment.shipped }}</td>
              <td slTableCell numeric>{{ usd.format(shipment.cost) }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class TableScroll {
  readonly shipments = SHIPMENTS;
  readonly usd = USD;
}
