import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { FilterGroup, FilterRule } from '@slotted/core/filter';
import type { GridColumn } from '@slotted/core/grid';
import type { InventoryListItem } from '@slotted/demo-nexora-backend';

import {
  formatMoney,
  formatQuantity,
  options,
  SKU_STATUS_LABEL,
  UNIT_LABEL,
} from '../../core/catalog/catalog.model';
import type { WarehouseListItem } from '../../core/inventory/inventory.model';
import { doorOnlyField } from '../../core/backend/door';

type QuantityField =
  | 'onHand'
  | 'available'
  | 'reserved'
  | 'inbound'
  | 'damaged'
  | 'quarantine'
  | 'backordered'
  | 'reorderPoint'
  | 'safetyStock';

const quantity = (
  id: QuantityField,
  label: string,
  priority: number,
  description?: string,
): GridColumn<InventoryListItem> => ({
  id,
  label,
  priority,
  ...(description ? { description } : {}),
  kind: 'number',
  align: 'end',
  width: description ? 142 : 116,
  accessor: (row) => Number(row[id]),
  /* The backend writes a quantity at the SKU's own precision (§53.8); grouping is all that is left. */
  format: (_value, row) => formatQuantity(row[id]),
});

/**
 * The positions' columns, decided by what the reader may be shown. The value
 * is absent without `cost.view` — not hidden: `GET /inventory` fills it for
 * every reader, and a hidden column is one the reader brings back (PM-01).
 *
 * The SKU code is the row header and never moves; the rest enter the row's
 * pop-in from the highest priority down (LP-01), so a phone's row leads with
 * what can be promised today and where. A column the resource cannot sort or
 * filter by says so, so neither its header nor its menu offers what the
 * backend would refuse.
 */
export function stockColumns(
  can: (permission: string) => boolean,
): readonly GridColumn<InventoryListItem>[] {
  return [
    { id: 'skuCode', label: 'SKU', rowHeader: true, width: 158, hideable: false },
    { id: 'skuName', label: 'Name', flex: 1, minWidth: 200, priority: 4 },
    { id: 'warehouseCode', label: 'Warehouse', width: 124, priority: 2 },
    quantity(
      'available',
      'Available',
      1,
      'Sellable on hand less what is reserved: what this warehouse can promise today.',
    ),
    {
      id: 'health',
      label: 'Stock',
      width: 150,
      priority: 3,
      sortable: false,
      filterable: false,
      description: 'Below safety stock is the stronger of the two marks; a position shows one.',
      accessor: (row) =>
        row.belowSafetyStock ? 'Below safety' : row.belowReorderPoint ? 'Below reorder point' : '',
    },
    quantity('onHand', 'On hand', 5),
    quantity('reserved', 'Reserved', 7, 'Held for order lines not yet shipped.'),
    quantity('backordered', 'Backordered', 6, 'Open order demand no reservation covers.'),
    quantity('inbound', 'Inbound', 8, 'On purchase orders and transfers not yet received.'),
    quantity('damaged', 'Damaged', 11),
    quantity('quarantine', 'Quarantine', 12),
    quantity('reorderPoint', 'Reorder point', 9),
    quantity('safetyStock', 'Safety stock', 10),
    {
      id: 'unitOfMeasure',
      label: 'Unit',
      width: 86,
      priority: 13,
      sortable: false,
      filterable: false,
      format: (value) => UNIT_LABEL[String(value)] ?? String(value),
    },
    ...(can('cost.view')
      ? [
          {
            id: 'onHandValue',
            label: 'Value',
            kind: 'number' as const,
            align: 'end' as const,
            width: 136,
            priority: 14,
            description: 'On hand at standard cost.',
            accessor: (row: InventoryListItem) => row.onHandValue.minor,
            format: (_value: unknown, row: InventoryListItem) => formatMoney(row.onHandValue),
          },
        ]
      : []),
    { id: 'categoryName', label: 'Category', width: 170, priority: 15 },
    {
      id: 'skuStatus',
      label: 'SKU status',
      width: 130,
      priority: 16,
      format: (value) => SKU_STATUS_LABEL[String(value) as keyof typeof SKU_STATUS_LABEL] ?? '',
    },
  ];
}

/** What starts hidden at the desk: the buckets a position's own page answers better. */
export const STOCK_HIDDEN_BY_DEFAULT: readonly string[] = [
  'damaged',
  'quarantine',
  'reorderPoint',
  'safetyStock',
  'unitOfMeasure',
  'onHandValue',
  'categoryName',
  'skuStatus',
];

/**
 * The fields `GET /inventory` filters by (`inventoryResource`), and no other:
 * a pill the backend does not accept is a control that lies. The warehouse is
 * offered only where the reader's scope holds more than one.
 */
export function stockFilterFields(
  can: (permission: string) => boolean,
  warehouses: readonly WarehouseListItem[],
): readonly FilterBarField[] {
  const number = (key: string, label: string): FilterBarField => ({
    key,
    label,
    kind: 'number',
    operators: ['greaterThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'between', 'equals'],
    section: 'Stock',
  });
  return [
    ...(warehouses.length > 1
      ? [
          {
            key: 'warehouseId',
            label: 'Warehouse',
            kind: 'set' as const,
            options: warehouses.map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
            pinned: true,
            operators: ['anyOf'],
          },
        ]
      : []),
    {
      key: 'belowSafetyStock',
      label: 'Below safety stock',
      kind: 'boolean',
      pinned: true,
      operators: ['is'],
    },
    {
      key: 'belowReorderPoint',
      label: 'Below reorder point',
      kind: 'boolean',
      pinned: true,
      operators: ['is'],
    },
    {
      key: 'reorderSuggested',
      label: 'Reorder suggested',
      kind: 'boolean',
      operators: ['is'],
      section: 'Stock',
    },
    number('available', 'Available'),
    number('onHand', 'On hand'),
    number('reserved', 'Reserved'),
    number('backordered', 'Backordered'),
    number('inbound', 'Inbound'),
    number('damaged', 'Damaged'),
    number('quarantine', 'Quarantine'),
    {
      key: 'skuStatus',
      label: 'SKU status',
      kind: 'set',
      options: options(SKU_STATUS_LABEL),
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
      key: 'lastShippedOn',
      label: 'Last shipped',
      kind: 'date',
      operators: ['after', 'before', 'between', 'empty'],
      section: 'Stock',
    },
    ...(can('cost.view')
      ? [
          {
            key: 'onHandValue',
            label: 'Value (US$)',
            kind: 'number' as const,
            operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
            section: 'Money',
          },
        ]
      : []),
  ];
}

/** What a report's door may name that the bar has no list of: offered while the door names it. */
export const STOCK_DOOR_FIELDS: readonly FilterBarField[] = [
  doorOnlyField('warehouseId', 'Warehouse') as FilterBarField,
  doorOnlyField('categoryId', 'Category in') as FilterBarField,
];

/** The exceptions the overview's figures open the list on, as the bar's own pills. */
export type StockException = 'below_safety' | 'below_reorder' | 'nothing_available' | 'backordered';

const EXCEPTION_RULES: Record<StockException, FilterRule> = {
  below_safety: {
    field: 'belowSafetyStock',
    filter: { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] },
  },
  below_reorder: {
    field: 'belowReorderPoint',
    filter: { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] },
  },
  nothing_available: {
    field: 'available',
    filter: { kind: 'number', join: 'and', conditions: [{ operator: 'lessThanOrEqual', value: 0 }] },
  },
  backordered: {
    field: 'backordered',
    filter: { kind: 'number', join: 'and', conditions: [{ operator: 'greaterThan', value: 0 }] },
  },
};

/**
 * A door's query parameters as the tree the bar shows: the reader arrives with
 * the pills the figure stood for, and removes them like any other.
 */
export function doorFilter(
  exception: string | null,
  warehouseId: string | null,
): FilterGroup | null {
  const rules: FilterRule[] = [];
  if (warehouseId)
    rules.push({
      field: 'warehouseId',
      filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: [warehouseId] }] },
    });
  if (exception && exception in EXCEPTION_RULES)
    rules.push(EXCEPTION_RULES[exception as StockException]);
  return rules.length === 0 ? null : { join: 'and', rules };
}
