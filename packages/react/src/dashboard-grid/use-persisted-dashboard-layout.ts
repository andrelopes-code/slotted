import {
  parseDashboardLayout,
  serializeDashboardLayout,
  type DashboardLayout,
} from '@slotted/core/dashboard-grid';
import { useCallback, useMemo, useState } from 'react';

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
}: UsePersistedDashboardLayoutOptions): PersistedDashboardLayout {
  const store = useMemo(() => (storage === undefined ? defaultStorage() : storage), [storage]);
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    let text: string | null;
    try {
      text = store?.getItem(key) ?? null;
    } catch {
      text = null;
    }
    return (text === null ? null : parseDashboardLayout(text)) ?? defaultLayout;
  });

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
