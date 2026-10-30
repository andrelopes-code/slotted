import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `chart` writes on its own. */
export interface ChartMessages {
  readonly allHidden: Message;
  readonly category: Message;
  readonly downloadCsv: Message;
  readonly downloadImage: Message;
  readonly error: Message;
  readonly excluded: Message<{ count: number }>;
  readonly exitFullscreen: Message;
  readonly fullscreen: Message;
  readonly help: Message;
  readonly hidden: Message<{ series: string }>;
  readonly kinds: {
    readonly area: Message;
    readonly bar: Message;
    readonly line: Message;
    readonly mixed: Message;
    readonly pie: Message;
    readonly scatter: Message;
  };
  readonly legend: Message;
  /** The control holding the series the legend has no room for; `{series}` is their names as a list. */
  readonly legendMore: Message<{ series: string }>;
  readonly loading: Message;
  readonly more: Message;
  readonly moreSeries: Message<{ count: number }>;
  readonly noData: Message;
  readonly point: Message<{ series: string; category: string; value: string }>;
  readonly resetZoom: Message;
  readonly retry: Message;
  readonly roledescription: Message;
  readonly selected: Message;
  readonly seriesRange: Message<{
    series: string;
    first: string;
    last: string;
    min: string;
    minAt: string;
    max: string;
    maxAt: string;
  }>;
  readonly showAll: Message;
  readonly shown: Message<{ series: string }>;
  readonly slice: Message<{ label: string; value: string; share: string }>;
  readonly summary: Message<{
    kind: string;
    series: number;
    points: number;
    first: string;
    last: string;
  }>;
  readonly summaryPie: Message<{ kind: string; count: number; total: string }>;
  readonly tableView: Message;
  readonly toolbar: Message;
  readonly total: Message;
  readonly truncated: Message<{ shown: number; count: number }>;
  /** The data table's caption when it lists only the first rows. */
  readonly truncatedCaption: Message<{ title: string; shown: number; count: number }>;
  readonly zoomed: Message<{ first: string; last: string }>;
  readonly zoomReset: Message;
}

export const en: ChartMessages = {
  allHidden: 'Every series is hidden',
  category: 'Category',
  downloadCsv: 'Download CSV',
  downloadImage: 'Download image',
  error: 'The chart could not be drawn',
  excluded:
    '{count, plural, one {# negative value is not drawn.} other {# negative values are not drawn.}}',
  exitFullscreen: 'Exit full screen',
  fullscreen: 'Full screen',
  help: 'About this chart',
  hidden: '{series} hidden.',
  kinds: {
    area: 'Area chart',
    bar: 'Bar chart',
    line: 'Line chart',
    mixed: 'Combined chart',
    pie: 'Pie chart',
    scatter: 'Scatter chart',
  },
  legend: 'Series',
  legendMore: 'Series: {series}',
  loading: 'Loading chart',
  more: 'More actions',
  moreSeries: '+{count}',
  noData: 'No data to show',
  point: '{series}, {category}: {value}.',
  resetZoom: 'Reset zoom',
  retry: 'Try again',
  roledescription: 'chart',
  selected: 'selected',
  seriesRange:
    '{series}: from {first} to {last}; lowest {min} at {minAt}, highest {max} at {maxAt}.',
  showAll: 'Show all series',
  shown: '{series} shown.',
  slice: '{label}: {value}, {share}.',
  summary: '{kind} with {series} series and {points} points, from {first} to {last}.',
  summaryPie: '{kind} with {count, plural, one {# slice} other {# slices}}, totaling {total}.',
  tableView: 'Show as table',
  toolbar: 'Chart actions',
  total: 'Total',
  truncated: 'Showing the first {shown} of {count, plural, one {# row} other {# rows}}.',
  truncatedCaption:
    '{title} — showing the first {shown} of {count, plural, one {# row} other {# rows}}.',
  zoomed: 'Showing {first} to {last}.',
  zoomReset: 'Showing all data.',
};

export const chartMessages: MessageFamily<'chart', ChartMessages> = { name: 'chart', base: en };
