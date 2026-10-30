/**
 * A view: the reader's arrangement of the columns and the query, as one
 * object and one line of text. What a saved view, a bookmark and a
 * `localStorage` entry hold; what `usePersistedGridView` and
 * `persistedGridView` read and write.
 */

import {
  emptyColumnState,
  normalizeColumnState,
  parseColumnState,
  statesPins,
  serializeColumnState,
} from './columns';
import { fromGridParams, toGridParams, type GridParamOptions } from './query';
import type { GridColumn, GridColumnState, GridDensity, GridQuery } from './types';

/**
 * The version `serializeGridView` writes under `v`. Text without it is
 * version 1; a later version is read for the keys this one knows.
 */
export const GRID_VIEW_VERSION = 1;

const DENSITIES: readonly GridDensity[] = ['comfortable', 'compact', 'dense'];

export interface GridView {
  readonly columns: GridColumnState;
  readonly query: GridQuery;
  /** `null` inherits the page's density. */
  readonly density: GridDensity | null;
}

/**
 * What `localStorage` and `sessionStorage` are, and what a consumer's own
 * store answers: where a persisted view and a list of saved views are kept.
 */
export interface GridViewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface GridViewOptions extends GridParamOptions {
  /** The parameter the column state is written under. Default `columns`. */
  columnsParam?: string;
  /** The parameter the density is written under. Default `density`. */
  densityParam?: string;
  /** The page size a query with a page but no size takes. */
  defaultPageSize?: number | undefined;
}

/**
 * The query's own parameters, and the column state under `columns` when the
 * reader touched it. A view nobody touched is the empty string, so a store
 * can drop it.
 */
export function serializeGridView(
  view: GridView,
  columns?: readonly GridColumn<never>[],
  options: GridViewOptions = {},
): string {
  const params = toGridParams(view.query, options);
  const state = serializeColumnState(view.columns, columns);
  if (state !== '') params.set(options.columnsParam ?? 'columns', state);
  if (view.density) params.set(options.densityParam ?? 'density', view.density);
  if ([...params.keys()].length > 0) params.set('v', String(GRID_VIEW_VERSION));
  return params.toString();
}

/**
 * Total: malformed text is the empty view, and the column state is normalized
 * against the model when the model is given, so a column the model no longer
 * has is dropped before it reaches the grid.
 */
export function parseGridView(
  text: string | null | undefined,
  columns?: readonly GridColumn<never>[],
  options: GridViewOptions = {},
): GridView {
  const params = new URLSearchParams(text ?? '');
  const query = fromGridParams(params, options);
  const columnsText = params.get(options.columnsParam ?? 'columns');
  const state = parseColumnState(columnsText);
  const density = params.get(options.densityParam ?? 'density');
  return {
    columns: columns
      ? normalizeColumnState(statesPins(columnsText) ? state : withoutPins(state), columns)
      : state,
    query,
    density: DENSITIES.includes(density as GridDensity) ? (density as GridDensity) : null,
  };
}

/** The state with its pins left to the model. */
function withoutPins(state: GridColumnState): Partial<GridColumnState> {
  return { order: state.order, widths: state.widths, hidden: state.hidden };
}

export function emptyGridView(defaultPageSize?: number): GridView {
  return {
    columns: emptyColumnState(),
    query: fromGridParams('', { defaultPageSize }),
    density: null,
  };
}

/** Whether two views are the same view: the same line of text. */
export function sameGridView(
  a: GridView,
  b: GridView,
  columns?: readonly GridColumn<never>[],
  options: GridViewOptions = {},
): boolean {
  return serializeGridView(a, columns, options) === serializeGridView(b, columns, options);
}
