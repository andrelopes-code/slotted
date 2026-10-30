/**
 * A region given the whole screen, by the platform where the page may ask and
 * inside the page where it may not.
 *
 * Two ways, and the state never lies about which one answered:
 *
 * 1. `native` — the Fullscreen API. The region becomes the document's
 *    fullscreen element; the agent paints nothing else and owns `Escape`. The
 *    specification (§4, Living Standard of 17 July 2026) makes a close request
 *    leave full screen before any close watcher, so this module writes no
 *    `Escape` listener in this way at all: a listener could only fight it.
 * 2. `layout` — the region fixed over the viewport inside the page. Where the
 *    API is absent (a phone's browser, an iframe without `allow="fullscreen"`)
 *    or refuses (no transient activation, a permission policy), and where the
 *    consumer asked for it outright. The page's scroll is locked and `Escape`
 *    asks to leave through `dismissable-layer`, so a layer opened inside the
 *    region closes first.
 *
 * The controller does not own the boolean. A binding holds it, controlled or
 * not, and calls `enter` and `exit` to apply it; a leave the reader caused is
 * reported through `onExit` as a request, which the binding may refuse. What
 * the controller owns is the context it took: focus, the page's scroll and the
 * region's own scroll, put back on every way out.
 *
 * Nothing reads `document` at import time.
 */

import { createDismissableLayer, createScrollLock } from '../dismissable-layer';
import type { DismissableLayerHandle, ScrollLockHandle } from '../dismissable-layer';
import { createFocusScope } from '../focus';
import type { FocusScopeHandle } from '../focus';
import type { FamilyTranslator, FullscreenMessages } from '../i18n';
import { getLiveAnnouncer } from '../live-announcer';

/** Which way answered. */
export type FullscreenMode = 'native' | 'layout';

/** `auto` asks the platform first; `layout` never asks it. */
export type FullscreenPolicy = 'auto' | 'layout';

/** The agent's own navigation interface while in native full screen. */
export type FullscreenNavigationUI = 'auto' | 'show' | 'hide';

export interface FullscreenError {
  /** `unsupported`: the API is absent. `refused`: the agent rejected the request. */
  readonly kind: 'unsupported' | 'refused';
  readonly cause?: unknown;
}

export interface FullscreenOptions {
  policy?: FullscreenPolicy;
  navigationUI?: FullscreenNavigationUI;
  /**
   * The family's words in the binding's language: `entered` is announced on
   * entry and `exited` on the way out. Absent, nothing is announced.
   */
  t?: FamilyTranslator<FullscreenMessages>;
  /**
   * The reader left without the application asking: `Escape` in `layout`, or
   * the agent's own exit in `native`. The region has already left in `native`,
   * because the agent does not ask; in `layout` it stays until `exit` is called.
   */
  onExit?: (source?: Event) => void;
  /** The platform was absent or refused. The region is in `layout` by then. */
  onError?: (error: FullscreenError) => void;
  /** Every change of way, `null` when the region is not full screen. */
  onModeChange?: (mode: FullscreenMode | null) => void;
}

export interface EnterOptions {
  /**
   * `false` skips the platform for this entry. A binding whose consumer kept
   * the state after the agent left passes it: a new request outside a gesture
   * would only be refused.
   */
  native?: boolean;
}

export interface FullscreenController {
  /** The way that answered, or `null`. */
  readonly mode: FullscreenMode | null;
  /** Applies full screen. Resolves with the way that answered. */
  enter: (options?: EnterOptions) => Promise<FullscreenMode>;
  /** Leaves full screen and puts the context back. */
  exit: () => Promise<void>;
  /** Replaces the options; the current way is kept. */
  update: (options: FullscreenOptions) => void;
  /** Leaves full screen if the region is in it, and releases every listener. */
  destroy: () => void;
}

/* ── The platform, with the one prefix that still has an engine ─────────── */

type PrefixedDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type PrefixedElement = Element & {
  webkitRequestFullscreen?: (options?: FullscreenOptionsInit) => Promise<void> | void;
};

type FullscreenOptionsInit = { navigationUI?: FullscreenNavigationUI };

const CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

function currentDocument(doc?: Document): Document | undefined {
  return doc ?? (globalThis as { document?: Document }).document;
}

/** Whether the page may ask for native full screen. `false` on a server. */
export function fullscreenSupported(doc?: Document): boolean {
  const target = currentDocument(doc) as PrefixedDocument | undefined;
  if (!target) return false;
  return Boolean(target.fullscreenEnabled ?? target.webkitFullscreenEnabled ?? false);
}

/** The document's fullscreen element, prefixed or not. */
export function fullscreenElement(doc?: Document): Element | null {
  const target = currentDocument(doc) as PrefixedDocument | undefined;
  if (!target) return null;
  return target.fullscreenElement ?? target.webkitFullscreenElement ?? null;
}

/**
 * Whether the element holds the fullscreen flag. `:fullscreen` matches every
 * element in the document's stack, not only the topmost one, which is what a
 * region beneath a nested full screen is: still full screen, and back on top
 * when the inner one leaves.
 */
function isFullscreen(element: Element): boolean {
  try {
    if (element.matches(':fullscreen')) return true;
  } catch {
    /* An engine without the pseudo-class: the element the document names. */
  }
  return fullscreenElement(element.ownerDocument) === element;
}

async function requestNative(element: Element, navigationUI: FullscreenNavigationUI) {
  const prefixed = element as PrefixedElement;
  const options: FullscreenOptionsInit = { navigationUI };
  if (typeof element.requestFullscreen === 'function') {
    await element.requestFullscreen(options);
    return;
  }
  if (typeof prefixed.webkitRequestFullscreen === 'function') {
    await prefixed.webkitRequestFullscreen(options);
    return;
  }
  throw new TypeError('requestFullscreen is not available');
}

async function exitNative(doc: Document) {
  const prefixed = doc as PrefixedDocument;
  try {
    if (typeof doc.exitFullscreen === 'function') await doc.exitFullscreen();
    else if (typeof prefixed.webkitExitFullscreen === 'function')
      await prefixed.webkitExitFullscreen();
  } catch {
    /* The agent left on its own between the check and the call. */
  }
}

/* ── The context taken on entry ─────────────────────────────────────────── */

interface Context {
  focus: HTMLElement | null;
  pageX: number;
  pageY: number;
  top: number;
  left: number;
}

function takeContext(element: HTMLElement): Context {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  const active = doc.activeElement;
  return {
    focus: active instanceof HTMLElement && active !== doc.body ? active : null,
    pageX: view?.scrollX ?? 0,
    pageY: view?.scrollY ?? 0,
    top: element.scrollTop,
    left: element.scrollLeft,
  };
}

/**
 * Puts back what was taken. Focus moves when the way out left it on the body,
 * or when it came from outside the region — a reader who pressed the control
 * inside keeps focus on it, and moving it would read the control twice.
 */
function restoreContext(element: HTMLElement, context: Context) {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  element.scrollTop = context.top;
  element.scrollLeft = context.left;
  /* Only a page that moved is scrolled back; an unconditional call would
     cancel a smooth scroll the reader started on the way out. */
  if (view && (view.scrollX !== context.pageX || view.scrollY !== context.pageY)) {
    view.scrollTo(context.pageX, context.pageY);
  }
  const target = context.focus;
  if (!target?.isConnected) return;
  const active = doc.activeElement;
  const lost = active === null || active === doc.body || !element.contains(active);
  /* A control outside the region was covered while the region was full
     screen, and focus was held inside; it gets focus back either way. */
  if ((lost || !element.contains(target)) && active !== target) {
    target.focus({ preventScroll: true });
  }
}

/* ── The controller ────────────────────────────────────────────────────── */

export function createFullscreen(
  element: HTMLElement,
  initial: FullscreenOptions = {},
): FullscreenController {
  const doc = element.ownerDocument;
  let options = initial;
  let mode: FullscreenMode | null = null;
  let context: Context | null = null;
  /* Every entry and exit takes a new number; a native request that resolves
     after the region was asked to leave sees a stale number and leaves. */
  let generation = 0;
  let destroyed = false;
  /* Set while this module asks the agent to leave, so the change event that
     answers is not read as the reader leaving. */
  let leaving = false;

  let layer: DismissableLayerHandle | null = null;
  let lock: ScrollLockHandle | null = null;
  let scope: FocusScopeHandle | null = null;

  function setMode(next: FullscreenMode | null) {
    if (mode === next) return;
    mode = next;
    options.onModeChange?.(next);
  }

  function start(next: FullscreenMode) {
    /* Tab wraps inside the region in both ways: what is outside is not
       painted, and a focus on it would be a focus nobody can see. */
    scope = createFocusScope(element, { contain: true, initial: false, restore: false });
    if (next === 'layout') {
      lock = createScrollLock(doc);
      layer = createDismissableLayer(element, {
        escape: true,
        outsidePress: false,
        /* An ask: the binding decides, and calls `exit` if it agrees. */
        onDismiss: (request) => {
          if (request.reason === 'escape') options.onExit?.(request.source);
        },
      });
    }
    setMode(next);
    if (options.t) getLiveAnnouncer(doc).announce(options.t('entered'));
  }

  function stop(announce: boolean) {
    scope?.destroy();
    scope = null;
    layer?.destroy();
    layer = null;
    lock?.release();
    lock = null;
    const was = mode;
    setMode(null);
    if (context) restoreContext(element, context);
    context = null;
    if (was !== null && announce && options.t) getLiveAnnouncer(doc).announce(options.t('exited'));
  }

  /* The agent left: `Escape`, F11, its own interface, another page. */
  const onChange = (event: Event) => {
    if (leaving || mode !== 'native' || isFullscreen(element)) return;
    generation += 1;
    stop(true);
    options.onExit?.(event);
  };
  for (const type of CHANGE_EVENTS) doc.addEventListener(type, onChange);

  /* One entry at a time: a binding that asks inside the gesture and again
     from the render that follows gets the first request's answer, not a
     second request the agent would refuse. */
  let pending: Promise<FullscreenMode> | null = null;

  function enter(enterOptions: EnterOptions = {}): Promise<FullscreenMode> {
    if (mode !== null) return Promise.resolve(mode);
    if (pending) return pending;
    const attempt = enterOnce(enterOptions);
    pending = attempt;
    void attempt.then(() => {
      if (pending === attempt) pending = null;
    });
    return attempt;
  }

  async function enterOnce(enterOptions: EnterOptions): Promise<FullscreenMode> {
    if (destroyed) return 'layout';
    const ticket = ++generation;
    context = takeContext(element);

    const policy = options.policy ?? 'auto';
    if (policy === 'auto' && enterOptions.native !== false) {
      if (!fullscreenSupported(doc)) {
        options.onError?.({ kind: 'unsupported' });
      } else {
        try {
          await requestNative(element, options.navigationUI ?? 'auto');
          if (ticket !== generation || destroyed) {
            /* Asked to leave while the agent was deciding. */
            if (isFullscreen(element)) await exitNative(doc);
            return 'native';
          }
          start('native');
          return 'native';
        } catch (cause) {
          if (ticket !== generation || destroyed) return 'layout';
          options.onError?.({ kind: 'refused', cause });
        }
      }
    }

    start('layout');
    return 'layout';
  }

  async function exit() {
    generation += 1;
    if (mode === null) {
      context = null;
      return;
    }
    /* The agent restores its own scroll on the way out; ours goes after. */
    if (mode === 'native' && isFullscreen(element)) {
      leaving = true;
      try {
        await exitNative(doc);
      } finally {
        leaving = false;
      }
    }
    stop(true);
  }

  return {
    get mode() {
      return mode;
    },
    enter,
    exit,
    update(next) {
      options = next;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      generation += 1;
      for (const type of CHANGE_EVENTS) doc.removeEventListener(type, onChange);
      const was = mode;
      stop(false);
      if (was === 'native' && isFullscreen(element)) void exitNative(doc);
    },
  };
}
