/**
 * The query and the moves it makes. Every move returns a new object and says
 * what changed, so a binding emits one request carrying `change` and a
 * consumer refetches on a sort and debounces on a search without diffing two
 * objects.
 */

import {
  fromFilterBarParams,
  parseFilterGroup,
  serializeFilterGroup,
  toFilterBarParams,
  withoutRuleFor,
  withRuleFor,
  type FilterBarParamOptions,
  type FilterDescriptor,
  type FilterGroup,
} from '../filter';
import type { GridPage, GridQuery, GridQueryChange, SortDirection, SortKey } from './types';

export function emptyQuery(page: GridPage | null = null): GridQuery {
  return { sort: [], filter: null, search: '', page, group: [] };
}

export interface QueryMove {
  readonly query: GridQuery;
  readonly change: GridQueryChange;
}

/** The page put back at its start, which every change but a page change does. */
function firstPage(page: GridPage | null): GridPage | null {
  if (!page) return null;
  return 'index' in page ? { index: 0, size: page.size } : { cursor: null, size: page.size };
}

/** The direction a press moves a key to: ascending, descending, gone. */
export function nextSortDirection(current: SortDirection | undefined): SortDirection | null {
  if (current === undefined) return 'ascending';
  if (current === 'ascending') return 'descending';
  return null;
}

/**
 * A press on a header. Plain, the column becomes the whole order; with
 * `append`, it joins the order after the keys already there, or cycles in
 * place when it is already one of them.
 */
export function withSortPress(query: GridQuery, column: string, append = false): QueryMove {
  const existing = query.sort.find((key) => key.column === column);
  const direction = nextSortDirection(existing?.direction);
  let sort: SortKey[];
  if (!append) {
    sort = direction ? [{ column, direction }] : [];
  } else if (existing) {
    sort = direction
      ? query.sort.map((key) => (key.column === column ? { column, direction } : key))
      : query.sort.filter((key) => key.column !== column);
  } else {
    sort = [...query.sort, { column, direction: direction ?? 'ascending' }];
  }
  return { query: { ...query, sort, page: firstPage(query.page) }, change: 'sort' };
}

/** One key set outright, or removed with `null`; the rest of the order stays. */
export function withSort(
  query: GridQuery,
  column: string,
  direction: SortDirection | null,
  append = false,
): QueryMove {
  const rest = append ? query.sort.filter((key) => key.column !== column) : [];
  const sort = direction ? [...rest, { column, direction }] : rest;
  return { query: { ...query, sort, page: firstPage(query.page) }, change: 'sort' };
}

export function withoutSort(query: GridQuery): QueryMove {
  return { query: { ...query, sort: [], page: firstPage(query.page) }, change: 'sort' };
}

/** The whole tree replaced: what `filter-bar` hands over. */
export function withFilter(query: GridQuery, filter: FilterGroup | null): QueryMove {
  return { query: { ...query, filter, page: firstPage(query.page) }, change: 'filter' };
}

/** One column's rule in the first level, replaced or — with `null` — removed. */
export function withColumnFilter(
  query: GridQuery,
  column: string,
  filter: FilterDescriptor | null,
): QueryMove {
  const group = filter
    ? withRuleFor(query.filter, column, filter)
    : withoutRuleFor(query.filter, column);
  const normalized = group.rules.length === 0 ? null : group;
  return { query: { ...query, filter: normalized, page: firstPage(query.page) }, change: 'filter' };
}

export function withSearch(query: GridQuery, search: string): QueryMove {
  return { query: { ...query, search, page: firstPage(query.page) }, change: 'search' };
}

export function withPage(query: GridQuery, page: GridPage | null): QueryMove {
  return { query: { ...query, page }, change: 'page' };
}

export function withPageIndex(query: GridQuery, index: number): QueryMove {
  const size = query.page?.size ?? 0;
  return withPage(query, { index: Math.max(0, index), size });
}

export function withPageSize(query: GridQuery, size: number): QueryMove {
  return withPage(
    query,
    query.page && 'cursor' in query.page ? { cursor: null, size } : { index: 0, size },
  );
}

export function withCursor(query: GridQuery, cursor: string | null): QueryMove {
  const size = query.page?.size ?? 0;
  return withPage(query, { cursor, size });
}

export function withGroup(query: GridQuery, group: readonly string[]): QueryMove {
  return { query: { ...query, group: [...group], page: firstPage(query.page) }, change: 'group' };
}

/** Filter and search gone in one move, with reason `clear`: the empty state's own button. */
export function withoutFilters(query: GridQuery): QueryMove {
  return {
    query: { ...query, filter: null, search: '', page: firstPage(query.page) },
    change: 'filter',
  };
}

export function isQueryActive(query: GridQuery): boolean {
  return query.filter !== null || query.search.trim() !== '';
}

export function sameQuery(a: GridQuery, b: GridQuery): boolean {
  return serializeQuery(a) === serializeQuery(b);
}

export interface GridParamOptions extends FilterBarParamOptions {
  sortParam?: string;
  pageParam?: string;
  sizeParam?: string;
  cursorParam?: string;
  groupParam?: string;
}

const DEFAULT_PARAMS = {
  sortParam: 'sort',
  pageParam: 'page',
  sizeParam: 'size',
  cursorParam: 'cursor',
  groupParam: 'group',
};

const DIRECTION_SUFFIX: Record<SortDirection, string> = { ascending: 'asc', descending: 'desc' };

/**
 * `sort=customer:asc,date:desc&page=2&size=50&group=carrier`, with the filter
 * and the search as `filter-bar` writes them. A default query writes nothing.
 */
export function toGridParams(query: GridQuery, options: GridParamOptions = {}): URLSearchParams {
  const names = { ...DEFAULT_PARAMS, ...options };
  const params = toFilterBarParams({ filter: query.filter, query: query.search }, options);
  if (query.sort.length > 0) {
    params.set(
      names.sortParam,
      query.sort.map((key) => `${key.column}:${DIRECTION_SUFFIX[key.direction]}`).join(','),
    );
  }
  if (query.page) {
    if ('index' in query.page) {
      if (query.page.index > 0) params.set(names.pageParam, String(query.page.index + 1));
    } else if (query.page.cursor) params.set(names.cursorParam, query.page.cursor);
    params.set(names.sizeParam, String(query.page.size));
  }
  if (query.group.length > 0) params.set(names.groupParam, query.group.join(','));
  return params;
}

/**
 * Total: an unknown direction drops its key, a page that is not a number is
 * the first page, and a bookmark from an older version degrades to the
 * default rather than to an error on first paint.
 */
export function fromGridParams(
  input: URLSearchParams | string,
  options: GridParamOptions & { defaultPageSize?: number | undefined } = {},
): GridQuery {
  const names = { ...DEFAULT_PARAMS, ...options };
  const params = typeof input === 'string' ? new URLSearchParams(input) : input;
  const bar = fromFilterBarParams(params, options);

  const sort: SortKey[] = [];
  for (const entry of (params.get(names.sortParam) ?? '').split(',')) {
    const colon = entry.lastIndexOf(':');
    if (colon <= 0) continue;
    const column = entry.slice(0, colon);
    const suffix = entry.slice(colon + 1);
    const direction = suffix === 'asc' ? 'ascending' : suffix === 'desc' ? 'descending' : null;
    if (direction && !sort.some((key) => key.column === column)) sort.push({ column, direction });
  }

  const sizeText = params.get(names.sizeParam);
  const size = sizeText ? Number(sizeText) : options.defaultPageSize;
  let page: GridPage | null = null;
  if (size !== undefined && Number.isFinite(size) && size > 0) {
    const cursor = params.get(names.cursorParam);
    if (cursor) page = { cursor, size };
    else {
      const index = Number(params.get(names.pageParam) ?? '1') - 1;
      page = { index: Number.isFinite(index) && index > 0 ? Math.floor(index) : 0, size };
    }
  }

  const group = (params.get(names.groupParam) ?? '').split(',').filter((entry) => entry !== '');
  return { sort, filter: bar.filter, search: bar.query, page, group };
}

export function serializeQuery(query: GridQuery): string {
  return toGridParams(query).toString();
}

export function parseQuery(text: string | null | undefined, defaultPageSize?: number): GridQuery {
  return fromGridParams(text ?? '', { defaultPageSize });
}

/** The tree as text, for a consumer storing it apart from the rest. */
export const serializeGridFilter = serializeFilterGroup;
export const parseGridFilter = parseFilterGroup;
