import type { ChartMessages, FamilyTranslator } from '../i18n';
import { createNumberFormatter } from './format';
import { categoryIndex, type ChartModel, seriesOf, visibleSeries } from './model';
import type { ChartPoint, ChartZoom } from './types';
import { zoomRange } from './navigation';

/** The family's words in the language in force: `useMessages` / `injectMessages` of `chartMessages`. */
export type ChartTranslator = FamilyTranslator<ChartMessages>;

function kindOf(model: ChartModel, t: ChartTranslator) {
  const kinds = new Set(visibleSeries(model).map((series) => series.kind));
  return kinds.size === 1 ? t(`kinds.${[...kinds][0]!}`) : t('kinds.mixed');
}

function share(value: number, total: number, locale: string | undefined) {
  return createNumberFormatter(
    { style: 'percent', maximumFractionDigits: 1 },
    locale,
  )(total ? value / total : 0);
}

/**
 * The sentence a screen reader hears in place of the drawing: what kind of
 * chart, how much of it, its span, and for each visible series where it
 * starts, ends, peaks and bottoms. It is what Highcharts' and ECharts'
 * generated descriptions say, and it is written from the model, so it cannot
 * describe a series the chart has hidden.
 */
export function describeChart(model: ChartModel, t: ChartTranslator): string {
  if (model.empty === 'no-data') return t('noData');
  if (model.empty === 'all-hidden') return t('allHidden');

  if (model.shape === 'pie') {
    const series = model.series[0]!;
    const slices = model.categories
      .filter((category) => category.visible && (series.values[category.index] ?? 0) > 0)
      .map((category) =>
        t('slice', {
          label: category.label,
          value: series.format(series.values[category.index]!),
          share: share(series.values[category.index]!, model.total, model.locale),
        }),
      );
    const parts = [
      t('summaryPie', {
        kind: t('kinds.pie'),
        count: slices.length,
        total: series.format(model.total),
      }),
      ...slices,
    ];
    if (model.excluded > 0) parts.push(t('excluded', { count: model.excluded }));
    return parts.join(' ');
  }

  const visible = visibleSeries(model);
  const categories = model.categories;
  const parts = [
    t('summary', {
      kind: kindOf(model, t),
      series: visible.length,
      points: categories.length,
      first: categories[0]!.label,
      last: categories[categories.length - 1]!.label,
    }),
  ];
  for (const series of visible) {
    const drawn = series.values
      .map((value, index) => ({ value, index }))
      .filter((entry): entry is { value: number; index: number } => entry.value !== null);
    if (drawn.length === 0) continue;
    const min = drawn.reduce((low, entry) => (entry.value < low.value ? entry : low));
    const max = drawn.reduce((high, entry) => (entry.value > high.value ? entry : high));
    parts.push(
      t('seriesRange', {
        series: series.label,
        first: series.format(drawn[0]!.value),
        last: series.format(drawn[drawn.length - 1]!.value),
        min: series.format(min.value),
        minAt: categories[min.index]!.label,
        max: series.format(max.value),
        maxAt: categories[max.index]!.label,
      }),
    );
  }
  return parts.join(' ');
}

/** What the live announcer says when the keyboard lands on a point. */
export function describePoint(
  model: ChartModel,
  point: ChartPoint,
  selection: ChartPoint | null,
  t: ChartTranslator,
): string {
  const series = seriesOf(model, point.series);
  const index = categoryIndex(model, point.key);
  if (!series || index < 0) return '';
  const value = series.values[index];
  const category = model.categories[index]!;
  const text =
    model.shape === 'pie'
      ? t('slice', {
          label: category.label,
          value: value === null || value === undefined ? '' : series.format(value),
          share: share(value ?? 0, model.total, model.locale),
        })
      : t('point', {
          series: series.label,
          category: category.label,
          value: value === null || value === undefined ? '' : series.format(value),
        });
  const selected = selection?.series === point.series && selection.key === point.key;
  return selected ? `${text} ${t('selected')}` : text;
}

/** What the live announcer says when the window of the domain moves. */
export function describeZoom(
  model: ChartModel,
  zoom: ChartZoom | null,
  t: ChartTranslator,
): string {
  const [first, last] = zoomRange(model, zoom);
  if (!zoom || (zoom.start <= 0 && zoom.end >= 1) || last < first) return t('zoomReset');
  return t('zoomed', {
    first: model.categories[first]!.label,
    last: model.categories[last]!.label,
  });
}
