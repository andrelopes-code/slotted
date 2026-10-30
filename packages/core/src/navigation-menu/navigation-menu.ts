/**
 * The behaviour `navigation-menu` shares between its bindings: which way one
 * section crosses another, where the shared surface stands and how large it
 * is, when a pointer opens and closes a section, and where an arrow key sends
 * focus.
 *
 * The family keeps every panel after its trigger in the DOM — the disclosure
 * example's structure — and paints one surface, the viewport, under whichever
 * panel is open. The surface is sized and placed from measurements only
 * script has, written on the root as runtime properties
 * (`docs/build-briefing.md`, _A value a stylesheet needs and only script can
 * measure_). Nothing here holds the open value: each binding owns it through
 * `@slotted/core/state`, and asks this module only for facts and timings.
 */

export type NavigationMenuOrientation = 'horizontal' | 'vertical';
export type NavigationMenuMotion = 'from-start' | 'from-end' | 'to-start' | 'to-end';

export interface MotionPair {
  enter: NavigationMenuMotion | null;
  exit: NavigationMenuMotion | null;
}

/**
 * The crossing between two open sections, in reading order. A section after
 * the one that leaves arrives from the end and pushes the old one toward the
 * start; one before it does the opposite. Opening from nothing and closing to
 * nothing are not crossings: the surface itself arrives and leaves.
 */
export function motionBetween(
  order: readonly string[],
  from: string | null,
  to: string | null,
): MotionPair {
  if (from === null || to === null || from === to) return { enter: null, exit: null };
  const forward = order.indexOf(to) > order.indexOf(from);
  return forward
    ? { enter: 'from-end', exit: 'to-start' }
    : { enter: 'from-start', exit: 'to-end' };
}

export interface Box {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface GeometryInput {
  orientation: NavigationMenuOrientation;
  dir: 'ltr' | 'rtl';
  /** The root's border box in the window. */
  root: Box;
  /** The open trigger's border box in the window. */
  trigger: Box;
  /** The open content's border-box size. */
  content: { width: number; height: number };
  windowWidth: number;
  /** The distance the surface keeps from the window's edges. */
  gutter: number;
}

export interface ViewportGeometry {
  /**
   * Where the surface stands against its trigger: under a row, and beside a
   * column while the column has room at its end; a column with none drops the
   * surface under the trigger rather than clipping it at the window's edge.
   */
  placement: 'below' | 'beside';
  inlineSize: number;
  blockSize: number;
  /** From the root's inline start to the surface's; beside a column, the column's width. */
  inlineStart: number;
  /** From the root's top to the edge the surface hangs from: the trigger's top beside it, its bottom under it. */
  blockStart: number;
  /** The trigger's centre from the surface's start, along the edge the surface faces it with. */
  arrowOffset: number;
  /** The widest a panel may be. */
  available: number;
}

/**
 * Under a trigger the surface starts at the trigger's inline start, which is
 * what puts the panel's first text in the trigger label's column, and moves
 * toward the start only as far as it must to end a gutter before the window
 * does. Beside a column it stands level with the trigger. Every inline
 * distance is measured from the root's inline start, so a right-to-left root
 * needs no second rule. The gap between the row and the surface is the
 * stylesheet's and is not measured here.
 */
export function viewportGeometry(input: GeometryInput): ViewportGeometry {
  const { orientation, dir, root, trigger, content, windowWidth, gutter } = input;
  const rtl = dir === 'rtl';
  const rootStart = rtl ? windowWidth - root.right : root.left;
  const triggerStart = rtl ? root.right - trigger.right : trigger.left - root.left;

  if (orientation === 'vertical') {
    const room = windowWidth - gutter - (rootStart + root.width);
    if (room >= content.width) {
      return {
        placement: 'beside',
        inlineSize: content.width,
        blockSize: content.height,
        inlineStart: root.width,
        blockStart: trigger.top - root.top,
        arrowOffset: trigger.height / 2,
        available: Math.max(0, room),
      };
    }
  }

  const available = Math.max(0, windowWidth - gutter * 2);
  const width = Math.min(content.width, available);
  let start = rootStart + triggerStart;
  if (start + width > windowWidth - gutter) start = windowWidth - gutter - width;
  start = Math.max(start, gutter);
  const inlineStart = start - rootStart;

  return {
    placement: 'below',
    inlineSize: content.width,
    blockSize: content.height,
    inlineStart,
    blockStart: orientation === 'vertical' ? trigger.bottom - root.top : 0,
    arrowOffset: triggerStart + trigger.width / 2 - inlineStart,
    available,
  };
}

/**
 * The box a panel has to fit in: the nearest ancestor that clips its inline
 * overflow, or the window. A panel inside a scrolling region of an
 * application — or a documentation stage — that measured against the window
 * was clipped by the region it stood in.
 */
export function clippingBox(element: HTMLElement): { left: number; width: number } {
  const view = element.ownerDocument.defaultView;
  for (let node = element.parentElement; node !== null; node = node.parentElement) {
    const style = view?.getComputedStyle(node);
    const overflow = style?.overflowX || style?.overflow || 'visible';
    if (overflow !== 'visible') {
      const rect = node.getBoundingClientRect();
      return { left: rect.left + node.clientLeft, width: node.clientWidth };
    }
  }
  return { left: 0, width: element.ownerDocument.documentElement.clientWidth };
}

function relative(rect: DOMRect, left: number): Box {
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left - left,
    right: rect.right - left,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Everything both bindings measure, in one place: the root, the open trigger
 * and its panel, against the box that clips them, in the root's direction.
 */
export function measureViewport(
  root: HTMLElement,
  trigger: HTMLElement,
  content: HTMLElement,
  orientation: NavigationMenuOrientation,
  gutter: number,
): ViewportGeometry {
  const frame = clippingBox(root);
  const view = root.ownerDocument.defaultView;
  return viewportGeometry({
    orientation,
    dir: view?.getComputedStyle(root).direction === 'rtl' ? 'rtl' : 'ltr',
    root: relative(root.getBoundingClientRect(), frame.left),
    trigger: relative(trigger.getBoundingClientRect(), frame.left),
    content: { width: content.offsetWidth, height: content.offsetHeight },
    windowWidth: frame.width,
    gutter,
  });
}

const PROPERTIES = {
  inlineSize: '--slotted-navigation-menu-viewport-inline-size',
  blockSize: '--slotted-navigation-menu-viewport-block-size',
  inlineStart: '--slotted-navigation-menu-viewport-inline-start',
  blockStart: '--slotted-navigation-menu-viewport-block-start',
  arrowOffset: '--slotted-navigation-menu-arrow-offset',
  available: '--slotted-navigation-menu-available-inline-size',
} as const satisfies Record<Exclude<keyof ViewportGeometry, 'placement'>, string>;

/**
 * The surface's edges land on whole pixels, so its size and place are
 * rounded; the arrow is a point on an edge and keeps its half pixel. The
 * placement is an attribute, because the stylesheet selects on it.
 */
export function writeGeometry(element: HTMLElement, geometry: ViewportGeometry): void {
  for (const key of Object.keys(PROPERTIES) as (keyof typeof PROPERTIES)[]) {
    const value = key === 'arrowOffset' ? geometry[key] : Math.round(geometry[key]);
    element.style.setProperty(PROPERTIES[key], `${value}px`);
  }
  element.dataset['placement'] = geometry.placement;
}

export interface HoverIntentOptions {
  /** Milliseconds, or a function read at each entry so a binding's current value applies. */
  openDelay: number | (() => number);
  /** Milliseconds, or a function read at each departure. */
  closeDelay: number | (() => number);
  isOpen: () => boolean;
  open: (value: string) => void;
  close: () => void;
}

export interface HoverIntentHandle {
  /** The pointer entered a trigger. */
  enter: (value: string, pointerType: string) => void;
  /** The pointer left the root. */
  leave: () => void;
  /** The pointer is back inside the root, or the surface. */
  stay: () => void;
  destroy: () => void;
}

/**
 * A pointer resting on a trigger opens it after `openDelay`; with a section
 * already open, another trigger takes over at once, because the reader is
 * reading across the row rather than crossing it. Leaving the root closes
 * after `closeDelay`, cancelled by a return. A touch is a press and never a
 * hover: a tap that opened on `pointerenter` would close on the `click` that
 * follows it.
 */
export function createHoverIntent(options: HoverIntentOptions): HoverIntentHandle {
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const read = (delay: number | (() => number)) => (typeof delay === 'function' ? delay() : delay);

  const clear = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openTimer = closeTimer = undefined;
  };

  return {
    enter(value, pointerType) {
      if (pointerType === 'touch') return;
      clear();
      if (options.isOpen()) {
        options.open(value);
        return;
      }
      openTimer = setTimeout(() => options.open(value), read(options.openDelay));
    },
    leave() {
      clearTimeout(openTimer);
      openTimer = undefined;
      if (!options.isOpen()) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(options.close, read(options.closeDelay));
    },
    stay() {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    },
    destroy: clear,
  };
}

const FOCUSABLE =
  'a[href]:not([data-disabled]), button:not(:disabled), [tabindex]:not([tabindex="-1"])';

function topLevel(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      ':scope > [data-part="list"] > [data-part="item"] > :is([data-part="trigger"], [data-part="link"])',
    ),
  ].filter(
    (control) => !(control as HTMLButtonElement).disabled && !control.hasAttribute('data-disabled'),
  );
}

function inside(content: HTMLElement): HTMLElement[] {
  return [...content.querySelectorAll<HTMLElement>(FOCUSABLE)];
}

export interface FocusOptions {
  orientation: NavigationMenuOrientation;
  dir: 'ltr' | 'rtl';
}

/**
 * Where an arrow key, `Home` or `End` sends focus — the disclosure example's
 * optional keys — or `null` when the key is not the family's. The keys are a
 * shortcut over the tab sequence: nothing changes `tabindex`, and an arrow on
 * a closed trigger moves along the row rather than opening it.
 */
export function focusTarget(
  root: HTMLElement,
  active: HTMLElement,
  key: string,
  options: FocusOptions,
): HTMLElement | null {
  const row = topLevel(root);
  const index = row.indexOf(active);
  const vertical = options.orientation === 'vertical';
  const rtl = options.dir === 'rtl';
  const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
  const previousKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  const enterKey = vertical ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';

  if (index !== -1) {
    if (key === nextKey) return row[(index + 1) % row.length] ?? null;
    if (key === previousKey) return row[(index - 1 + row.length) % row.length] ?? null;
    if (key === 'Home') return row[0] ?? null;
    if (key === 'End') return row[row.length - 1] ?? null;
    if (key === enterKey && active.getAttribute('aria-expanded') === 'true') {
      const content = active.parentElement?.querySelector<HTMLElement>(
        ':scope > [data-part="content"]',
      );
      return content ? (inside(content)[0] ?? null) : null;
    }
    return null;
  }

  const content = active.closest<HTMLElement>('[data-part="content"]');
  if (!content || content.closest('[data-ui="navigation-menu"]') !== root) return null;
  const links = inside(content);
  const at = links.indexOf(active);
  if (key === 'ArrowDown') return links[at + 1] ?? null;
  if (key === 'ArrowUp') {
    if (at > 0) return links[at - 1] ?? null;
    return (
      content.parentElement?.querySelector<HTMLElement>(':scope > [data-part="trigger"]') ?? null
    );
  }
  if (key === 'Home') return links[0] ?? null;
  if (key === 'End') return links[links.length - 1] ?? null;
  return null;
}
