import type { PartialMessages, SparklineMessages } from '@slotted/core/i18n';
import type { SparklineDatum } from '@slotted/core/sparkline';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type SparklineType = 'line' | 'bar';
export type SparklineSize = 'sm' | 'md' | 'lg';
export type SparklineCurve = 'linear' | 'monotone';
export type SparklineTone =
  'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type SparklineSeries = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * What every sparkline in an application does before any of them states
 * anything of its own: how a number is read out, whether a line is smoothed,
 * washed and marked. A sparkline that states any of these
 * still wins; an explicit prop is never overridden by context.
 */
export interface SparklineDefaults {
  area?: boolean | undefined;
  curve?: SparklineCurve | undefined;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  marker?: boolean | undefined;
}

export interface SparklineDefaultsProviderProps extends SparklineDefaults {
  children?: ReactNode;
}

export interface SparklineRootProps extends ComponentPropsWithRef<'span'> {
  'aria-label': string;
  /** Present while the marks ease to a new `data`; a resize redraws at once. */
  'data-animate'?: '';
  'data-curve': SparklineCurve;
  'data-part': string;
  'data-series': string | undefined;
  'data-size': SparklineSize;
  'data-tone': SparklineTone | undefined;
  'data-type': SparklineType;
  'data-ui': string;
  role: 'img';
}

export interface SparklineProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The series, oldest first. `null` is a gap: the line breaks, the bar is not drawn. */
  data: readonly SparklineDatum[];
  type?: SparklineType;
  size?: SparklineSize;
  /** Straight segments, or a monotone curve that never overshoots a point. */
  curve?: SparklineCurve;
  /** The wash under a line. */
  area?: boolean;
  /** A disc on the last real point. */
  marker?: boolean;
  /** A dashed line at this value, which widens the extent to hold it. */
  reference?: number;
  /** The extent, when the data's own is not the one to draw. The data widens it, never narrows it. */
  min?: number;
  max?: number;
  /** How the series is doing. Wins over `series`. */
  tone?: SparklineTone;
  /** Which series this is, as a slot of the data scale. */
  series?: SparklineSeries;
  /** What the series is, said first in the description: `Revenue: 30, up 18 since 12`. */
  label?: string;
  /** The whole accessible name, replacing the generated description. */
  description?: string;
  /** How a value is read out in the description. `Intl.NumberFormat` options, or a function. */
  formatOptions?: Intl.NumberFormatOptions;
  valueFormatter?: (value: number) => string;
  /** The locale numbers are written in; the language in force when absent. */
  locale?: string;
  /** Words laid over the catalog of the language in force, key by key: the description's sentences. */
  messages?: PartialMessages<SparklineMessages> | undefined;
  render?: (props: SparklineRootProps) => ReactNode;
}

export interface PositionStripRootProps extends ComponentPropsWithRef<'span'> {
  'aria-label': string;
  'data-part': string;
  'data-size': SparklineSize;
  'data-tone': SparklineTone | undefined;
  'data-type': 'strip';
  'data-ui': string;
  role: 'img';
}

export interface PositionStripProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The current value. `null` while it is not known: the dot is left out and the name says so. */
  value: number | null;
  /** The periods the value is read against, oldest first. `null` is a gap. */
  values: readonly SparklineDatum[];
  /** A dashed tick at this value — a long-run mean — which widens the extent to hold it. */
  reference?: number | undefined;
  /**
   * The extent, when the data's own is not the one to draw. The data widens
   * it, never narrows it; rows that state the same two line up.
   */
  min?: number | undefined;
  max?: number | undefined;
  /** Leaves the value dot out while the value is incomplete, and says so in the name. */
  hideValue?: boolean | undefined;
  size?: SparklineSize | undefined;
  /** How the value is doing: the value dot's color. */
  tone?: SparklineTone | undefined;
  /** What the strip is, said first in the name: `Savings rate: 800, against a range of …`. */
  label?: string | undefined;
  /** The whole accessible name, replacing the generated one. */
  description?: string | undefined;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  valueFormatter?: ((value: number) => string) | undefined;
  locale?: string | undefined;
  messages?: PartialMessages<SparklineMessages> | undefined;
  render?: ((props: PositionStripRootProps) => ReactNode) | undefined;
}

export interface BarCompareRow {
  readonly label: string;
  readonly value: number;
  /** A hatched fill, to tell a reference from the subject without color. */
  readonly texture?: boolean | undefined;
}

export interface BarCompareRootProps extends ComponentPropsWithRef<'span'> {
  'aria-label': string;
  'data-part': string;
  'data-tone': SparklineTone | undefined;
  'data-type': 'compare';
  'data-ui': string;
  role: 'img';
}

export interface BarCompareProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The values compared, one row each, in the order they are drawn. */
  data: readonly BarCompareRow[];
  /**
   * The domain. Zero and the data widen it, never narrow it; roots that state
   * the same `min`, `max` and `step` draw the same axis.
   */
  min?: number | undefined;
  max?: number | undefined;
  /** The distance between two ticks. Without it, only the zero line is drawn. */
  step?: number | undefined;
  tone?: SparklineTone | undefined;
  /** The whole accessible name, replacing the one built from the rows. */
  description?: string | undefined;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  valueFormatter?: ((value: number) => string) | undefined;
  locale?: string | undefined;
  render?: ((props: BarCompareRootProps) => ReactNode) | undefined;
}
