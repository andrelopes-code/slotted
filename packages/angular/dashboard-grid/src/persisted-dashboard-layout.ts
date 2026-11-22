import {
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  type Injector,
  type WritableSignal,
} from '@angular/core';
import {
  parseDashboardLayout,
  serializeDashboardLayout,
  type DashboardLayout,
} from '@slotted/core/dashboard-grid';

export interface DashboardLayoutStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PersistedDashboardLayoutOptions {
  /** The key the layout is stored under. */
  readonly key: string;
  /** Default `localStorage`, when the platform has it. */
  readonly storage?: DashboardLayoutStorage | null | undefined;
  /** What the grid shows when nothing is stored. Default: every widget at its defaults. */
  readonly defaultLayout?: DashboardLayout | undefined;
  /** Needed outside an injection context, as `effect` is. */
  readonly injector?: Injector | undefined;
  /**
   * Tells the layout the store changed after it was read (a server's copy
   * written to it once the request answered): on each call the key is read
   * again and `layout` takes what it holds, or the default when it cannot be
   * read, without writing it back. Returns the unsubscribe, called when the
   * injector is destroyed.
   */
  readonly subscribe?: ((onChange: () => void) => () => void) | undefined;
}

export interface PersistedDashboardLayout {
  /** Bind with `[(layout)]`: it is read once from the store and written after every change. */
  readonly layout: WritableSignal<DashboardLayout>;
  /** The layout given here; bind it to the grid's `defaultLayout`, which its Reset asks for. */
  readonly defaultLayout: DashboardLayout;
  /** Forgets what is stored and returns to the default. */
  clear(): void;
}

/** What the store holds under the key; a store that throws holds nothing. */
function readStored(store: DashboardLayoutStorage | null, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function defaultStorage(): DashboardLayoutStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The reader's layout, kept across visits. The store is reached inside `try`
 * both ways — a private window, a full quota or a blocked origin reads as
 * nothing stored and writes nothing. The component itself never writes; the
 * store and its key are the application's to name.
 */
export function persistedDashboardLayout({
  key,
  storage,
  defaultLayout = [],
  injector,
  subscribe,
}: PersistedDashboardLayoutOptions): PersistedDashboardLayout {
  const store = storage === undefined ? defaultStorage() : storage;
  const text = readStored(store, key);
  const layout = signal<DashboardLayout>(
    (text === null ? null : parseDashboardLayout(text)) ?? defaultLayout,
  );
  /* What the store already holds: the value just read is not written back,
     so a reader who never changed anything stores nothing. An effect's first
     run is deferred, so this compares values rather than counting runs. */
  let held: DashboardLayout = layout();
  effect(
    () => {
      const next = layout();
      untracked(() => {
        if (next === held) return;
        held = next;
        try {
          store?.setItem(key, serializeDashboardLayout(next));
        } catch {
          /* Nothing stored: the next visit starts from the default. */
        }
      });
    },
    injector === undefined ? {} : { injector },
  );

  if (subscribe !== undefined) {
    const unsubscribe = subscribe(() => {
      const stored = readStored(store, key);
      held = (stored === null ? null : parseDashboardLayout(stored)) ?? defaultLayout;
      layout.set(held);
    });
    (injector?.get(DestroyRef) ?? inject(DestroyRef)).onDestroy(unsubscribe);
  }

  return {
    layout,
    defaultLayout,
    clear() {
      try {
        store?.removeItem(key);
      } catch {
        /* Nothing to forget. */
      }
      held = defaultLayout;
      layout.set(defaultLayout);
    },
  };
}
