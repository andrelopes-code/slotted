import type { GridColumn } from '@slotted/core/grid';
import { Badge } from '@slotted/react/badge';
import { DataGrid } from '@slotted/react/data-grid';

interface Order {
  id: string;
  customer: string;
  warehouse: string;
  status: string;
  placed: string;
  total: number;
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
const WAREHOUSES = ['Reno', 'Columbus', 'Savannah'];
const STATUSES = ['Processing', 'Shipped', 'On hold', 'Delivered'];

const ORDERS: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: `SO-${10421 + index}`,
  customer: CUSTOMERS[(index * 5) % CUSTOMERS.length]!,
  warehouse: WAREHOUSES[index % WAREHOUSES.length]!,
  status: STATUSES[(index * 3) % STATUSES.length]!,
  placed: `2026-09-${String(1 + (index % 28)).padStart(2, '0')}`,
  total: 140 + ((index * 733) % 4100),
}));

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const TONE: Record<string, 'accent' | 'secondary' | 'success' | 'warning'> = {
  Delivered: 'success',
  'On hold': 'warning',
  Processing: 'accent',
  Shipped: 'secondary',
};

const columns: GridColumn<Order>[] = [
  { id: 'id', label: 'Order', accessor: 'id', rowHeader: true, width: 120, sortable: true },
  {
    id: 'customer',
    label: 'Customer',
    accessor: 'customer',
    flex: 1,
    minWidth: 180,
    sortable: true,
  },
  { id: 'warehouse', label: 'Warehouse', accessor: 'warehouse', width: 130, sortable: true },
  { id: 'status', label: 'Status', accessor: 'status', width: 130, sortable: true },
  { id: 'placed', label: 'Placed', accessor: 'placed', kind: 'date', width: 130, sortable: true },
  {
    id: 'total',
    label: 'Total',
    accessor: 'total',
    numeric: true,
    width: 130,
    sortable: true,
    format: (value) => USD.format(value as number),
  },
];

export default function DataGridBasic() {
  return (
    <DataGrid
      aria-label="Orders"
      cellRenderers={{
        status: ({ value }) => (
          <Badge tone={TONE[String(value)]} variant="soft">
            {String(value)}
          </Badge>
        ),
      }}
      columns={columns}
      height="24rem"
      rowKey="id"
      rows={ORDERS}
      selectionMode="multiple"
    />
  );
}
