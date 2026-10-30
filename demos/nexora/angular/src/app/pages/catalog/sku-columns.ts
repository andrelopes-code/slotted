import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { GridColumn } from '@slotted/core/grid';
import type { Money, SkuListItem } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  formatMoney,
  formatQuantity,
  options,
  REORDER_MODE_LABEL,
  SKU_STATUS_LABEL,
  TAX_CLASS_LABEL,
  UNIT_LABEL,
} from '../../core/catalog/catalog.model';

const quantityColumn = (
  id: string,
  label: string,
  priority: number,
  description?: string,
): GridColumn<SkuListItem> => ({
  id,
  label,
  priority,
  ...(description ? { description } : {}),
  kind: 'number',
  align: 'end',
  width: description ? 150 : 118,
  accessor: (row) => Number(row[id as 'onHand' | 'available' | 'reserved' | 'inbound']),
  /* The backend already trimmed the fraction to the SKU's precision (§53.8); grouping is all that is left. */
  format: (_value, row) => formatQuantity(row[id as 'onHand' | 'available' | 'reserved' | 'inbound']),
});

const moneyColumn = (
  id: 'listPrice' | 'standardCost',
  label: string,
  priority: number,
  description: string,
): GridColumn<SkuListItem> => ({
  id,
  label,
  priority,
  description,
  kind: 'number',
  align: 'end',
  width: 148,
  accessor: (row) => (row[id] as Money | undefined)?.minor ?? null,
  format: (_value, row) => {
    const money = row[id] as Money | undefined;
    return money ? formatMoney(money) : '—';
  },
});

/**
 * The columns of the SKU list, decided by what the reader may be shown.
 *
 * `listPrice` and `standardCost` are not hidden when the permission is
 * missing — they are absent from the model. A hidden column is one the reader
 * brings back through the grid's own column control, and what would come back
 * is a price the backend hands to a persona without `pricing.view` and a cost
 * it has already written down to zero (PM-01).
 *
 * The code has no priority and stays at every width; the rest move into the
 * rows' pop-in from the highest priority down (LP-01), so a phone's row leads
 * with the code and what the warehouse can promise today.
 */
export function skuColumns(can: (permission: string) => boolean): readonly GridColumn<SkuListItem>[] {
  return [
    { id: 'sku', label: 'SKU', rowHeader: true, width: 160, hideable: false },
    { id: 'name', label: 'Name', flex: 1, minWidth: 200, priority: 4 },
    /* The SKU's own name carries the product's: without room it hides rather than repeat it in the pop-in. */
    { id: 'productName', label: 'Product', width: 190, priority: 11, popin: false },
    { id: 'brand', label: 'Brand', width: 160, priority: 12 },
    { id: 'categoryName', label: 'Category', width: 170, priority: 6 },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: options(SKU_STATUS_LABEL),
      width: 130,
      priority: 2,
    },
    {
      id: 'unitOfMeasure',
      label: 'Unit',
      kind: 'set',
      options: options(UNIT_LABEL),
      width: 86,
      priority: 10,
    },
    quantityColumn(
      'available',
      'Available',
      1,
      'On hand, less damaged, quarantined and reserved stock: what a warehouse can promise today.',
    ),
    quantityColumn('onHand', 'On hand', 5),
    quantityColumn('reserved', 'Reserved', 7, 'Stock held for order lines not yet shipped.'),
    quantityColumn('inbound', 'Inbound', 8, 'Stock on purchase orders not yet received.'),
    {
      id: 'belowReorderPoint',
      label: 'Reorder',
      kind: 'set',
      width: 136,
      priority: 3,
      description:
        'Below point when a min-max policy applies and the available stock is at or under its reorder point.',
      options: [
        { value: 'true', label: 'Below point' },
        { value: 'false', label: 'Above point' },
      ],
      accessor: (row) => String(row.belowReorderPoint),
    },
    ...(can('pricing.view') ? [moneyColumn('listPrice', 'List price', 9, 'The price before any price list or discount.')] : []),
    ...(can('cost.view') ? [moneyColumn('standardCost', 'Standard cost', 13, 'The cost the stock is valued at, per unit.')] : []),
    {
      id: 'leadTimeDays',
      label: 'Lead time',
      kind: 'number',
      align: 'end',
      width: 132,
      priority: 14,
      description: 'Days from a purchase order to its receipt.',
    },
    { id: 'preferredSupplierName', label: 'Supplier', width: 180, sortable: false, priority: 15 },
    {
      id: 'updatedAt',
      label: 'Updated',
      kind: 'date',
      width: 120,
      priority: 16,
      accessor: (row) => row.metadata.updatedAt,
      format: (value) => formatDate(String(value)),
    },
  ];
}

/**
 * What starts hidden at the desk, and comes back through the grid's own column
 * control: the facts a SKU's own page answers better, and the product name,
 * which the SKU's own name already carries ("Industrial Controller IC-900 — 32
 * I/O" under "Industrial Controller IC-900"). Seven columns are what fits the
 * frame at 1280 without a header ending in an ellipsis.
 */
export const SKU_HIDDEN_BY_DEFAULT: readonly string[] = [
  'productName',
  'standardCost',
  'brand',
  'categoryName',
  'onHand',
  'reserved',
  'inbound',
  'leadTimeDays',
  'preferredSupplierName',
  'updatedAt',
];

/**
 * The filter fields, decided by the same permissions as the columns. The
 * money fields are typed in the reader's own unit and scaled to minor units
 * on the way out (`SKU_SCALES`).
 */
export function skuFilterFields(can: (permission: string) => boolean): readonly FilterBarField[] {
  return [
    {
      key: 'status',
      label: 'Status',
      kind: 'set',
      options: options(SKU_STATUS_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'belowReorderPoint',
      label: 'Below reorder point',
      kind: 'boolean',
      pinned: true,
      operators: ['is'],
    },
    {
      key: 'backordered',
      label: 'Backordered',
      kind: 'boolean',
      pinned: true,
      operators: ['is'],
    },
    {
      key: 'brand',
      label: 'Brand',
      kind: 'text',
      pinned: true,
      operators: ['contains', 'equals'],
    },
    {
      key: 'available',
      label: 'Available',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between', 'equals'],
      section: 'Stock',
    },
    {
      key: 'onHand',
      label: 'On hand',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Stock',
    },
    {
      key: 'reserved',
      label: 'Reserved',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Stock',
    },
    {
      key: 'inbound',
      label: 'Inbound',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Stock',
    },
    {
      key: 'reorderMode',
      label: 'Reorder policy',
      kind: 'set',
      options: options(REORDER_MODE_LABEL),
      operators: ['anyOf'],
      section: 'Stock',
    },
    {
      key: 'leadTimeDays',
      label: 'Lead time (days)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Supply',
    },
    {
      key: 'unitOfMeasure',
      label: 'Unit',
      kind: 'set',
      options: options(UNIT_LABEL),
      operators: ['anyOf'],
      section: 'Catalogue',
    },
    {
      key: 'taxClass',
      label: 'Tax class',
      kind: 'set',
      options: options(TAX_CLASS_LABEL),
      operators: ['anyOf'],
      section: 'Catalogue',
    },
    {
      key: 'categoryName',
      label: 'Category',
      kind: 'text',
      operators: ['contains', 'equals'],
      section: 'Catalogue',
    },
    {
      key: 'productName',
      label: 'Product',
      kind: 'text',
      operators: ['contains', 'equals'],
      section: 'Catalogue',
    },
    ...(can('pricing.view')
      ? [
          {
            key: 'listPrice',
            label: 'List price',
            kind: 'number' as const,
            operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
            section: 'Money',
          },
        ]
      : []),
    ...(can('cost.view')
      ? [
          {
            key: 'standardCost',
            label: 'Standard cost',
            kind: 'number' as const,
            operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
            section: 'Money',
          },
        ]
      : []),
  ];
}
