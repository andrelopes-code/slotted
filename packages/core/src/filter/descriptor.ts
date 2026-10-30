/**
 * The shape a filter is, and the three questions that can be asked of it
 * without evaluating it: what it holds, what of that is complete, and what it
 * looks like once the incomplete parts are dropped.
 *
 * One shape for five kinds. It is AG Grid's `ICombinedSimpleModel` with the
 * column taken out and the operand count made explicit: the column is the key a
 * consumer already holds a filter under, so putting it inside would be saying it
 * twice.
 *
 * Every field is JSON — no class, no `Date`, no function — because
 * `docs/component-features.md` §12 asks for one serialisable query model that a
 * client and a server both read.
 */

import {
  defaultOperator,
  operandCount,
  type BooleanOperator,
  type DateOperator,
  type DateTimeOperator,
  type FilterKind,
  type FilterOperator,
  type NumberOperator,
  type SetOperator,
  type TextOperator,
  type TimeOperator,
} from './operators';

export type FilterJoin = 'and' | 'or';

export interface FilterCondition<Operator extends string = FilterOperator, Value = unknown> {
  readonly operator: Operator;
  /** The first operand, absent where the operator takes none. */
  readonly value?: Value | null;
  /** The second, which only `between` has. */
  readonly end?: Value | null;
}

export interface FilterShape<Kind extends FilterKind, Operator extends string, Value> {
  readonly kind: Kind;
  readonly join: FilterJoin;
  readonly conditions: readonly FilterCondition<Operator, Value>[];
}

export type TextFilter = FilterShape<'text', TextOperator, string>;
export type NumberFilter = FilterShape<'number', NumberOperator, number>;
/**
 * A day, written `YYYY-MM-DD`, which is what `toISODate` in `@slotted/core/date`
 * produces. Two of them compare correctly as strings, and the stored form and
 * the serialised form are then the same text.
 */
export type DateFilter = FilterShape<'date', DateOperator, string>;
/**
 * ISO text at the precision the reader wrote: `HH`, `HH:MM` or `HH:MM:SS` for
 * a time, and `YYYY-MM-DD` followed by any of those after a `T` for a
 * date-time. Each accepted form is a prefix of the full one cut at a field, and
 * the predicate compares the row value cut to the operand's own length — so
 * `is 09:14` matches every second of that minute, the way `is 2026-09-14`
 * matches every hour of that day. `isISOOperand` is the grammar.
 */
export type TimeFilter = FilterShape<'time', TimeOperator, string>;
export type DateTimeFilter = FilterShape<'datetime', DateTimeOperator, string>;
export type BooleanFilter = FilterShape<'boolean', BooleanOperator, boolean>;
/** The chosen values are one operand, not many conditions — see `setFilter`. */
export type SetFilter = FilterShape<'set', SetOperator, readonly string[]>;

export type FilterDescriptor =
  TextFilter | NumberFilter | DateFilter | TimeFilter | DateTimeFilter | BooleanFilter | SetFilter;

/** The descriptor each kind is, so a generic caller keeps the narrow type. */
export interface FilterByKind {
  text: TextFilter;
  number: NumberFilter;
  date: DateFilter;
  time: TimeFilter;
  datetime: DateTimeFilter;
  boolean: BooleanFilter;
  set: SetFilter;
}

/** The operand each kind holds, for a control that edits one. */
export interface FilterValueByKind {
  text: string;
  number: number;
  date: string;
  time: string;
  datetime: string;
  boolean: boolean;
  set: readonly string[];
}

const TIME_OPERAND = /^\d{2}(?::\d{2}(?::\d{2})?)?$/;
const DATE_TIME_OPERAND = /^\d{4}-\d{2}-\d{2}(?:T\d{2}(?::\d{2}(?::\d{2})?)?)?$/;

/**
 * Whether the text is a time or a date-time operand: a prefix of the canonical
 * ISO form cut at a field boundary. A fraction, an offset, a `Z` or a space
 * where the `T` goes is refused, because each would make the text something
 * other than the wall-clock value this library holds.
 */
export function isISOOperand(kind: 'time' | 'datetime', text: string): boolean {
  return (kind === 'time' ? TIME_OPERAND : DATE_TIME_OPERAND).test(text);
}

/**
 * The descriptor a panel opens on: one condition, no operand, joined by `and`
 * because a second condition has not been written yet.
 */
export function emptyFilter<Kind extends FilterKind>(
  kind: Kind,
  operator?: FilterByKind[Kind]['conditions'][number]['operator'],
): FilterByKind[Kind] {
  /* The five descriptors have conflicting `kind`s, so their intersection is
     `never` and a direct assertion is refused. The shape is built once, here,
     and every caller reads it back through the narrow type. */
  return {
    kind,
    join: 'and',
    conditions: [{ operator: operator ?? defaultOperator(kind) }],
  } as unknown as FilterByKind[Kind];
}

/**
 * The descriptor a chosen list of values is. It is also the migration from the
 * shape this family's filter held before it had operators, where the value was
 * the array itself.
 */
export function setFilter(values: readonly string[], operator: SetOperator = 'anyOf'): SetFilter {
  return { kind: 'set', join: 'and', conditions: [{ operator, value: values }] };
}

function hasOperand(kind: FilterKind, value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (kind === 'set') return Array.isArray(value) && value.length > 0;
  if (kind === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (kind === 'boolean') return typeof value === 'boolean';
  return String(value) !== '';
}

/**
 * Whether the condition has every operand its operator needs.
 *
 * An operator that takes none — `empty`, `notEmpty` — is always complete, and a
 * range needs both ends. `false` counts as an operand, because `false` is what
 * the reader chose; an empty list does not, because it is a list nobody filled.
 */
export function isConditionActive(
  kind: FilterKind,
  condition: FilterCondition<string, unknown>,
): boolean {
  const operands = operandCount(condition.operator as FilterOperator);
  if (operands === 0) return true;
  if (!hasOperand(kind, condition.value)) return false;
  return operands === 1 || hasOperand(kind, condition.end);
}

/**
 * The conditions that will actually be evaluated.
 *
 * An incomplete condition is dropped rather than treated as one that matches
 * everything, and the difference only shows under `or`: an always-true condition
 * there would make the whole filter match every row, which is the opposite of
 * what a reader who has not finished typing meant.
 */
export function activeConditions(
  filter: FilterDescriptor | null | undefined,
): readonly FilterCondition<string, unknown>[] {
  if (!filter) return [];
  return filter.conditions.filter((condition) => isConditionActive(filter.kind, condition));
}

export function isFilterActive(filter: FilterDescriptor | null | undefined): boolean {
  return activeConditions(filter).length > 0;
}

/**
 * The filter with nothing incomplete left in it, or `null` when that leaves
 * nothing at all — which is the value a consumer stores and a URL carries.
 */
export function normalizeFilter(
  filter: FilterDescriptor | null | undefined,
): FilterDescriptor | null {
  const conditions = activeConditions(filter);
  if (!filter || conditions.length === 0) return null;
  return { kind: filter.kind, join: filter.join, conditions } as FilterDescriptor;
}

/**
 * The filter with one condition replaced, or appended when the index is past the
 * end — so a panel revealing its second condition is one call rather than a
 * branch.
 */
export function withCondition<Filter extends FilterDescriptor>(
  filter: Filter,
  index: number,
  condition: Filter['conditions'][number],
): Filter {
  const conditions = [...filter.conditions];
  if (index >= conditions.length) conditions.push(condition);
  else conditions[index] = condition;
  return { ...filter, conditions } as Filter;
}

export function withJoin<Filter extends FilterDescriptor>(
  filter: Filter,
  join: FilterJoin,
): Filter {
  return { ...filter, join } as Filter;
}
