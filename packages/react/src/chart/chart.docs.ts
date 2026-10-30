import chartTokens from '@slotted/styles/chart/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_CHART_TOKENS = chartTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Chart decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Chart, ChartDefaultsProvider, ChartTooltipContent, preloadChartEngine } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'figure',
    required: true,
    purpose:
      'The chart and everything around it. A size container: the toolbar, the legend and the plot height answer the width the page gives it, not the viewport.',
  },
  {
    part: 'header',
    element: 'figcaption',
    required: false,
    purpose:
      'The caption: title, description, help and the controls. Present when any of them is; the figure is named by it.',
  },
  {
    part: 'title',
    element: 'div',
    required: false,
    purpose:
      'The chart’s name, and the accessible name of the plot. Wraps in the plain variant; one line with an ellipsis in a card.',
  },
  {
    part: 'description',
    element: 'div',
    required: false,
    purpose:
      'One line under the title. Its line is reserved in the card variant, so tiles with and without one keep one height.',
  },
  {
    part: 'help',
    element: 'button',
    required: false,
    purpose: 'An information control beside the title that opens the help note. Present with help.',
  },
  {
    part: 'help-content',
    element: 'div',
    required: false,
    purpose: 'The help note, a popover anchored to its control.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose: 'The consumer’s own controls, before the toolbar: a period picker, a link.',
  },
  {
    part: 'toolbar',
    element: 'div',
    required: false,
    purpose:
      'role="toolbar": zoom reset, the table view, full screen and the menu. While loading, failed or with no data it keeps its box, hidden, inert and out of the accessibility tree (data-waiting), so the header wraps at one width; absent with toolbar="none".',
  },
  {
    part: 'zoom-reset',
    element: 'button',
    required: false,
    purpose: 'Gives the whole domain back. Present only while zoomed.',
  },
  {
    part: 'view-toggle',
    element: 'button',
    required: false,
    purpose:
      'Switches the plot between the drawing and the table, aria-pressed. Leaves the row for the menu below 480 pixels.',
  },
  {
    part: 'fullscreen-toggle',
    element: 'button',
    required: false,
    purpose:
      'Takes the whole screen and gives it back, aria-pressed. Leaves the row for the menu below 480 pixels.',
  },
  {
    part: 'menu-trigger',
    element: 'button',
    required: false,
    purpose: 'Opens the menu of further actions, aria-haspopup="menu".',
  },
  {
    part: 'menu',
    element: 'div',
    required: false,
    purpose:
      'role="menu" in a popover: the table view and full screen when the row has no room for them, then CSV and image.',
  },
  {
    part: 'menu-item',
    element: 'button',
    required: false,
    purpose: 'role="menuitem"; arrows move between them, Escape returns focus to the trigger.',
  },
  {
    part: 'legend',
    element: 'div',
    required: false,
    purpose:
      'role="toolbar" of series toggles on one line; what does not fit waits behind legend-more. Absent with legend={false}.',
  },
  {
    part: 'legend-item',
    element: 'button',
    required: false,
    purpose:
      'One series. aria-pressed says whether it is drawn; a click hides it, Shift+click shows it alone. A span when legendInteractive is false.',
  },
  {
    part: 'legend-marker',
    element: 'span',
    required: false,
    purpose:
      'The series’ mark in its colour and shape: a line, a bar or a dot, dashed when the series is.',
  },
  {
    part: 'legend-label',
    element: 'span',
    required: false,
    purpose: 'The series’ name, truncated with the whole name in its title.',
  },
  {
    part: 'legend-value',
    element: 'span',
    required: false,
    purpose: 'The series’ value at the active point, or its last value. Present with legendValues.',
  },
  {
    part: 'legend-more',
    element: 'button',
    required: false,
    purpose: '“+N”: opens the series that did not fit, as a popover of the same toggles.',
  },
  {
    part: 'plot',
    element: 'div',
    required: true,
    purpose:
      'role="group" named by the title and described by the summary; the one tab stop of the drawing. Its height is the size step and does not change with the state.',
  },
  {
    part: 'canvas',
    element: 'div',
    required: true,
    purpose: 'Where the engine draws, aria-hidden. SVG by default, canvas for large series.',
  },
  {
    part: 'crosshair',
    element: 'div',
    required: false,
    purpose: 'The band or the line under the active category, drawn in HTML over the engine.',
  },
  {
    part: 'marker',
    element: 'span',
    required: false,
    purpose: 'A ring on each series’ point at the active category.',
  },
  {
    part: 'center',
    element: 'div',
    required: false,
    purpose: 'The middle of a donut: the total by default, or renderCenter.',
  },
  {
    part: 'center-value',
    element: 'span',
    required: false,
    purpose: 'The total, in the series’ format.',
  },
  {
    part: 'center-label',
    element: 'span',
    required: false,
    purpose: 'What the total is: the total message.',
  },
  {
    part: 'tooltip',
    element: 'div',
    required: false,
    purpose:
      'The readout at the active point, aria-hidden: the live region says the same once. Docks under the plot when the chart is narrower than 360 pixels.',
  },
  {
    part: 'tooltip-title',
    element: 'div',
    required: false,
    purpose: 'The category, or the date in the time axis’ format.',
  },
  {
    part: 'tooltip-item',
    element: 'div',
    required: false,
    purpose: 'One series’ row; data-current marks the one under the pointer.',
  },
  {
    part: 'tooltip-marker',
    element: 'span',
    required: false,
    purpose: 'The series’ mark, as tooltip.indicator says.',
  },
  {
    part: 'tooltip-label',
    element: 'span',
    required: false,
    purpose: 'The series’ name.',
  },
  {
    part: 'tooltip-value',
    element: 'span',
    required: false,
    purpose: 'The value in the series’ format, with the share of the whole on a pie.',
  },
  {
    part: 'tooltip-note',
    element: 'div',
    required: false,
    purpose:
      'The label of an upright line on this category, under the title. A label the plot had no room to draw is read here.',
  },
  {
    part: 'tooltip-total',
    element: 'div',
    required: false,
    purpose: 'The total of a stack. On by default for stacked series.',
  },
  {
    part: 'skeleton',
    element: 'div',
    required: false,
    purpose:
      'The anatomy of the kind being loaded — bars, a line or a ring over axis lines — in the plot’s own box, with a line of legend above.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'No data, or every series hidden. The second offers “Show all”. Same box as the drawing.',
  },
  {
    part: 'error',
    element: 'div',
    required: false,
    purpose: 'The drawing failed or the data did not arrive, with retry when onRetry is given.',
  },
  {
    part: 'summary',
    element: 'div',
    required: true,
    purpose:
      'The generated description, visually hidden: kind, series, points, range, minimum and maximum of each.',
  },
  {
    part: 'table-region',
    element: 'div',
    required: false,
    purpose:
      'The table view, inside the plot’s box so the card keeps its height; scrolls on its own, focusable.',
  },
  {
    part: 'table',
    element: 'table',
    required: false,
    purpose: 'Every visible series by category, numbers in their formats, the title as caption.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One chart driven by the controls: kind, size, variant, palette, toolbar, trigger and legend. Hover, then Tab into the plot and walk it with the arrows.',
    snippet: defineSnippet({
      id: 'chart-react-playground',
      language: 'tsx',
      label: 'The smallest chart',
      source:
        "<Chart\n  data={monthly}\n  series={[{ kind: 'line', field: 'revenue', label: 'Receita' }]}\n  title=\"Receita\"\n  x={{ field: 'month' }}\n/>;",
    }),
  },
  {
    id: 'line',
    title: 'Lines for a trend',
    note: 'Revenue and cost with a marker on the last point, and the target dashed in the neutral tone so it reads as a reference before its colour does.',
    snippet: defineSnippet({
      id: 'chart-react-line',
      language: 'tsx',
      label: 'Three series, one of them a reference',
      source:
        "<Chart\n  data={monthly}\n  series={[\n    { kind: 'line', field: 'revenue', label: 'Revenue', markers: 'last' },\n    { kind: 'line', field: 'cost', label: 'Cost', markers: 'last' },\n    { kind: 'line', field: 'target', label: 'Target', tone: 'neutral', stroke: 'dashed' },\n  ]}\n  title=\"Revenue and cost\"\n  x={{ field: 'month', label: 'Month' }}\n  y={{ format: brlThousands }}\n/>;",
    }),
  },
  {
    id: 'area',
    title: 'Areas, stacked and smoothed',
    note: 'Three channels stacked with a monotone curve: the wash sits under each line and the tooltip adds the stack’s total.',
    snippet: defineSnippet({
      id: 'chart-react-area',
      language: 'tsx',
      label: 'A stack of areas',
      source:
        "<Chart\n  data={sessions}\n  series={channels.map((channel) => ({\n    ...channel,\n    kind: 'area',\n    stack: 'channel',\n    curve: 'monotone',\n  }))}\n  title=\"Sessions by channel\"\n  x={{ field: 'month' }}\n/>;",
    }),
  },
  {
    id: 'bar',
    title: 'Grouped bars',
    note: 'Three channels side by side in each month; the band under the pointer lights the whole category, not one bar.',
    snippet: defineSnippet({
      id: 'chart-react-bar',
      language: 'tsx',
      label: 'Bars side by side',
      source:
        '<Chart data={orders} series={channels} title="Orders by channel" x={{ field: \'month\' }} />;',
    }),
  },
  {
    id: 'bar-horizontal',
    title: 'A ranking reads across',
    note: 'Horizontal bars with value labels: long category names get the room a vertical axis cannot give them.',
    snippet: defineSnippet({
      id: 'chart-react-bar-horizontal',
      language: 'tsx',
      label: 'orientation="horizontal"',
      source:
        "<Chart\n  data={regions}\n  orientation=\"horizontal\"\n  series={[{ kind: 'bar', field: 'value', label: 'Revenue', labels: true }]}\n  title=\"Revenue by region\"\n  x={{ field: 'region' }}\n/>;",
    }),
  },
  {
    id: 'stacked',
    title: 'Bars stacked into a total',
    note: 'Series that share a stack id pile up; the tooltip lists each and closes with the total of the pile.',
    snippet: defineSnippet({
      id: 'chart-react-stacked',
      language: 'tsx',
      label: 'stack',
      source:
        "<Chart {...orders} series={channels.map((channel) => ({ ...channel, stack: 'total' }))} />;",
    }),
  },
  {
    id: 'stacked-percent',
    title: 'Shares of a whole',
    note: 'stackMode="percent" draws each month as 100 %, so a channel growing in share reads even when the total falls.',
    snippet: defineSnippet({
      id: 'chart-react-stacked-percent',
      language: 'tsx',
      label: 'stackMode="percent"',
      source:
        "<Chart\n  data={orders}\n  series={channels.map((channel) => ({ ...channel, kind: 'area', stack: 'total' }))}\n  stackMode=\"percent\"\n  title=\"Share by channel\"\n  x={{ field: 'month' }}\n/>;",
    }),
  },
  {
    id: 'combo',
    title: 'Bars and a line on one axis',
    note: 'Revenue as bars and the target as a dashed line with markers: one kind per meaning, one scale for both.',
    snippet: defineSnippet({
      id: 'chart-react-combo',
      language: 'tsx',
      label: 'Two kinds in one chart',
      source:
        "const series: ChartSeries[] = [\n  { kind: 'bar', field: 'revenue', label: 'Receita' },\n  {\n    kind: 'line',\n    field: 'target',\n    label: 'Meta',\n    tone: 'neutral',\n    stroke: 'dashed',\n    markers: 'all',\n  },\n];",
    }),
  },
  {
    id: 'dual-axis',
    title: 'Two units, two axes',
    note: 'Orders on the start axis and margin in percent on the end one; each axis is named at its own top, so neither needs the legend to be read.',
    snippet: defineSnippet({
      id: 'chart-react-dual-axis',
      language: 'tsx',
      label: "axis: 'end'",
      source:
        "<Chart\n  data={monthly}\n  series={[\n    { kind: 'bar', field: 'orders', label: 'Orders' },\n    { kind: 'line', field: 'margin', label: 'Margin', axis: 'end', markers: 'all' },\n  ]}\n  title=\"Orders and margin\"\n  x={{ field: 'month' }}\n  y={[{ label: 'Orders' }, { label: 'Margin', format: { style: 'percent' } }]}\n/>;",
    }),
  },
  {
    id: 'time-axis',
    title: 'Dates on a time axis',
    note: 'Forty days of sessions: ticks fall on real dates, gaps in the calendar stay gaps, and the dates are wall-clock days, not shifted by the reader’s time zone.',
    snippet: defineSnippet({
      id: 'chart-react-time-axis',
      language: 'tsx',
      label: "type: 'time'",
      source:
        "<Chart\n  data={daily}\n  series={[{ kind: 'area', field: 'sessions', label: 'Sessions' }]}\n  title=\"Daily sessions\"\n  x={{ field: 'day', type: 'time' }}\n/>;",
    }),
  },
  {
    id: 'log-scale',
    title: 'Growth by orders of magnitude',
    note: 'Active users doubling each month on a logarithmic scale: a steady rate is a straight line, and the early months are not flattened into the floor.',
    snippet: defineSnippet({
      id: 'chart-react-log-scale',
      language: 'tsx',
      label: "scale: 'log'",
      source: "<Chart {...users} y={{ scale: 'log', format: { notation: 'compact' } }} />;",
    }),
  },
  {
    id: 'pie',
    title: 'Parts of a whole',
    note: 'Revenue by region with labels outside the slices; the tooltip adds each slice’s share of the total.',
    snippet: defineSnippet({
      id: 'chart-react-pie',
      language: 'tsx',
      label: "kind: 'pie'",
      source:
        "<Chart\n  data={regions}\n  series={[{ kind: 'pie', field: 'value', label: 'Revenue', labels: true }]}\n  title=\"Revenue by region\"\n  x={{ field: 'region' }}\n/>;",
    }),
  },
  {
    id: 'donut',
    title: 'A donut with the total inside',
    note: 'innerRadius opens the middle, and the center holds the total; legendValues puts each slice’s value beside its name. slotField and toneField give each slice the slot or tone its record names, so a category keeps the colour it has everywhere else; a slice that names none takes the next free slot.',
    snippet: defineSnippet({
      id: 'chart-react-donut',
      language: 'tsx',
      label: 'innerRadius',
      source:
        "<Chart\n  data={tickets}\n  legendValues\n  series={[{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.64 }]}\n  title=\"Tickets por estado\"\n  x={{ field: 'status' }}\n/>;",
    }),
  },
  {
    id: 'scatter',
    title: 'Two measures of each record',
    note: 'Sixty tickets by effort and impact in two groups; the tooltip follows the point, not the axis, because a value axis has no categories to gather.',
    snippet: defineSnippet({
      id: 'chart-react-scatter',
      language: 'tsx',
      label: "kind: 'scatter'",
      source:
        "<Chart\n  data={tickets}\n  recordKey=\"id\"\n  series={[\n    { kind: 'scatter', field: 'product', label: 'Product' },\n    { kind: 'scatter', field: 'infra', label: 'Infrastructure' },\n  ]}\n  title=\"Effort and impact\"\n  x={{ field: 'effort', type: 'value', label: 'Effort (h)' }}\n/>;",
    }),
  },
  {
    id: 'bubble',
    title: 'A third measure as size',
    note: 'sizeField scales each dot by the customers affected, by area rather than radius, so twice the customers reads as twice the ink.',
    snippet: defineSnippet({
      id: 'chart-react-bubble',
      language: 'tsx',
      label: 'sizeField',
      source:
        "const product: ChartSeries = {\n  kind: 'scatter',\n  field: 'product',\n  label: 'Produto',\n  sizeField: 'customers',\n};",
    }),
  },
  {
    id: 'annotations',
    title: 'Targets, ranges and events',
    note: 'A band for the tolerance range, a line for the annual target and a vertical line on the month the campaign started — each labelled on the plot.',
    snippet: defineSnippet({
      id: 'chart-react-annotations',
      language: 'tsx',
      label: 'annotations',
      source:
        "const annotations: ChartAnnotation[] = [\n  { kind: 'band', from: 55, to: 70, label: 'Tolerance', tone: 'success' },\n  { kind: 'line', value: 80, label: 'Annual target', tone: 'danger' },\n  { kind: 'line', axis: 'x', value: 'jun', label: 'Campaign' },\n];",
    }),
  },
  {
    id: 'legend',
    title: 'A legend that toggles',
    note: 'Click a series to hide it, Shift+click to show it alone; arrows move along the legend. The legend holds one line: narrower than its items, the ones that do not fit wait behind +N.',
    snippet: defineSnippet({
      id: 'chart-react-legend',
      language: 'tsx',
      label: 'Legend state, controlled',
      source:
        'const [hidden, setHidden] = useState<readonly string[]>([]);\n\n<Chart {...channels} hidden={hidden} onHiddenChange={setHidden} title="Acquisition channels" />;',
    }),
  },
  {
    id: 'legend-values',
    title: 'Values in the legend',
    note: 'Each legend item carries its series’ value at the active point, and the last value when nothing is active — a readout that never covers the drawing.',
    snippet: defineSnippet({
      id: 'chart-react-legend-values',
      language: 'tsx',
      label: 'legendValues',
      source: '<Chart {...channels} legendValues title="Acquisition channels" />;',
    }),
  },
  {
    id: 'tooltip-modes',
    title: 'Three ways to read a point',
    note: 'trigger="axis" lists every series at the category, sorted here by value; "item" shows only the one under the pointer; "none" leaves the reading to the legend values.',
    snippet: defineSnippet({
      id: 'chart-react-tooltip-modes',
      language: 'tsx',
      label: 'trigger and tooltip',
      source:
        '<Chart {...channels} tooltip={{ sort: \'desc\' }} trigger="axis" />;\n<Chart {...channels} trigger="item" />;\n<Chart {...channels} legendValues trigger="none" />;',
    }),
  },
  {
    id: 'tooltip-custom',
    title: 'A tooltip of your own',
    note: 'renderTooltip replaces the content and keeps the box, the placement and the dock: this one says the change against the previous month in the tone of its sign.',
    snippet: defineSnippet({
      id: 'chart-react-tooltip-custom',
      language: 'tsx',
      label: 'renderTooltip',
      source:
        '<Chart\n  {...revenue}\n  renderTooltip={(context, model) => <MonthOverMonth context={context} model={model} />}\n/>;',
    }),
  },
  {
    id: 'selection',
    title: 'Choosing a point',
    note: 'selectable makes a click or Enter pin a point; the others dim, and the selection is a value the page can use to filter the table below it.',
    snippet: defineSnippet({
      id: 'chart-react-selection',
      language: 'tsx',
      label: 'selection, controlled',
      source:
        'const [selected, setSelected] = useState<ChartPoint | null>(null);\n\n<Chart {...revenue} onSelectionChange={setSelected} selectable selection={selected} />;',
    }),
  },
  {
    id: 'zoom',
    title: 'Zooming a long range',
    note: 'Drag across the plot, wheel with Ctrl, or press + and − with the plot focused; 0 or the reset control gives the whole range back.',
    snippet: defineSnippet({
      id: 'chart-react-zoom',
      language: 'tsx',
      label: 'zoomable',
      source: '<Chart {...daily} defaultZoom={{ start: 0.35, end: 0.7 }} zoomable />;',
    }),
  },
  {
    id: 'sync',
    title: 'Charts that move together',
    note: 'Two charts share one active point through the controlled value: the pointer on either draws the crosshair on both.',
    snippet: defineSnippet({
      id: 'chart-react-sync',
      language: 'tsx',
      label: 'One activePoint, two charts',
      source:
        'const [point, setPoint] = useState<ChartPoint | null>(null);\n\n<Chart {...revenue} activePoint={point} onActivePointChange={setPoint} />;\n<Chart {...orders} activePoint={point} onActivePointChange={setPoint} />;',
    }),
  },
  {
    id: 'sizes',
    title: 'Three heights',
    note: 'sm is 192 pixels of plot for a dashboard tile, md 256 for a page section, lg 384 for the chart a page is about. The width is always the container’s.',
    snippet: defineSnippet({
      id: 'chart-react-sizes',
      language: 'tsx',
      label: 'size',
      source:
        '<Chart {...revenue} size="sm" />;\n<Chart {...revenue} size="md" />;\n<Chart {...revenue} size="lg" />;',
    }),
  },
  {
    id: 'many-series',
    title: 'More series than slots',
    note: 'Eleven channels over eight colour slots: the first eight take the palette, the rest take the overflow neutral, and the legend says which is which.',
    snippet: defineSnippet({
      id: 'chart-react-many-series',
      language: 'tsx',
      label: 'Beyond eight',
      source: '<Chart {...elevenChannels} title="Onze canais" />;',
    }),
  },
  {
    id: 'large-data',
    title: 'Twelve thousand samples',
    note: 'Latency sampled every second: the renderer switches to canvas, the line is downsampled for the screen, and the table still holds every value.',
    snippet: defineSnippet({
      id: 'chart-react-large-data',
      language: 'tsx',
      label: 'renderer and sampling',
      source: '<Chart {...latency} renderer="auto" sampling="auto" zoomable />;',
    }),
  },
  {
    id: 'gaps',
    title: 'Missing values stay missing',
    note: 'A null breaks the line on the left; connectNulls bridges it on the right, for a series where the gap is a sampling artefact rather than a fact.',
    snippet: defineSnippet({
      id: 'chart-react-gaps',
      language: 'tsx',
      label: 'connectNulls',
      source:
        "const revenue: ChartSeries = {\n  kind: 'line',\n  field: 'revenue',\n  label: 'Receita',\n  connectNulls: true,\n};",
    }),
  },
  {
    id: 'negative',
    title: 'Values below zero',
    note: 'Monthly result with its exchange component: a stack splits by sign, so losses hang from the baseline and gains grow from it.',
    snippet: defineSnippet({
      id: 'chart-react-negative',
      language: 'tsx',
      label: 'A stack that crosses zero',
      source:
        "const series: ChartSeries[] = [\n  { kind: 'bar', field: 'operating', label: 'Operational', stack: 'r' },\n  { kind: 'bar', field: 'fx', label: 'Exchange', stack: 'r', tone: 'warning' },\n];",
    }),
  },
  {
    id: 'long-labels',
    title: 'Content the family did not choose',
    note: 'A title of fifteen words, category names of seven, a series named with markup: the title wraps, names on the axis and in the legend truncate with the whole name kept, and markup is text, never HTML.',
    snippet: defineSnippet({
      id: 'chart-react-long-labels',
      language: 'tsx',
      label: 'Strings are text',
      source: '<Chart {...segments} title={longTitle} />;',
    }),
  },
  {
    id: 'texture',
    title: 'Texture as a second channel',
    note: 'texture adds a pattern per slot, so a series is told apart in print, in greyscale or by a reader who does not see the difference between two hues.',
    snippet: defineSnippet({
      id: 'chart-react-texture',
      language: 'tsx',
      label: 'texture',
      source: '<Chart {...orders} texture />;',
    }),
  },
  {
    id: 'loading',
    title: 'Waiting, in the shape of what is coming',
    note: 'The skeleton is the kind being loaded — bars, a line, a ring — over axis lines, in the plot’s own box, with one line of legend: nothing moves when the data arrives.',
    snippet: defineSnippet({
      id: 'chart-react-loading',
      language: 'tsx',
      label: 'loading',
      source: '<Chart {...orders} loading={query.isPending} />;',
    }),
  },
  {
    id: 'empty',
    title: 'Nothing to show',
    note: 'An empty series renders a message in the same box the drawing would take, never a blank plot and never an axis with nothing on it.',
    snippet: defineSnippet({
      id: 'chart-react-empty',
      language: 'tsx',
      label: 'Empty data',
      source:
        '<Chart data={[]} series={revenueSeries} title="Receita" x={{ field: \'month\' }} />;',
    }),
  },
  {
    id: 'all-hidden',
    title: 'Every series hidden',
    note: 'Hiding the last series is allowed and says so, with “Show all” to undo it; the legend stays, so each series can come back one by one.',
    snippet: defineSnippet({
      id: 'chart-react-all-hidden',
      language: 'tsx',
      label: 'defaultHidden',
      source: "<Chart {...channels} defaultHidden={['c0', 'c1', 'c2']} />;",
    }),
  },
  {
    id: 'error',
    title: 'The data did not arrive',
    note: 'error replaces the drawing with a message and, when onRetry is given, the action that asks again; the header and the box stay where they were.',
    snippet: defineSnippet({
      id: 'chart-react-error',
      language: 'tsx',
      label: 'error and onRetry',
      source: '<Chart {...revenue} error={query.isError} onRetry={() => query.refetch()} />;',
    }),
  },
  {
    id: 'dashboard',
    title: 'A row of tiles',
    note: 'Four cards in one row: with and without a description, loading, a donut, eight series. Every tile is one height and every plot starts on one line.',
    snippet: defineSnippet({
      id: 'chart-react-dashboard',
      language: 'tsx',
      label: 'variant="card" in a grid',
      source:
        '<Grid columns={4} gap={4}>\n  <Chart {...revenue} description="Last 12 months" size="sm" variant="card" />\n  <Chart {...orders} loading size="sm" variant="card" />\n</Grid>;',
    }),
  },
  {
    id: 'card',
    title: 'On the page, or as a card',
    note: 'plain sits on the page’s own surface for a report; card draws its own surface, border and padding, and fills the grid cell it is given. Inside a section whose heading already names the chart, leave title out and pass aria-label: it names the plot.',
    snippet: defineSnippet({
      id: 'chart-react-card',
      language: 'tsx',
      label: 'variant, and a chart its section names',
      source:
        '<Chart {...revenue} variant="plain" />;\n<Chart {...revenue} variant="card" />;\n\n<Section>\n  <SectionHeader>\n    <SectionTitle>\n      <SectionHeading>Revenue</SectionHeading>\n    </SectionTitle>\n  </SectionHeader>\n  <SectionBody>\n    <Chart aria-label="Revenue, last 12 months" data={data} series={series} />\n  </SectionBody>\n</Section>;',
    }),
  },
  {
    id: 'toolbar',
    title: 'The controls, and when to show them',
    note: 'visible keeps the toolbar in view; hover shows it on pointer or focus inside the chart; below 480 pixels only the menu remains and holds the rest.',
    snippet: defineSnippet({
      id: 'chart-react-toolbar',
      language: 'tsx',
      label: 'toolbar',
      source:
        '<Chart {...daily} toolbar="visible" zoomable />;\n<Chart {...daily} toolbar="hover" />;\n<Chart {...daily} toolbar="none" />;',
    }),
  },
  {
    id: 'fullscreen',
    title: 'The whole screen',
    note: 'The full-screen control takes the viewport with the browser’s own API; Escape or the same control gives the tile its place back, and the page scrolls to where it was.',
    snippet: defineSnippet({
      id: 'chart-react-fullscreen',
      language: 'tsx',
      label: 'fullscreen, controlled',
      source:
        'const [full, setFull] = useState(false);\n\n<Chart {...revenue} fullscreen={full} onFullscreenChange={setFull} />;',
    }),
  },
  {
    id: 'palette',
    title: 'Colour from the design system',
    note: 'categorical tells series apart, sequential orders them by one hue for ranked data, focus draws the first series in colour and the rest in neutral. slot and tone pin a series to a colour.',
    snippet: defineSnippet({
      id: 'chart-react-palette',
      language: 'tsx',
      label: 'palette, slot and tone',
      source:
        "<Chart {...channels} palette=\"categorical\" />;\n<Chart {...ranked} palette=\"sequential\" />;\n<Chart {...channels} palette=\"focus\" />;\n\nconst cost: ChartSeries = { kind: 'line', field: 'cost', label: 'Custo', slot: 5 };\nconst target: ChartSeries = { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral' };",
    }),
  },
  {
    id: 'help',
    title: 'A note behind the title',
    note: 'help puts an information control beside the title; its note opens on click or Enter, anchored to it, and closes on Escape or outside.',
    snippet: defineSnippet({
      id: 'chart-react-help',
      language: 'tsx',
      label: 'help',
      source:
        '<Chart {...revenue} help="Revenue recognized in the month, excluding taxes. Updated at 6 AM." />;',
    }),
  },
  {
    id: 'table',
    title: 'The same data as a table',
    note: 'The table view opens inside the plot’s box so a card keeps its height; CSV and image downloads sit in the menu, and actions composes the consumer’s own.',
    snippet: defineSnippet({
      id: 'chart-react-table',
      language: 'tsx',
      label: 'tableOpen and actions',
      source: '<Chart {...revenue} actions={<PeriodPicker />} defaultTableOpen />;',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The plot is one tab stop named by the title and described by a generated summary; arrows walk the points, and the live region says the last one reached, not each one passed.',
    snippet: defineSnippet({
      id: 'chart-react-accessibility',
      language: 'tsx',
      label: 'The language, set once',
      source:
        '<SlottedProvider locale="pt-BR" catalogs={{ \'pt-BR\': PT_BR }}>\n  <App />\n</SlottedProvider>;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onHiddenChange',
    payload: '(hidden: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before a series is hidden or shown from the legend, from “Show all”, or isolated with Shift. Reasons: pointer, keyboard, programmatic. cancel() refuses it.',
  },
  {
    name: 'onActivePointChange',
    payload: '(point: ChartPoint | null, request: ChangeRequest<ChartPoint | null>)',
    when: 'When the pointer or the arrows reach a point, and when it leaves: pointer, keyboard, blur, escape. The value two charts share to move together.',
  },
  {
    name: 'onSelectionChange',
    payload: '(point: ChartPoint | null, request: ChangeRequest<ChartPoint | null>)',
    when: 'With selectable, on a click or Enter on a point, and on Escape: pointer, keyboard, escape, programmatic.',
  },
  {
    name: 'onZoomChange',
    payload: '(zoom: ChartZoom, request: ChangeRequest<ChartZoom>)',
    when: 'With zoomable, on a drag, a wheel with Ctrl, + or −, 0 or the reset control: pointer, keyboard, clear, escape, programmatic. start and end are fractions of the domain.',
  },
  {
    name: 'onTableOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the plot switches between the drawing and the table: pointer, keyboard, escape, programmatic.',
  },
  {
    name: 'onFullscreenChange',
    payload: '(fullscreen: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the chart takes or gives back the screen, and when the browser leaves full screen on its own: pointer, keyboard, escape, programmatic.',
  },
  {
    name: 'onRetry',
    payload: '()',
    when: 'On the retry action of the error state.',
  },
];

export const REACT_CHART_DOCS = {
  chart: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'data',
        'readonly ChartRecord[]',
        '—',
        'Chart',
        'One record per category or per point. Fields are named by x and by each series',
      ],
      [
        'series',
        'readonly ChartSeries[]',
        '—',
        'Chart',
        'What is drawn: kind, field, label, and how. Order is legend order and colour order',
      ],
      [
        'x',
        'ChartXAxis',
        '—',
        'Chart',
        'The category field, and its type (category, time, value), label, format and extent',
      ],
      [
        'y',
        'ChartYAxis | [ChartYAxis, ChartYAxis]',
        '—',
        'Chart',
        'The value axis, or the start and end axes: label, format, scale, extent',
      ],
      [
        'min',
        'number',
        '—',
        'x, y',
        'The lowest value the axis must hold. The data widens the extent, never narrows it',
      ],
      ['max', 'number', '—', 'x, y', 'The highest value the axis must hold'],
      ['scale', "'linear' | 'log'", 'linear', 'y', 'A logarithmic value axis'],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'Chart',
        'Which way categories run. Horizontal bars for a ranking with long names',
      ],
      [
        'stackMode',
        "'normal' | 'percent'",
        'normal',
        'Chart',
        'How series that share a stack add up: to a total, or to 100 %',
      ],
      [
        'curve',
        "'linear' | 'monotone' | 'step'",
        'linear',
        'series',
        'How a line or an area passes through its points',
      ],
      ['stroke', "'solid' | 'dashed'", 'solid', 'series', 'A dashed line for a reference'],
      [
        'markers',
        "'none' | 'last' | 'all'",
        'none',
        'series',
        'Dots on a line: none, the last point, or every point',
      ],
      [
        'annotations',
        'readonly ChartAnnotation[]',
        '—',
        'Chart',
        'Lines and bands on either axis, labelled, in a tone. On the category axis a value names a category by its key or its x value; one that names none is not drawn',
      ],
      [
        'recordKey',
        'string',
        '—',
        'Chart',
        'The field that names a record when x is a value axis, for points and selection',
      ],
      [
        'locale',
        'string',
        '—',
        'Chart',
        'BCP 47, for every number and date; the language in force when absent',
      ],
      [
        'title',
        'ReactNode',
        '—',
        'Chart',
        'The caption, and the plot’s accessible name. Not the native title attribute. Without title, the plot is named by the aria-label passed to Chart; use it when a surrounding heading already names the chart',
      ],
      ['description', 'ReactNode', '—', 'Chart', 'One line under the title'],
      ['help', 'ReactNode', '—', 'Chart', 'A note behind an information control beside the title'],
      ['actions', 'ReactNode', '—', 'Chart', 'The consumer’s own controls, before the toolbar'],
      [
        'messages',
        'Partial<ChartMessages>',
        '—',
        'Chart',
        'Words laid over the language in force, key by key: every word the chart writes or says, with {slots}',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Chart', 'The plot height: 192, 256 or 384 pixels'],
      [
        'variant',
        "'plain' | 'card'",
        'plain',
        'Chart',
        'On the page’s surface, or on its own card that fills its grid cell',
      ],
      [
        'palette',
        "'categorical' | 'sequential' | 'focus'",
        'categorical',
        'Chart',
        'Which ramp the eight slots take',
      ],
      [
        'toolbar',
        "'visible' | 'hover' | 'none'",
        'visible',
        'Chart',
        'When the toolbar shows: always, on hover or focus within, or never',
      ],
      [
        'grid',
        "'horizontal' | 'vertical' | 'both' | 'none'",
        'horizontal',
        'Chart',
        'Which grid lines are drawn',
      ],
      [
        'texture',
        'boolean',
        'false',
        'Chart',
        'A pattern per slot, as a second channel beside colour',
      ],
      [
        'renderer',
        "'auto' | 'svg' | 'canvas'",
        'auto',
        'Chart',
        'SVG, or canvas past a few thousand points',
      ],
      [
        'sampling',
        "'auto' | 'none'",
        'auto',
        'Chart',
        'Downsamples a long line for the screen; the table keeps every value',
      ],
      ['animate', 'boolean', 'true', 'Chart', 'Transitions; off under reduced motion regardless'],
      ['legend', 'boolean', 'true', 'Chart', 'Whether the legend is drawn'],
      [
        'legendInteractive',
        'boolean',
        'true',
        'Chart',
        'Legend items as toggles, or as a static key',
      ],
      [
        'legendValues',
        'boolean',
        'false',
        'Chart',
        'Each item’s value at the active point, or its last',
      ],
      [
        'legendOverflow',
        "'collapse' | 'wrap'",
        'collapse',
        'Chart',
        'One line and +N, or as many lines as it takes',
      ],
      [
        'trigger',
        "'axis' | 'item' | 'none'",
        'axis',
        'Chart',
        'What the tooltip reads: the category, the point, or nothing. item for pie and scatter',
      ],
      [
        'tooltip',
        'ChartTooltipSettings',
        '—',
        'Chart',
        'sort, total and indicator for the default tooltip',
      ],
      [
        'indicator',
        "'dot' | 'line' | 'none'",
        'dot',
        'tooltip',
        'The mark beside each tooltip row',
      ],
      [
        'sort',
        "'none' | 'asc' | 'desc'",
        'none',
        'tooltip',
        'Tooltip rows in series order, or by value',
      ],
      ['zoomable', 'boolean', 'false', 'Chart', 'Drag, Ctrl+wheel and + − 0 zoom the x axis'],
      ['selectable', 'boolean', 'false', 'Chart', 'A click or Enter selects a point'],
      [
        'loading',
        'boolean',
        'false',
        'Chart',
        'The skeleton of the kind being loaded, in the plot’s box',
      ],
      ['error', 'boolean', 'false', 'Chart', 'The data did not arrive'],
      ['hidden', 'readonly string[]', '—', 'Chart', 'The series ids the legend hides, controlled'],
      ['defaultHidden', 'readonly string[]', '[]', 'Chart', 'The series hidden at first'],
      ['activePoint', 'ChartPoint | null', '—', 'Chart', 'The point being read, controlled'],
      ['defaultActivePoint', 'ChartPoint | null', 'null', 'Chart', 'The point read at first'],
      ['selection', 'ChartPoint | null', '—', 'Chart', 'The selected point, controlled'],
      ['defaultSelection', 'ChartPoint | null', 'null', 'Chart', 'The point selected at first'],
      ['zoom', 'ChartZoom', '—', 'Chart', 'The visible fraction of the x domain, controlled'],
      ['defaultZoom', 'ChartZoom', '{ start: 0, end: 1 }', 'Chart', 'The zoom at first'],
      ['tableOpen', 'boolean', 'false', 'Chart', 'Whether the plot shows the table, controlled'],
      ['defaultTableOpen', 'boolean', 'false', 'Chart', 'The table open at first'],
      ['fullscreen', 'boolean', 'false', 'Chart', 'Whether the chart has the screen, controlled'],
      ['defaultFullscreen', 'boolean', 'false', 'Chart', 'Full screen at first'],
    ]),
    composition: apiRows([
      [
        'renderTooltip',
        '(context, model) => ReactNode',
        '—',
        'Chart',
        'The tooltip’s content; the box, placement and dock stay. ChartTooltipContent is the default, to wrap or extend',
      ],
      [
        'renderLegendItem',
        '(entry, props, fallback) => ReactNode',
        '—',
        'Chart',
        'One legend item. props carry the toggle’s wiring; fallback is the default content',
      ],
      ['renderCenter', '(model) => ReactNode', '—', 'Chart', 'The middle of a donut'],
      [
        'renderEmpty',
        "(reason: 'no-data' | 'all-hidden') => ReactNode",
        '—',
        'Chart',
        'The empty state',
      ],
      ['renderError', '() => ReactNode', '—', 'Chart', 'The error state'],
      [
        'render',
        '(props: ChartRootProps) => ReactNode',
        '—',
        'Chart',
        'Substitutes the figure. Every data attribute and handler is handed to it',
      ],
      [
        'extendOption',
        '(option) => option',
        '—',
        'Chart',
        'The engine’s option before it is drawn: the escape hatch for what the contract does not say',
      ],
      [
        'handleRef',
        'Ref<ChartHandle>',
        '—',
        'Chart',
        'focus(), resetZoom(), toDataURL() and toCsv()',
      ],
      ['ref', 'Ref<HTMLElement>', '—', 'Chart', 'The figure. Native attributes pass through'],
      [
        'ChartDefaultsProvider',
        'ChartDefaults',
        '—',
        'Application',
        'size, variant, palette, toolbar, renderer, grid, legendOverflow, tooltip and animate, once; a prop still wins',
      ],
      [
        'preloadChartEngine',
        '(kinds?: ChartKind[]) => Promise<void>',
        '—',
        'Application',
        'Fetches the engine chunks ahead of the first chart, on a route’s loader',
      ],
    ]),
    accessibility: [
      'The figure is named by its caption, and the plot is one tab stop with role="group", aria-roledescription="chart", the title as its name and a generated summary as its description: kind, series, points, and the range, minimum and maximum of each series.',
      'Inside the plot the keyboard follows an adaptation of the APG Grid pattern: Left and Right move along the categories, Up and Down between series, Home and End to the ends, Page keys by a tenth; Enter selects, + − and 0 zoom, Escape clears. The tooltip is aria-hidden, and a polite live region says the point reached — only the last one, so holding an arrow does not queue twelve sentences.',
      'The legend is a toolbar of toggle buttons with a roving tab stop: aria-pressed says whether a series is drawn, Enter hides it, Shift+Enter shows it alone, and the live region confirms the change.',
      'Every chart has a table view with the same numbers in their formats, reachable from the toolbar or the menu; it is the complete reading for anyone the drawing does not serve.',
      'Colour is never the only channel: series differ in stroke and marker shape, texture adds a pattern per slot, and under forced colours the drawing is redrawn in system colours with the legend markers kept by mask.',
      'The eight slots of the data scale keep adjacent colours apart under simulated protanopia and deuteranopia in every scheme, and each clears 3:1 against the surface.',
    ],
    snippets: [
      defineSnippet({
        id: 'chart-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<figure\n  data-ui="chart"\n  data-part="root"\n  data-size="md"\n  data-variant="card"\n  data-palette="categorical"\n>\n  <figcaption data-part="header">\n    <div data-part="title">Revenue</div>\n    <div data-part="description">Last 12 months</div>\n    <div data-part="toolbar" role="toolbar">\n      <button data-part="view-toggle" aria-pressed="false" />\n      <button data-part="fullscreen-toggle" aria-pressed="false" />\n      <button data-part="menu-trigger" aria-haspopup="menu" />\n    </div>\n  </figcaption>\n  <div data-part="legend" role="toolbar">\n    <button data-part="legend-item" aria-pressed="true">\n      <span data-part="legend-marker" />\n      <span data-part="legend-label">Revenue</span>\n    </button>\n  </div>\n  <div data-part="plot" role="group" aria-roledescription="chart" tabIndex={0}>\n    <div data-part="canvas" aria-hidden="true" />\n    <div data-part="crosshair" />\n    <div data-part="tooltip" aria-hidden="true" />\n  </div>\n  <div data-part="summary" />\n</figure>;',
      }),
      defineSnippet({
        id: 'chart-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='chart'] {\n  --slotted-chart-color-1: oklch(55% 0.19 262);\n  --slotted-chart-plot-block-size: 20rem;\n  --slotted-chart-line-width: 2.5px;\n}",
      }),
    ],
  },
} as const;
