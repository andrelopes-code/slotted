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

export const ANGULAR_CHART_TOKENS = chartTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Chart decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlChart, SlChartTooltip, provideChartDefaults, preloadChartEngine } from '@slotted/angular/chart';",
  selector: 'figure[slChart]',
  exportAs: 'slChart',
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
      'role="toolbar" of series toggles on one line; what does not fit waits behind legend-more. Absent with [legend]="false".',
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
      'The series’ mark in its color and shape: a line, a bar or a dot, dashed when the series is.',
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
    purpose: 'The middle of a donut: the total by default, or a slChartCenter template.',
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
    purpose:
      'The drawing failed or the data did not arrive, with the retry action that emits retry.',
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
      id: 'chart-angular-playground',
      language: 'angular',
      label: 'The smallest chart',
      source:
        '<figure\n  slChart\n  title="Receita"\n  [data]="monthly"\n  [series]="revenue"\n  [x]="{ field: \'month\' }"\n></figure>',
    }),
  },
  {
    id: 'line',
    title: 'Lines for a trend',
    note: 'Revenue and cost with a marker on the last point, and the target dashed in the neutral tone so it reads as a reference before its color does.',
    snippet: defineSnippet({
      id: 'chart-angular-line',
      language: 'angular',
      label: 'Three series, one of them a reference',
      source:
        '<figure slChart title="Receita e custo" [data]="monthly" [series]="series" [x]="x" [y]="y"></figure>',
    }),
  },
  {
    id: 'area',
    title: 'Areas, stacked and smoothed',
    note: 'Three channels stacked with a monotone curve: the wash sits under each line and the tooltip adds the stack’s total.',
    snippet: defineSnippet({
      id: 'chart-angular-area',
      language: 'angular',
      label: 'A stack of areas',
      source:
        '<figure slChart title="Sessions by channel" [data]="sessions" [series]="stackedAreas"></figure>',
    }),
  },
  {
    id: 'bar',
    title: 'Grouped bars',
    note: 'Three channels side by side in each month; the band under the pointer lights the whole category, not one bar.',
    snippet: defineSnippet({
      id: 'chart-angular-bar',
      language: 'angular',
      label: 'Bars side by side',
      source:
        '<figure slChart title="Orders by channel" [data]="orders" [series]="channels"></figure>',
    }),
  },
  {
    id: 'bar-horizontal',
    title: 'A ranking reads across',
    note: 'Horizontal bars with value labels: long category names get the room a vertical axis cannot give them.',
    snippet: defineSnippet({
      id: 'chart-angular-bar-horizontal',
      language: 'angular',
      label: 'orientation="horizontal"',
      source:
        '<figure\n  slChart\n  orientation="horizontal"\n  title="Revenue by region"\n  [data]="regions"\n  [series]="ranking"\n></figure>',
    }),
  },
  {
    id: 'stacked',
    title: 'Bars stacked into a total',
    note: 'Series that share a stack id pile up; the tooltip lists each and closes with the total of the pile.',
    snippet: defineSnippet({
      id: 'chart-angular-stacked',
      language: 'angular',
      label: 'stack',
      source:
        '<figure slChart title="Orders by channel" [data]="orders" [series]="stackedBars"></figure>',
    }),
  },
  {
    id: 'stacked-percent',
    title: 'Shares of a whole',
    note: 'stackMode="percent" draws each month as 100 %, so a channel growing in share reads even when the total falls.',
    snippet: defineSnippet({
      id: 'chart-angular-stacked-percent',
      language: 'angular',
      label: 'stackMode="percent"',
      source:
        '<figure\n  slChart\n  stackMode="percent"\n  title="Share by channel"\n  [data]="orders"\n  [series]="stackedAreas"\n></figure>',
    }),
  },
  {
    id: 'combo',
    title: 'Bars and a line on one axis',
    note: 'Revenue as bars and the target as a dashed line with markers: one kind per meaning, one scale for both.',
    snippet: defineSnippet({
      id: 'chart-angular-combo',
      language: 'angular',
      label: 'Two kinds in one chart',
      source:
        '<figure slChart title="Receita e meta" [data]="monthly" [series]="barAndTarget"></figure>',
    }),
  },
  {
    id: 'dual-axis',
    title: 'Two units, two axes',
    note: 'Orders on the start axis and margin in percent on the end one; each axis is named at its own top, so neither needs the legend to be read.',
    snippet: defineSnippet({
      id: 'chart-angular-dual-axis',
      language: 'angular',
      label: "axis: 'end'",
      source:
        '<figure\n  slChart\n  title="Orders and margin"\n  [data]="monthly"\n  [series]="ordersAndMargin"\n  [y]="[orders, margin]"\n></figure>',
    }),
  },
  {
    id: 'time-axis',
    title: 'Dates on a time axis',
    note: 'Forty days of sessions: ticks fall on real dates, gaps in the calendar stay gaps, and the dates are wall-clock days, not shifted by the reader’s time zone.',
    snippet: defineSnippet({
      id: 'chart-angular-time-axis',
      language: 'angular',
      label: "type: 'time'",
      source:
        '<figure\n  slChart\n  title="Daily sessions"\n  [data]="daily"\n  [series]="sessions"\n  [x]="{ field: \'day\', type: \'time\' }"\n></figure>',
    }),
  },
  {
    id: 'log-scale',
    title: 'Growth by orders of magnitude',
    note: 'Active users doubling each month on a logarithmic scale: a steady rate is a straight line, and the early months are not flattened into the floor.',
    snippet: defineSnippet({
      id: 'chart-angular-log-scale',
      language: 'angular',
      label: "scale: 'log'",
      source:
        '<figure\n  slChart\n  title="Active users"\n  [data]="users"\n  [series]="series"\n  [y]="{ scale: \'log\' }"\n></figure>',
    }),
  },
  {
    id: 'pie',
    title: 'Parts of a whole',
    note: 'Revenue by region with labels outside the slices; the tooltip adds each slice’s share of the total.',
    snippet: defineSnippet({
      id: 'chart-angular-pie',
      language: 'angular',
      label: "kind: 'pie'",
      source:
        '<figure\n  slChart\n  title="Revenue by region"\n  [data]="regions"\n  [series]="pie"\n  [x]="{ field: \'region\' }"\n></figure>',
    }),
  },
  {
    id: 'donut',
    title: 'A donut with the total inside',
    note: 'innerRadius opens the middle and the center holds the total; a slChartCenter template replaces it, here with the resolution rate. slotField and toneField give each slice the slot or tone its record names, so a category keeps the color it has everywhere else; a slice that names none takes the next free slot.',
    snippet: defineSnippet({
      id: 'chart-angular-donut',
      language: 'angular',
      label: 'innerRadius and slChartCenter',
      source:
        '<figure slChart title="Tickets por estado" [data]="tickets" [series]="donut">\n  <ng-template slChartCenter let-model>\n    <span data-part="center-value">{{ resolved(model) }}</span>\n    <span data-part="center-label">resolvidos</span>\n  </ng-template>\n</figure>',
    }),
  },
  {
    id: 'scatter',
    title: 'Two measures of each record',
    note: 'Sixty tickets by effort and impact in two groups; the tooltip follows the point, not the axis, because a value axis has no categories to gather.',
    snippet: defineSnippet({
      id: 'chart-angular-scatter',
      language: 'angular',
      label: "kind: 'scatter'",
      source:
        '<figure\n  slChart\n  recordKey="id"\n  title="Effort and impact"\n  [data]="work"\n  [series]="groups"\n  [x]="effort"\n></figure>',
    }),
  },
  {
    id: 'bubble',
    title: 'A third measure as size',
    note: 'sizeField scales each dot by the customers affected, by area rather than radius, so twice the customers reads as twice the ink.',
    snippet: defineSnippet({
      id: 'chart-angular-bubble',
      language: 'angular',
      label: 'sizeField',
      source:
        '<figure\n  slChart\n  recordKey="id"\n  title="Effort, impact and customers"\n  [data]="work"\n  [series]="bubbles"\n></figure>',
    }),
  },
  {
    id: 'annotations',
    title: 'Targets, ranges and events',
    note: 'A band for the tolerance range, a line for the annual target and a vertical line on the month the campaign started — each labelled on the plot.',
    snippet: defineSnippet({
      id: 'chart-angular-annotations',
      language: 'angular',
      label: 'annotations',
      source:
        '<figure\n  slChart\n  title="Receita contra a meta"\n  [annotations]="annotations"\n  [data]="monthly"\n  [series]="revenue"\n></figure>',
    }),
  },
  {
    id: 'legend',
    title: 'A legend that toggles',
    note: 'Click a series to hide it, Shift+click to show it alone; arrows move along the legend. The legend holds one line: narrower than its items, the ones that do not fit wait behind +N.',
    snippet: defineSnippet({
      id: 'chart-angular-legend',
      language: 'angular',
      label: 'Legend state, two-way',
      source:
        '<figure\n  slChart\n  title="Acquisition channels"\n  [data]="sessions"\n  [series]="channels"\n  [(hidden)]="hidden"\n></figure>',
    }),
  },
  {
    id: 'legend-values',
    title: 'Values in the legend',
    note: 'Each legend item carries its series’ value at the active point, and the last value when nothing is active — a readout that never covers the drawing.',
    snippet: defineSnippet({
      id: 'chart-angular-legend-values',
      language: 'angular',
      label: 'legendValues',
      source:
        '<figure\n  slChart\n  legendValues\n  title="Acquisition channels"\n  [data]="sessions"\n  [series]="channels"\n></figure>',
    }),
  },
  {
    id: 'tooltip-modes',
    title: 'Three ways to read a point',
    note: 'trigger="axis" lists every series at the category, sorted here by value; "item" shows only the one under the pointer; "none" leaves the reading to the legend values.',
    snippet: defineSnippet({
      id: 'chart-angular-tooltip-modes',
      language: 'angular',
      label: 'trigger and tooltip',
      source:
        '<figure\n  slChart\n  trigger="axis"\n  [tooltip]="{ sort: \'desc\' }"\n  [data]="sessions"\n  [series]="channels"\n></figure>\n<figure slChart trigger="item" [data]="sessions" [series]="channels"></figure>\n<figure slChart legendValues trigger="none" [data]="sessions" [series]="channels"></figure>',
    }),
  },
  {
    id: 'tooltip-custom',
    title: 'A tooltip of your own',
    note: 'A slChartTooltip template replaces the content and keeps the box, the placement and the dock: this one says the change against the previous month in the tone of its sign.',
    snippet: defineSnippet({
      id: 'chart-angular-tooltip-custom',
      language: 'angular',
      label: 'slChartTooltip',
      source:
        '<figure slChart title="Receita mensal" [data]="monthly" [series]="revenue">\n  <ng-template slChartTooltip let-context let-model="model">\n    <div data-part="tooltip-title">{{ context.title }}</div>\n    <div data-part="tooltip-item">{{ change(context, model) }}</div>\n  </ng-template>\n</figure>',
    }),
  },
  {
    id: 'selection',
    title: 'Choosing a point',
    note: 'selectable makes a click or Enter pin a point; the others dim, and the selection is a value the page can use to filter the table below it.',
    snippet: defineSnippet({
      id: 'chart-angular-selection',
      language: 'angular',
      label: 'selection, two-way',
      source:
        '<figure\n  slChart\n  selectable\n  title="Receita mensal"\n  [data]="monthly"\n  [series]="revenue"\n  [(selection)]="selected"\n></figure>',
    }),
  },
  {
    id: 'zoom',
    title: 'Zooming a long range',
    note: 'Drag across the plot, wheel with Ctrl, or press + and − with the plot focused; 0 or the reset control gives the whole range back.',
    snippet: defineSnippet({
      id: 'chart-angular-zoom',
      language: 'angular',
      label: 'zoomable',
      source:
        '<figure\n  slChart\n  zoomable\n  title="Daily sessions"\n  [data]="daily"\n  [series]="sessions"\n  [(zoom)]="zoom"\n></figure>',
    }),
  },
  {
    id: 'sync',
    title: 'Charts that move together',
    note: 'Two charts share one active point through the two-way value: the pointer on either draws the crosshair on both.',
    snippet: defineSnippet({
      id: 'chart-angular-sync',
      language: 'angular',
      label: 'One activePoint, two charts',
      source:
        '<figure\n  slChart\n  title="Revenue"\n  [data]="monthly"\n  [series]="revenue"\n  [(activePoint)]="point"\n></figure>\n<figure slChart title="Orders" [data]="monthly" [series]="orders" [(activePoint)]="point"></figure>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three heights',
    note: 'sm is 192 pixels of plot for a dashboard tile, md 256 for a page section, lg 384 for the chart a page is about. The width is always the container’s.',
    snippet: defineSnippet({
      id: 'chart-angular-sizes',
      language: 'angular',
      label: 'size',
      source:
        '<figure slChart size="sm" [data]="monthly" [series]="revenue"></figure>\n<figure slChart size="md" [data]="monthly" [series]="revenue"></figure>\n<figure slChart size="lg" [data]="monthly" [series]="revenue"></figure>',
    }),
  },
  {
    id: 'many-series',
    title: 'More series than slots',
    note: 'Eleven channels over eight color slots: the first eight take the palette, the rest take the overflow neutral, and the legend says which is which.',
    snippet: defineSnippet({
      id: 'chart-angular-many-series',
      language: 'angular',
      label: 'Beyond eight',
      source:
        '<figure\n  slChart\n  legendOverflow="wrap"\n  title="Onze canais"\n  [data]="sessions"\n  [series]="eleven"\n></figure>',
    }),
  },
  {
    id: 'large-data',
    title: 'Twelve thousand samples',
    note: 'Latency sampled every second: the renderer switches to canvas, the line is downsampled for the screen, and the table still holds every value.',
    snippet: defineSnippet({
      id: 'chart-angular-large-data',
      language: 'angular',
      label: 'renderer and sampling',
      source:
        '<figure\n  slChart\n  renderer="auto"\n  sampling="auto"\n  zoomable\n  [data]="latency"\n  [series]="series"\n></figure>',
    }),
  },
  {
    id: 'gaps',
    title: 'Missing values stay missing',
    note: 'A null breaks the line on the left; connectNulls bridges it on the right, for a series where the gap is a sampling artifact rather than a fact.',
    snippet: defineSnippet({
      id: 'chart-angular-gaps',
      language: 'angular',
      label: 'connectNulls',
      source:
        '<figure slChart title="Lacunas" [data]="withGaps" [series]="broken"></figure>\n<figure slChart title="Lacunas ligadas" [data]="withGaps" [series]="connected"></figure>',
    }),
  },
  {
    id: 'negative',
    title: 'Values below zero',
    note: 'Monthly result with its exchange component: a stack splits by sign, so losses hang from the baseline and gains grow from it.',
    snippet: defineSnippet({
      id: 'chart-angular-negative',
      language: 'angular',
      label: 'A stack that crosses zero',
      source:
        '<figure slChart title="Resultado mensal" [data]="result" [series]="operatingAndFx"></figure>',
    }),
  },
  {
    id: 'long-labels',
    title: 'Content the family did not choose',
    note: 'A title of fifteen words, category names of seven, a series named with markup: the title wraps, names on the axis and in the legend truncate with the whole name kept, and markup is text, never HTML.',
    snippet: defineSnippet({
      id: 'chart-angular-long-labels',
      language: 'angular',
      label: 'Strings are text',
      source: '<figure slChart [title]="longTitle" [data]="segments" [series]="series"></figure>',
    }),
  },
  {
    id: 'texture',
    title: 'Texture as a second channel',
    note: 'texture adds a pattern per slot, so a series is told apart in print, in grayscale or by a reader who does not see the difference between two hues.',
    snippet: defineSnippet({
      id: 'chart-angular-texture',
      language: 'angular',
      label: 'texture',
      source:
        '<figure slChart texture title="Orders by channel" [data]="orders" [series]="channels"></figure>',
    }),
  },
  {
    id: 'loading',
    title: 'Waiting, in the shape of what is coming',
    note: 'The skeleton is the kind being loaded — bars, a line, a ring — over axis lines, in the plot’s own box, with one line of legend: nothing moves when the data arrives.',
    snippet: defineSnippet({
      id: 'chart-angular-loading',
      language: 'angular',
      label: 'loading',
      source:
        '<figure\n  slChart\n  title="Orders by channel"\n  [data]="orders()"\n  [loading]="pending()"\n  [series]="channels"\n></figure>',
    }),
  },
  {
    id: 'empty',
    title: 'Nothing to show',
    note: 'An empty series renders a message in the same box the drawing would take, never a blank plot and never an axis with nothing on it.',
    snippet: defineSnippet({
      id: 'chart-angular-empty',
      language: 'angular',
      label: 'Empty data',
      source: '<figure slChart title="Reembolsos" [data]="[]" [series]="refunds"></figure>',
    }),
  },
  {
    id: 'all-hidden',
    title: 'Every series hidden',
    note: 'Hiding the last series is allowed and says so, with “Show all” to undo it; the legend stays, so each series can come back one by one.',
    snippet: defineSnippet({
      id: 'chart-angular-all-hidden',
      language: 'angular',
      label: 'hidden',
      source:
        '<figure\n  slChart\n  title="Canais"\n  [data]="sessions"\n  [series]="channels"\n  [hidden]="[\'c0\', \'c1\', \'c2\']"\n></figure>',
    }),
  },
  {
    id: 'error',
    title: 'The data did not arrive',
    note: 'error replaces the drawing with a message and the action that asks again; the header and the box stay where they were.',
    snippet: defineSnippet({
      id: 'chart-angular-error',
      language: 'angular',
      label: 'error and retry',
      source:
        '<figure\n  slChart\n  title="Conversion"\n  [data]="monthly"\n  [error]="failed()"\n  [series]="conversion"\n  (retry)="reload()"\n></figure>',
    }),
  },
  {
    id: 'dashboard',
    title: 'A row of tiles',
    note: 'Four cards in one row: with and without a description, loading, a donut, eight series. Every tile is one height and every plot starts on one line.',
    snippet: defineSnippet({
      id: 'chart-angular-dashboard',
      language: 'angular',
      label: 'variant="card" in a grid',
      source:
        '<div slGrid [columns]="4" [gap]="4">\n  <figure\n    slChart\n    size="sm"\n    variant="card"\n    title="Revenue"\n    [data]="monthly"\n    [series]="revenue"\n  ></figure>\n  <figure slChart loading size="sm" variant="card" title="Orders" [series]="channels"></figure>\n</div>',
    }),
  },
  {
    id: 'card',
    title: 'On the page, or as a card',
    note: 'plain sits on the page’s own surface for a report; card draws its own surface, border and padding, and fills the grid cell it is given. Inside a section whose heading already names the chart, leave title out and write aria-label: it names the plot.',
    snippet: defineSnippet({
      id: 'chart-angular-card',
      language: 'angular',
      label: 'variant',
      source:
        '<figure slChart variant="plain" [data]="monthly" [series]="revenue"></figure>\n<figure slChart variant="card" [data]="monthly" [series]="revenue"></figure>\n\n<section slSection>\n  <div slSectionHeader>\n    <div slSectionTitle><h2 slSectionHeading>Revenue</h2></div>\n  </div>\n  <div slSectionBody>\n    <figure\n      slChart\n      aria-label="Revenue, last 12 months"\n      [data]="monthly"\n      [series]="revenue"\n    ></figure>\n  </div>\n</section>',
    }),
  },
  {
    id: 'toolbar',
    title: 'The controls, and when to show them',
    note: 'visible keeps the toolbar in view; hover shows it on pointer or focus inside the chart; below 480 pixels only the menu remains and holds the rest.',
    snippet: defineSnippet({
      id: 'chart-angular-toolbar',
      language: 'angular',
      label: 'toolbar',
      source:
        '<figure slChart toolbar="visible" zoomable [data]="daily" [series]="sessions"></figure>\n<figure slChart toolbar="hover" [data]="daily" [series]="sessions"></figure>\n<figure slChart toolbar="none" [data]="daily" [series]="sessions"></figure>',
    }),
  },
  {
    id: 'fullscreen',
    title: 'The whole screen',
    note: 'The full-screen control takes the viewport; Escape or the same control gives the tile its place back. Bound two-way, the page can open it from its own button.',
    snippet: defineSnippet({
      id: 'chart-angular-fullscreen',
      language: 'angular',
      label: 'fullscreen, two-way',
      source:
        '<figure slChart title="Receita" [data]="monthly" [series]="revenue" [(fullscreen)]="presenting">\n  <button slChartActions type="button" (click)="presenting.set(true)">Apresentar</button>\n</figure>',
    }),
  },
  {
    id: 'palette',
    title: 'Color from the design system',
    note: 'categorical tells series apart, sequential orders them by one hue for ranked data, focus draws the first series in color and the rest in neutral. slot and tone pin a series to a color.',
    snippet: defineSnippet({
      id: 'chart-angular-palette',
      language: 'angular',
      label: 'palette',
      source:
        '<figure slChart palette="categorical" [data]="sessions" [series]="channels"></figure>\n<figure slChart palette="sequential" [data]="regions" [series]="ranking"></figure>\n<figure slChart palette="focus" [data]="sessions" [series]="channels"></figure>',
    }),
  },
  {
    id: 'help',
    title: 'A note behind the title',
    note: 'help puts an information control beside the title; its note opens on click or Enter, anchored to it, and closes on Escape or outside.',
    snippet: defineSnippet({
      id: 'chart-angular-help',
      language: 'angular',
      label: 'help',
      source:
        '<figure\n  slChart\n  help="Revenue recognized in the month, excluding taxes."\n  title="Revenue"\n  [data]="monthly"\n  [series]="revenue"\n></figure>',
    }),
  },
  {
    id: 'table',
    title: 'The same data as a table',
    note: 'The table view opens inside the plot’s box so a card keeps its height; CSV and image downloads sit in the menu, and slChartActions projects the consumer’s own controls.',
    snippet: defineSnippet({
      id: 'chart-angular-table',
      language: 'angular',
      label: 'tableOpen and slChartActions',
      source:
        '<figure slChart title="Receita e custo" [data]="monthly" [series]="series" [(tableOpen)]="asTable">\n  <button slChartActions type="button">12 meses</button>\n</figure>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The plot is one tab stop named by the title and described by a generated summary; arrows walk the points, and the live region says the last one reached, not each one passed.',
    snippet: defineSnippet({
      id: 'chart-angular-accessibility',
      language: 'ts',
      label: 'The language, set once',
      source: "provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } });",
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'hiddenChange, hiddenChangeRequest',
    payload: 'readonly string[], ChangeRequest<readonly string[]>',
    when: 'The request before a series is hidden or shown from the legend, from “Show all”, or isolated with Shift; the model change after it commits. Reasons: pointer, keyboard, programmatic. cancel() refuses it.',
  },
  {
    name: 'activePointChange, activePointChangeRequest',
    payload: 'ChartPoint | null, ChangeRequest<ChartPoint | null>',
    when: 'When the pointer or the arrows reach a point, and when it leaves: pointer, keyboard, blur, escape. The value two charts share to move together.',
  },
  {
    name: 'selectionChange, selectionChangeRequest',
    payload: 'ChartPoint | null, ChangeRequest<ChartPoint | null>',
    when: 'With selectable, on a click or Enter on a point, and on Escape: pointer, keyboard, escape, programmatic.',
  },
  {
    name: 'zoomChange, zoomChangeRequest',
    payload: 'ChartZoom, ChangeRequest<ChartZoom>',
    when: 'With zoomable, on a drag, a wheel with Ctrl, + or −, 0 or the reset control: pointer, keyboard, clear, escape, programmatic.',
  },
  {
    name: 'tableOpenChange, tableOpenChangeRequest',
    payload: 'boolean, ChangeRequest<boolean>',
    when: 'Before the plot switches between the drawing and the table: pointer, keyboard, escape, programmatic.',
  },
  {
    name: 'fullscreenChange, fullscreenChangeRequest',
    payload: 'boolean, ChangeRequest<boolean>',
    when: 'Before the chart takes or gives back the screen, and when the browser leaves full screen on its own: pointer, keyboard, escape, programmatic.',
  },
  {
    name: 'retry',
    payload: 'void',
    when: 'On the retry action of the error state.',
  },
];

export const ANGULAR_CHART_DOCS = {
  chart: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'data',
        'readonly ChartRecord[]',
        '[]',
        'slChart',
        'One record per category or per point. Fields are named by x and by each series',
      ],
      [
        'series',
        'readonly ChartSeries[]',
        '[]',
        'slChart',
        'What is drawn: kind, field, label, and how. Order is legend order and color order',
      ],
      [
        'x',
        'ChartXAxis',
        '—',
        'slChart',
        'The category field, and its type (category, time, value), label, format and extent',
      ],
      [
        'y',
        'ChartYAxis | [ChartYAxis, ChartYAxis]',
        '—',
        'slChart',
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
        'slChart',
        'Which way categories run. Horizontal bars for a ranking with long names',
      ],
      [
        'stackMode',
        "'normal' | 'percent'",
        'normal',
        'slChart',
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
        'slChart',
        'Lines and bands on either axis, labelled, in a tone. On the category axis a value names a category by its key or its x value; one that names none is not drawn',
      ],
      [
        'recordKey',
        'string',
        '—',
        'slChart',
        'The field that names a record when x is a value axis, for points and selection',
      ],
      [
        'locale',
        'string',
        '—',
        'slChart',
        'BCP 47, for every number and date; the language in force when absent',
      ],
      [
        'title',
        'string',
        '—',
        'slChart',
        'The caption, and the plot’s accessible name. Taken from the native title attribute, which the figure does not keep. Without title, the plot is named by the aria-label written on the figure; use it when a surrounding heading already names the chart',
      ],
      ['description', 'string', '—', 'slChart', 'One line under the title'],
      ['help', 'string', '—', 'slChart', 'A note behind an information control beside the title'],
      [
        'messages',
        'Partial<ChartMessages>',
        '—',
        'slChart',
        'Words laid over the language in force, key by key: every word the chart writes or says, with {slots}',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'slChart', 'The plot height: 192, 256 or 384 pixels'],
      [
        'variant',
        "'plain' | 'card'",
        'plain',
        'slChart',
        'On the page’s surface, or on its own card that fills its grid cell',
      ],
      [
        'palette',
        "'categorical' | 'sequential' | 'focus'",
        'categorical',
        'slChart',
        'Which ramp the eight slots take',
      ],
      [
        'toolbar',
        "'visible' | 'hover' | 'none'",
        'visible',
        'slChart',
        'When the toolbar shows: always, on hover or focus within, or never',
      ],
      [
        'grid',
        "'horizontal' | 'vertical' | 'both' | 'none'",
        'horizontal',
        'slChart',
        'Which grid lines are drawn',
      ],
      [
        'texture',
        'boolean',
        'false',
        'slChart',
        'A pattern per slot, as a second channel beside color',
      ],
      [
        'renderer',
        "'auto' | 'svg' | 'canvas'",
        'auto',
        'slChart',
        'SVG, or canvas past a few thousand points',
      ],
      [
        'sampling',
        "'auto' | 'none'",
        'auto',
        'slChart',
        'Downsamples a long line for the screen; the table keeps every value',
      ],
      ['animate', 'boolean', 'true', 'slChart', 'Transitions; off under reduced motion regardless'],
      ['legend', 'boolean', 'true', 'slChart', 'Whether the legend is drawn'],
      [
        'legendInteractive',
        'boolean',
        'true',
        'slChart',
        'Legend items as toggles, or as a static key',
      ],
      [
        'legendValues',
        'boolean',
        'false',
        'slChart',
        'Each item’s value at the active point, or its last',
      ],
      [
        'legendOverflow',
        "'collapse' | 'wrap'",
        'collapse',
        'slChart',
        'One line and +N, or as many lines as it takes',
      ],
      [
        'trigger',
        "'axis' | 'item' | 'none'",
        'axis',
        'slChart',
        'What the tooltip reads: the category, the point, or nothing. item for pie and scatter',
      ],
      [
        'tooltip',
        'ChartTooltipSettings',
        '—',
        'slChart',
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
      ['zoomable', 'boolean', 'false', 'slChart', 'Drag, Ctrl+wheel and + − 0 zoom the x axis'],
      ['selectable', 'boolean', 'false', 'slChart', 'A click or Enter selects a point'],
      [
        'loading',
        'boolean',
        'false',
        'slChart',
        'The skeleton of the kind being loaded, in the plot’s box',
      ],
      ['error', 'boolean', 'false', 'slChart', 'The data did not arrive'],
      [
        'hidden',
        'model<readonly string[]>',
        '[]',
        'slChart',
        'The series ids the legend hides; bind [(hidden)] to own it',
      ],
      [
        'activePoint',
        'model<ChartPoint | null>',
        'null',
        'slChart',
        'The point being read; bind [(activePoint)] to share it between charts',
      ],
      ['selection', 'model<ChartPoint | null>', 'null', 'slChart', 'The selected point'],
      [
        'zoom',
        'model<ChartZoom>',
        '{ start: 0, end: 1 }',
        'slChart',
        'The visible fraction of the x domain',
      ],
      ['tableOpen', 'model<boolean>', 'false', 'slChart', 'Whether the plot shows the table'],
      ['fullscreen', 'model<boolean>', 'false', 'slChart', 'Whether the chart has the screen'],
    ]),
    composition: apiRows([
      [
        'slChartTooltip',
        'ng-template, let-context let-model="model"',
        '—',
        'slChart',
        'The tooltip’s content; the box, placement and dock stay',
      ],
      [
        'slChartLegendItem',
        'ng-template, let-entry let-value="value" let-current="current"',
        '—',
        'slChart',
        'One legend item’s content; the toggle and its wiring stay',
      ],
      ['slChartCenter', 'ng-template, let-model', '—', 'slChart', 'The middle of a donut'],
      [
        'slChartEmpty',
        "ng-template, let-reason ('no-data' | 'all-hidden')",
        '—',
        'slChart',
        'The empty state',
      ],
      ['slChartError', 'ng-template', '—', 'slChart', 'The error state'],
      [
        'slChartActions',
        'content projection',
        '—',
        'slChart',
        'The consumer’s own controls, before the toolbar',
      ],
      [
        'extendOption',
        '(option) => option',
        '—',
        'slChart',
        'The engine’s option before it is drawn: the escape hatch for what the contract does not say',
      ],
      [
        '#chart="slChart"',
        'SlChart',
        '—',
        'Template',
        'focus(), resetZoom(), toDataURL() and toCsv()',
      ],
      [
        'provideChartDefaults',
        'ChartDefaults',
        '—',
        'Application',
        'size, variant, palette, toolbar, renderer, grid, legendOverflow, tooltip and animate, once; an input still wins',
      ],
      [
        'CHART_ENGINE',
        'InjectionToken',
        'mountChartEngine',
        'Application',
        'The engine the chart mounts; a test provides a recording one',
      ],
      [
        'preloadChartEngine',
        '(kinds?: ChartKind[]) => Promise<void>',
        '—',
        'Application',
        'Fetches the engine chunks ahead of the first chart, in a route resolver',
      ],
    ]),
    accessibility: [
      'The figure is named by its caption, and the plot is one tab stop with role="group", aria-roledescription="chart", the title as its name and a generated summary as its description: kind, series, points, and the range, minimum and maximum of each series.',
      'Inside the plot the keyboard follows an adaptation of the APG Grid pattern: Left and Right move along the categories, Up and Down between series, Home and End to the ends, Page keys by a tenth; Enter selects, + − and 0 zoom, Escape clears. The tooltip is aria-hidden, and a polite live region says the point reached — only the last one, so holding an arrow does not queue twelve sentences.',
      'The legend is a toolbar of toggle buttons with a roving tab stop: aria-pressed says whether a series is drawn, Enter hides it, Shift+Enter shows it alone, and the live region confirms the change.',
      'Every chart has a table view with the same numbers in their formats, reachable from the toolbar or the menu; it is the complete reading for anyone the drawing does not serve.',
      'Color is never the only channel: series differ in stroke and marker shape, texture adds a pattern per slot, and under forced colors the drawing is redrawn in system colors with the legend markers kept by mask.',
      'The eight slots of the data scale keep adjacent colors apart under simulated protanopia and deuteranopia in every scheme, and each clears 3:1 against the surface.',
    ],
    snippets: [
      defineSnippet({
        id: 'chart-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<figure data-ui="chart" data-part="root" data-size="md" data-variant="card">\n  <figcaption data-part="header">\n    <div data-part="title">Receita</div>\n    <div data-part="toolbar" role="toolbar"></div>\n  </figcaption>\n  <div data-part="legend" role="toolbar"></div>\n  <div data-part="plot" role="group" aria-roledescription="chart" tabindex="0">\n    <div data-part="canvas" aria-hidden="true"></div>\n    <div data-part="tooltip" aria-hidden="true"></div>\n  </div>\n  <div data-part="summary"></div>\n</figure>',
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
