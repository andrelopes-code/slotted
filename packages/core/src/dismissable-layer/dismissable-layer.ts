/**
 * Whether a layer should still be open, and what the page behind it may do
 * while it is.
 *
 * Three things decide that an overlay is over: Escape, a press somewhere else,
 * and focus leaving. Radix reports them as `onEscapeKeyDown`,
 * `onPointerDownOutside` and `onFocusOutside`, and every consumer then writes
 * the same function three times. Here there is one request carrying one reason
 * from the closed vocabulary of `docs/state-and-events.md`, which calls two
 * events for one transition "the same failure stated twice".
 *
 * The hard part is not any of the three. It is the word *outside*: a submenu is
 * outside its parent menu in the DOM — it was portalled to the end of the body
 * — and inside it in every sense that matters. Each layer therefore records the
 * layer that was topmost when it opened, and a press is inside a layer when it
 * lands on that layer, on a node the layer claims, or anywhere inside a layer
 * descended from it. That is what makes `docs/component-features.md` §3's rule
 * a mechanism instead of an intention.
 *
 * The module reports and never closes. The family owns its open state, so a
 * dismissal is a request it may refuse — and a layer that refuses stops the
 * request from reaching the layers underneath it, because a layer left standing
 * on an ancestor that closed is worse than one that would not close.
 *
 * Focus containment and restoration are not here. They are `focus`'s, and two
 * modules answering one question is the failure this file avoids elsewhere.
 */

import { afterLayout } from '../measure/after-layout';

/** The subset of the closed reason vocabulary a layer can be dismissed for. */
export type DismissReason = 'escape' | 'outsidePress' | 'blur' | 'back' | 'programmatic';

export interface DismissRequest {
  readonly reason: DismissReason;
  /** The event that caused it, where one exists. */
  readonly source?: Event | undefined;
  readonly cancelled: boolean;
  /** Refuses the dismissal. The layers below this one are not asked either. */
  cancel: () => void;
}

/** Whether a press lands outside. `true` for every press the layer does not own. */
export type OutsidePress = boolean | ((target: EventTarget | null, event: Event) => boolean);

export interface DismissableLayerOptions {
  /** Called once per dismissal, with the reason and the event behind it. */
  onDismiss: (request: DismissRequest) => void;
  /** Escape closes the topmost layer. Default `true`. */
  escape?: boolean;
  /** Default `true`. A predicate decides which outside presses count. */
  outsidePress?: OutsidePress;
  /** Which press decides. Default `pointerdown`. */
  outsidePressEvent?: 'pointerdown' | 'click';
  /** Focus leaving the layer dismisses it. Default `false`. */
  focusOutside?: boolean;
  /**
   * The platform's own way back — a phone's gesture, a browser's button —
   * dismisses the layer instead of leaving the page. Default `false`.
   *
   * Where the platform has `CloseWatcher`, the layer holds one watcher while
   * it stands, and its `close` is the gesture; the history is not touched.
   * The platform closes the newest watcher first, which is the topmost layer.
   * A watcher is ungrouped only when created after a press: a layer opened
   * without one shares the gesture with the layer opened before it.
   *
   * Elsewhere the layer holds one entry of the session history while it
   * stands: pushed when it opens, on the same URL and over the state that was
   * there, and taken back when it closes by any other path. A `popstate` that
   * leaves the entry is the gesture, and it reaches the topmost layer that
   * holds one; a layer that refuses puts its entry back. Nothing under the
   * layer sees the gesture, which is what a modal layer promises about
   * everything else.
   */
  back?: boolean;
  /** Everything outside the layer becomes `inert`. Default `false`. */
  modal?: boolean;
  /** Locks the document scroll. Defaults to whatever `modal` is. */
  scrollLock?: boolean;
  /** Nodes outside the layer that count as inside it — the trigger, first of all. */
  branches?: Iterable<Element>;
  /**
   * What a press is inside of, where that is less than the node. A dialog's
   * node is the whole frame — a scrim and a viewport around a panel — and the
   * frame is what carries the depth and the `inert` boundary; the panel is the
   * only part a press is *in*. Defaults to the node.
   */
  content?: Element;
}

export interface DismissableLayerHandle {
  /** Position in the document's stack, counting from zero. */
  readonly depth: number;
  readonly topmost: boolean;
  /** Claims a node as part of the layer. Returns the function that gives it back. */
  addBranch: (node: Element) => () => void;
  /** Dismisses from code, through the same request. */
  dismiss: (source?: Event) => void;
  /**
   * Puts the layer back on top of layers opened over it — a tour whose step
   * opened a dialog. It moves to the top of the stack and to the end of its
   * parent in the document, drops the `inert` a newer layer wrote on it or
   * its ancestors, writes its own again over them when it is modal, and takes
   * the layer that was topmost as its parent. The history entries keep their
   * order: the way back still reaches the newer layer first.
   */
  raise: () => void;
  destroy: () => void;
}

export interface ScrollLockHandle {
  release: () => void;
}

/**
 * The single stack, as a number a stylesheet can add to a token:
 * `z-index: calc(var(--slotted-z-index-popover) + var(--slotted-layer-depth))`.
 */
export const LAYER_DEPTH_PROPERTY = '--slotted-layer-depth';

interface Layer {
  node: HTMLElement;
  /** What a press is inside of: the node, or the part of it the consumer named. */
  content: Element;
  options: DismissableLayerOptions;
  /** The layer that was topmost when this one opened, or none. */
  parent: Layer | null;
  branches: Set<Element>;
  releaseInert: (() => void) | null;
  releaseScroll: (() => void) | null;
  /** The history entry the layer holds, under `back`, or none. */
  entry: HistoryEntry | null;
  /** The close watcher the layer holds, under `back` where the platform has one, or none. */
  watcher: CloseWatcherLike | null;
}

/** The platform's close watcher (Chromium). TypeScript's DOM library does not declare it yet. */
interface CloseWatcherLike {
  onclose: ((event: Event) => void) | null;
  destroy: () => void;
}

type CloseWatcherConstructor = new () => CloseWatcherLike;

interface HistoryEntry {
  /** What the entry's state carries under `ENTRY_KEY`, so it is known again. */
  token: string;
  /** The state the entry was pushed over, restated when a refusal puts it back. */
  state: Record<string, unknown>;
  /** The location the entry was pushed at, which a navigation made while the layer stood changes. */
  href: string;
}

/** The key the layer's token stands under, beside whatever the router keeps. */
const ENTRY_KEY = '__slottedLayer';
let sequence = 0;

interface DocumentStack {
  layers: Layer[];
  /**
   * Where the pointer went down, for the layers that wait for the click. A
   * click is dispatched wherever the pointer comes up, so a reader who selects
   * text in a panel and lets go over the scrim clicks the scrim — and a press
   * that began inside is not a press outside, whatever ends it.
   */
  pressStart: EventTarget | null;
  /**
   * How many `popstate` events are the stack's own doing — a `history.back()`
   * that takes a closed layer's entry away — and not the reader's gesture.
   */
  ownPops: number;
  detach: () => void;
}

interface DocumentLock {
  count: number;
  overflow: string;
  padding: string;
  /** Cancels the lock's write while it waits for the layout. */
  pending?: (() => void) | undefined;
}

/** Per document, so two copies of the library on one page keep two stacks. */
const stacks = new WeakMap<Document, DocumentStack>();

/**
 * The traversal a closed layer's `history.back()` started, per document and
 * not per stack, until it lands. It is asynchronous, and a layer that pushed
 * its own entry before it landed — React mounting twice, a sheet closed as
 * another opens — had the traversal applied under it: the browser took the
 * page back past the new entry and the new layer read that as the reader's
 * gesture and closed as it opened. A layer that opens while one is on its
 * way pushes its entry once it has landed, so there is never an entry for it
 * to cross. The wait is bounded, for a traversal that never dispatches.
 */
const traversals = new WeakMap<Document, Promise<void>>();
const TRAVERSAL_WAIT = 500;

/** Starts the wait for a traversal. Returns the function that ends it early, when none is made. */
function awaitTraversal(doc: Document): () => void {
  const view = doc.defaultView;
  let done = () => {};
  const landed = new Promise<void>((resolve) => {
    done = () => {
      view?.removeEventListener('popstate', done, true);
      clearTimeout(timer);
      if (traversals.get(doc) === landed) traversals.delete(doc);
      resolve();
    };
    const timer = setTimeout(done, TRAVERSAL_WAIT);
    view?.addEventListener('popstate', done, true);
  });
  traversals.set(doc, landed);
  return done;
}
const locks = new WeakMap<Document, DocumentLock>();

function documentStack(doc: Document): DocumentStack {
  const existing = stacks.get(doc);
  if (existing) return existing;

  const state: DocumentStack = { layers: [], pressStart: null, ownPops: 0, detach: () => {} };

  const onKeyDown = (event: Event) => handleKeyDown(state, event as KeyboardEvent);
  const onPress = (event: Event) => handlePress(state, event);
  const onFocusIn = (event: Event) => handleFocusIn(state, event);
  const onPopState = (event: Event) => handlePopState(doc, state, event);
  const view = doc.defaultView;

  /* Capture, so a layer answers before a consumer's own handler stops the event. */
  doc.addEventListener('keydown', onKeyDown, true);
  doc.addEventListener('pointerdown', onPress, true);
  doc.addEventListener('click', onPress, true);
  doc.addEventListener('focusin', onFocusIn, true);
  /* Before the router's own listener, which is what makes the gesture the layer's. */
  view?.addEventListener('popstate', onPopState, true);

  state.detach = () => {
    doc.removeEventListener('keydown', onKeyDown, true);
    doc.removeEventListener('pointerdown', onPress, true);
    doc.removeEventListener('click', onPress, true);
    doc.removeEventListener('focusin', onFocusIn, true);
    view?.removeEventListener('popstate', onPopState, true);
    stacks.delete(doc);
  };

  stacks.set(doc, state);
  return state;
}

function isDescendant(candidate: Layer, ancestor: Layer): boolean {
  let current = candidate.parent;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

function claims(layer: Layer, target: Node): boolean {
  if (layer.content.contains(target)) return true;
  for (const branch of layer.branches) if (branch.contains(target)) return true;
  return false;
}

/** Inside the layer, inside a node it claims, or inside a layer descended from it. */
function owns(state: DocumentStack, layer: Layer, target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;
  if (claims(layer, target)) return true;
  return state.layers.some((other) => isDescendant(other, layer) && claims(other, target));
}

function request(layer: Layer, reason: DismissReason, source?: Event): boolean {
  let cancelled = false;
  layer.options.onDismiss({
    reason,
    source,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  });
  return !cancelled;
}

function handleKeyDown(state: DocumentStack, event: KeyboardEvent) {
  /* A key ends the pointer sequence: a click the keyboard makes began nowhere. */
  state.pressStart = null;
  if (event.key !== 'Escape') return;
  /* Escape cancelling an IME composition closes none. */
  if (event.isComposing) return;
  /* Escape is the stack's: a close watcher answering it too would close a second layer. */
  if (state.layers.some((layer) => layer.watcher !== null)) event.preventDefault();
  /* A held key closes one layer. */
  if (event.repeat) return;

  const top = state.layers.at(-1);
  if (!top) return;
  /* A topmost layer that refuses Escape swallows it: the key belongs to the top. */
  if (top.options.escape === false) return;
  request(top, 'escape', event);
}

function handlePress(state: DocumentStack, event: Event) {
  if (event.type === 'pointerdown') state.pressStart = event.target;
  const began = event.type === 'click' ? state.pressStart : null;
  if (event.type === 'click') state.pressStart = null;

  /* Top down, so a submenu is asked before the menu it opened from. */
  for (const layer of [...state.layers].reverse()) {
    const wanted = layer.options.outsidePressEvent ?? 'pointerdown';
    if (event.type !== wanted) continue;

    const outside = layer.options.outsidePress ?? true;
    if (outside === false) continue;
    if (owns(state, layer, event.target)) continue;
    if (began !== null && owns(state, layer, began)) continue;
    if (typeof outside === 'function' && !outside(event.target, event)) continue;

    if (!request(layer, 'outsidePress', event)) return;
  }
}

function handleFocusIn(state: DocumentStack, event: Event) {
  for (const layer of [...state.layers].reverse()) {
    if (layer.options.focusOutside !== true) continue;
    if (owns(state, layer, event.target)) continue;
    if (!request(layer, 'blur', event)) return;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The token the current history entry carries, or none. */
function currentToken(doc: Document): string | null {
  const current: unknown = doc.defaultView?.history?.state;
  const token = isRecord(current) ? current[ENTRY_KEY] : undefined;
  return typeof token === 'string' ? token : null;
}

/**
 * The layer holds a close watcher until it is destroyed. A layer that refuses
 * the gesture gets a new watcher, since the platform spends one per close.
 */
function watchClose(Watcher: CloseWatcherConstructor, layer: Layer) {
  const watcher = new Watcher();
  watcher.onclose = (event) => {
    layer.watcher = null;
    if (!request(layer, 'back', event)) watchClose(Watcher, layer);
  };
  layer.watcher = watcher;
}

/** The layer holds an entry of the session history until it is destroyed. */
function pushEntry(doc: Document, layer: Layer) {
  const history = doc.defaultView?.history;
  if (!history || typeof history.pushState !== 'function') return;
  const previous: unknown = history.state;
  sequence += 1;
  const token = `slotted-layer-${sequence}`;
  /* Over the state that was there: a router keeps its own bookkeeping in it. */
  const state = { ...(isRecord(previous) ? previous : {}), [ENTRY_KEY]: token };
  history.pushState(state, '');
  layer.entry = { token, state, href: doc.location.href };
}

/**
 * A `popstate` that left a layer's entry is the platform's way back. The
 * topmost layer holding an entry is asked, with the reason `back`; one that
 * refuses puts its entry back, so the page under it stays where it was. A
 * `popstate` the stack caused itself, taking a closed layer's entry away, is
 * counted and not read.
 */
function handlePopState(doc: Document, state: DocumentStack, event: Event) {
  if (state.ownPops > 0) {
    state.ownPops -= 1;
    return;
  }
  const token = currentToken(doc);
  for (const layer of [...state.layers].reverse()) {
    if (layer.entry === null) continue;
    /* The entry is still the current one: nothing left it. */
    if (layer.entry.token === token) return;
    if (!request(layer, 'back', event)) {
      doc.defaultView?.history.pushState(layer.entry.state, '');
    }
    return;
  }
}

/**
 * Takes a closed layer's entry away, when it is still the current one. A
 * router that pushes a destination keeps the entry's state — the token with
 * it — so the token alone says the entry is current after the push, and the
 * `history.back()` that lands later would undo the navigation. A location
 * that is no longer the one the entry was pushed at says the page moved on:
 * the entry stays in the history as a step the reader's Back crosses unread.
 *
 * The question is asked again a task after the close. A press that closes
 * the layer and navigates closes it first, and a router that pushes from a
 * microtask pushes after the close. A layer that opens meanwhile waits, as for a
 * traversal on its way.
 *
 * shortcut: a router that pushes later than one task is undone; a longer wait if one does.
 */
function releaseEntry(doc: Document, state: DocumentStack, layer: Layer) {
  const entry = layer.entry;
  layer.entry = null;
  const history = doc.defaultView?.history;
  const current = () => currentToken(doc) === entry?.token && doc.location.href === entry.href;
  if (entry === null || !history || !current()) return;

  const done = awaitTraversal(doc);
  setTimeout(() => {
    if (!current()) return done();
    state.ownPops += 1;
    history.back();
  }, 0);
}

function reindex(state: DocumentStack) {
  for (const [index, layer] of state.layers.entries()) {
    layer.node.style.setProperty(LAYER_DEPTH_PROPERTY, String(index));
  }
}

/**
 * Everything outside the layer, made unreachable by the one attribute that
 * answers both halves of the question. Radix blocks the pointer and leaves the
 * page behind a modal in the accessibility tree, so a screen reader walks
 * straight through it.
 */
function applyInert(node: HTMLElement): () => void {
  const undo: (() => void)[] = [];
  const root = node.ownerDocument.documentElement;
  let current: Element = node;

  while (current !== root && current.parentElement) {
    for (const sibling of current.parentElement.children) {
      if (sibling === current || sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      undo.push(() => sibling.removeAttribute('inert'));
    }
    current = current.parentElement;
  }

  return () => {
    for (const step of undo.reverse()) step();
  };
}

/**
 * Where the pointer went down for the press still in flight, or `null` when
 * none is. The stack already records it so that a layer deciding on the click
 * does not read a press that began inside it as a press outside; the same
 * question is asked by a control that loses focus mid-press.
 *
 * A press on a node that cannot hold focus takes focus off whatever had it, and
 * the `blur` that follows carries `relatedTarget: null` — so a control cannot
 * tell "the reader left" from "the reader pressed something of mine". This
 * answers it, and answers it from the record the stack was already keeping
 * rather than from a second document listener (CB11).
 *
 * Reads and never attaches: with no layer open there is no stack, and no press
 * is being tracked.
 */
export function pressOrigin(doc?: Document): EventTarget | null {
  const target = doc ?? (globalThis as { document?: Document }).document;
  if (!target) return null;
  return stacks.get(target)?.pressStart ?? null;
}

/**
 * One lock per document, counted, with the inline styles it found recorded at
 * the first lock and restored at the last. A counter without the recorded
 * originals leaves an `overflow: hidden` behind whenever two locks release out
 * of the order they were taken.
 */
export function createScrollLock(doc?: Document): ScrollLockHandle {
  const target = doc ?? (globalThis as { document?: Document }).document;
  if (!target?.body) return { release: () => {} };

  const body = target.body;
  let state = locks.get(target);

  if (!state) {
    const created: DocumentLock = {
      count: 0,
      overflow: body.style.overflow,
      padding: body.style.paddingInlineEnd,
    };
    state = created;
    locks.set(target, created);

    /**
     * The scrollbar is read after the layout the opening layer causes, and
     * written after the read: read in the commit that mounted the layer, it
     * forced that layout early. A document that reports no client width has
     * no scrollbar to take away, which is every server-rendered and every
     * headless one.
     */
    let gap = 0;
    let written = false;
    const cancel = afterLayout(
      target,
      () => {
        const view = target.defaultView;
        const client = target.documentElement.clientWidth;
        gap = view && client > 0 ? view.innerWidth - client : 0;
      },
      () => {
        written = true;
        created.pending = undefined;
        body.style.overflow = 'hidden';
        if (gap > 0) body.style.paddingInlineEnd = `${gap}px`;
      },
    );
    /* A headless document writes at once, before `afterLayout` returns. */
    if (!written) created.pending = cancel;
  }

  state.count += 1;
  let released = false;

  return {
    release() {
      if (released) return;
      released = true;
      const current = locks.get(target);
      if (!current) return;

      current.count -= 1;
      if (current.count > 0) return;

      locks.delete(target);
      /* Released before it was written: there is nothing to restore. */
      if (current.pending) return current.pending();
      body.style.overflow = current.overflow;
      body.style.paddingInlineEnd = current.padding;
      if (body.getAttribute('style') === '') body.removeAttribute('style');
    },
  };
}

export function createDismissableLayer(
  node: HTMLElement,
  options: DismissableLayerOptions,
): DismissableLayerHandle {
  const doc = node.ownerDocument;
  const state = documentStack(doc);

  const layer: Layer = {
    node,
    content: options.content ?? node,
    options,
    /* The layer that was topmost when this one opened is its ancestor. */
    parent: state.layers.at(-1) ?? null,
    branches: new Set(options.branches ?? []),
    releaseInert: null,
    releaseScroll: null,
    entry: null,
    watcher: null,
  };

  state.layers.push(layer);
  reindex(state);

  if (options.modal === true) layer.releaseInert = applyInert(node);
  let destroyed = false;
  const Watcher = (globalThis as { CloseWatcher?: CloseWatcherConstructor }).CloseWatcher;
  if (options.back === true && Watcher !== undefined) watchClose(Watcher, layer);
  else if (options.back === true) {
    const pending = traversals.get(doc);
    if (pending === undefined) pushEntry(doc, layer);
    else
      void pending.then(() => {
        if (!destroyed) pushEntry(doc, layer);
      });
  }
  if (options.scrollLock ?? options.modal === true) {
    const lock = createScrollLock(doc);
    layer.releaseScroll = lock.release;
  }

  return {
    get depth() {
      return state.layers.indexOf(layer);
    },
    get topmost() {
      return state.layers.at(-1) === layer;
    },
    addBranch(branch) {
      layer.branches.add(branch);
      return () => layer.branches.delete(branch);
    },
    dismiss(source) {
      if (destroyed) return;
      request(layer, 'programmatic', source);
    },
    raise() {
      if (destroyed) return;
      /**
       * A layer already on top of the stack may still sit under an `inert` a
       * newer layer wrote before this one was re-created, so the document half
       * runs either way; only the stack half needs a layer above.
       */
      if (state.layers.at(-1) !== layer) {
        const below = state.layers.at(-1) ?? null;
        /* No layer may end up its own ancestor: those that hung from this one hang from its parent. */
        for (const other of state.layers) {
          if (other.parent === layer) other.parent = layer.parent;
        }
        state.layers.splice(state.layers.indexOf(layer), 1);
        state.layers.push(layer);
        layer.parent = below;
        reindex(state);
      }

      node.parentElement?.append(node);
      for (let current: Element | null = node; current; current = current.parentElement) {
        current.removeAttribute('inert');
      }
      if (options.modal === true) {
        layer.releaseInert?.();
        layer.releaseInert = applyInert(node);
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;

      layer.releaseInert?.();
      layer.releaseScroll?.();
      layer.watcher?.destroy();
      layer.watcher = null;
      releaseEntry(doc, state, layer);
      node.style.removeProperty(LAYER_DEPTH_PROPERTY);
      if (node.getAttribute('style') === '') node.removeAttribute('style');

      const index = state.layers.indexOf(layer);
      if (index !== -1) state.layers.splice(index, 1);
      /* A layer that opened over this one keeps its own ancestry, minus this link. */
      for (const other of state.layers) {
        if (other.parent === layer) other.parent = layer.parent;
      }
      reindex(state);

      if (state.layers.length === 0) state.detach();
    },
  };
}
