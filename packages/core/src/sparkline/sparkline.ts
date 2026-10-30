/**
 * The geometry of a sparkline, with no DOM in it.
 *
 * A sparkline is a series of numbers drawn in a box: a line through them, or
 * a bar per period, a marker on the last real point and a reference line where
 * the consumer names one. Both bindings hand this module the numbers and the
 * measured box and write the strings it returns into an `svg`; a binding that
 * computed a path of its own would be a second answer to the question of
 * where a point is, and the two would drift.
 *
 * Coordinates are CSS pixels of the box the binding measured. Nothing here
 * knows a stroke width or a color: the inset the stroke and the marker need
 * is a number the binding passes, because it depends on the size step the
 * stylesheet chose.
 */

import type { FamilyTranslator, SparklineMessages } from '../i18n';

export type SparklineDatum = number | null | undefined;

export type SparklineTrend = 'up' | 'down' | 'flat';

export interface SparklineSummary {
  /** How many real points the series holds. */
  readonly count: number;
  readonly first: number | null;
  readonly last: number | null;
  readonly min: number | null;
  readonly max: number | null;
  /** Last less first, or `null` with fewer than one real point. */
  readonly delta: number | null;
  readonly trend: SparklineTrend;
}

export interface SparklinePoint {
  readonly x: number;
  readonly y: number;
  readonly value: number;
  /** The position in the consumer's series, gaps included. */
  readonly index: number;
}

export interface SparklineBar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly value: number;
  readonly index: number;
  /**
   * The bar as a path: rounded at its data end, square at the baseline. A
   * `rect` with `rx` rounds all four corners, and a bar that grows from a
   * baseline must stand on it flat.
   */
  readonly path: string;
}

export interface SparklineLayoutRequest {
  readonly data: readonly SparklineDatum[];
  /** The measured box, in CSS pixels. */
  readonly width: number;
  readonly height: number;
  /**
   * How far in from every edge the first and last points sit, so a stroke
   * and a marker centerd on a point stay inside the box. Half the stroke
   * width plus the marker's radius is the number a line needs.
   */
  readonly inset?: number | undefined;
  readonly type?: 'line' | 'bar' | undefined;
  readonly curve?: 'linear' | 'monotone' | undefined;
  readonly area?: boolean | undefined;
  /** The domain, when the consumer names it. The data widens it, never narrows it. */
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly reference?: number | undefined;
  /** The space between two bars, in pixels; dropped when a bar would be under two pixels. */
  readonly gap?: number | undefined;
  /** The radius of a bar's data end, capped at half its width. */
  readonly radius?: number | undefined;
}

export interface SparklineLayout {
  readonly summary: SparklineSummary;
  readonly points: readonly SparklinePoint[];
  /** The `d` of the line, empty with fewer than two real points. */
  readonly line: string;
  /** The `d` of the area under the line, empty unless asked for. */
  readonly area: string;
  readonly bars: readonly SparklineBar[];
  /** The y of the reference line, `null` when there is none. */
  readonly reference: number | null;
  /** The y bars grow from. */
  readonly baseline: number;
  /** The last real point, `null` when there is none. */
  readonly marker: SparklinePoint | null;
}

export interface SparklineDescriptionRequest {
  /** The family's words in the language in force: `useMessages` / `injectMessages` of `sparklineMessages`. */
  readonly t: FamilyTranslator<SparklineMessages>;
  readonly format: (value: number) => string;
  readonly label?: string | undefined;
}

function isReal(value: SparklineDatum): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Three decimals: enough for a path, short enough to read in a test. */
function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function summarizeSparkline(data: readonly SparklineDatum[]): SparklineSummary {
  const real = data.filter(isReal);
  if (real.length === 0) {
    return { count: 0, first: null, last: null, min: null, max: null, delta: null, trend: 'flat' };
  }
  const first = real[0]!;
  const last = real[real.length - 1]!;
  const delta = last - first;
  return {
    count: real.length,
    first,
    last,
    min: Math.min(...real),
    max: Math.max(...real),
    delta,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

/**
 * The tangent at every point of a run, by Fritsch–Carlson: a slope is the
 * harmonic mean of the two secants beside it when they agree in sign, and
 * nought when they do not, which is what keeps the curve from overshooting a
 * point — the line never draws a value the series does not hold.
 */
function monotoneTangents(run: readonly SparklinePoint[]) {
  const n = run.length;
  const secant: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const dx = run[i + 1]!.x - run[i]!.x;
    secant.push(dx === 0 ? 0 : (run[i + 1]!.y - run[i]!.y) / dx);
  }
  const tangent: number[] = new Array<number>(n).fill(0);
  tangent[0] = secant[0] ?? 0;
  tangent[n - 1] = secant[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i += 1) {
    const a = secant[i - 1]!;
    const b = secant[i]!;
    tangent[i] = a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  }
  return tangent;
}

function runPath(run: readonly SparklinePoint[], curve: 'linear' | 'monotone') {
  const start = `M${round(run[0]!.x)} ${round(run[0]!.y)}`;
  if (run.length === 1) return start;
  if (curve === 'linear') {
    return (
      start +
      run
        .slice(1)
        .map((point) => `L${round(point.x)} ${round(point.y)}`)
        .join('')
    );
  }
  const tangent = monotoneTangents(run);
  let path = start;
  for (let i = 0; i < run.length - 1; i += 1) {
    const a = run[i]!;
    const b = run[i + 1]!;
    const third = (b.x - a.x) / 3;
    path +=
      `C${round(a.x + third)} ${round(a.y + tangent[i]! * third)} ` +
      `${round(b.x - third)} ${round(b.y - tangent[i + 1]! * third)} ` +
      `${round(b.x)} ${round(b.y)}`;
  }
  return path;
}

/** Consecutive real points, split wherever the series has a gap. */
function runsOf(points: readonly SparklinePoint[]) {
  const runs: SparklinePoint[][] = [];
  let current: SparklinePoint[] = [];
  let previous = -1;
  for (const point of points) {
    if (point.index !== previous + 1 && current.length > 0) {
      runs.push(current);
      current = [];
    }
    current.push(point);
    previous = point.index;
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

/**
 * A bar with its two outer corners rounded and its baseline corners square.
 * A negative bar hangs from the baseline, so its rounded end is at the bottom.
 */
function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  hanging: boolean,
  radius: number,
) {
  const r = round(Math.min(radius, width / 2, height));
  if (r <= 0) return `M${x} ${y}h${width}v${height}h${-width}Z`;
  const straight = round(height - r);
  const across = round(width - 2 * r);
  if (hanging) {
    return (
      `M${x} ${y}h${width}v${straight}` +
      `a${r} ${r} 0 0 1 ${-r} ${r}h${-across}` +
      `a${r} ${r} 0 0 1 ${-r} ${-r}Z`
    );
  }
  return (
    `M${x} ${round(y + height)}v${-straight}` +
    `a${r} ${r} 0 0 1 ${r} ${-r}h${across}` +
    `a${r} ${r} 0 0 1 ${r} ${r}v${straight}Z`
  );
}

export function layoutSparkline(request: SparklineLayoutRequest): SparklineLayout {
  const {
    data,
    width,
    height,
    inset = 0,
    type = 'line',
    curve = 'linear',
    area = false,
    reference,
    gap = 2,
    radius = 2,
  } = request;
  const summary = summarizeSparkline(data);
  const count = data.length;

  /* The extent: the data, widened by the consumer's domain and the reference,
     and for bars by zero, which is where a bar grows from. */
  let lo = summary.min ?? 0;
  let hi = summary.max ?? 0;
  if (type === 'bar') {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (request.min !== undefined) lo = Math.min(lo, request.min);
  if (request.max !== undefined) hi = Math.max(hi, request.max);
  if (reference !== undefined && Number.isFinite(reference)) {
    lo = Math.min(lo, reference);
    hi = Math.max(hi, reference);
  }

  const top = inset;
  const innerHeight = Math.max(0, height - 2 * inset);
  const innerWidth = Math.max(0, width - 2 * inset);
  /* A degenerate extent draws through the middle: a constant series has no
     high and no low, so it is neither at the top nor at the bottom. */
  const yOf = (value: number) =>
    round(hi === lo ? top + innerHeight / 2 : top + ((hi - value) / (hi - lo)) * innerHeight);

  const points: SparklinePoint[] = [];
  if (type === 'line') {
    const step = count > 1 ? innerWidth / (count - 1) : 0;
    data.forEach((value, index) => {
      if (!isReal(value)) return;
      const x = count > 1 ? inset + index * step : inset + innerWidth / 2;
      points.push({ x: round(x), y: yOf(value), value, index });
    });
  }

  const runs = runsOf(points);
  const line = summary.count < 2 ? '' : runs.map((run) => runPath(run, curve)).join('');
  const areaPath =
    !area || summary.count < 2
      ? ''
      : runs
          .filter((run) => run.length > 1)
          .map((run) => {
            const first = run[0]!;
            const last = run[run.length - 1]!;
            return `${runPath(run, curve)}L${round(last.x)} ${round(height)}L${round(first.x)} ${round(height)}Z`;
          })
          .join('');

  const baseline = yOf(0);
  const bars: SparklineBar[] = [];
  if (type === 'bar' && count > 0) {
    let barGap = gap;
    let barWidth = (innerWidth - barGap * (count - 1)) / count;
    if (barWidth < 2) {
      barGap = 0;
      barWidth = innerWidth / count;
    }
    const slot = barWidth + barGap;
    const drawn = Math.max(1, barWidth);
    data.forEach((value, index) => {
      if (!isReal(value)) return;
      const y = yOf(value);
      let barTop = Math.min(y, baseline);
      let barHeight = Math.abs(baseline - y);
      /* A period that happened and measured nought is still a period: it is
         drawn as a hairline on the baseline rather than as nothing. */
      if (barHeight < 1) {
        barHeight = 1;
        barTop = value < 0 ? baseline : baseline - 1;
      }
      const x = round(inset + index * slot);
      const w = round(drawn);
      const h = round(barHeight);
      const top = round(barTop);
      bars.push({
        x,
        y: top,
        width: w,
        height: h,
        value,
        index,
        path: barPath(x, top, w, h, value < 0, radius),
      });
    });
  }

  const marker = points.length > 0 ? points[points.length - 1]! : null;

  return {
    summary,
    points,
    line,
    area: areaPath,
    bars,
    reference:
      reference !== undefined && Number.isFinite(reference) && summary.count > 0
        ? yOf(reference)
        : null,
    baseline,
    marker,
  };
}

/**
 * What a screen reader hears in place of the drawing: the last value, the
 * direction, and the change since the first — the two numbers a sparkline
 * exists to compare. The caller formats each number, so a percentage reads as
 * one and a currency as one, and the sentence is the caller's too, because
 * no language puts the three numbers in the same order.
 */
export function describeSparkline(
  data: readonly SparklineDatum[],
  { t, format, label }: SparklineDescriptionRequest,
) {
  const summary = summarizeSparkline(data);
  const prefix = label ? `${label}: ` : '';
  if (summary.count === 0 || summary.last === null || summary.first === null) {
    return `${prefix}${t('noData')}`;
  }
  const last = format(summary.last);
  const first = format(summary.first);
  const sentence =
    summary.trend === 'flat'
      ? t('flat', { last, first })
      : t(summary.trend, { last, first, change: format(Math.abs(summary.delta ?? 0)) });
  return `${prefix}${sentence}`;
}

export interface SparklineBox {
  readonly width: number;
  readonly height: number;
}

export interface SparklineBoxHandle {
  /** Releases the observer. The last box stands. */
  destroy: () => void;
}

/**
 * Watches an element's border box and reports it in CSS pixels, first
 * synchronously and then whenever it changes. The first answer is
 * synchronous for the reason `createWidthGate` gives: a caller never paints
 * one frame on the nominal grid when the real one is already known. Where
 * `ResizeObserver` does not exist — a server, a test without layout — the
 * element measures nought, nought is never reported, and the caller keeps
 * the nominal grid, which is recoverable where a drawing on an unknown grid
 * is not.
 */
export function observeSparklineBox(
  element: Element,
  onChange: (box: SparklineBox) => void,
): SparklineBoxHandle {
  let last: SparklineBox = { width: 0, height: 0 };

  function report(width: number, height: number) {
    const next = { width: Math.round(width * 100) / 100, height: Math.round(height * 100) / 100 };
    if (next.width === last.width && next.height === last.height) return;
    last = next;
    onChange(next);
  }

  const rect = element.getBoundingClientRect?.();
  report(rect?.width ?? 0, rect?.height ?? 0);

  if (typeof ResizeObserver === 'undefined') return { destroy: () => {} };
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = entry.borderBoxSize?.[0];
      if (size) report(size.inlineSize, size.blockSize);
      else report(entry.contentRect.width, entry.contentRect.height);
    }
  });
  observer.observe(element, { box: 'border-box' });
  return { destroy: () => observer.disconnect() };
}

export type SparklineSizeStep = 'sm' | 'md' | 'lg';

/**
 * The grid each size step is drawn on before the box is measured, and how
 * far in from the edge a line's first and last points sit. The insets are
 * the stylesheet's marker and stroke — a marker of four, six or eight pixels
 * with a ring of one and a half or two, a stroke of one and a half or two —
 * halved, so the disc and the line stay inside the box. They are stated here rather than read from
 * the stylesheet because geometry has to be known before paint, and both
 * bindings read the same numbers. `specs/components/sparkline/contract.json`
 * holds the grid, and the styles test holds the marker.
 */
export const SPARKLINE_STEPS: Record<
  SparklineSizeStep,
  { width: number; height: number; markerInset: number; lineInset: number }
> = {
  sm: { width: 96, height: 20, markerInset: 2.75, lineInset: 0.75 },
  md: { width: 96, height: 32, markerInset: 4, lineInset: 1 },
  lg: { width: 96, height: 48, markerInset: 5, lineInset: 1 },
};

/** How far in from the edge the grid starts, for a form and a size. */
export function sparklineInset(step: SparklineSizeStep, type: 'line' | 'bar', marker: boolean) {
  if (type === 'bar') return 0;
  const { markerInset, lineInset } = SPARKLINE_STEPS[step];
  return marker ? markerInset : lineInset;
}
