/**
 * The arithmetic of a media viewer's view: the fit, the level a wheel or a
 * pinch asks for, the scroll that keeps a point still, and what a finger's
 * release means. Pure functions, no DOM.
 *
 * The level is a multiple of the fit: 1 is the whole picture inside the stage,
 * never above the picture's own size.
 */

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** A box in the stage's scrolled content: its offset from the content's origin, and its size. */
export interface Box extends Size {
  readonly left: number;
  readonly top: number;
}

export type Rotation = 0 | 90 | 180 | 270;

export interface WheelInput {
  readonly deltaY: number;
  readonly deltaMode: number;
  readonly ctrlKey: boolean;
}

export type SwipeIntent = 'next' | 'previous' | 'close' | null;

/** A mouse notch is about this many pixels of `deltaY`, and it is one step. */
export const WHEEL_PIXELS_PER_STEP = 100;
/** `deltaMode` 1 counts lines; a line is this many pixels. */
export const WHEEL_LINE_HEIGHT = 16;
/** A release further than this from the press is a gesture, not a click. */
export const CLICK_SLOP = 6;
/** A horizontal release this far, or this fast, steps. */
export const SWIPE_DISTANCE = 48;
export const SWIPE_VELOCITY = 0.5;

/** The size a turned picture takes: a quarter turn swaps its axes. */
export function turned(size: Size, rotation: Rotation): Size {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

/** The scale at which the whole turned picture stands inside the stage, never above 1. */
export function fitScale(natural: Size, stage: Size, rotation: Rotation): number {
  const box = turned(natural, rotation);
  if (box.width <= 0 || box.height <= 0 || stage.width <= 0 || stage.height <= 0) return 1;

  return Math.min(1, stage.width / box.width, stage.height / box.height);
}

export function clampZoom(zoom: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, zoom));
}

/**
 * The level a wheel event asks for. The distance is summed rather than the
 * events counted: a trackpad sends one gesture as dozens of small events, and
 * a step per event jumped to the maximum. Without a modifier every
 * `WHEEL_PIXELS_PER_STEP` adds `step`; with `ctrlKey`, which is how a
 * trackpad's pinch arrives, the level is multiplied, so the pinch is
 * proportional at every level. `page` is what one page of `deltaMode` 2 is.
 */
export function wheelZoom(zoom: number, input: WheelInput, step: number, page: number): number {
  const unit =
    input.deltaMode === 1 ? WHEEL_LINE_HEIGHT : input.deltaMode === 2 ? Math.max(page, 1) : 1;
  const pixels = input.deltaY * unit;

  return input.ctrlKey
    ? zoom * 2 ** (-pixels / WHEEL_PIXELS_PER_STEP)
    : zoom - (pixels / WHEEL_PIXELS_PER_STEP) * step;
}

/** Where `point` — in the stage's viewport — falls on the picture's box, as fractions of it. */
export function pointFraction(point: Point, scroll: Point, box: Box): Point {
  return {
    x: box.width > 0 ? (scroll.x + point.x - box.left) / box.width : 0.5,
    y: box.height > 0 ? (scroll.y + point.y - box.top) / box.height : 0.5,
  };
}

/** The stage's scroll that puts the spot at `fraction` of the picture's box under `point`. */
export function scrollKeeping(point: Point, fraction: Point, box: Box): Point {
  return {
    x: box.left + fraction.x * box.width - point.x,
    y: box.top + fraction.y * box.height - point.y,
  };
}

/**
 * The stage's scroll that keeps `point` — in the stage's viewport — over the
 * same spot of the picture after the picture's box changed from `before` to
 * `after`, both in the scrolled content.
 */
export function zoomAround(point: Point, scroll: Point, before: Box, after: Box): Point {
  return scrollKeeping(point, pointFraction(point, scroll, before), after);
}

/**
 * What a finger's release means while the picture fits: a horizontal travel
 * past `SWIPE_DISTANCE`, or faster than `SWIPE_VELOCITY` pixels a millisecond,
 * steps — to the next item when the finger went toward the inline start; a
 * travel down past a quarter of the stage closes; anything else is nothing.
 */
export function swipeIntent(
  dx: number,
  dy: number,
  ms: number,
  stageHeight: number,
  rtl: boolean,
): SwipeIntent {
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const velocity = ms > 0 ? Math.abs(dx) / ms : 0;

  if (horizontal && (Math.abs(dx) >= SWIPE_DISTANCE || velocity >= SWIPE_VELOCITY)) {
    const towardStart = rtl ? dx > 0 : dx < 0;

    return towardStart ? 'next' : 'previous';
  }

  if (!horizontal && dy > stageHeight / 4) return 'close';

  return null;
}

export type MediaKind = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'other';

/** Media types that are text whatever their top-level type says. */
const TEXT_TYPES = new Set([
  'application/json',
  'application/ld+json',
  'application/x-ndjson',
  'application/xml',
  'application/yaml',
  'application/x-yaml',
  'application/toml',
  'application/javascript',
  'application/typescript',
  'application/x-sh',
  'application/sql',
  'application/graphql',
]);

/** Extensions read as text when the type is absent or generic. */
const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'log',
  'csv',
  'tsv',
  'json',
  'jsonl',
  'ndjson',
  'xml',
  'yaml',
  'yml',
  'toml',
  'ini',
  'cfg',
  'conf',
  'env',
  'sql',
  'graphql',
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'cjs',
  'ts',
  'tsx',
  'jsx',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'h',
  'cpp',
  'cs',
  'php',
  'sh',
  'bash',
  'zsh',
  'ps1',
  'bat',
  'dockerfile',
  'gitignore',
  'srt',
  'vtt',
]);

/**
 * How the viewer draws a file: by its MIME type, parameters and case ignored,
 * and by the extension of `name` when the type is absent or the generic
 * `application/octet-stream`. Text — plain, structured or source — is drawn
 * by the viewer itself as text, never executed.
 */
export function mediaKind(type: string, name = ''): MediaKind {
  const media = (type.split(';')[0] ?? '').trim().toLowerCase();
  if (media === 'application/pdf') return 'pdf';
  if (TEXT_TYPES.has(media) || /\+(json|xml)$/.test(media)) return 'text';

  for (const kind of ['image', 'text', 'video', 'audio'] as const) {
    if (media.startsWith(`${kind}/`)) return kind;
  }

  if (media !== '' && media !== 'application/octet-stream') return 'other';

  const extension = name.toLowerCase().split('.').at(-1) ?? '';
  if (extension === 'pdf') return 'pdf';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';

  return 'other';
}

/** The most of a text file the viewer draws; the rest is offered by the download. */
export const TEXT_LIMIT = 1_048_576;

/**
 * Text as the viewer draws it: JSON indented by two spaces when it parses,
 * everything else as written, and cut at `TEXT_LIMIT` characters.
 */
export function readableText(
  content: string,
  type: string,
  name = '',
): {
  text: string;
  truncated: boolean;
} {
  const media = (type.split(';')[0] ?? '').trim().toLowerCase();
  const json = media.endsWith('json') || /\.(json)$/i.test(name);
  let text = content;
  if (json) {
    try {
      text = JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      /* Not valid JSON: the file is shown as it was written. */
    }
  }

  return text.length > TEXT_LIMIT
    ? { text: text.slice(0, TEXT_LIMIT), truncated: true }
    : { text, truncated: false };
}
