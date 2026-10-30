export type Orientation = 'horizontal' | 'vertical';

export type Direction = 'ltr' | 'rtl';

export interface ArrowNavigationOptions {
  /** Selects the items the arrows move between, within the container. */
  itemSelector: string;
  /**
   * Wrap past the ends. Defaults to true. A getter is read at the time of each
   * key, like `orientation`, so a consumer may turn wrapping off after the
   * handle exists: the Angular toolbar bound its input once, at creation, and
   * every later change was ignored while the component reported it honestly.
   */
  loop?: boolean | (() => boolean);
  /** Reports movement, after focus has landed. The caller decides what it means. */
  onMove?: (index: number, item: HTMLElement) => void;
  /**
   * How an item takes focus. `item.focus()` by default, which scrolls every
   * scroller above the item, the page included; a list that scrolls inside a
   * layer anchored to a control focuses without scrolling and reveals the item
   * inside itself.
   */
  focus?: (item: HTMLElement) => void;
  /** Read at the time of each key, so a consumer may change it at runtime. */
  orientation?: () => Orientation;
  /**
   * Which way the container is read. Defaults to the container's own computed
   * `direction`, so a caller that inherits the document's `dir` says nothing.
   */
  direction?: () => Direction;
  /**
   * Whether the arrows across the flow move focus as well.
   *
   * The APG lets a toolbar duplicate them — "Up Arrow and Down Arrow can
   * duplicate Left Arrow and Right Arrow" — and forbids a horizontal `tablist`
   * from listening for them at all, so that the page keeps scrolling with
   * focus inside the list. Default `false`, which is the stricter of the two.
   */
  crossAxis?: boolean;
  /**
   * Which keys an item keeps for itself.
   *
   * The APG's advice for a control that needs the navigation pair — "include
   * only one such control and make it the last element in the toolbar" — is a
   * rule the container can enforce instead: a text field keeps `ArrowLeft`,
   * `ArrowRight`, `Home` and `End` for its caret, and focus leaves it on the
   * cross axis or with `Tab`. Returning nothing, which is the default, is the
   * behavior every other caller wants.
   */
  ownedKeys?: (item: HTMLElement) => readonly string[];
  /**
   * Whether an item carrying `aria-disabled="true"` stays in the ring.
   *
   * The APG allows a focusable disabled control "in circumstances where
   * discoverability of a function is crucial". An item carrying the *native*
   * attribute is skipped either way, because the platform will not focus it
   * and no option here can change that. Default `false`.
   */
  includeAriaDisabled?: boolean;
  /**
   * Where a key pressed outside every item is treated as coming from. It is
   * what lets a caller holding a tab stop of its own move from the stop rather
   * than from the start of the list. Defaults to the first item.
   */
  origin?: () => number;
}

export interface ArrowNavigationHandle {
  /** Removes the listener and leaves every item as it stands. */
  destroy: () => void;
  /** Marks the item list for a re-read after one is added or removed. */
  refresh: () => void;
  /** The items, in the order the DOM holds them, read again after a `refresh`. */
  items: () => readonly HTMLElement[];
  /** The first item the platform will focus, or `-1` when there is none. */
  firstEnabled: () => number;
}

const HORIZONTAL_KEYS = { next: 'ArrowRight', previous: 'ArrowLeft' } as const;
const MIRRORED_KEYS = { next: 'ArrowLeft', previous: 'ArrowRight' } as const;
const VERTICAL_KEYS = { next: 'ArrowDown', previous: 'ArrowUp' } as const;

/** One frozen array, so the default `ownedKeys` allocates nothing per key. */
const EMPTY: readonly string[] = Object.freeze([]);

/**
 * `:disabled` rather than the attribute alone, because a control inside a
 * disabled `fieldset` carries no attribute of its own and still cannot be
 * focused. That is how a whole bar or a whole set of controls is taken out of
 * action with one word, and a ring that wrote its tab stop on one of them would
 * hand the reader a stop the platform refuses to honor.
 */
export function isNavigationDisabled(item: HTMLElement, includeAriaDisabled: boolean) {
  if (item.hasAttribute('disabled')) return true;
  if (typeof item.matches === 'function' && item.matches(':disabled')) return true;
  return !includeAriaDisabled && item.getAttribute('aria-disabled') === 'true';
}

/**
 * An element the platform will not focus is not a place to move to.
 *
 * The `hidden` attribute and a computed `visibility` of `hidden` or `collapse`
 * both take an element out of the focus order while leaving it in the DOM, so a
 * selector that matched it collected a stop nothing can stand on — the same
 * fact `isNavigationDisabled` records for a disabled control. `toolbar` found
 * it: the bar hides the controls it has no room for, and the ring kept moving
 * focus onto them.
 *
 * `closest` rather than the element's own attribute, because hiding a wrapper
 * hides everything under it. A document with no layout engine reports nothing
 * for `visibility`, and every element is an item there, which is right: a test
 * that hid a control did so with the attribute.
 */
function isNavigationHidden(item: HTMLElement): boolean {
  if (typeof item.closest === 'function' && item.closest('[hidden]') !== null) return true;

  const visibility = item.ownerDocument?.defaultView?.getComputedStyle?.(item)?.visibility;
  return visibility === 'hidden' || visibility === 'collapse';
}

/**
 * The collection reads attributes only. The computed `visibility` is read by
 * `isNavigationHidden` for the candidate a key moves to, never for the whole
 * list: the list is read on render paths (a roving tab stop, a refresh), and
 * one `getComputedStyle` there forces a style recalculation of whatever the
 * render has just dirtied.
 */
function isCollectionHidden(item: HTMLElement): boolean {
  return typeof item.closest === 'function' && item.closest('[hidden]') !== null;
}

/** An item a key may land on: enabled and drawn. */
function isNavigable(item: HTMLElement, includeAriaDisabled: boolean): boolean {
  return !isNavigationDisabled(item, includeAriaDisabled) && !isNavigationHidden(item);
}

/**
 * The arrow keys follow the reading direction, which is what the APG means by
 * "the next item": in a right-to-left document the next item is to the left,
 * and a component that always answered `ArrowRight` ran its collection
 * backwards for half the world. Nothing above the block axis changes, because
 * `dir` does not mirror it.
 *
 * The direction is read from the container rather than accepted as a value, so
 * a caller that simply inherits the document's `dir` — which is every caller —
 * says nothing and is still correct. A document without a layout engine
 * reports nothing, and left-to-right is the right last resort there.
 */
function readDirection(container: HTMLElement): Direction {
  const view = container.ownerDocument?.defaultView;
  const computed = view?.getComputedStyle?.(container)?.direction;
  return computed === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * Moving focus along a collection with the arrow keys, `Home` and `End`.
 *
 * It writes no `tabindex` and holds no tab stop, which is the whole of the
 * difference between it and `createRovingTabindex` — that one is this engine
 * plus a tab stop. The two are separate because the APG needs both and needs
 * them apart: a `tablist` has one stop and moves focus inside it, while an
 * accordion keeps every header in the page tab sequence and, since
 * `w3c/aria-practices#3434` removed the roving alternative, may only add the
 * arrows on top of that sequence.
 */
export function createArrowNavigation(
  container: HTMLElement,
  options: ArrowNavigationOptions,
): ArrowNavigationHandle {
  const loop = typeof options.loop === 'function' ? options.loop : () => options.loop ?? true;
  const orientation = options.orientation ?? (() => 'horizontal' as const);
  const direction = options.direction ?? (() => readDirection(container));
  const crossAxis = options.crossAxis ?? false;
  const includeAriaDisabled = options.includeAriaDisabled ?? false;
  const ownedKeys = options.ownedKeys ?? (() => EMPTY);

  let items: HTMLElement[] = [];
  /**
   * The collection is read when something asks for it, not when it may have
   * changed: an accordion of fifty disclosures otherwise queried its list at
   * creation and again on the mutation that mounting itself caused, for a list
   * no key had asked for.
   */
  let stale = true;

  function currentItems() {
    if (stale) {
      items = [...container.querySelectorAll<HTMLElement>(options.itemSelector)].filter(
        (item) => !isCollectionHidden(item),
      );
      stale = false;
    }
    return items;
  }

  /** Attributes only: it places the tab stop, which runs on render paths. */
  function firstEnabled() {
    return currentItems().findIndex((item) => !isNavigationDisabled(item, includeAriaDisabled));
  }

  function step(from: number, delta: number) {
    const count = items.length;
    if (count === 0) return -1;

    let index = from;
    for (let taken = 0; taken < count; taken += 1) {
      index += delta;
      if (index < 0 || index >= count) {
        if (!loop()) return -1;
        index = (index + count) % count;
      }
      if (isNavigable(items[index]!, includeAriaDisabled)) return index;
    }
    return -1;
  }

  function edge(delta: 1 | -1) {
    const from = delta === 1 ? -1 : items.length;
    let index = from;
    for (let taken = 0; taken < items.length; taken += 1) {
      index += delta;
      if (index < 0 || index >= items.length) return -1;
      if (isNavigable(items[index]!, includeAriaDisabled)) return index;
    }
    return -1;
  }

  function moveTo(index: number, from: number) {
    if (index === -1 || index === from) return;
    const item = items[index]!;
    if (options.focus === undefined) item.focus();
    else options.focus(item);
    options.onMove?.(index, item);
  }

  function handleKeydown(event: KeyboardEvent) {
    stale = true;
    currentItems();
    const vertical = orientation() === 'vertical';
    const keys = vertical ? VERTICAL_KEYS : direction() === 'rtl' ? MIRRORED_KEYS : HORIZONTAL_KEYS;
    /**
     * The pair across the flow. It navigates only when the caller asked for
     * it, and it is never mirrored: `dir` turns the inline axis and leaves the
     * block axis where it is.
     */
    const cross = vertical ? HORIZONTAL_KEYS : VERTICAL_KEYS;
    const from = items.findIndex((item) => item.contains(event.target as Node));
    /**
     * `from` is where the key was pressed, which is not always where the caller
     * counts from: a control the reader clicked, or a script focused, holds
     * focus while a tab stop still points at another item. The caller states
     * that answer through `origin`.
     */
    const origin = from === -1 ? (options.origin?.() ?? 0) : from;

    /**
     * A key the focused item keeps is not the container's to read. The item
     * has already had it — this listener is on the container, so the event
     * arrived by bubbling — and stopping here leaves the caret, the value or
     * the selection inside the item exactly where the item put it.
     */
    const item = from === -1 ? undefined : items[from];
    if (item !== undefined && ownedKeys(item).includes(event.key)) return;

    /**
     * An arrow held with a modifier is a chord, and a chord belongs to whoever
     * bound it. The APG assigns the ring no modified key — `Control + Home` and
     * `Control + End` are the only two it names for a grid, both optional, and
     * neither is implemented here — so a ring that answered one would be taking
     * a key it was never given.
     *
     * `multi-select` found it: `Alt` with an arrow moves a chip one place along
     * its row, and the ring was consuming the press and moving focus instead.
     * Nothing failed loudly — the reader simply watched focus travel where a
     * value should have.
     */
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === keys.next || (crossAxis && event.key === cross.next)) {
      moveTo(step(origin, 1), origin);
    } else if (event.key === keys.previous || (crossAxis && event.key === cross.previous)) {
      moveTo(step(origin, -1), origin);
    } else if (event.key === 'Home') moveTo(edge(1), origin);
    else if (event.key === 'End') moveTo(edge(-1), origin);
    else return;

    event.preventDefault();
  }

  container.addEventListener('keydown', handleKeydown);

  return {
    destroy: () => container.removeEventListener('keydown', handleKeydown),
    refresh: () => {
      stale = true;
    },
    items: currentItems,
    firstEnabled,
  };
}
