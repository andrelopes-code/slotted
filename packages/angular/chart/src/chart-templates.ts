import { Directive, inject, TemplateRef } from '@angular/core';
import type { ChartLegendEntry, ChartModel, ChartTooltipContext } from '@slotted/core/chart';

/** What a `slChartTooltip` template is handed. */
export interface ChartTooltipTemplateContext {
  $implicit: ChartTooltipContext;
  model: ChartModel;
}

/** Replaces the tooltip's content. The box, its place and its timing stay the chart's. */
@Directive({ selector: 'ng-template[slChartTooltip]', standalone: true })
export class SlChartTooltip {
  readonly template = inject<TemplateRef<ChartTooltipTemplateContext>>(TemplateRef);
}

/** What a `slChartLegendItem` template is handed for one entry. */
export interface ChartLegendItemTemplateContext {
  $implicit: ChartLegendEntry;
  value: string;
  current: boolean;
}

/**
 * Replaces what one legend item holds. The item — a toggle with its pressed
 * state, its color and its place in the roving tab stop — stays the chart's.
 */
@Directive({ selector: 'ng-template[slChartLegendItem]', standalone: true })
export class SlChartLegendItem {
  readonly template = inject<TemplateRef<ChartLegendItemTemplateContext>>(TemplateRef);
}

/** Replaces the words in a donut's center. */
@Directive({ selector: 'ng-template[slChartCenter]', standalone: true })
export class SlChartCenter {
  readonly template = inject<TemplateRef<{ $implicit: ChartModel }>>(TemplateRef);
}

/** Replaces the empty plot: `no-data`, or `all-hidden`. */
@Directive({ selector: 'ng-template[slChartEmpty]', standalone: true })
export class SlChartEmpty {
  readonly template = inject<TemplateRef<{ $implicit: 'no-data' | 'all-hidden' }>>(TemplateRef);
}

/** Replaces the failed plot. */
@Directive({ selector: 'ng-template[slChartError]', standalone: true })
export class SlChartError {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
