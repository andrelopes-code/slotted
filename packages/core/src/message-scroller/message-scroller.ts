/**
 * The scroll behavior of a conversation, with no framework in it.
 *
 * A conversation is read from the bottom and grows at the bottom, while the
 * reader may be anywhere in it. The engine answers five questions and nothing
 * else: where a saved conversation opens, whether new words pull the view with
 * them, where a turn the reader just started stands, how older rows arrive
 * above without moving what the reader is looking at, and how to take the
 * reader to one row. The messages, their transport and their order are the
 * application's.
 *
 * The hot path stays out of the frameworks. The engine writes its runtime
 * attributes — `data-scrollable`, `data-following`, `data-pending` — on the
 * root and the viewport, and the room an anchored turn needs below it as
 * `--slotted-message-scroller-room` on the content, itself. A binding
 * re-renders only what reads `getState()`: the jump control and its count.
 *
 * Native scroll anchoring is off (`overflow-anchor: none` in the stylesheet).
 * Safari has none, and in Chrome a native correction added to the engine's own
 * moves the reader twice. The engine keeps the first row the reader can see
 * where it was, on every insertion above it and every size change above it.
 */

export type MessageScrollerPosition = 'start' | 'end' | 'last-anchor';
export type MessageScrollerAlign = 'start' | 'center' | 'end' | 'nearest';

export interface MessageScrollerEdges {
  /** The viewport can still scroll toward the first row. */
  start: boolean;
  /** The viewport can still scroll toward the last row. */
  end: boolean;
}

export interface MessageScrollerOptions {
  /** Follow new content while the reader is at the live edge. */
  follow?: boolean | undefined;
  /** Where the conversation opens, applied once, on the first render with rows. */
  defaultPosition?: MessageScrollerPosition | undefined;
  /** Pixels from an edge that still count as being at it. */
  edgeThreshold?: number | undefined;
  /** Pixels kept above a row the engine scrolls to. */
  scrollMargin?: number | undefined;
  /** Pixels of the previous row kept in view above a newly anchored turn. */
  peek?: number | undefined;
  /** Keep the reader's row in place when older rows arrive above it. */
  preserveOnPrepend?: boolean | undefined;
  onScrollableChange?: ((edges: MessageScrollerEdges) => void) | undefined;
  onAnchorChange?: ((id: string | null, reason: 'scroll' | 'programmatic') => void) | undefined;
  onReachStart?: ((reason: 'scroll') => void) | undefined;
  /** How long a row a jump landed on carries `data-current`, in milliseconds. */
  highlightDuration?: number | undefined;
}

export interface MessageScrollerState {
  scrollable: MessageScrollerEdges;
  following: boolean;
  pending: boolean;
  /** Rows with a message id that arrived while the last row was out of view. */
  newCount: number;
  currentAnchorId: string | null;
}

export interface ScrollCommandOptions {
  behavior?: ScrollBehavior;
}

export interface ScrollToMessageOptions extends ScrollCommandOptions {
  align?: MessageScrollerAlign;
  /** Mark the landed row with `data-current` for a moment. */
  highlight?: boolean;
  scrollMargin?: number;
}

export interface MessageScrollerParts {
  root?: HTMLElement | null;
  viewport: HTMLElement;
  content: HTMLElement;
}

export interface MessageScrollerHandle {
  connect: (parts: MessageScrollerParts) => () => void;
  update: (options: MessageScrollerOptions) => void;
  scrollToMessage: (id: string, options?: ScrollToMessageOptions) => boolean;
  scrollToEnd: (options?: ScrollCommandOptions) => boolean;
  scrollToStart: (options?: ScrollCommandOptions) => boolean;
  getState: () => MessageScrollerState;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

export const ROOM_PROPERTY = '--slotted-message-scroller-room';
export const ITEM_SELECTOR = ':scope > [data-part="item"]';

const DEFAULTS = {
  follow: false,
  defaultPosition: 'last-anchor' as MessageScrollerPosition,
  edgeThreshold: 8,
  scrollMargin: 0,
  peek: 64,
  preserveOnPrepend: true,
  highlightDuration: 1600,
};

/** Keys that scroll a focused scroll region natively. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Spacebar',
]);

/** How long after a gesture a scroll is still the reader's. */
const INTENT_WINDOW = 300;
/** The longest a smooth scroll the engine started is waited for without `scrollend`. */
const PROGRAMMATIC_WINDOW = 1000;

export function items(content: HTMLElement): HTMLElement[] {
  return [...content.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];
}

function isAnchor(item: HTMLElement): boolean {
  const value = item.getAttribute('data-anchor');
  return value !== null && value !== 'false';
}

/**
 * A row's top edge, in pixels from the top of the viewport's scroll area.
 *
 * Read from the layout offset when the viewport is the row's offset parent —
 * the stylesheet positions it — because a rectangle includes the `translate`
 * a row arrives with, and an anchored turn measured mid-entrance stood eight
 * pixels short of its line. Rectangles are the fallback outside a layout.
 */
export function offsetIn(viewport: HTMLElement, element: HTMLElement): number {
  if (element.offsetParent === viewport) return element.offsetTop;
  return (
    element.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop
  );
}

/** Whether the reader asked for less motion; a smooth scroll becomes an instant one. */
export function resolveBehavior(
  behavior: ScrollBehavior | undefined,
  view: Window | null,
): ScrollBehavior {
  const wanted = behavior ?? 'auto';
  if (wanted !== 'smooth' || view === null || typeof view.matchMedia !== 'function') return wanted;
  return view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function sameEdges(a: MessageScrollerEdges, b: MessageScrollerEdges): boolean {
  return a.start === b.start && a.end === b.end;
}

export function createMessageScroller(initial: MessageScrollerOptions = {}): MessageScrollerHandle {
  type Resolved = typeof DEFAULTS &
    Pick<MessageScrollerOptions, 'onScrollableChange' | 'onAnchorChange' | 'onReachStart'>;
  let options: Resolved = { ...DEFAULTS, ...stripUndefined(initial) } as Resolved;
  let state: MessageScrollerState = {
    scrollable: { start: false, end: false },
    following: false,
    pending: options.defaultPosition !== 'start',
    newCount: 0,
    currentAnchorId: null,
  };
  const listeners = new Set<() => void>();

  let parts: MessageScrollerParts | null = null;
  let view: Window | null = null;
  let room = 0;
  /** The turn whose room below is kept until its reply fills it. */
  let activeAnchor: HTMLElement | null = null;
  /** Whether the engine still holds that turn at its line; the reader's first scroll lets it go. */
  let holding = false;
  let holdTarget = 0;
  let reference: { element: HTMLElement; top: number } | null = null;
  let known = new Set<HTMLElement>();
  let intentUntil = 0;
  let programmatic = false;
  let programmaticTimer = 0;
  let queuedTarget: { id: string; options: ScrollToMessageOptions } | null = null;
  let frame = 0;
  let atStartBefore = true;
  let opened = false;
  const highlightTimers = new Map<HTMLElement, number>();
  const cleanups: Array<() => void> = [];

  const set = (patch: Partial<MessageScrollerState>) => {
    const next = { ...state, ...patch };
    const changed =
      !sameEdges(next.scrollable, state.scrollable) ||
      next.following !== state.following ||
      next.pending !== state.pending ||
      next.newCount !== state.newCount ||
      next.currentAnchorId !== state.currentAnchorId;
    const edgesChanged = !sameEdges(next.scrollable, state.scrollable);
    state = next;
    if (!changed) return;
    writeAttributes();
    if (edgesChanged) options.onScrollableChange?.(state.scrollable);
    for (const listener of listeners) listener();
  };

  function writeAttributes() {
    if (parts === null) return;
    const edges = [state.scrollable.start ? 'start' : '', state.scrollable.end ? 'end' : '']
      .filter(Boolean)
      .join(' ');
    for (const element of [parts.root, parts.viewport]) {
      if (!element) continue;
      if (edges) element.setAttribute('data-scrollable', edges);
      else element.removeAttribute('data-scrollable');
      element.toggleAttribute('data-pending', state.pending);
    }
    parts.root?.toggleAttribute('data-following', state.following);
  }

  function writeRoom(next: number) {
    room = Math.max(0, Math.round(next));
    parts?.content.style.setProperty(ROOM_PROPERTY, `${room}px`);
  }

  /** The largest scroll offset that shows content rather than the room kept below it. */
  function endOffset(): number {
    if (parts === null) return 0;
    const { viewport } = parts;
    return Math.max(0, viewport.scrollHeight - room - viewport.clientHeight);
  }

  function measureEdges(): MessageScrollerEdges {
    if (parts === null) return { start: false, end: false };
    const top = parts.viewport.scrollTop;
    return {
      start: top > options.edgeThreshold,
      end: endOffset() - top > options.edgeThreshold,
    };
  }

  /**
   * The reader's row: the first row with a message id whose foot is below the
   * top of the viewport. A row without an id — a day that sticks to the top —
   * stands still while the rows move under it and would be a false witness.
   */
  function takeReference() {
    if (parts === null) return;
    const { viewport, content } = parts;
    const scrollTop = viewport.scrollTop;
    for (const item of items(content)) {
      if (!item.hasAttribute('data-message-id')) continue;
      const top = offsetIn(viewport, item);
      if (
        top + item.offsetHeight > scrollTop + 1 ||
        (item.offsetHeight === 0 && top + item.getBoundingClientRect().height > scrollTop + 1)
      ) {
        reference = { element: item, top: top - scrollTop };
        return;
      }
    }
    reference = null;
  }

  function restoreReference() {
    if (parts === null || reference === null || !reference.element.isConnected) return;
    const { viewport } = parts;
    const now = offsetIn(viewport, reference.element) - viewport.scrollTop;
    const delta = now - reference.top;
    if (Math.abs(delta) < 0.5) return;
    move(viewport.scrollTop + delta, 'auto');
    reference = { element: reference.element, top: reference.top };
  }

  function move(top: number, behavior: ScrollBehavior) {
    if (parts === null) return;
    const { viewport } = parts;
    programmatic = true;
    window.clearTimeout(programmaticTimer);
    const target = Math.max(0, top);
    if (behavior === 'smooth' && typeof viewport.scrollTo === 'function') {
      viewport.scrollTo({ top: target, behavior });
      programmaticTimer = window.setTimeout(endProgrammatic, PROGRAMMATIC_WINDOW);
    } else {
      viewport.scrollTop = target;
      programmaticTimer = window.setTimeout(endProgrammatic, 0);
    }
  }

  function endProgrammatic() {
    programmatic = false;
    takeReference();
    set({ scrollable: measureEdges() });
  }

  function stickToEnd(behavior: ScrollBehavior = 'auto') {
    move(endOffset(), behavior);
    set({ scrollable: { start: endOffset() > options.edgeThreshold, end: false }, newCount: 0 });
  }

  /** The room below `anchor` that lets it stand at the top of the viewport. */
  function roomFor(anchor: HTMLElement): number {
    if (parts === null) return 0;
    const { viewport, content } = parts;
    const below = content.scrollHeight - room - offsetIn(viewport, anchor);
    const wanted = viewport.clientHeight - options.scrollMargin - options.peek;
    return Math.max(0, wanted - below);
  }

  function anchorTo(anchor: HTMLElement, behavior: ScrollBehavior) {
    if (parts === null) return;
    activeAnchor = anchor;
    holding = true;
    writeRoom(roomFor(anchor));
    const top = offsetIn(parts.viewport, anchor) - options.scrollMargin - options.peek;
    holdTarget = top;
    move(top, behavior);
    /* The row the reader will be on when the scroll ends, so a row that arrives mid-scroll is corrected against it rather than against where the reader was. */
    reference = { element: anchor, top: options.scrollMargin + options.peek };
    set({ following: false, newCount: 0 });
  }

  function lastAnchor(): HTMLElement | null {
    if (parts === null) return null;
    const anchors = items(parts.content).filter(isAnchor);
    return anchors.at(-1) ?? null;
  }

  function applyOpening() {
    if (parts === null || opened) return;
    const list = items(parts.content);
    /* Nothing to position: the content shows, and the first rows to arrive still open it. */
    if (list.length === 0) {
      set({ pending: false });
      return;
    }
    opened = true;
    known = new Set(list);
    const { viewport, content } = parts;
    if (options.defaultPosition === 'start') {
      move(0, 'auto');
    } else if (options.defaultPosition === 'end') {
      stickToEnd();
    } else {
      const anchor = lastAnchor();
      const fits =
        anchor === null ||
        content.scrollHeight - offsetIn(viewport, anchor) <=
          viewport.clientHeight - options.scrollMargin;
      if (fits) stickToEnd();
      else move(offsetIn(viewport, anchor as HTMLElement) - options.scrollMargin, 'auto');
    }
    const edges = measureEdges();
    atStartBefore = !edges.start;
    set({ pending: false, scrollable: edges, following: options.follow && !edges.end });
    takeReference();
    if (queuedTarget !== null) {
      const { id, options: queued } = queuedTarget;
      queuedTarget = null;
      handle.scrollToMessage(id, queued);
    }
  }

  function onMutation() {
    if (parts === null) return;
    if (!opened) {
      applyOpening();
      return;
    }
    const before = [...known];
    const list = items(parts.content);
    known = new Set(list);
    if (activeAnchor !== null && !activeAnchor.isConnected) {
      activeAnchor = null;
      holding = false;
      writeRoom(0);
    }

    /*
     * Rows that arrived above the reader's row, or rows removed there, moved
     * it: put it back where it was. Rows that arrived below it moved nothing,
     * and the correction measures a zero.
     */
    if (!state.following && options.preserveOnPrepend) restoreReference();

    const previousLast = before.filter((item) => item.isConnected).at(-1);
    const from = previousLast === undefined ? 0 : list.indexOf(previousLast) + 1;
    const appended = list.slice(from).filter((item) => !before.includes(item));
    const anchor = [...appended].reverse().find(isAnchor);

    if (anchor !== undefined) {
      anchorTo(anchor, resolveBehavior('smooth', view));
    } else if (state.following) {
      /* At the live edge every change keeps the edge: rows below, rows above, rows removed. */
      stickToEnd();
    } else if (appended.length > 0) {
      const edges = measureEdges();
      const counted = appended.filter((item) => item.hasAttribute('data-message-id')).length;
      set({ scrollable: edges, newCount: edges.end ? state.newCount + counted : 0 });
    }
    set({ scrollable: measureEdges() });
  }

  function onResize() {
    if (parts === null || !opened) return;
    if (activeAnchor !== null) {
      writeRoom(roomFor(activeAnchor));
      /*
       * A row above the held turn can still be growing — an earlier reply
       * still streaming — and the turn stays where it was put. The target is
       * moved only when it changed, so a reply growing below does not cut the
       * smooth scroll that is bringing the turn up.
       */
      if (holding) {
        const target = offsetIn(parts.viewport, activeAnchor) - options.scrollMargin - options.peek;
        if (Math.abs(target - holdTarget) > 0.5) {
          holdTarget = target;
          move(target, 'auto');
        }
      }
      if (room === 0) {
        activeAnchor = null;
        holding = false;
        if (options.follow && !measureEdges().end) set({ following: true });
      }
    } else if (state.following) {
      stickToEnd();
    } else if (options.preserveOnPrepend) {
      restoreReference();
    }
    set({ scrollable: measureEdges() });
  }

  function trackAnchor(reason: 'scroll' | 'programmatic') {
    if (parts === null) return;
    const { viewport, content } = parts;
    const line = viewport.getBoundingClientRect().top + options.scrollMargin + 1;
    let current: string | null = null;
    for (const item of items(content)) {
      if (!isAnchor(item)) continue;
      if (item.getBoundingClientRect().top <= line) current = item.getAttribute('data-message-id');
      else break;
    }
    if (current === state.currentAnchorId) return;
    set({ currentAnchorId: current });
    options.onAnchorChange?.(current, reason);
  }

  function onScroll() {
    if (parts === null) return;
    const edges = measureEdges();
    const reader = !programmatic && Date.now() < intentUntil;
    const patch: Partial<MessageScrollerState> = { scrollable: edges };
    if (reader) {
      holding = false;
      patch.following = options.follow && !edges.end;
    }
    if (!edges.end) patch.newCount = 0;
    set(patch);
    if (!programmatic) takeReference();
    const atStart = !edges.start;
    if (atStart && !atStartBefore && reader) options.onReachStart?.('scroll');
    atStartBefore = atStart;
    if (options.onAnchorChange !== undefined && frame === 0 && view !== null) {
      const reason = programmatic ? 'programmatic' : 'scroll';
      frame = view.requestAnimationFrame(() => {
        frame = 0;
        trackAnchor(reason);
      });
    }
  }

  function markIntent() {
    intentUntil = Date.now() + INTENT_WINDOW;
    if (programmatic) {
      programmatic = false;
      window.clearTimeout(programmaticTimer);
    }
  }

  function onKey(event: KeyboardEvent) {
    if (SCROLL_KEYS.has(event.key)) markIntent();
  }

  function onSelection() {
    if (parts === null) return;
    const selection = parts.viewport.ownerDocument.getSelection();
    if (selection === null || selection.isCollapsed) return;
    const node = selection.anchorNode;
    if (node !== null && parts.content.contains(node) && state.following) {
      set({ following: false });
    }
  }

  const handle: MessageScrollerHandle = {
    connect(next) {
      handle.destroy();
      parts = next;
      view = next.viewport.ownerDocument.defaultView;
      const { viewport, content } = next;
      writeRoom(0);
      writeAttributes();

      const listen = <K extends keyof HTMLElementEventMap>(
        target: EventTarget,
        type: K | string,
        fn: EventListener,
        passive = true,
      ) => {
        target.addEventListener(type, fn, { passive });
        cleanups.push(() => target.removeEventListener(type, fn));
      };
      listen(viewport, 'scroll', onScroll as EventListener);
      listen(viewport, 'scrollend', (() => {
        if (programmatic) endProgrammatic();
      }) as EventListener);
      listen(viewport, 'wheel', markIntent as EventListener);
      listen(viewport, 'touchmove', markIntent as EventListener);
      listen(viewport, 'pointerdown', markIntent as EventListener);
      listen(viewport, 'keydown', onKey as EventListener);
      listen(viewport.ownerDocument, 'selectionchange', onSelection as EventListener);

      if (typeof MutationObserver !== 'undefined') {
        const mutations = new MutationObserver(onMutation);
        mutations.observe(content, { childList: true });
        cleanups.push(() => mutations.disconnect());
      }
      if (typeof ResizeObserver !== 'undefined') {
        const sizes = new ResizeObserver(onResize);
        sizes.observe(content);
        sizes.observe(viewport);
        cleanups.push(() => sizes.disconnect());
      }
      opened = false;
      applyOpening();
      return () => handle.destroy();
    },

    update(next) {
      const previous = options.defaultPosition;
      options = { ...options, ...stripUndefined(next) } as Resolved;
      if (
        parts !== null &&
        next.defaultPosition !== undefined &&
        next.defaultPosition !== previous
      ) {
        opened = false;
        applyOpening();
      }
      if (next.follow !== undefined) set({ following: options.follow && !measureEdges().end });
    },

    scrollToMessage(id, commandOptions = {}) {
      if (parts === null) {
        queuedTarget = { id, options: commandOptions };
        return true;
      }
      const list = items(parts.content);
      const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
      const target = parts.content.querySelector<HTMLElement>(
        `:scope > [data-part="item"][data-message-id="${escaped}"]`,
      );
      if (target === null) {
        if (list.length === 0) {
          queuedTarget = { id, options: commandOptions };
          return true;
        }
        return false;
      }
      const { viewport } = parts;
      const margin = commandOptions.scrollMargin ?? options.scrollMargin;
      const top = offsetIn(viewport, target);
      const height = target.getBoundingClientRect().height;
      const align = commandOptions.align ?? 'start';
      let destination = top - margin;
      if (align === 'end') destination = top + height - viewport.clientHeight + margin;
      if (align === 'center') destination = top + height / 2 - viewport.clientHeight / 2;
      if (align === 'nearest') {
        const current = viewport.scrollTop;
        if (top - margin >= current && top + height + margin <= current + viewport.clientHeight) {
          destination = current;
        } else if (top - margin < current) {
          destination = top - margin;
        } else {
          destination = top + height - viewport.clientHeight + margin;
        }
      }
      activeAnchor = null;
      holding = false;
      writeRoom(0);
      const landed = Math.max(0, Math.min(destination, endOffset()));
      move(landed, resolveBehavior(commandOptions.behavior, view));
      reference = { element: target, top: top - landed };
      set({ following: false });
      if (commandOptions.highlight) {
        window.clearTimeout(highlightTimers.get(target));
        target.setAttribute('data-current', '');
        highlightTimers.set(
          target,
          window.setTimeout(() => {
            target.removeAttribute('data-current');
            highlightTimers.delete(target);
          }, options.highlightDuration),
        );
      }
      if (options.onAnchorChange !== undefined) {
        const anchorId = isAnchor(target) ? target.getAttribute('data-message-id') : null;
        if (anchorId !== null && anchorId !== state.currentAnchorId) {
          set({ currentAnchorId: anchorId });
          options.onAnchorChange(anchorId, 'programmatic');
        }
      }
      return true;
    },

    scrollToEnd(commandOptions = {}) {
      if (parts === null) return false;
      activeAnchor = null;
      holding = false;
      writeRoom(0);
      stickToEnd(resolveBehavior(commandOptions.behavior, view));
      set({ following: options.follow });
      return true;
    },

    scrollToStart(commandOptions = {}) {
      if (parts === null) return false;
      move(0, resolveBehavior(commandOptions.behavior, view));
      set({ following: false });
      return true;
    },

    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      for (const cleanup of cleanups.splice(0)) cleanup();
      for (const timer of highlightTimers.values()) window.clearTimeout(timer);
      highlightTimers.clear();
      window.clearTimeout(programmaticTimer);
      if (frame !== 0 && view !== null) view.cancelAnimationFrame(frame);
      frame = 0;
      parts = null;
    },
  };

  return handle;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}
