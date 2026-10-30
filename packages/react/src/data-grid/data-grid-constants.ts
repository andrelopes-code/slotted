import type { ResolvedGridColumn } from '@slotted/core/grid';
import type { CSSProperties } from 'react';

/** The two gutter columns the family adds before the model's own. */
export const SELECTION_COLUMN = '__selection';
export const EXPANDER_COLUMN = '__expander';
/** The reserved column that carries a row's drag handle. */
export const DRAG_COLUMN = '__drag';
export const SELECTION_WIDTH = 48;
export const EXPANDER_WIDTH = 40;
export const DRAG_WIDTH = 40;

/** The single widget a cell may hold, which takes the focus in the cell's place. */
export const SIMPLE_WIDGET =
  'a[href], button, input[type="checkbox"], input[type="radio"], [role="switch"], [role="button"], [role="checkbox"]';
/** What an editor's focus lands on: its field, before any control beside it. */
export const EDITOR_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([disabled]), [role="spinbutton"]:not([disabled]), [role="checkbox"], [role="switch"]';
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** The place of a cell in the template, and its pin offset. */
export function cellStyle<Row>(column: ResolvedGridColumn<Row>, index: number): CSSProperties {
  const style: Record<string, string> = { '--slotted-data-grid-column': String(index) };
  if (column.pinned) style['--slotted-data-grid-pin-offset'] = `${column.pinOffset}px`;
  return style as CSSProperties;
}

/** The attributes every cell of a column carries, in the header and the body. */
export function columnAttributes<Row>(column: ResolvedGridColumn<Row>) {
  return {
    ...(column.align ? { 'data-align': column.align } : {}),
    ...(column.numeric ? { 'data-numeric': '' } : {}),
    ...(column.pinned ? { 'data-pinned': column.pinned } : {}),
    ...(column.pinEdge ? { 'data-pin-edge': '' } : {}),
    'data-column': column.id,
  };
}

/**
 * Whether a pointer event landed on a widget inside the cell — a link, a
 * button, a field — rather than on the cell itself. Asked of the cell and not
 * of the document: the scroller is focusable while the grid overflows, and
 * `closest` walked up to it from every value, so a press on a header's name
 * sorted nothing and only the cell's own padding answered. A press outside
 * the cell — on the menu it opened — is not its own either.
 */
export function insideWidget(event: {
  target: EventTarget | null;
  currentTarget: EventTarget | null;
}) {
  const cell = event.currentTarget as HTMLElement;
  const target = event.target as HTMLElement | null;
  /* An event from a layer the cell owns — React bubbles a portal's events
     through the tree — is not the cell's own press either. */
  if (!target || !cell.contains(target)) return true;
  const widget = target.closest(FOCUSABLE);
  return widget !== null && widget !== cell && cell.contains(widget);
}

/** Milliseconds a changed cell stays marked when `highlightChanges` is `true`. */
export const DEFAULT_CHANGED_DURATION = 1200;
