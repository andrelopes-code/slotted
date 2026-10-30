/**
 * The stage of a media viewer: a scroll container holding one picture. The
 * controller listens to the wheel, the pointers and the keys, and asks for a
 * level, a turn, a step or a close; it never holds that state. A binding owns
 * it, controlled or not, and calls `update()` once the state it accepted is
 * rendered: the controller then sizes the picture and moves the stage's
 * scroll in the same frame, so the point the request was made around stays
 * still.
 *
 * At the fit and with no turn the stylesheet sizes the picture alone, and the
 * controller writes nothing (`media-viewer.css` › the frame).
 *
 * Nothing reads `document` at import time.
 */

import {
  CLICK_SLOP,
  clampZoom,
  fitScale,
  pointFraction,
  scrollKeeping,
  swipeIntent,
  turned,
  wheelZoom,
  type Box,
  type Point,
  type Rotation,
  type Size,
} from './view';

export type MediaStageReason = 'pointer' | 'keyboard';
export type MediaStageStep = 'next' | 'previous' | 'first' | 'last';

export interface MediaStageState {
  readonly zoom: number;
  readonly rotation: Rotation;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly zoomStep: number;
  /** The item is a picture: the level, the turn and the pan apply. */
  readonly zoomable: boolean;
}

export interface MediaStageOptions {
  /** The scroll container, `[data-part="stage"]`. */
  readonly stage: HTMLElement;
  /** The element whose keys the viewer answers, the family's root. */
  readonly keys: HTMLElement;
  readonly getState: () => MediaStageState;
  readonly onZoomRequest: (zoom: number, reason: MediaStageReason, event: Event) => void;
  readonly onRotationRequest: (rotation: Rotation, reason: MediaStageReason, event: Event) => void;
  readonly onStepRequest: (step: MediaStageStep, reason: MediaStageReason, event: Event) => void;
  readonly onCloseRequest: (reason: 'pointer' | 'outsidePress', event: Event) => void;
}

export interface MediaStageHandle {
  /** Size the picture for the state the binding rendered, around the point the last request named. */
  update(): void;
  /** Ask for a level around the stage's centre, for a button. */
  requestZoom(zoom: number, reason: MediaStageReason, event: Event): void;
  destroy(): void;
}

/** Where the family's keys give way to the element that holds focus. */
const OWN_KEYS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], video, audio, iframe';
const FRAME_VARIABLES = [
  '--slotted-media-viewer-frame-inline-size',
  '--slotted-media-viewer-frame-block-size',
  '--slotted-media-viewer-media-inline-size',
  '--slotted-media-viewer-media-block-size',
  '--slotted-media-viewer-rotation',
] as const;

/** Requests this close in place are one gesture: a wheel's run, a pinch, a held key. */
const GESTURE_SLOP = 2;

interface Press {
  readonly id: number;
  readonly type: string;
  readonly start: Point;
  readonly time: number;
  last: Point;
}

interface Pinch {
  readonly distance: number;
  readonly zoom: number;
}

export function createMediaStage(options: MediaStageOptions): MediaStageHandle {
  const { stage, keys } = options;
  const presses = new Map<number, Press>();
  let pinch: Pinch | null = null;
  let moved = false;
  /*
   * The spot of the picture a gesture started on, held for the whole gesture:
   * re-reading it at every step lost what the centring took while the picture
   * still fitted an axis, and the spot drifted from under the pointer. The
   * gesture lasts while the pointer stays put and the scroll is the one the
   * controller left: a pause between two turns of the wheel keeps it, a pan or
   * a key in between starts a new one.
   */
  let gesture: { point: Point; fraction: Point; scroll: Point | null } | null = null;
  let anchor: { zoom: number; point: Point } | null = null;
  let applied: { zoom: number; rotation: Rotation } | null = null;

  const media = () => stage.querySelector<HTMLImageElement>('img[data-part="media"]');
  const frame = () => stage.querySelector<HTMLElement>('[data-part="frame"]');
  const centre = (): Point => ({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
  const rtl = () => getComputedStyle(keys).direction === 'rtl';

  const local = (event: { clientX: number; clientY: number }): Point => {
    const rect = stage.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const request = (zoom: number, point: Point, reason: MediaStageReason, event: Event) => {
    const state = options.getState();
    const next = clampZoom(zoom, state.minZoom, state.maxZoom);
    if (!state.zoomable || next === state.zoom) return;

    const continued =
      gesture !== null &&
      Math.hypot(gesture.point.x - point.x, gesture.point.y - point.y) <= GESTURE_SLOP &&
      (gesture.scroll === null ||
        Math.hypot(gesture.scroll.x - stage.scrollLeft, gesture.scroll.y - stage.scrollTop) <= 1);
    const current = box();
    if (!continued && current !== null) {
      const scroll = { x: stage.scrollLeft, y: stage.scrollTop };
      gesture = { point, fraction: pointFraction(point, scroll, current), scroll: null };
    }

    anchor = { zoom: next, point };
    options.onZoomRequest(next, reason, event);
  };

  const onWheel = (event: WheelEvent) => {
    const state = options.getState();
    if (!state.zoomable) return;

    event.preventDefault();
    const zoom = wheelZoom(state.zoom, event, state.zoomStep, stage.clientHeight);
    request(zoom, local(event), 'pointer', event);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const point = { x: event.clientX, y: event.clientY };
    presses.set(event.pointerId, {
      id: event.pointerId,
      type: event.pointerType,
      start: point,
      time: event.timeStamp,
      last: point,
    });
    moved = false;

    if (presses.size === 2) {
      const [a, b] = [...presses.values()];
      pinch = { distance: distance(a!.last, b!.last), zoom: options.getState().zoom };
      moved = true;
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const press = presses.get(event.pointerId);
    if (press === undefined) return;

    const point = { x: event.clientX, y: event.clientY };
    const dx = point.x - press.last.x;
    const dy = point.y - press.last.y;
    press.last = point;
    if (Math.hypot(point.x - press.start.x, point.y - press.start.y) > CLICK_SLOP) moved = true;

    if (pinch !== null && presses.size === 2) {
      const [a, b] = [...presses.values()];
      const middle = { x: (a!.last.x + b!.last.x) / 2, y: (a!.last.y + b!.last.y) / 2 };
      request(
        pinch.zoom * (distance(a!.last, b!.last) / pinch.distance),
        local({ clientX: middle.x, clientY: middle.y }),
        'pointer',
        event,
      );

      return;
    }

    const state = options.getState();
    if (!moved || !state.zoomable || state.zoom <= 1) return;

    if (!stage.hasAttribute('data-panning')) {
      stage.setAttribute('data-panning', '');
      stage.setPointerCapture?.(event.pointerId);
    }
    stage.scrollLeft -= dx;
    stage.scrollTop -= dy;
  };

  const onPointerEnd = (event: PointerEvent) => {
    const press = presses.get(event.pointerId);
    if (press === undefined) return;

    presses.delete(event.pointerId);
    stage.removeAttribute('data-panning');
    if (presses.size < 2) pinch = null;
    if (event.type === 'pointercancel' || press.type !== 'touch') return;

    const state = options.getState();
    if (state.zoom > 1 || presses.size > 0) return;

    const intent = swipeIntent(
      press.last.x - press.start.x,
      press.last.y - press.start.y,
      event.timeStamp - press.time,
      stage.clientHeight,
      rtl(),
    );
    if (intent === 'close') options.onCloseRequest('pointer', event);
    else if (intent !== null) options.onStepRequest(intent, 'pointer', event);
  };

  /* The ground is the stage and the frame around the picture; a press that travelled is a gesture. */
  const onClick = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (moved || target === null) return;
    if (target !== stage && target.getAttribute('data-part') !== 'frame') return;

    options.onCloseRequest('outsidePress', event);
  };

  const onDoubleClick = (event: MouseEvent) => {
    const state = options.getState();
    if (
      !state.zoomable ||
      (event.target as Element | null)?.getAttribute('data-part') !== 'media'
    ) {
      return;
    }

    request(state.zoom > 1 ? 1 : Math.min(2, state.maxZoom), local(event), 'pointer', event);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as Element | null)?.closest?.(OWN_KEYS)) return;

    if (handleKey(event)) event.preventDefault();
  };

  const handleKey = (event: KeyboardEvent): boolean => {
    const state = options.getState();
    const zoomed = state.zoomable && state.zoom > 1;
    const panX = stage.clientWidth / 10;
    const panY = stage.clientHeight / 10;
    const forward = rtl() ? 'ArrowLeft' : 'ArrowRight';

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        if (zoomed) {
          stage.scrollLeft += event.key === 'ArrowRight' ? panX : -panX;
        } else {
          options.onStepRequest(event.key === forward ? 'next' : 'previous', 'keyboard', event);
        }
        return true;
      case 'ArrowUp':
      case 'ArrowDown':
        if (!zoomed) return false;
        stage.scrollTop += event.key === 'ArrowDown' ? panY : -panY;
        return true;
      case 'Home':
        options.onStepRequest('first', 'keyboard', event);
        return true;
      case 'End':
        options.onStepRequest('last', 'keyboard', event);
        return true;
      case '+':
      case '=':
        if (!state.zoomable) return false;
        request(state.zoom + state.zoomStep, centre(), 'keyboard', event);
        return true;
      case '-':
        if (!state.zoomable) return false;
        request(state.zoom - state.zoomStep, centre(), 'keyboard', event);
        return true;
      case '0':
        if (!state.zoomable) return false;
        request(1, centre(), 'keyboard', event);
        return true;
      case 'r':
      case 'R':
        if (!state.zoomable) return false;
        options.onRotationRequest(((state.rotation + 90) % 360) as Rotation, 'keyboard', event);
        return true;
      default:
        return false;
    }
  };

  /* The picture's box in the stage's scrolled content: the frame when it is sized, the picture otherwise. */
  const box = (): Box | null => {
    const sized = frame();
    const element = sized?.hasAttribute('data-sized') ? sized : media();
    if (element === null) return null;

    const rect = element.getBoundingClientRect();
    const origin = stage.getBoundingClientRect();

    return {
      left: rect.left - origin.left + stage.scrollLeft,
      top: rect.top - origin.top + stage.scrollTop,
      width: rect.width,
      height: rect.height,
    };
  };

  const natural = (picture: HTMLImageElement): Size => ({
    width: picture.naturalWidth || Number(picture.getAttribute('width')) || 0,
    height: picture.naturalHeight || Number(picture.getAttribute('height')) || 0,
  });

  const update = () => {
    const state = options.getState();
    const picture = media();
    const target = frame();
    const zoom = state.zoomable ? state.zoom : 1;
    const rotation = state.zoomable ? state.rotation : 0;
    stage.toggleAttribute('data-zoomed', zoom > 1);
    if (picture === null || target === null) {
      applied = null;
      return;
    }

    const before = box();
    const sized = zoom !== 1 || rotation !== 0;
    if (sized) {
      const size = natural(picture);
      const scale =
        fitScale(size, { width: stage.clientWidth, height: stage.clientHeight }, rotation) * zoom;
      const drawn = { width: size.width * scale, height: size.height * scale };
      const outer = turned(drawn, rotation);
      const values = [outer.width, outer.height, drawn.width, drawn.height];
      FRAME_VARIABLES.slice(0, 4).forEach((name, index) => {
        target.style.setProperty(name, `${String(values[index])}px`);
      });
      target.style.setProperty('--slotted-media-viewer-rotation', `${String(rotation)}deg`);
      target.setAttribute('data-sized', '');
    } else {
      for (const name of FRAME_VARIABLES) target.style.removeProperty(name);
      target.removeAttribute('data-sized');
    }

    const changed = applied !== null && applied.zoom !== zoom;
    const after = box();
    if (changed && before !== null && after !== null) {
      const point = anchor?.zoom === zoom ? anchor.point : centre();
      const fraction =
        gesture !== null && anchor?.zoom === zoom
          ? gesture.fraction
          : pointFraction(point, { x: stage.scrollLeft, y: stage.scrollTop }, before);
      const scroll = scrollKeeping(point, fraction, after);
      stage.scrollLeft = scroll.x;
      stage.scrollTop = scroll.y;
      if (gesture !== null) gesture.scroll = { x: stage.scrollLeft, y: stage.scrollTop };
    }
    anchor = null;
    applied = { zoom, rotation };
  };

  /* A resize sizes the picture on the next frame: sizing it inside the observer's callback
     changes the stage's scroll extent, which the observer reports again in the same frame. */
  let resizeFrame = 0;
  const resize =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(update);
        });
  resize?.observe(stage);
  const onLoad = () => update();

  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerEnd);
  stage.addEventListener('pointercancel', onPointerEnd);
  stage.addEventListener('click', onClick);
  stage.addEventListener('dblclick', onDoubleClick);
  stage.addEventListener('load', onLoad, true);
  keys.addEventListener('keydown', onKeyDown);

  return {
    update,
    requestZoom(zoom, reason, event) {
      request(zoom, centre(), reason, event);
    },
    destroy() {
      cancelAnimationFrame(resizeFrame);
      resize?.disconnect();
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerEnd);
      stage.removeEventListener('pointercancel', onPointerEnd);
      stage.removeEventListener('click', onClick);
      stage.removeEventListener('dblclick', onDoubleClick);
      stage.removeEventListener('load', onLoad, true);
      keys.removeEventListener('keydown', onKeyDown);
    },
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
