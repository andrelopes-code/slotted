import type {
  ChartAnnotation,
  ChartField,
  ChartGrid,
  ChartLegendEntry,
  ChartModel,
  ChartOrientation,
  ChartPoint,
  ChartRecord,
  ChartSeries,
  ChartStackMode,
  ChartTooltipContext,
  ChartTrigger,
  ChartXAxis,
  ChartYAxis,
  ChartZoom,
} from '@slotted/core/chart';
import type { ChartMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type ChartSize = 'sm' | 'md' | 'lg';
export type ChartVariant = 'plain' | 'card';
export type ChartPalette = 'categorical' | 'sequential' | 'focus';
export type ChartToolbar = 'visible' | 'hover' | 'none';
export type ChartRenderer = 'auto' | 'svg' | 'canvas';
export type ChartLegendOverflow = 'collapse' | 'wrap';

/** Why a value moved. The subset each value can emit is the contract's. */
export type ChartHiddenReason = 'pointer' | 'keyboard' | 'programmatic';
export type ChartActiveReason = 'pointer' | 'keyboard' | 'blur' | 'escape' | 'programmatic';
export type ChartSelectionReason = 'pointer' | 'keyboard' | 'escape' | 'programmatic';
export type ChartZoomReason = 'pointer' | 'keyboard' | 'clear' | 'escape' | 'programmatic';
export type ChartTableReason = 'pointer' | 'keyboard' | 'escape' | 'programmatic';
export type ChartFullscreenReason = 'pointer' | 'keyboard' | 'escape' | 'programmatic';

export interface ChartTooltipSettings {
  /** Leaves an empty series out of the list and orders the rest. */
  readonly sort?: 'none' | 'asc' | 'desc' | undefined;
  /** The total of a stack; on by default for stacked series. */
  readonly total?: boolean | undefined;
  /** The mark beside each row: the series' own shape, a line, or nothing. */
  readonly indicator?: 'dot' | 'line' | 'none' | undefined;
}

/** What an application sets once for every chart under it. */
export interface ChartDefaults {
  size?: ChartSize | undefined;
  variant?: ChartVariant | undefined;
  palette?: ChartPalette | undefined;
  toolbar?: ChartToolbar | undefined;
  renderer?: ChartRenderer | undefined;
  grid?: ChartGrid | undefined;
  legendOverflow?: ChartLegendOverflow | undefined;
  tooltip?: ChartTooltipSettings | undefined;
  animate?: boolean | undefined;
}

export interface ChartDefaultsProviderProps extends ChartDefaults {
  children?: ReactNode | undefined;
}

/** The imperative actions a declaration cannot express. */
export interface ChartHandle {
  /** Moves focus to the plot, where the keyboard walks the points. */
  focus(): void;
  /** Asks for the whole domain back, with the reason `programmatic`. */
  resetZoom(): void;
  /** The drawing as a data URL: SVG from the SVG renderer, PNG from canvas. */
  toDataURL(): string | null;
  /** Every series as CSV, numbers as the consumer wrote them. */
  toCsv(): string;
}

/** What `renderLegendItem` receives: the entry, and the props of the default item. */
export type ChartLegendItemProps = HTMLAttributes<HTMLElement> & {
  readonly 'data-part': 'legend-item';
  readonly 'data-key': string;
};

/** What `render` receives for the root: the figure's props and the family's state attributes. */
export type ChartRootProps = ComponentPropsWithRef<'figure'> & {
  readonly 'data-ui': 'chart';
  readonly 'data-part': 'root';
} & { readonly [attribute: `data-${string}`]: string | undefined };

/**
 * The figure's own props, less the four names the chart gives a meaning of
 * its own: `title` is the caption, `hidden` the series the legend hides,
 * `onError` nothing the figure emits, and `children` the family's anatomy.
 */
type NativeFigureProps = Omit<
  ComponentPropsWithRef<'figure'>,
  'title' | 'children' | 'onError' | 'defaultValue' | 'hidden'
>;

/**
 * `Row` is the type of one record. An interface without an index signature is
 * accepted, and every field a series or the x axis names must be one of its keys.
 */
export interface ChartProps<Row extends object = ChartRecord> extends NativeFigureProps {
  /* ── What is drawn ─────────────────────────────────────────────────── */
  readonly data: readonly Row[];
  readonly series: readonly ChartSeries<ChartField<Row>>[];
  readonly x?: ChartXAxis<ChartField<Row>> | undefined;
  readonly y?: ChartYAxis | readonly [ChartYAxis, ChartYAxis] | undefined;
  readonly orientation?: ChartOrientation | undefined;
  readonly stackMode?: ChartStackMode | undefined;
  readonly annotations?: readonly ChartAnnotation[] | undefined;
  readonly recordKey?: ChartField<Row> | undefined;
  readonly locale?: string | undefined;

  /* ── The words around it ───────────────────────────────────────────── */
  /** The chart's name: the figure's caption and the plot's accessible name. */
  readonly title?: ReactNode | undefined;
  readonly description?: ReactNode | undefined;
  /** A note behind an information control beside the title. */
  readonly help?: ReactNode | undefined;
  /** Controls of the consumer's own, before the toolbar. */
  readonly actions?: ReactNode | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * toolbar, the legend, the states and the sentences a screen reader hears.
   */
  readonly messages?: PartialMessages<ChartMessages> | undefined;

  /* ── How it looks ──────────────────────────────────────────────────── */
  readonly size?: ChartSize | undefined;
  readonly variant?: ChartVariant | undefined;
  readonly palette?: ChartPalette | undefined;
  readonly toolbar?: ChartToolbar | undefined;
  readonly grid?: ChartGrid | undefined;
  readonly texture?: boolean | undefined;
  readonly renderer?: ChartRenderer | undefined;
  readonly sampling?: 'auto' | 'none' | undefined;
  readonly animate?: boolean | undefined;
  readonly legend?: boolean | undefined;
  readonly legendInteractive?: boolean | undefined;
  readonly legendValues?: boolean | undefined;
  readonly legendOverflow?: ChartLegendOverflow | undefined;
  readonly trigger?: ChartTrigger | undefined;
  readonly tooltip?: ChartTooltipSettings | undefined;
  readonly zoomable?: boolean | undefined;
  readonly selectable?: boolean | undefined;

  /* ── Waiting and failing ───────────────────────────────────────────── */
  readonly loading?: boolean | undefined;
  /** A failure the consumer knows of — the data did not arrive. */
  readonly error?: boolean | undefined;
  /** Offered in the error state; without it the state shows no action. */
  readonly onRetry?: (() => void) | undefined;

  /* ── State ─────────────────────────────────────────────────────────── */
  readonly hidden?: readonly string[] | undefined;
  readonly defaultHidden?: readonly string[] | undefined;
  readonly onHiddenChange?:
    ((value: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;
  readonly activePoint?: ChartPoint | null | undefined;
  readonly defaultActivePoint?: ChartPoint | null | undefined;
  readonly onActivePointChange?:
    ((value: ChartPoint | null, request: ChangeRequest<ChartPoint | null>) => void) | undefined;
  readonly selection?: ChartPoint | null | undefined;
  readonly defaultSelection?: ChartPoint | null | undefined;
  readonly onSelectionChange?:
    ((value: ChartPoint | null, request: ChangeRequest<ChartPoint | null>) => void) | undefined;
  readonly zoom?: ChartZoom | undefined;
  readonly defaultZoom?: ChartZoom | undefined;
  readonly onZoomChange?:
    ((value: ChartZoom, request: ChangeRequest<ChartZoom>) => void) | undefined;
  readonly tableOpen?: boolean | undefined;
  readonly defaultTableOpen?: boolean | undefined;
  readonly onTableOpenChange?:
    ((value: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  readonly fullscreen?: boolean | undefined;
  readonly defaultFullscreen?: boolean | undefined;
  readonly onFullscreenChange?:
    ((value: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /* ── Composition ───────────────────────────────────────────────────── */
  readonly renderTooltip?:
    ((context: ChartTooltipContext, model: ChartModel) => ReactNode) | undefined;
  readonly renderLegendItem?:
    | ((entry: ChartLegendEntry, props: ChartLegendItemProps, fallback: ReactNode) => ReactNode)
    | undefined;
  readonly renderCenter?: ((model: ChartModel) => ReactNode) | undefined;
  readonly renderEmpty?: ((reason: 'no-data' | 'all-hidden') => ReactNode) | undefined;
  readonly renderError?: (() => ReactNode) | undefined;
  readonly render?: ((props: ChartRootProps) => ReactNode) | undefined;
  /** The engine's option, before it is drawn: the escape hatch for what the contract does not say yet. */
  readonly extendOption?:
    ((option: Record<string, unknown>) => Record<string, unknown>) | undefined;
  readonly handleRef?: Ref<ChartHandle> | undefined;
}
