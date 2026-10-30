/**
 * The elements that answer a click of their own. A click on one of them, or
 * inside one, belongs to that element and not to the row around it.
 */
export const OWN_ACTION_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
].join(',');

/**
 * Whether a click on `target` is the row's own action: it landed inside the
 * row's element, on no control of its own, and did not end a text selection
 * inside the row. A click that reaches the row through a portal — a menu
 * opened from a cell — lands outside the element and is never the row's.
 */
export function isRowAction(row: Element, target: EventTarget | null): boolean {
  if (!(target instanceof Element) || !row.contains(target)) return false;
  const own = target.closest(OWN_ACTION_SELECTOR);
  if (own !== null && own !== row && row.contains(own)) return false;
  const selection = row.ownerDocument.defaultView?.getSelection();
  if (
    selection !== null &&
    selection !== undefined &&
    !selection.isCollapsed &&
    selection.anchorNode !== null &&
    row.contains(selection.anchorNode)
  ) {
    return false;
  }
  return true;
}
