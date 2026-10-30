/**
 * A bottom sheet the platform's own scroll moves.
 *
 * The layer is a scroll container whose `scrollTop` is the visible height of
 * the panel: a spacer the height of the layer comes first, then the panel, so
 * scrolling down the layer lifts the panel into view. The stops are snap
 * points — zero-height markers at each visible height, and the panel's own end
 * for the highest — with `scroll-snap-type: y mandatory`. The finger, the
 * fling and the landing are then the compositor's, as smooth as any scroll on
 * the page and indifferent to a busy main thread. This module only reads where
 * the scroll came to rest and lays the stops out.
 *
 * Lengths are pixels and extents are fractions of the layer's height.
 *
 * A travel the family asks for — the opening, the close, a stop the grabber
 * or a released mouse drag goes to — is not a smooth scroll, whose time and
 * curve are the browser's. The scroll jumps to the stop and the panel is
 * drawn where it was, then a Web Animations `transform` on the panel takes
 * that offset to nothing: on the compositor, as the scroll is, and in the
 * drawer's slide tokens. Up reads `--slotted-drawer-slide-duration` and
 * `--slotted-drawer-slide-easing`, down `--slotted-drawer-slide-exit-duration`
 * and `--slotted-drawer-slide-exit-easing`. The scrim's dim layer, which the
 * scroll drives, is animated along with the panel (`data-sheet-travel`), and
 * a close holds the sticky footer where the scroll left it.
 *
 * Opening forces no layout: the stops are read once the browser has laid the
 * layer out (`afterLayout`), written in the next frame, and the scroll up
 * begins after the layout that follows. A forced layout in the commit that
 * opens a layer costs hundreds of milliseconds on a throttled phone.
 */

import { afterLayout } from '../measure';
import { orderSnapPoints } from './extent';
import { contentLength } from './gesture';

/** How long a scroll with no event is taken as ended where `scrollend` is missing. */
const SCROLL_IDLE_MS = 150;
/** Two positions this close are the same stop. */
const SAME_PX = 2;

/** `scrollTo` where the element has it; a document with no layout engine only has `scrollTop`. */
function scrollLayer(layer: HTMLElement, top: number) {
  if (typeof layer.scrollTo === 'function') layer.scrollTo({ behavior: 'instant', top });
  else layer.scrollTop = top;
}

/** A CSS time in milliseconds, or `null` when it is not one. */
function milliseconds(time: string): number | null {
  const match = /^(-?[\d.]+)(ms|s)$/.exec(time.trim());
  if (match === null) return null;
  const value = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export interface SheetScrollOptions {
  /** The consumer's snap points, fractions of the layer. */
  readonly snapPoints: () => readonly number[];
  /** Whether the sheet rests at the height of its content (`size="content"`) or at its size step. */
  readonly content: () => boolean;
  /**
   * What a content sheet leaves above itself, a CSS length; and the size step,
   * a CSS length the panel resolves (`var(--_step)`).
   */
  readonly reserve: string;
  readonly step: string;
  /** Whether a scroll to the bottom closes the sheet. */
  readonly dismissible: () => boolean;
  /** A scroll came to rest: on a stop, or out of sight. */
  readonly onSettle: (at: number | 'close') => void;
  /** Every scrolled frame, the visible fraction. Passive; leave it out when nothing reads it. */
  readonly onScroll?: (at: number) => void;
}

export interface SheetScroll {
  /**
   * Measures the stops, lays the markers and the panel out, and puts the sheet
   * at `extent` at once. It reads layout where it stands: outside an opening.
   */
  layout(extent: number): void;
  /**
   * Where the sheet rests with no extent asked for: the content's height or
   * the size step, or with snap points the stop nearest to it. As last laid out.
   */
  rest(): number;
  /** The stops, lowest first, as last laid out. */
  stops(): readonly number[];
  /**
   * The opening: lays out, then scrolls the sheet up from out of sight to
   * `extent`, or to its rest when it is `undefined`. Reads after layout and
   * writes in a frame of its own, so nothing is laid out early.
   */
  enter(extent: number | undefined): void;
  /** Whether an opening is still under way: the stops may not be laid out yet. */
  busy(): boolean;
  /** Moves the sheet to `extent` in the slide tokens' time and curve, or at once. */
  scrollTo(extent: number, smooth: boolean): void;
  /** The visible fraction now; `1` while the content scrolls under a sheet at the top. */
  at(): number;
  /**
   * A drag that is not a touch — a mouse on the grabber — which no scroll
   * takes. The snap is off while it moves; the end goes to the nearest stop.
   */
  drag(): { move(distance: number): void; end(): void };
  destroy(): void;
}

export function attachSheetScroll(
  layer: HTMLElement,
  panel: HTMLElement,
  options: SheetScrollOptions,
): SheetScroll {
  const document = layer.ownerDocument;
  const view = document.defaultView;
  const markers = document.createElement('div');
  markers.setAttribute('data-part', 'stops');
  markers.setAttribute('data-part-stops', '');
  /**
   * Two lengths the stylesheet resolves — the reserve above a content sheet
   * and the size step — held by probes that stay in the layer, so the layout
   * that places the panel measures them too and reading them lays nothing out.
   */
  const probe = (length: string) => {
    const element = document.createElement('div');
    element.style.cssText = `position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:0;block-size:${length};visibility:hidden;pointer-events:none`;
    markers.append(element);
    return element;
  };
  const reserve = probe(options.reserve);
  const step = probe(options.step);
  const stopsBox = document.createElement('div');
  stopsBox.style.display = 'contents';
  markers.append(stopsBox);
  layer.append(markers);

  let stops: number[] = [];
  let span = 0;
  /** Whether the stops have been laid out since this sheet last opened. */
  let laidOut = false;

  /**
   * How far the panel's top is from the top of what scrolls: the layer's
   * height, or nothing while the spacer is folded away (see `anchor`).
   */
  let shift = 0;
  /** Where the sheet is, in the coordinates of an unfolded layer. */
  const position = () => layer.scrollTop + shift;
  const at = () => (span > 0 ? Math.min(position(), span) / span : 0);

  /**
   * The panel's content height. Under `drag="panel"` the rows take their
   * content and a last row takes what is left, so the parts' heights add up
   * to the content's; under `drag="resizer"` the body scrolls inside a
   * panel of fixed height, and its scroll height is what it holds.
   */
  const natural = () => {
    if (layer.getAttribute('data-drag') === 'resizer') {
      return contentLength(panel, panel.querySelector<HTMLElement>(':scope > [data-part="body"]'));
    }
    /* Heights and not positions: a sticky part is drawn away from where it stands. */
    let total = 0;
    let parts = 0;
    for (const child of panel.children) {
      if (!(child instanceof HTMLElement) || child.offsetHeight === 0) continue;
      total += child.offsetHeight;
      parts += 1;
    }
    const gap = Number.parseFloat(view?.getComputedStyle(panel).rowGap ?? '') || 0;
    return panel.clientTop + total + Math.max(0, parts - 1) * gap;
  };

  /** The rest, as a fraction: the content's height capped short of the layer, or the size step. */
  let restAt = 1;

  /** Everything the stops need, read and nothing written. */
  const measure = () => {
    const height = layer.clientHeight;
    const own = natural();
    const scrolls = own > height + SAME_PX;
    const rest =
      height <= 0
        ? 1
        : options.content()
          ? Math.min(own, height - reserve.offsetHeight) / height
          : Math.min(step.offsetHeight, height) / height;
    const snaps = orderSnapPoints(options.snapPoints());
    /* Past the top of a panel taller than the layer the content scrolls: it is no stop, the top is. */
    const candidates =
      snaps.length === 0 ? [rest] : options.content() && !scrolls ? [...snaps, rest] : snaps;
    const laid = [...new Set(candidates)].filter((stop) => stop > 0).sort((a, b) => a - b);
    if (scrolls && (laid.at(-1) ?? 0) < 1) laid.push(1);
    return { height, rest, scrolls, stops: laid };
  };

  /** The signature of what was last written, so a layout that changed nothing writes nothing. */
  let written = '';
  const apply = (measured: ReturnType<typeof measure>) => {
    span = measured.height;
    if (shift > 0) shift = span;
    restAt = measured.rest;
    stops = measured.stops;
    const positions = [...(options.dismissible() ? [0] : []), ...stops].map((stop) =>
      Math.round(stop * span),
    );
    const top = Math.round((stops.at(-1) ?? 1) * span);
    const floor = Math.round((stops[0] ?? 1) * span);
    const signature = `${String(measured.scrolls)} ${String(top)} ${String(floor)} ${positions.join(',')}`;
    if (signature === written) return;
    written = signature;
    layer.toggleAttribute('data-sheet-scrolls', measured.scrolls);
    panel.style.setProperty('--slotted-drawer-sheet-height', `${String(top)}px`);
    layer.style.setProperty('--slotted-drawer-sheet-floor', `${String(floor)}px`);
    stopsBox.replaceChildren(
      ...positions.map((offset) => {
        const marker = document.createElement('div');
        marker.setAttribute('data-part', 'stop');
        marker.setAttribute('data-part-stop', '');
        marker.style.insetBlockStart = `${String(offset)}px`;
        return marker;
      }),
    );
  };

  const lay = () => {
    apply(measure());
  };

  /** The fraction a resting scroll is at: the stop it sits on, exactly. */
  const resting = (): number | 'close' => {
    const top = position();
    if (options.dismissible() && top <= SAME_PX) return 'close';
    const stop = stops.find((value) => Math.abs(value * span - top) <= SAME_PX);
    return stop ?? at();
  };

  const markTop = () => {
    const top = stops.at(-1);
    layer.toggleAttribute(
      'data-top-stop',
      top !== undefined && Math.abs(top * span - position()) <= SAME_PX,
    );
  };

  /**
   * Content past the top is read with the snap off (`data-sheet-content`):
   * with it on, any layout — a render, a row arriving — re-snaps the panel to
   * its start and throws the reader back to the top of the list. The snap is
   * back the moment the sheet is below the top again. The sticky resizer and
   * header have content under them from then on (`data-stuck`), and paint a
   * surface of their own only then.
   */
  let reading = false;
  const read = (on: boolean) => {
    if (on === reading) return;
    reading = on;
    layer.toggleAttribute('data-sheet-content', on);
    stick(on);
  };
  /* shortcut: a header or resizer mounted while content is read stays unmarked until the next
     crossing; observe the panel's children when a consumer mounts one there. */
  const stick = (on: boolean) => {
    for (const part of panel.querySelectorAll(
      ':scope > [data-part="resizer"], :scope > [data-part="header"]',
    ))
      part.toggleAttribute('data-stuck', on);
  };

  /**
   * While content is read and no finger is down, the spacer above the panel is
   * folded away (`data-sheet-anchored`) and `scrollTop` moves by as much in the
   * same frame, so nothing on screen moves. The top of the content is then the
   * top of what scrolls: a fling out of the content ends there, on the
   * platform's own edge, as a nested list's does. Neither a written
   * `scrollTop` nor a hidden overflow ends a fling in Chrome; an edge does. A
   * finger on the sheet unfolds it first, so a pull from the top of the
   * content goes on moving the sheet down.
   */
  const anchor = (on: boolean) => {
    if (on === shift > 0) return;
    const top = position();
    shift = on ? span : 0;
    layer.toggleAttribute('data-sheet-anchored', on);
    layer.scrollTop = top - shift;
  };

  /** Off while a mouse drags, so a written `scrollTop` is not snapped under it. */
  let dragging = false;
  /** Fingers on the sheet: a scroll they move is a hand's, one without them a fling's. */
  let fingers = 0;
  /** The travel in flight: the panel's offset from where the scroll already is, easing to nothing. */
  let travel: Animation | null = null;
  /**
   * Ends a travel where it is drawn: the scroll takes the offset the panel
   * still had, so a finger that lands on a moving sheet holds it there.
   */
  const halt = () => {
    if (travel === null) return;
    const offset =
      view === null ? 0 : new view.DOMMatrixReadOnly(view.getComputedStyle(panel).transform).m42;
    travel.onfinish = null;
    travel.cancel();
    arrived();
    layer.scrollTop -= offset;
  };
  /** The scrim's dim layer along a travel, which the scroll that already landed would drive. */
  let dimming: Animation | null = null;
  /** What a travel wrote for its run, taken back: the snap, and the offset held for its first frame. */
  const arrived = () => {
    travel = null;
    dimming?.cancel();
    dimming = null;
    panel.style.removeProperty('transform');
    layer.removeAttribute('data-sheet-travel');
    layer.style.removeProperty('--slotted-drawer-sheet-dim');
    layer.style.removeProperty('--slotted-drawer-sheet-travel');
    /* An opening keeps it off until its own travel: the stops it would snap to are not laid out. */
    if (!dragging && laidOut) layer.style.removeProperty('scroll-snap-type');
  };
  /** Between an opening's first frame, out of sight, and its arrival: that bottom is no close. */
  let entering = false;
  const settle = () => {
    moving = false;
    /* Nothing is laid out to settle on yet: the stops come with the opening's frame. */
    if (dragging || travel !== null || !laidOut) return;
    if (entering) {
      if (position() <= SAME_PX) return;
      entering = false;
    }
    markTop();
    const inContent = position() > span + SAME_PX;
    read(inContent);
    if (inContent && fingers === 0) anchor(true);
    options.onSettle(resting());
  };

  const touched = (event: TouchEvent) => {
    fingers = event.touches.length;
    if (fingers > 0) halt();
    if (fingers > 0) anchor(false);
    else if (reading) anchor(true);
  };
  layer.addEventListener('touchstart', touched, { passive: true });
  layer.addEventListener('touchend', touched, { passive: true });
  layer.addEventListener('touchcancel', touched, { passive: true });

  const native = view !== null && 'onscrollend' in view;
  let idle: ReturnType<typeof setTimeout> | undefined;
  /** Between the first scroll event and the settle: a written position would cut it short. */
  let moving = false;
  const scrolled = () => {
    moving = true;
    const top = position();
    /* Past the top the content is read with no snap, from the frame the scroll gets there. */
    if (!reading && top > span + SAME_PX) read(true);
    else if (reading && top < span - SAME_PX) read(false);
    options.onScroll?.(at());
    if (native) return;
    clearTimeout(idle);
    idle = setTimeout(settle, SCROLL_IDLE_MS);
  };
  layer.addEventListener('scroll', scrolled, { passive: true });
  if (native) layer.addEventListener('scrollend', settle);

  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          /* The first report, and any before the opening has laid out, is the opening's. */
          if (!laidOut) return;
          /* Content scrolled past the top keeps its place; a sheet on a stop keeps its stop. */
          const raw = position();
          const scrolled = raw > span + SAME_PX;
          const extent = at();
          const before = written;
          lay();
          /* A scroll in flight — an opening, a close, a fling — keeps going. */
          if (entering || moving || written === before) return;
          const wanted = (scrolled ? raw : extent * span) - shift;
          if (Math.abs(layer.scrollTop - wanted) > 1) layer.scrollTop = wanted;
        });
  observer?.observe(layer);
  observer?.observe(panel);

  /** The opening in flight, and how to call it off. */
  let pending: (() => void) | null = null;
  /** A document with no layout engine reads and writes at once, as `afterLayout` does there. */
  const deferred = view !== null && typeof view.ResizeObserver === 'function';
  const nextFrame = (work: () => void) => {
    if (!deferred) {
      work();
      return () => undefined;
    }
    const id = view.requestAnimationFrame(work);
    return () => view.cancelAnimationFrame(id);
  };

  const nearestRest = () =>
    stops.reduce(
      (best, stop) => (Math.abs(stop - restAt) < Math.abs(best - restAt) ? stop : best),
      stops[0] ?? restAt,
    );

  /** The slide tokens for a travel up (`enter`) or down (`exit`), as the drawer's stylesheet reads them. */
  const slide = (exit: boolean): KeyframeAnimationOptions | null => {
    if (view === null) return null;
    const style = view.getComputedStyle(layer);
    const read = (name: string) => style.getPropertyValue(name).trim();
    const duration = milliseconds(
      read(exit ? '--slotted-drawer-slide-exit-duration' : '--slotted-drawer-slide-duration') ||
        read(exit ? '--slotted-duration-medium' : '--slotted-duration-long'),
    );
    if (duration === null) return null;
    return {
      duration,
      easing:
        read(exit ? '--slotted-drawer-slide-exit-easing' : '--slotted-drawer-slide-easing') ||
        read(exit ? '--slotted-easing-exit' : '--slotted-easing-standard') ||
        'ease',
    };
  };

  /**
   * The scroll is put on `top` at once — a stop, so the snap keeps it — and
   * the panel is drawn where it was and animated there. A travel with no
   * motion — reduced motion, no Web Animations, no distance — is the jump.
   */
  const glide = (top: number, smooth: boolean) => {
    halt();
    const from = layer.scrollTop;
    const reduced =
      typeof view?.matchMedia === 'function' &&
      view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timing =
      smooth && !reduced && typeof panel.animate === 'function' && Math.abs(top - from) > 1
        ? slide(top < from)
        : null;
    scrollLayer(layer, top);
    if (timing === null) return;
    const offset = `translateY(${String(layer.scrollTop - from)}px)`;
    /* The panel's snap area is its transformed box: snapped, the scroll would follow the offset. */
    layer.style.scrollSnapType = 'none';
    /* An animation made after this frame's style applies from the next one; the scroll lands in this one. */
    panel.style.transform = offset;
    try {
      travel = panel.animate([{ transform: offset }, { transform: 'none' }], timing);
    } catch {
      /* An easing the engine cannot parse: the jump. */
      arrived();
      return;
    }
    travel.onfinish = () => {
      arrived();
      settle();
    };
    dim(from, layer.scrollTop, timing);
    /* A transform takes no part in sticky positioning: closed, the scroll would stick the footer to the panel's top. */
    if (layer.scrollTop <= SAME_PX) {
      layer.style.setProperty(
        '--slotted-drawer-sheet-travel',
        `${String(from - layer.scrollTop)}px`,
      );
    }
  };

  /**
   * The dim layer from where the panel is drawn to where it goes, on the
   * travel's curve. Its value is held on the layer for the first frame, as the
   * panel's offset is; it is whole from the lowest stop up, so a travel across
   * that stop reaches it at the point of the curve where the panel does.
   */
  const dim = (from: number, to: number, timing: KeyframeAnimationOptions) => {
    const backdrop = layer.querySelector<HTMLElement>(':scope > [data-part="backdrop"]');
    if (backdrop === null) return;
    const floor = Math.round((stops[0] ?? 1) * span);
    const share = (top: number) => (floor > 0 ? Math.min(top / floor, 1) : 1);
    const keyframes: Keyframe[] = [{ opacity: share(from) }, { opacity: share(to) }];
    if ((from - floor) * (to - floor) < 0) {
      keyframes.splice(1, 0, { offset: (floor - from) / (to - from), opacity: 1 });
    }
    layer.style.setProperty('--slotted-drawer-sheet-dim', String(share(from)));
    layer.setAttribute('data-sheet-travel', '');
    try {
      dimming = backdrop.animate(keyframes, { ...timing, pseudoElement: '::before' });
    } catch {
      /* No pseudo-element animations: the layer is held at the start until the panel arrives. */
    }
  };

  const scrollToExtent = (extent: number, smooth: boolean) => {
    anchor(false);
    glide(extent * span, smooth);
  };

  return {
    layout(extent) {
      pending?.();
      pending = null;
      halt();
      anchor(false);
      read(false);
      lay();
      laidOut = true;
      layer.style.removeProperty('scroll-snap-type');
      layer.setAttribute('data-sheet-ready', '');
      layer.scrollTop = extent * span;
      markTop();
    },

    rest: nearestRest,

    stops: () => stops,

    busy: () => entering || !laidOut,

    enter(extent) {
      pending?.();
      entering = true;
      laidOut = false;
      layer.removeAttribute('data-sheet-ready');
      /* Off before the exit is cut short, and until the travel starts: the scroll lands between stops, and the snap would jump it to one. */
      layer.style.scrollSnapType = 'none';
      halt();
      anchor(false);
      read(false);
      let measured: ReturnType<typeof measure> | null = null;
      let cancelFrame: () => void = () => undefined;
      let cancelStart: () => void = () => undefined;
      const cancelRead = afterLayout(
        document,
        () => {
          measured = measure();
        },
        () => {
          cancelFrame = nextFrame(() => {
            if (measured === null) return;
            apply(measured);
            laidOut = true;
            /* The snap comes on with the stops it snaps to; before, it snapped the panel's end. */
            layer.setAttribute('data-sheet-ready', '');
            cancelStart = afterLayout(document, () => {
              const target = extent ?? nearestRest();
              scrollToExtent(target, true);
              if (travel === null) layer.style.removeProperty('scroll-snap-type');
              /* An opening that arrived at once — reduced motion, no Web Animations — is over. */
              if (Math.abs(position() - target * span) <= SAME_PX) entering = false;
            });
          });
        },
      );
      pending = () => {
        cancelRead();
        cancelFrame();
        cancelStart();
      };
    },

    scrollTo: scrollToExtent,

    at,

    drag() {
      halt();
      anchor(false);
      dragging = true;
      const from = layer.scrollTop;
      layer.style.scrollSnapType = 'none';
      return {
        move(distance) {
          layer.scrollTop = from + distance;
        },
        end() {
          const top = layer.scrollTop;
          const positions = [...(options.dismissible() ? [0] : []), ...stops].map(
            (stop) => stop * span,
          );
          const nearest = positions.reduce(
            (best, value) => (Math.abs(value - top) < Math.abs(best - top) ? value : best),
            positions[0] ?? top,
          );
          layer.style.removeProperty('scroll-snap-type');
          dragging = false;
          glide(nearest, true);
          /* No travel to wait for: the jump has landed, or there was nowhere to go. */
          if (travel === null) settle();
        },
      };
    },

    destroy() {
      pending?.();
      travel?.cancel();
      arrived();
      observer?.disconnect();
      clearTimeout(idle);
      layer.removeEventListener('scroll', scrolled);
      layer.removeEventListener('touchstart', touched);
      layer.removeEventListener('touchend', touched);
      layer.removeEventListener('touchcancel', touched);
      layer.removeEventListener('scrollend', settle);
      markers.remove();
      panel.style.removeProperty('--slotted-drawer-sheet-height');
      layer.style.removeProperty('--slotted-drawer-sheet-floor');
      layer.removeAttribute('data-top-stop');
      layer.removeAttribute('data-sheet-scrolls');
      layer.removeAttribute('data-sheet-content');
      stick(false);
      layer.removeAttribute('data-sheet-anchored');
      layer.removeAttribute('data-sheet-ready');
    },
  };
}
