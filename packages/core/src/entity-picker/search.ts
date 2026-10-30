/**
 * The two conversations the family holds with its source: the search the
 * reader types, and the resolution of ids the family was handed without
 * their records.
 *
 * Both are sessions rather than functions because both span time — a delay,
 * a request in flight, an answer that arrives after a newer question — and
 * the rules for that time are the part two bindings would write differently.
 */

import { initialLoadingVisibility, nextLoadingVisibility } from '../loading/loading';
import type { LoadingVisibilityState } from '../loading/loading';
import type { Entity, EntityCache, EntitySource } from './entity-picker';

export type EntitySearchStatus =
  /** Nothing asked yet, or the session was reset. */
  | 'idle'
  /** The query is shorter than `minQueryLength`; nothing is asked. */
  | 'short'
  /** The delay after the last keystroke is running. */
  | 'waiting'
  /** A request for the first page is in flight. */
  | 'loading'
  | 'ready'
  | 'error';

export interface EntitySearchState {
  readonly status: EntitySearchStatus;
  readonly query: string;
  readonly scope: string | null;
  /**
   * The records on screen. While a new query waits and loads they are the
   * previous answer's, kept so the list recedes rather than flickers
   * (`loading-states` §1); `answered` says whether they answer `query`.
   */
  readonly items: readonly Entity[];
  readonly answered: boolean;
  readonly total: number | undefined;
  readonly hasMore: boolean;
  /** A request for the next page is in flight. */
  readonly loadingMore: boolean;
  /** Whether the wait is drawn: after `indicatorDelay`, for at least `indicatorMinDuration`. */
  readonly indicator: boolean;
  readonly error: unknown;
}

export interface EntitySearchOptions {
  readonly source: EntitySource;
  /** Milliseconds after the last keystroke before asking. */
  readonly delay: number;
  readonly minQueryLength: number;
  /** How long a request runs before its wait is drawn. 200 by default. */
  readonly indicatorDelay?: number;
  /** How long a drawn wait stays. 400 by default. */
  readonly indicatorMinDuration?: number;
  /** Called with every answer, so the family's cache keeps each record seen. */
  readonly onResults?: (items: readonly Entity[]) => void;
  readonly onChange: (state: EntitySearchState) => void;
  readonly now?: () => number;
}

export interface EntitySearchInput {
  readonly query: string;
  readonly scope: string | null;
  readonly selected: readonly string[];
  /** Ask now rather than after the delay: a change of scope, an opening. */
  readonly immediate?: boolean;
}

export interface EntitySearchSession {
  readonly state: EntitySearchState;
  /** Asks for the first page of this query, unless it is already the one on screen. */
  search(input: EntitySearchInput): void;
  /** Asks for the next page, when the answer said there is one. */
  more(): void;
  /** Asks again for what failed. */
  retry(): void;
  /** Asks again for the current query, whatever state it is in. */
  refresh(): void;
  /** Aborts and forgets. */
  reset(): void;
  dispose(): void;
}

const INITIAL: EntitySearchState = {
  status: 'idle',
  query: '',
  scope: null,
  items: [],
  answered: false,
  total: undefined,
  hasMore: false,
  loadingMore: false,
  indicator: false,
  error: undefined,
};

function isAbort(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * The search the reader types.
 *
 * - After the last keystroke the session waits `delay`, then asks; an empty
 *   query, a new scope and a refresh ask at once.
 * - Each request aborts the one before it, and an answer that arrives after a
 *   newer request started is ignored by its sequence number — the source may
 *   not honour the signal.
 * - Below `minQueryLength` nothing is asked and nothing on screen answers.
 * - A failure empties the list: the rows of the previous query are not shown
 *   as if they answered this one. A failed next page keeps the pages before
 *   it and asks for itself again on `retry`.
 */
export function createEntitySearch(options: EntitySearchOptions): EntitySearchSession {
  const now = options.now ?? (() => Date.now());
  const indicatorDelay = options.indicatorDelay ?? 200;
  const indicatorMinDuration = options.indicatorMinDuration ?? 400;

  let state: EntitySearchState = INITIAL;
  let selected: readonly string[] = [];
  let page = 0;
  let cursor: string | null = null;
  let failedPage: number | null = null;
  let sequence = 0;
  let controller: AbortController | null = null;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let indicatorTimer: ReturnType<typeof setTimeout> | null = null;
  let visibility: LoadingVisibilityState = initialLoadingVisibility;
  let disposed = false;

  const emit = (next: Partial<EntitySearchState>) => {
    state = { ...state, ...next };
    settleIndicator();
    if (!disposed) options.onChange(state);
  };

  function settleIndicator() {
    if (indicatorTimer !== null) clearTimeout(indicatorTimer);
    indicatorTimer = null;
    const loading = state.status === 'loading' || state.loadingMore;
    const next = nextLoadingVisibility({
      loading,
      delay: indicatorDelay,
      minDuration: indicatorMinDuration,
      now: now(),
      state: visibility,
    });
    visibility = next.state;
    state = { ...state, indicator: next.state.visible };
    if (next.wait !== null) {
      indicatorTimer = setTimeout(() => {
        indicatorTimer = null;
        const before = state.indicator;
        settleIndicator();
        if (state.indicator !== before && !disposed) options.onChange(state);
      }, next.wait);
    }
  }

  function stop() {
    if (delayTimer !== null) clearTimeout(delayTimer);
    delayTimer = null;
    controller?.abort();
    controller = null;
    sequence += 1;
  }

  function run(requested: number) {
    stop();
    const mine = sequence;
    const aborter = new AbortController();
    controller = aborter;
    failedPage = null;

    if (requested === 0) emit({ status: 'loading', loadingMore: false, error: undefined });
    else emit({ loadingMore: true, error: undefined });

    options.source
      .search(
        {
          query: state.query,
          scope: state.scope,
          page: requested,
          cursor: requested === 0 ? null : cursor,
          selected,
        },
        { signal: aborter.signal },
      )
      .then(
        (result) => {
          if (mine !== sequence || disposed) return;
          controller = null;
          options.onResults?.(result.items);
          page = requested;
          cursor = result.cursor ?? null;
          emit({
            status: 'ready',
            items: requested === 0 ? result.items : [...state.items, ...result.items],
            answered: true,
            total: result.total,
            hasMore: result.hasMore === true,
            loadingMore: false,
          });
        },
        (error: unknown) => {
          if (mine !== sequence || disposed || isAbort(error)) return;
          controller = null;
          failedPage = requested;
          emit(
            requested === 0
              ? { status: 'error', items: [], answered: false, hasMore: false, error }
              : { status: 'error', loadingMore: false, error },
          );
        },
      );
  }

  const session: EntitySearchSession = {
    get state() {
      return state;
    },
    search({ query, scope, selected: chosen, immediate = false }) {
      selected = chosen;
      const same = query === state.query && scope === state.scope;
      if (same && ['waiting', 'loading', 'ready'].includes(state.status)) return;

      stop();
      const scopeChanged = scope !== state.scope;

      if (query.trim().length < options.minQueryLength) {
        emit({
          status: 'short',
          query,
          scope,
          items: [],
          answered: false,
          hasMore: false,
          loadingMore: false,
          error: undefined,
        });
        return;
      }

      emit({
        status: 'waiting',
        query,
        scope,
        answered: false,
        loadingMore: false,
        error: undefined,
      });
      const wait = immediate || scopeChanged || query === '' ? 0 : options.delay;
      if (wait <= 0) {
        run(0);
        return;
      }
      delayTimer = setTimeout(() => {
        delayTimer = null;
        run(0);
      }, wait);
    },
    more() {
      if (state.status !== 'ready' || !state.hasMore || state.loadingMore) return;
      run(page + 1);
    },
    retry() {
      if (state.status !== 'error') return;
      run(failedPage ?? 0);
    },
    refresh() {
      if (state.status === 'idle' || state.status === 'short') return;
      run(0);
    },
    reset() {
      stop();
      page = 0;
      cursor = null;
      failedPage = null;
      emit(INITIAL);
    },
    dispose() {
      stop();
      if (indicatorTimer !== null) clearTimeout(indicatorTimer);
      disposed = true;
    },
  };

  return session;
}

// ── Resolution ──────────────────────────────────────────────────────────────

export type EntityResolution = 'known' | 'pending' | 'missing';

export interface EntityResolverOptions {
  readonly source: EntitySource;
  readonly cache: EntityCache;
  /** Called when an id changes from pending to known or missing. */
  readonly onChange: () => void;
}

export interface EntityResolver {
  /** Asks for every id of `ids` the cache does not hold and nobody asked for yet. */
  require(ids: readonly string[]): void;
  status(id: string): EntityResolution;
  /** Forgets the ids that came back missing, so the next `require` asks again. */
  retry(): void;
  dispose(): void;
}

/**
 * The records behind ids the family was handed — a default value, a value a
 * server sent. Ids asked for in the same task go in one call. An id the
 * source did not return, or a call that failed, is `missing`: the chip says
 * "Unavailable" and stays removable, and `retry` asks again.
 */
export function createEntityResolver({
  source,
  cache,
  onChange,
}: EntityResolverOptions): EntityResolver {
  const pending = new Set<string>();
  const missing = new Set<string>();
  let queued: string[] = [];
  const controllers = new Set<AbortController>();
  let disposed = false;

  function flush() {
    const ids = queued;
    queued = [];
    if (ids.length === 0 || disposed) return;

    if (source.resolve === undefined) {
      for (const id of ids) {
        pending.delete(id);
        missing.add(id);
      }
      onChange();
      return;
    }

    const controller = new AbortController();
    controllers.add(controller);
    source.resolve(ids, { signal: controller.signal }).then(
      (entities) => {
        controllers.delete(controller);
        if (disposed) return;
        cache.remember(entities);
        for (const id of ids) {
          pending.delete(id);
          if (!cache.has(id)) missing.add(id);
        }
        onChange();
      },
      (error: unknown) => {
        controllers.delete(controller);
        if (disposed || isAbort(error)) return;
        for (const id of ids) {
          pending.delete(id);
          missing.add(id);
        }
        onChange();
      },
    );
  }

  return {
    require(ids) {
      const fresh = ids.filter(
        (id) => !cache.has(id) && !pending.has(id) && !missing.has(id) && !queued.includes(id),
      );
      if (fresh.length === 0) return;
      const first = queued.length === 0;
      for (const id of fresh) pending.add(id);
      queued.push(...fresh);
      if (first) queueMicrotask(flush);
    },
    status(id) {
      if (cache.has(id)) return 'known';
      if (missing.has(id)) return 'missing';
      return 'pending';
    },
    retry() {
      missing.clear();
    },
    dispose() {
      disposed = true;
      for (const controller of controllers) controller.abort();
      controllers.clear();
    },
  };
}
