/**
 * What a toolbar treats as an item, and which keys an item keeps for itself.
 *
 * It is here rather than in either binding because the two answers have to
 * agree: a control React walks and Angular skips would be a family whose
 * keyboard depends on the framework that rendered it.
 */

import type { Orientation } from './roving-tabindex';

/**
 * Everything focusable a bar can hold. Radix and Base UI wrap each item in a
 * component of their own; finding them by what they are is what lets this
 * library's own `button`, `link`, `checkbox`, `switch` and `text-field` drop
 * into a bar unwrapped — and it is why an element that cannot hold focus is not
 * an item, which the anatomy states.
 */
export const TOOLBAR_ITEM_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="combobox"]',
].join(', ');

/** The attribute a consumer writes to state what an item keeps. */
export const TOOLBAR_KEYS_ATTRIBUTE = 'data-toolbar-keys';

const INLINE_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
const BLOCK_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
const NO_KEYS: readonly string[] = Object.freeze([]);

/**
 * The kinds of control whose own operation needs the arrows of the flow axis.
 * The APG asks an author to "avoid including controls whose operation requires
 * the pair of arrow keys used for toolbar navigation" and, failing that, to
 * place one such control last. Here the container enforces it instead: the item
 * keeps the keys, and focus leaves it on the cross axis or with `Tab`.
 */
function ownsFlowKeys(item: HTMLElement): boolean {
  if (item.isContentEditable) return true;

  const role = item.getAttribute('role');
  if (role === 'slider' || role === 'spinbutton' || role === 'combobox') return true;

  const tag = item.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;

  /* A checkbox, a radio and a button are inputs that do not move a caret. */
  const type = (item as HTMLInputElement).type;
  return type !== 'checkbox' && type !== 'radio' && type !== 'button';
}

/**
 * Which keys the focused item keeps, for `createRovingTabindex`. A consumer
 * states it with `data-toolbar-keys`; otherwise the kind of control decides.
 */
export function toolbarOwnedKeys(item: HTMLElement, orientation: Orientation): readonly string[] {
  const flow = orientation === 'vertical' ? BLOCK_KEYS : INLINE_KEYS;
  const cross = orientation === 'vertical' ? INLINE_KEYS : BLOCK_KEYS;
  const stated = item.getAttribute(TOOLBAR_KEYS_ATTRIBUTE);

  if (stated === 'none') return NO_KEYS;
  if (stated === 'all') return [...new Set([...flow, ...cross])];
  if (stated === 'inline') return INLINE_KEYS;
  if (stated === 'block') return BLOCK_KEYS;

  return ownsFlowKeys(item) ? flow : NO_KEYS;
}
