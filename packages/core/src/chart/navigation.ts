import {
  categoryIndex,
  type ChartModel,
  type ChartModelSeries,
  seriesOf,
  visibleSeries,
} from './model';
import type { ChartPoint, ChartZoom } from './types';

/**
 * Where the keyboard goes inside a plot.
 *
 * The APG has no chart pattern. The plot borrows the Grid pattern's arrows —
 * series are rows, points are columns — and its edges: focus stops at the
 * last point rather than wrapping, because a reader who hears the same value
 * twice at the end of a series knows they have reached it, and one who hears
 * the first value again does not. The plot does not mirror in a right-to-left
 * document, so `ArrowRight` is the next point in both.
 */

export type ChartMove =
  | 'next'
  | 'previous'
  | 'next-series'
  | 'previous-series'
  | 'first'
  | 'last'
  | 'page-next'
  | 'page-previous';

/** A point exists where a series has a value to draw; a gap is not a stop. */
function drawn(model: ChartModel, series: ChartModelSeries, index: number) {
  const value = series.values[index];
  if (value === null || value === undefined) return false;
  if (model.shape === 'pie') return model.categories[index]!.visible && value > 0;
  return true;
}

function point(model: ChartModel, series: ChartModelSeries, index: number): ChartPoint {
  return { series: series.id, key: model.categories[index]!.key };
}

export function firstPoint(model: ChartModel): ChartPoint | null {
  for (const series of visibleSeries(model)) {
    for (let index = 0; index < model.categories.length; index += 1) {
      if (drawn(model, series, index)) return point(model, series, index);
    }
  }
  return null;
}

/** Whether a point still names something the chart draws. */
export function isDrawn(model: ChartModel, target: ChartPoint | null) {
  if (!target) return false;
  const series = seriesOf(model, target.series);
  const index = categoryIndex(model, target.key);
  return Boolean(series?.visible && index >= 0 && drawn(model, series, index));
}

function nearest(model: ChartModel, series: ChartModelSeries, from: number) {
  for (let distance = 0; distance < model.categories.length; distance += 1) {
    if (from - distance >= 0 && drawn(model, series, from - distance)) return from - distance;
    if (from + distance < model.categories.length && drawn(model, series, from + distance)) {
      return from + distance;
    }
  }
  return -1;
}

/**
 * The point a move lands on. A move past an edge returns the point it
 * started from; a point that is no longer drawn — its series hidden, its
 * record gone — starts again from the first point, because a reader has to
 * land somewhere.
 */
export function movePoint(
  model: ChartModel,
  current: ChartPoint | null,
  move: ChartMove,
): ChartPoint | null {
  if (!isDrawn(model, current)) return firstPoint(model);
  const series = seriesOf(model, current!.series)!;
  const index = categoryIndex(model, current!.key);
  const count = model.categories.length;
  const page = Math.max(1, Math.round(count / 10));

  /* The next drawn point in one direction, skipping gaps; the start when
     there is none. */
  const along = (step: 1 | -1) => {
    for (let next = index + step; next >= 0 && next < count; next += step) {
      if (drawn(model, series, next)) return point(model, series, next);
    }
    return point(model, series, index);
  };

  switch (move) {
    case 'next':
      return along(1);
    case 'previous':
      return along(-1);
    case 'first': {
      const first = nearest(model, series, 0);
      return point(model, series, first < 0 ? index : first);
    }
    case 'last': {
      const last = nearest(model, series, count - 1);
      return point(model, series, last < 0 ? index : last);
    }
    case 'page-next': {
      const target = nearest(model, series, Math.min(count - 1, index + page));
      return point(model, series, target < index ? index : target);
    }
    case 'page-previous': {
      const target = nearest(model, series, Math.max(0, index - page));
      return point(model, series, target > index ? index : target);
    }
    case 'next-series':
    case 'previous-series': {
      if (model.shape === 'pie') return current;
      const visible = visibleSeries(model);
      const position = visible.findIndex((entry) => entry.id === series.id);
      const step = move === 'next-series' ? 1 : -1;
      for (let next = position + step; next >= 0 && next < visible.length; next += step) {
        const landed = nearest(model, visible[next]!, index);
        if (landed >= 0) return point(model, visible[next]!, landed);
      }
      return current;
    }
  }
}

export const FULL_ZOOM: ChartZoom = { start: 0, end: 1 };

export function isFullZoom(zoom: ChartZoom | null | undefined) {
  return !zoom || (zoom.start <= 0 && zoom.end >= 1);
}

/** The narrowest window: two categories, so a line still has a segment. */
export function minimumZoomSpan(model: ChartModel) {
  const count = model.categories.length;
  return count > 2 ? 1 / (count - 1) : 1;
}

export function clampZoom(zoom: ChartZoom, minimum = 0): ChartZoom {
  const span = Math.min(1, Math.max(minimum, zoom.end - zoom.start));
  const start = Math.min(Math.max(0, zoom.start), 1 - span);
  return { start: round(start), end: round(start + span) };
}

function round(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

/** Where a category sits along the axis, as a fraction of the domain. */
export function categoryFraction(model: ChartModel, index: number) {
  const count = model.categories.length;
  return count > 1 ? index / (count - 1) : 0;
}

/** The first and last category inside a window. */
export function zoomRange(model: ChartModel, zoom: ChartZoom | null | undefined): [number, number] {
  const count = model.categories.length;
  if (count === 0) return [0, -1];
  const window = zoom ?? FULL_ZOOM;
  const first = Math.ceil(window.start * (count - 1) - 1e-9);
  const last = Math.floor(window.end * (count - 1) + 1e-9);
  return [Math.max(0, first), Math.min(count - 1, Math.max(first, last))];
}

/** A window scaled around a centre, `factor` below 1 zooming in. */
export function zoomAround(model: ChartModel, zoom: ChartZoom, center: number, factor: number) {
  const minimum = minimumZoomSpan(model);
  const span = Math.min(1, Math.max(minimum, (zoom.end - zoom.start) * factor));
  const ratio = zoom.end === zoom.start ? 0.5 : (center - zoom.start) / (zoom.end - zoom.start);
  const start = center - span * ratio;
  return clampZoom({ start, end: start + span }, minimum);
}

/** The smallest shift of a window that brings a fraction of the domain into it. */
export function zoomIncluding(zoom: ChartZoom, fraction: number): ChartZoom {
  if (fraction >= zoom.start && fraction <= zoom.end) return zoom;
  const span = zoom.end - zoom.start;
  const start = fraction < zoom.start ? fraction : fraction - span;
  return clampZoom({ start, end: start + span });
}

export type ChartKeyAction =
  | {
      readonly type: 'active';
      readonly point: ChartPoint | null;
      readonly reason: 'keyboard' | 'escape';
    }
  | { readonly type: 'select'; readonly point: ChartPoint | null }
  | { readonly type: 'zoom'; readonly zoom: ChartZoom; readonly reason: 'keyboard' | 'escape' };

export interface ChartKeyState {
  readonly active: ChartPoint | null;
  readonly selection: ChartPoint | null;
  readonly zoom: ChartZoom | null;
  readonly zoomable: boolean;
  readonly selectable: boolean;
}

const MOVES: Readonly<Record<string, ChartMove>> = {
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  ArrowDown: 'next-series',
  ArrowUp: 'previous-series',
  Home: 'first',
  End: 'last',
  PageDown: 'page-next',
  PageUp: 'page-previous',
};

/**
 * What a key pressed on the plot asks for, or `null` for a key the plot does
 * not own — which the binding then leaves to the page. A move that lands where
 * it started asks for nothing, so the request is not emitted twice.
 */
export function chartKeyAction(
  model: ChartModel,
  state: ChartKeyState,
  key: string,
): ChartKeyAction[] | null {
  if (model.empty) return null;
  const move = MOVES[key];
  if (move) {
    const next = movePoint(model, state.active, move);
    if (
      !next ||
      (state.active && next.series === state.active.series && next.key === state.active.key)
    ) {
      return [];
    }
    const actions: ChartKeyAction[] = [{ type: 'active', point: next, reason: 'keyboard' }];
    if (state.zoomable && state.zoom && model.shape === 'cartesian') {
      const shifted = zoomIncluding(
        state.zoom,
        categoryFraction(model, categoryIndex(model, next.key)),
      );
      if (shifted !== state.zoom) actions.push({ type: 'zoom', zoom: shifted, reason: 'keyboard' });
    }
    return actions;
  }

  if (key === 'Enter' || key === ' ') {
    if (!state.selectable || !isDrawn(model, state.active)) return null;
    const same =
      state.selection?.series === state.active!.series &&
      state.selection?.key === state.active!.key;
    return [{ type: 'select', point: same ? null : state.active }];
  }

  if (key === 'Escape') {
    if (state.active) return [{ type: 'active', point: null, reason: 'escape' }];
    if (state.zoomable && !isFullZoom(state.zoom)) {
      return [{ type: 'zoom', zoom: FULL_ZOOM, reason: 'escape' }];
    }
    return null;
  }

  if (
    state.zoomable &&
    model.shape === 'cartesian' &&
    (key === '+' || key === '=' || key === '-' || key === '0')
  ) {
    const zoom = state.zoom ?? FULL_ZOOM;
    if (key === '0')
      return isFullZoom(zoom) ? [] : [{ type: 'zoom', zoom: FULL_ZOOM, reason: 'keyboard' }];
    const index = state.active ? categoryIndex(model, state.active.key) : -1;
    const center = index >= 0 ? categoryFraction(model, index) : (zoom.start + zoom.end) / 2;
    const next = zoomAround(model, zoom, center, key === '-' ? 2 : 0.5);
    return next.start === zoom.start && next.end === zoom.end
      ? []
      : [{ type: 'zoom', zoom: next, reason: 'keyboard' }];
  }

  return null;
}

/**
 * Hiding and showing legend entries. `isolate` shows only the entry, or every
 * entry when it is already the only one shown — the second press undoes the
 * first, which is the rule Grafana and Kibana give the same gesture.
 */
export function toggleHidden(
  keys: readonly string[],
  hidden: readonly string[],
  key: string,
  mode: 'toggle' | 'isolate' = 'toggle',
): string[] {
  if (mode === 'isolate') {
    const others = keys.filter((entry) => entry !== key);
    const isolated = !hidden.includes(key) && others.every((entry) => hidden.includes(entry));
    return isolated ? [] : others;
  }
  return hidden.includes(key) ? hidden.filter((entry) => entry !== key) : [...hidden, key];
}
