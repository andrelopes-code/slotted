/**
 * Where a layer sits on screen, and what the stylesheet is told about it.
 *
 * The engine is `@floating-ui/dom`, adopted by `docs/product/prd.md` §20.1. Measuring an anchor correctly means
 * answering a scaled ancestor, a nested scroll container that clips, an
 * `offsetParent` that is not the containing block, a `fixed` subtree and a
 * document in an iframe, and the library that has answered them for years is a
 * better bet than the answer written here in an afternoon.
 *
 * It stays invisible. `docs/component-features.md` §3 requires that the
 * contract expose neither Floating UI nor any other engine, so no type, option
 * name or return value of it appears below — which is also what keeps CSS
 * Anchor Positioning available as a replacement once every engine can answer
 * it.
 *
 * What lands on the floating element is the whole output: the position, the
 * side and alignment as attributes, and five custom properties a stylesheet
 * needs and cannot compute — the anchor's size, the space that is left, and the
 * origin an animation grows from. `transform` is deliberately not touched: the
 * enter and exit animations of every overlay family in this wave are transforms,
 * and a positioner that owns the property takes it from them.
 */

import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip as flipMiddleware,
  hide as hideMiddleware,
  offset as offsetMiddleware,
  shift as shiftMiddleware,
  size as sizeMiddleware,
} from '@floating-ui/dom';

import type { PhysicalSide, PositionAlign, PositionSide, WritingDirection } from './geometry';
import { fromPlacement, resolveSide, toPlacement, transformOrigin } from './geometry';

/** An element, or anything that can report a rectangle — a pointer, a text range. */
export type PositionerAnchor = Element | { getBoundingClientRect: () => DOMRect };

/** Every custom property the module writes, named once so a family can read them back. */
export const POSITIONER_PROPERTIES = {
  anchorWidth: '--slotted-positioner-anchor-width',
  anchorHeight: '--slotted-positioner-anchor-height',
  availableWidth: '--slotted-positioner-available-width',
  availableHeight: '--slotted-positioner-available-height',
  transformOrigin: '--slotted-positioner-transform-origin',
  arrowX: '--slotted-positioner-arrow-x',
  arrowY: '--slotted-positioner-arrow-y',
} as const;

export interface PositionerOptions {
  side?: PositionSide;
  align?: PositionAlign;
  /** Distance from the anchor, along the side. */
  sideOffset?: number;
  /** Distance along the alignment axis. */
  alignOffset?: number;
  /** Move to the opposite side when this one collides. Default `true`. */
  flip?: boolean;
  /** Sides to try after the opposite one. */
  fallbackSides?: PositionSide[];
  /** Slide along the side to stay inside the boundary. Default `true`. */
  shift?: boolean;
  /** What the layer collides with. Defaults to the clipping ancestors. */
  boundary?: Element | Element[];
  boundaryPadding?: number;
  strategy?: 'absolute' | 'fixed';
  /** The element the family draws as the arrow. It is measured, never moved. */
  arrow?: HTMLElement | null;
  arrowPadding?: number;
  /** Report the anchor as gone once it is scrolled out of its clipper. Default `false`. */
  hideWhenDetached?: boolean;
  /**
   * The layer is as wide as its anchor — the stylesheet reads the width this
   * module publishes — so along that width there is nowhere better for it than
   * over the anchor. It is centred on the anchor and never slid along it: a
   * slide that keeps the boundary padding moves a popup off the control it
   * belongs to, for no room gained. A layer wider than the anchor by a frame
   * (a padding the family draws around its panel) is centred the same way, so
   * the panel and the anchor share an edge. Default `false`.
   */
  matchWidth?: boolean;
  onPositioned?: (position: ResolvedPosition) => void;
}

export interface ResolvedPosition {
  side: PhysicalSide;
  align: PositionAlign;
  x: number;
  y: number;
  anchorWidth: number;
  anchorHeight: number;
  availableWidth: number;
  availableHeight: number;
  transformOrigin: string;
  arrowX: number | undefined;
  arrowY: number | undefined;
  /** The anchor left the screen, or left the document. */
  detached: boolean;
}

export interface PositionerHandle {
  /** Measures and writes once. Resolves when the element has been positioned. */
  update: () => Promise<void>;
  setAnchor: (anchor: PositionerAnchor) => void;
  setOptions: (options: Partial<PositionerOptions>) => void;
  destroy: () => void;
}

const SIDE_ATTRIBUTE = 'data-side';
/**
 * Written once the layer has been placed. A stylesheet keys the entrance on it,
 * so a layer written open in static markup — a harness page, a docs snippet —
 * is simply there, and only a layer the module placed arrives.
 */
const POSITIONED_ATTRIBUTE = 'data-positioned';
const ALIGN_ATTRIBUTE = 'data-align';
const DETACHED_ATTRIBUTE = 'data-detached';

function anchorElement(anchor: PositionerAnchor): Element | null {
  return anchor instanceof Element ? anchor : null;
}

/**
 * The direction the layer is written in, taken from the nearest ancestor that
 * declares one. `dir` is what the portal mirrors onto a layer it moved, so a
 * portalled layer resolves `inline-start` the way the region it came from would.
 */
function writingDirection(floating: HTMLElement): WritingDirection {
  const declared = floating.closest('[dir]')?.getAttribute('dir');
  if (declared === 'rtl' || declared === 'ltr') return declared;
  const computed = floating.ownerDocument.defaultView?.getComputedStyle(floating).direction;
  return computed === 'rtl' ? 'rtl' : 'ltr';
}

export function createPositioner(
  anchor: PositionerAnchor,
  floating: HTMLElement,
  options: PositionerOptions = {},
): PositionerHandle {
  let current = anchor;
  let settings: PositionerOptions = { ...options };
  let stopAutoUpdate: (() => void) | null = null;
  let destroyed = false;
  /* Only the newest measurement may write: an earlier one resolving late is stale. */
  let generation = 0;

  function measure(element: HTMLElement | null | undefined) {
    if (!element) return { width: 0, height: 0 };
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  /**
   * A measurement requested and not yet begun. Every request made before it
   * begins shares it: the first watch and the family's own first `update()`
   * arrive in the same task, and each measurement walks every scrolling
   * ancestor of the anchor. A request made while one is running schedules the
   * next, so the newest state of the document is always measured.
   */
  let scheduled: Promise<void> | null = null;

  function update(): Promise<void> {
    if (destroyed) return Promise.resolve();
    scheduled ??= Promise.resolve().then(() => {
      scheduled = null;
      return measureAndWrite();
    });
    return scheduled;
  }

  async function measureAndWrite(): Promise<void> {
    if (destroyed) return;
    const token = ++generation;

    const direction = writingDirection(floating);
    const side = resolveSide(settings.side ?? 'bottom', direction);
    const align = settings.align ?? 'center';
    /* Only along the anchor's width: a layer beside its anchor still slides. */
    const matched = settings.matchWidth === true && (side === 'top' || side === 'bottom');
    const placementAlign = matched ? 'center' : align;
    const strategy = settings.strategy ?? 'absolute';
    const padding = settings.boundaryPadding ?? 0;
    const element = anchorElement(current);

    /**
     * An anchor that left the document cannot come back as the same node, so
     * the loop stops rather than measuring a rectangle of zeroes forever. An
     * anchor merely scrolled out of view is a different case, below.
     */
    if (element && !element.isConnected) {
      floating.setAttribute(DETACHED_ATTRIBUTE, '');
      stopAutoUpdate?.();
      stopAutoUpdate = null;
      return;
    }

    let availableWidth = 0;
    let availableHeight = 0;

    const middleware = [
      offsetMiddleware({
        mainAxis: settings.sideOffset ?? 0,
        crossAxis: settings.alignOffset ?? 0,
      }),
      ...(settings.flip === false
        ? []
        : [
            flipMiddleware({
              padding,
              ...(settings.boundary ? { boundary: settings.boundary } : {}),
              ...(settings.fallbackSides
                ? {
                    fallbackPlacements: settings.fallbackSides.map((fallback) =>
                      toPlacement(resolveSide(fallback, direction), placementAlign),
                    ),
                  }
                : {}),
            }),
          ]),
      ...(settings.shift === false
        ? []
        : [
            shiftMiddleware({
              mainAxis: !matched,
              padding,
              ...(settings.boundary ? { boundary: settings.boundary } : {}),
            }),
          ]),
      sizeMiddleware({
        padding,
        ...(settings.boundary ? { boundary: settings.boundary } : {}),
        apply(data) {
          availableWidth = data.availableWidth;
          availableHeight = data.availableHeight;
        },
      }),
      ...(settings.arrow
        ? [arrowMiddleware({ element: settings.arrow, padding: settings.arrowPadding ?? 0 })]
        : []),
      ...(settings.hideWhenDetached === true ? [hideMiddleware({ padding })] : []),
    ];

    /**
     * One reading of the anchor for everything written below. The engine
     * takes its own inside `computePosition`, and nothing lays out between the
     * two: the awaits are microtasks, and the document does not change under
     * a microtask.
     */
    const anchorRect = current.getBoundingClientRect();
    const result = await computePosition(current, floating, {
      placement: toPlacement(side, placementAlign),
      strategy,
      middleware,
    });
    if (destroyed || token !== generation) return;

    const placed = fromPlacement(result.placement);
    /* Over an anchor of its own width, start, centre and end are one place;
       the attribute keeps the consumer's word for it. */
    const resolved = { side: placed.side, align: matched ? align : placed.align };
    const arrowData = result.middlewareData.arrow;
    const arrowSize = measure(settings.arrow);
    const detached = result.middlewareData.hide?.referenceHidden === true;

    const origin = transformOrigin(
      resolved.side,
      resolved.align,
      direction,
      settings.arrow ? { x: arrowData?.x, y: arrowData?.y, ...arrowSize } : undefined,
    );

    floating.style.position = strategy;
    floating.style.left = `${result.x}px`;
    floating.style.top = `${result.y}px`;
    floating.setAttribute(SIDE_ATTRIBUTE, resolved.side);
    floating.setAttribute(ALIGN_ATTRIBUTE, resolved.align);
    floating.setAttribute(POSITIONED_ATTRIBUTE, '');
    if (detached) floating.setAttribute(DETACHED_ATTRIBUTE, '');
    else floating.removeAttribute(DETACHED_ATTRIBUTE);

    const properties = POSITIONER_PROPERTIES;
    floating.style.setProperty(properties.anchorWidth, `${anchorRect.width}px`);
    floating.style.setProperty(properties.anchorHeight, `${anchorRect.height}px`);
    floating.style.setProperty(properties.availableWidth, `${availableWidth}px`);
    floating.style.setProperty(properties.availableHeight, `${availableHeight}px`);
    floating.style.setProperty(properties.transformOrigin, origin);

    if (arrowData?.x !== undefined) {
      floating.style.setProperty(properties.arrowX, `${arrowData.x}px`);
    }
    if (arrowData?.y !== undefined) {
      floating.style.setProperty(properties.arrowY, `${arrowData.y}px`);
    }

    settings.onPositioned?.({
      side: resolved.side,
      align: resolved.align,
      x: result.x,
      y: result.y,
      anchorWidth: anchorRect.width,
      anchorHeight: anchorRect.height,
      availableWidth,
      availableHeight,
      transformOrigin: origin,
      arrowX: arrowData?.x,
      arrowY: arrowData?.y,
      detached,
    });
  }

  /**
   * The anchor's size, the layer's own size, every scroll between them and the
   * viewport. The floating element's own growth is the one the Angular CDK's
   * reposition strategy misses, and it is what an async list arriving in an
   * open popover does.
   */
  function watch() {
    stopAutoUpdate?.();
    stopAutoUpdate = autoUpdate(current, floating, () => {
      void update();
    });
  }

  /**
   * The watch starts in the frame after creation. Starting it walks every
   * scrolling ancestor of both elements through their computed style and
   * reads the anchor's box for the layout-shift observer: in the task that
   * opens a layer, after the layer's nodes were written, each of those reads is
   * a style recalculation the first frame waits for. The first position is the
   * family's own `update()`; a change in the frame before the watch starts is
   * caught by the watch's own first measurement.
   */
  let watchFrame = 0;
  const view = floating.ownerDocument.defaultView;
  if (view !== null && typeof view.requestAnimationFrame === 'function') {
    watchFrame = view.requestAnimationFrame(() => {
      watchFrame = 0;
      if (!destroyed) watch();
    });
  } else {
    watch();
  }

  return {
    update,
    setAnchor(next) {
      current = next;
      if (destroyed || watchFrame !== 0) return;
      watch();
    },
    setOptions(next) {
      settings = { ...settings, ...next };
      void update();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (watchFrame !== 0) view?.cancelAnimationFrame(watchFrame);
      stopAutoUpdate?.();
      stopAutoUpdate = null;
    },
  };
}
