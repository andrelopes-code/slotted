import { serializeQuery, type GridQuery } from '@slotted/core/grid';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { DataGridDataSource, DataGridDataSourceResult } from './data-grid.types';

const DEFAULT_CACHE_SIZE = 20;

export interface SourcedRows<Row> {
  readonly rows: readonly Row[];
  readonly total: number | undefined;
  readonly hasMore: boolean | undefined;
  readonly loading: boolean;
  readonly error: string | null;
  /** The same query again, after a failure. */
  readonly retry: () => void;
  /** The cache dropped and the query asked again. */
  readonly reload: () => void;
}

const EMPTY: readonly never[] = [];

/**
 * The grid asking for its own rows: one request per query, the one before
 * it aborted, the answer kept by the query's text so a page the reader comes
 * back to is on screen at once. A rejection that is not an abort is the
 * error state, with the message the source threw.
 */
export function useDataSource<Row>(
  source: DataGridDataSource<Row> | undefined,
  query: GridQuery,
): SourcedRows<Row> {
  const [state, setState] = useState<{
    key: string | null;
    result: DataGridDataSourceResult<Row> | null;
    loading: boolean;
    error: string | null;
  }>({ key: null, result: null, loading: source !== undefined, error: null });
  const cache = useRef(new Map<string, DataGridDataSourceResult<Row>>());
  const controller = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = source ? serializeQuery(query) : null;

  useEffect(() => {
    if (!source || key === null) return;
    const cached = cache.current.get(key);
    if (cached) {
      setState({ key, result: cached, loading: false, error: null });
      return;
    }
    controller.current?.abort();
    const own = new AbortController();
    controller.current = own;
    setState((current) => ({ ...current, loading: true, error: null }));
    source.getRows(query, { signal: own.signal }).then(
      (result) => {
        if (own.signal.aborted) return;
        const size = source.cacheSize ?? DEFAULT_CACHE_SIZE;
        if (size > 0) {
          cache.current.set(key, result);
          while (cache.current.size > size) {
            const oldest = cache.current.keys().next().value;
            if (oldest === undefined) break;
            cache.current.delete(oldest);
          }
        }
        setState({ key, result, loading: false, error: null });
      },
      (reason: unknown) => {
        if (own.signal.aborted) return;
        const message = reason instanceof Error ? reason.message : String(reason);
        setState((current) => ({ ...current, loading: false, error: message }));
      },
    );
    return () => own.abort();
  }, [source, key, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  const reload = useCallback(() => {
    cache.current.clear();
    setAttempt((count) => count + 1);
  }, []);

  return {
    rows: state.result?.rows ?? EMPTY,
    total: state.result?.total,
    hasMore: state.result?.hasMore,
    loading: state.loading,
    error: state.error,
    retry,
    reload,
  };
}
