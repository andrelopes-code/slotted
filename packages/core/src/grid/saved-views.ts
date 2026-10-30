/**
 * Named views of a grid: each one a `GridView` as the line of text
 * `serializeGridView` writes, under a name the reader chose. The built-in
 * view is not in the list — it is the application's defaults, and it is
 * never renamed, overwritten or deleted.
 */

import { serializeGridView, type GridView, type GridViewOptions } from './view';
import type { GridColumn } from './types';

export const BUILT_IN_VIEW_ID = '__default';

/**
 * A view as a saved view holds it: the page size stays and the position does
 * not. A reader who turns to page 3 has not changed the view, and a view saved
 * there should not open on page 3.
 */
export function savedViewText(
  view: GridView,
  columns?: readonly GridColumn<never>[],
  options: GridViewOptions = {},
): string {
  const page = view.query.page;
  const first =
    page === null
      ? null
      : 'index' in page
        ? { index: 0, size: page.size }
        : { cursor: null, size: page.size };
  return serializeGridView({ ...view, query: { ...view.query, page: first } }, columns, options);
}

/** Whether two views are the same saved view: equal but for the page position. */
export function sameSavedView(
  a: GridView,
  b: GridView,
  columns?: readonly GridColumn<never>[],
  options: GridViewOptions = {},
): boolean {
  return savedViewText(a, columns, options) === savedViewText(b, columns, options);
}

/** The version `serializeSavedViews` writes under `v`. */
export const SAVED_VIEWS_VERSION = 1;

export interface SavedView {
  readonly id: string;
  readonly name: string;
  /** The view, as `serializeGridView` wrote it. */
  readonly view: string;
}

export interface SavedViewsState {
  readonly views: readonly SavedView[];
  /** The view a visit opens on; `null` is the built-in view. */
  readonly defaultId: string | null;
  /** The view applied last; `null` is the built-in view. */
  readonly activeId: string | null;
}

export function emptySavedViews(): SavedViewsState {
  return { views: [], defaultId: null, activeId: null };
}

function known(state: SavedViewsState, id: string | null): string | null {
  return id !== null && state.views.some((entry) => entry.id === id) ? id : null;
}

export function withViewCreated(
  state: SavedViewsState,
  name: string,
  view: string,
  id: string,
): SavedViewsState {
  if (id === BUILT_IN_VIEW_ID || state.views.some((entry) => entry.id === id)) return state;
  return { ...state, views: [...state.views, { id, name: name.trim(), view }], activeId: id };
}

export function withViewSaved(state: SavedViewsState, id: string, view: string): SavedViewsState {
  if (known(state, id) === null) return state;
  return {
    ...state,
    views: state.views.map((entry) => (entry.id === id ? { ...entry, view } : entry)),
  };
}

export function withViewRenamed(state: SavedViewsState, id: string, name: string): SavedViewsState {
  if (known(state, id) === null || name.trim() === '') return state;
  return {
    ...state,
    views: state.views.map((entry) => (entry.id === id ? { ...entry, name: name.trim() } : entry)),
  };
}

/** A deleted view that was the default or the active one leaves the built-in view in its place. */
export function withViewDeleted(state: SavedViewsState, id: string): SavedViewsState {
  if (known(state, id) === null) return state;
  return {
    views: state.views.filter((entry) => entry.id !== id),
    defaultId: state.defaultId === id ? null : state.defaultId,
    activeId: state.activeId === id ? null : state.activeId,
  };
}

/** `null` or the built-in id make the built-in view the default. */
export function withDefaultView(state: SavedViewsState, id: string | null): SavedViewsState {
  return { ...state, defaultId: known(state, id) };
}

export function withActiveView(state: SavedViewsState, id: string | null): SavedViewsState {
  return { ...state, activeId: known(state, id) };
}

/** Whether a name is taken, compared without case or surrounding space. */
export function isViewNameTaken(
  state: SavedViewsState,
  name: string,
  except?: string | null,
): boolean {
  const wanted = name.trim().toLocaleLowerCase();
  return state.views.some(
    (entry) => entry.id !== except && entry.name.toLocaleLowerCase() === wanted,
  );
}

export function serializeSavedViews(state: SavedViewsState): string {
  return JSON.stringify({ v: SAVED_VIEWS_VERSION, ...state });
}

/**
 * Total: malformed text is no views; an entry without a string id and name,
 * a repeated id and a default or active id that names no view are dropped.
 */
export function parseSavedViews(text: string | null | undefined): SavedViewsState {
  if (!text) return emptySavedViews();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return emptySavedViews();
  }
  if (typeof data !== 'object' || data === null) return emptySavedViews();
  const record = data as Record<string, unknown>;
  const views: SavedView[] = [];
  for (const entry of Array.isArray(record['views']) ? record['views'] : []) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { id, name, view } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || id === BUILT_IN_VIEW_ID) continue;
    if (views.some((kept) => kept.id === id)) continue;
    views.push({ id, name, view: typeof view === 'string' ? view : '' });
  }
  const state: SavedViewsState = { views, defaultId: null, activeId: null };
  const id = (value: unknown) => (typeof value === 'string' ? known(state, value) : null);
  return { views, defaultId: id(record['defaultId']), activeId: id(record['activeId']) };
}
