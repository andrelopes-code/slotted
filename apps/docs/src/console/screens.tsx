import type { GridColumn } from '@slotted/core/grid';
import { Download, Plus, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

import { ActionBarAction } from '@slotted/react/action-bar';
import { Avatar } from '@slotted/react/avatar';
import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import type { DataGridCellContext } from '@slotted/react/data-grid';
import type { FilterBarField } from '@slotted/react/filter-bar';
import { Link } from '@slotted/react/link';
import { MenuItem } from '@slotted/react/menu';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { StatusIndicator } from '@slotted/react/status-indicator';

import {
  CARRIERS,
  CATEGORIES,
  CHANNELS,
  CUSTOMERS,
  FULFILLMENTS,
  INVOICES,
  ORDER_STATUSES,
  ORDERS,
  OWNERS,
  PRODUCTS,
  PURCHASE_ORDERS,
  RETURN_REASONS,
  RETURNS,
  SEGMENTS,
  SHIPMENTS,
  WAREHOUSES,
  count,
  daysOfCover,
  daysOverdue,
  instant,
  isLate,
  money,
  shortDate,
  shortDateTime,
  type Customer,
  type Invoice,
  type InvoiceState,
  type Order,
  type Product,
  type PurchaseOrder,
  type PurchaseState,
  type Return,
  type ReturnState,
  type Shipment,
  type ShipmentState,
} from './data';
import { ListPage } from './ListPage';

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }));
const labelOf = <T extends string>(list: readonly { value: T; label: string }[], value: T) =>
  list.find((entry) => entry.value === value)?.label ?? value;
const glyph = (Mark: typeof Plus) => <Mark aria-hidden="true" size={14} strokeWidth={1.75} />;
const SITES = WAREHOUSES.map((warehouse) => ({ value: warehouse.value, label: warehouse.value }));

/** A record's id that opens it: a link-styled button in the row header's cell. */
function OpenLink({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return (
    <Link
      variant="neutral"
      underline="hover"
      href={`#${id}`}
      onClick={(event) => {
        event.preventDefault();
        onOpen(id);
      }}
    >
      {id}
    </Link>
  );
}

function Party({ name }: { name: string }) {
  return (
    <span className="console-person">
      <Avatar name={name} size="xs" decorative />
      <span className="console-cut" title={name}>
        {name}
      </span>
    </span>
  );
}

const bulkAction = (label: string, node: ReactNode, priority?: 'high') => (
  <ActionBarAction key={label} counterpart={<MenuItem>{label}</MenuItem>} priority={priority}>
    {node}
  </ActionBarAction>
);

const exportButton = (
  <Button size="sm" variant="outline" tone="secondary" start={glyph(Download)}>
    Export
  </Button>
);

/* ── Orders ──────────────────────────────────────────────────────────── */

const STATUS_TONE = {
  paid: 'success',
  pending: 'warning',
  'partially-refunded': 'secondary',
  refunded: 'secondary',
  voided: 'danger',
} as const;

const FULFILLMENT_STATUS = {
  unfulfilled: 'neutral',
  picking: 'info',
  packed: 'info',
  shipped: 'info',
  delivered: 'success',
} as const;

const TAG_TONE: Record<string, 'danger' | 'accent' | 'warning' | 'secondary'> = {
  Rush: 'danger',
  VIP: 'accent',
  Fragile: 'warning',
  Gift: 'secondary',
};

const ORDER_COLUMNS: GridColumn<Order>[] = [
  { id: 'id', label: 'Order', rowHeader: true, width: 120, hideable: false },
  {
    id: 'placed',
    label: 'Placed',
    width: 150,
    kind: 'datetime',
    format: (value) => shortDateTime.format(instant(String(value))),
  },
  { id: 'customer', label: 'Customer', flex: 1, minWidth: 220, kind: 'text' },
  { id: 'channel', label: 'Channel', width: 132, kind: 'set', options: CHANNELS },
  { id: 'status', label: 'Payment', width: 140, kind: 'set', options: ORDER_STATUSES },
  { id: 'fulfillment', label: 'Fulfillment', width: 140, kind: 'set', options: FULFILLMENTS },
  { id: 'items', label: 'Items', width: 96, kind: 'number' },
  {
    id: 'total',
    label: 'Total',
    width: 124,
    kind: 'number',
    format: (value) => money.format(Number(value)),
  },
  { id: 'shipBy', label: 'Ship by', width: 116, kind: 'date' },
  { id: 'warehouse', label: 'Site', width: 96, kind: 'set', options: SITES },
  { id: 'carrier', label: 'Carrier', width: 112, kind: 'set', options: options(CARRIERS) },
  {
    id: 'tags',
    label: 'Tags',
    width: 168,
    kind: 'custom',
    accessor: (row) => row.tags.join(', '),
    sortable: false,
  },
];

const ORDER_FIELDS: FilterBarField[] = [
  { key: 'status', kind: 'set', label: 'Payment', options: ORDER_STATUSES, pinned: true },
  { key: 'channel', kind: 'set', label: 'Channel', options: CHANNELS, pinned: true },
  { key: 'warehouse', kind: 'set', label: 'Site', options: SITES, pinned: true },
  { key: 'fulfillment', kind: 'set', label: 'Fulfillment', options: FULFILLMENTS },
  { key: 'carrier', kind: 'set', label: 'Carrier', options: options(CARRIERS) },
  { key: 'total', kind: 'number', label: 'Total', min: 0 },
  { key: 'items', kind: 'number', label: 'Items', min: 1 },
  { key: 'placed', kind: 'datetime', label: 'Placed', section: 'Dates' },
  { key: 'shipBy', kind: 'date', label: 'Ship by', section: 'Dates' },
];

function orderRenderers(onOpen: (id: string) => void) {
  return {
    id: ({ row }: DataGridCellContext<Order>) => <OpenLink id={row.id} onOpen={onOpen} />,
    customer: ({ row }: DataGridCellContext<Order>) => <Party name={row.customer} />,
    status: ({ row }: DataGridCellContext<Order>) => (
      <Badge size="sm" variant="soft" tone={STATUS_TONE[row.status]}>
        {labelOf(ORDER_STATUSES, row.status)}
      </Badge>
    ),
    fulfillment: ({ row }: DataGridCellContext<Order>) => (
      <StatusIndicator size="sm" status={FULFILLMENT_STATUS[row.fulfillment]}>
        {labelOf(FULFILLMENTS, row.fulfillment)}
      </StatusIndicator>
    ),
    shipBy: ({ row }: DataGridCellContext<Order>) => (
      <span className="console-date" data-late={isLate(row) ? '' : undefined}>
        {shortDate.format(instant(row.shipBy))}
      </span>
    ),
    tags: ({ row }: DataGridCellContext<Order>) =>
      row.tags.length === 0 ? (
        <span className="console-muted">—</span>
      ) : (
        <span className="console-tags" title={row.tags.join(' · ')}>
          {row.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} size="sm" variant="soft" tone={TAG_TONE[tag] ?? 'secondary'}>
              {tag}
            </Badge>
          ))}
          {row.tags.length > 2 && <span className="console-muted">+{row.tags.length - 2}</span>}
        </span>
      ),
  };
}

const toShip = (order: Order) =>
  order.status !== 'voided' && ['unfulfilled', 'picking', 'packed'].includes(order.fulfillment);

export function Orders({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <ListPage<Order>
      title="Orders"
      subheading={`${count.format(ORDERS.length)} orders in the last 90 days · all channels`}
      noun={['order', 'orders']}
      actions={
        <>
          {exportButton}
          <Button size="sm" start={glyph(Plus)}>
            New order
          </Button>
        </>
      }
      rows={ORDERS}
      views={[
        { value: 'all', label: 'All' },
        { value: 'to-ship', label: 'To ship', keep: toShip },
        { value: 'late', label: 'Late', keep: isLate },
        { value: 'shipped', label: 'In transit', keep: (order) => order.fulfillment === 'shipped' },
        {
          value: 'refunds',
          label: 'Refunds',
          keep: (order) => order.status === 'refunded' || order.status === 'partially-refunded',
        },
      ]}
      columns={ORDER_COLUMNS}
      rowKey="id"
      fields={ORDER_FIELDS}
      cellRenderers={orderRenderers(onOpen)}
      onOpen={onOpen}
      bulk={() => [
        bulkAction(
          'Print packing slips',
          <Button size="sm" variant="ghost" tone="secondary" start={glyph(Printer)}>
            Print packing slips
          </Button>,
        ),
        bulkAction(
          'Mark as packed',
          <Button size="sm" variant="outline" tone="secondary">
            Mark as packed
          </Button>,
          'high',
        ),
        bulkAction('Create shipments', <Button size="sm">Create shipments</Button>, 'high'),
      ]}
    />
  );
}

/* ── Shipments ───────────────────────────────────────────────────────── */

const SHIPMENT_STATE: Record<
  ShipmentState,
  { status: 'neutral' | 'info' | 'warning' | 'success'; label: string }
> = {
  label: { status: 'neutral', label: 'Label created' },
  'in-transit': { status: 'info', label: 'In transit' },
  'out-for-delivery': { status: 'info', label: 'Out for delivery' },
  delayed: { status: 'warning', label: 'Delayed' },
  delivered: { status: 'success', label: 'Delivered' },
};

const SHIPMENT_STATES = (Object.keys(SHIPMENT_STATE) as ShipmentState[]).map((value) => ({
  value,
  label: SHIPMENT_STATE[value].label,
}));
const SERVICES = options(['Ground', '2-day', 'Overnight']);

export function Shipments({ onOrder }: { onOrder: (id: string) => void }) {
  return (
    <ListPage<Shipment>
      title="Shipments"
      subheading={`${count.format(SHIPMENTS.length)} parcels handed to UPS, FedEx, DHL and USPS`}
      noun={['shipment', 'shipments']}
      actions={exportButton}
      rows={SHIPMENTS}
      views={[
        {
          value: 'moving',
          label: 'In transit',
          keep: (shipment) => shipment.state !== 'delivered' && shipment.state !== 'delayed',
        },
        { value: 'delayed', label: 'Delayed', keep: (shipment) => shipment.state === 'delayed' },
        {
          value: 'delivered',
          label: 'Delivered',
          keep: (shipment) => shipment.state === 'delivered',
        },
        { value: 'all', label: 'All' },
      ]}
      columns={[
        { id: 'id', label: 'Tracking', rowHeader: true, width: 156, hideable: false },
        { id: 'order', label: 'Order', width: 116 },
        { id: 'customer', label: 'Customer', flex: 1, minWidth: 200 },
        { id: 'destination', label: 'Destination', width: 164 },
        { id: 'state', label: 'Status', width: 156, kind: 'set', options: SHIPMENT_STATES },
        { id: 'carrier', label: 'Carrier', width: 112, kind: 'set', options: options(CARRIERS) },
        { id: 'service', label: 'Service', width: 116, kind: 'set', options: SERVICES },
        { id: 'warehouse', label: 'From', width: 92, kind: 'set', options: SITES },
        { id: 'packages', label: 'Parcels', width: 104, kind: 'number' },
        {
          id: 'weight',
          label: 'Weight',
          width: 104,
          kind: 'number',
          format: (value) => `${String(value)} kg`,
        },
        {
          id: 'cost',
          label: 'Postage',
          width: 112,
          kind: 'number',
          format: (value) => money.format(Number(value)),
        },
        {
          id: 'shipped',
          label: 'Shipped',
          width: 150,
          kind: 'datetime',
          format: (value) => shortDateTime.format(instant(String(value))),
        },
        { id: 'eta', label: 'ETA', width: 104, kind: 'date' },
      ]}
      rowKey="id"
      fields={[
        { key: 'carrier', kind: 'set', label: 'Carrier', options: options(CARRIERS), pinned: true },
        { key: 'service', kind: 'set', label: 'Service', options: SERVICES, pinned: true },
        { key: 'warehouse', kind: 'set', label: 'From', options: SITES, pinned: true },
        { key: 'state', kind: 'set', label: 'Status', options: SHIPMENT_STATES },
        { key: 'weight', kind: 'number', label: 'Weight', min: 0 },
        { key: 'eta', kind: 'date', label: 'ETA', section: 'Dates' },
      ]}
      cellRenderers={{
        order: ({ row }) => <OpenLink id={row.order} onOpen={onOrder} />,
        customer: ({ row }) => <Party name={row.customer} />,
        state: ({ row }) => (
          <StatusIndicator size="sm" status={SHIPMENT_STATE[row.state].status}>
            {SHIPMENT_STATE[row.state].label}
          </StatusIndicator>
        ),
        eta: ({ row }) => (
          <span className="console-date" data-late={row.state === 'delayed' ? '' : undefined}>
            {shortDate.format(instant(row.eta))}
          </span>
        ),
      }}
      bulk={() => [
        bulkAction(
          'Print labels',
          <Button size="sm" variant="outline" tone="secondary" start={glyph(Printer)}>
            Print labels
          </Button>,
          'high',
        ),
        bulkAction('Notify customers', <Button size="sm">Notify customers</Button>, 'high'),
      ]}
    />
  );
}

/* ── Returns ─────────────────────────────────────────────────────────── */

const RETURN_STATE: Record<
  ReturnState,
  { tone: 'warning' | 'accent' | 'secondary' | 'success'; label: string }
> = {
  requested: { tone: 'warning', label: 'Requested' },
  'in-transit': { tone: 'accent', label: 'In transit' },
  received: { tone: 'secondary', label: 'Received' },
  refunded: { tone: 'success', label: 'Refunded' },
};
const RETURN_STATES = (Object.keys(RETURN_STATE) as ReturnState[]).map((value) => ({
  value,
  label: RETURN_STATE[value].label,
}));

export function Returns({ onOrder }: { onOrder: (id: string) => void }) {
  return (
    <ListPage<Return>
      title="Returns"
      subheading="Return authorizations, from request to refund"
      noun={['return', 'returns']}
      actions={exportButton}
      rows={RETURNS}
      views={[
        { value: 'open', label: 'Open', keep: (entry) => entry.state !== 'refunded' },
        { value: 'received', label: 'To inspect', keep: (entry) => entry.state === 'received' },
        { value: 'refunded', label: 'Refunded', keep: (entry) => entry.state === 'refunded' },
        { value: 'all', label: 'All' },
      ]}
      columns={[
        { id: 'id', label: 'Return', rowHeader: true, width: 120, hideable: false },
        { id: 'order', label: 'Order', width: 116 },
        { id: 'customer', label: 'Customer', flex: 1, minWidth: 200 },
        { id: 'product', label: 'Product', width: 200 },
        { id: 'quantity', label: 'Qty', width: 84, kind: 'number' },
        {
          id: 'reason',
          label: 'Reason',
          width: 168,
          kind: 'set',
          options: options(RETURN_REASONS),
        },
        {
          id: 'amount',
          label: 'Refund',
          width: 116,
          kind: 'number',
          format: (value) => money.format(Number(value)),
        },
        { id: 'requested', label: 'Requested', width: 124, kind: 'date' },
        { id: 'state', label: 'Status', width: 132, kind: 'set', options: RETURN_STATES },
      ]}
      rowKey="id"
      fields={[
        {
          key: 'reason',
          kind: 'set',
          label: 'Reason',
          options: options(RETURN_REASONS),
          pinned: true,
        },
        { key: 'state', kind: 'set', label: 'Status', options: RETURN_STATES, pinned: true },
        { key: 'amount', kind: 'number', label: 'Refund', min: 0 },
        { key: 'requested', kind: 'date', label: 'Requested', section: 'Dates' },
      ]}
      cellRenderers={{
        order: ({ row }) => <OpenLink id={row.order} onOpen={onOrder} />,
        customer: ({ row }) => <Party name={row.customer} />,
        state: ({ row }) => (
          <Badge size="sm" variant="soft" tone={RETURN_STATE[row.state].tone}>
            {RETURN_STATE[row.state].label}
          </Badge>
        ),
      }}
      bulk={() => [
        bulkAction(
          'Restock',
          <Button size="sm" variant="outline" tone="secondary">
            Restock
          </Button>,
          'high',
        ),
        bulkAction('Refund', <Button size="sm">Refund</Button>, 'high'),
      ]}
    />
  );
}

/* ── Stock ───────────────────────────────────────────────────────────── */

const CATEGORY_OPTIONS = options(CATEGORIES);

export function Stock() {
  return (
    <ListPage<Product>
      title="Stock"
      subheading={`${PRODUCTS.length} products across Reno, Columbus and Savannah · cover at the 30-day sales rate`}
      noun={['product', 'products']}
      actions={
        <>
          {exportButton}
          <Button size="sm" start={glyph(Plus)}>
            Purchase order
          </Button>
        </>
      }
      rows={PRODUCTS}
      views={[
        { value: 'all', label: 'All' },
        { value: 'low', label: 'Low stock', keep: (product) => product.onHand < product.reorderAt },
        { value: 'out', label: 'Out of stock', keep: (product) => product.onHand === 0 },
        { value: 'incoming', label: 'On order', keep: (product) => product.incoming > 0 },
      ]}
      columns={[
        { id: 'sku', label: 'SKU', rowHeader: true, width: 104, hideable: false },
        { id: 'name', label: 'Product', flex: 1, minWidth: 200 },
        { id: 'category', label: 'Category', width: 124, kind: 'set', options: CATEGORY_OPTIONS },
        { id: 'warehouse', label: 'Site', width: 92, kind: 'set', options: SITES },
        { id: 'onHand', label: 'On hand', width: 176, kind: 'number', aggregate: 'sum' },
        { id: 'reserved', label: 'Reserved', width: 112, kind: 'number', aggregate: 'sum' },
        { id: 'incoming', label: 'Incoming', width: 112, kind: 'number', aggregate: 'sum' },
        { id: 'reorderAt', label: 'Reorder at', width: 128, kind: 'number' },
        { id: 'cover', label: 'Cover', width: 104, kind: 'number', accessor: daysOfCover },
        { id: 'velocity', label: 'Sold / day', width: 124, kind: 'number' },
        {
          id: 'price',
          label: 'Price',
          width: 104,
          kind: 'number',
          format: (value) => money.format(Number(value)),
        },
        { id: 'supplier', label: 'Supplier', width: 156 },
      ]}
      rowKey="sku"
      fields={[
        {
          key: 'category',
          kind: 'set',
          label: 'Category',
          options: CATEGORY_OPTIONS,
          pinned: true,
        },
        { key: 'warehouse', kind: 'set', label: 'Site', options: SITES, pinned: true },
        { key: 'onHand', kind: 'number', label: 'On hand', min: 0 },
        { key: 'incoming', kind: 'number', label: 'Incoming', min: 0 },
      ]}
      cellRenderers={{
        onHand: ({ row }) => (
          <span className="console-meter">
            <ProgressBar
              size="sm"
              hideLabel
              label={`${row.name} on hand against four times its reorder point`}
              value={Math.min(row.onHand, row.reorderAt * 4)}
              max={row.reorderAt * 4}
              tone={row.onHand < row.reorderAt ? 'danger' : 'accent'}
            />
            <span className="console-meter-value">{count.format(row.onHand)}</span>
          </span>
        ),
        incoming: ({ row }) =>
          row.incoming === 0 ? (
            <span className="console-muted">—</span>
          ) : (
            count.format(row.incoming)
          ),
        cover: ({ row }) => {
          const cover = daysOfCover(row);
          return (
            <span className="console-cover" data-short={cover < 14 ? '' : undefined}>
              {cover} days
            </span>
          );
        },
      }}
      bulk={() => [
        bulkAction(
          'Create purchase order',
          <Button size="sm">Create purchase order</Button>,
          'high',
        ),
        bulkAction(
          'Transfer stock',
          <Button size="sm" variant="outline" tone="secondary">
            Transfer stock
          </Button>,
        ),
      ]}
    />
  );
}

/* ── Purchase orders ─────────────────────────────────────────────────── */

const PURCHASE_STATE: Record<
  PurchaseState,
  { tone: 'secondary' | 'accent' | 'warning' | 'success'; label: string }
> = {
  draft: { tone: 'secondary', label: 'Draft' },
  sent: { tone: 'accent', label: 'Sent' },
  confirmed: { tone: 'accent', label: 'Confirmed' },
  'partially-received': { tone: 'warning', label: 'Part received' },
  received: { tone: 'success', label: 'Received' },
};
const PURCHASE_STATES = (Object.keys(PURCHASE_STATE) as PurchaseState[]).map((value) => ({
  value,
  label: PURCHASE_STATE[value].label,
}));
const SUPPLIER_OPTIONS = options([...new Set(PRODUCTS.map((product) => product.supplier))].sort());

export function PurchaseOrders() {
  return (
    <ListPage<PurchaseOrder>
      title="Purchase orders"
      subheading="Stock on order from five suppliers"
      noun={['purchase order', 'purchase orders']}
      actions={
        <Button size="sm" start={glyph(Plus)}>
          New purchase order
        </Button>
      }
      rows={PURCHASE_ORDERS}
      views={[
        {
          value: 'open',
          label: 'Open',
          keep: (po) => po.state !== 'received' && po.state !== 'draft',
        },
        { value: 'draft', label: 'Drafts', keep: (po) => po.state === 'draft' },
        { value: 'received', label: 'Received', keep: (po) => po.state === 'received' },
        { value: 'all', label: 'All' },
      ]}
      columns={[
        { id: 'id', label: 'PO', rowHeader: true, width: 104, hideable: false },
        {
          id: 'supplier',
          label: 'Supplier',
          flex: 1,
          minWidth: 180,
          kind: 'set',
          options: SUPPLIER_OPTIONS,
        },
        { id: 'warehouse', label: 'Deliver to', width: 120, kind: 'set', options: SITES },
        { id: 'state', label: 'Status', width: 140, kind: 'set', options: PURCHASE_STATES },
        { id: 'lines', label: 'Lines', width: 92, kind: 'number' },
        { id: 'units', label: 'Units', width: 96, kind: 'number', aggregate: 'sum' },
        { id: 'received', label: 'Received', width: 176, kind: 'number' },
        {
          id: 'amount',
          label: 'Amount',
          width: 124,
          kind: 'number',
          aggregate: 'sum',
          format: (value) => money.format(Number(value)),
        },
        { id: 'ordered', label: 'Ordered', width: 116, kind: 'date' },
        { id: 'expected', label: 'Expected', width: 120, kind: 'date' },
      ]}
      rowKey="id"
      fields={[
        {
          key: 'supplier',
          kind: 'set',
          label: 'Supplier',
          options: SUPPLIER_OPTIONS,
          pinned: true,
        },
        { key: 'warehouse', kind: 'set', label: 'Deliver to', options: SITES, pinned: true },
        { key: 'state', kind: 'set', label: 'Status', options: PURCHASE_STATES },
        { key: 'expected', kind: 'date', label: 'Expected', section: 'Dates' },
      ]}
      cellRenderers={{
        state: ({ row }) => (
          <Badge size="sm" variant="soft" tone={PURCHASE_STATE[row.state].tone}>
            {PURCHASE_STATE[row.state].label}
          </Badge>
        ),
        received: ({ row }) => (
          <span className="console-meter">
            <ProgressBar
              size="sm"
              hideLabel
              label={`${row.id} received`}
              value={row.received}
              max={row.units}
              tone={row.received === row.units ? 'success' : 'accent'}
            />
            <span className="console-meter-value">
              {Math.round((row.received / row.units) * 100)}%
            </span>
          </span>
        ),
      }}
      bulk={() => [
        bulkAction('Send to supplier', <Button size="sm">Send to supplier</Button>, 'high'),
      ]}
    />
  );
}

/* ── Invoices ────────────────────────────────────────────────────────── */

const INVOICE_STATE: Record<
  InvoiceState,
  { tone: 'secondary' | 'accent' | 'danger' | 'success'; label: string }
> = {
  draft: { tone: 'secondary', label: 'Draft' },
  open: { tone: 'accent', label: 'Open' },
  overdue: { tone: 'danger', label: 'Overdue' },
  paid: { tone: 'success', label: 'Paid' },
  void: { tone: 'secondary', label: 'Void' },
};
const INVOICE_STATES = (Object.keys(INVOICE_STATE) as InvoiceState[]).map((value) => ({
  value,
  label: INVOICE_STATE[value].label,
}));
const INVOICED = options([...new Set(INVOICES.map((invoice) => invoice.customer))].sort());

export function Invoices({ onOrder }: { onOrder: (id: string) => void }) {
  return (
    <ListPage<Invoice>
      title="Invoices"
      subheading="Receivables from wholesale and enterprise accounts · Net 30 and Net 45"
      noun={['invoice', 'invoices']}
      actions={
        <>
          {exportButton}
          <Button size="sm" start={glyph(Plus)}>
            New invoice
          </Button>
        </>
      }
      rows={INVOICES}
      views={[
        {
          value: 'unpaid',
          label: 'Unpaid',
          keep: (invoice) => invoice.state === 'open' || invoice.state === 'overdue',
        },
        { value: 'overdue', label: 'Overdue', keep: (invoice) => invoice.state === 'overdue' },
        { value: 'draft', label: 'Drafts', keep: (invoice) => invoice.state === 'draft' },
        { value: 'paid', label: 'Paid', keep: (invoice) => invoice.state === 'paid' },
        { value: 'all', label: 'All' },
      ]}
      columns={[
        { id: 'id', label: 'Invoice', rowHeader: true, width: 120, hideable: false },
        {
          id: 'customer',
          label: 'Customer',
          flex: 1,
          minWidth: 200,
          kind: 'set',
          options: INVOICED,
        },
        { id: 'order', label: 'Order', width: 116 },
        { id: 'state', label: 'Status', width: 116, kind: 'set', options: INVOICE_STATES },
        {
          id: 'amount',
          label: 'Amount',
          width: 124,
          kind: 'number',
          aggregate: 'sum',
          format: (value) => money.format(Number(value)),
        },
        {
          id: 'balance',
          label: 'Balance',
          width: 124,
          kind: 'number',
          aggregate: 'sum',
          accessor: (row) => Math.round((row.amount - row.paid) * 100) / 100,
          format: (value) => money.format(Number(value)),
        },
        {
          id: 'terms',
          label: 'Terms',
          width: 104,
          kind: 'set',
          options: options(['Net 30', 'Net 45']),
        },
        { id: 'issued', label: 'Issued', width: 116, kind: 'date' },
        { id: 'due', label: 'Due', width: 116, kind: 'date' },
        { id: 'age', label: 'Days late', width: 120, kind: 'number', accessor: daysOverdue },
      ]}
      rowKey="id"
      fields={[
        { key: 'customer', kind: 'set', label: 'Customer', options: INVOICED, pinned: true },
        {
          key: 'terms',
          kind: 'set',
          label: 'Terms',
          options: options(['Net 30', 'Net 45']),
          pinned: true,
        },
        { key: 'state', kind: 'set', label: 'Status', options: INVOICE_STATES },
        { key: 'amount', kind: 'number', label: 'Amount', min: 0 },
        { key: 'due', kind: 'date', label: 'Due', section: 'Dates' },
      ]}
      cellRenderers={{
        order: ({ row }) => <OpenLink id={row.order} onOpen={onOrder} />,
        customer: ({ row }) => <Party name={row.customer} />,
        state: ({ row }) => (
          <Badge size="sm" variant="soft" tone={INVOICE_STATE[row.state].tone}>
            {INVOICE_STATE[row.state].label}
          </Badge>
        ),
        age: ({ row }) => {
          const late = row.state === 'overdue' ? daysOverdue(row) : 0;
          return late === 0 ? (
            <span className="console-muted">—</span>
          ) : (
            <span className="console-date" data-late="">
              {late}
            </span>
          );
        },
      }}
      bulk={() => [
        bulkAction(
          'Download PDFs',
          <Button size="sm" variant="ghost" tone="secondary" start={glyph(Download)}>
            Download PDFs
          </Button>,
        ),
        bulkAction('Send reminders', <Button size="sm">Send reminders</Button>, 'high'),
      ]}
    />
  );
}

/* ── Customers ───────────────────────────────────────────────────────── */

interface CustomerRow extends Customer {
  orders: number;
  revenue: number;
  average: number;
  last: string;
}

const CUSTOMER_ROWS: CustomerRow[] = CUSTOMERS.map((customer) => {
  const theirs = ORDERS.filter(
    (order) => order.customerId === customer.id && order.status !== 'voided',
  );
  const revenue = Math.round(theirs.reduce((sum, order) => sum + order.total, 0) * 100) / 100;
  return {
    ...customer,
    orders: theirs.length,
    revenue,
    average: Math.round((revenue / Math.max(1, theirs.length)) * 100) / 100,
    last: theirs[0]?.placed.slice(0, 10) ?? customer.since,
  };
}).filter((row) => row.orders > 0);

const SEGMENT_TONE = { enterprise: 'accent', wholesale: 'success', retail: 'secondary' } as const;

export function Customers() {
  return (
    <ListPage<CustomerRow>
      title="Customers"
      subheading={`${CUSTOMER_ROWS.length} accounts with orders in the last 90 days`}
      noun={['customer', 'customers']}
      actions={
        <>
          {exportButton}
          <Button size="sm" start={glyph(Plus)}>
            New customer
          </Button>
        </>
      }
      rows={CUSTOMER_ROWS}
      views={[
        { value: 'all', label: 'All' },
        ...SEGMENTS.map((segment) => ({
          value: segment.value,
          label: segment.label,
          keep: (row: CustomerRow) => row.segment === segment.value,
        })),
      ]}
      columns={[
        { id: 'name', label: 'Customer', rowHeader: true, flex: 1, minWidth: 220, hideable: false },
        { id: 'contact', label: 'Contact', width: 160 },
        { id: 'email', label: 'Email', width: 228 },
        { id: 'city', label: 'City', width: 164 },
        { id: 'segment', label: 'Segment', width: 128, kind: 'set', options: SEGMENTS },
        { id: 'orders', label: 'Orders', width: 104, kind: 'number' },
        {
          id: 'revenue',
          label: 'Revenue',
          width: 128,
          kind: 'number',
          format: (value) => money.format(Number(value)),
        },
        {
          id: 'average',
          label: 'Avg. order',
          width: 124,
          kind: 'number',
          format: (value) => money.format(Number(value)),
        },
        { id: 'last', label: 'Last order', width: 124, kind: 'date' },
        { id: 'owner', label: 'Account owner', width: 168, kind: 'set', options: options(OWNERS) },
      ]}
      rowKey="id"
      fields={[
        { key: 'segment', kind: 'set', label: 'Segment', options: SEGMENTS, pinned: true },
        { key: 'owner', kind: 'set', label: 'Owner', options: options(OWNERS), pinned: true },
        { key: 'revenue', kind: 'number', label: 'Revenue', min: 0 },
        { key: 'orders', kind: 'number', label: 'Orders', min: 0 },
        { key: 'last', kind: 'date', label: 'Last order', section: 'Dates' },
      ]}
      cellRenderers={{
        name: ({ row }) => <Party name={row.name} />,
        segment: ({ row }) => (
          <Badge size="sm" variant="soft" tone={SEGMENT_TONE[row.segment]}>
            {labelOf(SEGMENTS, row.segment)}
          </Badge>
        ),
        owner: ({ row }) => (
          <span className="console-person">
            <Avatar name={row.owner} size="xs" tone="secondary" decorative />
            {row.owner}
          </span>
        ),
      }}
      bulk={() => [
        bulkAction(
          'Reassign owner',
          <Button size="sm" variant="outline" tone="secondary">
            Reassign owner
          </Button>,
          'high',
        ),
        bulkAction('Email', <Button size="sm">Email</Button>, 'high'),
      ]}
    />
  );
}
