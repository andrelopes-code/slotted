import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `data-list` writes on its own. */
export interface DataListMessages {
  readonly count: Message<{ count: number }>;
  /** The select-all control's name: one item, or every item counted. */
  readonly selectAll: Message<{ count: number }>;
  readonly ascending: Message;
  readonly clearFilters: Message;
  readonly descending: Message;
  readonly empty: Message;
  readonly emptyTitle: Message;
  readonly errorTitle: Message;
  /** What a boolean field says when false. */
  readonly false: Message;
  readonly less: Message;
  readonly loading: Message;
  readonly loadMore: Message;
  readonly more: Message<{ count: number }>;
  readonly noResultsTitle: Message;
  readonly retry: Message;
  readonly selectedCount: Message<{ selected: number; count: number }>;
  readonly selectRow: Message<{ title: string }>;
  readonly sort: Message;
  readonly sortCleared: Message;
  readonly sortColumn: Message;
  readonly sortDirection: Message;
  readonly sortedBy: Message<{ order: string }>;
  readonly sortedByAscending: Message<{ column: string }>;
  readonly sortedByDescending: Message<{ column: string }>;
  /** The sort control's name while a sort applies; `{order}` is the sort described. */
  readonly sortNamed: Message<{ order: string }>;
  /** The sort control's text: the first key's column, and how many keys follow it. */
  readonly sortSummary: Message<{ column: string; more: number }>;
  readonly sortNone: Message;
  /** What a boolean field says when true. */
  readonly true: Message;
}

export const en: DataListMessages = {
  count: '{count, plural, one {# item} other {# items}}',
  selectAll: '{count, plural, one {Select the item} other {Select all # items}}',
  ascending: 'Ascending',
  clearFilters: 'Clear filters',
  descending: 'Descending',
  empty: 'Empty',
  emptyTitle: 'No items yet',
  errorTitle: 'Items could not be loaded',
  false: 'No',
  less: 'Show less',
  loading: 'Loading items',
  loadMore: 'Load more',
  more: 'Show {count} more',
  noResultsTitle: 'No items match',
  retry: 'Try again',
  selectedCount: '{selected} of {count} selected',
  selectRow: 'Select {title}',
  sort: 'Sort',
  sortCleared: 'Sorting removed',
  sortColumn: 'Sort by',
  sortDirection: 'Direction',
  sortedBy: 'Sorted by {order}',
  sortedByAscending: '{column} ascending',
  sortedByDescending: '{column} descending',
  sortNamed: 'Sort, {order}',
  sortSummary: '{more, plural, =0 {Sort: {column}} other {Sort: {column} +#}}',
  sortNone: 'No sorting',
  true: 'Yes',
};

export const dataListMessages: MessageFamily<'dataList', DataListMessages> = {
  name: 'dataList',
  base: en,
};
