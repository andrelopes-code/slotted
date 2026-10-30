/**
 * What a key pressed in the field asks for.
 *
 * The keyboard of this family is `combobox`'s and `multi-select`'s, written a
 * third time (design §1.5). The decision is taken here, once, so the React and
 * Angular bindings only carry it out and cannot answer one key two ways. The
 * chips' own keys — arrows between chips, `Delete` on a chip — are
 * `createArrowNavigation` and `createRemovalFocus` from `@slotted/core/focus`,
 * as in `multi-select`.
 */

import type { MoveIntent } from '../collection/navigation';

export interface EntityPickerKeyInput {
  readonly key: string;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  /** An IME composition is in progress; every key belongs to it. */
  readonly composing?: boolean;
  readonly open: boolean;
  readonly selectionMode: 'single' | 'multiple';
  readonly readOnly: boolean;
  /** Whether an option is highlighted. */
  readonly highlighted: boolean;
  /** The field holds no text. */
  readonly empty: boolean;
  /** The caret is collapsed at the start of the field. */
  readonly caretAtStart: boolean;
  /** How many chips stand before the field (`multiple`). */
  readonly chips: number;
  /** The direction the arrows are read in. */
  readonly dir?: 'ltr' | 'rtl';
}

export type EntityPickerKeyAction =
  /** The browser keeps the key: caret, text editing, `Tab` out. */
  | { readonly type: 'none' }
  | { readonly type: 'open'; readonly highlight: 'first' | 'last' | 'keep' }
  | { readonly type: 'close'; readonly reason: 'keyboard' | 'escape' }
  | { readonly type: 'move'; readonly intent: MoveIntent }
  /** Enter on the highlighted option: choose, toggle, create or retry. */
  | { readonly type: 'activate' }
  /** Escape on a closed single field: put the chosen name back, or clear. */
  | { readonly type: 'revert' }
  /** Escape on a closed multiple field: empty the text. */
  | { readonly type: 'clearQuery' }
  /** Backspace or the inline-start arrow from an empty field: the last chip. */
  | { readonly type: 'focusChip' };

const NONE: EntityPickerKeyAction = { type: 'none' };

/**
 * The key table of `specs/components/entity-picker/contract.json`, row for
 * row. A returned action other than `none` means the binding prevents the
 * browser's default.
 */
export function entityPickerKey(input: EntityPickerKeyInput): EntityPickerKeyAction {
  const { key, open, readOnly } = input;
  if (input.composing === true || input.ctrlKey === true || input.metaKey === true) return NONE;

  switch (key) {
    case 'ArrowDown':
      if (input.altKey === true)
        return open || readOnly ? NONE : { type: 'open', highlight: 'keep' };
      if (!open) return readOnly ? NONE : { type: 'open', highlight: 'first' };
      return { type: 'move', intent: 'next' };
    case 'ArrowUp':
      if (input.altKey === true) return open ? { type: 'close', reason: 'keyboard' } : NONE;
      if (!open) return readOnly ? NONE : { type: 'open', highlight: 'last' };
      return { type: 'move', intent: 'previous' };
    case 'PageDown':
      return open ? { type: 'move', intent: 'pageDown' } : NONE;
    case 'PageUp':
      return open ? { type: 'move', intent: 'pageUp' } : NONE;
    case 'Enter':
      return open && input.highlighted ? { type: 'activate' } : NONE;
    case 'Escape':
      if (open) return { type: 'close', reason: 'escape' };
      if (input.selectionMode === 'single') return readOnly ? NONE : { type: 'revert' };
      return input.empty ? NONE : { type: 'clearQuery' };
    case 'Backspace':
      return input.selectionMode === 'multiple' &&
        input.empty &&
        input.caretAtStart &&
        input.chips > 0
        ? { type: 'focusChip' }
        : NONE;
    case 'ArrowLeft':
    case 'ArrowRight': {
      const towardStart = (key === 'ArrowLeft') === ((input.dir ?? 'ltr') === 'ltr');
      return input.selectionMode === 'multiple' && towardStart && input.empty && input.chips > 0
        ? { type: 'focusChip' }
        : NONE;
    }
    default:
      return NONE;
  }
}
