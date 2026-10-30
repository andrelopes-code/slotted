import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { GridColumn } from '@slotted/core/grid';
import type { MovementListItem } from '@slotted/demo-nexora-backend';

import {
  formatDateTime,
  formatQuantity,
  MOVEMENT_LABEL,
  MOVEMENT_SOURCE_LABEL,
  movementSourceLabel,
  options,
} from '../../core/catalog/catalog.model';
import { signed, type WarehouseListItem } from '../../core/inventory/inventory.model';
import { doorOnlyField } from '../../core/backend/door';

/**
 * The ledger's columns. The movement is named by when it happened — it has no
 * number — and a movement carries no unit (the ledger row "a movement names no
 * unit"), so the change is the signed quantity at the SKU's own precision and
 * the SKU's page says what it is counted in.
 *
 * `damagedDelta`, `actorName` and `reason` are not fields of the resource: the
 * columns neither sort nor filter by them.
 */
export function movementColumns(): readonly GridColumn<MovementListItem>[] {
  return [
    {
      id: 'occurredAt',
      label: 'When',
      rowHeader: true,
      width: 176,
      hideable: false,
      kind: 'date',
      /* A day typed in a header menu compares against a time of day; the bar's After and Before do not. */
      filterable: false,
      format: (value) => formatDateTime(String(value)),
    },
    {
      id: 'type',
      label: 'What',
      kind: 'set',
      options: options(MOVEMENT_LABEL),
      width: 170,
      priority: 2,
      format: (value) => MOVEMENT_LABEL[String(value)] ?? 'Movement',
    },
    { id: 'skuCode', label: 'SKU', width: 156, priority: 3 },
    { id: 'skuName', label: 'Name', flex: 1, minWidth: 180, priority: 7, sortable: false, filterable: false },
    { id: 'warehouseCode', label: 'Warehouse', width: 118, priority: 4 },
    {
      id: 'onHandDelta',
      label: 'On hand',
      kind: 'number',
      align: 'end',
      width: 118,
      priority: 1,
      description: 'The signed change to physical on hand, in the SKU’s own unit.',
      accessor: (row) => Number(row.onHandDelta),
      format: (_value, row) => signed(row.onHandDelta, formatQuantity),
    },
    {
      id: 'damagedDelta',
      label: 'Damaged',
      kind: 'number',
      align: 'end',
      width: 118,
      priority: 8,
      sortable: false,
      filterable: false,
      description: 'Stock moved into or out of the damaged bucket; on hand is unchanged by it.',
      accessor: (row) => Number(row.damagedDelta),
      format: (_value, row) => signed(row.damagedDelta, formatQuantity),
    },
    {
      id: 'sourceEntityType',
      label: 'From',
      kind: 'set',
      options: options(MOVEMENT_SOURCE_LABEL),
      width: 170,
      priority: 5,
      format: (value) => movementSourceLabel(String(value)),
    },
    { id: 'actorName', label: 'By', width: 160, priority: 6, sortable: false, filterable: false },
    { id: 'reason', label: 'Reason', width: 220, priority: 9, sortable: false, filterable: false },
  ];
}

export const MOVEMENT_HIDDEN_BY_DEFAULT: readonly string[] = ['damagedDelta', 'reason'];

/** The fields `GET /stock-movements` filters by (`movementResource`), and no other. */
export function movementFilterFields(
  warehouses: readonly WarehouseListItem[],
): readonly FilterBarField[] {
  return [
    {
      key: 'type',
      label: 'What',
      kind: 'set',
      options: options(MOVEMENT_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
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
      key: 'occurredAt',
      label: 'When',
      kind: 'date',
      pinned: true,
      operators: ['after', 'before'],
    },
    {
      key: 'sourceEntityType',
      label: 'From',
      kind: 'set',
      options: options(MOVEMENT_SOURCE_LABEL),
      operators: ['anyOf'],
      section: 'Movement',
    },
    {
      key: 'skuCode',
      label: 'SKU',
      kind: 'text',
      operators: ['equals', 'contains'],
      section: 'Movement',
    },
    {
      key: 'onHandDelta',
      label: 'On-hand change',
      kind: 'number',
      operators: ['greaterThan', 'lessThan', 'between'],
      section: 'Movement',
    },
    {
      key: 'occurredOn',
      label: 'Day',
      kind: 'date',
      operators: ['is', 'between'],
      section: 'Movement',
    },
  ];
}

/** What a report's door may name that the bar has no list of: offered while the door names it. */
export const MOVEMENT_DOOR_FIELDS: readonly FilterBarField[] = [
  doorOnlyField('warehouseId', 'Warehouse') as FilterBarField,
  doorOnlyField('categoryId', 'Category in') as FilterBarField,
];
