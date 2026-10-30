import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injectable,
  InjectionToken,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
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
import { createFocusOrigin } from '@slotted/core/focus';
import { chartMessages, type ChartMessages, type PartialMessages } from '@slotted/core/i18n';
import type {
  ChartAnnotation,
  ChartColor,
  ChartField,
  ChartGrid,
  ChartLegendEntry,
  ChartModel,
  ChartOrientation,
  ChartPoint,
  ChartRecord,
  ChartSeries,
  ChartSpec,
  ChartStackMode,
  ChartTheme,
  ChartTooltipContext,
  ChartTrigger,
  ChartXAxis,
  ChartYAxis,
  ChartZoom,
} from '@slotted/core/chart';
import { mountChartEngine } from '@slotted/core/chart-echarts';
import type { ChartEngine, ChartPointLocation } from '@slotted/core/chart-echarts';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { collapseState } from '@slotted/core/overflow';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import {
  injectChartDefaults,
  type ChartLegendOverflow,
  type ChartPalette,
  type ChartRenderer,
  type ChartSize,
  type ChartToolbar,
  type ChartTooltipSettings,
  type ChartVariant,
} from './chart-defaults';
import {
  SlChartCenter,
  SlChartEmpty,
  SlChartError,
  SlChartLegendItem,
  SlChartTooltip,
} from './chart-templates';

/**
 * The engine a chart mounts. `@slotted/core/chart-echarts` by default; a test
 * provides a recording one, and an application could provide another that
 * answers the same three calls.
 */
export const CHART_ENGINE = new InjectionToken<typeof mountChartEngine>('slotted chart engine', {
  providedIn: 'root',
  factory: () => mountChartEngine,
});

/** Unique ids for the chart's parts, stable across a server render. */
@Injectable({ providedIn: 'root' })
export class SlChartIdFactory {
  private count = 0;
  next() {
    this.count += 1;
    return `sl-chart-${this.count}`;
  }
}

/** The imperative actions a template cannot express. */
export interface ChartHandle {
  focus(): void;
  resetZoom(): void;
  toDataURL(): string | null;
  toCsv(): string;
}

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
const samePoint = (a: ChartPoint | null, b: ChartPoint | null) =>
  a === b || (a !== null && b !== null && a.series === b.series && a.key === b.key);
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
const sameZoom = (a: ChartZoom, b: ChartZoom) => a.start === b.start && a.end === b.end;

function lastDrawn(values: readonly (number | null)[]) {
  for (let index = values.length - 1; index >= 0; index -= 1)
    if (values[index] !== null) return index;
  return -1;
}

function focusVisible(element: Element) {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
}

/**
 * A figure: a caption that names it, a toolbar of its own controls, a legend
 * of toggles, and a plot the engine draws marks into and the family draws
 * every interaction over. The engine is ECharts, loaded on demand by
 * `@slotted/core/chart-echarts`, one chunk per kind; everything a reader
 * operates is this component's template.
 *
 * Each mutable value is a `model()` — two-way, so a template binds it with
 * `[(hidden)]` — and each move is first asked through a `*ChangeRequest`
 * output carrying the reason and the event, which a handler may cancel. The
 * model, the keyboard, the text alternatives and the theme are
 * `@slotted/core/chart`'s, shared with the React binding.
 */
@Component({
  selector: 'figure[slChart]',
  standalone: true,
  imports: [NgTemplateOutlet, SlGlyph, SlIcon],
  templateUrl: './chart.html',
  styleUrls: [
    '../../../styles/src/button/button.css',
    '../../../styles/src/result-state/result-state.css',
    '../../../styles/src/skeleton/skeleton.css',
    '../../../styles/src/chart/chart.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slChart',
  host: {
    'data-ui': 'chart',
    'data-ui-chart': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.title]': 'null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-palette]': 'resolvedPalette()',
    '[attr.data-toolbar]': 'resolvedToolbar()',
    '[attr.data-legend-overflow]': 'resolvedLegendOverflow()',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-fullscreen]': 'fullscreen() ? "" : null',
    '(keydown)': 'onRootKeyDown($event)',
  },
})
/**
 * `Row` is the type of one record, inferred from `data`. An interface without
 * an index signature is accepted, and every field a series or the x axis names
 * must be one of its keys.
 */
export class SlChart<Row extends object = ChartRecord> implements ChartHandle {
  /* ── What is drawn ─────────────────────────────────────────────────── */
  readonly data = input<readonly Row[]>([]);
  readonly series = input<readonly ChartSeries<ChartField<Row>>[]>([]);
  readonly x = input<ChartXAxis<ChartField<Row>> | undefined>(undefined);
  readonly y = input<ChartYAxis | readonly [ChartYAxis, ChartYAxis] | undefined>(undefined);
  readonly orientation = input<ChartOrientation | undefined>(undefined);
  readonly stackMode = input<ChartStackMode | undefined>(undefined);
  readonly annotations = input<readonly ChartAnnotation[] | undefined>(undefined);
  readonly recordKey = input<ChartField<Row> | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);

  /* ── The words around it ───────────────────────────────────────────── */
  /** The chart's name: the caption, and the plot's accessible name. The host's native tooltip is removed. */
  readonly title = input<string | undefined>(undefined);
  /** Names the plot when no title is given: a heading around the chart already names it. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly description = input<string | undefined>(undefined);
  /** A note behind an information control beside the title. */
  readonly help = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * toolbar, the legend, the states and the sentences a screen reader hears.
   */
  readonly messages = input<PartialMessages<ChartMessages> | undefined>(undefined);

  /* ── How it looks ──────────────────────────────────────────────────── */
  readonly size = input<ChartSize | undefined>(undefined);
  readonly variant = input<ChartVariant | undefined>(undefined);
  readonly palette = input<ChartPalette | undefined>(undefined);
  readonly toolbar = input<ChartToolbar | undefined>(undefined);
  readonly grid = input<ChartGrid | undefined>(undefined);
  readonly texture = input(false, { transform: booleanAttribute });
  readonly renderer = input<ChartRenderer | undefined>(undefined);
  readonly sampling = input<'auto' | 'none' | undefined>(undefined);
  readonly animate = input<boolean | undefined>(undefined);
  readonly legend = input(true, { transform: booleanAttribute });
  readonly legendInteractive = input(true, { transform: booleanAttribute });
  readonly legendValues = input(false, { transform: booleanAttribute });
  readonly legendOverflow = input<ChartLegendOverflow | undefined>(undefined);
  readonly trigger = input<ChartTrigger | undefined>(undefined);
  readonly tooltip = input<ChartTooltipSettings | undefined>(undefined);
  readonly zoomable = input(false, { transform: booleanAttribute });
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input(false, { transform: booleanAttribute });
  /** The engine's option, before it is drawn: the escape hatch for what the contract does not say yet. */
  readonly extendOption = input<
    ((option: Record<string, unknown>) => Record<string, unknown>) | undefined
  >(undefined);

  /* ── State: two-way, each move asked first ─────────────────────────── */
  readonly hidden = model<readonly string[]>([]);
  readonly activePoint = model<ChartPoint | null>(null);
  readonly selection = model<ChartPoint | null>(null);
  readonly zoom = model<ChartZoom>(FULL_ZOOM);
  readonly tableOpen = model<boolean>(false);
  readonly fullscreen = model<boolean>(false);

  readonly hiddenChangeRequest = output<ChangeRequest<readonly string[]>>();
  readonly activePointChangeRequest = output<ChangeRequest<ChartPoint | null>>();
  readonly selectionChangeRequest = output<ChangeRequest<ChartPoint | null>>();
  readonly zoomChangeRequest = output<ChangeRequest<ChartZoom>>();
  readonly tableOpenChangeRequest = output<ChangeRequest<boolean>>();
  readonly fullscreenChangeRequest = output<ChangeRequest<boolean>>();
  /** The reader pressed the retry of the failed plot. */
  readonly retry = output<void>();

  /* ── Composition ───────────────────────────────────────────────────── */
  protected readonly tooltipTemplate = contentChild(SlChartTooltip);
  protected readonly legendItemTemplate = contentChild(SlChartLegendItem);
  protected readonly centerTemplate = contentChild(SlChartCenter);
  protected readonly emptyTemplate = contentChild(SlChartEmpty);
  protected readonly errorTemplate = contentChild(SlChartError);

  private readonly defaults = injectChartDefaults();
  private readonly mountEngine = inject(CHART_ENGINE);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly id = inject(SlChartIdFactory).next();

  protected readonly plotRef = viewChild<ElementRef<HTMLDivElement>>('plot');
  protected readonly canvasRef = viewChild<ElementRef<HTMLDivElement>>('canvas');
  protected readonly tableRegionRef = viewChild<ElementRef<HTMLDivElement>>('tableRegion');
  protected readonly tooltipRef = viewChild<ElementRef<HTMLDivElement>>('tooltipBox');
  protected readonly legendRef = viewChild<ElementRef<HTMLDivElement>>('legendRow');
  protected readonly menuRef = viewChild<ElementRef<HTMLDivElement>>('menu');
  protected readonly moreRef = viewChild<ElementRef<HTMLDivElement>>('moreLayer');
  protected readonly helpRef = viewChild<ElementRef<HTMLDivElement>>('helpLayer');

  private engine: ChartEngine | null = null;
  private readonly engineFailure = signal<unknown>(null);
  protected readonly theme = signal<ChartTheme | null>(null);
  protected readonly overlay = signal<Overlay>(NO_OVERLAY);
  protected readonly collapsed = signal<readonly number[]>([]);
  protected readonly legendFocus = signal<string | null>(null);
  protected readonly layerOpen = signal<Record<string, boolean>>({});
  private readonly widths = new Map<string, number>();
  private readonly modality = trackModality(this.host);
  private readonly pointAnnouncer = createLatestAnnouncer((message) =>
    getLiveAnnouncer().announce(message),
  );

  /* ── Derived ───────────────────────────────────────────────────────── */
  /** The family's words in the language in force, with this chart's `messages` laid over them. */
  protected readonly t = injectMessages(chartMessages, this.messages);
  private readonly appLocale = injectLocale();
  /** The name of the control holding the series the legend has no room for. */
  protected readonly legendMoreName = computed(() => {
    const legend = this.chartModel()?.legend ?? [];
    const names = this.collapsed().map((index) => legend[index]?.label ?? '');
    return this.t('legendMore', {
      series: new Intl.ListFormat(this.locale() ?? this.appLocale(), { type: 'unit' }).format(
        names,
      ),
    });
  });
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size ?? 'md');
  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.defaults.variant ?? 'plain',
  );
  protected readonly resolvedPalette = computed(
    () => this.palette() ?? this.defaults.palette ?? 'categorical',
  );
  protected readonly resolvedToolbar = computed(
    () => this.toolbar() ?? this.defaults.toolbar ?? 'visible',
  );
  protected readonly resolvedLegendOverflow = computed(
    () => this.legendOverflow() ?? this.defaults.legendOverflow ?? 'collapse',
  );
  protected readonly resolvedTooltip = computed<ChartTooltipSettings>(() => ({
    ...this.defaults.tooltip,
    ...this.tooltip(),
  }));

  private readonly spec = computed<ChartSpec>(() => ({
    // The model reads a record only by the fields the series name, which `Row` constrains.
    data: this.data() as readonly ChartRecord[],
    series: this.series(),
    x: this.x(),
    y: this.y(),
    orientation: this.orientation(),
    stackMode: this.stackMode(),
    annotations: this.annotations(),
    recordKey: this.recordKey(),
    locale: this.locale() ?? this.appLocale(),
  }));
  private readonly built = computed(() => {
    try {
      return {
        model: createChartModel(this.spec(), { hidden: this.hidden() }) as ChartModel | null,
        failure: null as unknown,
      };
    } catch (failure) {
      return { model: null, failure };
    }
  });
  protected readonly chartModel = computed(() => this.built().model);
  protected readonly failed = computed(
    () => this.error() || this.built().failure !== null || this.engineFailure() !== null,
  );
  protected readonly drawable = computed(() => {
    const current = this.chartModel();
    return Boolean(current && !this.loading() && !this.failed() && !current.empty);
  });
  protected readonly usable = computed(() => {
    const current = this.chartModel();
    return Boolean(current && !this.loading() && !this.failed() && current.empty !== 'no-data');
  });
  protected readonly resolvedTrigger = computed(() => {
    const current = this.chartModel();
    return current ? (this.trigger() ?? defaultTrigger(current)) : 'none';
  });
  protected readonly activeKey = computed(() => {
    const current = this.chartModel();
    const point = this.activePoint();
    return point && current && isDrawn(current, point) ? point.key : null;
  });
  protected readonly summary = computed(() => {
    if (this.loading()) return this.t('loading');
    if (this.failed()) return this.t('error');
    const current = this.chartModel();
    return current ? describeChart(current, this.t) : '';
  });
  protected readonly skeletonKind = computed(() => {
    const kinds = this.series().map((entry) => entry.kind);
    if (kinds.includes('pie')) return 'pie';
    return kinds.every((kind) => kind === 'line' || kind === 'area') ? 'line' : 'bar';
  });
  protected readonly legendWaiting = computed(() => {
    const current = this.chartModel();
    return this.loading() && (!current || current.shape === 'pie' || current.legend.length === 0);
  });
  protected readonly table = computed(() => {
    const current = this.chartModel();
    return this.tableOpen() && this.usable() && current ? chartTable(current, this.t) : null;
  });
  protected readonly rowKeys = computed(() => {
    const entries = this.chartModel()?.legend ?? [];
    const hiddenIndexes = this.collapsed();
    return entries.filter((_, index) => !hiddenIndexes.includes(index)).map((entry) => entry.key);
  });
  protected readonly rovingKey = computed(() => {
    const focus = this.legendFocus();
    const keys = this.rowKeys();
    return focus && keys.includes(focus) ? focus : (keys[0] ?? null);
  });
  protected readonly describedBy = computed(() =>
    this.description() !== undefined
      ? `${this.id}-description ${this.id}-summary`
      : `${this.id}-summary`,
  );
  protected readonly repeat = (count: number) => Array.from({ length: count }, (_, index) => index);

  /** The frame a theme read waits for; see `loadTheme`. */
  private themeFrame = 0;

  /**
   * The theme at the plot: the one another chart already read in the same
   * context, or a read on the next frame. A read computes styles, and right
   * after a render it forced a style recalculation of everything rendered.
   */
  private loadTheme(plot: HTMLElement) {
    const cached = cachedChartTheme(plot);
    if (cached) {
      if (this.themeFrame) cancelAnimationFrame(this.themeFrame);
      this.themeFrame = 0;
      this.applyTheme(cached);
      return;
    }
    if (this.themeFrame) return;
    this.themeFrame = requestAnimationFrame(() => {
      this.themeFrame = 0;
      this.applyTheme(readChartTheme(plot));
    });
  }

  private applyTheme(next: ChartTheme) {
    if (!sameTheme(untracked(this.theme), next)) this.theme.set(next);
  }

  constructor() {
    afterNextRender(() => {
      const plot = this.plotRef()?.nativeElement;
      const canvas = this.canvasRef()?.nativeElement;
      if (!plot || !canvas) return;
      const stop = observeChartTheme(plot, () => this.applyTheme(readChartTheme(plot)));
      this.engine = this.mountEngine(canvas, {
        onPointer: (point, source) => {
          if (point) this.requestActive(point, 'pointer', source);
          else if (document.activeElement !== plot) this.requestActive(null, 'pointer', source);
        },
        onPress: (point, source) => {
          if (!this.selectable() || !point) return;
          this.requestSelection(
            samePoint(this.selection(), point) ? null : point,
            'pointer',
            source,
          );
        },
        onZoom: (next, source) => this.requestZoom(next, 'pointer', source),
        onRender: () => this.computeOverlay(),
        onError: (failure) => this.engineFailure.set(failure),
      });
      this.bump.update((value) => value + 1);
      const observer =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.fitLegend());
      const legend = this.legendRef()?.nativeElement;
      if (legend && observer) observer.observe(legend);
      const onFullscreen = () => {
        if (document.fullscreenElement === this.host) this.native = true;
        else if (this.native) {
          this.native = false;
          if (this.fullscreen()) this.requestFullscreen(false, 'escape');
        }
      };
      document.addEventListener('fullscreenchange', onFullscreen);
      this.destroyRef.onDestroy(() => {
        stop();
        if (this.themeFrame) cancelAnimationFrame(this.themeFrame);
        observer?.disconnect();
        document.removeEventListener('fullscreenchange', onFullscreen);
        this.engine?.dispose();
        this.engine = null;
        this.modality.destroy();
      });
    });

    /* The theme at the plot, loaded again when a palette, a variant or the
       full screen repaint the root's tokens, which are the chart's own
       attributes and outside what the document observer watches. After the
       render, because the context a cached theme is found by includes them. */
    afterRenderEffect(() => {
      this.resolvedPalette();
      this.resolvedVariant();
      this.fullscreen();
      const plot = untracked(() => this.plotRef()?.nativeElement);
      if (plot) untracked(() => this.loadTheme(plot));
    });

    /** A click on a cell focuses the table region; its ring is for the keyboard (`createFocusOrigin`). */
    effect((onCleanup) => {
      const region = this.tableRegionRef()?.nativeElement;
      if (region === undefined) return;
      onCleanup(createFocusOrigin(region).destroy);
    });

    /* What the engine draws. */
    effect(() => {
      this.bump();
      const current = this.chartModel();
      const theme = this.theme();
      if (!this.engine || !theme || !current || !this.drawable()) return;
      void this.engine.update({
        model: current,
        theme,
        selection: this.selection(),
        zoom: this.zoom(),
        zoomable: this.zoomable(),
        grid: this.grid() ?? this.defaults.grid,
        texture: this.texture(),
        renderer: this.renderer() ?? this.defaults.renderer ?? 'auto',
        sampling: this.sampling(),
        trigger: this.resolvedTrigger(),
        animate: this.animate() ?? this.defaults.animate ?? true,
        extendOption: this.extendOption(),
      });
    });

    /* The overlay follows the point, the selection, the model and the view. */
    effect(() => {
      this.activePoint();
      this.selection();
      this.chartModel();
      this.drawable();
      this.tableOpen();
      untracked(() => this.computeOverlay());
    });

    /* Placed after the content is on the page, because its size decides where. */
    afterRenderEffect({
      write: () => {
        const overlay = this.overlay();
        const node = this.tooltipRef()?.nativeElement;
        const plot = this.plotRef()?.nativeElement;
        const point = this.activePoint();
        if (!node || !plot) return;
        if (!overlay.tooltip || !point) {
          this.tooltipWasOpen = false;
          return;
        }
        const at = this.engine?.locate(point);
        if (!at) return;
        if (!this.tooltipWasOpen) node.style.transition = 'none';
        const placement = placeTooltip({
          anchor: { x: at.x, y: at.y },
          size: { width: node.offsetWidth, height: node.offsetHeight },
          bounds: { width: plot.clientWidth, height: plot.clientHeight },
          dir: getComputedStyle(this.host).direction === 'rtl' ? 'rtl' : 'ltr',
        });
        node.style.setProperty('--slotted-chart-x', `${placement.x}px`);
        node.style.setProperty('--slotted-chart-y', `${placement.y}px`);
        if (!this.tooltipWasOpen) requestAnimationFrame(() => (node.style.transition = ''));
        this.tooltipWasOpen = true;
      },
    });

    /* One line of legend, measured after it is drawn. */
    afterRenderEffect({
      read: () => {
        this.chartModel();
        this.resolvedLegendOverflow();
        this.activeKey();
        this.fitLegend();
      },
    });
  }

  private readonly bump = signal(0);
  private native = false;
  private tooltipWasOpen = false;

  /* ── Requests ──────────────────────────────────────────────────────── */

  private ask<T>(
    value: { (): T; set(next: T): void },
    emit: (request: ChangeRequest<T>) => void,
    equals: (a: T, b: T) => boolean,
    next: T,
    reason: ChangeReason,
    source: unknown,
  ) {
    let cancelled = false;
    const state = createControllable<T>({
      initial: value(),
      equals,
      onRequest: (request) => {
        emit(request);
        cancelled = request.cancelled;
      },
    });
    if (state.request(next, reason, source) && !cancelled) value.set(next);
  }

  protected requestHidden(next: readonly string[], reason: ChangeReason, source?: unknown) {
    this.ask(
      this.hidden,
      (request) => this.hiddenChangeRequest.emit(request),
      sameList,
      next,
      reason,
      source,
    );
  }
  protected requestActive(next: ChartPoint | null, reason: ChangeReason, source?: unknown) {
    this.ask(
      this.activePoint,
      (request) => this.activePointChangeRequest.emit(request),
      samePoint,
      next,
      reason,
      source,
    );
  }
  protected requestSelection(next: ChartPoint | null, reason: ChangeReason, source?: unknown) {
    this.ask(
      this.selection,
      (request) => this.selectionChangeRequest.emit(request),
      samePoint,
      next,
      reason,
      source,
    );
  }
  protected requestZoom(next: ChartZoom, reason: ChangeReason, source?: unknown) {
    this.ask(
      this.zoom,
      (request) => this.zoomChangeRequest.emit(request),
      sameZoom,
      next,
      reason,
      source,
    );
  }
  protected requestTable(next: boolean, reason: ChangeReason, source?: unknown) {
    this.ask(
      this.tableOpen,
      (request) => this.tableOpenChangeRequest.emit(request),
      Object.is,
      next,
      reason,
      source,
    );
  }

  /**
   * The Fullscreen API when the page may use it and the reader asked; a layer
   * fixed over the page otherwise. A browser refuses the API outside the
   * press that asked for it, so it is asked here, inside the handler.
   */
  protected requestFullscreen(next: boolean, reason: ChangeReason, source?: unknown) {
    const before = this.fullscreen();
    this.ask(
      this.fullscreen,
      (request) => this.fullscreenChangeRequest.emit(request),
      Object.is,
      next,
      reason,
      source,
    );
    if (this.fullscreen() === before) return;
    if (next && document.fullscreenEnabled && reason !== 'programmatic' && reason !== 'escape') {
      this.host.requestFullscreen?.().catch(() => {});
    }
    if (!next && document.fullscreenElement === this.host) {
      this.native = false;
      document.exitFullscreen().catch(() => {});
    }
  }

  /** The reason the last activation came with: a pointer, a key, or the application. */
  protected pressReason(): ChangeReason {
    return this.modality.read();
  }

  /* ── Overlay ───────────────────────────────────────────────────────── */

  private computeOverlay() {
    const current = this.chartModel();
    const plot = this.plotRef()?.nativeElement;
    const engine = this.engine;
    if (!engine || !plot || !current || !this.drawable() || this.tableOpen()) {
      this.overlay.set(NO_OVERLAY);
      return;
    }
    const active = this.activePoint();
    const selected = this.selection();
    const trigger = this.resolvedTrigger();
    const markers: Overlay['markers'][number][] = [];
    if (selected && isDrawn(current, selected) && current.shape === 'cartesian') {
      const owner = seriesOf(current, selected.series);
      const at = engine.locate(selected);
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
    if (current.shape === 'pie')
      engine.emphasize(active && isDrawn(current, active) ? active.key : null);
    const at = active && isDrawn(current, active) ? engine.locate(active) : null;
    if (!active || !at) {
      this.overlay.set({ crosshair: null, markers, tooltip: null, docked: false });
      return;
    }
    const hasBars = current.series.some((entry) => entry.visible && entry.kind === 'bar');
    const crosshair =
      current.shape === 'cartesian' && trigger === 'axis'
        ? { ...at, isBand: hasBars && current.xType === 'category' }
        : null;
    if (current.shape === 'cartesian') {
      const index = categoryIndex(current, active.key);
      const targets =
        trigger === 'axis'
          ? current.series.filter(
              (entry) => entry.visible && entry.kind !== 'bar' && entry.values[index] !== null,
            )
          : [seriesOf(current, active.series)].filter((entry): entry is NonNullable<typeof entry> =>
              Boolean(entry && entry.kind !== 'bar'),
            );
      for (const target of targets) {
        const spot = engine.locate({ series: target.id, key: active.key });
        if (spot)
          markers.push({
            key: target.id,
            color: target.color,
            at: spot,
            selected: false,
            current: target.id === active.series,
          });
      }
    }
    const settings = this.resolvedTooltip();
    const tooltip =
      trigger === 'none'
        ? null
        : tooltipContext(current, active, { trigger, sort: settings.sort, total: settings.total });
    this.overlay.set({
      crosshair,
      markers,
      tooltip,
      docked: plot.clientWidth < TOOLTIP_DOCK_WIDTH,
    });
  }

  protected px(value: number | undefined) {
    return value === undefined ? null : `${value}px`;
  }

  protected colorOf(color: ChartColor) {
    return {
      slot: color.type === 'slot' ? String(color.slot) : null,
      tone: color.type === 'tone' ? color.tone : null,
      overflow: color.type === 'overflow' ? '' : null,
    };
  }

  protected strokeOf(entry: { series: string } | ChartLegendEntry, key?: string) {
    const current = this.chartModel();
    if (!current) return null;
    const owner =
      current.shape === 'pie'
        ? current.series[0]
        : seriesOf(current, key ?? ('series' in entry ? entry.series : entry.key));
    return owner && owner.stroke !== 'solid' ? owner.stroke : null;
  }

  protected markerKind(kind: string, indicator?: string) {
    if (indicator === 'line' || kind === 'line') return 'line';
    if (kind === 'scatter') return 'scatter';
    return 'bar';
  }

  /* ── Legend ────────────────────────────────────────────────────────── */

  protected legendValue(entry: ChartLegendEntry) {
    const current = this.chartModel();
    if (!current) return '';
    const owner = current.shape === 'pie' ? current.series[0] : seriesOf(current, entry.key);
    if (!owner) return '';
    const key = this.activeKey();
    const index =
      current.shape === 'pie'
        ? categoryIndex(current, entry.key)
        : key
          ? categoryIndex(current, key)
          : lastDrawn(owner.values);
    const raw = index >= 0 ? owner.values[index] : null;
    return raw === null || raw === undefined ? '' : owner.format(raw);
  }

  protected isCurrent(entry: ChartLegendEntry) {
    const current = this.chartModel();
    const key = this.activeKey();
    if (!key) return false;
    return current?.shape === 'pie' ? entry.key === key : this.activePoint()?.series === entry.key;
  }

  protected toggleEntry(
    entry: ChartLegendEntry,
    mode: 'toggle' | 'isolate',
    reason: ChangeReason,
    source: unknown,
  ) {
    const current = this.chartModel();
    if (!current) return;
    const keys = current.legend.map((item) => item.key);
    const next = toggleHidden(keys, this.hidden(), entry.key, mode);
    this.legendFocus.set(entry.key);
    this.requestHidden(next, reason, source);
    getLiveAnnouncer().announce(
      this.t(next.includes(entry.key) ? 'hidden' : 'shown', { series: entry.label }),
    );
  }

  protected onLegendClick(entry: ChartLegendEntry, event: MouseEvent) {
    this.toggleEntry(entry, event.shiftKey ? 'isolate' : 'toggle', this.pressReason(), event);
  }

  protected onLegendItemKey(entry: ChartLegendEntry, event: KeyboardEvent) {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      this.toggleEntry(entry, 'isolate', 'keyboard', event);
    }
  }

  protected emphasize(key: string | null) {
    this.engine?.emphasize(key);
  }

  /* One tab stop for the row; the arrows move inside it (APG Toolbar). */
  protected onLegendKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('[data-part="menu"]')) return;
    const row = event.currentTarget as HTMLElement;
    const items = [...row.querySelectorAll<HTMLElement>(':scope > button:not([hidden])')];
    const index = items.indexOf(target);
    if (index === -1) return;
    const rtl = getComputedStyle(this.host).direction === 'rtl';
    const step =
      event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    let next: HTMLElement | undefined;
    if (step) next = items[(index + step + items.length) % items.length];
    if (event.key === 'Home') next = items[0];
    if (event.key === 'End') next = items[items.length - 1];
    if (!next) return;
    event.preventDefault();
    this.legendFocus.set(next.dataset['key'] ?? '__more');
    next.focus();
  }

  /**
   * Which entries fit on the line, measured by `@slotted/core/overflow` —
   * the arithmetic `toolbar` folds its controls with. The rest wait behind
   * the `+N` control, where they toggle the same series.
   */
  private fitLegend() {
    const node = this.legendRef()?.nativeElement;
    const current = untracked(this.chartModel);
    if (!node || !current) return;
    if (untracked(this.resolvedLegendOverflow) === 'wrap') {
      if (untracked(this.collapsed).length) this.collapsed.set([]);
      return;
    }
    for (const item of node.querySelectorAll<HTMLElement>(':scope > [data-part="legend-item"]')) {
      if (!item.hidden)
        this.widths.set(item.dataset['key'] ?? '', item.getBoundingClientRect().width);
    }
    const more = node.querySelector<HTMLElement>(':scope > [data-part="legend-more"]');
    const result = collapseState({
      units: current.legend.map((entry) => ({
        size: this.widths.get(entry.key) ?? 0,
        collapsible: true,
      })),
      available: node.clientWidth,
      gap: Number.parseFloat(getComputedStyle(node).columnGap) || 0,
      triggerSize: more && !more.hidden ? more.getBoundingClientRect().width : 40,
    });
    const previous = untracked(this.collapsed);
    if (
      previous.length !== result.collapsed.length ||
      previous.some((value, index) => value !== result.collapsed[index])
    ) {
      this.collapsed.set(result.collapsed);
    }
  }

  /* ── Layers ────────────────────────────────────────────────────────── */

  protected toggleLayer(name: string) {
    const layer = this.layerElement(name);
    layer?.togglePopover?.();
  }

  protected onLayerToggle(
    name: string,
    event: Event,
    control: HTMLElement,
    align: 'start' | 'end',
    focusFirst = true,
  ) {
    const open = (event as ToggleEvent).newState === 'open';
    this.layerOpen.update((state) => ({ ...state, [name]: open }));
    const layer = this.layerElement(name);
    if (!layer) return;
    if (open) {
      const box = layer.getBoundingClientRect();
      const at = placeLayer({
        anchor: control.getBoundingClientRect(),
        size: { width: box.width, height: box.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        align,
        dir: getComputedStyle(control).direction === 'rtl' ? 'rtl' : 'ltr',
      });
      layer.style.setProperty('--slotted-chart-x', `${at.x}px`);
      layer.style.setProperty('--slotted-chart-y', `${at.y}px`);
      if (focusFirst) layer.querySelector<HTMLElement>('button')?.focus();
    } else if (layer.contains(document.activeElement) || document.activeElement === document.body) {
      control.focus();
    }
  }

  protected onLayerKeyDown(event: KeyboardEvent) {
    const layer = event.currentTarget as HTMLElement;
    const items = [...layer.querySelectorAll<HTMLElement>('button')].filter((item) => !item.hidden);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    let next: HTMLElement | undefined;
    if (step) next = items[(index + step + items.length) % items.length];
    if (event.key === 'Home') next = items[0];
    if (event.key === 'End') next = items[items.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  private layerElement(name: string) {
    const ref =
      name === 'menu' ? this.menuRef() : name === 'more' ? this.moreRef() : this.helpRef();
    return ref?.nativeElement ?? null;
  }

  protected menuAction(action: 'view' | 'fullscreen' | 'csv' | 'image', event: Event) {
    const reason = this.pressReason();
    this.menuRef()?.nativeElement.hidePopover?.();
    const current = this.chartModel();
    if (action === 'view') this.requestTable(!this.tableOpen(), reason, event);
    if (action === 'fullscreen') this.requestFullscreen(!this.fullscreen(), reason, event);
    if (action === 'csv' && current) {
      this.download(
        `${this.fileName()}.csv`,
        `data:text/csv;charset=utf-8,${encodeURIComponent(chartToCsv(current, this.t))}`,
      );
    }
    if (action === 'image') {
      const url = this.engine?.toDataURL();
      if (url)
        this.download(
          `${this.fileName()}.${url.startsWith('data:image/svg') ? 'svg' : 'png'}`,
          url,
        );
    }
  }

  private fileName() {
    return this.title() ?? 'chart';
  }

  private download(filename: string, url: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  }

  protected resetZoomFromToolbar(event: Event) {
    const current = this.chartModel();
    this.requestZoom(FULL_ZOOM, 'clear', event);
    if (current) getLiveAnnouncer().announce(describeZoom(current, FULL_ZOOM, this.t));
    this.plotRef()?.nativeElement.focus();
  }

  protected showAll(event: Event) {
    this.requestHidden([], 'pointer', event);
  }

  protected onRetry() {
    this.engineFailure.set(null);
    this.retry.emit();
  }

  protected zoomed() {
    const current = this.chartModel();
    return Boolean(this.zoomable() && !isFullZoom(this.zoom()) && current?.shape === 'cartesian');
  }

  /* ── Keyboard and focus ────────────────────────────────────────────── */

  protected onPlotKeyDown(event: KeyboardEvent) {
    const current = this.chartModel();
    if (!current || !this.drawable() || this.tableOpen()) return;
    const actions = chartKeyAction(
      current,
      {
        active: this.activePoint(),
        selection: this.selection(),
        zoom: this.zoom(),
        zoomable: this.zoomable(),
        selectable: this.selectable(),
      },
      event.key,
    );
    if (actions === null) return;
    event.preventDefault();
    for (const action of actions) {
      if (action.type === 'active') {
        this.requestActive(action.point, action.reason, event);
        if (action.point)
          this.pointAnnouncer.say(describePoint(current, action.point, this.selection(), this.t));
        else this.pointAnnouncer.cancel();
      } else if (action.type === 'select') {
        this.requestSelection(action.point, 'keyboard', event);
        if (action.point)
          this.pointAnnouncer.say(describePoint(current, action.point, action.point, this.t));
      } else {
        this.requestZoom(action.zoom, action.reason, event);
        getLiveAnnouncer().announce(describeZoom(current, action.zoom, this.t));
      }
    }
  }

  protected onPlotFocus(event: FocusEvent) {
    const current = this.chartModel();
    if (!current || !this.drawable() || this.tableOpen() || this.activePoint()) return;
    if (!focusVisible(event.currentTarget as Element)) return;
    const point = firstPoint(current);
    if (!point) return;
    this.requestActive(point, 'keyboard', event);
    this.pointAnnouncer.say(describePoint(current, point, this.selection(), this.t));
  }

  protected onRootKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key !== 'Escape' || !this.fullscreen()) return;
    event.preventDefault();
    this.requestFullscreen(false, 'escape', event);
  }

  /* ── Handle ────────────────────────────────────────────────────────── */

  focus() {
    this.plotRef()?.nativeElement.focus();
  }

  resetZoom() {
    this.requestZoom(FULL_ZOOM, 'programmatic');
  }

  toDataURL() {
    return this.engine?.toDataURL() ?? null;
  }

  toCsv() {
    const current = this.chartModel();
    return current ? chartToCsv(current, this.t) : '';
  }
}
