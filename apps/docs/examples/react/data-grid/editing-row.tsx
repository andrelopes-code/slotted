import { useState } from 'react';
import type { GridColumn } from '@slotted/core/grid';
import { DataGrid } from '@slotted/react/data-grid';

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
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!;
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

const EDIT_COLUMNS: GridColumn<Shipment>[] = COLUMNS.map((column) =>
  column.id === 'weight'
    ? {
        ...column,
        editable: true,
        validate: (value: unknown) =>
          typeof value === 'number' && value <= 0 ? 'Enter a weight above zero.' : null,
      }
    : ['customer', 'destination', 'carrier'].includes(column.id)
      ? { ...column, editable: true }
      : column,
);

const ROWS = shipments(8);

export default function DataGridEditingRow() {
  const [rows, setRows] = useState(ROWS);

  return (
    <DataGrid
      aria-label="Shipments"
      columns={EDIT_COLUMNS}
      rowKey="id"
      rows={rows}
      editMode="row"
      height="22rem"
      onEditCommit={({ key, changes }) =>
        setRows((current) => current.map((row) => (row.id === key ? { ...row, ...changes } : row)))
      }
    />
  );
}
