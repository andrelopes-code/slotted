import { effect, signal, untracked, type Injector, type WritableSignal } from '@angular/core';
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

export type { GridViewStorage } from '@slotted/core/grid';

export interface PersistedGridViewOptions<Row> extends GridViewOptions {
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
  /** Required outside an injection context. */
  readonly injector?: Injector | undefined;
}

export interface PersistedGridView {
  /** Bind with `[(query)]`. */
  readonly query: WritableSignal<GridQuery>;
  /** Bind with `[(columnState)]`. */
  readonly columnState: WritableSignal<GridColumnState>;
  /** Bind with `[density]`; `null` inherits the page's density. */
  readonly density: WritableSignal<GridDensity | null>;
  /** Back to the defaults, and the entry removed. */
  reset(): void;
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
 * query and the density, read once from the store and written after every change. Three
 * writable signals for the grid's bindings. The store is reached
 * inside `try` both ways — a private window that refuses, a quota that is
 * full and a server that has no window all leave the view in memory.
 */
export function persistedGridView<Row>({
  key,
  columns,
  storage,
  defaultQuery,
  defaultColumnState,
  defaultDensity,
  injector,
  ...options
}: PersistedGridViewOptions<Row>): PersistedGridView {
  const store = storage === undefined ? defaultStorage() : storage;
  const defaults: GridView = {
    columns: normalizeColumnState(defaultColumnState ?? null, columns),
    query: defaultQuery ?? emptyGridView(options.defaultPageSize).query,
    density: defaultDensity ?? null,
  };
  let text: string | null;
  try {
    text = store?.getItem(key) ?? null;
  } catch {
    text = null;
  }
  let initial = defaults;
  if (text !== null && text !== '') {
    const saved = parseGridView(text, columns, options);
    initial = {
      columns: saved.columns,
      /* A saved query with no page keeps the default's page: the page size is
         the application's, and an older entry may predate paging. */
      query:
        saved.query.page === null ? { ...saved.query, page: defaults.query.page } : saved.query,
      density: saved.density ?? defaults.density,
    };
  }
  const query = signal<GridQuery>(initial.query);
  const columnState = signal<GridColumnState>(initial.columns);
  const density = signal<GridDensity | null>(initial.density);

  /* The first run is the read; every run after is a change to write, except
     the one a reset causes. */
  let settled = false;
  let skip = false;
  effect(
    () => {
      const view: GridView = { query: query(), columns: columnState(), density: density() };
      if (!settled || skip) {
        settled = true;
        skip = false;
        return;
      }
      untracked(() => {
        if (!store) return;
        try {
          const next = serializeGridView(view, columns, options);
          if (next === '') store.removeItem(key);
          else store.setItem(key, next);
        } catch {
          /* The store refused; the view stays in memory. */
        }
      });
    },
    injector ? { injector } : undefined,
  );

  return {
    query,
    columnState,
    density,
    /* The defaults are what an empty store means, so the entry goes rather
       than being rewritten as the defaults. */
    reset: () => {
      /* A signal set to the object it holds notifies nothing, so the skip is
         armed only when the effect will run. */
      skip =
        query() !== defaults.query ||
        columnState() !== defaults.columns ||
        density() !== defaults.density;
      query.set(defaults.query);
      columnState.set(defaults.columns);
      density.set(defaults.density);
      try {
        store?.removeItem(key);
      } catch {
        /* The store refused; nothing was kept in it either way. */
      }
    },
  };
}
