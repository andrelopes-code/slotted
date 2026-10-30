import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `table` writes on its own. */
export interface TableMessages {
  readonly collapse: Message;
  readonly expand: Message;
  readonly false: Message;
  readonly filterApplied: Message<{ column: string; filter: string }>;
  readonly filterApply: Message;
  readonly filterClear: Message;
  readonly filterCleared: Message<{ column: string }>;
  readonly filterColumn: Message<{ column: string }>;
  readonly filterConditionAdded: Message;
  readonly filterEmpty: Message;
  readonly filterFrom: Message;
  readonly filterJoin: Message;
  readonly filterJoins: {
    readonly and: Message;
    readonly or: Message;
  };
  readonly filterMatches: Message<{ count: number }>;
  readonly filterOperands: Message<{ operator: string; count: number }>;
  readonly filterOperator: Message;
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
  readonly filterSearch: Message;
  readonly filterSelectAll: Message;
  readonly filterTo: Message;
  readonly filterValue: Message;
  readonly scroll: Message;
  readonly selectAll: Message<{ count: number }>;
  readonly selectRow: Message<{ row: string }>;
  readonly sortCleared: Message<{ column: string }>;
  readonly sortedAscending: Message<{ column: string }>;
  readonly sortedDescending: Message<{ column: string }>;
  readonly true: Message;
}

export const en: TableMessages = {
  collapse: 'Hide details',
  expand: 'Show details',
  false: 'No',
  filterApplied: 'Filter {column}: {filter}',
  filterApply: 'Apply',
  filterClear: 'Clear',
  filterCleared: 'Filter {column}, filter removed',
  filterColumn: 'Filter {column}',
  filterConditionAdded: 'second condition added',
  filterEmpty: 'No values match',
  filterFrom: 'From',
  filterJoin: 'Match',
  filterJoins: {
    and: 'And',
    or: 'Or',
  },
  filterMatches: '{count, plural, one {# value matches} other {# values match}}',
  filterOperands:
    '{operator}, {count, plural, =0 {no value needed} =1 {one value} other {two values}}',
  filterOperator: 'Condition',
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
  filterSearch: 'Search values',
  filterSelectAll: 'All',
  filterTo: 'To',
  filterValue: 'Value',
  scroll: 'Table, scrollable',
  selectAll: '{count, plural, =0 {Select all rows} other {Select all rows (# selected)}}',
  selectRow: 'Select row {row}',
  sortCleared: '{column}, sorting removed',
  sortedAscending: '{column}, sorted ascending',
  sortedDescending: '{column}, sorted descending',
  true: 'Yes',
};

export const tableMessages: MessageFamily<'table', TableMessages> = { name: 'table', base: en };
