/**
 * Keeping a node in the document long enough for it to leave.
 *
 * A layer that closes has two lives: the one the consumer models, where it is
 * simply gone, and the one the reader sees, where it fades for two hundred
 * milliseconds first. Every library that animates an overlay has to reconcile
 * those, and every one of them does it the same way — hold the node mounted
 * until the exit animation says it is finished.
 *
 * The difference here is what happens when the animation never says so. The
 * CSS Animations and CSS Transitions specifications only guarantee `animationend`
 * while the document can actually run the animation; a `display: none`
 * ancestor, a stylesheet that was swapped out, or a backgrounded tab withholds
 * it indefinitely. Radix, Zag and Base UI all wait on that event alone, and a
 * node caught by any of those three cases stays in the document for the life of
 * the page. Here the declared duration is read from the node and a timer at that
 * length is the floor: the event is the fast path, not the only path.
 *
 * Nothing here writes to the DOM. The status is reported and the family turns it
 * into the attributes its own contract declares, because the DOM state
 * vocabulary belongs to `specs/contract.schema.mjs` and a second one invented
 * in `packages/core` would be a vocabulary nobody declared.
 */

import { createControllable } from '../state';
import type { ChangeReason, ChangeRequest } from '../state';

/**
 * `entering` is one frame long, and it is the whole reason the status is not a
 * boolean: a node that mounts already open gives a CSS transition no closed
 * style to start from.
 */
export type PresenceStatus = 'unmounted' | 'entering' | 'open' | 'exiting';

/** Milliseconds allowed past the declared duration before an exit is completed anyway. */
export const DEFAULT_EXIT_GRACE = 50;

/**
 * Frames `entering` waits for the family to hand over its node before opening
 * without one. A family that registers no node is not animating this presence,
 * and holding it in `entering` for longer only delays a layer nobody will fade.
 */
export const ENTERING_FRAME_LIMIT = 3;

export interface PresenceOptions {
  /** The consumer's value. Present at all puts presence in controlled mode. */
  present?: boolean | undefined;
  /** The value an uncontrolled presence starts from, read once. */
  initialPresent?: boolean;
  /** Reports `mounted` in every status. For measurement, SSR, and a consumer animating for itself. */
  forceMount?: boolean;
  /** Never waits for an exit. A route change must not be held by a transition. */
  immediate?: boolean;
  /** A layer already present on the first mount does not animate in. */
  skipInitialAnimation?: boolean;
  /** Milliseconds past the declared duration before the exit completes without its event. */
  exitGrace?: number;
  /** Defaults to the reader's own `prefers-reduced-motion`, asked at each transition. */
  reducedMotion?: () => boolean;
  /** Called before presence moves, and able to cancel it. */
  onRequest?: (request: ChangeRequest<boolean>) => void;
  onStatusChange?: (status: PresenceStatus, previous: PresenceStatus) => void;
  /** Fires for an exit that finished. An exit interrupted by a re-open never fires it. */
  onExitComplete?: () => void;
  /**
   * Fires for an entrance that finished: the node's declared transition after
   * `open`, or at once when it declares none. An entrance interrupted by a
   * close never fires it, and a layer present on the first mount with
   * `skipInitialAnimation` fires it on the first node it is handed.
   */
  onEnterComplete?: () => void;
}

export interface PresenceHandle {
  /** What the consumer asked for. */
  readonly present: boolean;
  /** Whether the node belongs in the document. */
  readonly mounted: boolean;
  readonly status: PresenceStatus;
  /** The rendered node, which is not the same node across a re-render. */
  setNode: (node: HTMLElement | null) => void;
  request: (next: boolean, reason: ChangeReason, source?: unknown) => boolean;
  /** The consumer's new value, in controlled mode. */
  sync: (present: boolean | undefined) => void;
  /** Ends a running exit now. */
  finish: () => void;
  /**
   * Cancels the pending frame, timer and listeners, and drops the node, and the
   * handle stays usable: a later `setNode`, `sync` or `request` resumes it, and
   * an `entering` frame the call cancelled runs again. React's StrictMode
   * unmounts and mounts a component again on the same handle in development,
   * so a handle a React component holds across renders is stopped, not
   * destroyed, when the component unmounts.
   */
  stop: () => void;
  /** `stop`, final: every later call is ignored and no status is reported. */
  destroy: () => void;
}

const EXIT_EVENTS = ['animationend', 'animationcancel', 'transitionend', 'transitioncancel'];

/** `200ms` and `.2s` are the same length written two ways; anything else is none. */
function milliseconds(value: string): number {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  return value.trim().endsWith('ms') ? amount : amount * 1000;
}

function list(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(milliseconds);
}

/**
 * How long the node says it will take to leave.
 *
 * `animation-duration` and `animation-delay` are two lists that pair up by
 * position, and the shorter one repeats — the same rule CSS uses to match any
 * two comma-separated lists. A negative delay starts the animation partway
 * through, so it shortens the wait and never lengthens it.
 */
function declaredDuration(node: HTMLElement): number {
  const style = node.ownerDocument.defaultView?.getComputedStyle(node);
  if (!style) return 0;

  const totals = [
    ...pair(style.animationDuration, style.animationDelay),
    ...pair(style.transitionDuration, style.transitionDelay),
  ];
  return totals.length === 0 ? 0 : Math.max(...totals);
}

function pair(durations: string, delays: string): number[] {
  const lengths = list(durations);
  const offsets = list(delays);
  if (lengths.length === 0) return [];
  return lengths.map((length, index) =>
    Math.max(0, length + (offsets.length === 0 ? 0 : (offsets[index % offsets.length] ?? 0))),
  );
}

export function createPresence(options: PresenceOptions = {}): PresenceHandle {
  const {
    forceMount = false,
    immediate = false,
    skipInitialAnimation = true,
    exitGrace = DEFAULT_EXIT_GRACE,
  } = options;

  let node: HTMLElement | null = null;
  let stopped = false;
  let destroyed = false;
  let cancelFrame: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let listening: HTMLElement | null = null;

  const state = createControllable<boolean>({
    controlled: options.present,
    initial: options.initialPresent ?? options.present ?? false,
    ...(options.onRequest ? { onRequest: options.onRequest } : {}),
  });

  let applied = state.value;
  let status: PresenceStatus = !applied ? 'unmounted' : skipInitialAnimation ? 'open' : 'entering';
  /* A layer that skipped its entrance has entered once it has a node. */
  let enteredWithoutNode = status === 'open';

  if (status === 'entering') enter();

  function reducedMotion(): boolean {
    if (options.reducedMotion) return options.reducedMotion();
    const view = node?.ownerDocument.defaultView ?? (globalThis as { matchMedia?: unknown });
    const query = (view as Window).matchMedia;
    if (typeof query !== 'function') return false;
    return query.call(view, '(prefers-reduced-motion: reduce)').matches;
  }

  function view(): Window | null {
    return node?.ownerDocument.defaultView ?? (globalThis as unknown as Window) ?? null;
  }

  /**
   * The next frame, or the next task where there are no frames. A server and a
   * test runner without a visual document both take the second path, and both
   * need the transition to land rather than to be skipped.
   */
  function scheduleFrame(callback: () => void) {
    clearFrame();
    const window = view();
    if (window && typeof window.requestAnimationFrame === 'function') {
      const id = window.requestAnimationFrame(() => {
        cancelFrame = null;
        callback();
      });
      cancelFrame = () => window.cancelAnimationFrame(id);
      return;
    }
    const id = setTimeout(() => {
      cancelFrame = null;
      callback();
    }, 0);
    cancelFrame = () => clearTimeout(id);
  }

  function clearFrame() {
    cancelFrame?.();
    cancelFrame = null;
  }

  /**
   * The frame `entering` exists for, and the guarantee it makes: the node has
   * been in the document in its closed style before `open` is reported.
   *
   * A frame alone did not make it. The framework renders `entering` on its own
   * schedule, and `requestAnimationFrame` runs before the browser computes
   * style for that render — so `open` landed in the same style update as the
   * mount, the transition had no closed style to start from, and a dialog
   * appeared at full opacity. Two things fix that: the wait continues until
   * the family has registered the node it rendered, and that node's style is
   * read, which makes the browser compute the closed style now rather than
   * fold it into the open one.
   */
  function enter() {
    let waited = 0;
    const step = () => {
      if (status !== 'entering') return;
      const current = node;
      if (!current && waited < ENTERING_FRAME_LIMIT) {
        waited += 1;
        scheduleFrame(step);
        return;
      }
      if (current) closedStyle(current);
      setStatus('open');
      waitForEnter();
    };
    scheduleFrame(step);
  }

  /** The entrance's end, measured as the exit's is: the event, or the declared duration. */
  function waitForEnter() {
    scheduleFrame(() => {
      if (status !== 'open') return;
      const current = node;
      const duration = current ? declaredDuration(current) : 0;
      if (!current || duration <= 0) return enterComplete();
      listening = current;
      for (const event of EXIT_EVENTS) current.addEventListener(event, handleEnterEvent);
      timer = setTimeout(enterComplete, duration + exitGrace);
    });
  }

  function handleEnterEvent(event: Event) {
    if (event.target !== listening) return;
    enterComplete();
  }

  function enterComplete() {
    if (status !== 'open') return;
    stopWaiting();
    options.onEnterComplete?.();
  }

  /** Reading one computed value is what makes the browser compute them all. */
  function closedStyle(target: HTMLElement): string | undefined {
    return target.ownerDocument.defaultView?.getComputedStyle(target).opacity;
  }

  function setStatus(next: PresenceStatus) {
    if (stopped || destroyed || next === status) return;
    const previous = status;
    status = next;
    options.onStatusChange?.(next, previous);
  }

  function stopWaiting() {
    clearFrame();
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (listening) {
      for (const event of EXIT_EVENTS) {
        listening.removeEventListener(event, handleExitEvent);
        listening.removeEventListener(event, handleEnterEvent);
      }
      listening = null;
    }
  }

  /** An event that bubbled from a descendant is not this node's exit. */
  function handleExitEvent(event: Event) {
    if (event.target !== listening) return;
    complete();
  }

  function complete() {
    if (status !== 'exiting') return;
    stopWaiting();
    setStatus('unmounted');
    options.onExitComplete?.();
  }

  /**
   * Measured a frame after the status moved, which is when the family's own
   * attribute has landed and the exit is actually running. Reading it any
   * earlier reports the durations of the state being left.
   */
  function waitForExit() {
    scheduleFrame(() => {
      if (status !== 'exiting') return;
      const current = node;
      if (!current) return complete();

      const duration = declaredDuration(current);
      if (duration <= 0) return complete();

      listening = current;
      for (const event of EXIT_EVENTS) current.addEventListener(event, handleExitEvent);
      timer = setTimeout(complete, duration + exitGrace);
    });
  }

  /** The work `stop` cancelled, taken up again by the next call that reaches the handle. */
  function resume() {
    if (!stopped || destroyed) return;
    stopped = false;
    if (status === 'entering') enter();
    else if (status === 'exiting') waitForExit();
  }

  function settle() {
    if (state.value === applied) return;
    applied = state.value;
    stopWaiting();

    if (applied) {
      /* An interrupted exit returns to open: the node never left the document. */
      if (status === 'exiting') return setStatus('open');
      if (status !== 'unmounted') return;
      if (immediate) return setStatus('open');
      /* Reduced motion still takes the frame: the family keeps its opacity
         fade and drops only its transforms, which is R7's rule, not this
         module's. The exit below is what reduced motion cuts short. */
      setStatus('entering');
      enter();
      return;
    }

    if (status === 'unmounted') return;
    setStatus('exiting');
    if (immediate || reducedMotion() || !node) return complete();
    waitForExit();
  }

  return {
    get present() {
      return state.value;
    },
    get mounted() {
      return forceMount || status !== 'unmounted';
    },
    get status() {
      return status;
    },
    setNode(next) {
      if (next !== null) resume();
      if (next === node) return;
      node = next;
      if (node && enteredWithoutNode) {
        enteredWithoutNode = false;
        waitForEnter();
      }
      /* Mid-exit, the listeners move with it: a re-render is not a new exit.
         A `null` waits a frame, since a callback ref detaches before its successor attaches. */
      if (status === 'exiting') {
        stopWaiting();
        waitForExit();
      }
    },
    request(next, reason, source) {
      if (destroyed) return false;
      resume();
      const moved = state.request(next, reason, source);
      settle();
      return moved;
    },
    sync(present) {
      if (destroyed) return;
      resume();
      state.sync(present);
      settle();
    },
    finish() {
      complete();
    },
    stop() {
      stopWaiting();
      stopped = true;
      node = null;
    },
    destroy() {
      stopWaiting();
      stopped = true;
      destroyed = true;
      node = null;
    },
  };
}
