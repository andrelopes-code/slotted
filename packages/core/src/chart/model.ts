import { CHART_TONES } from './theme';
import { chartNumber, chartTime, createNumberFormatter, createTimeFormatter } from './format';
import type {
  ChartAnnotation,
  ChartColor,
  ChartCurve,
  ChartKind,
  ChartOrientation,
  ChartSlot,
  ChartSpec,
  ChartStackMode,
  ChartTone,
  ChartXType,
  ChartYAxis,
} from './types';

/**
 * The chart the consumer described, resolved once: every series aligned to
 * one list of categories, every colour decided, every stack summed, every
 * formatter built. The engine draws from it, the legend and the tooltip read
 * from it, and the table and the summary are written from it — four readers
 * of one answer, so none of them can disagree about where a point is or what
 * it is called.
 */

export interface ChartCategory {
  /** The point's identity along the axis; see `ChartPoint`. */
  readonly key: string;
  /** Position in the model's order, which is the order a reader moves through. */
  readonly index: number;
  /** A category's text, or the number a time or value axis places it at. */
  readonly x: number | string;
  readonly label: string;
  /** Whether a pie draws this slice. Always true on a cartesian chart. */
  readonly visible: boolean;
}

export interface ChartModelSeries {
  readonly id: string;
  readonly label: string;
  readonly kind: ChartKind;
  readonly color: ChartColor;
  readonly stack: string | null;
  /** Index of the value axis: 0 for `start`, 1 for `end`. */
  readonly axis: 0 | 1;
  readonly curve: ChartCurve;
  /**
   * The line's dash. A consumer asks for `solid` or `dashed`; a series past
   * the eighth slot is given `dashed`, `dotted` or `dash-dot` in turn, because
   * it shares its colour with every other series past the eighth and a line
   * has no fill to carry a texture.
   */
  readonly stroke: 'solid' | 'dashed' | 'dotted' | 'dash-dot';
  readonly connectNulls: boolean;
  readonly markers: 'none' | 'last' | 'all';
  readonly labels: boolean;
  readonly innerRadius: number;
  readonly visible: boolean;
  /** The consumer's values, one per category. */
  readonly values: readonly (number | null)[];
  /** What is drawn: the value, or its share of the stack under `percent`. */
  readonly plotted: readonly (number | null)[];
  /** Where a stacked mark ends, in plotted units; the value itself when unstacked. */
  readonly top: readonly (number | null)[];
  /** A bubble's size, when the series names a size field. */
  readonly sizes: readonly (number | null)[] | null;
  readonly format: (value: number) => string;
}

export interface ChartModelAxis {
  readonly label: string | undefined;
  readonly scale: 'linear' | 'log';
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly format: (value: number) => string;
}

export interface ChartLegendEntry {
  readonly key: string;
  readonly label: string;
  readonly kind: ChartKind;
  readonly color: ChartColor;
  readonly visible: boolean;
}

export interface ChartModelAnnotation extends ChartAnnotation {
  readonly axis: 'x' | 'start' | 'end';
}

export type ChartEmptyReason = 'no-data' | 'all-hidden';

export interface ChartModel {
  readonly shape: 'cartesian' | 'pie';
  readonly xType: ChartXType;
  readonly orientation: ChartOrientation;
  readonly stackMode: ChartStackMode;
  readonly locale: string | undefined;
  readonly x: {
    readonly field: string;
    readonly label: string | undefined;
    readonly format: (value: number | string) => string;
  };
  readonly categories: readonly ChartCategory[];
  readonly series: readonly ChartModelSeries[];
  readonly axes: readonly ChartModelAxis[];
  readonly legend: readonly ChartLegendEntry[];
  readonly annotations: readonly ChartModelAnnotation[];
  readonly empty: ChartEmptyReason | null;
  /** Values a pie cannot draw: negative ones. They stay in the table. */
  readonly excluded: number;
  /** A pie's total over its visible slices. */
  readonly total: number;
  /** How many marks are visible, which is what the renderer and sampling decide by. */
  readonly pointCount: number;
}

const SLOTS: readonly ChartSlot[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Slots are assigned in order and never cycled
 * (`docs/token-foundation.md`, Data). A slot a series names is taken out of
 * the sequence before the others are assigned, so naming slot 1 on the third
 * series does not paint the first series the same colour. A tone takes no
 * slot, because it says what a series means rather than which one it is.
 */
export function assignColors(
  requests: readonly {
    readonly slot?: ChartSlot | undefined;
    readonly tone?: ChartTone | undefined;
  }[],
): ChartColor[] {
  const claimed = new Set(requests.map((request) => request.slot).filter(Boolean));
  const free = SLOTS.filter((slot) => !claimed.has(slot));
  return requests.map((request) => {
    if (request.tone) return { type: 'tone', tone: request.tone };
    if (request.slot) return { type: 'slot', slot: request.slot };
    const slot = free.shift();
    return slot === undefined ? { type: 'overflow' } : { type: 'slot', slot };
  });
}

function uniqueKeys(keys: readonly string[]) {
  const seen = new Map<string, number>();
  return keys.map((key) => {
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count === 0 ? key : `${key}#${count + 1}`;
  });
}

function axisList(y: ChartSpec['y']): readonly ChartYAxis[] {
  if (!y) return [{}];
  return Array.isArray(y) ? (y as readonly ChartYAxis[]) : [y as ChartYAxis];
}

export interface ChartModelOptions {
  /** Keys of the legend entries that are hidden: series ids, or a pie's category keys. */
  readonly hidden?: readonly string[] | undefined;
}

export function createChartModel(spec: ChartSpec, options: ChartModelOptions = {}): ChartModel {
  const hidden = new Set(options.hidden ?? []);
  const locale = spec.locale;
  const pie = spec.series.some((series) => series.kind === 'pie');
  if (pie && spec.series.length > 1) {
    throw new Error(
      'chart: a pie holds one series and shares its plot with nothing; draw two pies side by side instead',
    );
  }

  const xField = spec.x?.field ?? '';
  const xType: ChartXType = pie
    ? 'category'
    : (spec.x?.type ??
      (spec.series.some((series) => series.kind === 'scatter') ? 'value' : 'category'));
  const orientation: ChartOrientation = spec.orientation ?? 'vertical';
  const stackMode: ChartStackMode = spec.stackMode ?? 'normal';

  /* The records a reader moves through, in the order they read them: the
     consumer's order on a category axis, ascending on a time or value axis.
     A record whose position cannot be read is a gap in the axis and is left
     out of it — it stays in the consumer's data and nowhere is it zero. */
  const placed = spec.data
    .map((record, index) => {
      const raw = record[xField];
      const x: number | string | null =
        xType === 'time'
          ? chartTime(raw)
          : xType === 'value'
            ? chartNumber(raw)
            : raw === undefined || raw === null
              ? String(index + 1)
              : String(raw);
      return { record, index, raw, x };
    })
    .filter((entry): entry is typeof entry & { x: number | string } => entry.x !== null);
  if (xType !== 'category') placed.sort((a, b) => (a.x as number) - (b.x as number));

  const times = xType === 'time' ? placed.map((entry) => entry.x as number) : [];
  const span = times.length > 1 ? times[times.length - 1]! - times[0]! : 0;
  const formatX: (value: number | string) => string =
    xType === 'time'
      ? (
          (format) => (value) =>
            format(Number(value))
        )(createTimeFormatter(spec.x?.format as never, locale, span))
      : xType === 'value'
        ? (
            (format) => (value) =>
              format(Number(value))
          )(createNumberFormatter(spec.x?.format as never, locale))
        : (value) => String(value);

  const keys = uniqueKeys(
    placed.map((entry) => {
      if (spec.recordKey !== undefined && entry.record[spec.recordKey] !== undefined) {
        return String(entry.record[spec.recordKey]);
      }
      if (xType === 'value') return String(entry.index);
      if (xType === 'time') return typeof entry.raw === 'string' ? entry.raw : String(entry.x);
      return String(entry.x);
    }),
  );

  const pieSeries = pie ? spec.series[0] : undefined;
  /* A slice names its slot or its tone through the fields the series points
     at; what a record does not name, or names wrongly, is assigned in order. */
  const categoryColors = pie
    ? assignColors(
        placed.map((entry) => {
          const slot =
            pieSeries?.slotField === undefined ? undefined : entry.record[pieSeries.slotField];
          const tone =
            pieSeries?.toneField === undefined ? undefined : entry.record[pieSeries.toneField];
          return {
            ...(SLOTS.includes(Number(slot) as ChartSlot) && slot !== null && slot !== ''
              ? { slot: Number(slot) as ChartSlot }
              : {}),
            ...(CHART_TONES.includes(tone as ChartTone) ? { tone: tone as ChartTone } : {}),
          };
        }),
      )
    : [];
  const categories: ChartCategory[] = placed.map((entry, index) => ({
    key: keys[index]!,
    index,
    x: entry.x,
    label: formatX(entry.x),
    visible: !pie || !hidden.has(keys[index]!),
  }));

  const axesSpec = axisList(spec.y);
  const percent = stackMode === 'percent';
  const axes: ChartModelAxis[] = axesSpec.slice(0, 2).map((axis) => ({
    label: axis.label,
    scale: axis.scale ?? 'linear',
    min: percent ? 0 : axis.min,
    max: percent ? 100 : axis.max,
    format: percent
      ? (
          (format) => (value: number) =>
            format(value / 100)
        )(createNumberFormatter({ style: 'percent', maximumFractionDigits: 0 }, locale))
      : createNumberFormatter(axis.format, locale),
  }));

  const colors = pie ? [] : assignColors(spec.series);
  const ids = uniqueKeys(spec.series.map((series) => series.id ?? series.field));

  const OVERFLOW_STROKES = ['dashed', 'dotted', 'dash-dot'] as const;
  let overflowIndex = 0;
  const base = spec.series.map((series, position) => {
    const axisIndex: 0 | 1 = series.axis === 'end' && axes.length > 1 ? 1 : 0;
    const values = placed.map((entry) => chartNumber(entry.record[series.field]));
    return {
      id: ids[position]!,
      label: series.label ?? ids[position]!,
      kind: series.kind,
      color: pie ? ({ type: 'slot', slot: 1 } as ChartColor) : colors[position]!,
      stack: series.kind === 'pie' || series.kind === 'scatter' ? null : (series.stack ?? null),
      axis: axisIndex,
      curve: series.curve ?? 'linear',
      stroke:
        !pie && colors[position]!.type === 'overflow' && series.stroke === undefined
          ? OVERFLOW_STROKES[overflowIndex++ % OVERFLOW_STROKES.length]!
          : (series.stroke ?? 'solid'),
      connectNulls: series.connectNulls ?? false,
      markers: series.markers ?? 'none',
      labels: series.labels ?? false,
      innerRadius: Math.min(Math.max(series.innerRadius ?? 0, 0), 0.9),
      visible: pie || !hidden.has(ids[position]!),
      values,
      sizes: series.sizeField
        ? placed.map((entry) => chartNumber(entry.record[series.sizeField!]))
        : null,
      format: createNumberFormatter(series.format ?? axesSpec[axisIndex]?.format, locale),
    };
  });

  /* Stacks are summed over the visible series only: hiding a series takes
     it out of the pile, and under `percent` out of the whole. Positive and
     negative values pile separately, which is ECharts' `samesign` rule and
     the reading every surveyed library gives a stacked bar that crosses
     zero. */
  const stacked = base.map((series) => ({
    ...series,
    plotted: series.values as (number | null)[],
    top: series.values as (number | null)[],
  }));
  const groups = new Map<string, typeof stacked>();
  for (const series of stacked) {
    if (!series.stack || !series.visible) continue;
    const name = `${series.axis}|${series.stack}`;
    groups.set(name, [...(groups.get(name) ?? []), series]);
  }
  for (const members of groups.values()) {
    const totals = categories.map((_, index) =>
      members.reduce((sum, series) => sum + Math.abs(series.values[index] ?? 0), 0),
    );
    const positive = categories.map(() => 0);
    const negative = categories.map(() => 0);
    for (const series of members) {
      const plotted = series.values.map((value, index) =>
        value === null
          ? null
          : percent
            ? totals[index]
              ? (value / totals[index]!) * 100
              : 0
            : value,
      );
      series.plotted = plotted;
      series.top = plotted.map((value, index) => {
        if (value === null) return null;
        if (value >= 0) return (positive[index] = positive[index]! + value);
        return (negative[index] = negative[index]! + value);
      });
    }
  }

  const series: ChartModelSeries[] = stacked;
  const legend: ChartLegendEntry[] = pie
    ? categories.map((category, index) => ({
        key: category.key,
        label: category.label,
        kind: 'pie',
        color: categoryColors[index]!,
        visible: category.visible,
      }))
    : series.map((entry) => ({
        key: entry.id,
        label: entry.label,
        kind: entry.kind,
        color: entry.color,
        visible: entry.visible,
      }));

  const pieValues = pieSeries ? series[0]!.values : [];
  const excluded = pieValues.filter((value) => value !== null && value < 0).length;
  const total = categories.reduce(
    (sum, category, index) =>
      category.visible && (pieValues[index] ?? 0) > 0 ? sum + pieValues[index]! : sum,
    0,
  );

  const anyValue = series.some((entry) => entry.values.some((value) => value !== null));
  const anyVisible = pie
    ? categories.some((category) => category.visible)
    : series.some((entry) => entry.visible);
  const empty: ChartEmptyReason | null =
    categories.length === 0 || series.length === 0 || !anyValue
      ? 'no-data'
      : !anyVisible
        ? 'all-hidden'
        : null;

  const pointCount = pie
    ? categories.filter((category) => category.visible).length
    : series
        .filter((entry) => entry.visible)
        .reduce((count, entry) => count + entry.values.filter((value) => value !== null).length, 0);

  return {
    shape: pie ? 'pie' : 'cartesian',
    xType,
    orientation,
    stackMode,
    locale,
    x: { field: xField, label: spec.x?.label, format: formatX },
    categories,
    series,
    axes,
    legend,
    annotations: (spec.annotations ?? []).map((annotation) => ({
      ...annotation,
      axis: annotation.axis ?? 'start',
    })),
    empty,
    excluded,
    total,
    pointCount,
  };
}

/** The series a point belongs to, or `undefined` for a key the chart does not hold. */
export function seriesOf(model: ChartModel, id: string) {
  return model.series.find((series) => series.id === id);
}

export function categoryIndex(model: ChartModel, key: string) {
  return model.categories.findIndex((category) => category.key === key);
}

/** The series a reader can move between: visible, and on a pie the single one. */
export function visibleSeries(model: ChartModel) {
  return model.series.filter((series) => series.visible);
}
