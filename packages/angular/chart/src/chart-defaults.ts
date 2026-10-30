import { inject, InjectionToken } from '@angular/core';
import type { ChartGrid } from '@slotted/core/chart';

export type ChartSize = 'sm' | 'md' | 'lg';
export type ChartVariant = 'plain' | 'card';
export type ChartPalette = 'categorical' | 'sequential' | 'focus';
export type ChartToolbar = 'visible' | 'hover' | 'none';
export type ChartRenderer = 'auto' | 'svg' | 'canvas';
export type ChartLegendOverflow = 'collapse' | 'wrap';

export interface ChartTooltipSettings {
  readonly sort?: 'none' | 'asc' | 'desc';
  readonly total?: boolean;
  readonly indicator?: 'dot' | 'line' | 'none';
}

/** What every chart in an application does before any of them states its own. */
export interface ChartDefaults {
  size?: ChartSize;
  variant?: ChartVariant;
  palette?: ChartPalette;
  toolbar?: ChartToolbar;
  renderer?: ChartRenderer;
  grid?: ChartGrid;
  legendOverflow?: ChartLegendOverflow;
  tooltip?: ChartTooltipSettings;
  animate?: boolean;
}

export const CHART_DEFAULTS_TOKEN = new InjectionToken<ChartDefaults>('slotted chart defaults', {
  providedIn: 'root',
  factory: (): ChartDefaults => ({}),
});

/**
 * An application decides once how its charts look — the tile or the plain
 * form, the palette, the toolbar — and every chart inherits the decision. A
 * chart that states any of them still wins: an explicit input is never
 * overridden by the token. The words and the locale come from the language in
 * force (`provideSlotted`).
 */
export function provideChartDefaults(defaults: ChartDefaults) {
  return { provide: CHART_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectChartDefaults(): ChartDefaults {
  return inject(CHART_DEFAULTS_TOKEN);
}
