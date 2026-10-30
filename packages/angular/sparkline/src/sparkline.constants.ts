export type SparklineType = 'line' | 'bar';
export type SparklineSize = 'sm' | 'md' | 'lg';
export type SparklineCurve = 'linear' | 'monotone';
export type SparklineTone =
  'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type SparklineSeries = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** The bar's corner and the space between two bars, in pixels; the stylesheet's geometry. */
export const SPARKLINE_BAR_GAP = 2;
export const SPARKLINE_BAR_RADIUS = 2;
