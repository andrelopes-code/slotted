import { createContext, useContext } from 'react';

import type {
  StatCardContextValue,
  StatCardDirection,
  StatCardGoodWhen,
  StatCardTone,
} from './stat-card.types';

const StatCardContext = createContext<StatCardContextValue | null>(null);

export const StatCardProvider = StatCardContext.Provider;

export function useStatCard(): StatCardContextValue {
  const context = useContext(StatCardContext);
  if (context === null) {
    throw new Error('A stat-card part must be rendered inside <StatCard>.');
  }
  return context;
}

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
