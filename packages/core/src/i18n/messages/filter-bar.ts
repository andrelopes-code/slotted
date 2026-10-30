import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `filter-bar` writes on its own. */
export interface FilterBarMessages {
  readonly add: Message;
  readonly addGroup: Message;
  readonly addRule: Message;
  readonly appliedCount: Message<{ count: number; filters: string }>;
  readonly apply: Message;
  readonly bar: Message;
  readonly builder: Message;
  readonly cancel: Message;
  readonly clear: Message;
  readonly cleared: Message;
  readonly clearedTo: Message<{ filters: string }>;
  readonly clearRule: Message;
  readonly condition: Message<{ operator: string; value: string }>;
  readonly count: Message<{ count: number; total: number }>;
  readonly countOnly: Message<{ count: number }>;
  readonly done: Message;
  readonly field: Message;
  readonly filters: Message;
  readonly from: Message;
  readonly incomplete: Message<{ rule: string }>;
  readonly joins: {
    readonly and: Message;
    readonly or: Message;
  };
  readonly less: Message;
  readonly match: Message;
  readonly matchAll: Message;
  readonly matchAny: Message;
  readonly matches: Message<{ join: string }>;
  readonly more: Message<{ count: number }>;
  readonly moreValues: Message<{ values: string; count: number }>;
  readonly noValue: Message;
  readonly operator: Message;
  readonly operators: {
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
  readonly preset: Message;
  readonly presetNone: Message;
  readonly readOnly: Message;
  readonly remove: Message<{ name: string }>;
  readonly removed: Message<{ field: string }>;
  readonly removeGroup: Message;
  readonly removeRule: Message;
  readonly required: Message<{ field: string }>;
  readonly reset: Message;
  readonly rule: Message<{ field: string; condition: string }>;
  readonly savePreset: Message;
  readonly search: Message;
  readonly summary: Message<{ count: number }>;
  readonly to: Message;
  readonly unknownField: Message<{ field: string }>;
  readonly value: Message;
  readonly where: Message;
}

export const en: FilterBarMessages = {
  add: 'Add filter',
  addGroup: 'Add group',
  addRule: 'Add rule',
  appliedCount: '{count, plural, one {# filter applied} other {# filters applied}}: {filters}',
  apply: 'Apply',
  bar: 'Filter',
  builder: 'Filters',
  cancel: 'Cancel',
  clear: 'Clear all',
  cleared: 'Filters cleared',
  clearedTo: 'Filters cleared. {filters}',
  clearRule: 'Clear',
  condition: '{operator} {value}',
  count: '{count} of {total}',
  countOnly: '{count}',
  done: 'Done',
  field: 'Field',
  filters: 'Filters',
  from: 'From',
  incomplete: '{rule}, incomplete',
  joins: {
    and: 'and',
    or: 'or',
  },
  less: 'Show less',
  match: 'Match',
  matchAll: 'All',
  matchAny: 'Any',
  matches: 'Match {join} of the following',
  more: '+{count} more',
  moreValues: '{values} +{count}',
  noValue: 'Select value',
  operator: 'Operator',
  operators: {
    after: 'after',
    anyOf: 'any of',
    before: 'before',
    between: 'between',
    contains: 'contains',
    empty: 'is empty',
    endsWith: 'ends with',
    equals: 'equals',
    greaterThan: 'greater than',
    greaterThanOrEqual: 'at least',
    is: 'is',
    isNot: 'is not',
    lessThan: 'less than',
    lessThanOrEqual: 'at most',
    noneOf: 'none of',
    notContains: 'does not contain',
    notEmpty: 'is not empty',
    notEquals: 'does not equal',
    startsWith: 'starts with',
  },
  preset: 'Saved view',
  presetNone: 'No saved view',
  readOnly: 'Read only',
  remove: 'Remove {name}',
  removed: '{field} filter removed',
  removeGroup: 'Remove group',
  removeRule: 'Remove rule',
  required: '{field} needs a value',
  reset: 'Reset',
  rule: '{field}: {condition}',
  savePreset: 'Save as view…',
  search: 'Search',
  summary: 'Filters ({count})',
  to: 'To',
  unknownField: 'Unknown field {field}',
  value: 'Value',
  where: 'Where',
};

export const filterBarMessages: MessageFamily<'filterBar', FilterBarMessages> = {
  name: 'filterBar',
  base: en,
};
