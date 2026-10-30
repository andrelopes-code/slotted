import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `data-grid` writes on its own. */
export interface DataGridMessages {
  readonly autofit: Message;
  readonly autofitAll: Message;
  readonly cancel: Message;
  readonly clearFilters: Message;
  readonly collapse: Message;
  readonly collapseGroup: Message<{ group: string }>;
  readonly columnHelp: Message<{ column: string }>;
  readonly columnHidden: Message<{ column: string }>;
  readonly columnMenu: Message<{ column: string }>;
  readonly copied: Message<{ count: number }>;
  /** The place a dragged column is announced in: "Name, position 2 of 5 in columns." */
  readonly dragColumns: Message;
  /** The place a dragged row is announced in. */
  readonly dragRows: Message;
  readonly edit: Message;
  readonly editConflict: Message;
  readonly editFailed: Message;
  readonly empty: Message;
  readonly error: Message;
  readonly expand: Message;
  readonly expandGroup: Message<{ group: string }>;
  readonly filter: Message;
  readonly filterAny: Message;
  readonly filterApplied: Message<{ column: string; filter: string }>;
  readonly filterApply: Message;
  readonly filterClear: Message;
  readonly filterCleared: Message<{ column: string }>;
  readonly filterColumn: Message<{ column: string }>;
  readonly filterFrom: Message;
  readonly filterJoin: Message;
  readonly filterJoins: {
    readonly and: Message;
    readonly or: Message;
  };
  readonly filterMenu: Message;
  readonly filterNo: Message;
  readonly filterOperator: Message;
  readonly filterOperatorChosen: Message<{ operator: string }>;
  readonly filterOperators: {
    readonly after: Message;
    readonly anyOf: Message;
    readonly before: Message;
    readonly between: Message;
    readonly contains: Message;
    readonly empty: Message;
    readonly endsWith: Message;
    readonly equals: Message;
    readonly greaterThan: Message;
    readonly greaterThanOrEqual: Message;
    readonly is: Message;
    readonly isNot: Message;
    readonly lessThan: Message;
    readonly lessThanOrEqual: Message;
    readonly noneOf: Message;
    readonly notContains: Message;
    readonly notEmpty: Message;
    readonly notEquals: Message;
    readonly startsWith: Message;
  };
  readonly filterRange: Message<{ column: string; bound: string }>;
  readonly filterResults: Message<{ count: number }>;
  readonly filterSymbols: {
    readonly after: Message;
    readonly anyOf: Message;
    readonly before: Message;
    readonly between: Message;
    readonly contains: Message;
    readonly empty: Message;
    readonly endsWith: Message;
    readonly equals: Message;
    readonly greaterThan: Message;
    readonly greaterThanOrEqual: Message;
    readonly is: Message;
    readonly isNot: Message;
    readonly lessThan: Message;
    readonly lessThanOrEqual: Message;
    readonly noneOf: Message;
    readonly notContains: Message;
    readonly notEmpty: Message;
    readonly notEquals: Message;
    readonly startsWith: Message;
  };
  readonly filterTo: Message;
  readonly filterValue: Message;
  readonly filterYes: Message;
  readonly grid: Message;
  readonly groupCount: Message<{ count: number }>;
  readonly hide: Message;
  readonly loadMore: Message;
  readonly loadingMore: Message;
  readonly manageColumns: Message;
  readonly noResults: Message;
  readonly pinEnd: Message;
  readonly pinStart: Message;
  readonly popinHeader: Message;
  readonly range: Message<{ start: number; end: number; total: number }>;
  readonly rangeUnknown: Message<{ start: number; end: number }>;
  readonly reorderRow: Message<{ row: string }>;
  readonly resize: Message;
  readonly resized: Message<{ column: string; width: string }>;
  readonly retry: Message;
  readonly rowMoved: Message<{ row: string; position: number }>;
  readonly save: Message;
  readonly selectAll: Message;
  readonly selectAllFiltered: Message<{ count: number }>;
  readonly selectAllPage: Message<{ count: number }>;
  /** `row` is the row header's text, `key` the row key; `row` falls back to the key without a row header. */
  readonly selectRow: Message<{ row: string; key: string }>;
  readonly sortAscending: Message<{ column: string }>;
  readonly sortAscendingAction: Message;
  readonly sortClearAction: Message;
  readonly sortCleared: Message;
  readonly sortDescending: Message<{ column: string }>;
  readonly sortDescendingAction: Message;
  readonly sortedBy: Message<{ order: string }>;
  readonly unpin: Message;
}

export const en: DataGridMessages = {
  autofit: 'Fit to content',
  autofitAll: 'Fit all columns',
  cancel: 'Cancel',
  clearFilters: 'Clear filters',
  collapse: 'Hide details',
  collapseGroup: 'Collapse group {group}',
  columnHelp: 'About {column}',
  columnHidden: '{column} hidden',
  columnMenu: 'Column menu, {column}',
  copied: '{count, plural, one {# cell copied} other {# cells copied}}',
  dragColumns: 'columns',
  dragRows: 'rows',
  edit: 'Edit',
  editConflict: 'This value changed while you were editing',
  editFailed: 'The change could not be saved',
  empty: 'No rows',
  error: 'The rows could not be loaded',
  expand: 'Show details',
  expandGroup: 'Expand group {group}',
  filter: 'Filter',
  filterAny: 'Any',
  filterApplied: 'Filter {column}: {filter}',
  filterApply: 'Apply',
  filterClear: 'Clear',
  filterCleared: 'Filter {column}, filter removed',
  filterColumn: 'Filter {column}',
  filterFrom: 'From',
  filterJoin: 'Match',
  filterJoins: {
    and: 'And',
    or: 'Or',
  },
  filterMenu: 'Filter…',
  filterNo: 'No',
  filterOperator: 'Condition',
  filterOperatorChosen: 'Condition: {operator}',
  filterOperators: {
    after: 'After',
    anyOf: 'Is any of',
    before: 'Before',
    between: 'Between',
    contains: 'Contains',
    empty: 'Is empty',
    endsWith: 'Ends with',
    equals: 'Equals',
    greaterThan: 'Greater than',
    greaterThanOrEqual: 'Greater than or equal to',
    is: 'Is',
    isNot: 'Is not',
    lessThan: 'Less than',
    lessThanOrEqual: 'Less than or equal to',
    noneOf: 'Is none of',
    notContains: 'Does not contain',
    notEmpty: 'Is not empty',
    notEquals: 'Does not equal',
    startsWith: 'Begins with',
  },
  filterRange: 'Filter {column}, {bound, select, from {From} other {To}}',
  filterResults: '{count, plural, one {# row matches} other {# rows match}}',
  filterSymbols: {
    after: '>',
    anyOf: '∈',
    before: '<',
    between: '↔',
    contains: '⊃',
    empty: '∅',
    endsWith: '$',
    equals: '=',
    greaterThan: '>',
    greaterThanOrEqual: '≥',
    is: '=',
    isNot: '≠',
    lessThan: '<',
    lessThanOrEqual: '≤',
    noneOf: '∉',
    notContains: '⊅',
    notEmpty: '∄',
    notEquals: '≠',
    startsWith: '^',
  },
  filterTo: 'To',
  filterValue: 'Value',
  filterYes: 'Yes',
  grid: 'Data grid',
  groupCount: '{count, plural, one {# row} other {# rows}}',
  hide: 'Hide column',
  loadMore: 'Load more',
  loadingMore: 'Loading more rows…',
  manageColumns: 'Manage columns…',
  noResults: 'No rows match the current filters',
  pinEnd: 'Pin to end',
  pinStart: 'Pin to start',
  popinHeader: 'Details',
  range: '{start}–{end} of {total}',
  rangeUnknown: '{start}–{end}',
  reorderRow: 'Reorder {row}',
  resize: 'Resize column',
  resized: '{column}, {width} pixels',
  retry: 'Try again',
  rowMoved: '{row} moved to position {position}',
  save: 'Save',
  selectAll: 'Select all rows',
  selectAllFiltered: '{count, plural, one {Select the # row} other {Select all # rows}}',
  selectAllPage:
    '{count, plural, one {Select the # row on this page} other {Select the # rows on this page}}',
  selectRow: 'Select row {row}',
  sortAscending: '{column} ascending',
  sortAscendingAction: 'Sort ascending',
  sortClearAction: 'Remove sort',
  sortCleared: 'sorting removed',
  sortDescending: '{column} descending',
  sortDescendingAction: 'Sort descending',
  sortedBy: 'Sorted by {order}',
  unpin: 'Unpin',
};

export const dataGridMessages: MessageFamily<'dataGrid', DataGridMessages> = {
  name: 'dataGrid',
  base: en,
};
