import type { EChartsType } from 'echarts/core';

import {
  categoryIndex,
  defaultTrigger,
  seriesOf,
  visibleSeries,
  type ChartModel,
  type ChartPoint,
  type ChartTrigger,
  type ChartZoom,
} from '../chart/index';
import { loadEngine, replaceableComponents } from './loader';
import { buildChartOption, chooseRenderer, requiredChunks, type ChartEngineView } from './option';

/**
 * One ECharts instance behind a plot, and the only code that talks to it.
 *
 * The engine draws marks. It reports where the pointer is as a point of the
 * model — never as an ECharts event — and where a point is as pixels, so the
 * family's HTML overlay (crosshair, markers, tooltip) can be drawn at the same
 * place for a pointer and for a keyboard. Nothing it returns names an ECharts
 * type.
 */

export interface ChartEngineCallbacks {
  /** The point under the pointer, or `null` when the pointer leaves the marks. */
  readonly onPointer?: (point: ChartPoint | null, source: Event | undefined) => void;
  /** A press on the plot, with the point under it. */
  readonly onPress?: (point: ChartPoint | null, source: Event | undefined) => void;
  /** The reader moved the window by wheel, pinch or drag. */
  readonly onZoom?: (zoom: ChartZoom, source: Event | undefined) => void;
  /** After every draw and resize: the moment an overlay re-reads positions. */
  readonly onRender?: () => void;
  readonly onError?: (error: unknown) => void;
}

export interface ChartPointLocation {
  /** The mark's anchor, in CSS pixels from the engine element's top-left corner. */
  readonly x: number;
  readonly y: number;
  /** The category's band along the category axis: its start and its size. */
  readonly band: { readonly start: number; readonly size: number };
  /**
   * The grid the marks are drawn in, across the category axis: where it starts
   * and how far it runs. A crosshair spans this and not the whole plot, which
   * also holds the axis labels.
   */
  readonly frame: { readonly start: number; readonly size: number };
  readonly horizontal: boolean;
}

export interface ChartEngineRenderView extends ChartEngineView {
  /** Which trigger the pointer resolves by. */
  readonly trigger?: ChartTrigger | undefined;
}

export interface ChartEngine {
  /** Draws a view. Resolves once drawn; a newer view supersedes an older one still loading. */
  update(view: ChartEngineRenderView): Promise<void>;
  locate(point: ChartPoint): ChartPointLocation | null;
  /**
   * Lights one legend entry's marks and recedes the rest, or clears it. Kept
   * apart from `update` because a pointer crossing the legend changes it on
   * every item, and a full option for each would redraw the chart to move a
   * highlight.
   */
  emphasize(key: string | null): void;
  /** The drawing as a data URL: PNG from canvas, SVG from the SVG renderer. */
  toDataURL(options?: { readonly pixelRatio?: number }): string | null;
  dispose(): void;
}

interface ItemLayout {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
}

type ChartInternals = EChartsType;

/**
 * The one internal the engine reads: a series' laid-out items, which is where
 * a bar sits inside a group of bars and where a slice's angles are. No public
 * method answers either, and `convertToPixel` places a bar at its category's
 * center rather than at its own.
 */
interface ChartLayoutInternals {
  getModel?: () => {
    getComponent(
      type: string,
      index: number,
    ):
      | {
          coordinateSystem?: { getRect(): { x: number; y: number; width: number; height: number } };
        }
      | undefined;
    getSeriesByIndex(
      index: number,
    ): { getData(): { getItemLayout(index: number): ItemLayout | null } } | undefined;
  };
}

export function mountChartEngine(
  element: HTMLElement,
  callbacks: ChartEngineCallbacks = {},
): ChartEngine {
  let chart: ChartInternals | null = null;
  let renderer: 'svg' | 'canvas' | null = null;
  let view: ChartEngineRenderView | null = null;
  let seriesIndex: ReadonlyMap<string, number> = new Map();
  let dataIndex: ReadonlyMap<string, number> = new Map();
  let generation = 0;
  let disposed = false;
  let pointer: ChartPoint | null = null;
  let emphasis: string | null = null;

  const resize = new ResizeObserver(() => {
    if (!chart || element.clientWidth === 0) return;
    chart.resize({ animation: { duration: 0 } });
    callbacks.onRender?.();
  });
  resize.observe(element);

  const model = () => view?.model as ChartModel;

  const report = (next: ChartPoint | null, source: Event | undefined) => {
    if (next?.series === pointer?.series && next?.key === pointer?.key) return;
    pointer = next;
    callbacks.onPointer?.(next, source);
  };

  function cartesianPoint(x: number, y: number): ChartPoint | null {
    const current = model();
    if (!chart || !current || current.categories.length === 0) return null;
    if (!chart.containPixel('grid', [x, y])) return null;
    const horizontal = current.orientation === 'horizontal';
    const trigger = view?.trigger ?? defaultTrigger(current);
    const candidates = visibleSeries(current);

    if (trigger === 'item') {
      let best: { point: ChartPoint; distance: number } | null = null;
      for (const series of candidates) {
        series.values.forEach((value, index) => {
          if (value === null) return;
          const point = { series: series.id, key: current.categories[index]!.key };
          const at = locate(point);
          if (!at) return;
          const distance = Math.hypot(at.x - x, at.y - y);
          if (!best || distance < best.distance) best = { point, distance };
        });
      }
      const limit = Math.max(24, (view?.theme.markerSize ?? 6) * 3);
      return best && (best as { distance: number }).distance <= limit
        ? (best as { point: ChartPoint }).point
        : null;
    }

    const along = horizontal ? y : x;
    const finder = horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 };
    const raw = Number(chart.convertFromPixel(finder, along));
    let index: number;
    if (current.xType === 'category') {
      index = Math.min(current.categories.length - 1, Math.max(0, Math.round(raw)));
    } else {
      let low = 0;
      let high = current.categories.length - 1;
      while (high - low > 1) {
        const middle = (low + high) >> 1;
        if ((current.categories[middle]!.x as number) < raw) low = middle;
        else high = middle;
      }
      const lowX = current.categories[low]!.x as number;
      const highX = current.categories[high]!.x as number;
      index = Math.abs(raw - lowX) <= Math.abs(highX - raw) ? low : high;
    }

    const across = horizontal ? x : y;
    let best: { series: string; distance: number } | null = null;
    for (const series of candidates) {
      if (series.values[index] === null) continue;
      const at = locate({ series: series.id, key: current.categories[index]!.key });
      if (!at) continue;
      const distance = Math.abs((horizontal ? at.x : at.y) - across);
      if (!best || distance < best.distance) best = { series: series.id, distance };
    }
    return best ? { series: best.series, key: current.categories[index]!.key } : null;
  }

  function wire(instance: ChartInternals) {
    const zr = instance.getZr();
    zr.on('mousemove', (event: { offsetX: number; offsetY: number; event?: unknown }) => {
      if (model()?.shape === 'pie') return;
      report(cartesianPoint(event.offsetX, event.offsetY), event.event as unknown as Event);
    });
    zr.on('globalout', (event: { event?: unknown }) =>
      report(null, event.event as unknown as Event),
    );
    zr.on('click', (event: { event?: unknown }) =>
      callbacks.onPress?.(pointer, event.event as unknown as Event),
    );
    instance.on(
      'mouseover',
      (params: { seriesType?: string; name?: string; event?: { event?: Event } }) => {
        const current = model();
        if (params.seriesType !== 'pie' || !current || !params.name) return;
        report({ series: current.series[0]!.id, key: params.name }, params.event?.event);
      },
    );
    instance.on('mouseout', (params: { seriesType?: string; event?: { event?: Event } }) => {
      if (params.seriesType === 'pie') report(null, params.event?.event);
    });
    instance.on('datazoom', (raw: unknown) => {
      const params = raw as {
        batch?: { start?: number; end?: number }[];
        start?: number;
        end?: number;
      };
      const source = params.batch?.[0] ?? params;
      const [zoom] =
        (instance.getOption()['dataZoom'] as { start: number; end: number }[] | undefined) ?? [];
      const start = source.start ?? zoom?.start;
      const end = source.end ?? zoom?.end;
      if (start === undefined || end === undefined) return;
      callbacks.onZoom?.({ start: start / 100, end: end / 100 }, undefined);
    });
  }

  function applyEmphasis(next: string | null) {
    if (!chart || next === emphasis) return;
    const current = model();
    const target = (key: string) =>
      current?.shape === 'pie' ? { seriesIndex: 0, name: key } : { seriesId: key };
    if (emphasis) chart.dispatchAction({ type: 'downplay', ...target(emphasis) });
    if (next) chart.dispatchAction({ type: 'highlight', ...target(next) });
    emphasis = next;
  }

  function locate(point: ChartPoint): ChartPointLocation | null {
    const current = model();
    if (!chart || !current) return null;
    const series = seriesOf(current, point.series);
    const index = categoryIndex(current, point.key);
    const position = series ? seriesIndex.get(series.id) : undefined;
    if (!series || index < 0 || position === undefined) return null;
    const horizontal = current.orientation === 'horizontal';
    const internals = (chart as unknown as ChartLayoutInternals)
      .getModel?.()
      .getSeriesByIndex(position)
      ?.getData();

    if (current.shape === 'pie') {
      const slice = dataIndex.get(point.key);
      const layout = slice === undefined ? null : internals?.getItemLayout(slice);
      if (!layout || layout.cx === undefined) return null;
      const angle = ((layout.startAngle ?? 0) + (layout.endAngle ?? 0)) / 2;
      const radius = layout.r ?? 0;
      return {
        x: layout.cx + Math.cos(angle) * radius,
        y: (layout.cy ?? 0) + Math.sin(angle) * radius,
        band: { start: 0, size: 0 },
        frame: { start: 0, size: 0 },
        horizontal: false,
      };
    }

    const value = series.top[index];
    if (value === null || value === undefined) return null;
    const x = current.xType === 'category' ? index : (current.categories[index]!.x as number);
    const categoryFinder = horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 };
    const center = Number(chart.convertToPixel(categoryFinder, x));
    const neighbour =
      current.xType === 'category' && current.categories.length > 1
        ? Number(chart.convertToPixel(categoryFinder, index === 0 ? 1 : index - 1))
        : center;
    const step = Math.abs(neighbour - center);
    const band = { start: center - step / 2, size: step };
    const rect = (chart as unknown as ChartLayoutInternals)
      .getModel?.()
      .getComponent('grid', 0)
      ?.coordinateSystem?.getRect();
    const frame = rect
      ? horizontal
        ? { start: rect.x, size: rect.width }
        : { start: rect.y, size: rect.height }
      : { start: 0, size: element.clientHeight };

    if (series.kind === 'bar') {
      const layout = internals?.getItemLayout(index);
      if (layout && layout.x !== undefined && layout.y !== undefined) {
        const width = layout.width ?? 0;
        const height = layout.height ?? 0;
        return horizontal
          ? {
              x: Math.max(layout.x, layout.x + width),
              y: layout.y + height / 2,
              band,
              frame,
              horizontal,
            }
          : {
              x: layout.x + width / 2,
              y: Math.min(layout.y, layout.y + height),
              band,
              frame,
              horizontal,
            };
      }
    }

    const pixel = chart.convertToPixel(
      { seriesIndex: position },
      horizontal ? [value, x] : [x, value],
    ) as number[] | undefined;
    if (!pixel || !Number.isFinite(pixel[0]) || !Number.isFinite(pixel[1])) return null;
    return { x: pixel[0]!, y: pixel[1]!, band, frame, horizontal };
  }

  return {
    async update(next) {
      view = next;
      const mine = (generation += 1);
      try {
        const api = await loadEngine(requiredChunks(next));
        if (disposed || mine !== generation) return;
        const wanted = chooseRenderer(next);
        if (!chart || wanted !== renderer) {
          chart?.dispose();
          chart = api.init(element, undefined, { renderer: wanted }) as ChartInternals;
          renderer = wanted;
          emphasis = null;
          wire(chart);
        }
        const result = buildChartOption(next, element.clientWidth);
        seriesIndex = result.seriesIndex;
        dataIndex = result.dataIndex;
        /* Resolves when the drawing has settled: ECharts says so with
           `finished` once every animation of this update has run, and the
           longest the motion scale allows is the bound a missed event is
           waited for. An overlay placed before then is placed on a mark
           still moving towards its position. */
        const instance = chart;
        const settled = new Promise<void>((resolve) => {
          const done = () => {
            instance.off('finished', done);
            clearTimeout(timer);
            resolve();
          };
          const timer = setTimeout(done, next.theme.duration * 4 + 100);
          instance.on('finished', done);
        });
        instance.setOption(result.option, {
          replaceMerge: replaceableComponents(),
          lazyUpdate: false,
        });
        applyEmphasis(next.emphasis ?? null);
        callbacks.onRender?.();
        await settled;
        if (disposed || mine !== generation) return;
        callbacks.onRender?.();
      } catch (error) {
        if (!disposed && mine === generation) callbacks.onError?.(error);
      }
    },
    locate,
    emphasize(key) {
      if (view) view = { ...view, emphasis: key };
      applyEmphasis(key);
    },
    toDataURL(options = {}) {
      if (!chart) return null;
      return chart.getDataURL({
        type: renderer === 'svg' ? 'svg' : 'png',
        pixelRatio: options.pixelRatio ?? 2,
        backgroundColor: view?.theme.surface ?? 'transparent',
      });
    },
    dispose() {
      disposed = true;
      resize.disconnect();
      chart?.dispose();
      chart = null;
    },
  };
}
