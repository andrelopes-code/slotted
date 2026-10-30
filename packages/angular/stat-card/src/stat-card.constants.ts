export type StatCardSize = 'sm' | 'md' | 'lg';
export type StatCardFill = 'outline' | 'elevated' | 'subtle' | 'plain';
export type StatCardLayout = 'inline' | 'stacked';
export type StatCardValueStatus = 'ready' | 'empty' | 'error';
export type StatCardGoodWhen = 'up' | 'down' | 'none';
export type StatCardTone =
  'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type StatCardAttention = 'warning' | 'danger';
export type StatCardDirection = 'up' | 'down' | 'flat';
export type StatCardDeltaFormat = 'percent' | 'decimal';

/** The direction of a change, from its sign. */
export function trendOf(value: number | undefined): StatCardDirection {
  if (value === undefined || Number.isNaN(value) || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

/**
 * The tone of a change, from what the metric means and never from the sign:
 * a rise is good when up is good and bad when down is; a fall is the reverse;
 * a flat change, or a metric with no valence, is neutral.
 */
export function toneOf(trend: StatCardDirection, goodWhen: StatCardGoodWhen): StatCardTone {
  if (trend === 'flat' || goodWhen === 'none') return 'neutral';
  return (trend === 'up') === (goodWhen === 'up') ? 'success' : 'danger';
}
