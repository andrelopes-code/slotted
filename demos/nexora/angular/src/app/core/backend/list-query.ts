import type {
  FilterCondition,
  FilterDescriptor,
  FilterGroup,
  FilterRule,
} from '@slotted/core/filter';
import { emptyQuery, type GridColumnState, type GridQuery, type SortKey } from '@slotted/core/grid';
import type { FilterClause, FilterValue, ListQuery, SavedView } from '@slotted/demo-nexora-backend';

/** The page sizes the backend accepts (section 73.3); a list opens at the first. */
export const LIST_PAGE_SIZES = [25, 50, 100] as const;
export const LIST_PAGE_SIZE = 25;

/**
 * A grid column or a filter field is named by the backend field it reads, so
 * a sort key and a filter rule travel to the list query without a map. A list
 * whose values are shown in a unit the backend does not store — basis points
 * as percent, minor units as currency — hands its factors in `scaleOf`.
 */
export type ScaleMap = Readonly<Record<string, number>>;

const scaleWith = (scales: ScaleMap, field: string, value: unknown): unknown =>
  typeof value === 'number' && scales[field] !== undefined
    ? Math.round(value * scales[field])
    : value;

const unscaleWith = (scales: ScaleMap, field: string, value: unknown): unknown =>
  typeof value === 'number' && scales[field] !== undefined ? value / scales[field] : value;

type SavedFilter = SavedView['state']['filters'][number];

export interface ListRequest {
  readonly query: ListQuery;
  /** True when the tree held an `or` join or a nested group: the backend joins every clause with AND. */
  readonly flattened: boolean;
}

/** One condition of a descriptor as the clause the list query evaluates (section 73.6). */
function clauseOf(
  scales: ScaleMap,
  field: string,
  condition: FilterCondition<string, unknown>,
): FilterClause | null {
  const value = scaleWith(scales, field, condition.value);
  const end = scaleWith(scales, field, condition.end);
  switch (condition.operator) {
    case 'anyOf':
      return { in: value as (string | number)[] };
    case 'noneOf':
      return { not_in: value as (string | number)[] };
    case 'contains':
      return { contains: value };
    case 'notContains':
      return { not_contains: value };
    case 'equals':
    case 'is':
      return { eq: value };
    case 'notEquals':
    case 'isNot':
      return { neq: value };
    case 'greaterThan':
    case 'after':
      return { gt: value };
    case 'greaterThanOrEqual':
      return { gte: value };
    case 'lessThan':
    case 'before':
      return { lt: value };
    case 'lessThanOrEqual':
      return { lte: value };
    case 'between':
      return { gte: value, lte: end };
    case 'empty':
      return { is_empty: true };
    case 'notEmpty':
      return { is_not_empty: true };
    default:
      return null;
  }
}

function rulesOf(group: FilterGroup, into: FilterRule[], state: { flattened: boolean }): void {
  if (group.join === 'or' && group.rules.length > 1) state.flattened = true;
  for (const node of group.rules) {
    if ('rules' in node) {
      state.flattened = true;
      rulesOf(node, into, state);
    } else into.push(node);
  }
}

/** The grid's query as the backend's list query: filter, search, sort and page in the shape of section 73. */
export function toListQuery(query: GridQuery, scales: ScaleMap = {}): ListRequest {
  const state = { flattened: false };
  const rules: FilterRule[] = [];
  if (query.filter) rulesOf(query.filter, rules, state);
  const filter: Record<string, FilterValue> = {};
  for (const rule of rules) {
    if (rule.filter.join === 'or' && rule.filter.conditions.length > 1) state.flattened = true;
    const merged: FilterClause = { ...((filter[rule.field] as FilterClause | undefined) ?? {}) };
    for (const condition of rule.filter.conditions) {
      const clause = clauseOf(scales, rule.field, condition);
      if (clause) Object.assign(merged, clause);
    }
    if (Object.keys(merged).length > 0) filter[rule.field] = merged;
  }
  const search = query.search.trim();
  const page = query.page && 'index' in query.page ? query.page : null;
  return {
    flattened: state.flattened,
    query: {
      page: (page?.index ?? 0) + 1,
      pageSize: page?.size ?? LIST_PAGE_SIZE,
      sort: query.sort
        .map((key) => (key.direction === 'descending' ? `-${key.column}` : key.column))
        .join(','),
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
      // The backend refuses a one-character query (section 71.2); one character is no search yet.
      ...(search.length >= 2 ? { q: search } : {}),
    },
  };
}

/**
 * The tree as the saved view's flat list (section 71.1): one expression per
 * condition, in the five operators the view has. A condition the view cannot
 * hold is dropped, and `viewFilters` says whether anything was.
 */
export function toViewFilters(
  filter: FilterGroup | null,
  scales: ScaleMap = {},
): {
  filters: SavedFilter[];
  lossy: boolean;
} {
  const filters: SavedFilter[] = [];
  let lossy = false;
  const state = { flattened: false };
  const rules: FilterRule[] = [];
  if (filter) rulesOf(filter, rules, state);
  lossy = state.flattened;
  for (const rule of rules) {
    if (rule.filter.join === 'or' && rule.filter.conditions.length > 1) lossy = true;
    for (const condition of rule.filter.conditions) {
      const value = scaleWith(scales, rule.field, condition.value);
      const end = scaleWith(scales, rule.field, condition.end);
      switch (condition.operator) {
        case 'anyOf':
          filters.push({ field: rule.field, operator: 'in', value });
          break;
        case 'contains':
          filters.push({ field: rule.field, operator: 'contains', value });
          break;
        case 'equals':
        case 'is':
          filters.push({ field: rule.field, operator: 'eq', value });
          break;
        case 'greaterThanOrEqual':
        case 'after':
          filters.push({ field: rule.field, operator: 'gte', value });
          break;
        case 'lessThanOrEqual':
        case 'before':
          filters.push({ field: rule.field, operator: 'lte', value });
          break;
        case 'between':
          filters.push({ field: rule.field, operator: 'gte', value });
          filters.push({ field: rule.field, operator: 'lte', value: end });
          break;
        default:
          lossy = true;
      }
    }
  }
  return { filters, lossy };
}

/** The saved view's flat list back as a tree: one rule per field, its expressions joined with `and`. */
export function fromViewFilters(
  filters: readonly SavedFilter[],
  kinds: Readonly<Record<string, FilterDescriptor['kind']>>,
  scales: ScaleMap = {},
): FilterGroup | null {
  const byField = new Map<string, FilterCondition<string, unknown>[]>();
  for (const expression of filters) {
    const kind = kinds[expression.field];
    if (kind === undefined) continue;
    const value = unscaleWith(scales, expression.field, expression.value);
    const operator =
      expression.operator === 'in' || (expression.operator === 'eq' && kind === 'set')
        ? 'anyOf'
        : expression.operator === 'contains'
          ? 'contains'
          : expression.operator === 'eq'
            ? kind === 'date' || kind === 'boolean'
              ? 'is'
              : 'equals'
            : expression.operator === 'gte'
              ? kind === 'date'
                ? 'after'
                : 'greaterThanOrEqual'
              : kind === 'date'
                ? 'before'
                : 'lessThanOrEqual';
    const list = byField.get(expression.field) ?? [];
    list.push({
      operator,
      value: kind === 'set' && !Array.isArray(value) ? [String(value)] : value,
    });
    byField.set(expression.field, list);
  }
  const rules: FilterRule[] = [...byField].map(([field, conditions]) => ({
    field,
    filter: { kind: kinds[field]!, join: 'and', conditions } as FilterDescriptor,
  }));
  return rules.length === 0 ? null : { join: 'and', rules };
}

/** What a saved view keeps of the grid: the query without its page index, and the arrangement. */
export function toViewState(
  query: GridQuery,
  columnState: Partial<GridColumnState> | undefined,
  columnIds: readonly string[],
  scales: ScaleMap = {},
): { state: SavedView['state']; lossy: boolean } {
  const { filters, lossy } = toViewFilters(query.filter, scales);
  const hidden = new Set(columnState?.hidden ?? []);
  const order = columnState?.order?.length ? columnState.order : columnIds;
  return {
    lossy,
    state: {
      filters,
      sort: query.sort.map((key) => ({
        field: key.column,
        direction: key.direction === 'descending' ? 'desc' : 'asc',
      })),
      visibleColumns: columnIds.filter((id) => !hidden.has(id)),
      columnOrder: [...order],
      ...(query.page && 'index' in query.page && query.page.size !== LIST_PAGE_SIZE
        ? { pageSize: query.page.size as 25 | 50 | 100 }
        : {}),
    },
  };
}

/** A saved view as the grid's query and column state, at the first page. */
export function fromViewState(
  state: SavedView['state'],
  kinds: Readonly<Record<string, FilterDescriptor['kind']>>,
  columnIds: readonly string[],
  scales: ScaleMap = {},
): { query: GridQuery; columnState: Partial<GridColumnState> } {
  const sort: SortKey[] = state.sort.map((key) => ({
    column: key.field,
    direction: key.direction === 'desc' ? 'descending' : 'ascending',
  }));
  const visible = new Set(state.visibleColumns);
  return {
    query: {
      ...emptyQuery({ index: 0, size: state.pageSize ?? LIST_PAGE_SIZE }),
      filter: fromViewFilters(state.filters, kinds, scales),
      sort,
    },
    columnState: {
      order: state.columnOrder.filter((id) => columnIds.includes(id)),
      hidden: state.visibleColumns.length === 0 ? [] : columnIds.filter((id) => !visible.has(id)),
    },
  };
}
