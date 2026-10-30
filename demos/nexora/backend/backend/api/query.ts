import { NexoraApiError, quantityToMilli, type Money } from '../domain';

/**
 * List query semantics (sections 73.3, 73.5–73.7).
 */

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty';

export type FilterClause = Partial<Record<FilterOperator, unknown>>;

export type FilterValue = string | number | boolean | null | (string | number)[] | FilterClause;

export interface ListQuery {
  page?: number;
  pageSize?: number;
  /** Comma-separated field names; a leading `-` sorts descending. */
  sort?: string;
  filter?: Record<string, FilterValue>;
  /** Full-text query combined with filters using logical AND. */
  q?: string;
}

export interface ListResponse<T> {
  data: T[];
  page: { number: number; size: number; totalItems: number; totalPages: number };
  meta?: Record<string, unknown>;
}

export interface EntityResponse<T> {
  data: T;
}

export type FieldType =
  'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'money' | 'quantity' | 'array';

export interface FieldDefinition<T> {
  type: FieldType;
  get: (item: T) => unknown;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ResourceDefinition<T> {
  fields: Record<string, FieldDefinition<T>>;
  /** Strings matched case-insensitively by `q` (section 71.2). */
  search?: (item: T) => (string | undefined)[];
  defaultSort: string;
}

export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 50;

function comparableValue(value: unknown, type: FieldType): number | string | boolean | null {
  if (value === undefined || value === null) return null;
  switch (type) {
    case 'money':
      return (value as Money).minor;
    case 'quantity':
      return quantityToMilli(String(value));
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'array':
      return Array.isArray(value) ? value.length : null;
    default:
      return String(value);
  }
}

function coerce(input: unknown, type: FieldType): number | string | boolean | null {
  if (input === undefined || input === null || input === '') return null;
  switch (type) {
    case 'money':
    case 'number':
      return Number(input);
    case 'quantity':
      return quantityToMilli(String(input));
    case 'boolean':
      return input === true || input === 'true' || input === 1 || input === '1';
    default:
      return String(input);
  }
}

function splitList(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string')
    return input
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  return [input];
}

function normalizeClause(value: FilterValue, type: FieldType): FilterClause {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) return value;
  if (Array.isArray(value)) return { in: value };
  if (typeof value === 'string' && value.includes(',') && (type === 'enum' || type === 'string'))
    return { in: splitList(value) };
  return { eq: value };
}

function matches<T>(
  item: T,
  field: FieldDefinition<T>,
  clause: FilterClause,
  name: string,
): boolean {
  const raw = field.get(item);
  for (const [operator, expected] of Object.entries(clause) as [FilterOperator, unknown][]) {
    if (expected === undefined) continue;
    switch (operator) {
      case 'is_empty':
        if (!(
          raw === undefined ||
          raw === null ||
          raw === '' ||
          (Array.isArray(raw) && raw.length === 0)
        ))
          return false;
        break;
      case 'is_not_empty':
        if (
          raw === undefined ||
          raw === null ||
          raw === '' ||
          (Array.isArray(raw) && raw.length === 0)
        )
          return false;
        break;
      case 'contains':
      case 'not_contains': {
        const needle = String(expected).toLowerCase();
        const found = Array.isArray(raw)
          ? raw.some((entry) => String(entry).toLowerCase() === needle)
          : String(raw ?? '')
              .toLowerCase()
              .includes(needle);
        if (operator === 'contains' ? !found : found) return false;
        break;
      }
      case 'in':
      case 'not_in': {
        const set = new Set(splitList(expected).map((entry) => String(coerce(entry, field.type))));
        const hit = Array.isArray(raw)
          ? raw.some((entry) => set.has(String(entry)))
          : set.has(String(comparableValue(raw, field.type)));
        if (operator === 'in' ? !hit : hit) return false;
        break;
      }
      case 'eq':
      case 'neq': {
        const left = comparableValue(raw, field.type);
        const right = coerce(expected, field.type);
        const equal = Array.isArray(raw)
          ? raw.some((entry) => String(entry) === String(right))
          : left === right;
        if (operator === 'eq' ? !equal : equal) return false;
        break;
      }
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte': {
        const left = comparableValue(raw, field.type);
        const right = coerce(expected, field.type);
        if (left === null || right === null) return false;
        if (operator === 'gt' && !(left > right)) return false;
        if (operator === 'gte' && !(left >= right)) return false;
        if (operator === 'lt' && !(left < right)) return false;
        if (operator === 'lte' && !(left <= right)) return false;
        break;
      }
      default:
        throw new NexoraApiError(
          'INVALID_QUERY',
          `Unsupported filter operator ${String(operator)} on ${name}`,
        );
    }
  }
  return true;
}

export interface ParsedSort {
  field: string;
  direction: 'asc' | 'desc';
}

export function parseSort(sort: string | undefined, fallback: string): ParsedSort[] {
  return (sort && sort.trim().length > 0 ? sort : fallback)
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith('-')
        ? { field: part.slice(1), direction: 'desc' as const }
        : { field: part, direction: 'asc' as const },
    );
}

function compareValues(a: unknown, b: unknown, type: FieldType): number {
  const left = comparableValue(a, type);
  const right = comparableValue(b, type);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return String(left).localeCompare(String(right));
}

/** Applies filters, search, sort and pagination to an in-memory collection. */
/**
 * The query's filters on the named fields, as a test a stored record can answer before it is
 * turned into a list item. A resource whose items join other records filters by the fields its
 * records already carry first, so the join is paid for the matching records only. Filters on
 * other fields, and malformed filters, are left to `runListQuery`.
 */
export function storedFilter<S, T extends S>(
  definition: ResourceDefinition<T>,
  query: ListQuery,
  stored: readonly (keyof S & string)[],
): (record: S) => boolean {
  const clauses: [string, FieldDefinition<T>, FilterClause][] = [];
  for (const [name, value] of Object.entries(query.filter ?? {})) {
    const field = definition.fields[name];
    if (!field || field.filterable === false || !(stored as readonly string[]).includes(name))
      continue;
    clauses.push([name, field, normalizeClause(value, field.type)]);
  }
  return (record) =>
    clauses.every(([name, field, clause]) => matches(record as T, field, clause, name));
}

export function runListQuery<T>(
  items: Iterable<T>,
  definition: ResourceDefinition<T>,
  query: ListQuery = {},
  meta?: Record<string, unknown>,
): ListResponse<T> {
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  if (!PAGE_SIZES.includes(pageSize as (typeof PAGE_SIZES)[number])) {
    throw new NexoraApiError('INVALID_QUERY', `pageSize must be one of ${PAGE_SIZES.join(', ')}`);
  }
  const page = query.page ?? 1;
  if (!Number.isInteger(page) || page < 1)
    throw new NexoraApiError('INVALID_QUERY', 'page must be a positive integer');

  const clauses: [string, FieldDefinition<T>, FilterClause][] = [];
  for (const [name, value] of Object.entries(query.filter ?? {})) {
    const field = definition.fields[name];
    if (!field || field.filterable === false)
      throw new NexoraApiError('INVALID_QUERY', `Unknown or non-filterable field ${name}`);
    clauses.push([name, field, normalizeClause(value, field.type)]);
  }
  const sorts = parseSort(query.sort, definition.defaultSort).map((sort) => {
    const field = definition.fields[sort.field];
    if (!field || field.sortable === false)
      throw new NexoraApiError('INVALID_SORT', `Unknown or non-sortable field ${sort.field}`);
    return { ...sort, definition: field };
  });
  const needle = query.q?.trim().toLowerCase();
  if (needle !== undefined && needle.length > 0 && needle.length < 2)
    throw new NexoraApiError('INVALID_QUERY', 'q requires at least 2 characters');

  const filtered: T[] = [];
  for (const item of items) {
    let keep = true;
    for (const [name, field, clause] of clauses) {
      if (!matches(item, field, clause, name)) {
        keep = false;
        break;
      }
    }
    if (!keep) continue;
    if (needle && definition.search) {
      const haystack = definition.search(item);
      if (!haystack.some((text) => text !== undefined && text.toLowerCase().includes(needle)))
        continue;
    }
    filtered.push(item);
  }
  filtered.sort((a, b) => {
    for (const sort of sorts) {
      const result = compareValues(
        sort.definition.get(a),
        sort.definition.get(b),
        sort.definition.type,
      );
      if (result !== 0) return sort.direction === 'asc' ? result : -result;
    }
    return 0;
  });
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    page: { number: page, size: pageSize, totalItems, totalPages },
    ...(meta ? { meta } : {}),
  };
}

/** Parses HTTP-style query strings: `filter[status]=a,b`, `filter[orderDate][gte]=…`, `sort=-orderDate`, `page`, `pageSize`, `q`. */
export function parseListQuery(params: URLSearchParams | Record<string, string>): ListQuery {
  const entries =
    params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params);
  const query: ListQuery = {};
  const filter: Record<string, FilterValue> = {};
  for (const [key, value] of entries) {
    if (key === 'page') query.page = Number(value);
    else if (key === 'pageSize') query.pageSize = Number(value);
    else if (key === 'sort') query.sort = value;
    else if (key === 'q') query.q = value;
    else {
      const match = /^filter\[([^\]]+)\](?:\[([^\]]+)\])?$/.exec(key);
      if (!match) throw new NexoraApiError('INVALID_QUERY', `Unknown query parameter ${key}`);
      const [, field, operator] = match as unknown as [string, string, string | undefined];
      if (operator) {
        const existing = (filter[field] ?? {}) as FilterClause;
        if (typeof existing !== 'object' || Array.isArray(existing))
          throw new NexoraApiError('INVALID_QUERY', `Conflicting filters for ${field}`);
        (existing as Record<string, unknown>)[operator] = value;
        filter[field] = existing;
      } else {
        filter[field] = value;
      }
    }
  }
  if (Object.keys(filter).length > 0) query.filter = filter;
  return query;
}

/** Builds a field map from a plain object of getters and types. */
export function fields<T>(
  spec: Record<string, [FieldType, (item: T) => unknown] | FieldDefinition<T>>,
): Record<string, FieldDefinition<T>> {
  const output: Record<string, FieldDefinition<T>> = {};
  for (const [name, definition] of Object.entries(spec)) {
    output[name] = Array.isArray(definition)
      ? { type: definition[0], get: definition[1] }
      : definition;
  }
  return output;
}
