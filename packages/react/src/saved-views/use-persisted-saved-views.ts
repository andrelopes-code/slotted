import {
  parseGridView,
  parseSavedViews,
  serializeSavedViews,
  withActiveView,
  type GridView,
  type GridViewStorage,
  type SavedViewsState,
} from '@slotted/core/grid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PersistedSavedViews, UsePersistedSavedViewsOptions } from './saved-views.types';

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
 * reached inside `try` both ways, as `usePersistedGridView` reaches it.
 */
export function usePersistedSavedViews({
  key,
  storage,
  columns,
}: UsePersistedSavedViewsOptions): PersistedSavedViews {
  const store = useMemo(() => (storage === undefined ? defaultStorage() : storage), [storage]);
  const [initial] = useState(() => {
    let text: string | null;
    try {
      text = store?.getItem(key) ?? null;
    } catch {
      text = null;
    }
    const read = parseSavedViews(text);
    if (read.activeId !== null || read.defaultId === null) {
      return { state: read, openedDefault: null as GridView | null };
    }
    const opened = read.views.find((view) => view.id === read.defaultId);
    return {
      state: withActiveView(read, read.defaultId),
      openedDefault: opened ? parseGridView(opened.view, columns) : null,
    };
  });
  const [state, setState] = useState<SavedViewsState>(initial.state);
  const latest = useRef({ key, store });
  latest.current = { key, store };

  /* One write per commit, after the render that showed the change. */
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const { key: name, store: target } = latest.current;
    if (!target) return;
    try {
      target.setItem(name, serializeSavedViews(state));
    } catch {
      /* The store refused; the views stay in memory. */
    }
  }, [state]);

  const onStateChange = useCallback((next: SavedViewsState) => {
    dirty.current = true;
    setState(next);
  }, []);

  return { state, onStateChange, openedDefault: initial.openedDefault };
}
