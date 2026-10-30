/**
 * What a guided tour knows about its steps, resolved once for both bindings.
 *
 * Four questions: which element a step points at, which step comes next once
 * conditions, preparation and missing targets have had their say, where the
 * reader is in the tour, and which arrow key goes which way. The navigation
 * is here rather than in each binding because it is asynchronous — a step may
 * prepare the page, and its target may arrive late — and an asynchronous rule
 * written twice is two rules that disagree about what an abort means.
 */

import { COMPACT_BELOW } from '../measure/size-class';

/** Everything a consumer may name a target by. */
export type TourTarget =
  | Element
  | string
  | { readonly current: Element | null }
  | (() => Element | null | undefined)
  | null
  | undefined;

/** What a step must hold for this module to navigate through it. */
export interface TourStepShape {
  readonly id: string;
  readonly target?: TourTarget;
  /** Read each time navigation reaches the step. `false` passes over it. */
  readonly when?: (() => boolean) | undefined;
  /**
   * Awaited before the target is looked for, so it may render the target —
   * open a menu, switch a tab. The signal aborts when the reader moves on.
   */
  readonly prepare?: ((signal: AbortSignal) => void | Promise<void>) | undefined;
}

export type TourMissing = 'center' | 'skip';

export type TourDirection = 1 | -1;

export interface ResolveStepOptions {
  /** The step navigation starts from; the first step it can reach is the next one. */
  readonly from?: string | null;
  /** A step to land on exactly, falling through in `direction` when it is unavailable. */
  readonly at?: string;
  readonly direction: TourDirection;
  readonly missing?: TourMissing;
  /** How long to watch the document for a target that is not there yet. */
  readonly targetTimeout?: number;
  readonly signal?: AbortSignal;
  readonly document?: Document;
}

export interface ResolvedStep<Step extends TourStepShape> {
  readonly step: Step;
  readonly index: number;
  /** The element to point at, or `null` for a centred step. */
  readonly target: Element | null;
  /** The step named a target and it could not be found. */
  readonly missing: boolean;
}

export interface TourProgress {
  /** One-based, among available steps; zero when the step is not one of them. */
  readonly position: number;
  readonly total: number;
  readonly first: boolean;
  readonly last: boolean;
}

export type TourKeyAction = 'next' | 'prev';

export interface TargetRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The four runtime properties the stylesheet reads, named once. */
export const TOUR_TARGET_PROPERTIES = {
  x: '--slotted-tour-target-x',
  y: '--slotted-tour-target-y',
  width: '--slotted-tour-target-width',
  height: '--slotted-tour-target-height',
} as const;

/**
 * The element a step points at, or `null`. A selector the document refuses is
 * a missing target rather than an exception: a typo in a tour must not break
 * the page it is explaining. A detached element is missing too.
 */
export function resolveTarget(target: TourTarget, doc: Document = document): Element | null {
  if (target === null || target === undefined) return null;

  let found: Element | null | undefined;
  if (typeof target === 'string') {
    try {
      found = doc.querySelector(target);
    } catch {
      found = null;
    }
  } else if (typeof target === 'function') {
    found = target();
  } else if ('current' in target) {
    found = target.current;
  } else {
    found = target;
  }

  return found && found.isConnected ? found : null;
}

function available(step: TourStepShape): boolean {
  try {
    return step.when === undefined || step.when() !== false;
  } catch {
    /* A condition that throws cannot say yes. */
    return false;
  }
}

/** Where the reader is, counting only the steps whose condition holds now. */
export function tourProgress(steps: readonly TourStepShape[], id: string | null): TourProgress {
  const open = steps.filter(available);
  const index = open.findIndex((step) => step.id === id);
  return {
    position: index + 1,
    total: open.length,
    first: index === 0,
    last: index !== -1 && index === open.length - 1,
  };
}

/**
 * The action an arrow key asks for. In a right-to-left document the next step
 * is to the left, the way a reader's eye moves.
 */
export function tourKey(key: string, direction: 'ltr' | 'rtl'): TourKeyAction | null {
  if (key !== 'ArrowRight' && key !== 'ArrowLeft') return null;
  const forward = key === (direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
  return forward ? 'next' : 'prev';
}

const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
]);

/** Whether an arrow key belongs to the element — a caret moves in it. */
export function isTextEntry(node: Element | null): boolean {
  if (node === null) return false;
  if (node instanceof HTMLTextAreaElement) return true;
  if (node instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(node.type);
  if (node instanceof HTMLElement && node.isContentEditable) return true;
  const editable = node.getAttribute('contenteditable');
  if (editable !== null && editable !== 'false') return true;
  return node.getAttribute('role') === 'textbox';
}

function aborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

/**
 * Watches the document until the target resolves, the time runs out or the
 * signal aborts. A `MutationObserver` answers as soon as the element appears
 * rather than on a polling interval.
 */
export function waitForTarget(
  target: TourTarget,
  options: { timeout: number; signal?: AbortSignal | undefined; document?: Document | undefined },
): Promise<Element | null> {
  const doc = options.document ?? document;
  const now = resolveTarget(target, doc);
  if (now !== null || options.timeout <= 0 || aborted(options.signal)) {
    return Promise.resolve(now);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: Element | null) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
      resolve(value);
    };
    const onAbort = () => finish(null);
    const observer = new MutationObserver(() => {
      const found = resolveTarget(target, doc);
      if (found !== null) finish(found);
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true });
    const timer = setTimeout(() => finish(resolveTarget(target, doc)), options.timeout);
    options.signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * The step navigation reaches, with its target, or `null` when there is none
 * in that direction — or the navigation was aborted, which the caller tells
 * apart from its own signal.
 *
 * A step is passed over when its condition is false, and under
 * `missing: 'skip'` when its target cannot be found. A step whose `prepare`
 * rejects is treated as a step whose target cannot be found.
 */
export async function resolveStep<Step extends TourStepShape>(
  steps: readonly Step[],
  options: ResolveStepOptions,
): Promise<ResolvedStep<Step> | null> {
  const { direction, signal } = options;
  const doc = options.document ?? document;
  const missingPolicy = options.missing ?? 'center';

  let index: number;
  if (options.at !== undefined) {
    index = steps.findIndex((step) => step.id === options.at);
    if (index === -1) return null;
  } else {
    const from = options.from ?? null;
    const origin = from === null ? -1 : steps.findIndex((step) => step.id === from);
    index =
      from === null || origin === -1
        ? direction === 1
          ? 0
          : steps.length - 1
        : origin + direction;
  }

  for (; index >= 0 && index < steps.length; index += direction) {
    if (aborted(signal)) return null;
    const step = steps[index] as Step;
    if (!available(step)) continue;

    let prepared = true;
    if (step.prepare !== undefined) {
      try {
        await step.prepare(signal ?? new AbortController().signal);
      } catch {
        prepared = false;
      }
      if (aborted(signal)) return null;
    }

    const named = step.target !== undefined && step.target !== null;
    if (!named) return { step, index, target: null, missing: false };

    const target = prepared
      ? await waitForTarget(step.target, {
          timeout: options.targetTimeout ?? 0,
          signal,
          document: doc,
        })
      : null;
    if (aborted(signal)) return null;

    if (target !== null) return { step, index, target, missing: false };
    if (missingPolicy === 'center') return { step, index, target: null, missing: true };
  }

  return null;
}

export type TourSideName = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

/**
 * Whether the viewport is in the compact size class — a phone held upright,
 * a narrow split screen. The threshold is the library's one (`COMPACT_BELOW`
 * in `@slotted/core/measure`), so a tour turns compact where a page does.
 */
export function isCompactViewport(view: Window | null = globalThis.window ?? null): boolean {
  return view !== null && view.innerWidth < COMPACT_BELOW;
}

/**
 * On a compact viewport a card beside its target has no room: a 16-rem card
 * and a button do not fit side by side in 375 pixels, and a flip to the other
 * side has less. The card goes below instead — above, when the positioner
 * flips it — and takes the width the viewport has.
 */
export function compactSide(side: TourSideName, compact: boolean): TourSideName {
  if (!compact) return side;
  return side === 'top' || side === 'bottom' ? side : 'bottom';
}

/** The least room, in pixels, a card needs above or below its target, and beside it. */
export const TOUR_ROOM = { block: 140, inline: 240 } as const;

/**
 * Whether any side of the target leaves a card room to stand on. Only the
 * part of the target that is on screen counts, so a target taller than the
 * viewport — a whole editor, a long chart — leaves none, and the card is
 * centred over it while the spotlight still frames it.
 */
export function cardFits(rect: TargetRect, viewport: { width: number; height: number }): boolean {
  const top = Math.max(rect.y, 0);
  const bottom = Math.min(rect.y + rect.height, viewport.height);
  const left = Math.max(rect.x, 0);
  const right = Math.min(rect.x + rect.width, viewport.width);
  const block = Math.max(top, viewport.height - bottom);
  if (block >= TOUR_ROOM.block) return true;
  if (viewport.width < COMPACT_BELOW) return false;
  return Math.max(left, viewport.width - right) >= TOUR_ROOM.inline;
}

/** Writes the rectangle the stylesheet cuts the spotlight from, or clears it. */
export function writeTargetRect(node: HTMLElement, rect: TargetRect | null): void {
  if (rect === null) {
    for (const name of Object.values(TOUR_TARGET_PROPERTIES)) node.style.removeProperty(name);
    return;
  }
  node.style.setProperty(TOUR_TARGET_PROPERTIES.x, `${rect.x}px`);
  node.style.setProperty(TOUR_TARGET_PROPERTIES.y, `${rect.y}px`);
  node.style.setProperty(TOUR_TARGET_PROPERTIES.width, `${rect.width}px`);
  node.style.setProperty(TOUR_TARGET_PROPERTIES.height, `${rect.height}px`);
}

export interface WatchTargetOptions {
  /** The target's viewport rectangle, at once and after every change. */
  onRect: (rect: TargetRect) => void;
  /** The target left the document. Called once. */
  onRemoved?: (() => void) | undefined;
}

/**
 * Keeps the spotlight on its target while the page scrolls, the window
 * resizes, the target resizes, or the target leaves the document. Scroll
 * listens in the capture phase, so a scroll inside any container — a dialog's
 * body, a drawer — moves it too; every report is coalesced to one animation
 * frame.
 *
 * Three movements none of those report are answered as well. A target inside
 * a dialog that is still arriving moves by `transform`, which no observer
 * sees: the end of any animation or transition in the document asks again,
 * and so do the first frames after the watch starts, until the rectangle
 * holds still. The visual viewport moves when a phone's keyboard opens or the
 * reader pinches, and it is listened to where the platform has one.
 */
export function watchTarget(target: Element, options: WatchTargetOptions): () => void {
  const doc = target.ownerDocument;
  const view = doc.defaultView;
  let frame = 0;
  let stopped = false;

  const report = () => {
    const rect = target.getBoundingClientRect();
    options.onRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
  };
  const schedule = () => {
    if (stopped || frame !== 0) return;
    const raf =
      view?.requestAnimationFrame ?? ((callback: FrameRequestCallback) => setTimeout(callback, 16));
    frame = raf(() => {
      frame = 0;
      if (!stopped) report();
    }) as unknown as number;
  };

  report();
  view?.addEventListener('scroll', schedule, { capture: true, passive: true });
  view?.addEventListener('resize', schedule, { passive: true });
  doc.addEventListener('animationend', schedule, true);
  doc.addEventListener('transitionend', schedule, true);
  const visual = view?.visualViewport ?? null;
  visual?.addEventListener('resize', schedule);
  visual?.addEventListener('scroll', schedule);

  /* The settle: every frame until the rectangle is the same twice, at most thirty. */
  const raf =
    view?.requestAnimationFrame.bind(view) ??
    ((callback: FrameRequestCallback) => setTimeout(callback, 16));
  const keyOf = (rect: DOMRect) => `${rect.left},${rect.top},${rect.width},${rect.height}`;
  let previous = keyOf(target.getBoundingClientRect());
  let settleFrames = 0;
  const settle = () => {
    if (stopped || settleFrames >= 30) return;
    settleFrames += 1;
    const rect = target.getBoundingClientRect();
    const key = keyOf(rect);
    if (key === previous) return;
    previous = key;
    options.onRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    raf(settle);
  };
  raf(settle);
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  resize?.observe(target);

  const removal = new MutationObserver(() => {
    if (target.isConnected || stopped) return;
    options.onRemoved?.();
    stop();
  });
  removal.observe(doc.documentElement, { childList: true, subtree: true });

  function stop() {
    if (stopped) return;
    stopped = true;
    view?.removeEventListener('scroll', schedule, { capture: true });
    view?.removeEventListener('resize', schedule);
    doc.removeEventListener('animationend', schedule, true);
    doc.removeEventListener('transitionend', schedule, true);
    visual?.removeEventListener('resize', schedule);
    visual?.removeEventListener('scroll', schedule);
    resize?.disconnect();
    removal.disconnect();
    if (frame !== 0) {
      (view?.cancelAnimationFrame ?? clearTimeout)(frame);
      frame = 0;
    }
  }

  return stop;
}

/**
 * Brings the target into view when any part of it is outside the viewport,
 * centred on the block axis, smooth unless the reader asked for less motion.
 * Resolves once the scroll has come to rest — on `scrollend` where the
 * platform has it, when the target's rectangle has held still for two frames
 * where it does not, and after a second at the latest — so a caller can wait
 * for the page before it shows what points at the target.
 */
export function scrollTargetIntoView(target: Element, signal?: AbortSignal): Promise<void> {
  const view = target.ownerDocument.defaultView;
  if (view === null) return Promise.resolve();
  const rect = target.getBoundingClientRect();
  const inside =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= view.innerHeight &&
    rect.right <= view.innerWidth;
  if (inside) return Promise.resolve();
  const reduce = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  target.scrollIntoView?.({
    block: 'center',
    inline: 'nearest',
    behavior: reduce ? 'auto' : 'smooth',
  });

  return new Promise((resolve) => {
    let done = false;
    let last = '';
    let still = 0;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(limit);
      view.removeEventListener('scrollend', finish, true);
      resolve();
    };
    const limit = setTimeout(finish, 1000);
    view.addEventListener('scrollend', finish, true);
    signal?.addEventListener('abort', finish, { once: true });
    const raf =
      view.requestAnimationFrame?.bind(view) ??
      ((callback: FrameRequestCallback) => setTimeout(callback, 16));
    const watch = () => {
      if (done) return;
      const now = target.getBoundingClientRect();
      const key = `${now.left},${now.top}`;
      still = key === last ? still + 1 : 0;
      last = key;
      if (still >= 2) finish();
      else raf(watch);
    };
    raf(watch);
  });
}

/**
 * Keeps a layer over the layer its target lives in — a dialog a step's
 * `prepare` opened. A single raise when the target is found is not enough:
 * the dialog finishes opening a moment later, adds its own layer after the
 * tour's and writes `inert` over it, and the tour stood under the dialog it
 * was pointing into, unreachable. This watches the portal root for both, and
 * calls `raise` whenever the layer stands before the target's or is inert
 * while the target is not. A target on the page under the layer is left alone.
 */
export function keepOverTarget(layer: Element, target: Element, raise: () => void): () => void {
  const parent = layer.parentElement;
  if (parent === null) return () => {};

  const inertAround = (node: Element) => node.closest('[inert]') !== null;
  const check = () => {
    if (!layer.isConnected || !target.isConnected || layer.contains(target)) return;
    /* Only a target in another layer of the same root: one on the page stays under the tour. */
    const home = [...parent.children].find((child) => child !== layer && child.contains(target));
    if (home === undefined) return;
    if (parent.lastElementChild !== layer || (inertAround(layer) && !inertAround(target))) raise();
  };

  check();
  const observer = new MutationObserver(check);
  observer.observe(parent.ownerDocument.documentElement, {
    attributes: true,
    attributeFilter: ['inert'],
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}
