import {
  parseDashboardLayout,
  serializeDashboardLayout,
  type DashboardLayout,
} from '@slotted/core/dashboard-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  PersistedDashboardLayout,
  UsePersistedDashboardLayoutOptions,
} from './dashboard-grid.types';

const EMPTY: DashboardLayout = [];

function defaultStorage(): UsePersistedDashboardLayoutOptions['storage'] {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The reader's layout, kept across visits: read once from the store and
 * written after every change. Spread it on the grid: `layout`, `onLayoutChange`,
 * and the `defaultLayout` its Reset asks for.
 * The store is reached inside `try` both ways — a private window, a full
 * quota or a blocked origin reads as nothing stored and writes nothing, and
 * the grid keeps working from the default. The component itself never writes;
 * the store and its key are the application's to name.
 */
export function usePersistedDashboardLayout({
  key,
  storage,
  defaultLayout = EMPTY,
  subscribe,
}: UsePersistedDashboardLayoutOptions): PersistedDashboardLayout {
  const store = useMemo(() => (storage === undefined ? defaultStorage() : storage), [storage]);
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    readLayout(store, key, defaultLayout),
  );

  /* A layout written to the store after mount — a server's copy that arrived
     — is read again when the application says so, and the mounted grid draws
     it without remounting. */
  useEffect(() => {
    if (subscribe === undefined) return undefined;

    return subscribe(() => setLayout(readLayout(store, key, defaultLayout)));
  }, [defaultLayout, key, store, subscribe]);

  const onLayoutChange = useCallback(
    (next: DashboardLayout) => {
      setLayout(next);
      try {
        store?.setItem(key, serializeDashboardLayout(next));
      } catch {
        /* Nothing stored: the next visit starts from the default. */
      }
    },
    [key, store],
  );

  const clear = useCallback(() => {
    setLayout(defaultLayout);
    try {
      store?.removeItem(key);
    } catch {
      /* Nothing to forget. */
    }
  }, [defaultLayout, key, store]);

  return { layout, defaultLayout, onLayoutChange, clear };
}

/** What the store holds under the key, parsed; a store that throws holds nothing. */
function readLayout(
  store: UsePersistedDashboardLayoutOptions['storage'],
  key: string,
  defaultLayout: DashboardLayout,
): DashboardLayout {
  let text: string | null;
  try {
    text = store?.getItem(key) ?? null;
  } catch {
    text = null;
  }

  return (text === null ? null : parseDashboardLayout(text)) ?? defaultLayout;
}
