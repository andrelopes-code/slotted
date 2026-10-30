import { Component, computed, signal } from '@angular/core';
import { emptyQuery, type GridColumn, type GridQuery } from '@slotted/core/grid';
import { SlDataGrid } from '@slotted/angular/data-grid';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

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

const CUSTOMERS = [
  'Alfreds Futterkiste',
  "Bon app'",
  'Ernst Handel',
  'Folk och fä HB',
  'Hanari Carnes',
  'Island Trading',
  'QUICK-Stop',
  'Wartian Herkku',
];
const DESTINATIONS = [
  'Berlin, DE',
  'Marseille, FR',
  'Graz, AT',
  'Bräcke, SE',
  'Rio de Janeiro, BR',
  'Cowes, UK',
  'Boise, US',
  'Oulu, FI',
];
const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];
const STATUSES = ['In transit', 'Delivered', 'Delayed', 'Customs'];

function shipments(count: number): Shipment[] {
  let seed = 7;
  const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!;
  return Array.from({ length: count }, (_, index) => {
    const weight = Math.round(next() * 9000) / 10;
    return {
      id: `SH-${3301 + index}`,
      customer: pick(CUSTOMERS),
      destination: pick(DESTINATIONS),
      carrier: pick(CARRIERS),
      status: pick(STATUSES),
      shipped: `2026-09-${String(1 + Math.floor(next() * 28)).padStart(2, '0')}`,
      weight,
      cost: Math.round(weight * (2 + next() * 3) * 100) / 100,
      priority: next() < 0.3,
    };
  });
}

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

const ROWS = shipments(12);

@Component({
  selector: 'app-data-grid-sorting',
  imports: [SlDataGrid, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <span slText size="sm" tone="muted">Sorted by: {{ order() }}</span>
      <sl-data-grid
        aria-label="Shipments"
        rowKey="id"
        height="22rem"
        [(query)]="query"
        [columns]="columns"
        [rows]="rows"
      ></sl-data-grid>
    </div>
  `,
})
export class DataGridSorting {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  readonly query = signal<GridQuery>({
    ...emptyQuery(),
    sort: [
      { column: 'carrier', direction: 'ascending' },
      { column: 'cost', direction: 'descending' },
    ],
  });
  readonly order = computed(
    () =>
      this.query()
        .sort.map((key) => `${key.column} ${key.direction}`)
        .join(', ') || 'none',
  );
}
