/**
 * The vocabulary of a chart, with no engine in it.
 *
 * Everything here is data a consumer can write in JSON and send from a
 * server: a kind is a string rather than an imported function, because the
 * engine loads each kind on demand and the bytes a page downloads are the same
 * either way. Nothing names an ECharts type; `@slotted/core/chart-echarts` is
 * the only module that does.
 */

export type ChartKind = 'line' | 'area' | 'bar' | 'pie' | 'scatter';

export type ChartTone =
  'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

export type ChartSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ChartCurve = 'linear' | 'monotone' | 'step';

export type ChartOrientation = 'vertical' | 'horizontal';

export type ChartStackMode = 'normal' | 'percent';

export type ChartXType = 'category' | 'time' | 'value';

export type ChartTrigger = 'axis' | 'item' | 'none';

export type ChartGrid = 'horizontal' | 'vertical' | 'both' | 'none';

/** One record of the consumer's data. The family reads the fields it is told to. */
export type ChartRecord = Readonly<Record<string, unknown>>;

/**
 * A field of a record: a key of the consumer's row type. A row type with no
 * known keys (`ChartRecord`, or `object` when a binding is read without its
 * type argument) takes any string.
 */
export type ChartField<Row extends object> = object extends Row ? string : keyof Row & string;

/**
 * How a number is written: `Intl.NumberFormat` options read with the chart's
 * locale, or a function for what `Intl` cannot say. A number stays a number
 * in the data; formatting happens at the edge (`docs/component-features.md`
 * §2.9).
 */
export type ChartNumberFormat =
  Intl.NumberFormatOptions | ((value: number, locale: string | undefined) => string);

/**
 * How a time is written. The value handed to a function is the wall-clock
 * time expressed as milliseconds of a UTC calendar, so `new Date(value)` read
 * with `getUTC*` gives back the fields the consumer wrote, and a daylight
 * boundary never adds or removes an hour.
 */
export type ChartTimeFormat =
  Intl.DateTimeFormatOptions | ((value: number, locale: string | undefined) => string);

/** `Field` is the set of field names a record has; a binding narrows it to the keys of its row type. */
export interface ChartSeries<Field extends string = string> {
  /** Unique within the chart. Defaults to `field`. */
  readonly id?: string | undefined;
  readonly kind: ChartKind;
  /** The field of each record that holds this series' value. */
  readonly field: Field;
  /** What the legend, the tooltip and the table call it. Defaults to the id. */
  readonly label?: string | undefined;
  /** Which colour of the data scale. Assigned in order when absent. */
  readonly slot?: ChartSlot | undefined;
  /** What the series means. Wins over `slot`. */
  readonly tone?: ChartTone | undefined;
  /** Series that name the same stack are drawn on top of each other. */
  readonly stack?: string | undefined;
  /** The value axis the series is read against, named by its side. */
  readonly axis?: 'start' | 'end' | undefined;
  readonly curve?: ChartCurve | undefined;
  readonly stroke?: 'solid' | 'dashed' | undefined;
  readonly connectNulls?: boolean | undefined;
  readonly markers?: 'none' | 'last' | 'all' | undefined;
  readonly labels?: boolean | undefined;
  /** A scatter's bubble size. */
  readonly sizeField?: Field | undefined;
  /** A pie's hole, as a share of its radius from 0 to 0.9. Above 0 is a donut. */
  readonly innerRadius?: number | undefined;
  /**
   * A pie's slot per slice: the field of each record that holds its slot, 1
   * to 8, so a category keeps the colour it has everywhere else in the
   * application. A slice whose record holds none takes the next free slot.
   */
  readonly slotField?: Field | undefined;
  /** A pie's tone per slice, from the field of each record; wins over `slotField`. */
  readonly toneField?: Field | undefined;
  /** Overrides the value axis' format for this series. */
  readonly format?: ChartNumberFormat | undefined;
}

export interface ChartXAxis<Field extends string = string> {
  /** The field of each record that places it: a category, a time or a number. */
  readonly field: Field;
  readonly type?: ChartXType | undefined;
  readonly label?: string | undefined;
  readonly format?: ChartNumberFormat | ChartTimeFormat | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

export interface ChartYAxis {
  readonly label?: string | undefined;
  readonly format?: ChartNumberFormat | undefined;
  readonly scale?: 'linear' | 'log' | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

export interface ChartAnnotation {
  readonly kind: 'line' | 'band';
  /** Which axis the value is on: the category axis, or a value axis by its side. */
  readonly axis?: 'x' | 'start' | 'end' | undefined;
  /** On the category axis, a category's key or its x value; a value that names none is not drawn. */
  readonly value?: number | string | undefined;
  readonly from?: number | string | undefined;
  readonly to?: number | string | undefined;
  readonly label?: string | undefined;
  readonly tone?: ChartTone | undefined;
  /**
   * Which side of an upright line its label hangs on: `start` ends at the
   * line, `end` begins at it, `auto` centres it and moves it inward at an edge
   * of the plot. Labels that would overlap take a second row; past it, the
   * lowest `priority` is hidden and still named by the tooltip.
   */
  readonly labelPlacement?: 'start' | 'end' | 'auto' | undefined;
  /** Which label keeps its place when two collide. Higher wins; defaults to 0. */
  readonly priority?: number | undefined;
}

export interface ChartSpec {
  readonly data: readonly ChartRecord[];
  readonly series: readonly ChartSeries[];
  readonly x?: ChartXAxis | undefined;
  readonly y?: ChartYAxis | readonly [ChartYAxis, ChartYAxis] | undefined;
  readonly orientation?: ChartOrientation | undefined;
  readonly stackMode?: ChartStackMode | undefined;
  readonly annotations?: readonly ChartAnnotation[] | undefined;
  /**
   * The field that names a record, when its position on the axis does not.
   * A scatter's points are otherwise keyed by their position in `data`.
   */
  readonly recordKey?: string | undefined;
  readonly locale?: string | undefined;
}

/**
 * A point, named by what it is rather than where it sits: the series and the
 * key of its category. Data that arrives in front of it does not move it.
 */
export interface ChartPoint {
  readonly series: string;
  readonly key: string;
}

/** The window of the category domain in view, as fractions from 0 to 1. */
export interface ChartZoom {
  readonly start: number;
  readonly end: number;
}

/**
 * The colour of a series or a slice. A slot is identity, a tone is meaning,
 * and neither is overflow: the ninth series and on, drawn muted with a texture
 * because the scale never cycles.
 */
export type ChartColor =
  | { readonly type: 'slot'; readonly slot: ChartSlot }
  | { readonly type: 'tone'; readonly tone: ChartTone }
  | { readonly type: 'overflow' };
