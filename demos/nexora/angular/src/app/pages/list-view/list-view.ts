import { computed, type Signal, type WritableSignal } from '@angular/core';
import { persistedGridView } from '@slotted/angular/data-grid';
import { persistedSavedViews } from '@slotted/angular/saved-views';
import {
  normalizeColumnState,
  parseGridView,
  withoutSort,
  withSortPress,
  type GridColumn,
  type GridColumnState,
  type GridDensity,
  type GridQuery,
  type GridView,
  type SavedViewsState,
} from '@slotted/core/grid';

export interface ListViewOptions {
  /** The page's name: the view is kept under `nexora.<page>.view`, the saved views under `nexora.<page>.views`. */
  readonly page: string;
  /** Every column the page can draw, so a saved arrangement is read against the whole model. */
  readonly columns: readonly GridColumn<never>[];
  /** The page's own arrangement: what the built-in view and Restore defaults stand for. */
  readonly defaultColumnState?: Partial<GridColumnState> | undefined;
  /** The query the page's store holds. */
  readonly query: Signal<GridQuery>;
  /** The query the page opens on before the reader changed anything. */
  readonly defaultQuery: GridQuery;
  /** Hands a view's query to the page's store. */
  readonly applyQuery: (query: GridQuery) => void;
}

export interface ListView {
  readonly columnState: WritableSignal<GridColumnState>;
  readonly density: WritableSignal<GridDensity | null>;
  readonly defaultColumnState: GridColumnState;
  readonly saved: WritableSignal<SavedViewsState>;
  /** The view on screen: the store's query, the persisted columns and the density. */
  readonly current: Signal<GridView>;
  /** The page's defaults, named "Default" in the saved views. */
  readonly builtIn: GridView;
  /**
   * The query of the saved view a visit opens on — the default view, or the
   * one last applied — on the first page, for the store's first read.
   * `null` when the reader saved none.
   */
  readonly openingQuery: GridQuery | null;
  apply(view: GridView): void;
  /**
   * Moves one column through the order, from the first page, as `Shift` and a
   * header press do: absent, it joins the end ascending; ascending, it turns
   * descending in place; descending, it leaves and the other keys keep theirs.
   */
  pressSort(column: string): void;
  /** Empties the order, from the first page. */
  clearSort(): void;
}

/** A view's query on its first page, at the page size the view was saved with. */
function onFirstPage(view: GridQuery): GridQuery {
  const page = view.page;
  return { ...view, page: page && 'index' in page ? { index: 0, size: page.size } : page };
}

/**
 * The reader's grid view for one list page. The column state and the density
 * are the reader's and are kept in the browser (`persistedGridView`); the
 * query stays the store's, which reads it from the backend. The saved views
 * (`persistedSavedViews`) hold all three, and applying one writes the columns
 * and the density here and the query to the store.
 *
 * Called from an injection context: both helpers register an effect.
 */
export function listView(options: ListViewOptions): ListView {
  const { page, columns, defaultColumnState, query, defaultQuery, applyQuery } = options;
  const persisted = persistedGridView({
    key: `nexora.${page}.view`,
    columns,
    defaultColumnState,
  });
  const saved = persistedSavedViews({ key: `nexora.${page}.views`, columns });
  const defaults = normalizeColumnState(defaultColumnState ?? null, columns);

  const opened = saved.openedDefault;
  if (opened) {
    persisted.columnState.set(opened.columns);
    persisted.density.set(opened.density);
  }
  const active = saved.state().views.find((view) => view.id === saved.state().activeId);
  const openingQuery = opened
    ? opened.query
    : active
      ? parseGridView(active.view, columns).query
      : null;

  return {
    columnState: persisted.columnState,
    density: persisted.density,
    defaultColumnState: defaults,
    saved: saved.state,
    current: computed(() => ({
      columns: persisted.columnState(),
      query: query(),
      density: persisted.density(),
    })),
    builtIn: { columns: defaults, query: defaultQuery, density: null },
    openingQuery: openingQuery === null ? null : onFirstPage(openingQuery),
    apply(view: GridView) {
      persisted.columnState.set(view.columns);
      persisted.density.set(view.density);
      applyQuery(onFirstPage(view.query));
    },
    pressSort(column: string) {
      applyQuery(withSortPress(query(), column, true).query);
    },
    clearSort() {
      applyQuery(withoutSort(query()).query);
    },
  };
}
