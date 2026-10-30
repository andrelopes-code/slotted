/**
 * Keeping the keyboard inside a layer while it is open, and giving it back
 * when it closes.
 *
 * These are the two capabilities `docs/component-features.md` §3 asks of this
 * module and this module did not have. They are here rather than in
 * `dismissable-layer` because that one answers whether a layer should still be
 * open, and a module answering two questions is the failure the overlay set was
 * split to avoid.
 *
 * The browser already does all of this for a `<dialog>` opened with
 * `showModal()`. The library's overlays are not on the top layer, and this file is
 * the price of that decision — paid once, here, rather than by each family.
 *
 * Two things are deliberately not sentinel nodes. Radix and React Aria both
 * insert a focusable span before and after the layer to catch a Tab leaving it.
 * A sentinel is DOM the consumer never wrote: it turns up in their own
 * `querySelectorAll`, it is the first thing a screen reader's element list
 * shows, and it has to be kept last in the layer against every re-render. The
 * wrap needs none of it — the element after the last tabbable is the first one
 * — and anything that moves focus out by another route is caught by a
 * `focusin` listener.
 */

import { afterLayout } from '../measure/after-layout';

/**
 * What the platform puts in the tab sequence. `[tabindex]` is matched with its
 * negative values filtered out below rather than excluded here, because
 * `[tabindex]:not([tabindex="-1"])` misses `tabindex="-2"`, which is valid and
 * equally unreachable.
 */
const CANDIDATE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'audio[controls]',
  'video[controls]',
  'iframe',
  'object',
  'embed',
  'summary',
  '[contenteditable]',
  '[tabindex]',
].join(', ');

export interface FocusScopeOptions {
  /**
   * Tab and Shift+Tab wrap inside the node, and focus that lands outside is
   * pulled back. `false` for a non-modal layer, which is reachable from the
   * page by definition.
   */
  contain?: boolean;
  /**
   * Where focus goes when the scope is entered. `'first'` is the first
   * tabbable; `'container'` is the node itself, which is what the APG advises
   * for content whose structure has to be read before it is operated; a
   * function names an element; `false` moves nothing.
   */
  initial?: 'first' | 'container' | (() => HTMLElement | null) | false;
  /**
   * Where focus goes when the scope is destroyed. Defaults to the element that
   * held focus when the scope was created. `false` moves nothing.
   */
  restore?: (() => HTMLElement | null) | false;
  /** Reports where focus was sent. The caller decides what that means. */
  onFocus?: (target: HTMLElement) => void;
}

export interface FocusScopeHandle {
  /** The element focus returns to, as it stood when the scope was created. */
  readonly origin: HTMLElement | null;
  /** Moves focus in. Called once the node is in the document and painted. */
  enter: () => void;
  /** Releases the listeners and returns focus. */
  destroy: () => void;
}

function view(node: Element): Window | null {
  return node.ownerDocument.defaultView;
}

/** Whether the browser draws it at all. A hidden control is not in the sequence. */
function rendered(node: HTMLElement): boolean {
  if (node.hidden) return false;

  /* One native call answers for the node and every ancestor; a computed style
     per item and per ancestor cost a phone 80 ms on a sheet of twenty items. */
  if (typeof node.checkVisibility === 'function') {
    return node.checkVisibility({ visibilityProperty: true });
  }

  const style = view(node)?.getComputedStyle(node);
  if (!style) return true;
  if (style.visibility === 'hidden' || style.display === 'none') return false;

  /**
   * An ancestor's `display: none` hides the control without appearing in its
   * own computed style. `offsetParent` reports it in a browser and reports
   * nothing in a headless document, so the ancestors are walked instead — which
   * gives the same answer in both.
   */
  for (let parent = node.parentElement; parent !== null; parent = parent.parentElement) {
    const above = view(parent)?.getComputedStyle(parent);
    if (above?.display === 'none' || above?.visibility === 'hidden') return false;
  }
  return true;
}

function reachable(node: HTMLElement): boolean {
  if (node.hasAttribute('disabled')) return false;
  /* `inert` is what a modal layer writes over the rest of the page. */
  if (node.closest('[inert]') !== null) return false;

  const declared = node.getAttribute('tabindex');
  if (declared !== null && Number.parseInt(declared, 10) < 0) return false;
  /* An anchor is only a control while it has somewhere to go. */
  if (node.tagName === 'A' && !node.hasAttribute('href') && declared === null) return false;
  if (node.getAttribute('contenteditable') === 'false' && declared === null) return false;

  return rendered(node);
}

/** Everything inside `node` that a Tab can reach, in the order Tab reaches it. */
export function tabbables(node: HTMLElement): HTMLElement[] {
  return [...node.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)].filter(reachable);
}

/**
 * Where focus goes when the element it was on has left the document. Every
 * surveyed library leaves it on `document.body`, and the next Tab then starts
 * again at the top of the page. `createRemovalFocus` in this module already
 * decided that focus belongs where the removed element was; this is the same
 * rule for an element that is not in a collection.
 *
 * The walk starts from the parent recorded when the scope was created, not from
 * `origin.parentElement`: an element that has been removed has no parent, so by
 * the time the answer is needed the chain is already gone.
 */
function survivor(origin: HTMLElement | null, from: HTMLElement | null): HTMLElement | null {
  if (origin === null) return null;
  if (origin.isConnected) return origin;

  for (let parent = from; parent !== null; parent = parent.parentElement) {
    if (!parent.isConnected) continue;
    if (parent === parent.ownerDocument.body) return null;
    if (reachable(parent) || parent.hasAttribute('tabindex')) return parent;
  }
  return null;
}

export function createFocusScope(
  node: HTMLElement,
  options: FocusScopeOptions = {},
): FocusScopeHandle {
  const { contain = true, initial = 'first', restore, onFocus } = options;
  const doc = node.ownerDocument;

  const active = doc.activeElement;
  const origin = active instanceof HTMLElement && active !== doc.body ? active : null;
  /** Recorded now, because a removed element no longer has a parent to walk. */
  const originParent = origin?.parentElement ?? null;

  /**
   * Whether the focus landed in a layer over this one — a tour over a dialog,
   * a popover from a control inside it: an element that follows the layer in
   * the document and is not inert. Everything a modal layer protects is
   * `inert` by then, and cannot take focus at all, so what follows the layer
   * and can take it was opened, or raised, over it.
   *
   * A record of what stood after the layer when the scope was made cannot
   * answer it: a tour raised over a dialog before the dialog's own scope was
   * made stood after the dialog already, was read as the page, and had its
   * focus pulled back into the dialog.
   */
  function openedAbove(target: Node): boolean {
    if (!(node.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
    const element = target instanceof Element ? target : target.parentElement;
    return element !== null && element.closest('[inert]') === null;
  }

  /** Whether the node was given a tabindex here, and therefore owes one back. */
  let borrowedTabindex = false;
  let destroyed = false;
  /** Cancels an entry still waiting for the layout. */
  let cancelEnter: (() => void) | undefined;
  /** Guards the pull-back, which focuses and so raises `focusin` again. */
  let recovering = false;

  /**
   * `scroll` is false for the focus a layer takes as it opens: the panel is
   * still entering, and scrolling it into view would lay the page out inside
   * the commit that mounted it. A Tab that wraps scrolls, as the browser's own
   * Tab does.
   */
  function send(target: HTMLElement, scroll = true) {
    target.focus(scroll ? undefined : { preventScroll: true });
    onFocus?.(target);
  }

  function focusContainer() {
    if (!node.hasAttribute('tabindex')) {
      node.setAttribute('tabindex', '-1');
      borrowedTabindex = true;
    }
    send(node, false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (destroyed || !contain || !node.isConnected) return;
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    /* A Tab pressed outside the layer belongs to whatever holds focus there. */
    if (!node.contains(doc.activeElement)) return;

    const items = tabbables(node);
    /* Nothing to move between: the layer keeps the key rather than losing focus. */
    if (items.length === 0) return event.preventDefault();

    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    const current = doc.activeElement;

    if (event.shiftKey && (current === first || current === node)) {
      event.preventDefault();
      return send(last);
    }
    if (!event.shiftKey && current === last) {
      event.preventDefault();
      return send(first);
    }
    /* Anywhere else in the layer, the browser's own order is the right one. */
  }

  /**
   * The route a wrap cannot see: a consumer's own `focus()`, a browser find
   * bar handing focus back to the document, a click on the page behind a layer
   * that is modal in ARIA and not yet `inert`.
   */
  function handleFocusIn(event: FocusEvent) {
    if (destroyed || !contain || recovering) return;
    /* A layer that has left the document holds nothing, so it pulls nothing. */
    if (!node.isConnected) return;
    const target = event.target;
    if (!(target instanceof Node) || node.contains(target)) return;
    if (openedAbove(target)) return;

    recovering = true;
    const items = tabbables(node);
    if (items.length === 0) focusContainer();
    else send(items[0] as HTMLElement);
    recovering = false;
  }

  doc.addEventListener('keydown', handleKeyDown, true);
  doc.addEventListener('focusin', handleFocusIn, true);

  return {
    get origin() {
      return origin;
    },

    /**
     * Focus moves after the layout the opening layer causes, in the same
     * frame: `focus()` lays the page out, and in the commit that mounted the
     * layer it forced that layout early.
     */
    enter() {
      if (destroyed || initial === false) return;
      cancelEnter?.();
      cancelEnter = afterLayout(doc, () => {
        cancelEnter = undefined;
        if (destroyed) return;
        if (typeof initial === 'function') {
          const named = initial();
          if (named?.isConnected) return send(named, false);
        } else if (initial === 'first') {
          const items = tabbables(node);
          if (items.length > 0) return send(items[0] as HTMLElement, false);
        }
        focusContainer();
      });
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelEnter?.();

      doc.removeEventListener('keydown', handleKeyDown, true);
      doc.removeEventListener('focusin', handleFocusIn, true);

      if (borrowedTabindex) node.removeAttribute('tabindex');

      if (restore === false) return;

      /**
       * Focus moves back only from inside the layer or from nowhere. A consumer
       * who focused something else while closing meant it, and a scope that
       * overrode them would be the bug with no local explanation.
       */
      const current = doc.activeElement;
      const inside = current === null || current === doc.body || node.contains(current);
      if (!inside) return;

      const target = restore ? restore() : survivor(origin, originParent);
      if (target?.isConnected) send(target);
    },
  };
}
