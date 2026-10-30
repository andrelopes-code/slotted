/**
 * What a key means while a session is open, and what the modifiers make of a
 * drop. The mapping is the one dnd kit, React Aria and react-beautiful-dnd
 * agree on — arrows move, `Space`/`Enter` drop, `Escape` cancels, `Tab`
 * reaches the other targets — read through the container's orientation and
 * the writing direction, the way `tags-input` already reads its arrows.
 *
 * The key that *opens* a session is not here: which of its keys picks an item
 * up is a decision about the family that owns the item.
 */

import type { DragOrientation, DropOperation, MoveIntent } from './types';

export type WritingDirection = 'ltr' | 'rtl';

/** For `aria-keyshortcuts` and for the instruction string a family renders. */
export const DRAG_KEYS = {
  move: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'],
  containers: ['Tab', 'Shift+Tab'],
  drop: ['Space', 'Enter'],
  cancel: ['Escape'],
} as const;

export function isDropKey(event: KeyboardEvent): boolean {
  return event.key === ' ' || event.key === 'Enter';
}

export function intentForKey(
  event: KeyboardEvent,
  orientation: DragOrientation,
  direction: WritingDirection,
): MoveIntent | null {
  const inlineForward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const inlineBack = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

  switch (event.key) {
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    case 'PageDown':
      return 'pageNext';
    case 'PageUp':
      return 'pagePrevious';
    case 'Tab':
      return event.shiftKey ? 'previousContainer' : 'nextContainer';
    case 'ArrowDown':
      return orientation === 'vertical'
        ? 'next'
        : orientation === 'grid'
          ? 'rowNext'
          : 'nextContainer';
    case 'ArrowUp':
      return orientation === 'vertical'
        ? 'previous'
        : orientation === 'grid'
          ? 'rowPrevious'
          : 'previousContainer';
    case inlineForward:
      return orientation === 'vertical' ? 'nextContainer' : 'next';
    case inlineBack:
      return orientation === 'vertical' ? 'previousContainer' : 'previous';
    default:
      return null;
  }
}

export interface Modifiers {
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly shiftKey?: boolean;
  readonly metaKey?: boolean;
}

/**
 * The platform's own reading: `Ctrl` (or `Option`) copies, `Shift` moves,
 * `Ctrl`+`Shift` (or `Cmd`+`Option`) links. An operation the drag does not
 * allow is not chosen by a key; the first allowed one is.
 */
export function operationForModifiers(
  modifiers: Modifiers,
  allowed: readonly DropOperation[],
): DropOperation | null {
  const ctrl = modifiers.ctrlKey === true;
  const alt = modifiers.altKey === true;
  const shift = modifiers.shiftKey === true;
  const meta = modifiers.metaKey === true;

  const wanted: DropOperation | null =
    (ctrl && shift) || (meta && alt)
      ? 'link'
      : (ctrl || alt) && !shift && !meta
        ? 'copy'
        : shift || meta
          ? 'move'
          : null;

  if (wanted !== null && allowed.includes(wanted)) return wanted;
  return allowed[0] ?? null;
}
