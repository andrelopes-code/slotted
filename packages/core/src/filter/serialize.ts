/**
 * A filter, written so a query string can carry it and read back so it can be
 * trusted.
 *
 * None of the implementations surveyed ships this, and every application that
 * filters a listing and then lets a reader share the URL writes it again. The
 * form is compact and readable — `set~and~anyOf:paid,refunded` — rather than
 * JSON, because a reader sees it in the address bar.
 *
 * `parseFilter` is total: an unknown kind, an unknown operator, a missing
 * operand or an operand of the wrong shape all give `null`. A bookmark written
 * by an older version of an application then degrades to no filter, which is a
 * screen the reader can use, rather than to a thrown error on first paint.
 */

import {
  isISOOperand,
  normalizeFilter,
  type FilterCondition,
  type FilterDescriptor,
  type FilterJoin,
} from './descriptor';
import {
  isFilterKind,
  isOperatorOf,
  operandCount,
  type FilterKind,
  type FilterOperator,
} from './operators';

/** The two characters the format itself uses, and the set separator. */
const FIELD = '~';
const OPERAND = ':';
const ITEM = ',';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const JOINS: readonly FilterJoin[] = ['and', 'or'];

/**
 * `encodeURIComponent` leaves `~` alone — it is unreserved in RFC 3986 — and
 * that is the one character this format cannot afford to see unescaped.
 */
function encode(value: string) {
  return encodeURIComponent(value).replace(/~/g, '%7E');
}

function decode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function writeOperand(kind: FilterKind, value: unknown): string {
  if (kind === 'set') {
    return ((value as readonly string[]) ?? []).map((item) => encode(item)).join(ITEM);
  }
  return encode(String(value));
}

function readOperand(kind: FilterKind, text: string): unknown {
  if (kind === 'set') {
    const items = text.split(ITEM).map((item) => decode(item));
    if (items.length === 0 || items.some((item) => item === null || item === '')) return null;
    return items as readonly string[];
  }

  const value = decode(text);
  if (value === null || value === '') return null;

  switch (kind) {
    case 'number': {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    case 'date':
      return ISO_DAY.test(value) ? value : null;
    case 'time':
    case 'datetime':
      return isISOOperand(kind, value) ? value : null;
    case 'boolean':
      return value === 'true' ? true : value === 'false' ? false : null;
    default:
      return value;
  }
}

export function serializeFilter(filter: FilterDescriptor | null | undefined): string {
  const normalized = normalizeFilter(filter);
  if (!normalized) return '';

  const conditions = normalized.conditions.map((condition) => {
    const operands = operandCount(condition.operator as FilterOperator);
    const written: string[] = [condition.operator];
    if (operands >= 1) written.push(writeOperand(normalized.kind, condition.value));
    if (operands === 2) written.push(writeOperand(normalized.kind, condition.end));
    return written.join(OPERAND);
  });

  return [normalized.kind, normalized.join, ...conditions].join(FIELD);
}

export function parseFilter(text: string | null | undefined): FilterDescriptor | null {
  if (!text) return null;

  const [kind, join, ...written] = text.split(FIELD);
  if (!kind || !isFilterKind(kind)) return null;
  if (!join || !JOINS.includes(join as FilterJoin)) return null;
  /** One condition, or the two a panel can hold. Never more — that is `filter-bar`. */
  if (written.length === 0 || written.length > 2) return null;

  const conditions: FilterCondition<string, unknown>[] = [];
  for (const part of written) {
    const [operator, ...operands] = part.split(OPERAND);
    if (operator === undefined) return null;
    if (!isOperatorOf(kind, operator)) return null;

    const expected = operandCount(operator);
    if (operands.length !== expected) return null;

    const condition: { operator: string; value?: unknown; end?: unknown } = { operator };
    if (expected >= 1) {
      const value = readOperand(kind, operands[0]!);
      if (value === null) return null;
      condition.value = value;
    }
    if (expected === 2) {
      const end = readOperand(kind, operands[1]!);
      if (end === null) return null;
      condition.end = end;
    }
    conditions.push(condition as FilterCondition<string, unknown>);
  }

  return { kind, join: join as FilterJoin, conditions } as FilterDescriptor;
}

export interface FilterParamOptions {
  /** What each column's parameter is named with. */
  prefix?: string;
}

const DEFAULT_PREFIX = 'f.';

/**
 * One parameter per column that holds something. A column whose filter is empty
 * is left out rather than written as an empty value, so the URL says what is
 * applied and nothing else.
 */
export function toFilterParams(
  filters: Readonly<Record<string, FilterDescriptor | null | undefined>>,
  { prefix = DEFAULT_PREFIX }: FilterParamOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [column, filter] of Object.entries(filters)) {
    const written = serializeFilter(filter);
    if (written !== '') params.set(`${prefix}${column}`, written);
  }
  return params;
}

/**
 * The filters a query string carries, by column. A parameter that cannot be read
 * is dropped: one unreadable column is one filter fewer, not a broken screen.
 */
export function fromFilterParams(
  input: URLSearchParams | string,
  { prefix = DEFAULT_PREFIX }: FilterParamOptions = {},
): Record<string, FilterDescriptor> {
  const params = typeof input === 'string' ? new URLSearchParams(input) : input;
  const filters: Record<string, FilterDescriptor> = {};

  for (const [key, value] of params) {
    if (!key.startsWith(prefix)) continue;
    const column = key.slice(prefix.length);
    const filter = parseFilter(value);
    if (column !== '' && filter) filters[column] = filter;
  }

  return filters;
}
