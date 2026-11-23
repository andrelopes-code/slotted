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
