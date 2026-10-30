/**
 * What a key on a widget's handle asks for. Both bindings map the event
 * through this one function, so the two keyboards cannot drift.
 */

import type { DashboardDirection } from './dashboard-grid';

export type DashboardKeyIntent =
  | { readonly kind: 'move'; readonly direction: DashboardDirection }
  | { readonly kind: 'resize'; readonly columns: number; readonly rows: number }
  | { readonly kind: 'hide' };

export interface DashboardKeyEvent {
  readonly key: string;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}

/**
 * `Alt` with an arrow moves, `Shift` with an arrow resizes by the end edge and
 * the bottom edge, `Delete` hides. The inline arrows are mirrored in a
 * right-to-left document: the arrow that points toward the inline end is
 * always "right" and "wider".
 */
export function dashboardKeyIntent(
  event: DashboardKeyEvent,
  direction: 'ltr' | 'rtl',
): DashboardKeyIntent | null {
  if (event.ctrlKey || event.metaKey) return null;
  const towardEnd = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const towardStart = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

  if (event.altKey && !event.shiftKey) {
    if (event.key === towardEnd) return { kind: 'move', direction: 'right' };
    if (event.key === towardStart) return { kind: 'move', direction: 'left' };
    if (event.key === 'ArrowUp') return { kind: 'move', direction: 'up' };
    if (event.key === 'ArrowDown') return { kind: 'move', direction: 'down' };
    return null;
  }
  if (event.shiftKey && !event.altKey) {
    if (event.key === towardEnd) return { kind: 'resize', columns: 1, rows: 0 };
    if (event.key === towardStart) return { kind: 'resize', columns: -1, rows: 0 };
    if (event.key === 'ArrowDown') return { kind: 'resize', columns: 0, rows: 1 };
    if (event.key === 'ArrowUp') return { kind: 'resize', columns: 0, rows: -1 };
    return null;
  }
  if (!event.altKey && !event.shiftKey && event.key === 'Delete') return { kind: 'hide' };
  return null;
}

/** The shortcuts the handle declares in `aria-keyshortcuts`. */
export function handleShortcuts(removable: boolean): string {
  const keys = [
    'Alt+ArrowUp',
    'Alt+ArrowDown',
    'Alt+ArrowLeft',
    'Alt+ArrowRight',
    'Shift+ArrowUp',
    'Shift+ArrowDown',
    'Shift+ArrowLeft',
    'Shift+ArrowRight',
  ];
  return (removable ? [...keys, 'Delete'] : keys).join(' ');
}
