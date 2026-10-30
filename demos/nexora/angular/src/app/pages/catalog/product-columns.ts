import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { GridColumn } from '@slotted/core/grid';
import type { ProductListItem } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  options,
  PRODUCT_STATUS_LABEL,
  PRODUCT_TAG_LABEL,
} from '../../core/catalog/catalog.model';

/**
 * Every column reads the backend field it is named after, so a sort key
 * travels as it is. The name has no priority and stays at every width; the
 * rest move into the rows' pop-in from the highest priority down (LP-01), so a
 * phone's row leads with the name and how many of its SKUs are sellable.
 */
export const PRODUCT_COLUMNS: readonly GridColumn<ProductListItem>[] = [
  { id: 'name', label: 'Product', rowHeader: true, flex: 1, minWidth: 200, hideable: false },
  { id: 'brand', label: 'Brand', width: 160, priority: 4 },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    options: options(PRODUCT_STATUS_LABEL),
    width: 130,
    priority: 2,
  },
  { id: 'categoryName', label: 'Category', width: 170, priority: 3 },
  {
    id: 'activeSkuCount',
    label: 'Active SKUs',
    kind: 'number',
    align: 'end',
    width: 156,
    priority: 1,
    description: 'The SKUs of the product whose status is active: the ones an order line can take.',
  },
  { id: 'skuCount', label: 'SKUs', kind: 'number', align: 'end', width: 90, priority: 5 },
  {
    id: 'tags',
    label: 'Tags',
    width: 180,
    priority: 6,
    sortable: false,
    accessor: (row) => row.tags.map((tag) => PRODUCT_TAG_LABEL[tag] ?? tag).join(', '),
  },
  {
    id: 'updatedAt',
    label: 'Updated',
    kind: 'date',
    width: 136,
    priority: 7,
    description: 'The last change to the product record.',
    accessor: (row) => row.metadata.updatedAt,
    format: (value) => formatDate(String(value)),
  },
];

/** Six columns fit the frame at 1280; the rest start hidden and the grid's own control brings them back. */
export const PRODUCT_HIDDEN_BY_DEFAULT: readonly string[] = ['tags', 'updatedAt'];

export const PRODUCT_FILTER_FIELDS: readonly FilterBarField[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'set',
    options: options(PRODUCT_STATUS_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'brand',
    label: 'Brand',
    kind: 'text',
    pinned: true,
    operators: ['contains', 'equals'],
  },
  /* `tags` is an array field: the backend's `contains` matches one whole tag, never part of one. */
  {
    key: 'tags',
    label: 'Tag',
    kind: 'set',
    options: options(PRODUCT_TAG_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  {
    key: 'categoryName',
    label: 'Category',
    kind: 'text',
    operators: ['contains', 'equals'],
    section: 'Catalogue',
  },
  {
    key: 'activeSkuCount',
    label: 'Active SKUs',
    kind: 'number',
    operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'equals'],
    section: 'Catalogue',
  },
  {
    key: 'skuCount',
    label: 'SKUs',
    kind: 'number',
    operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'equals'],
    section: 'Catalogue',
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    kind: 'date',
    operators: ['after', 'before', 'between'],
    section: 'Catalogue',
  },
];
