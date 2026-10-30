import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { GridColumn } from '@slotted/core/grid';
import type { PurchaseOrderListItem, SupplierListItem } from '@slotted/demo-nexora-backend';

import { formatDate, formatDateTime, formatMoney, options } from '../../core/catalog/catalog.model';
import type { WarehouseListItem } from '../../core/inventory/inventory.model';
import {
  formatDays,
  formatScore,
  hasDeliveryRecord,
  hasQualityRecord,
  PO_EXCEPTION_LABEL,
  PO_STATUS_LABEL,
  percentFromBps,
  RECEIVABLE,
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_TIER_LABEL,
} from '../../core/procurement/procurement.model';
import { doorOnlyField } from '../../core/backend/door';

type Can = (permission: string) => boolean;

/**
 * The supplier directory's columns. The spend is money paid to the supplier —
 * a cost, which the module reads under `cost.view` (the decision the rule
 * PC-01 records) — so it is absent from the model for a reader without it
 * (PM-01). The on-time share leads the phone's row (LP-01): it is the figure a
 * buyer chooses a supplier by.
 */
export function supplierColumns(can: Can): readonly GridColumn<SupplierListItem>[] {
  return [
    { id: 'displayName', label: 'Supplier', rowHeader: true, width: 220, hideable: false },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: options(SUPPLIER_STATUS_LABEL),
      width: 116,
      priority: 2,
    },
    {
      id: 'onTimeDeliveryBps',
      label: 'On time',
      kind: 'number',
      align: 'end',
      width: 148,
      priority: 1,
      description: 'Lines received in full on or before their expected date, of the lines received in full.',
      accessor: (row) => row.performance.onTimeDeliveryBps / 100,
      format: (_value, row) =>
        hasDeliveryRecord(row.performance) ? percentFromBps(row.performance.onTimeDeliveryBps) : 'No delivery yet',
    },
    {
      id: 'qualityScore',
      label: 'Quality',
      kind: 'number',
      align: 'end',
      width: 148,
      priority: 3,
      description: '100 less the damaged and rejected share of everything received, in percent.',
      accessor: (row) => row.performance.qualityScore,
      format: (_value, row) =>
        hasQualityRecord(row.performance) ? formatScore(row.performance.qualityScore) : '—',
    },
    {
      id: 'averageLeadTimeDays',
      label: 'Lead time',
      kind: 'number',
      align: 'end',
      width: 156,
      priority: 5,
      description: 'Days from the order to its first receipt, averaged over the lines received in full.',
      accessor: (row) => row.performance.averageLeadTimeDays,
      format: (_value, row) =>
        hasDeliveryRecord(row.performance) ? formatDays(row.performance.averageLeadTimeDays) : '—',
    },
    {
      id: 'openPurchaseOrderCount',
      label: 'Open POs',
      kind: 'number',
      align: 'end',
      width: 148,
      priority: 4,
      description: 'Orders sent, acknowledged or partly received: the ones still to arrive.',
      accessor: (row) => row.performance.openPurchaseOrderCount,
    },
    ...(can('cost.view')
      ? [
          {
            id: 'annualSpendUsd',
            label: 'Spend, 12 months',
            kind: 'number',
            align: 'end',
            width: 184,
            priority: 6,
            description: 'Orders placed in the last 365 days, drafts and cancellations left out, in US dollars.',
            accessor: (row) => row.performance.annualSpendUsd.minor / 100,
            format: (_value, row) => formatMoney(row.performance.annualSpendUsd),
          } satisfies GridColumn<SupplierListItem>,
        ]
      : []),
    {
      id: 'relationshipTier',
      label: 'Relationship',
      kind: 'set',
      options: options(SUPPLIER_TIER_LABEL),
      width: 130,
      priority: 7,
    },
    { id: 'category', label: 'Category', width: 190, priority: 8 },
    { id: 'skuCount', label: 'SKUs', kind: 'number', align: 'end', width: 88, priority: 9 },
    {
      id: 'region',
      label: 'Place',
      width: 150,
      priority: 10,
      filterable: false,
      accessor: (row) => [row.city, row.region].filter(Boolean).join(', '),
    },
    { id: 'supplierNumber', label: 'Number', width: 124, priority: 11 },
    {
      id: 'updatedAt',
      label: 'Updated',
      kind: 'date',
      width: 170,
      priority: 12,
      filterable: false,
      accessor: (row) => row.metadata.updatedAt,
      format: (value) => formatDateTime(String(value)),
    },
  ];
}

/** The fields `supplierResource` filters by; the spend only for a reader who may see it. */
export function supplierFilterFields(can: Can): readonly FilterBarField[] {
  return [
    {
      key: 'status',
      label: 'Status',
      kind: 'set',
      options: options(SUPPLIER_STATUS_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'relationshipTier',
      label: 'Relationship',
      kind: 'set',
      options: options(SUPPLIER_TIER_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    { key: 'category', label: 'Category', kind: 'text', operators: ['contains'], section: 'Supplier' },
    {
      key: 'onTimeDeliveryBps',
      label: 'On time (%)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Performance',
    },
    {
      key: 'qualityScore',
      label: 'Quality',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Performance',
    },
    {
      key: 'averageLeadTimeDays',
      label: 'Lead time (days)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Performance',
    },
    {
      key: 'openPurchaseOrderCount',
      label: 'Open POs',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'equals'],
      section: 'Performance',
    },
    ...(can('cost.view')
      ? [
          {
            key: 'annualSpendUsd',
            label: 'Spend, 12 months (US$)',
            kind: 'number',
            operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
            section: 'Performance',
          } satisfies FilterBarField,
        ]
      : []),
  ];
}

/**
 * The purchase orders' columns. The total is what is paid to the supplier, so
 * it is absent without `cost.view` (PM-01, PC-01). It is drawn in the order's
 * own currency and sorted by `purchaseOrderResource` in US dollars, so an
 * order in reais takes its place by what it is worth.
 */
export function purchaseOrderColumns(
  can: Can,
  receiving = false,
): readonly GridColumn<PurchaseOrderListItem>[] {
  return [
    { id: 'purchaseOrderNumber', label: 'Purchase order', rowHeader: true, width: 156, hideable: false },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: (receiving ? RECEIVABLE : (Object.keys(PO_STATUS_LABEL) as (keyof typeof PO_STATUS_LABEL)[])).map(
        (value) => ({ value, label: PO_STATUS_LABEL[value] }),
      ),
      width: 168,
      priority: receiving ? 4 : 1,
    },
    {
      id: 'daysLate',
      label: 'Days late',
      kind: 'number',
      align: 'end',
      width: 124,
      priority: receiving ? 1 : 2,
      format: (value) => (Number(value) > 0 ? formatDays(Number(value)) : ''),
    },
    {
      id: 'exceptionFlags',
      label: 'Exception',
      kind: 'set',
      options: options(PO_EXCEPTION_LABEL),
      width: 160,
      priority: 3,
      // The resource sorts an array by its length: descending puts the flagged orders first.
      description: 'Delayed or disputed. Sorting puts the orders that carry a flag first.',
      accessor: (row) => row.exceptionFlags.map((flag) => PO_EXCEPTION_LABEL[flag]).join(', '),
    },
    { id: 'supplierName', label: 'Supplier', width: 200, priority: receiving ? 2 : 4 },
    { id: 'warehouseCode', label: 'Deliver to', width: 116, priority: 5 },
    {
      id: 'expectedDate',
      label: 'Expected',
      kind: 'date',
      width: 148,
      priority: receiving ? 3 : 6,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'receivedShareBps',
      label: 'Received',
      kind: 'number',
      align: 'end',
      width: 132,
      priority: 7,
      description: 'The share of the ordered quantity that has come through the door: accepted, damaged or rejected.',
      accessor: (row) => row.receivedShareBps / 100,
      format: (_value, row) => percentFromBps(row.receivedShareBps),
    },
    ...(can('cost.view')
      ? [
          {
            id: 'total',
            label: 'Total',
            kind: 'number',
            align: 'end',
            width: 140,
            priority: 8,
            filterable: false,
            description: 'Subtotal and freight, in the order’s own currency; sorted by its value in US dollars.',
            accessor: (row) => row.total.minor / 100,
            format: (_value, row) => formatMoney(row.total),
          } satisfies GridColumn<PurchaseOrderListItem>,
        ]
      : []),
    { id: 'lineCount', label: 'Lines', kind: 'number', align: 'end', width: 88, priority: 10 },
    { id: 'buyerName', label: 'Buyer', width: 160, priority: 9 },
    {
      id: 'createdBusinessDate',
      label: 'Created',
      kind: 'date',
      width: 128,
      priority: 11,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      kind: 'date',
      width: 170,
      priority: 12,
      filterable: false,
      accessor: (row) => row.metadata.updatedAt,
      format: (value) => formatDateTime(String(value)),
    },
  ];
}

/** What a report's door may name that the bar has no list of: offered while the door names it. */
export const PURCHASE_ORDER_DOOR_FIELDS: readonly FilterBarField[] = [
  doorOnlyField('supplierId', 'Supplier') as FilterBarField,
  doorOnlyField('warehouseId', 'Deliver to') as FilterBarField,
];

/** The fields `purchaseOrderResource` filters by; a warehouse is offered where the scope holds several. */
export function purchaseOrderFilterFields(
  warehouses: readonly WarehouseListItem[],
  receiving = false,
): readonly FilterBarField[] {
  const statuses = receiving ? RECEIVABLE : (Object.keys(PO_STATUS_LABEL) as (keyof typeof PO_STATUS_LABEL)[]);
  return [
    {
      key: 'status',
      label: 'Status',
      kind: 'set',
      options: statuses.map((value) => ({ value, label: PO_STATUS_LABEL[value] })),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'exceptionFlags',
      label: 'Exception',
      kind: 'set',
      options: options(PO_EXCEPTION_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    ...(warehouses.length > 1
      ? [
          {
            key: 'warehouseId',
            label: 'Deliver to',
            kind: 'set',
            options: warehouses.map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
            pinned: true,
            operators: ['anyOf'],
          } satisfies FilterBarField,
        ]
      : []),
    { key: 'supplierName', label: 'Supplier', kind: 'text', operators: ['contains'], section: 'Order' },
    { key: 'buyerName', label: 'Buyer', kind: 'text', operators: ['contains'], section: 'Order' },
    {
      key: 'daysLate',
      label: 'Days late',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Arrival',
    },
    {
      key: 'expectedDate',
      label: 'Expected',
      kind: 'date',
      operators: ['after', 'before', 'between'],
      section: 'Arrival',
    },
    {
      key: 'receivedShareBps',
      label: 'Received (%)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Arrival',
    },
    {
      key: 'receivedOn',
      label: 'Received in full',
      kind: 'date',
      operators: ['after', 'before', 'between'],
      section: 'Arrival',
    },
    {
      key: 'createdBusinessDate',
      label: 'Created',
      kind: 'date',
      operators: ['after', 'before', 'between'],
      section: 'Order',
    },
    {
      key: 'lineCount',
      label: 'Lines',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual'],
      section: 'Order',
    },
  ];
}
