import { Component, computed, signal } from '@angular/core';
import { emptyQuery, withSearch, type GridColumn, type GridQuery } from '@slotted/core/grid';
import { SlButton } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
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

const ROWS = shipments(60);

@Component({
  selector: 'app-data-grid-shipments-workspace',
  imports: [
    SlButton,
    SlDataGrid,
    SlDataGridFooter,
    SlInline,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="3">
      <div slTextField clearable>
        <input
          slTextFieldInput
          aria-label="Search shipments"
          placeholder="Search by shipment, customer or destination"
          [value]="query().search"
          (valueChange)="search($event.value)"
        />
      </div>
      <sl-data-grid
        aria-label="Shipments"
        rowKey="id"
        height="26rem"
        selectionMode="multiple"
        [(query)]="query"
        [(value)]="value"
        [columns]="columns"
        [rows]="rows"
      >
        <div slDataGridFooter slInline align="center" [gap]="3">
          <span slText size="sm" tone="muted">{{ count() }} selected</span>
          <button slButton type="button" size="sm" variant="outline" [disabled]="count() === 0">
            Print labels
          </button>
        </div>
      </sl-data-grid>
    </div>
  `,
})
export class DataGridShipmentsWorkspace {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  readonly query = signal<GridQuery>(emptyQuery());
  readonly value = signal<string | readonly string[] | null>([]);
  readonly count = computed(() => {
    const value = this.value();
    return Array.isArray(value) ? value.length : 0;
  });

  search(text: string): void {
    this.query.update((current) => withSearch(current, text).query);
  }
}
