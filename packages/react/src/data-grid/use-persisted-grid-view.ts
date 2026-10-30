import {
  emptyGridView,
  normalizeColumnState,
  parseGridView,
  serializeGridView,
  type GridColumn,
  type GridColumnState,
  type GridDensity,
  type GridQuery,
  type GridView,
  type GridViewOptions,
  type GridViewStorage,
} from '@slotted/core/grid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DataGridColumnStateRequest, DataGridQueryRequest } from './data-grid.types';

export type { GridViewStorage } from '@slotted/core/grid';

export interface UsePersistedGridViewOptions<Row> extends GridViewOptions {
  /** The entry the view is kept under. */
  readonly key: string;
  /** The model, so a column it no longer has is dropped on read. */
  readonly columns: readonly GridColumn<Row>[];
  /** Default `window.localStorage`; `null` keeps the view in memory only. */
  readonly storage?: GridViewStorage | null | undefined;
  /** What the view is before anything was saved, and after `reset`. */
  readonly defaultQuery?: GridQuery | undefined;
  readonly defaultColumnState?: Partial<GridColumnState> | undefined;
  /** The density before anything was saved, and after `reset`. Default `null`: the page's. */
  readonly defaultDensity?: GridDensity | null | undefined;
}

export interface PersistedGridView {
  readonly query: GridQuery;
  readonly onQueryChange: (query: GridQuery, request: DataGridQueryRequest) => void;
  readonly columnState: GridColumnState;
  readonly onColumnStateChange: (
    state: GridColumnState,
    request: DataGridColumnStateRequest,
  ) => void;
  /** Pass to the grid's `density`; `null` inherits the page's density. */
  readonly density: GridDensity | null;
  /** Wire to the control that picks the density. */
  readonly onDensityChange: (density: GridDensity | null) => void;
  /** Replaces the whole view in one write: what applying a saved view does. */
  readonly setView: (view: GridView) => void;
  /** Back to the defaults, and the entry removed. */
  readonly reset: () => void;
}

function defaultStorage(): GridViewStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The reader's view of a grid, kept across visits: the column state, the
 * query and the density, read once from the store and written after every
 * change. Pass `reset` and `onDensityChange` to the controls that call them and
 * spread the rest on the grid. The store is reached inside `try` both ways — a private
 * window that refuses, a quota that is full and a server that has no window
 * all leave the view in memory.
 */
export function usePersistedGridView<Row>({
  key,
  columns,
  storage,
  defaultQuery,
  defaultColumnState,
  defaultDensity,
  ...options
}: UsePersistedGridViewOptions<Row>): PersistedGridView {
  const store = useMemo(() => (storage === undefined ? defaultStorage() : storage), [storage]);
  const defaults = useMemo<GridView>(
    () => ({
      columns: normalizeColumnState(defaultColumnState ?? null, columns),
      query: defaultQuery ?? emptyGridView(options.defaultPageSize).query,
      density: defaultDensity ?? null,
    }),
    [],
  );
  const [view, setView] = useState<GridView>(() => {
    let text: string | null;
    try {
      text = store?.getItem(key) ?? null;
    } catch {
      text = null;
    }
    if (text === null || text === '') return defaults;
    const saved = parseGridView(text, columns, options);
    return {
      columns: saved.columns,
      /* A saved query with no page keeps the default's page: the page size is
         the application's, and an older entry may predate paging. */
      query:
        saved.query.page === null ? { ...saved.query, page: defaults.query.page } : saved.query,
      density: saved.density ?? defaults.density,
    };
  });
  const latest = useRef({ key, columns, options, store, defaults });
  latest.current = { key, columns, options, store, defaults };

  /* One write per commit, after the render that showed the change. */
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const { key: name, columns: model, options: opts, store: target } = latest.current;
    if (!target) return;
    try {
      const text = serializeGridView(view, model, opts);
      if (text === '') target.removeItem(name);
      else target.setItem(name, text);
    } catch {
      /* The store refused; the view stays in memory. */
    }
  }, [view]);

  const onQueryChange = useCallback((query: GridQuery) => {
    dirty.current = true;
    setView((current) => ({ ...current, query }));
  }, []);
  const onColumnStateChange = useCallback((state: GridColumnState) => {
    dirty.current = true;
    setView((current) => ({ ...current, columns: state }));
  }, []);
  const onDensityChange = useCallback((density: GridDensity | null) => {
    dirty.current = true;
    setView((current) => ({ ...current, density }));
  }, []);
  const replaceView = useCallback((next: GridView) => {
    dirty.current = true;
    setView(next);
  }, []);
  /* The defaults are what an empty store means, so the entry goes rather
     than being rewritten as the defaults. */
  const reset = useCallback(() => {
    dirty.current = false;
    setView(latest.current.defaults);
    try {
      latest.current.store?.removeItem(latest.current.key);
    } catch {
      /* The store refused; nothing was kept in it either way. */
    }
  }, []);

  return {
    query: view.query,
    onQueryChange,
    columnState: view.columns,
    onColumnStateChange,
    density: view.density,
    onDensityChange,
    setView: replaceView,
    reset,
  };
}
