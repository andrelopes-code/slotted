import { inject, Injectable, InjectionToken } from '@angular/core';

/** How much of a frame the set is given. The vocabulary `description-list` set. */
export type TableVariant = 'plain' | 'ruled' | 'framed';

/**
 * Whether the first and the last column keep the cell's inset on their outer
 * side. `flush` reaches `plain` and `ruled` only: a `framed` table keeps the
 * inset, because its text stands against a border.
 */
export type TableEdges = 'inset' | 'flush';

/**
 * Whether the browser sizes the columns from their content or from what the
 * table states. `fixed` is what makes a stated width hold and a truncated cell
 * truncate at all.
 */
export type TableLayout = 'auto' | 'fixed';

export type TableSelectionMode = 'none' | 'single' | 'multiple';

/**
 * What a sticky header stays inside: the family's own scroller, or whatever
 * scrolls outside it — the page, an app shell, a scroll area.
 */
export type TableStickyTo = 'scroll' | 'page';

/** Which edge a cell's content stands on, resolved logically. */
export type TableAlign = 'start' | 'center' | 'end';

/** What a value longer than its column does. None of the three removes it. */
export type TableText = 'wrap' | 'truncate' | 'nowrap';

/** Which edge a column is pinned to while the table scrolls past it. */
export type TableSticky = 'start' | 'end';

export type TableSortDirection = 'ascending' | 'descending';

/**
 * Which column the rows are ordered by, and which way. The family holds it and
 * reorders nothing: the rows are the consumer's own, written in the template,
 * so the consumer applies the descriptor to its own array or its own query.
 */
export interface TableSortDescriptor {
  column: string;
  direction: TableSortDirection;
}

export type TableSortReason = 'pointer' | 'keyboard' | 'clear' | 'programmatic';
export type TableSelectionReason = 'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic';
export type TableExpandedReason = 'pointer' | 'keyboard' | 'programmatic';

export interface TableDefaults {
  cellAlign: TableAlign;
  columns: number;
  edges: TableEdges;
  layout: TableLayout;
  selectionMode: TableSelectionMode;
  stickyFooter: boolean;
  stickyHeader: boolean;
  stickyTo: TableStickyTo;
  striped: boolean;
  variant: TableVariant;
}

const FALLBACK: TableDefaults = {
  cellAlign: 'center',
  columns: 1,
  edges: 'inset',
  layout: 'auto',
  selectionMode: 'none',
  stickyFooter: false,
  stickyHeader: false,
  stickyTo: 'scroll',
  striped: false,
  variant: 'ruled',
};

export const TABLE_DEFAULTS = new InjectionToken<TableDefaults>('slotted table defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its tables are framed and how they select,
 * rather than repeating the same inputs on every listing screen. A table that
 * states any of them itself still wins. Its words come from the language in
 * force (`provideSlotted`).
 */
export function provideTableDefaults(defaults: Partial<TableDefaults>) {
  return {
    provide: TABLE_DEFAULTS,
    useFactory: (): TableDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectTableDefaults(): TableDefaults {
  return inject(TABLE_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlTableIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-table-${this.count}`;
  }
}
