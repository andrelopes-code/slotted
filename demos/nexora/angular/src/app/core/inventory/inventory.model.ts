import {
  milliToQuantity,
  quantityFitsPrecision,
  quantityToMilli,
  type AdjustmentReasonCode,
  type CycleCountStatus,
  type LocationType,
  type NexoraApi,
  type TransferStatus,
  type WarehouseStatus,
} from '@slotted/demo-nexora-backend';

import { PURCHASE_ORDERS_ROUTE, RECEIVING_ROUTE } from '../procurement/procurement.model';

export const INVENTORY_ROUTE = '/inventory';
export const OVERVIEW_ROUTE = '/inventory/overview';
export const STOCK_ROUTE = '/inventory/stock';
export const WAREHOUSES_ROUTE = '/inventory/warehouses';
export const TRANSFERS_ROUTE = '/inventory/transfers';
export const MOVEMENTS_ROUTE = '/inventory/movements';
export const CYCLE_COUNTS_ROUTE = '/inventory/cycle-counts';

/** A warehouse as `GET /warehouses` answers it: the entity, its manager's name and its location count. */
export type WarehouseListItem = Awaited<ReturnType<NexoraApi['inventory']['warehouses']>>[number];

export const WAREHOUSE_STATUS_LABEL: Record<WarehouseStatus, string> = {
  operational: 'Operational',
  restricted: 'Restricted',
  closed: 'Closed',
};

export const WAREHOUSE_STATUS_TONE: Record<WarehouseStatus, 'success' | 'warning' | 'danger'> = {
  operational: 'success',
  restricted: 'warning',
  closed: 'danger',
};

/** §60.8: the four special places beside the bins. */
export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  storage: 'Storage',
  receiving: 'Receiving',
  staging: 'Staging',
  quarantine: 'Quarantine',
  damaged: 'Damaged',
};

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  draft: 'Draft',
  ready: 'Ready to ship',
  in_transit: 'In transit',
  partially_received: 'Partly received',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const TRANSFER_STATUS_TONE: Record<
  TransferStatus,
  'secondary' | 'accent' | 'warning' | 'success'
> = {
  draft: 'secondary',
  ready: 'accent',
  in_transit: 'accent',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'secondary',
};

/** The transfers still moving stock: what the overview calls "in flight". */
export const TRANSFERS_IN_FLIGHT: readonly TransferStatus[] = [
  'ready',
  'in_transit',
  'partially_received',
];

export const CYCLE_COUNT_STATUS_LABEL: Record<CycleCountStatus, string> = {
  planned: 'Planned',
  in_progress: 'Counting',
  submitted: 'Submitted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const CYCLE_COUNT_STATUS_TONE: Record<
  CycleCountStatus,
  'secondary' | 'accent' | 'warning' | 'success'
> = {
  planned: 'secondary',
  in_progress: 'accent',
  submitted: 'warning',
  completed: 'success',
  cancelled: 'secondary',
};

/** §60.7's five reason codes, with what each one does to the buckets. */
export const ADJUSTMENT_REASONS: readonly {
  value: AdjustmentReasonCode;
  label: string;
  description: string;
}[] = [
  {
    value: 'count_correction',
    label: 'Count correction',
    description: 'A count found more or less than Nexora held.',
  },
  {
    value: 'damage',
    label: 'Damage',
    description: 'Units found damaged. Removing them moves them to the damaged bucket.',
  },
  {
    value: 'found_stock',
    label: 'Found stock',
    description: 'Units found that were never received into Nexora.',
  },
  {
    value: 'data_correction',
    label: 'Data correction',
    description: 'A quantity keyed wrongly on an earlier document.',
  },
  { value: 'other', label: 'Other', description: 'Anything else; the note says what.' },
];

/** §60.7: a note is required at 10 units or at US$1,000 at standard cost. */
export const NOTE_UNITS_MILLI = 10_000;
export const NOTE_VALUE_MINOR = 100_000;
/** §62.2: a variance at or above US$2,500 at standard cost waits on a warehouse manager. */
export const COUNT_APPROVAL_MINOR = 250_000;

/**
 * Where a movement's source leads. A transfer and a cycle count have a record
 * in this module; a goods receipt has one in Procurement, for a reader who
 * holds `receipts.view`, and so does the purchase order it was written
 * against. A shipment, a return and a manual adjustment have no screen of
 * their own yet, so they lead to the ledger narrowed to what that record
 * moved — as does a receipt for a reader who may not open one; an opening
 * balance leads nowhere.
 */
export function movementSourceLink(
  type: string,
  id: string,
  can: (permission: string) => boolean = () => false,
): { path: string; queryParams?: Record<string, string> } | null {
  if (type === 'transfer') return { path: `${TRANSFERS_ROUTE}/${id}` };
  if (type === 'cycle_count') return { path: `${CYCLE_COUNTS_ROUTE}/${id}` };
  if (type === 'goods_receipt' && can('receipts.view')) return { path: `${RECEIVING_ROUTE}/${id}` };
  if (type === 'purchase_order' && can('purchase_orders.view'))
    return { path: `${PURCHASE_ORDERS_ROUTE}/${id}` };
  if (type === 'opening_balance') return null;
  return { path: MOVEMENTS_ROUTE, queryParams: { source: id } };
}

/** The route of one SKU's stock, opened on one of its warehouses. */
export function positionLink(
  skuId: string,
  warehouseId?: string,
): { path: string; queryParams: Record<string, string> } {
  return {
    path: `${STOCK_ROUTE}/${skuId}`,
    queryParams: warehouseId === undefined ? {} : { warehouse: warehouseId },
  };
}

/** A quantity typed by a reader as §53.8's decimal string, or null when it is not one. */
export function quantityText(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return milliToQuantity(Math.round(value * 1000));
}

export function fitsPrecision(value: string, precision: number): boolean {
  return quantityFitsPrecision(value.replace('-', ''), precision as 0 | 1 | 2 | 3);
}

export function milli(value: string): number {
  return quantityToMilli(value);
}

export function fromMilli(value: number): string {
  return milliToQuantity(value);
}

/** A signed quantity as the ledger writes it: "+12", "−4", "0". */
export function signed(value: string, format: (value: string) => string): string {
  const amount = quantityToMilli(value);
  if (amount === 0) return '0';
  return amount > 0 ? `+${format(value)}` : `−${format(value.replace('-', ''))}`;
}

/** Today's date in the demo's clock, as `YYYY-MM-DD`. */
export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}
