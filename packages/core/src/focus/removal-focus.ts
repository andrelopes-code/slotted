/**
 * Keeping the keyboard where it was when the thing it was on is taken away.
 *
 * A collection whose items can be removed has one failure nobody sees in a
 * demo: the focused item is removed, the browser moves focus to the document
 * body, and the next `Tab` starts again at the top of the page. React Aria and
 * Angular Material both move focus to a neighbour and neither says what
 * happens when there is no neighbour left.
 *
 * The rule here has three steps, and the third is the one that is missing
 * elsewhere: focus goes to the control that took the removed one's place, then
 * to the last control if the removed one was last, then to the container
 * itself — which is why the container has to be able to hold focus.
 *
 * It observes the DOM rather than being told, so it is correct whichever way
 * the item left: a consumer's own state update, a server round trip, another
 * user's edit arriving over a socket. Nothing here knows about React or
 * Angular, so the two bindings cannot disagree about where focus went.
 */

export interface RemovalFocusOptions {
  /** Selects the focusable controls the container holds. */
  itemSelector: string;
  /**
   * Where focus goes when the container holds no control at all. Defaults to
   * the container, which must then be able to receive focus — `tabindex="-1"`
   * is what makes a container that is not a control focusable.
   */
  fallback?: () => HTMLElement | null;
  /** Reports where focus was sent. The caller decides what that means. */
  onRestore?: (target: HTMLElement) => void;
}

export interface RemovalFocusHandle {
  /** Removes the observer and the listeners, and moves nothing. */
  destroy: () => void;
}

export function createRemovalFocus(
  container: HTMLElement,
  options: RemovalFocusOptions,
): RemovalFocusHandle {
  const items = () => [...container.querySelectorAll<HTMLElement>(options.itemSelector)];

  /**
   * Where focus was, as a position rather than as an element: the element is
   * the one thing that is certainly gone by the time this has to answer.
   */
  let lastIndex = -1;
  /**
   * Whether the container is the one that lost focus. A removal moves focus to
   * the body and reports no `relatedTarget`; a person tabbing away reports the
   * element they went to. That difference is what separates the case this
   * exists for from the case it must ignore.
   */
  let held = false;

  function handleFocusIn(event: FocusEvent) {
    const target = event.target as Node | null;
    if (!target) return;
    held = true;
    lastIndex = items().findIndex((item) => item === target || item.contains(target));
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next && !container.contains(next)) held = false;
  }

  function restore() {
    if (!held) return;

    const owner = container.ownerDocument;
    const active = owner?.activeElement ?? null;
    /* Focus is still somewhere inside: nothing was lost, so nothing moves. */
    if (active && active !== owner?.body && container.contains(active)) return;

    const current = items();
    const target =
      current.length === 0
        ? (options.fallback?.() ?? container)
        : (current[Math.min(Math.max(lastIndex, 0), current.length - 1)] ?? container);

    if (!target.isConnected) return;
    target.focus();
    options.onRestore?.(target);
  }

  const observer = new MutationObserver(restore);
  observer.observe(container, { childList: true, subtree: true });
  container.addEventListener('focusin', handleFocusIn);
  container.addEventListener('focusout', handleFocusOut);

  return {
    destroy() {
      observer.disconnect();
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    },
  };
}
