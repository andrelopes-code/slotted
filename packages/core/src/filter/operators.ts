/**
 * The operator vocabulary, by kind.
 *
 * It is the library's, not one family's: `table` edits a column's condition in
 * its header, `filter-bar` edits the same condition in a bar above the table and
 * `data-grid` carries it in a query. A vocabulary written inside any one of them
 * would be three families disagreeing about one descriptor, which is the
 * argument that put `sort` in the shared contract schema.
 *
 * Every operator here is shipped by two or more of the implementations surveyed
 *.
 * Nothing here touches the DOM or a framework.
 */

export type FilterKind = 'text' | 'number' | 'date' | 'time' | 'datetime' | 'boolean' | 'set';

export type TextOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'empty'
  | 'notEmpty';

export type NumberOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'empty'
  | 'notEmpty';

/**
 * A day says `is` where a string says `equals`. The two are not the same
 * comparison — a string is compared through a collator and a day as a day — and
 * one word for both would read as one comparison.
 */
export type DateOperator = 'is' | 'isNot' | 'before' | 'after' | 'between' | 'empty' | 'notEmpty';

/**
 * A time and a date-time say the sentence a day says — "starts at 09:00",
 * "created before 14 September at 10:00" — so they take the day's operators
 * rather than a vocabulary of their own. The two names exist so a consumer can
 * write the narrow type without learning that the three are one.
 */
export type TimeOperator = DateOperator;
export type DateTimeOperator = DateOperator;

export type BooleanOperator = 'is' | 'empty' | 'notEmpty';

export type SetOperator = 'anyOf' | 'noneOf';

export type FilterOperator =
  TextOperator | NumberOperator | DateOperator | BooleanOperator | SetOperator;

/** The operator type each kind holds, so a caller keeps the narrow one. */
export interface FilterOperatorsByKind {
  text: readonly TextOperator[];
  number: readonly NumberOperator[];
  date: readonly DateOperator[];
  time: readonly TimeOperator[];
  datetime: readonly DateTimeOperator[];
  boolean: readonly BooleanOperator[];
  set: readonly SetOperator[];
}

export const FILTER_KINDS = [
  'text',
  'number',
  'date',
  'time',
  'datetime',
  'boolean',
  'set',
] as const;

const OPERATORS: FilterOperatorsByKind = {
  text: Object.freeze([
    'contains',
    'notContains',
    'equals',
    'notEquals',
    'startsWith',
    'endsWith',
    'empty',
    'notEmpty',
  ] as const),
  number: Object.freeze([
    'equals',
    'notEquals',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'between',
    'empty',
    'notEmpty',
  ] as const),
  date: Object.freeze(['is', 'isNot', 'before', 'after', 'between', 'empty', 'notEmpty'] as const),
  time: Object.freeze(['is', 'isNot', 'before', 'after', 'between', 'empty', 'notEmpty'] as const),
  datetime: Object.freeze([
    'is',
    'isNot',
    'before',
    'after',
    'between',
    'empty',
    'notEmpty',
  ] as const),
  boolean: Object.freeze(['is', 'empty', 'notEmpty'] as const),
  set: Object.freeze(['anyOf', 'noneOf'] as const),
};

/**
 * The default each kind opens on. `contains` for text and `equals` for number
 * are AG Grid's own defaults, kept rather than re-decided.
 */
const DEFAULTS = {
  text: 'contains',
  number: 'equals',
  date: 'is',
  time: 'is',
  datetime: 'is',
  boolean: 'is',
  set: 'anyOf',
} as const;

/** How many operands an operator takes: none, one, or the range's two. */
const OPERANDS: Readonly<Record<FilterOperator, 0 | 1 | 2>> = {
  contains: 1,
  notContains: 1,
  equals: 1,
  notEquals: 1,
  startsWith: 1,
  endsWith: 1,
  greaterThan: 1,
  greaterThanOrEqual: 1,
  lessThan: 1,
  lessThanOrEqual: 1,
  is: 1,
  isNot: 1,
  before: 1,
  after: 1,
  /** A chosen list is one operand, however many values are in it. */
  anyOf: 1,
  noneOf: 1,
  between: 2,
  empty: 0,
  notEmpty: 0,
};

export function operatorsFor<Kind extends FilterKind>(kind: Kind): FilterOperatorsByKind[Kind] {
  return OPERATORS[kind];
}

export function defaultOperator<Kind extends FilterKind>(kind: Kind): (typeof DEFAULTS)[Kind] {
  return DEFAULTS[kind];
}

export function operandCount(operator: FilterOperator): 0 | 1 | 2 {
  return OPERANDS[operator];
}

/** Whether the kind offers the operator, which is what a parser has to ask. */
export function isOperatorOf(kind: FilterKind, operator: string): operator is FilterOperator {
  return (OPERATORS[kind] as readonly string[]).includes(operator);
}

export function isFilterKind(value: string): value is FilterKind {
  return (FILTER_KINDS as readonly string[]).includes(value);
}
