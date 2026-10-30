import { createNumberFormatter } from './format';
import { categoryIndex, type ChartModel, seriesOf, visibleSeries } from './model';
import type { ChartColor, ChartKind, ChartPoint, ChartTrigger } from './types';

/**
 * What a tooltip shows, as data. The default tooltip renders it; a custom one
 * receives it and renders anything. MUI hands a custom tooltip the same
 * pieces through `useItemTooltip` and `useAxesTooltip`; here one object
 * serves both triggers, so a consumer writes one template for both.
 */
export interface ChartTooltipItem {
  readonly series: string;
  readonly label: string;
  readonly kind: ChartKind;
  readonly color: ChartColor;
  readonly value: number | null;
  readonly formatted: string;
  /** The share of the stack or of the pie, formatted, when there is one. */
  readonly share: string | null;
  /** The item the pointer or the keyboard is on. */
  readonly current: boolean;
}

export interface ChartTooltipContext {
  readonly point: ChartPoint;
  readonly trigger: Exclude<ChartTrigger, 'none'>;
  readonly title: string;
  readonly items: readonly ChartTooltipItem[];
  readonly total: { readonly value: number; readonly formatted: string } | null;
  /**
   * The labels of the upright lines that stand on this category. A label the
   * plot had no room to draw is read here, where the reader's pointer is.
   */
  readonly notes: readonly string[];
}

export interface ChartTooltipOptions {
  readonly trigger?: ChartTrigger | undefined;
  readonly sort?: 'none' | 'asc' | 'desc' | undefined;
  /** Shows the total of a stack. Defaults to on for stacked series. */
  readonly total?: boolean | undefined;
}

/** The trigger a chart uses when the consumer names none. */
export function defaultTrigger(model: ChartModel): Exclude<ChartTrigger, 'none'> {
  if (model.shape === 'pie') return 'item';
  return visibleSeries(model).every((series) => series.kind === 'scatter') ? 'item' : 'axis';
}

export function tooltipContext(
  model: ChartModel,
  point: ChartPoint | null,
  options: ChartTooltipOptions = {},
): ChartTooltipContext | null {
  if (!point || options.trigger === 'none') return null;
  const index = categoryIndex(model, point.key);
  const active = seriesOf(model, point.series);
  if (index < 0 || !active) return null;
  const trigger = options.trigger ?? defaultTrigger(model);
  const category = model.categories[index]!;
  const notes = model.annotations
    .filter(
      (annotation) =>
        annotation.kind === 'line' &&
        annotation.axis === 'x' &&
        annotation.label !== undefined &&
        annotation.value !== undefined &&
        (String(annotation.value) === point.key || String(annotation.value) === String(category.x)),
    )
    .map((annotation) => annotation.label as string);
  const percent = createNumberFormatter(
    { style: 'percent', maximumFractionDigits: 1 },
    model.locale,
  );

  if (model.shape === 'pie') {
    const value = active.values[index] ?? null;
    const legend = model.legend[index]!;
    return {
      point,
      trigger: 'item',
      title: active.label,
      items: [
        {
          series: active.id,
          label: category.label,
          kind: 'pie',
          color: legend.color,
          value,
          formatted: value === null ? '' : active.format(value),
          share: value === null ? null : percent(model.total ? value / model.total : 0),
          current: true,
        },
      ],
      total: null,
      notes: [],
    };
  }

  const members =
    trigger === 'item'
      ? [active]
      : visibleSeries(model).filter((series) => series.values[index] !== null);
  const stacked = members.some((series) => series.stack !== null);
  let items: ChartTooltipItem[] = members.map((series) => {
    const value = series.values[index] ?? null;
    return {
      series: series.id,
      label: series.label,
      kind: series.kind,
      color: series.color,
      value,
      formatted: value === null ? '' : series.format(value),
      share:
        model.stackMode === 'percent' && series.stack && series.plotted[index] !== null
          ? percent(series.plotted[index]! / 100)
          : null,
      current: series.id === active.id,
    };
  });
  if (options.sort === 'asc' || options.sort === 'desc') {
    const direction = options.sort === 'asc' ? 1 : -1;
    items = [...items].sort((a, b) =>
      a.value === null ? 1 : b.value === null ? -1 : direction * (a.value - b.value),
    );
  }
  const wantsTotal = options.total ?? stacked;
  const summed = items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  return {
    point,
    trigger,
    title: category.label,
    items,
    total:
      wantsTotal && items.length > 1 ? { value: summed, formatted: active.format(summed) } : null,
    notes,
  };
}

export interface TooltipPlacement {
  readonly x: number;
  readonly y: number;
  readonly side: 'start' | 'end';
  /** A strip across the plot's top edge rather than a box beside the point. */
  readonly docked: boolean;
}

/**
 * Below this plot width a box beside the point covers most of the plot, and
 * on a phone the finger covers the rest: the tooltip docks to the top edge.
 */
export const TOOLTIP_DOCK_WIDTH = 360;

/**
 * Where the tooltip's box goes inside the plot. It sits on the inline-end
 * side of the anchor, a gap away, and flips to the start side when it would
 * cross the plot's edge; its block position centres on the anchor and is held
 * inside the plot. The plot does not mirror, but the tooltip is text, so in a
 * right-to-left document its preferred side is the left.
 *
 * Coordinates are CSS pixels from the plot's top-left corner, which is also
 * what the engine reports a point's position in.
 */
export function placeTooltip(request: {
  readonly anchor: { readonly x: number; readonly y: number };
  readonly size: { readonly width: number; readonly height: number };
  readonly bounds: { readonly width: number; readonly height: number };
  readonly gap?: number;
  readonly dir?: 'ltr' | 'rtl';
  /** The width below which the tooltip docks. */
  readonly dockBelow?: number;
}): TooltipPlacement {
  const { anchor, size, bounds } = request;
  if (bounds.width < (request.dockBelow ?? TOOLTIP_DOCK_WIDTH)) {
    return { x: 0, y: 0, side: 'end', docked: true };
  }
  const gap = request.gap ?? 12;
  const right = anchor.x + gap;
  const left = anchor.x - gap - size.width;
  const fitsRight = right + size.width <= bounds.width;
  const fitsLeft = left >= 0;
  const preferLeft = request.dir === 'rtl';
  let x: number;
  let side: 'start' | 'end';
  if (preferLeft ? fitsLeft || !fitsRight : !fitsRight && fitsLeft) {
    x = fitsLeft ? left : Math.max(0, bounds.width - size.width);
    side = preferLeft ? 'end' : 'start';
  } else {
    x = fitsRight ? right : Math.max(0, bounds.width - size.width);
    side = preferLeft ? 'start' : 'end';
  }
  const y = Math.min(
    Math.max(0, anchor.y - size.height / 2),
    Math.max(0, bounds.height - size.height),
  );
  return { x: Math.round(x), y: Math.round(y), side, docked: false };
}
