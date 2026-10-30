import { effect, signal, untracked, type Injector, type WritableSignal } from '@angular/core';
import {
  parseGridView,
  parseSavedViews,
  serializeSavedViews,
  withActiveView,
  type GridColumn,
  type GridView,
  type GridViewStorage,
  type SavedViewsState,
} from '@slotted/core/grid';

export interface PersistedSavedViewsOptions {
  /** The entry the views are kept under. */
  readonly key: string;
  /** Default `window.localStorage`; `null` keeps the views in memory only. */
  readonly storage?: GridViewStorage | null | undefined;
  /** The model, so the default view a visit opens on is parsed against it. */
  readonly columns?: readonly GridColumn<never>[] | undefined;
  /** Required outside an injection context. */
  readonly injector?: Injector | undefined;
}

export interface PersistedSavedViews {
  /** Bind with `[(state)]`. */
  readonly state: WritableSignal<SavedViewsState>;
  /**
   * The default view this visit opened on, when the store held no view in use
   * and a default: the state already names it as active, and the grid still
   * has to be given it once. `null` otherwise.
   */
  readonly openedDefault: GridView | null;
}

function defaultStorage(): GridViewStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * A reader's saved views, kept across visits: read once from the store with
 * `parseSavedViews` — which is total, so a malformed entry is no views — and
 * written with `serializeSavedViews` after every change. A store that holds
 * no view in use and a default opens the visit on the default. The store is
 * reached inside `try` both ways, as `persistedGridView` reaches it.
 */
export function persistedSavedViews({
  key,
  storage,
  columns,
  injector,
}: PersistedSavedViewsOptions): PersistedSavedViews {
  const store = storage === undefined ? defaultStorage() : storage;
  let text: string | null;
  try {
    text = store?.getItem(key) ?? null;
  } catch {
    text = null;
  }
  let initial = parseSavedViews(text);
  let openedDefault: GridView | null = null;
  if (initial.activeId === null && initial.defaultId !== null) {
    const opened = initial.views.find((view) => view.id === initial.defaultId);
    initial = withActiveView(initial, initial.defaultId);
    openedDefault = opened ? parseGridView(opened.view, columns) : null;
  }
  const state = signal<SavedViewsState>(initial);

  /* The first run is the read; every run after is a change to write. */
  let settled = false;
  effect(
    () => {
      const current = state();
      if (!settled) {
        settled = true;
        return;
      }
      untracked(() => {
        if (!store) return;
        try {
          store.setItem(key, serializeSavedViews(current));
        } catch {
          /* The store refused; the views stay in memory. */
        }
      });
    },
    injector ? { injector } : undefined,
  );

  return { state, openedDefault };
}
