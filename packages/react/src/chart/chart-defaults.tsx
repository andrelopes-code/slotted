import { createContext, useContext } from 'react';

import type { ChartDefaults, ChartDefaultsProviderProps } from './chart.types';

const ChartDefaultsContext = createContext<ChartDefaults>({});

export function useChartDefaults(): ChartDefaults {
  return useContext(ChartDefaultsContext);
}

/**
 * An application decides once how its charts look — the tile or the plain
 * form, the palette, the toolbar — and every chart under it inherits the
 * decision. A chart that states any of them still wins: an explicit prop is
 * never overridden by context. A nested provider overrides the one above it
 * key by key. The words and the locale come from the language in force
 * (`SlottedProvider`).
 */
export function ChartDefaultsProvider({ children, ...defaults }: ChartDefaultsProviderProps) {
  const inherited = useChartDefaults();
  const merged: ChartDefaults = { ...inherited };
  for (const [key, value] of Object.entries(defaults) as [keyof ChartDefaults, unknown][]) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  merged.tooltip = { ...inherited.tooltip, ...defaults.tooltip };
  return <ChartDefaultsContext.Provider value={merged}>{children}</ChartDefaultsContext.Provider>;
}
