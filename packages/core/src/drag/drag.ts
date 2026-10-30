/**
 * The drag session, and the two ways of driving it.
 *
 * A drag is four verbs over a list of positions: `pickUp`, `move`, `drop`,
 * `cancel`. The keyboard calls the verbs; the pointer calls the same verbs
 * with a point turned into a position first. The consumer receives one event
 * from both, carrying keys and indexes and never a pixel, because the model
 * the drop changes is the consumer's list and not the geometry that drew it.
 *
 * ── What the module owns, and what it does not ─────────────────────────
 *
 * It owns the session's state, the position list, the announcement, the
 * pointer preview, the auto-scroll and the focus destination at the end. It
 * writes nothing on a registered element: `state` is a snapshot the family
 * renders as `data-dragging`, `data-drop-target` and `data-drop-invalid`,
 * because an attribute with two owners in React is an attribute one of them
 * re-renders away. The preview is the one element it appends, and it is gone
 * when the session is.
 *
 * ── `Escape` ─────────────────────────────────────────────────────────────
 *
 * Taken on `window` in the capture phase and stopped there, so a drag inside
 * a dialog cancels the drag and leaves the dialog open. `dismissable-layer`
 * listens on the document; the window's capture listeners run first. This is
 * the one place the module knows another module exists, and it knows it by
 * event order, not by import.
 *
 * ── A drop that changes nothing ─────────────────────────────────────────
 *
 * The identity position — the gap the item came out of — is where a keyboard
 * session starts, and a drop on it, on nothing, or on a refused position ends
 * the session as a cancel. `docs/state-and-events.md`: a request for the
 * value the consumer already holds is not emitted.
 */

import type { DragMessages, FamilyTranslator } from '../i18n';
import { getLiveAnnouncer } from '../live-announcer';
import { autoScrollDelta, contains, resolvePoint } from './geometry';
import type { MeasuredContainer, Point, Rect } from './geometry';
import { intentForKey, isDropKey, operationForModifiers } from './keys';
import type { Modifiers, WritingDirection } from './keys';
import {
  containerPositions,
  isIdentity,
  resultingPosition,
  sameTarget,
  stepWithin,
} from './positions';
import type { DragFacts } from './positions';
import type {
  DragAnnouncement,
  DragContainerOptions,
  DragController,
  DragControllerOptions,
  DragReason,
  DragState,
  DraggableOptions,
  DropOperation,
  DropTarget,
  MoveByOptions,
  MoveIntent,
  PickUpOptions,
} from './types';

export const DEFAULT_DRAG_DISTANCE = 5;
export const DEFAULT_TOUCH_DELAY = 250;
export const DEFAULT_DWELL_DELAY = 600;
export const DEFAULT_AUTO_SCROLL_THRESHOLD = 40;
export const DEFAULT_AUTO_SCROLL_SPEED = 12;
/** Marks the element the pointer drags around; a stylesheet may dress it. */
export const DRAG_PREVIEW_ATTRIBUTE = 'data-slotted-drag-preview';

const IDLE: DragState = {
  status: 'idle',
  reason: null,
  items: [],
  source: null,
  target: null,
  valid: false,
  operation: null,
  point: null,
};

interface PointerSession {
  readonly pointerId: number;
  readonly element: Element;
  /** Where inside the source the finger was, so the preview does not jump under it. */
  readonly offset: Point;
  preview: HTMLElement | null;
  frame: number | null;
  detach: () => void;
}

interface Session {
  readonly allowed: readonly DropOperation[];
  readonly reason: DragReason;
  modifiers: Modifiers;
  pointer: PointerSession | null;
  dwell: ReturnType<typeof setTimeout> | null;
  detach: () => void;
  /** A one-call move says only where the item landed. */
  quiet: boolean;
}

function delayFor(options: DraggableOptions, pointerType: string): number {
  const { delay } = options;
  if (typeof delay === 'number') return delay;
  if (pointerType === 'touch') return delay?.touch ?? DEFAULT_TOUCH_DELAY;
  if (pointerType === 'pen') return delay?.pen ?? 0;
  return delay?.mouse ?? 0;
}

const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"])';

/** Whether a press landed on a control of its own between the target and the handle. */
function isInteractive(target: Node, handle: Element): boolean {
  const element = target instanceof Element ? target : target.parentElement;
  const control = element?.closest(INTERACTIVE) ?? null;
  return control !== null && control !== handle && handle.contains(control);
}

function toRect(element: Element | null | undefined): Rect | null {
  if (!element) return null;
  const { top, right, bottom, left } = element.getBoundingClientRect();
  return { top, right, bottom, left };
}

function isScrollable(element: Element, axis: 'x' | 'y', view: Window): boolean {
  const style = view.getComputedStyle(element);
  const overflow = axis === 'y' ? style.overflowY : style.overflowX;
  if (overflow !== 'auto' && overflow !== 'scroll') return false;
  return axis === 'y'
    ? element.scrollHeight > element.clientHeight
    : element.scrollWidth > element.clientWidth;
}

export function createDragController(options: DragControllerOptions = {}): DragController {
  const doc = options.document ?? (globalThis as { document?: Document }).document;
  const containers = new Map<string, DragContainerOptions>();
  const draggables = new Set<() => void>();
  const listeners = new Set<(state: DragState) => void>();
  const silent = new Set(options.silent ?? []);
  const restoreFocus = options.restoreFocus ?? true;
  const dwellDelay = options.dwellDelay ?? DEFAULT_DWELL_DELAY;
  const announce =
    options.announce ??
    ((message: string) => {
      if (doc) getLiveAnnouncer(doc).announce(message, { repeat: true });
    });

  let state: DragState = IDLE;
  let session: Session | null = null;

  function set(next: DragState) {
    state = next;
    for (const listener of listeners) listener(state);
  }

  function container(key: string | undefined): DragContainerOptions | undefined {
    return key === undefined ? undefined : containers.get(key);
  }

  function facts(): DragFacts {
    return {
      items: state.items,
      source: state.source ?? { container: '', index: 0 },
      operation: state.operation,
    };
  }

  function operationFor(target: DropTarget, modifiers: Modifiers): DropOperation | null {
    if (session === null) return null;
    const named = container(target.container)?.operation?.(state, target) ?? null;
    if (named !== null) return session.allowed.includes(named) ? named : null;
    return operationForModifiers(modifiers, session.allowed);
  }

  function validity(target: DropTarget | null, modifiers: Modifiers): boolean {
    if (target === null) return false;
    if (isIdentity(target, facts())) return true;
    const owner = container(target.container);
    if (owner === undefined || owner.disabled?.() === true) return false;
    if (owner.accepts?.(state, target) === false) return false;
    return operationFor(target, modifiers) !== null;
  }

  /** The positions of one container the keyboard may land on. */
  function positionsOf(key: string): DropTarget[] {
    const owner = container(key);
    if (owner === undefined) return [];
    const all = containerPositions(
      {
        key,
        items: owner.items(),
        targets: owner.targets ?? ['between'],
        disabled: owner.disabled?.() === true,
      },
      facts(),
    );
    return all.filter((target) => validity(target, session?.modifiers ?? {}));
  }

  function directionOf(key: string): WritingDirection {
    const element = container(key)?.element?.();
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return 'ltr';
    return view.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * The sentence for one announcement, from the drag's words: the item, and
   * the place the drop would land when one can be said — the `*At` form then
   * carries it as `{where}`.
   */
  function sentence(announcement: DragAnnouncement, t: FamilyTranslator<DragMessages>): string {
    if (announcement === 'nowhere') return t('nowhere');
    const source = container(state.source?.container);
    const first = state.items[0] ?? '';
    const count = state.items.length;
    const item = count > 1 ? t('items', { count }) : (source?.itemLabel?.(first) ?? first);
    if (announcement === 'cancelled') return t('cancelled', { item });

    const where = place(t);
    const operation = state.operation ?? 'move';
    if (announcement === 'pickedUp') {
      return where === null ? t('pickedUp', { item }) : t('pickedUpAt', { item, where });
    }
    if (announcement === 'moved') {
      return where === null ? t('moved', { item }) : t('movedAt', { item, where });
    }
    return where === null
      ? t('dropped', { item, operation })
      : t('droppedAt', { item, operation, where });
  }

  /**
   * Where the drop would land: the item it lands on, or the position it takes
   * and the container it takes it in. `null` when nothing of it can be said.
   */
  function place(t: FamilyTranslator<DragMessages>): string | null {
    const target = state.target;
    const owner = container(target?.container);
    if (target === null || owner === undefined) return null;
    if (target.kind === 'on') {
      return t('place.on', { target: owner.itemLabel?.(target.key) ?? target.key });
    }
    const label = owner.label?.() ?? null;
    if (target.kind === 'between') {
      const resulting = resultingPosition(target, owner.items(), facts());
      if (resulting !== null) {
        const { position, total } = resulting;
        return label === null
          ? t('place.position', { position, total })
          : t('place.positionIn', { position, total, target: label });
      }
    }
    return label === null ? null : t('place.in', { target: label });
  }

  function say(announcement: DragAnnouncement) {
    if (options.t === undefined || silent.has(announcement)) return;
    announce(sentence(announcement, options.t));
  }

  /** The source still holds what it did; otherwise the drag has nothing to move. */
  function sourceIntact(): boolean {
    const owner = container(state.source?.container);
    if (owner === undefined) return false;
    const items = owner.items();
    return state.items.every((key) => items.includes(key));
  }

  function clearDwell() {
    if (session?.dwell) clearTimeout(session.dwell);
    if (session) session.dwell = null;
  }

  function scrollIntoView(target: DropTarget | null) {
    const owner = container(target?.container);
    if (target === null || owner === undefined) return;
    let element: Element | null | undefined;
    if (target.kind === 'on') element = owner.itemElement?.(target.key);
    else if (target.kind === 'between') {
      const items = owner.items();
      const key = items[Math.min(target.index, items.length - 1)];
      element = key === undefined ? undefined : owner.itemElement?.(key);
    }
    element ??= owner.element?.();
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function setTarget(
    target: DropTarget | null,
    event: Event | undefined,
    point: Point | null,
    modifiers: Modifiers = session?.modifiers ?? {},
  ) {
    if (session === null) return;
    session.modifiers = modifiers;
    const valid = validity(target, modifiers);
    const operation =
      target === null
        ? operationForModifiers(modifiers, session.allowed)
        : (operationFor(target, modifiers) ?? operationForModifiers(modifiers, session.allowed));
    const changed =
      !sameTarget(target, state.target) || valid !== state.valid || operation !== state.operation;

    set({ ...state, target, valid, operation, point });
    if (!changed) return;

    clearDwell();
    if (target?.kind === 'on' && valid && !isIdentity(target, facts())) {
      session.dwell = setTimeout(() => {
        if (session) session.dwell = null;
        options.onDwell?.({ state, event: undefined });
      }, dwellDelay);
    }
    options.onTargetChange?.({ state, event });
  }

  function focusItem(key: string | undefined, containerKey: string | undefined, fallback?: string) {
    if (!restoreFocus || key === undefined || !doc) return;
    const raf = doc.defaultView?.requestAnimationFrame ?? ((fn: () => void) => setTimeout(fn, 0));
    raf(() => {
      const element =
        container(containerKey)?.itemElement?.(key) ?? container(fallback)?.itemElement?.(key);
      if (element instanceof HTMLElement && element.isConnected)
        element.focus({ preventScroll: true });
    });
  }

  function end(dropped: boolean, event: Event | undefined) {
    if (session === null) return;
    const closing = session;
    session = null;
    clearTimeout(closing.dwell ?? undefined);
    closing.detach();
    closing.pointer?.detach();

    const final = state;
    set(IDLE);
    options.onDragEnd?.({ state: final, dropped, reason: closing.reason, event });
  }

  function attachSessionListeners(): () => void {
    const view = doc?.defaultView;
    if (!view) return () => {};

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      event.preventDefault();
      cancel(event);
    };
    const onBlur = () => cancel();
    const onVisibility = () => {
      if (doc?.visibilityState === 'hidden') cancel();
    };

    view.addEventListener('keydown', onKeydown, true);
    view.addEventListener('blur', onBlur);
    doc?.addEventListener('visibilitychange', onVisibility);
    return () => {
      view.removeEventListener('keydown', onKeydown, true);
      view.removeEventListener('blur', onBlur);
      doc?.removeEventListener('visibilitychange', onVisibility);
    };
  }

  function pickUp(request: PickUpOptions, quiet = false): boolean {
    if (session !== null) return false;
    const owner = container(request.source.container);
    if (owner === undefined || request.items.length === 0) return false;
    if (owner.disabled?.() === true) return false;

    const reason = request.reason ?? 'programmatic';
    let cancelled = false;
    options.onDragStart?.({
      items: request.items,
      source: request.source,
      reason,
      event: request.event,
      get cancelled() {
        return cancelled;
      },
      cancel() {
        cancelled = true;
      },
    });
    if (cancelled) return false;

    const allowed = request.allowedOperations ?? ['move'];
    session = {
      allowed,
      reason,
      modifiers: {},
      pointer: null,
      dwell: null,
      detach: () => {},
      quiet,
    };
    set({
      status: 'dragging',
      reason,
      items: request.items,
      source: request.source,
      target: null,
      valid: false,
      operation: allowed[0] ?? null,
      point: null,
    });
    session.detach = attachSessionListeners();

    /* The keyboard starts on the gap the item came out of; the pointer starts
       wherever it is, which `attachDraggable` resolves right after this. */
    const identity: DropTarget = {
      kind: 'between',
      container: request.source.container,
      index: request.source.index,
    };
    const start = isIdentity(identity, facts())
      ? identity
      : (positionsOf(request.source.container)[0] ?? null);
    set({ ...state, target: start, valid: validity(start, {}) });
    if (!quiet) say('pickedUp');
    return true;
  }

  function move(intent: MoveIntent, event?: Event): boolean {
    if (session === null) return false;
    if (!sourceIntact()) {
      cancel(event);
      return false;
    }

    const keys = [...containers.keys()];
    const currentKey = state.target?.container ?? state.source?.container ?? keys[0] ?? '';

    if (intent === 'nextContainer' || intent === 'previousContainer') {
      const from = keys.indexOf(currentKey);
      const step = intent === 'nextContainer' ? 1 : -1;
      for (let offset = 1; offset <= keys.length; offset += 1) {
        const key = keys[(from + step * offset + keys.length * offset) % keys.length];
        if (key === undefined || key === currentKey) continue;
        const first = positionsOf(key)[0];
        if (first !== undefined) {
          setTarget(first, event, null);
          scrollIntoView(first);
          say('moved');
          return true;
        }
      }
      say('nowhere');
      return false;
    }

    const positions = positionsOf(currentKey);
    const current = positions.findIndex((target) => sameTarget(target, state.target));
    const columns = container(currentKey)?.columns?.() ?? 1;
    const next = stepWithin(positions, current, intent, columns);
    const target = positions[next];
    if (target === undefined) {
      say('nowhere');
      return false;
    }
    if (sameTarget(target, state.target)) {
      /* The end was reached: the position is said again, and nothing moved. */
      say('moved');
      return false;
    }
    setTarget(target, event, null);
    scrollIntoView(target);
    say('moved');
    return true;
  }

  function moveTo(target: DropTarget | null, event?: Event, point: Point | null = null) {
    if (session === null) return;
    if (!sourceIntact()) {
      cancel(event);
      return;
    }
    setTarget(target, event, point);
  }

  function drop(event?: Event): boolean {
    if (session === null) return false;
    const { target, source, items, operation } = state;
    if (
      target === null ||
      source === null ||
      operation === null ||
      !state.valid ||
      isIdentity(target, facts())
    ) {
      cancel(event);
      return false;
    }

    const { reason, quiet } = session;
    /* Said before the consumer moves its model: the position and the label
       are read from the list as it is, not as the drop leaves it. */
    if (!quiet) say('dropped');
    options.onDrop?.({ items, source, target, operation, reason, event });
    end(true, event);
    focusItem(items[0], target.container, source.container);
    return true;
  }

  function cancel(event?: Event) {
    if (session === null) return;
    const { quiet } = session;
    const source = state.source;
    const first = state.items[0];
    if (!quiet) say('cancelled');
    end(false, event);
    focusItem(first, source?.container);
  }

  function moveBy(request: MoveByOptions): boolean {
    if (!pickUp(request, true)) return false;
    if (!move(request.intent, request.event)) {
      cancel(request.event);
      return false;
    }
    return drop(request.event);
  }

  function handleKeydown(event: KeyboardEvent): boolean {
    if (session === null) return false;
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel(event);
      return true;
    }
    if (isDropKey(event)) {
      event.preventDefault();
      setTarget(state.target, event, state.point, event);
      drop(event);
      return true;
    }
    const currentKey = state.target?.container ?? state.source?.container ?? '';
    const orientation = container(currentKey)?.orientation ?? 'vertical';
    const intent = intentForKey(event, orientation, directionOf(currentKey));
    if (intent === null) return false;
    event.preventDefault();
    move(intent, event);
    return true;
  }

  /* ── The pointer ──────────────────────────────────────────────────── */

  function measure(): MeasuredContainer[] {
    const measured: MeasuredContainer[] = [];
    for (const [key, owner] of containers) {
      if (owner.disabled?.() === true) continue;
      const items = owner.items();
      const entry: MeasuredContainer = {
        key,
        rect: toRect(owner.element?.()),
        items,
        rects: items.map((item) => toRect(owner.itemElement?.(item))),
        targets: owner.targets ?? ['between'],
        ...(owner.orientation === undefined ? {} : { orientation: owner.orientation }),
        direction: directionOf(key),
      };
      measured.push(entry);
    }
    return measured;
  }

  function resolveAt(point: Point, event: Event | undefined, modifiers: Modifiers) {
    const resolve =
      options.resolveTarget ?? ((at, measured) => resolvePoint(at, measured, 'vertical'));
    let target = resolve(point, measure());
    /* The gap after the item and the gap before it are the same place. */
    if (target !== null && isIdentity(target, facts()) && state.source) {
      target = { kind: 'between', container: target.container, index: state.source.index };
    }
    setTarget(target, event, point, modifiers);
  }

  /**
   * The preview is cloned before the session is published, so the family's
   * `data-dragging` and its own indicator attributes — written by a
   * subscriber the moment the state moves — are not on the copy under the
   * pointer. A clone taken a frame later was a dimmed, dashed item with the
   * insertion line drawn across its top.
   */
  function cloneSource(
    draggable: DraggableOptions,
    key: string,
  ): { clone: Element; rect: Rect } | null {
    const sourceElement = container(draggable.container)?.itemElement?.(key) ?? null;
    if (!sourceElement) return null;
    const clone = sourceElement.cloneNode(true) as Element;
    clone.removeAttribute('id');
    for (const inner of clone.querySelectorAll('[id]')) inner.removeAttribute('id');
    const rect = sourceElement.getBoundingClientRect();
    return { clone, rect };
  }

  function buildPreview(pointer: PointerSession, source: { clone: Element; rect: Rect } | null) {
    if (options.preview === false || !doc) return;
    const rendered = options.preview?.render?.(state);
    const element: Element | null = rendered === undefined ? (source?.clone ?? null) : rendered;
    if (!(element instanceof HTMLElement)) return;

    element.setAttribute(DRAG_PREVIEW_ATTRIBUTE, '');
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('inert', '');
    const style = element.style;
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.margin = '0';
    style.boxSizing = 'border-box';
    style.pointerEvents = 'none';
    style.willChange = 'translate';
    style.zIndex = 'var(--slotted-z-index-toast, 2147483647)';
    if (source && rendered === undefined) {
      style.width = `${source.rect.right - source.rect.left}px`;
      style.height = `${source.rect.bottom - source.rect.top}px`;
    }
    (options.preview?.container?.() ?? doc.body).append(element);
    pointer.preview = element;
    placePreview(pointer);
  }

  function placePreview(pointer: PointerSession) {
    const { preview, offset } = pointer;
    if (!preview || state.point === null) return;
    preview.style.translate = `${state.point.x - offset.x}px ${state.point.y - offset.y}px`;
    preview.setAttribute('data-operation', state.operation ?? 'move');
    preview.toggleAttribute('data-drop-invalid', state.target !== null && !state.valid);
  }

  function autoScroll(pointer: PointerSession) {
    const view = doc?.defaultView;
    if (options.autoScroll === false || !doc || !view) return;
    const threshold = options.autoScroll?.threshold ?? DEFAULT_AUTO_SCROLL_THRESHOLD;
    const speed = options.autoScroll?.speed ?? DEFAULT_AUTO_SCROLL_SPEED;
    const axis = options.autoScroll?.axis ?? 'both';

    const tick = () => {
      pointer.frame = null;
      if (session?.pointer !== pointer || state.point === null) return;
      const point = state.point;
      let scrolled = false;

      for (
        let node: Element | null = doc.elementFromPoint(point.x, point.y);
        node !== null && !scrolled;
        node = node.parentElement
      ) {
        const isRoot = node === doc.scrollingElement || node === doc.documentElement;
        const rect: Rect | null = isRoot
          ? { top: 0, left: 0, right: view.innerWidth, bottom: view.innerHeight }
          : toRect(node);
        if (rect === null || !contains(rect, point)) continue;
        const delta = autoScrollDelta(point, rect, threshold, speed);
        const canX = axis !== 'y' && delta.x !== 0 && (isRoot || isScrollable(node, 'x', view));
        const canY = axis !== 'x' && delta.y !== 0 && (isRoot || isScrollable(node, 'y', view));
        if (!canX && !canY) continue;
        const target = isRoot ? (doc.scrollingElement ?? doc.documentElement) : node;
        const beforeX = target.scrollLeft;
        const beforeY = target.scrollTop;
        if (canX) target.scrollLeft += delta.x;
        if (canY) target.scrollTop += delta.y;
        scrolled = target.scrollLeft !== beforeX || target.scrollTop !== beforeY;
      }

      if (scrolled) resolveAt(point, undefined, session.modifiers);
      pointer.frame = view.requestAnimationFrame(tick);
    };
    pointer.frame = view.requestAnimationFrame(tick);
  }

  function startPointer(
    element: Element,
    event: PointerEvent,
    draggable: DraggableOptions,
    pressed: Point,
  ) {
    const owner = container(draggable.container);
    if (owner === undefined) return false;
    const items = draggable.items?.() ?? [draggable.key];
    const index = owner.items().indexOf(items[0] ?? draggable.key);
    if (index < 0) return false;
    const source =
      options.preview === false ? null : cloneSource(draggable, items[0] ?? draggable.key);

    const started = pickUp({
      items,
      source: { container: draggable.container, index },
      reason: 'pointer',
      event,
      ...(draggable.allowedOperations === undefined
        ? {}
        : { allowedOperations: draggable.allowedOperations }),
    });
    if (!started || session === null || !doc) return false;

    const sourceRect = source?.rect ?? toRect(element);
    /* Measured from the press, not from the move that crossed the threshold,
       so the preview appears where the finger already is. */
    const offset: Point = sourceRect
      ? { x: pressed.x - sourceRect.left, y: pressed.y - sourceRect.top }
      : { x: 0, y: 0 };

    const onMove = (moved: PointerEvent) => {
      if (moved.pointerId !== pointer.pointerId) return;
      resolveAt({ x: moved.clientX, y: moved.clientY }, moved, moved);
      placePreview(pointer);
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId !== pointer.pointerId) return;
      resolveAt({ x: up.clientX, y: up.clientY }, up, up);
      drop(up);
    };
    const onCancel = (cancelled: PointerEvent) => {
      if (cancelled.pointerId !== pointer.pointerId) return;
      cancel(cancelled);
    };
    const prevent = (blocked: Event) => {
      if (blocked.cancelable) blocked.preventDefault();
    };

    const pointer: PointerSession = {
      pointerId: event.pointerId,
      element,
      offset,
      preview: null,
      frame: null,
      detach: () => {
        doc.removeEventListener('pointermove', onMove, true);
        doc.removeEventListener('pointerup', onUp, true);
        doc.removeEventListener('pointercancel', onCancel, true);
        doc.removeEventListener('touchmove', prevent, true);
        doc.removeEventListener('contextmenu', prevent, true);
        if (pointer.frame !== null) doc.defaultView?.cancelAnimationFrame(pointer.frame);
        pointer.preview?.remove();
        if (element.hasPointerCapture?.(pointer.pointerId)) {
          element.releasePointerCapture(pointer.pointerId);
        }
      },
    };
    session.pointer = pointer;

    doc.addEventListener('pointermove', onMove, true);
    doc.addEventListener('pointerup', onUp, true);
    doc.addEventListener('pointercancel', onCancel, true);
    /* The page keeps scrolling under a finger until the hold elapsed; from
       here the finger is the drag, and `touch-action` alone cannot say so
       after the fact. */
    doc.addEventListener('touchmove', prevent, { capture: true, passive: false });
    doc.addEventListener('contextmenu', prevent, true);
    try {
      element.setPointerCapture?.(event.pointerId);
    } catch {
      /* A pointer that already ended cannot be captured; the session still is. */
    }

    resolveAt({ x: event.clientX, y: event.clientY }, event, event);
    buildPreview(pointer, source);
    autoScroll(pointer);
    return true;
  }

  function attachDraggable(element: Element, draggable: DraggableOptions): () => void {
    const distance = draggable.distance ?? DEFAULT_DRAG_DISTANCE;
    let pending: {
      pointerId: number;
      origin: Point;
      last: PointerEvent;
      timer: ReturnType<typeof setTimeout> | null;
      release: () => void;
    } | null = null;

    const clearPending = () => {
      if (pending === null) return;
      if (pending.timer !== null) clearTimeout(pending.timer);
      pending.release();
      pending = null;
    };

    const onDown = (event: Event) => {
      if (!(event instanceof PointerEvent) || !doc) return;
      if (session !== null || pending !== null) return;
      if (event.button !== 0 || draggable.disabled?.() === true) return;
      const handle = draggable.handle?.() ?? element;
      if (!(event.target instanceof Node) || !handle.contains(event.target)) return;
      /* A row that drags from anywhere still has a button in it, and a press
         on the button is the button's. A handle that *is* a control is the
         family's own decision, so only what sits under the handle is skipped. */
      if (handle !== event.target && isInteractive(event.target, handle)) return;
      if (draggable.canDrag?.(event) === false) return;

      const origin = { x: event.clientX, y: event.clientY };
      const delay = delayFor(draggable, event.pointerType);

      const onMove = (moved: Event) => {
        if (!(moved instanceof PointerEvent) || pending === null) return;
        if (moved.pointerId !== pending.pointerId) return;
        pending.last = moved;
        const travelled = Math.hypot(moved.clientX - origin.x, moved.clientY - origin.y);
        if (travelled < distance) return;
        /* Before the hold elapsed, travel is a scroll and the press is over. */
        if (pending.timer !== null) {
          clearPending();
          return;
        }
        const last = pending.last;
        clearPending();
        startPointer(element, last, draggable, origin);
      };
      const onEnd = (ended: Event) => {
        if (ended instanceof PointerEvent && pending?.pointerId === ended.pointerId) clearPending();
      };

      doc.addEventListener('pointermove', onMove, true);
      doc.addEventListener('pointerup', onEnd, true);
      doc.addEventListener('pointercancel', onEnd, true);
      pending = {
        pointerId: event.pointerId,
        origin,
        last: event,
        timer:
          delay > 0
            ? setTimeout(() => {
                if (pending === null) return;
                const last = pending.last;
                pending.timer = null;
                clearPending();
                startPointer(element, last, draggable, origin);
              }, delay)
            : null,
        release: () => {
          doc.removeEventListener('pointermove', onMove, true);
          doc.removeEventListener('pointerup', onEnd, true);
          doc.removeEventListener('pointercancel', onEnd, true);
        },
      };
      if (delay === 0 && distance === 0) {
        clearPending();
        startPointer(element, event, draggable, origin);
      }
    };

    element.addEventListener('pointerdown', onDown);
    const detach = () => {
      element.removeEventListener('pointerdown', onDown);
      clearPending();
      draggables.delete(detach);
    };
    draggables.add(detach);
    return detach;
  }

  return {
    get state() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    registerContainer(container) {
      containers.set(container.key, container);
      return () => {
        if (containers.get(container.key) === container) containers.delete(container.key);
      };
    },
    pickUp: (request) => pickUp(request),
    move,
    moveTo,
    drop,
    cancel,
    moveBy,
    handleKeydown,
    attachDraggable,
    destroy() {
      cancel();
      for (const detach of [...draggables]) detach();
      containers.clear();
      listeners.clear();
    },
  };
}
