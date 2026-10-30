import { Component, signal } from '@angular/core';
import type { GridColumn } from '@slotted/core/grid';
import { SlDataGrid } from '@slotted/angular/data-grid';

interface Shipment {
  id: string;
  customer: string;
  destination: string;
  carrier: string;
  status: string;
  shipped: string;
  weight: number;
  cost: number;
  priority: boolean;
}

const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];
const STATUSES = ['In transit', 'Delivered', 'Delayed', 'Customs'];

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });
const money = (value: unknown) => (typeof value === 'number' ? USD.format(value) : '');
const kilograms = (value: unknown) => (typeof value === 'number' ? `${value.toFixed(1)} kg` : '');

const COLUMNS: GridColumn<Shipment>[] = [
  { id: 'id', label: 'Shipment', accessor: 'id', rowHeader: true, width: 120, text: 'nowrap' },
  { id: 'customer', label: 'Customer', accessor: 'customer', flex: 1, minWidth: 180 },
  { id: 'destination', label: 'Destination', accessor: 'destination', width: 170 },
  {
    id: 'carrier',
    label: 'Carrier',
    accessor: 'carrier',
    kind: 'set',
    width: 110,
    options: CARRIERS.map((value) => ({ value, label: value })),
  },
  {
    id: 'status',
    label: 'Status',
    accessor: 'status',
    kind: 'set',
    width: 120,
    options: STATUSES.map((value) => ({ value, label: value })),
  },
  { id: 'shipped', label: 'Shipped', accessor: 'shipped', kind: 'date', width: 130 },
  {
    id: 'weight',
    label: 'Weight',
    accessor: 'weight',
    kind: 'number',
    width: 110,
    format: kilograms,
  },
  { id: 'cost', label: 'Cost', accessor: 'cost', kind: 'number', width: 120, format: money },
];

const ROWS = [] as Shipment[];

@Component({
  selector: 'app-data-grid-error',
  imports: [SlDataGrid],
  template: `
    <sl-data-grid
      aria-label="Shipments"
      rowKey="id"
      error="The shipments service did not answer within 30 seconds."
      height="18rem"
      (retry)="attempts.set(attempts() + 1)"
      [columns]="columns"
      [rows]="rows"
    ></sl-data-grid>
  `,
})
export class DataGridError {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  readonly attempts = signal(0);
}
