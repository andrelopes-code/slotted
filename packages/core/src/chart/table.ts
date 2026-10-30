import type { ChartTranslator } from './describe';
import type { ChartModel } from './model';

/**
 * The chart as a table: the alternative `docs/component-features.md` §13 asks
 * every chart for, and the one Highcharts' `export-data` module draws under
 * its charts. One row per category, one column per visible series: the table
 * is a view of the same chart, shown in the plot's own box, and the legend
 * beside it hides and shows its columns as it does the marks. The CSV holds
 * every series, because a file leaves the view behind.
 */
export interface ChartTableColumn {
  readonly key: string;
  readonly label: string;
  readonly numeric: boolean;
}

export interface ChartTableRow {
  readonly key: string;
  readonly cells: readonly { readonly value: number | string | null; readonly text: string }[];
}

export interface ChartTable {
  readonly columns: readonly ChartTableColumn[];
  readonly rows: readonly ChartTableRow[];
  /** Rows left out past `limit`. The CSV holds them. */
  readonly omitted: number;
}

export function chartTable(
  model: ChartModel,
  t: ChartTranslator,
  options: {
    readonly limit?: number;
    /** Lists hidden series too. */
    readonly includeHidden?: boolean;
  } = {},
): ChartTable {
  const listed = model.series.filter((series) => options.includeHidden || series.visible);
  const limit = options.limit ?? 100;
  const columns: ChartTableColumn[] = [
    {
      key: '__category',
      label: model.x.label ?? t('category'),
      numeric: model.xType !== 'category',
    },
    ...listed.flatMap((series) => {
      const columns: ChartTableColumn[] = [{ key: series.id, label: series.label, numeric: true }];
      if (series.sizes)
        columns.push({ key: `${series.id}__size`, label: `${series.label} ·`, numeric: true });
      return columns;
    }),
  ];
  const rows = model.categories.slice(0, limit).map((category) => ({
    key: category.key,
    cells: [
      { value: category.x, text: category.label },
      ...listed.flatMap((series) => {
        const value = series.values[category.index] ?? null;
        const cells = [{ value, text: value === null ? '' : series.format(value) }];
        if (series.sizes) {
          const size = series.sizes[category.index] ?? null;
          cells.push({ value: size, text: size === null ? '' : String(size) });
        }
        return cells;
      }),
    ],
  }));
  return { columns, rows, omitted: Math.max(0, model.categories.length - limit) };
}

/**
 * A field a spreadsheet would read as a formula is written as text. A
 * category named `=HYPERLINK(...)` is data, and a CSV that turned it into a
 * formula would run the consumer's data as code on the reader's machine —
 * OWASP's "CSV Injection" entry names the four leading characters.
 */
function csvField(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Every row, with numbers as the consumer wrote them rather than formatted,
 * because a CSV is read by a program as often as by a person.
 */
export function chartToCsv(model: ChartModel, t: ChartTranslator): string {
  const header = [model.x.label ?? t('category'), ...model.series.map((series) => series.label)];
  const lines = model.categories.map((category) => [
    model.xType === 'category' ? String(category.x) : category.label,
    ...model.series.map((series) => {
      const value = series.values[category.index];
      return value === null || value === undefined ? '' : String(value);
    }),
  ]);
  return [header, ...lines].map((line) => line.map(csvField).join(',')).join('\r\n');
}
