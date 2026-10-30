/**
 * A filter as a sentence.
 *
 * `docs/component-features.md` §12 asks a filter builder for a readable text
 * expression that summarises what is applied. It is written here rather than in
 * a family so that `filter-bar`'s chips, `table`'s announcement and the
 * accessible name of a filtered column's trigger all say the same sentence.
 *
 * The words are the caller's: this module knows the shape, never the language.
 * Excel's own tooltip on a filtered header reads "Larger than 150", which is the
 * form this produces.
 */

import { activeConditions, type FilterDescriptor, type FilterJoin } from './descriptor';
import { operandCount, type FilterKind, type FilterOperator } from './operators';

export interface FilterDescriptionFormat {
  /** The operator's name in the reader's language. */
  operator: (operator: FilterOperator, kind: FilterKind) => string;
  /** The word between two conditions, and between the two ends of a range. */
  join: (join: FilterJoin) => string;
  /** How an operand is written. Defaults to the value itself. */
  value?: (value: unknown, kind: FilterKind) => string;
}

/**
 * The operator a list of one is read as. A set condition holding a single value
 * is the equality of that value: `anyOf [active]` and `is active` select the
 * same rows, and "Status any of Active" is the plural form of a sentence with
 * nothing plural in it. The substitution is on the shared vocabulary, not on
 * the words, so the caller's language decides how `is` and `isNot` are written;
 * both are already in every labels map, because `date` and `boolean` take them.
 *
 * The condition itself is untouched: the operator control still reads `anyOf`,
 * and adding a second value returns the sentence to the list form.
 */
const SINGULAR: Partial<Record<FilterOperator, FilterOperator>> = {
  anyOf: 'is',
  noneOf: 'isNot',
};

/**
 * The operator a condition is read as: the equality of its one value for a set
 * of one, the condition's own operator otherwise. A chip that writes the
 * operator apart from its value reads the same word the sentence does.
 */
export function spokenOperator(
  kind: FilterKind,
  condition: { readonly operator: string; readonly value?: unknown },
): FilterOperator {
  const operator = condition.operator as FilterOperator;
  if (kind !== 'set') return operator;
  const values = (condition.value as readonly unknown[] | undefined) ?? [];
  return values.length === 1 ? (SINGULAR[operator] ?? operator) : operator;
}

export function describeFilter(
  filter: FilterDescriptor | null | undefined,
  format: FilterDescriptionFormat,
): string {
  const conditions = activeConditions(filter);
  if (!filter || conditions.length === 0) return '';

  const write = (value: unknown) =>
    format.value ? format.value(value, filter.kind) : String(value);

  const sentences = conditions.map((condition) => {
    const operator = condition.operator as FilterOperator;
    const operands = operandCount(operator);
    const values =
      filter.kind === 'set'
        ? ((condition.value as readonly string[] | undefined) ?? [])
        : undefined;
    const name = format.operator(spokenOperator(filter.kind, condition), filter.kind);

    if (operands === 0) return name;
    if (values) return `${name} ${values.map((value) => write(value)).join(', ')}`;
    if (operands === 1) return `${name} ${write(condition.value)}`;
    return `${name} ${write(condition.value)} ${format.join('and')} ${write(condition.end)}`;
  });

  return sentences.join(` ${format.join(filter.join)} `);
}
