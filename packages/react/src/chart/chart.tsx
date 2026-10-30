/* The chart draws three other families inside its plot — the skeleton while
   it waits, a result state when it is empty or failed, a button in that
   state — so it brings their stylesheets with its own. */
import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/button/button.css';
import '@slotted/styles/result-state/result-state.css';
import '@slotted/styles/skeleton/skeleton.css';
import '@slotted/styles/chart/chart.css';

import {
  cachedChartTheme,
  categoryIndex,
  chartKeyAction,
  chartTable,
  chartToCsv,
  createChartModel,
  createLatestAnnouncer,
  defaultTrigger,
  describeChart,
  describePoint,
  describeZoom,
  firstPoint,
  FULL_ZOOM,
  isDrawn,
  isFullZoom,
  observeChartTheme,
  placeLayer,
  placeTooltip,
  readChartTheme,
  sameTheme,
  seriesOf,
  toggleHidden,
  TOOLTIP_DOCK_WIDTH,
  tooltipContext,
  trackModality,
} from '@slotted/core/chart';
import type {
  ActivationReason,
  ChartColor,
  ChartLegendEntry,
  ChartModel,
  ChartPoint,
  ChartRecord,
  ChartSpec,
  ChartTheme,
  ChartTooltipContext,
  ChartZoom,
} from '@slotted/core/chart';
import { mountChartEngine } from '@slotted/core/chart-echarts';
import { createFocusOrigin } from '@slotted/core/focus';
import { chartMessages } from '@slotted/core/i18n';
import type { ChartEngine, ChartPointLocation } from '@slotted/core/chart-echarts';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { collapseState } from '@slotted/core/overflow';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
  ToggleEvent as ReactToggleEvent,
} from 'react';

import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { useChartDefaults } from './chart-defaults';
import type {
  ChartLegendItemProps,
  ChartProps,
  ChartRootProps,
  ChartTooltipSettings,
} from './chart.types';

/* ── State ──────────────────────────────────────────────────────────────── */

const NO_KEYS: readonly string[] = Object.freeze([]);
const samePoint = (a: ChartPoint | null, b: ChartPoint | null) =>
  a === b || (a !== null && b !== null && a.series === b.series && a.key === b.key);
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
const sameZoom = (a: ChartZoom, b: ChartZoom) => a.start === b.start && a.end === b.end;

const isPlain = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Arrays and plain objects by their content; anything else, a formatter among them, by identity. */
function sameShape(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a)) {
    return (
      Array.isArray(b) && a.length === b.length && a.every((value, i) => sameShape(value, b[i]))
    );
  }
  if (!isPlain(a) || !isPlain(b)) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && sameShape(a[key], b[key]))
  );
}

/**
 * A configuration a parent writes as a literal, kept as the one before while
 * its content is the same. Read by identity, a parent that drew again rebuilt
 * the model, measured the legend and redrew the engine for an unchanged chart.
 */
function useSameShape<T>(value: T): T {
  const kept = useRef(value);
  if (!sameShape(kept.current, value)) kept.current = value;
  return kept.current;
}

/**
 * One value in the library's two modes (`docs/state-and-events.md`): the
 * consumer's value when it states one, the family's own otherwise, and every
 * move a request through `@slotted/core/state` that the consumer may cancel.
 */
function useControllable<T>(
  controlled: T | undefined,
  initial: T,
  onChange: ((value: T, request: ChangeRequest<T>) => void) | undefined,
  equals: (a: T, b: T) => boolean,
) {
  const [own, setOwn] = useState(initial);
  const value = controlled !== undefined ? controlled : own;
  const latest = useRef({ controlled, value, onChange });
  latest.current = { controlled, value, onChange };
  const request = useCallback(
    (next: T, reason: ChangeReason, source?: unknown) => {
      const current = latest.current;
      const state = createControllable<T>({
        controlled: current.controlled,
        initial: current.value,
        equals,
        onRequest: (asked) => current.onChange?.(asked.value, asked),
      });
      if (state.request(next, reason, source)) setOwn(next);
    },
    [equals],
  );
  return [value, request] as const;
}

/* ── Overlay ────────────────────────────────────────────────────────────── */

interface Overlay {
  readonly crosshair: (ChartPointLocation & { readonly isBand: boolean }) | null;
  readonly markers: readonly {
    readonly key: string;
    readonly color: ChartColor;
    readonly at: ChartPointLocation;
    readonly selected: boolean;
    readonly current: boolean;
  }[];
  readonly tooltip: ChartTooltipContext | null;
  readonly docked: boolean;
}

const NO_OVERLAY: Overlay = { crosshair: null, markers: [], tooltip: null, docked: false };

/** Whether focus came by keyboard; an engine without `:focus-visible` says no. */
function focusVisible(element: Element) {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
}

function lastDrawn(values: readonly (number | null)[]) {
  for (let index = values.length - 1; index >= 0; index -= 1)
    if (values[index] !== null) return index;
  return -1;
}

function colorAttributes(color: ChartColor): Record<string, string> {
  if (color.type === 'slot') return { 'data-slot': String(color.slot) };
  if (color.type === 'tone') return { 'data-tone': color.tone };
  return { 'data-overflow': '' };
}

function pixels(values: Record<string, number>): CSSProperties {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, `${value}px`]),
  ) as CSSProperties;
}

/* ── Layers: the menu, the `+N` legend, the help ────────────────────────── */

/**
 * A native popover under its control. The top layer, light dismiss and
 * `Escape` are the platform's; where it goes is `placeLayer`, and focus goes
 * into it on open and back to the control on close. A browser without the
 * Popover API — the test environment among them — leaves it closed.
 */
function useLayer(align: 'start' | 'end', focusFirst = true) {
  const control = useRef<HTMLButtonElement | null>(null);
  const layer = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const onToggle = (event: ReactToggleEvent<HTMLDivElement>) => {
    const isOpen = event.newState === 'open';
    setOpen(isOpen);
    const node = layer.current;
    const anchor = control.current;
    if (!node || !anchor) return;
    if (isOpen) {
      const box = node.getBoundingClientRect();
      const at = placeLayer({
        anchor: anchor.getBoundingClientRect(),
        size: { width: box.width, height: box.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        align,
        dir: getComputedStyle(anchor).direction === 'rtl' ? 'rtl' : 'ltr',
      });
      node.style.setProperty('--slotted-chart-x', `${at.x}px`);
      node.style.setProperty('--slotted-chart-y', `${at.y}px`);
      if (focusFirst) node.querySelector<HTMLElement>('button')?.focus();
    } else if (node.contains(document.activeElement) || document.activeElement === document.body) {
      anchor.focus();
    }
  };

  /* A layer's buttons move by arrow, as a menu's do. */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button')].filter(
      (item) => !item.hidden,
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    let next: HTMLElement | undefined;
    if (step) next = items[(index + step + items.length) % items.length];
    if (event.key === 'Home') next = items[0];
    if (event.key === 'End') next = items[items.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  return {
    open,
    close: () => layer.current?.hidePopover?.(),
    controlProps: {
      ref: control,
      'aria-expanded': open,
      ...(open ? { 'data-open': '' } : {}),
      onClick: () => layer.current?.togglePopover?.(),
    },
    layerProps: { ref: layer, popover: 'auto' as const, onToggle, onKeyDown },
  };
}

/** The reason a control was pressed with, read from its own element. */
function useModality(): [RefObject<HTMLButtonElement | null>, () => ActivationReason] {
  const element = useRef<HTMLButtonElement | null>(null);
  const tracker = useRef<ReturnType<typeof trackModality> | null>(null);
  useEffect(() => {
    if (!element.current) return undefined;
    const handle = trackModality(element.current);
    tracker.current = handle;
    return () => handle.destroy();
  }, []);
  return [element, () => tracker.current?.read() ?? 'programmatic'];
}

function assignRef<T>(
  ref: ChartRootProps['ref'] | RefObject<T | null> | undefined,
  value: T | null,
) {
  if (typeof ref === 'function') ref(value as never);
  else if (ref && typeof ref === 'object') (ref as RefObject<T | null>).current = value;
}

/* ── The default tooltip, exported for a custom one to compose ─────────── */

export interface ChartTooltipContentProps {
  readonly context: ChartTooltipContext;
  readonly model: ChartModel;
  readonly totalLabel: string;
  readonly indicator?: ChartTooltipSettings['indicator'];
}

/**
 * The tooltip the chart draws when the consumer draws none: the category,
 * one row per series with its mark, label and value, and the total of a
 * stack. A custom tooltip may render it and add to it.
 */
export function ChartTooltipContent({
  context,
  model,
  totalLabel,
  indicator,
}: ChartTooltipContentProps) {
  return (
    <>
      <div data-part="tooltip-title" data-part-tooltip-title="">
        {context.title}
      </div>
      {context.notes.map((note) => (
        <div data-part="tooltip-note" data-part-tooltip-note="" key={note}>
          {note}
        </div>
      ))}
      {context.items.map((item) => {
        const series = seriesOf(model, item.series);
        const kind =
          indicator === 'line' || item.kind === 'line'
            ? 'line'
            : item.kind === 'scatter'
              ? 'scatter'
              : 'bar';
        return (
          <div
            data-part="tooltip-item"
            data-part-tooltip-item=""
            {...(context.items.length > 1 && item.current ? { 'data-current': '' } : {})}
            {...colorAttributes(item.color)}
            key={`${item.series}-${item.label}`}
          >
            {indicator === 'none' ? null : (
              <span
                data-kind={kind}
                data-part="tooltip-marker"
                data-part-tooltip-marker=""
                {...(series && series.stroke !== 'solid' ? { 'data-stroke': series.stroke } : {})}
              />
            )}
            <span data-part="tooltip-label" data-part-tooltip-label="">
              {item.label}
            </span>
            <span data-part="tooltip-value" data-part-tooltip-value="">
              {item.share ? `${item.share} · ${item.formatted}` : item.formatted}
            </span>
          </div>
        );
      })}
      {context.total ? (
        <div data-part="tooltip-total" data-part-tooltip-total="">
          <span>{totalLabel}</span>
          <span data-part="tooltip-value" data-part-tooltip-value="">
            {context.total.formatted}
          </span>
        </div>
      ) : null}
    </>
  );
}

/* ── The chart ──────────────────────────────────────────────────────────── */

/**
 * A figure: a caption that names it, a toolbar of its own controls, a legend
 * of toggles, and a plot the engine draws marks into and the family draws
 * every interaction over. The engine is ECharts, loaded on demand by
 * `@slotted/core/chart-echarts`, one chunk per kind; everything a reader
 * operates — legend, tooltip, table, toolbar — is this component's HTML.
 *
 * The model, the keyboard, the text alternatives and the theme are
 * `@slotted/core/chart`'s, shared with the Angular binding; this file is the
 * React state around them.
 */
export function Chart<Row extends object = ChartRecord>(props: ChartProps<Row>) {
  const {
    data,
    series,
    x,
    y,
    orientation,
    stackMode,
    annotations,
    recordKey,
    locale,
    title,
    description,
    help,
    actions,
    messages,
    size,
    variant,
    palette,
    toolbar,
    grid,
    texture,
    renderer,
    sampling,
    animate,
    legend: showLegend,
    legendInteractive,
    legendValues,
    legendOverflow,
    trigger: triggerProp,
    tooltip: tooltipProp,
    zoomable,
    selectable,
    loading,
    error,
    onRetry,
    hidden,
    defaultHidden,
    onHiddenChange,
    activePoint,
    defaultActivePoint,
    onActivePointChange,
    selection,
    defaultSelection,
    onSelectionChange,
    zoom,
    defaultZoom,
    onZoomChange,
    tableOpen,
    defaultTableOpen,
    onTableOpenChange,
    fullscreen,
    defaultFullscreen,
    onFullscreenChange,
    renderTooltip,
    renderLegendItem,
    renderCenter,
    renderEmpty,
    renderError,
    render,
    extendOption,
    handleRef,
    ref,
    ...nativeProps
  } = props;

  const defaults = useChartDefaults();
  const id = useId();
  const t = useMessages(chartMessages, messages);
  const appLocale = useLocale();
  const resolved = {
    size: size ?? defaults.size ?? 'md',
    variant: variant ?? defaults.variant ?? 'plain',
    palette: palette ?? defaults.palette ?? 'categorical',
    toolbar: toolbar ?? defaults.toolbar ?? 'visible',
    renderer: renderer ?? defaults.renderer ?? 'auto',
    grid: grid ?? defaults.grid,
    legendOverflow: legendOverflow ?? defaults.legendOverflow ?? 'collapse',
    animate: animate ?? defaults.animate ?? true,
    tooltip: { ...defaults.tooltip, ...tooltipProp },
  };

  const [hiddenValue, requestHidden] = useControllable(
    hidden,
    defaultHidden ?? NO_KEYS,
    onHiddenChange,
    sameList,
  );
  const [activeValue, requestActive] = useControllable(
    activePoint,
    defaultActivePoint ?? null,
    onActivePointChange,
    samePoint,
  );
  const [selectionValue, requestSelection] = useControllable(
    selection,
    defaultSelection ?? null,
    onSelectionChange,
    samePoint,
  );
  const [zoomValue, requestZoom] = useControllable(
    zoom,
    defaultZoom ?? FULL_ZOOM,
    onZoomChange,
    sameZoom,
  );
  const [tableValue, requestTable] = useControllable(
    tableOpen,
    defaultTableOpen ?? false,
    onTableOpenChange,
    Object.is,
  );
  const [fullscreenValue, requestFullscreen] = useControllable(
    fullscreen,
    defaultFullscreen ?? false,
    onFullscreenChange,
    Object.is,
  );

  const sameSeries = useSameShape(series);
  const sameX = useSameShape(x);
  const sameY = useSameShape(y);
  const sameAnnotations = useSameShape(annotations);
  const spec = useMemo<ChartSpec>(
    () => ({
      // The model reads a record only by the fields the series name, which `Row` constrains.
      data: data as readonly ChartRecord[],
      series: sameSeries,
      x: sameX,
      y: sameY,
      orientation,
      stackMode,
      annotations: sameAnnotations,
      recordKey,
      locale: locale ?? appLocale,
    }),
    [
      data,
      sameSeries,
      sameX,
      sameY,
      orientation,
      stackMode,
      sameAnnotations,
      recordKey,
      locale,
      appLocale,
    ],
  );
  const built = useMemo(() => {
    try {
      return { model: createChartModel(spec, { hidden: hiddenValue }), failure: null as unknown };
    } catch (failure) {
      return { model: null, failure };
    }
  }, [spec, hiddenValue]);
  const model = built.model;
  const [engineFailure, setEngineFailure] = useState<unknown>(null);
  const failed = Boolean(error) || built.failure !== null || engineFailure !== null;
  const waiting = Boolean(loading);
  const drawable = Boolean(model && !waiting && !failed && !model.empty);
  const usable = Boolean(model && !waiting && !failed && model.empty !== 'no-data');
  const trigger = model ? (triggerProp ?? defaultTrigger(model)) : 'none';

  const figure = useRef<HTMLElement | null>(null);
  const plot = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLDivElement | null>(null);
  const tooltipNode = useRef<HTMLDivElement | null>(null);
  const legendNode = useRef<HTMLDivElement | null>(null);
  const engine = useRef<ChartEngine | null>(null);
  const [theme, setTheme] = useState<ChartTheme | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(NO_OVERLAY);
  const pointAnnouncer = useMemo(
    () => createLatestAnnouncer((message) => getLiveAnnouncer().announce(message)),
    [],
  );
  const announce = (message: string) => getLiveAnnouncer().announce(message);

  /* ── The theme, read from the stylesheet at the plot ─────────────────── */

  /* Not a layout effect: a read computes styles, and inside the mount commit
     it forced a style recalculation of the whole page just committed, then a
     second render before the first paint. A context another chart already
     read takes the stored theme; otherwise the read waits for the frame. The
     engine draws after paint either way. */
  useEffect(() => {
    const node = plot.current;
    if (!node) return undefined;
    const view = node.ownerDocument.defaultView;
    const apply = (next: ChartTheme) =>
      setTheme((previous) => (sameTheme(previous, next) ? previous : next));
    const read = () => apply(readChartTheme(node));
    const cached = cachedChartTheme(node);
    let frame = 0;
    if (cached) apply(cached);
    else if (view) {
      frame = view.requestAnimationFrame(() => {
        frame = 0;
        read();
      });
    }
    const stop = observeChartTheme(node, read);
    return () => {
      stop();
      if (frame) view?.cancelAnimationFrame(frame);
    };
    /* A palette, a variant or the full screen repaint the root's tokens,
       which the document observer does not see because they are the chart's
       own attributes. */
  }, [resolved.palette, resolved.variant, fullscreenValue]);

  /* ── The engine ──────────────────────────────────────────────────────── */

  const latest = useRef<{
    onPointer: (point: ChartPoint | null, source: Event | undefined) => void;
    onPress: (point: ChartPoint | null, source: Event | undefined) => void;
    onZoom: (zoom: ChartZoom, source: Event | undefined) => void;
    onRender: () => void;
  }>({ onPointer: () => {}, onPress: () => {}, onZoom: () => {}, onRender: () => {} });

  useEffect(() => {
    const node = canvas.current;
    if (!node) return undefined;
    const handle = mountChartEngine(node, {
      onPointer: (point, source) => latest.current.onPointer(point, source),
      onPress: (point, source) => latest.current.onPress(point, source),
      onZoom: (next, source) => latest.current.onZoom(next, source),
      onRender: () => latest.current.onRender(),
      onError: (failure) => setEngineFailure(failure),
    });
    engine.current = handle;
    return () => {
      handle.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (!engine.current || !theme || !model || !drawable) return;
    void engine.current.update({
      model,
      theme,
      selection: selectionValue,
      zoom: zoomValue,
      zoomable: Boolean(zoomable),
      grid: resolved.grid,
      texture: Boolean(texture),
      renderer: resolved.renderer,
      sampling,
      trigger,
      animate: resolved.animate,
      extendOption,
    });
  }, [
    model,
    theme,
    drawable,
    selectionValue,
    zoomValue,
    zoomable,
    resolved.grid,
    texture,
    resolved.renderer,
    sampling,
    trigger,
    resolved.animate,
    extendOption,
  ]);

  /* ── The overlay: crosshair, markers, tooltip ────────────────────────── */

  const computeOverlay = () => {
    const handle = engine.current;
    const box = plot.current;
    if (!handle || !box || !model || !drawable || tableValue) {
      setOverlay(NO_OVERLAY);
      return;
    }
    const markers: Overlay['markers'][number][] = [];
    if (selectionValue && isDrawn(model, selectionValue) && model.shape === 'cartesian') {
      const owner = seriesOf(model, selectionValue.series);
      const at = handle.locate(selectionValue);
      if (owner && owner.kind !== 'bar' && at) {
        markers.push({
          key: `selected-${owner.id}`,
          color: owner.color,
          at,
          selected: true,
          current: false,
        });
      }
    }
    if (model.shape === 'pie') {
      handle.emphasize(activeValue && isDrawn(model, activeValue) ? activeValue.key : null);
    }
    const at = activeValue && isDrawn(model, activeValue) ? handle.locate(activeValue) : null;
    if (!activeValue || !at) {
      setOverlay({ crosshair: null, markers, tooltip: null, docked: false });
      return;
    }
    const hasBars = model.series.some((entry) => entry.visible && entry.kind === 'bar');
    const crosshair =
      model.shape === 'cartesian' && trigger === 'axis'
        ? { ...at, isBand: hasBars && model.xType === 'category' }
        : null;
    if (model.shape === 'cartesian') {
      const index = categoryIndex(model, activeValue.key);
      const targets =
        trigger === 'axis'
          ? model.series.filter(
              (entry) => entry.visible && entry.kind !== 'bar' && entry.values[index] !== null,
            )
          : [seriesOf(model, activeValue.series)].filter(
              (entry): entry is NonNullable<typeof entry> => Boolean(entry && entry.kind !== 'bar'),
            );
      for (const target of targets) {
        const spot = handle.locate({ series: target.id, key: activeValue.key });
        if (spot) {
          markers.push({
            key: target.id,
            color: target.color,
            at: spot,
            selected: false,
            current: target.id === activeValue.series,
          });
        }
      }
    }
    const tooltip =
      trigger === 'none'
        ? null
        : tooltipContext(model, activeValue, {
            trigger,
            sort: resolved.tooltip.sort,
            total: resolved.tooltip.total,
          });
    setOverlay({ crosshair, markers, tooltip, docked: box.clientWidth < TOOLTIP_DOCK_WIDTH });
  };

  useLayoutEffect(() => {
    computeOverlay();
    /* Recomputed when anything it reads moves; the engine calls it after
       every draw and resize through `onRender`. */
  }, [activeValue, selectionValue, model, drawable, tableValue, trigger]);

  /* Placed after the content is on the page, because its size decides where. */
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const node = tooltipNode.current;
    const box = plot.current;
    if (!node || !box) return;
    if (!overlay.tooltip || !activeValue) {
      wasOpen.current = false;
      return;
    }
    const at = engine.current?.locate(activeValue);
    if (!at) return;
    if (!wasOpen.current) node.style.transition = 'none';
    const placement = placeTooltip({
      anchor: { x: at.x, y: at.y },
      size: { width: node.offsetWidth, height: node.offsetHeight },
      bounds: { width: box.clientWidth, height: box.clientHeight },
      dir: figure.current && getComputedStyle(figure.current).direction === 'rtl' ? 'rtl' : 'ltr',
    });
    node.style.setProperty('--slotted-chart-x', `${placement.x}px`);
    node.style.setProperty('--slotted-chart-y', `${placement.y}px`);
    if (!wasOpen.current) requestAnimationFrame(() => (node.style.transition = ''));
    wasOpen.current = true;
  }, [overlay, activeValue]);

  latest.current = {
    onPointer: (point, source) => {
      if (point) requestActive(point, 'pointer', source);
      else if (document.activeElement !== plot.current) requestActive(null, 'pointer', source);
    },
    onPress: (point, source) => {
      if (!selectable || !point) return;
      requestSelection(samePoint(selectionValue, point) ? null : point, 'pointer', source);
    },
    onZoom: (next, source) => requestZoom(next, 'pointer', source),
    onRender: () => computeOverlay(),
  };

  /* ── Keyboard and focus on the plot ──────────────────────────────────── */

  const onPlotKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!model || !drawable || tableValue) return;
    const actionsFor = chartKeyAction(
      model,
      {
        active: activeValue,
        selection: selectionValue,
        zoom: zoomValue,
        zoomable: Boolean(zoomable),
        selectable: Boolean(selectable),
      },
      event.key,
    );
    if (actionsFor === null) return;
    event.preventDefault();
    for (const action of actionsFor) {
      if (action.type === 'active') {
        requestActive(action.point, action.reason, event.nativeEvent);
        if (action.point) pointAnnouncer.say(describePoint(model, action.point, selectionValue, t));
        else pointAnnouncer.cancel();
      } else if (action.type === 'select') {
        requestSelection(action.point, 'keyboard', event.nativeEvent);
        if (action.point) pointAnnouncer.say(describePoint(model, action.point, action.point, t));
      } else {
        requestZoom(action.zoom, action.reason, event.nativeEvent);
        announce(describeZoom(model, action.zoom, t));
      }
    }
  };

  /** A click on a cell focuses the region; its ring is for the keyboard (`createFocusOrigin`). */
  const attachTableRegion = useCallback(
    (node: HTMLDivElement | null) => (node === null ? undefined : createFocusOrigin(node).destroy),
    [],
  );

  const onPlotFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!model || !drawable || tableValue || activeValue) return;
    if (!focusVisible(event.currentTarget)) return;
    const point = firstPoint(model);
    if (!point) return;
    requestActive(point, 'keyboard', event.nativeEvent);
    pointAnnouncer.say(describePoint(model, point, selectionValue, t));
  };

  /* ── Full screen ─────────────────────────────────────────────────────── */

  /**
   * The Fullscreen API when the page may use it and the reader asked; a layer
   * fixed over the page otherwise. A browser refuses the API outside the
   * press that asked for it, so the request is made in the handler, and a
   * chart that starts in full screen starts as the layer.
   */
  const toggleFullscreen = (reason: ChangeReason, source?: unknown) => {
    const next = !fullscreenValue;
    requestFullscreen(next, reason, source);
    const node = figure.current;
    if (!node) return;
    if (
      next &&
      fullscreen === undefined &&
      document.fullscreenEnabled &&
      reason !== 'programmatic'
    ) {
      node.requestFullscreen?.().catch(() => {});
    }
    if (!next && document.fullscreenElement === node) document.exitFullscreen().catch(() => {});
  };

  useEffect(() => {
    const node = figure.current;
    if (!node) return undefined;
    let native = false;
    const onChange = () => {
      if (document.fullscreenElement === node) native = true;
      else if (native) {
        native = false;
        requestFullscreenRef.current(false, 'escape');
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const requestFullscreenRef = useRef(requestFullscreen);
  requestFullscreenRef.current = requestFullscreen;

  /* Leaving the full screen of a controlled chart the owner closed. */
  useEffect(() => {
    const node = figure.current;
    if (!fullscreenValue && node && document.fullscreenElement === node) {
      document.exitFullscreen().catch(() => {});
    }
  }, [fullscreenValue]);

  const onRootKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    nativeProps.onKeyDown?.(event as never);
    if (event.defaultPrevented || event.key !== 'Escape' || !fullscreenValue) return;
    event.preventDefault();
    toggleFullscreen('escape', event.nativeEvent);
  };

  /* ── Legend ──────────────────────────────────────────────────────────── */

  const [collapsed, setCollapsed] = useState<readonly number[]>([]);
  const widths = useRef(new Map<string, number>());
  const [legendFocus, setLegendFocus] = useState<string | null>(null);
  const interactive = legendInteractive ?? true;
  const legendEntries = model?.legend ?? [];

  const fitLegend = () => {
    const node = legendNode.current;
    if (!node || !model) return;
    if (resolved.legendOverflow === 'wrap') {
      setCollapsed((previous) => (previous.length ? [] : previous));
      return;
    }
    const items = [...node.querySelectorAll<HTMLElement>(':scope > [data-part="legend-item"]')];
    for (const item of items) {
      if (!item.hidden)
        widths.current.set(item.dataset['key'] ?? '', item.getBoundingClientRect().width);
    }
    const gap = Number.parseFloat(getComputedStyle(node).columnGap) || 0;
    const more = node.querySelector<HTMLElement>(':scope > [data-part="legend-more"]');
    const triggerSize = more && !more.hidden ? more.getBoundingClientRect().width : 40;
    const result = collapseState({
      units: legendEntries.map((entry) => ({
        size: widths.current.get(entry.key) ?? 0,
        collapsible: true,
      })),
      available: node.clientWidth,
      gap,
      triggerSize,
    });
    setCollapsed((previous) =>
      previous.length === result.collapsed.length &&
      previous.every((value, index) => value === result.collapsed[index])
        ? previous
        : result.collapsed,
    );
  };

  useLayoutEffect(() => {
    fitLegend();
  }, [legendEntries, resolved.legendOverflow, legendValues, activeValue]);

  useEffect(() => {
    const node = legendNode.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => fitLegendRef.current());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const fitLegendRef = useRef(fitLegend);
  fitLegendRef.current = fitLegend;

  const toggleEntry = (
    entry: ChartLegendEntry,
    mode: 'toggle' | 'isolate',
    reason: ChangeReason,
    source: unknown,
  ) => {
    const keys = legendEntries.map((item) => item.key);
    const next = toggleHidden(keys, hiddenValue, entry.key, mode);
    setLegendFocus(entry.key);
    requestHidden(next, reason, source);
    announce(
      t(next.includes(entry.key) ? 'hidden' : 'shown', {
        series: entry.label,
      }),
    );
  };

  const activeKey = activeValue && model && isDrawn(model, activeValue) ? activeValue.key : null;

  const legendValue = (entry: ChartLegendEntry) => {
    if (!model) return '';
    const owner = model.shape === 'pie' ? model.series[0] : seriesOf(model, entry.key);
    if (!owner) return '';
    const index =
      model.shape === 'pie'
        ? categoryIndex(model, entry.key)
        : activeKey
          ? categoryIndex(model, activeKey)
          : lastDrawn(owner.values);
    const raw = index >= 0 ? owner.values[index] : null;
    return raw === null || raw === undefined ? '' : owner.format(raw);
  };

  const moreLayer = useLayer('start');
  const rowKeys = legendEntries
    .filter((_, index) => !collapsed.includes(index))
    .map((entry) => entry.key);
  const rovingKey =
    legendFocus && rowKeys.includes(legendFocus) ? legendFocus : (rowKeys[0] ?? null);

  const legendItem = (entry: ChartLegendEntry, index: number, inLayer: boolean) => {
    const owner =
      model?.shape === 'pie' ? model.series[0] : model ? seriesOf(model, entry.key) : undefined;
    const current =
      model?.shape === 'pie'
        ? entry.key === activeKey
        : activeValue?.series === entry.key && activeKey !== null;
    const inRow = !inLayer;
    const rowHidden = inRow && collapsed.includes(index);
    const children: ReactNode = (
      <>
        <span
          data-kind={
            entry.kind === 'area' || entry.kind === 'bar' || entry.kind === 'pie'
              ? 'bar'
              : entry.kind
          }
          data-part="legend-marker"
          data-part-legend-marker=""
          {...(owner && owner.stroke !== 'solid' ? { 'data-stroke': owner.stroke } : {})}
        />
        <span data-part="legend-label" data-part-legend-label="" title={entry.label}>
          {entry.label}
        </span>
        {legendValues ? (
          <span data-part="legend-value" data-part-legend-value="">
            {legendValue(entry)}
          </span>
        ) : null}
      </>
    );
    const common: ChartLegendItemProps = {
      'data-part': 'legend-item',
      ...selectorKeyProps('part', 'legend-item'),
      'data-key': entry.key,
      ...colorAttributes(entry.color),
      ...(current ? { 'data-current': '' } : {}),
      hidden: rowHidden,
      onPointerEnter: () => entry.visible && engine.current?.emphasize(entry.key),
      onPointerLeave: () => engine.current?.emphasize(null),
    } as ChartLegendItemProps;
    const fallback = interactive ? (
      <LegendButton
        {...common}
        entry={entry}
        focused={inLayer || rovingKey === entry.key}
        key={`${inLayer ? 'layer' : 'row'}-${entry.key}`}
        onActivate={(mode, reason, source) => toggleEntry(entry, mode, reason, source)}
        onFocusEntry={() => {
          if (!inLayer) setLegendFocus(entry.key);
          if (entry.visible) engine.current?.emphasize(entry.key);
        }}
        onBlurEntry={() => engine.current?.emphasize(null)}
      >
        {children}
      </LegendButton>
    ) : (
      <span {...common} key={`${inLayer ? 'layer' : 'row'}-${entry.key}`} role="listitem">
        {children}
      </span>
    );
    return renderLegendItem ? (
      <Fragment key={`${inLayer ? 'layer' : 'row'}-${entry.key}`}>
        {renderLegendItem(entry, common, fallback)}
      </Fragment>
    ) : (
      fallback
    );
  };

  /* One tab stop for the row; the arrows move inside it (APG Toolbar). */
  const onLegendKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-part="menu"]')) return;
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(':scope > button:not([hidden])'),
    ];
    const index = items.indexOf(target);
    if (index === -1) return;
    const rtl = figure.current ? getComputedStyle(figure.current).direction === 'rtl' : false;
    const step =
      event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    let next: HTMLElement | undefined;
    if (step) next = items[(index + step + items.length) % items.length];
    if (event.key === 'Home') next = items[0];
    if (event.key === 'End') next = items[items.length - 1];
    if (!next) return;
    event.preventDefault();
    setLegendFocus(next.dataset['key'] ?? '__more');
    next.focus();
  };

  /* ── Toolbar ─────────────────────────────────────────────────────────── */

  const menu = useLayer('end');
  const helpLayer = useLayer('start', false);

  const download = (filename: string, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  };
  const fileName = typeof title === 'string' ? title : 'chart';

  /* ── Handle ──────────────────────────────────────────────────────────── */

  useImperativeHandle(
    handleRef,
    () => ({
      focus: () => plot.current?.focus(),
      resetZoom: () => requestZoom(FULL_ZOOM, 'programmatic'),
      toDataURL: () => engine.current?.toDataURL() ?? null,
      toCsv: () => (model ? chartToCsv(model, t) : ''),
    }),
    [model, t, requestZoom],
  );

  /* ── What the plot says ──────────────────────────────────────────────── */

  const summary = waiting
    ? t('loading')
    : failed
      ? t('error')
      : model
        ? describeChart(model, t)
        : '';
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const summaryId = `${id}-summary`;
  const skeletonKind = spec.series.some((entry) => entry.kind === 'pie')
    ? 'pie'
    : spec.series.every((entry) => entry.kind === 'line' || entry.kind === 'area')
      ? 'line'
      : 'bar';
  const table = tableValue && usable && model ? chartTable(model, t) : null;

  const retry = () => {
    setEngineFailure(null);
    onRetry?.();
  };

  const header =
    title !== undefined ||
    description !== undefined ||
    actions !== undefined ||
    resolved.toolbar !== 'none' ? (
      <figcaption data-part="header" data-part-header="">
        <div>
          <div>
            {title !== undefined ? (
              <span data-part="title" data-part-title="" id={titleId}>
                {title}
              </span>
            ) : null}
            {help !== undefined ? (
              <>
                <button
                  {...withSelectorKey(helpLayer.controlProps, 'part', 'help')}
                  aria-controls={`${id}-help`}
                  aria-label={t('help')}

                  type="button"
                >
                  <Icon>
                    <Glyph name="circle-info" />
                  </Icon>
                </button>
                <div
                  {...withSelectorKey(helpLayer.layerProps, 'part', 'help-content')}

                  id={`${id}-help`}
                  role="note"
                >
                  {help}
                </div>
              </>
            ) : null}
          </div>
          {description !== undefined ? (
            <span data-part="description" data-part-description="" id={descriptionId}>
              {description}
            </span>
          ) : null}
        </div>
        {actions !== undefined ? (
          <div data-part="actions" data-part-actions="">
            {actions}
          </div>
        ) : null}
        {/* The box stands in every state, so the header's words wrap at one width; it
            holds nothing a reader can reach until the plot has something to act on. */}
        {resolved.toolbar !== 'none' ? (
          <div
            aria-hidden={usable ? undefined : true}
            aria-label={usable ? t('toolbar') : undefined}
            data-part="toolbar"
            data-part-toolbar=""
            data-waiting={usable ? undefined : ''}
            inert={!usable}
            role={usable ? 'toolbar' : undefined}
          >
            {model && zoomable && !isFullZoom(zoomValue) && model.shape === 'cartesian' ? (
              <ToolbarButton
                label={t('resetZoom')}
                onPress={(_, source) => {
                  requestZoom(FULL_ZOOM, 'clear', source);
                  announce(describeZoom(model, FULL_ZOOM, t));
                  plot.current?.focus();
                }}
                glyph="rotate-ccw"
                part="zoom-reset"
              />
            ) : null}
            <ToolbarButton
              label={t('tableView')}
              onPress={(reason, source) => requestTable(!tableValue, reason, source)}
              glyph="file-spreadsheet"
              part="view-toggle"
              pressed={tableValue}
            />
            <ToolbarButton
              label={fullscreenValue ? t('exitFullscreen') : t('fullscreen')}
              glyph={fullscreenValue ? 'minimize' : 'maximize'}
              onPress={(reason, source) => toggleFullscreen(reason, source)}
              part="fullscreen-toggle"
            />
            <button
              {...withSelectorKey(menu.controlProps, 'part', 'menu-trigger')}
              aria-haspopup="menu"
              aria-label={t('more')}

              title={t('more')}
              type="button"
            >
              <Icon>
                <Glyph name="ellipsis" />
              </Icon>
            </button>
            <div
              {...withSelectorKey(menu.layerProps, 'part', 'menu')}
              aria-label={t('more')}
              role="menu"
            >
              <MenuItem
                action="view"
                label={t('tableView')}
                onPress={(reason, source) => {
                  menu.close();
                  requestTable(!tableValue, reason, source);
                }}
              />
              <MenuItem
                action="fullscreen"
                label={fullscreenValue ? t('exitFullscreen') : t('fullscreen')}
                onPress={(reason, source) => {
                  menu.close();
                  toggleFullscreen(reason, source);
                }}
              />
              <MenuItem
                action="csv"
                label={t('downloadCsv')}
                onPress={() => {
                  menu.close();
                  if (!model) return;
                  download(
                    `${fileName}.csv`,
                    `data:text/csv;charset=utf-8,${encodeURIComponent(chartToCsv(model, t))}`,
                  );
                }}
              />
              <MenuItem
                action="image"
                label={t('downloadImage')}
                onPress={() => {
                  menu.close();
                  const url = engine.current?.toDataURL();
                  if (url)
                    download(
                      `${fileName}.${url.startsWith('data:image/svg') ? 'svg' : 'png'}`,
                      url,
                    );
                }}
              />
            </div>
          </div>
        ) : null}
      </figcaption>
    ) : null;

  const legendRow =
    showLegend === false ? null : (
      <div
        aria-label={waiting && (!model || model.shape === 'pie') ? undefined : t('legend')}
        data-part="legend"
        data-part-legend=""
        onKeyDown={onLegendKeyDown}
        ref={legendNode}
        role={
          waiting && (!model || model.shape === 'pie')
            ? undefined
            : interactive
              ? 'toolbar'
              : 'list'
        }
      >
        {waiting && (!model || model.shape === 'pie') ? (
          <>
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </>
        ) : (
          <>
            {legendEntries.map((entry, index) => legendItem(entry, index, false))}
            <button
              {...withSelectorKey(moreLayer.controlProps, 'part', 'legend-more')}
              aria-haspopup="true"
              aria-label={t('legendMore', {
                series: new Intl.ListFormat(locale ?? appLocale, { type: 'unit' }).format(
                  collapsed.map((index) => legendEntries[index]?.label ?? ''),
                ),
              })}

              hidden={collapsed.length === 0}
              tabIndex={rovingKey === null ? 0 : -1}
              type="button"
            >
              {t('moreSeries', { count: collapsed.length })}
            </button>
            <div
              {...withSelectorKey(moreLayer.layerProps, 'part', 'menu')}
              aria-label={t('legend')}
              role="group"
            >
              {collapsed.map((index) => {
                const entry = legendEntries[index];
                return entry ? legendItem(entry, index, true) : null;
              })}
            </div>
          </>
        )}
      </div>
    );

  const rootProps: ChartRootProps = keyedProps({
    ...nativeProps,
    'data-ui': 'chart',
    'data-part': 'root',
    'data-size': resolved.size,
    'data-variant': resolved.variant,
    'data-palette': resolved.palette,
    'data-toolbar': resolved.toolbar,
    'data-legend-overflow': resolved.legendOverflow,
    ...(waiting ? { 'data-loading': '' } : {}),
    ...(fullscreenValue ? { 'data-fullscreen': '' } : {}),
    onKeyDown: onRootKeyDown,
    ref: (node: HTMLElement | null) => {
      figure.current = node;
      assignRef(ref, node);
    },
    children: (
      <>
        {header}
        {legendRow}
        <div
          aria-busy={waiting || undefined}
          aria-describedby={description !== undefined ? `${descriptionId} ${summaryId}` : summaryId}
          aria-label={
            title === undefined ? (nativeProps['aria-label'] ?? t('roledescription')) : undefined
          }
          aria-labelledby={title !== undefined ? titleId : undefined}
          aria-roledescription={t('roledescription')}
          data-part="plot"
          data-part-plot=""
          onBlur={(event) => requestActive(null, 'blur', event.nativeEvent)}
          onFocus={onPlotFocus}
          onKeyDown={onPlotKeyDown}
          ref={plot}
          role="group"
          tabIndex={0}
        >
          <div
            data-part="crosshair"
            data-part-crosshair=""
            hidden={!overlay.crosshair}
            {...(overlay.crosshair?.isBand ? { 'data-band': '' } : {})}
            data-orientation={model?.orientation ?? 'vertical'}
            style={
              overlay.crosshair
                ? pixels({
                    '--slotted-chart-x': overlay.crosshair.x,
                    '--slotted-chart-y': overlay.crosshair.y,
                    '--slotted-chart-band-start': overlay.crosshair.band.start,
                    '--slotted-chart-band-size': overlay.crosshair.band.size,
                    '--slotted-chart-frame-start': overlay.crosshair.frame.start,
                    '--slotted-chart-frame-size': overlay.crosshair.frame.size,
                  })
                : undefined
            }
          />
          <div
            aria-hidden="true"
            data-part="canvas"
            data-part-canvas=""
            hidden={!drawable}
            ref={canvas}
          />
          {overlay.markers.map((marker) => (
            <div
              aria-hidden="true"
              data-part="marker"
              data-part-marker=""
              key={marker.key}
              {...colorAttributes(marker.color)}
              {...(marker.selected ? { 'data-selected': '' } : {})}
              {...(marker.current ? { 'data-current': '' } : {})}
              style={pixels({ '--slotted-chart-x': marker.at.x, '--slotted-chart-y': marker.at.y })}
            />
          ))}
          <div
            aria-hidden="true"
            data-part="tooltip"
            data-part-tooltip=""
            ref={tooltipNode}
            {...(overlay.tooltip ? { 'data-open': '' } : {})}
            {...(overlay.docked ? { 'data-docked': '' } : {})}
          >
            {overlay.tooltip && model
              ? (renderTooltip?.(overlay.tooltip, model) ?? (
                  <ChartTooltipContent
                    context={overlay.tooltip}
                    indicator={resolved.tooltip.indicator}
                    model={model}
                    totalLabel={t('total')}
                  />
                ))
              : null}
          </div>
          {drawable && model?.shape === 'pie' && (model.series[0]?.innerRadius ?? 0) > 0 ? (
            <div aria-hidden="true" data-part="center" data-part-center="">
              {renderCenter?.(model) ?? (
                <>
                  <span data-part="center-value" data-part-center-value="">
                    {model.series[0]!.format(model.total)}
                  </span>
                  <span data-part="center-label" data-part-center-label="">
                    {t('total')}
                  </span>
                </>
              )}
            </div>
          ) : null}
          {table ? (
            <div
              aria-labelledby={title !== undefined ? titleId : undefined}
              data-part="table-region"
              data-part-table-region=""
              ref={attachTableRegion}
              role="region"
              tabIndex={0}
            >
              <table data-part="table" data-part-table="">
                <caption>
                  {table.omitted
                    ? typeof title === 'string'
                      ? t('truncatedCaption', {
                          title,
                          shown: table.rows.length,
                          count: table.rows.length + table.omitted,
                        })
                      : t('truncated', {
                          shown: table.rows.length,
                          count: table.rows.length + table.omitted,
                        })
                    : typeof title === 'string'
                      ? title
                      : null}
                </caption>
                <thead>
                  <tr>
                    {table.columns.map((column, index) => (
                      <th
                        {...(index > 0 ? { 'data-numeric': '' } : {})}
                        key={column.key}
                        scope="col"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr {...(row.key === activeKey ? { 'data-current': '' } : {})} key={row.key}>
                      {row.cells.map((cell, index) =>
                        index === 0 ? (
                          <th key="category" scope="row">
                            {cell.text}
                          </th>
                        ) : (
                          <td data-numeric="" key={index}>
                            {cell.text}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {waiting ? <Skeleton kind={skeletonKind} /> : null}
          {!waiting && failed ? (
            <div data-part="error" data-part-error="">
              {renderError?.() ?? (
                <ResultState
                  action={onRetry || engineFailure ? t('retry') : undefined}
                  onAction={retry}
                  status="error"
                  text={t('error')}
                />
              )}
            </div>
          ) : null}
          {!waiting && !failed && model?.empty ? (
            <div data-part="empty" data-part-empty="">
              {renderEmpty?.(model.empty) ?? (
                <ResultState
                  action={model.empty === 'all-hidden' ? t('showAll') : undefined}
                  onAction={(source) => requestHidden(NO_KEYS, 'pointer', source)}
                  status={model.empty === 'all-hidden' ? 'no-results' : 'empty'}
                  text={model.empty === 'all-hidden' ? t('allHidden') : t('noData')}
                />
              )}
            </div>
          ) : null}
          <p data-part="summary" data-part-summary="" id={summaryId}>
            {summary}
          </p>
        </div>
      </>
    ),
  });

  return render ? render(rootProps) : <figure {...rootProps} />;
}

/* ── Small parts ────────────────────────────────────────────────────────── */

function LegendButton({
  children,
  entry,
  focused,
  onActivate,
  onFocusEntry,
  onBlurEntry,
  ...props
}: ChartLegendItemProps & {
  children: ReactNode;
  entry: ChartLegendEntry;
  focused: boolean;
  onActivate: (mode: 'toggle' | 'isolate', reason: ChangeReason, source: unknown) => void;
  onFocusEntry: () => void;
  onBlurEntry: () => void;
}) {
  const [element, reasonOf] = useModality();
  return (
    <button
      {...props}
      aria-pressed={entry.visible}
      {...(entry.visible ? { 'data-pressed': '' } : {})}
      onBlur={onBlurEntry}
      onClick={(event) =>
        onActivate(event.shiftKey ? 'isolate' : 'toggle', reasonOf(), event.nativeEvent)
      }
      onFocus={onFocusEntry}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault();
          onActivate('isolate', 'keyboard', event.nativeEvent);
        }
      }}
      ref={element}
      tabIndex={focused ? 0 : -1}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarButton({
  glyph,
  label,
  onPress,
  part,
  pressed,
}: {
  glyph: GlyphName;
  label: string;
  onPress: (reason: ChangeReason, source: unknown) => void;
  part: 'zoom-reset' | 'view-toggle' | 'fullscreen-toggle';
  pressed?: boolean;
}) {
  const [element, reasonOf] = useModality();
  return (
    <button
      aria-label={label}
      {...(pressed === undefined
        ? {}
        : { 'aria-pressed': pressed, ...(pressed ? { 'data-pressed': '' } : {}) })}
      data-part={part}
      {...selectorKeyProps('part', part)}
      onClick={(event) => onPress(reasonOf(), event.nativeEvent)}
      ref={element}
      title={label}
      type="button"
    >
      <Icon>
        <Glyph name={glyph} />
      </Icon>
    </button>
  );
}

function MenuItem({
  action,
  label,
  onPress,
}: {
  action: string;
  label: string;
  onPress: (reason: ChangeReason, source: unknown) => void;
}) {
  const [element, reasonOf] = useModality();
  return (
    <button
      data-action={action}
      data-part="menu-item"
      data-part-menu-item=""
      onClick={(event) => onPress(reasonOf(), event.nativeEvent)}
      ref={element}
      role="menuitem"
      type="button"
    >
      {label}
    </button>
  );
}

function SkeletonBlock({ shape = 'block' }: { shape?: 'block' | 'circle' }) {
  return (
    <span
      aria-hidden="true"
      data-animation="shimmer"
      data-loading=""
      data-part="root"
      data-part-root=""
      data-shape={shape}
      data-size="md"
      data-ui="skeleton"
      data-ui-skeleton=""
    />
  );
}

function SkeletonLine() {
  return <SkeletonBlock />;
}

/**
 * The chart it stands in for, in the plot's box: the axes' labels, the grid
 * and the marks of its kind, under one shimmer (the `loading-states` skill).
 */
function Skeleton({ kind }: { kind: 'bar' | 'line' | 'pie' }) {
  const repeat = (count: number) =>
    Array.from({ length: count }, (_, index) => <SkeletonBlock key={index} />);
  return (
    <div aria-hidden="true" data-kind={kind} data-part="skeleton" data-part-skeleton="">
      <div
        data-animation="shimmer"
        data-loading=""
        data-part="region"
        data-part-region=""
        data-ui="skeleton"
        data-ui-skeleton=""
      >
        {kind === 'pie' ? (
          <SkeletonBlock shape="circle" />
        ) : (
          <>
            <div data-skeleton="y">{repeat(5)}</div>
            <div data-skeleton="marks">{repeat(kind === 'bar' ? 7 : 2)}</div>
            <div data-skeleton="x">{repeat(6)}</div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultState({
  action,
  onAction,
  status,
  text,
}: {
  action: string | undefined;
  onAction: (source: unknown) => void;
  status: 'empty' | 'no-results' | 'error';
  text: string;
}) {
  return (
    <section
      data-align="center"
      data-live="polite"
      data-part="root"
      data-part-root=""
      data-reach="section"
      data-status={status}
      data-ui="result-state"
      data-ui-result-state=""
    >
      <div aria-hidden="true" data-part="media" data-part-media="" />
      <div data-part="content" data-part-content="" role="status">
        <div data-part="title" data-part-title="">
          {text}
        </div>
      </div>
      {action ? (
        <div data-part="actions" data-part-actions="">
          <button
            data-part="root"
            data-part-root=""
            data-size="sm"
            data-tone="secondary"
            data-ui="button"
            data-ui-button=""
            data-variant="outline"
            onClick={(event) => onAction(event.nativeEvent)}
            type="button"
          >
            <span data-part="label" data-part-label="">
              {action}
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
