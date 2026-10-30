import {
  categoryIndex,
  chartTime,
  colorOf,
  type ChartGrid,
  type ChartModel,
  type ChartModelSeries,
  type ChartPoint,
  type ChartTheme,
  type ChartZoom,
} from '../chart/index';

import { placeLineLabels } from './annotation-labels';

/**
 * The model, translated into an ECharts `option`. Pure: the same view gives
 * the same object, so it is tested without a renderer and diffed by ECharts
 * itself on every update.
 *
 * What the option leaves out is as deliberate as what it holds. There is no
 * `tooltip`, `legend`, `title` or `toolbox`: the family draws those in HTML,
 * which is what lets a consumer restyle and replace them, and not registering
 * them is what keeps them out of the bundle. There is no `axisPointer`
 * either: the crosshair and the active marker are the family's overlay, drawn
 * at the pixel the engine reports, so a pointer and a keyboard produce the
 * same picture.
 */

export interface ChartEngineView {
  readonly model: ChartModel;
  readonly theme: ChartTheme;
  readonly selection?: ChartPoint | null | undefined;
  readonly zoom?: ChartZoom | null | undefined;
  readonly zoomable?: boolean | undefined;
  readonly grid?: ChartGrid | undefined;
  readonly texture?: boolean | undefined;
  readonly renderer?: 'auto' | 'svg' | 'canvas' | undefined;
  readonly sampling?: 'auto' | 'none' | undefined;
  readonly animate?: boolean | undefined;
  /** The legend entry the reader is pointing at or focused on. */
  readonly emphasis?: string | null | undefined;
  /**
   * The escape hatch: the option, before it reaches the engine, for what the
   * contract does not express yet. Each recurring use is a capability the
   * contract owes.
   */
  readonly extendOption?:
    ((option: Record<string, unknown>) => Record<string, unknown>) | undefined;
}

export interface ChartOptionResult {
  readonly option: Record<string, unknown>;
  /** A series id to its index in `option.series`, for the engine's lookups. */
  readonly seriesIndex: ReadonlyMap<string, number>;
  /** A pie's category key to its index in the slice data, which leaves out what it cannot draw. */
  readonly dataIndex: ReadonlyMap<string, number>;
}

/** Past this many visible marks the canvas renderer draws, when asked for `auto`. */
export const CANVAS_THRESHOLD = 4000;

/** How much a mark that is not selected recedes while another one is. */
const RECEDED = 0.32;

export function chooseRenderer(view: ChartEngineView): 'svg' | 'canvas' {
  if (view.renderer === 'svg' || view.renderer === 'canvas') return view.renderer;
  return view.model.pointCount > CANVAS_THRESHOLD ? 'canvas' : 'svg';
}

/** The engine chunks a view needs, by name. */
export function requiredChunks(view: ChartEngineView): string[] {
  const { model } = view;
  const chunks = new Set<string>(['base']);
  if (chooseRenderer(view) === 'canvas') chunks.add('canvas');
  if (model.shape === 'cartesian') chunks.add('cartesian');
  for (const series of model.series) {
    chunks.add(series.kind === 'area' ? 'line' : series.kind);
    if (series.labels) chunks.add('labels');
  }
  if (model.annotations.length > 0) chunks.add('annotations');
  if (view.zoomable && model.shape === 'cartesian') chunks.add('zoom');
  if (usesTexture(view)) chunks.add('texture');
  return [...chunks];
}

function usesTexture(view: ChartEngineView) {
  return (
    Boolean(view.texture) ||
    view.theme.forcedColors ||
    view.model.legend.some((entry) => entry.color.type === 'overflow')
  );
}

/**
 * ECharts takes a named easing or a function. The theme's cubic Bézier is
 * solved for x by Newton's method, which converges in a few steps for the
 * monotone curves the motion scale holds.
 */
export function bezier([x1, y1, x2, y2]: readonly [number, number, number, number]) {
  const sample = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const slope = (a: number, b: number, t: number) =>
    3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let step = 0; step < 8; step += 1) {
      const error = sample(x1, x2, t) - x;
      const derivative = slope(x1, x2, t);
      if (Math.abs(error) < 1e-5 || derivative === 0) break;
      t -= error / derivative;
    }
    return sample(y1, y2, t);
  };
}

function channels(color: string) {
  const match = /^rgba?\(([^)]+)\)$/.exec(color);
  if (!match) return null;
  const [r, g, b] = match[1]!
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  return [r!, g!, b!] as const;
}

/**
 * A mark that recedes is the series colour mixed toward the ground, not the
 * series colour made transparent: a translucent bar shows the grid through
 * itself, and a mixed one stays a solid shape.
 */
function recede(color: string, ground: string, share = RECEDED) {
  const a = channels(color);
  const b = channels(ground);
  if (!a || !b) return color;
  const mix = a.map((value, index) => Math.round(value * share + b[index]! * (1 - share)));
  return `rgb(${mix.join(', ')})`;
}

/** The dash of a line: solid, the consumer's dash, or the overflow series' pattern. */
function dash(series: ChartModelSeries, width: number): number[] | 'solid' {
  switch (series.stroke) {
    case 'dashed':
      return [width * 2, width * 2];
    case 'dotted':
      return [0.1, width * 2];
    case 'dash-dot':
      return [width * 3, width * 1.5, 0.1, width * 1.5];
    default:
      return 'solid';
  }
}

function withAlpha(color: string, alpha: number) {
  const match = /^rgba?\(([^)]+)\)$/.exec(color);
  if (!match) return color;
  const [r, g, b] = match[1]!.split(/[\s,/]+/).filter(Boolean);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function axisX(model: ChartModel, index: number): number | string {
  return model.xType === 'category' ? index : (model.categories[index]!.x as number);
}

/**
 * A value an annotation names on the category axis, in the axis' own terms: a
 * category's key or its x value, which differ once records are keyed. A value
 * that names no category is undefined, and the annotation is not drawn.
 */
function annotationX(model: ChartModel, value: number | string | undefined) {
  if (value === undefined) return undefined;
  if (model.xType === 'time') return chartTime(value) ?? undefined;
  if (model.xType === 'value') return Number(value);
  const byKey = categoryIndex(model, String(value));
  if (byKey >= 0) return byKey;
  const byValue = model.categories.findIndex((category) => String(category.x) === String(value));
  return byValue >= 0 ? byValue : undefined;
}

/**
 * How far along the plot a place on the category axis falls, from 0 to 1. A
 * category axis with bars centres each category in its band; one without puts
 * the first and last categories on the plot's edges.
 */
function plotFraction(model: ChartModel, placed: number | undefined, banded: boolean): number {
  if (placed === undefined || Number.isNaN(placed)) return 0.5;
  const count = model.categories.length;
  if (model.xType === 'category') {
    if (banded) return (placed + 0.5) / Math.max(1, count);
    return count <= 1 ? 0.5 : placed / (count - 1);
  }
  const xs = model.categories
    .map((category) => annotationX(model, category.x as number | string))
    .filter((x): x is number => typeof x === 'number' && !Number.isNaN(x));
  const low = Math.min(...xs);
  const high = Math.max(...xs);
  return high === low ? 0.5 : (placed - low) / (high - low);
}

/** Where on the category axis a place falls, as left, centre or right of the plot. */
function inwardAlign(model: ChartModel, placed: number): 'left' | 'center' | 'right' {
  const count = model.categories.length;
  if (count <= 1) return 'center';
  let fraction: number;
  if (model.xType === 'category') fraction = placed / (count - 1);
  else {
    const xs = model.categories
      .map((category) => annotationX(model, category.x as number | string))
      .filter((x): x is number => typeof x === 'number' && !Number.isNaN(x));
    const low = Math.min(...xs);
    const high = Math.max(...xs);
    fraction = high === low ? 0.5 : (placed - low) / (high - low);
  }
  return fraction > 2 / 3 ? 'right' : fraction < 1 / 3 ? 'left' : 'center';
}

export function buildChartOption(view: ChartEngineView, width = 0): ChartOptionResult {
  const { model, theme } = view;
  const horizontal = model.orientation === 'horizontal';
  /* The default grid is the value axis' lines: horizontal for columns and
     lines, vertical for bars lying down. */
  const grid = view.grid ?? (horizontal ? 'vertical' : 'horizontal');
  const selection = view.selection ?? null;
  const selectedIndex = selection ? categoryIndex(model, selection.key) : -1;
  const animate = (view.animate ?? true) && theme.duration > 1;
  const textStyle = { fontFamily: theme.fontFamily, fontSize: theme.labelSize, color: theme.label };
  const seriesIndex = new Map<string, number>();

  const base: Record<string, unknown> = {
    backgroundColor: 'transparent',
    textStyle,
    animation: animate,
    animationDuration: theme.duration,
    animationDurationUpdate: theme.duration,
    animationEasing: bezier(theme.easing),
    animationEasingUpdate: bezier(theme.easing),
  };

  if (usesTexture(view)) {
    base['aria'] = { enabled: true, label: { enabled: false }, decal: { show: true } };
  }

  if (model.shape === 'pie') {
    const series = model.series[0]!;
    const inner = series.innerRadius;
    const data = model.categories
      .filter((category) => category.visible && (series.values[category.index] ?? 0) > 0)
      .map((category) => ({
        name: category.key,
        value: series.values[category.index],
        selected: selection?.key === category.key,
        itemStyle: {
          color:
            selectedIndex >= 0 && selectedIndex !== category.index
              ? recede(colorOf(theme, model.legend[category.index]!.color), theme.surface)
              : colorOf(theme, model.legend[category.index]!.color),
        },
      }));
    seriesIndex.set(series.id, 0);
    const dataIndex = new Map(data.map((slice, index) => [slice.name, index]));
    const labels = new Map(model.categories.map((category) => [category.key, category.label]));
    /* Outside labels need the ring's margin to stand in. */
    const outer = series.labels ? 62 : 76;
    const option = {
      ...base,
      series: [
        {
          type: 'pie',
          id: series.id,
          name: series.label,
          radius: [`${Math.round(inner * outer)}%`, `${outer}%`],
          center: ['50%', '50%'],
          padAngle: inner > 0 ? 1.2 : 0,
          minAngle: 2,
          avoidLabelOverlap: true,
          selectedMode: 'single',
          selectedOffset: theme.inset,
          silent: false,
          itemStyle: {
            borderColor: theme.surface,
            borderWidth: inner > 0 ? 0 : Math.max(1, theme.lineWidth / 2),
            borderRadius: inner > 0 ? theme.barRadius : 0,
          },
          label: {
            show: series.labels,
            color: theme.text,
            fontFamily: theme.fontFamily,
            fontSize: theme.labelSize,
            formatter: (params: { name: string }) => labels.get(params.name) ?? params.name,
          },
          labelLine: { show: series.labels, lineStyle: { color: theme.axis } },
          emphasis: { scale: true, scaleSize: Math.round(theme.inset / 2) },
          blur: { itemStyle: { opacity: RECEDED } },
          data,
        },
      ],
    };
    return {
      option: view.extendOption ? view.extendOption(option) : option,
      seriesIndex,
      dataIndex,
    };
  }

  const visible = model.series.filter((series) => series.visible);
  const hasBars = visible.some((series) => series.kind === 'bar');
  const splitLine = (on: boolean) => ({
    show: on,
    lineStyle: { color: theme.grid, width: 1, type: 'solid' },
  });

  /* A category label is estimated at six tenths of the type size per
     character, as the value labels below are. Its band is the plot's width,
     the client width less the grid's insets and the value labels beside the
     plot, shared between the categories. */
  const estimate = (text: string) => text.length * theme.labelSize * 0.6;
  const valueLabelRoom = model.axes.reduce((room, axis, index) => {
    const extremes = visible
      .filter((series) => series.axis === index)
      .flatMap((series) => [...series.plotted, ...series.top]);
    const longestValue = Math.max(
      0,
      ...[axis.min, axis.max, ...extremes].map((value) =>
        value === null || value === undefined ? 0 : estimate(axis.format(value)),
      ),
    );
    return room + longestValue + theme.inset;
  }, 0);
  const band =
    Math.max(0, width - theme.inset * 2 - valueLabelRoom) / Math.max(1, model.categories.length);
  const longestCategory = Math.max(
    0,
    ...model.categories.map((category) => estimate(category.label)),
  );

  const categoryAxis: Record<string, unknown> = {
    type: model.xType,
    name: model.x.label,
    nameLocation: 'middle',
    nameGap: theme.labelSize + theme.inset * 2,
    nameTextStyle: { color: theme.label, fontSize: theme.labelSize, fontFamily: theme.fontFamily },
    boundaryGap: model.xType === 'category' ? hasBars : false,
    axisLine: { show: true, lineStyle: { color: theme.axis, width: 1 } },
    axisTick: { show: false },
    axisLabel: {
      color: theme.label,
      fontSize: theme.labelSize,
      fontFamily: theme.fontFamily,
      hideOverlap: true,
      margin: Math.max(theme.inset, Math.round(theme.labelSize * 0.67)),
      /* A time or value axis puts a label wherever a tick falls, the last one
         at the plot's edge; its text runs inward so it is not cut there. */
      ...(model.xType !== 'category' ? { alignMaxLabel: 'right', alignMinLabel: 'left' } : {}),
      /* Every category keeps its label when the longest one fits its band,
         and a third of the plot when the categories stand in a column; a long
         name in a column is cut with an ellipsis, whole in the tooltip and the
         table. Where the longest does not fit, the engine thins the labels
         rather than each one being cut to a stub or touching the next. */
      ...(model.xType === 'category' && width > 0 && (horizontal || longestCategory <= band * 0.92)
        ? {
            width: horizontal ? Math.round(width / 3) : Math.round(band * 0.92),
            overflow: 'truncate',
            ellipsis: '…',
            interval: 0,
            hideOverlap: false,
            showMinLabel: true,
            showMaxLabel: true,
          }
        : {}),
      formatter: (value: number | string) =>
        model.xType === 'category' ? String(value) : model.x.format(Number(value)),
    },
    splitLine: splitLine(
      horizontal
        ? grid === 'horizontal' || grid === 'both'
        : grid === 'vertical' || grid === 'both',
    ),
    scale: model.xType === 'value',
    ...(model.xType === 'category'
      ? { data: model.categories.map((category) => category.label) }
      : {}),
    ...(horizontal && model.xType === 'category' ? { inverse: true } : {}),
  };

  /* A value axis' name stands at its end — above the axis when it is
     upright, past it when it lies down — and reads horizontally, aligned to
     the side the axis is on. Rotated along the axis it took a column of the
     plot and was the first thing a narrow chart cut. */
  const valueAxes = model.axes.map((axis, index) => ({
    type: axis.scale === 'log' ? 'log' : 'value',
    name: axis.label,
    nameLocation: 'end',
    nameGap: horizontal ? theme.inset : theme.labelSize,
    nameTextStyle: {
      color: theme.label,
      fontSize: theme.labelSize,
      fontFamily: theme.fontFamily,
      align: horizontal ? 'right' : index === 0 ? 'left' : 'right',
      verticalAlign: horizontal ? 'top' : 'bottom',
      padding: horizontal ? [theme.labelSize + theme.inset, 0, 0, 0] : 0,
    },
    splitNumber:
      horizontal && width > 0 ? Math.max(2, Math.floor(width / (theme.labelSize * 9))) : undefined,
    position: horizontal ? (index === 0 ? 'bottom' : 'top') : index === 0 ? 'left' : 'right',
    min: axis.min,
    max: axis.max,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: theme.label,
      fontSize: theme.labelSize,
      fontFamily: theme.fontFamily,
      margin: theme.inset,
      hideOverlap: true,
      formatter: (value: number) => axis.format(value),
    },
    splitLine: splitLine(
      index === 0 &&
        (horizontal
          ? grid === 'vertical' || grid === 'both'
          : grid === 'horizontal' || grid === 'both'),
    ),
  }));

  const stackTops = new Map<string, string>();
  for (const series of visible) {
    if (series.kind === 'bar' && series.stack)
      stackTops.set(`${series.axis}|${series.stack}`, series.id);
  }

  const echartsSeries = visible.map((series, position) => {
    seriesIndex.set(series.id, position);
    const color = colorOf(theme, series.color);
    const values = series.plotted;
    const data = values.map((value, index) => {
      const x = axisX(model, index);
      if (series.kind === 'scatter') {
        const size = series.sizes?.[index] ?? null;
        return value === null ? null : horizontal ? [value, x, size] : [x, value, size];
      }
      if (model.xType !== 'category') return horizontal ? [value, x] : [x, value];
      return value;
    });

    const common = {
      id: series.id,
      name: series.label,
      yAxisIndex: horizontal ? 0 : series.axis,
      xAxisIndex: horizontal ? series.axis : 0,
      emphasis: { focus: 'series', blurScope: 'coordinateSystem', scale: false },
      blur: {
        lineStyle: { opacity: RECEDED },
        itemStyle: { opacity: RECEDED },
        areaStyle: { opacity: theme.areaOpacity * RECEDED },
      },
      label: {
        show: series.labels,
        color: theme.text,
        fontFamily: theme.fontFamily,
        fontSize: theme.labelSize,
        position: series.kind === 'bar' ? (horizontal ? 'right' : 'top') : 'top',
        formatter: (params: { dataIndex: number }) => {
          const value = series.values[params.dataIndex];
          return value === null || value === undefined ? '' : series.format(value);
        },
      },
      labelLayout: series.labels ? { hideOverlap: true } : undefined,
      /* Hover is the family's: the crosshair and the markers are its overlay,
         drawn where the engine reports a point, so a pointer and a keyboard
         give the same picture. A mark that answered the pointer itself would
         light up under the mouse and not under the keyboard. Emphasis still
         reaches a silent series through `dispatchAction`, which is how the
         legend drives it. */
      silent: true,
      z: series.kind === 'bar' ? 2 : 3,
    };

    if (series.kind === 'bar') {
      const top = series.stack
        ? stackTops.get(`${series.axis}|${series.stack}`) === series.id
        : true;
      const radius = top ? theme.barRadius : 0;
      return {
        ...common,
        type: 'bar',
        stack: series.stack ? `${series.axis}|${series.stack}` : undefined,
        stackStrategy: 'samesign',
        barMaxWidth: theme.labelSize * 4,
        barGap: '16%',
        barCategoryGap: '32%',
        itemStyle: {
          color,
          borderRadius: horizontal ? [0, radius, radius, 0] : [radius, radius, 0, 0],
        },
        data: data.map((value, index) => {
          const raw = series.values[index] ?? 0;
          const receded = selectedIndex >= 0 && selectedIndex !== index;
          if (!receded && raw >= 0) return value;
          return {
            value,
            itemStyle: {
              ...(receded ? { color: recede(color, theme.surface) } : {}),
              ...(raw < 0
                ? { borderRadius: horizontal ? [radius, 0, 0, radius] : [0, 0, radius, radius] }
                : {}),
            },
          };
        }),
      };
    }

    if (series.kind === 'scatter') {
      const sizes = series.sizes?.filter((size): size is number => size !== null) ?? [];
      const largest = sizes.length ? Math.max(...sizes.map(Math.abs)) : 0;
      return {
        ...common,
        type: 'scatter',
        symbol: 'circle',
        /* A gap is a `null` item, which ECharts hands the callback as nothing. */
        symbolSize: (point: (number | null)[] | null | undefined) => {
          const size = point?.[2];
          if (!largest || size === null || size === undefined) return theme.markerSize * 1.5;
          return Math.max(
            theme.markerSize,
            Math.sqrt(Math.abs(size) / largest) * theme.labelSize * 4,
          );
        },
        itemStyle: {
          color: withAlpha(color, series.sizes ? 0.72 : 0.88),
          borderColor: color,
          borderWidth: 1,
        },
        large: model.pointCount > CANVAS_THRESHOLD,
        data,
      };
    }

    const last = values.reduce<number>(
      (found, value, index) => (value !== null ? index : found),
      -1,
    );
    const area = series.kind === 'area';
    return {
      ...common,
      type: 'line',
      stack: series.stack ? `${series.axis}|${series.stack}` : undefined,
      stackStrategy: 'samesign',
      smooth: series.curve === 'monotone',
      smoothMonotone: series.curve === 'monotone' ? (horizontal ? 'y' : 'x') : undefined,
      step: series.curve === 'step' ? 'middle' : false,
      connectNulls: series.connectNulls,
      sampling:
        (view.sampling ?? 'auto') === 'auto' && width > 0 && values.length > width
          ? 'lttb'
          : undefined,
      showSymbol: series.markers !== 'none',
      symbol: 'circle',
      /* A disc of the series colour with a ring of the ground around it, as
         the family's own marker is drawn; the ring is outside the disc, so
         the symbol grows by it. */
      symbolSize: theme.markerSize + theme.lineWidth * 1.5,
      itemStyle: { color, borderColor: theme.surface, borderWidth: theme.lineWidth * 0.75 },
      lineStyle: {
        color,
        width: theme.lineWidth,
        type: dash(series, theme.lineWidth),
        cap: 'round',
        join: 'round',
      },
      areaStyle: area
        ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color: withAlpha(color, theme.areaOpacity) },
                { offset: 1, color: withAlpha(color, series.stack ? theme.areaOpacity : 0) },
              ],
            },
          }
        : undefined,
      data:
        series.markers === 'last'
          ? data.map((value, index) => (index === last ? value : { value, symbolSize: 0 }))
          : data,
    };
  });

  /**
   * The labels of upright lines, laid out before they are drawn: each takes a
   * row where it overlaps no other, rows rise from the plot's top edge, and a
   * label past the last row is hidden — the lowest priority first — and still
   * named by the tooltip at its category. Only with a width: without one there
   * is no plot to measure against, and the inward alignment stands.
   */
  const upright = (annotation: ChartModel['annotations'][number]) =>
    !horizontal &&
    annotation.axis === 'x' &&
    annotation.kind === 'line' &&
    Boolean(annotation.label);
  const rowHeight = Math.round(theme.labelSize * 1.4);
  const plotStart = theme.inset + theme.labelSize * 3;
  const plotEnd = width - theme.inset - (model.xType !== 'category' ? theme.labelSize * 2 : 0);
  const uprightLines = model.annotations.filter(upright);
  const boxes =
    width > 0 && uprightLines.length > 0
      ? placeLineLabels(
          uprightLines.map((annotation) => ({
            at:
              plotStart +
              plotFraction(model, annotationX(model, annotation.value), hasBars) *
                (plotEnd - plotStart),
            text: annotation.label ?? '',
            priority: annotation.priority ?? 0,
            placement: annotation.labelPlacement ?? 'auto',
          })),
          { start: plotStart, end: plotEnd, charWidth: theme.labelSize * 0.6, maxRows: 2 },
        )
      : [];
  const labelRows = boxes.reduce((rows, box) => Math.max(rows, box.hidden ? 0 : box.row + 1), 0);

  /* Annotations ride on the first visible series of the axis they name,
     because ECharts draws a mark line only as part of a series. */
  for (const annotation of model.annotations) {
    const onValueAxis = annotation.axis !== 'x';
    const axisIndex = annotation.axis === 'end' ? 1 : 0;
    const host =
      echartsSeries.find(
        (series) => (horizontal ? series.xAxisIndex : series.yAxisIndex) === axisIndex,
      ) ?? echartsSeries[0];
    if (!host) continue;
    const key = onValueAxis ? (horizontal ? 'xAxis' : 'yAxis') : horizontal ? 'yAxis' : 'xAxis';
    const read = (value: number | string | undefined) =>
      onValueAxis ? Number(value) : annotationX(model, value);
    // An end the axis cannot place would reach the engine as nothing, and its mark filter throws.
    const ends = annotation.kind === 'line' ? [annotation.value] : [annotation.from, annotation.to];
    if (
      ends.some((end) => {
        const placed = read(end);
        return placed === undefined || Number.isNaN(placed);
      })
    )
      continue;
    const color = annotation.tone ? theme.tones[annotation.tone] : theme.reference;
    /* A line across the value axis carries its label above its end; a line
       across the category axis stands upright, and its label sits over its
       top, level, rather than turned along it. */
    const label = {
      show: Boolean(annotation.label),
      formatter: annotation.label ?? '',
      color: theme.text,
      fontFamily: theme.fontFamily,
      fontSize: theme.labelSize,
      position: onValueAxis || annotation.kind === 'band' ? 'insideEndTop' : 'end',
      distance: theme.inset / 2,
      /* An upright line's label is level over its top: near either end of the
         axis it leans inward, so its words stay inside the plot. */
      ...(!onValueAxis && annotation.kind === 'line' && !horizontal
        ? { align: inwardAlign(model, read(annotation.value) as number) }
        : {}),
    };
    const box = upright(annotation) ? boxes[uprightLines.indexOf(annotation)] : undefined;
    if (box !== undefined) {
      const at =
        plotStart +
        plotFraction(model, annotationX(model, annotation.value), hasBars) * (plotEnd - plotStart);
      Object.assign(label, {
        show: !box.hidden,
        align: 'center',
        offset: [Math.round((box.left + box.right) / 2 - at), -box.row * rowHeight],
      });
    }
    const target = host as Record<string, unknown>;
    if (annotation.kind === 'line') {
      const mark = (target['markLine'] as { data: unknown[] } | undefined) ?? {
        silent: true,
        symbol: 'none',
        animation: false,
        data: [] as unknown[],
      };
      mark.data.push({
        [key]: read(annotation.value),
        label,
        lineStyle: { color, width: 1, type: [4, 4] },
      });
      target['markLine'] = mark;
    } else {
      const mark = (target['markArea'] as { data: unknown[] } | undefined) ?? {
        silent: true,
        animation: false,
        data: [] as unknown[],
      };
      mark.data.push([
        { [key]: read(annotation.from), label, itemStyle: { color: withAlpha(color, 0.12) } },
        { [key]: read(annotation.to) },
      ]);
      target['markArea'] = mark;
    }
  }

  const categoryAxisKey = horizontal ? 'yAxis' : 'xAxis';
  const valueAxisKey = horizontal ? 'xAxis' : 'yAxis';
  /* Room the engine does not reserve on its own: a value axis' name above
     the grid, and the value labels past the end of a bar. A label is
     estimated at six tenths of the type size per character, which holds for
     digits and the currency signs a value is written with. */
  const named = !horizontal && model.axes.some((axis) => axis.label);
  const labelled = visible.filter((series) => series.labels && series.kind === 'bar');
  const longest = Math.max(
    0,
    ...labelled.flatMap((series) =>
      series.values.map((value) => (value === null ? 0 : series.format(value).length)),
    ),
  );
  const labelRoom = longest * theme.labelSize * 0.6 + theme.inset;
  const top = theme.inset + theme.labelSize / 2 + (named ? theme.labelSize * 1.5 : 0);
  const option: Record<string, unknown> = {
    ...base,
    grid: {
      left: theme.inset,
      /* A time or value axis may put its last label on the plot's edge, and
         the engine does not always count the half of it that hangs past. */
      right:
        theme.inset +
        (horizontal && labelled.length ? labelRoom : 0) +
        (!horizontal && model.xType !== 'category' ? theme.labelSize * 2 : 0),
      top:
        top +
        (!horizontal && labelled.length ? theme.labelSize * 1.5 : 0) +
        Math.max(0, labelRows - 1) * rowHeight,
      bottom:
        theme.inset +
        (horizontal && model.axes.some((axis) => axis.label) ? theme.labelSize * 1.5 : 0),
      outerBoundsMode: 'same',
      outerBoundsContain: 'all',
    },
    [categoryAxisKey]: [categoryAxis],
    [valueAxisKey]: valueAxes,
    series: echartsSeries,
  };

  if (view.zoomable) {
    const zoom = view.zoom ?? { start: 0, end: 1 };
    option['dataZoom'] = [
      {
        type: 'inside',
        id: 'zoom',
        [horizontal ? 'yAxisIndex' : 'xAxisIndex']: 0,
        start: zoom.start * 100,
        end: zoom.end * 100,
        /* The wheel scrolls the page unless a modifier says otherwise: a chart
           that eats the wheel traps the reader scrolling past it. */
        zoomOnMouseWheel: 'ctrl',
        moveOnMouseWheel: false,
        moveOnMouseMove: true,
        preventDefaultMouseMove: true,
        filterMode: 'filter',
      },
    ];
  }

  return {
    option: view.extendOption ? view.extendOption(option) : option,
    seriesIndex,
    dataIndex: new Map(),
  };
}

export type { ChartModelSeries };
