/**
 * Focusing a destination that is not a stop in the tab order — a skip link's
 * target, a landmark.
 *
 * A destination that carries `tabindex="-1"` all the time is focusable by the
 * pointer too: a click on any text inside it focuses it, and a key pressed
 * after the click (Shift alone is enough) makes it match `:focus-visible`, so
 * the ring is drawn around the whole region. The attribute is written for the
 * one focus that asked for it and removed when that focus ends — on blur, or
 * on the first pointer press inside, which is the press that would otherwise
 * keep the region focused under the reader's click.
 *
 * An element that already carries a `tabindex` is the consumer's: it is
 * focused and its attribute is left as written.
 */
export function focusTarget(element: HTMLElement): void {
  if (element.hasAttribute('tabindex')) {
    element.focus();
    return;
  }

  element.setAttribute('tabindex', '-1');
  /**
   * The press blurs explicitly: a browser that does not run the focus fixup
   * rule keeps the focus on an element whose `tabindex` was removed.
   */
  const release = () => {
    element.removeEventListener('blur', release);
    element.removeEventListener('pointerdown', release);
    if (element.ownerDocument.activeElement === element) element.blur();
    element.removeAttribute('tabindex');
  };
  element.addEventListener('blur', release);
  element.addEventListener('pointerdown', release);
  element.focus();
  if (element.ownerDocument.activeElement !== element) release();
}
