import { signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlGrid } from '@slotted/angular/grid';
import type {
  ChartModel,
  ChartPoint,
  ChartRecord,
  ChartSeries,
  ChartTooltipContext,
} from '@slotted/core/chart';
import { categoryIndex } from '@slotted/core/chart';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlChart } from './chart';
import type { ChartPalette, ChartSize, ChartToolbar, ChartVariant } from './chart-defaults';
import { SlChartCenter, SlChartTooltip } from './chart-templates';
import { ANGULAR_CHART_DOCS, ANGULAR_CHART_TOKENS } from './chart.docs';

interface ChartStoryArgs {
  kind: 'line' | 'area' | 'bar';
  size: ChartSize;
  variant: ChartVariant;
  palette: ChartPalette;
  toolbar: ChartToolbar;
  trigger: 'axis' | 'item' | 'none';
  legendValues: boolean;
  zoomable: boolean;
  texture: boolean;
  loading: boolean;
  error: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CHART_DOCS.chart.scenes, {
    playground: Playground,
    line: Line,
    area: Area,
    bar: Bar,
    'bar-horizontal': BarHorizontal,
    stacked: Stacked,
    'stacked-percent': StackedPercent,
    combo: Combo,
    'dual-axis': DualAxis,
    'time-axis': TimeAxis,
    'log-scale': LogScale,
    pie: Pie,
    donut: Donut,
    scatter: Scatter,
    bubble: Bubble,
    annotations: Annotations,
    legend: Legend,
    'legend-values': LegendValues,
    'tooltip-modes': TooltipModes,
    'tooltip-custom': TooltipCustom,
    selection: Selection,
    zoom: Zoom,
    sync: Sync,
    sizes: Sizes,
    'many-series': ManySeries,
    'large-data': LargeData,
    gaps: Gaps,
    negative: Negative,
    'long-labels': LongLabels,
    texture: Texture,
    loading: Loading,
    empty: Empty,
    'all-hidden': AllHidden,
    error: ErrorState,
    dashboard: Dashboard,
    card: Card,
    toolbar: Toolbar,
    fullscreen: Fullscreen,
    palette: Palette,
    help: Help,
    table: TableView,
    accessibility: Accessibility,
  });

/* ── Nexora Commerce, 2026: one product, every scene ─────────────────── */

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const REVENUE = [42, 48, 45, 53, 61, 58, 66, 72, 69, 78, 84, 91];
const COST = [30, 32, 35, 34, 38, 41, 40, 44, 47, 46, 50, 53];
const TARGET = [40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84];
const brlThousands = (value: number, locale: string | undefined) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value * 1000);

const MONTHLY: ChartRecord[] = MONTHS.map((month, index) => ({
  month,
  revenue: REVENUE[index],
  cost: COST[index],
  target: TARGET[index],
  margin: (REVENUE[index]! - COST[index]!) / REVENUE[index]!,
  orders: Math.round(REVENUE[index]! * 11.5),
}));

const CHANNELS = [
  'Organic',
  'Paid',
  'Referral',
  'Email',
  'Social',
  'Parcerias',
  'Eventos',
  'Direto',
];
function channels(
  count: number,
  seed: number,
  kind: ChartSeries['kind'] = 'line',
  labels = CHANNELS,
) {
  const next = random(seed);
  return {
    data: MONTHS.map((month) => {
      const record: Record<string, unknown> = { month };
      labels.slice(0, count).forEach((_, index) => {
        record[`c${index}`] = Math.round(12 + index * 3 + next() * 18);
      });
      return record;
    }),
    series: labels
      .slice(0, count)
      .map((label, index) => ({ kind, field: `c${index}`, label }) satisfies ChartSeries),
  };
}

function days(from: number, count: number, seed: number) {
  const next = random(seed);
  let value = 120;
  return Array.from({ length: count }, (_, index) => {
    value = Math.max(20, value + (next() - 0.45) * 22);
    return {
      day: new Date(Date.UTC(2026, 2, from + index)).toISOString().slice(0, 10),
      sessions: Math.round(value),
      conversions: Math.round(value * (0.06 + next() * 0.03)),
    };
  });
}

const CHANNELS_4 = channels(4, 7, 'bar');
const CHANNELS_4_LINES = channels(4, 13);
const CHANNELS_3_LINES = channels(3, 13);
const SESSIONS_3 = channels(3, 5);
const WITH_GAPS = MONTHLY.map((row, index) => ({
  ...row,
  revenue: [3, 4, 8].includes(index) ? null : row['revenue'],
}));
const MARKUP = '<img src=x onerror="alert(1)">';
const TICKETS = [
  { status: 'Abertos', n: 128 },
  { status: 'Em andamento', n: 86 },
  { status: 'Aguardando', n: 41 },
  { status: 'Resolvidos', n: 312 },
];

/**
 * A point by category and series, the same object for the same pair: a
 * template that called a function returning a fresh literal on each check
 * would fail the development-mode check that nothing changed.
 */
const POINTS = new Map<string, ChartPoint>();
function point(key: string, series: string): ChartPoint {
  const id = `${series}\u0000${key}`;
  let found = POINTS.get(id);
  if (!found) POINTS.set(id, (found = { series, key }));
  return found;
}

/** Every value a scene binds, named once so the templates read as a consumer would write them. */
const DATA = {
  monthly: MONTHLY,
  monthlyHalf: MONTHLY.slice(0, 6),
  month: { field: 'month' },
  monthLabelled: { field: 'month', label: 'Month' },
  brl: { format: brlThousands },
  revenue: [{ kind: 'area', field: 'revenue', label: 'Revenue' }],
  revenueBars: [{ kind: 'bar', field: 'revenue', label: 'Revenue' }],
  revenueLine: [{ kind: 'line', field: 'revenue', label: 'Revenue' }],
  orders: [{ kind: 'bar', field: 'orders', label: 'Orders', slot: 3 }],
  revenueAndTarget: [
    { kind: 'area', field: 'revenue', label: 'Revenue' },
    { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral', stroke: 'dashed' },
  ],
  lines: [
    { kind: 'line', field: 'revenue', label: 'Receita', markers: 'last' },
    { kind: 'line', field: 'cost', label: 'Custo', markers: 'last' },
    { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral', stroke: 'dashed' },
  ],
  revenueAndCostLines: [
    { kind: 'line', field: 'revenue', label: 'Receita' },
    { kind: 'line', field: 'cost', label: 'Custo' },
  ],
  revenueAndCostBars: [
    { kind: 'bar', field: 'revenue', label: 'Receita' },
    { kind: 'bar', field: 'cost', label: 'Custo' },
  ],
  pinned: [
    { kind: 'line', field: 'revenue', label: 'Receita', tone: 'success' },
    { kind: 'line', field: 'cost', label: 'Custo', slot: 5 },
    { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral', stroke: 'dashed' },
  ],
  sessions3: SESSIONS_3.data,
  stackedAreas3: SESSIONS_3.series.map((series) => ({
    ...series,
    kind: 'area',
    stack: 'canal',
    curve: 'monotone',
  })),
  channels4: CHANNELS_4,
  channels4Half: CHANNELS_4.data.slice(0, 6),
  channels4Three: CHANNELS_4.series.slice(0, 3),
  stackedBars: CHANNELS_4.series.map((series) => ({ ...series, stack: 'total' })),
  stackedShares: CHANNELS_4.series.map((series) => ({ ...series, kind: 'area', stack: 'total' })),
  channels4Lines: CHANNELS_4_LINES,
  channels3Lines: CHANNELS_3_LINES,
  channels8: channels(8, 11),
  channels11: channels(11, 29, 'line', [...CHANNELS, 'Afiliados', 'Marketplace', 'Televendas']),
  channels3: channels(3, 2),
  barAndTarget: [
    { kind: 'bar', field: 'revenue', label: 'Receita' },
    {
      kind: 'line',
      field: 'target',
      label: 'Meta',
      tone: 'neutral',
      stroke: 'dashed',
      markers: 'all',
    },
  ],
  ordersAndMargin: [
    { kind: 'bar', field: 'orders', label: 'Orders' },
    {
      kind: 'line',
      field: 'margin',
      label: 'Margem',
      axis: 'end',
      markers: 'all',
      curve: 'monotone',
    },
  ],
  twoAxes: [
    { label: 'Orders', format: { maximumFractionDigits: 0 } },
    { label: 'Margin', format: { style: 'percent', maximumFractionDigits: 0 } },
  ],
  daily40: days(10, 40, 21),
  daily: days(1, 90, 5),
  day: { field: 'day', type: 'time' },
  sessionsAndConversions: [
    { kind: 'area', field: 'sessions', label: 'Sessions' },
    { kind: 'line', field: 'conversions', label: 'Conversions', axis: 'end' },
  ],
  conversionsAxis: [{}, { label: 'Conversions' }],
  sessions: [{ kind: 'line', field: 'sessions', label: 'Sessions' }],
  users: MONTHS.map((month, index) => ({ month, users: Math.round(40 * 2.1 ** index) })),
  usersSeries: [{ kind: 'line', field: 'users', label: 'Users', markers: 'all' }],
  log: { scale: 'log', format: { notation: 'compact' } },
  regions: [
    { region: 'Sudeste', value: 482 },
    { region: 'Sul', value: 214 },
    { region: 'Nordeste', value: 176 },
    { region: 'Centro-Oeste', value: 98 },
    { region: 'Norte', value: 61 },
  ],
  region: { field: 'region' },
  ranking: [{ kind: 'bar', field: 'value', label: 'Receita', labels: true }],
  pie: [{ kind: 'pie', field: 'value', label: 'Receita', labels: true }],
  regionDonut: [{ kind: 'pie', field: 'value', label: 'Receita', innerRadius: 0.6 }],
  tickets: TICKETS,
  status: { field: 'status' },
  donut: [{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.64 }],
  ring: [{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.6 }],
  work: (() => {
    const next = random(3);
    return Array.from({ length: 60 }, (_, index) => {
      const group = index % 2;
      const effort = 8 + next() * 40 + group * 10;
      return {
        id: `ticket-${index + 1}`,
        effort: Math.round(effort),
        product: group === 0 ? Math.round(effort * (1.6 + next() * 0.8)) : null,
        infra: group === 1 ? Math.round(effort * (0.9 + next() * 0.7)) : null,
        customers: Math.round(5 + next() * 95),
      };
    });
  })(),
  effort: { field: 'effort', type: 'value', label: 'Effort (h)' },
  impact: { label: 'Impact' },
  groups: [
    { kind: 'scatter', field: 'product', label: 'Produto' },
    { kind: 'scatter', field: 'infra', label: 'Infraestrutura' },
  ],
  bubbles: [
    { kind: 'scatter', field: 'product', label: 'Produto', sizeField: 'customers' },
    { kind: 'scatter', field: 'infra', label: 'Infraestrutura', sizeField: 'customers' },
  ],
  annotations: [
    { kind: 'band', from: 55, to: 70, label: 'Tolerance', tone: 'success' },
    { kind: 'line', value: 80, label: 'Annual target', tone: 'danger' },
    { kind: 'line', axis: 'x', value: 'jun', label: 'Campaign' },
  ],
  smoothRevenue: [{ kind: 'area', field: 'revenue', label: 'Receita', curve: 'monotone' }],
  latency: (() => {
    const next = random(17);
    let value = 500;
    return Array.from({ length: 12000 }, (_, index) => {
      value += (next() - 0.5) * 12;
      return { t: index, v: Math.round(value * 10) / 10 };
    });
  })(),
  latencySeries: [{ kind: 'line', field: 'v', label: 'Latency' }],
  sample: { field: 't', type: 'value' },
  withGaps: WITH_GAPS,
  broken: [{ kind: 'line', field: 'revenue', label: 'Receita', markers: 'all' }],
  connected: [
    { kind: 'line', field: 'revenue', label: 'Receita', markers: 'all', connectNulls: true },
  ],
  result: MONTHS.map((month, index) => ({
    month,
    operating: [12, 8, -4, 6, -9, 14, 3, -2, 11, 7, -6, 15][index],
    fx: [2, -3, 1, -1, 2, -2, 4, 1, -3, 2, 1, -1][index],
  })),
  operatingAndFx: [
    { kind: 'bar', field: 'operating', label: 'Operational', stack: 'r' },
    { kind: 'bar', field: 'fx', label: 'Exchange', stack: 'r', tone: 'warning' },
  ],
  markup: MARKUP,
  segments: [
    { k: 'Assisted rollout with a dedicated manager', a: 42, b: 31 },
    { k: MARKUP, a: 28, b: 35 },
    { k: 'Self-service', a: 51, b: 44 },
    { k: 'Supercalifragilisticexpialidocious-enterprise-tier', a: 37, b: 29 },
  ],
  segmentSeries: [
    { kind: 'bar', field: 'a', label: 'Customers with legacy systems integration completed' },
    { kind: 'bar', field: 'b', label: MARKUP },
  ],
  segment: { field: 'k' },
  longTitle:
    'Onboarding funnel conversion rate by enterprise customer segment, current fiscal quarter',
  refunds: [{ kind: 'bar', field: 'refunds', label: 'Refunds' }],
  conversion: [{ kind: 'line', field: 'margin', label: 'Conversion' }],
  stackedTiles: CHANNELS_4.series.map((series) => ({ ...series, stack: 't' })),
  empty: [] as ChartRecord[],
  allHidden: ['c0', 'c1', 'c2'],
  sortDesc: { sort: 'desc' },
  resolved: (model: ChartModel) =>
    `${Math.round((312 / model.total) * 100).toLocaleString('pt-BR')}%`,
  change: (context: ChartTooltipContext, model: ChartModel) => {
    const index = categoryIndex(model, context.point.key);
    const value = context.items[0]?.value ?? 0;
    const previous = model.series[0]?.values[index - 1];
    return previous ? (value - previous) / previous : null;
  },
  percent: (change: number | null) =>
    change === null
      ? '—'
      : new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          signDisplay: 'always',
          maximumFractionDigits: 1,
        }).format(change),
  brlOf: (value: number | null) => brlThousands(value ?? 0, 'pt-BR'),
  point,
};

const family = moduleMetadata({
  imports: [SlChart, SlChartTooltip, SlChartCenter, SlGrid, SlButton],
});

const meta: Meta<ChartStoryArgs> = {
  title: 'Components/Chart',
  component: SlChart,
  decorators: [
    family,
    applicationConfig({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Chart',
        description:
          'Lines, areas, bars, pies and scatter plots drawn by ECharts inside a frame the design system owns: caption, toolbar, interactive legend, tooltip, table view, full screen, and a keyboard and screen-reader reading of every point.',
        framework: 'Angular',
        ...ANGULAR_CHART_DOCS.chart,
        tokens: ANGULAR_CHART_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ChartStoryArgs>;

/** The stage every scene stands on: a block, because the chart answers its own width. */
const stage = (body: string) =>
  `<div class="slotted-demo-stage" data-align="start" data-layout="block">${body}</div>`;
const story = (id: string, body: string, props: Record<string, unknown> = {}): Story => ({
  parameters: scenario(id),
  render: () => ({ props: { ...DATA, ...props }, template: stage(body) }),
});

const PLAYGROUND_SERIES = {
  line: [
    { kind: 'line', field: 'revenue', label: 'Receita', markers: 'last' },
    { kind: 'line', field: 'cost', label: 'Custo', markers: 'last' },
  ],
  area: [
    { kind: 'area', field: 'revenue', label: 'Receita' },
    { kind: 'area', field: 'cost', label: 'Custo' },
  ],
  bar: [
    { kind: 'bar', field: 'revenue', label: 'Receita' },
    { kind: 'bar', field: 'cost', label: 'Custo' },
  ],
};

export const Playground: Story = {
  args: {
    kind: 'line',
    size: 'md',
    variant: 'card',
    palette: 'categorical',
    toolbar: 'visible',
    trigger: 'axis',
    legendValues: false,
    zoomable: true,
    texture: false,
    loading: false,
    error: false,
  },
  argTypes: {
    kind: { control: 'select', options: ['line', 'area', 'bar'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['plain', 'card'] },
    palette: { control: 'inline-radio', options: ['categorical', 'sequential', 'focus'] },
    toolbar: { control: 'inline-radio', options: ['visible', 'hover', 'none'] },
    trigger: { control: 'inline-radio', options: ['axis', 'item', 'none'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...DATA, ...args, playground: PLAYGROUND_SERIES },
    template: stage(`
<figure
  slChart
  title="Receita e custo"
  description="Milhares de reais, 2026"
  [data]="monthly"
  [series]="playground[kind]"
  [x]="monthLabelled"
  [y]="brl"
  [size]="size"
  [variant]="variant"
  [palette]="palette"
  [toolbar]="toolbar"
  [trigger]="trigger"
  [legendValues]="legendValues"
  [zoomable]="zoomable"
  [texture]="texture"
  [loading]="loading"
  [error]="error"
></figure>`),
  }),
};

export const Line = story(
  'line',
  `<figure slChart title="Receita e custo" description="Milhares de reais, 2026"
    [data]="monthly" [series]="lines" [x]="monthLabelled" [y]="brl"
    [activePoint]="point('ago', 'revenue')"></figure>`,
);

export const Area = story(
  'area',
  `<figure slChart title="Sessions by channel" description="Stacked areas, monotone curve"
    [data]="sessions3" [series]="stackedAreas3" [x]="month"></figure>`,
);

export const Bar = story(
  'bar',
  `<figure slChart title="Orders by channel" description="First half"
    [data]="channels4Half" [series]="channels4Three" [x]="month"
    [activePoint]="point('mar', 'c1')"></figure>`,
);

export const BarHorizontal = story(
  'bar-horizontal',
  `<figure slChart orientation="horizontal" title="Revenue by region" description="Ranking, with value labels"
    [data]="regions" [series]="ranking" [x]="region" [y]="brl"></figure>`,
);

export const Stacked = story(
  'stacked',
  `<figure slChart title="Orders by channel" description="The tooltip sums the stack"
    [data]="channels4.data" [series]="stackedBars" [x]="month"
    [activePoint]="point('jun', 'c2')"></figure>`,
);

export const StackedPercent = story(
  'stacked-percent',
  `<figure slChart stackMode="percent" title="Share by channel"
    [data]="channels4.data" [series]="stackedShares" [x]="month"
    [activePoint]="point('set', 'c0')"></figure>`,
);

export const Combo = story(
  'combo',
  `<figure slChart title="Receita e meta"
    [data]="monthly" [series]="barAndTarget" [x]="month" [y]="brl"
    [activePoint]="point('mai', 'revenue')"></figure>`,
);

export const DualAxis = story(
  'dual-axis',
  `<figure slChart title="Orders and margin"
    [data]="monthly" [series]="ordersAndMargin" [x]="month" [y]="twoAxes"></figure>`,
);

export const TimeAxis = story(
  'time-axis',
  `<figure slChart title="Daily sessions" description="March 10 to April 18"
    [data]="daily40" [series]="sessionsAndConversions" [x]="day" [y]="conversionsAxis"></figure>`,
);

export const LogScale = story(
  'log-scale',
  `<figure slChart title="Active users" description="Logarithmic scale"
    [data]="users" [series]="usersSeries" [x]="month" [y]="log"></figure>`,
);

export const Pie = story(
  'pie',
  `<figure slChart title="Revenue by region"
    [data]="regions" [series]="pie" [x]="region" [y]="brl"
    [activePoint]="point('South', 'value')"></figure>`,
);

export const Donut = story(
  'donut',
  `<div slGrid [columns]="2" [gap]="4">
  <figure slChart legendValues title="Tickets by status" description="The center sums the slices; the legend shows each one" [data]="tickets" [series]="donut" [x]="status"></figure>
  <figure slChart title="Tickets by status" description="slChartCenter shows the resolution rate"
    [data]="tickets" [series]="donut" [x]="status">
    <ng-template slChartCenter let-model>
      <span data-part="center-value" data-part-center-value="">{{ resolved(model) }}</span>
      <span data-part="center-label" data-part-center-label="">resolvidos</span>
    </ng-template>
  </figure>
</div>`,
);

export const Scatter = story(
  'scatter',
  `<figure slChart recordKey="id" title="Effort and impact" description="Two groups of tickets"
    [data]="work" [series]="groups" [x]="effort" [y]="impact"></figure>`,
);

export const Bubble = story(
  'bubble',
  `<figure slChart recordKey="id" title="Effort, impact and affected customers"
    [data]="work" [series]="bubbles" [x]="effort" [y]="impact"></figure>`,
);

export const Annotations = story(
  'annotations',
  `<figure slChart title="Revenue against target" description="Target line, tolerance band and an event"
    [annotations]="annotations" [data]="monthly" [series]="smoothRevenue" [x]="month" [y]="brl"></figure>`,
);

export const Legend = story(
  'legend',
  `<figure slChart title="Acquisition channels" [description]="'Hidden: ' + (hidden().length || 'none')"
    [data]="channels8.data" [series]="channels8.series" [x]="month" [(hidden)]="hidden"></figure>`,
  { hidden: signal<readonly string[]>(['c5']) },
);

export const LegendValues = story(
  'legend-values',
  `<figure slChart legendValues title="Acquisition channels"
    description="The legend shows the value of each series at the active point"
    [data]="channels4Lines.data" [series]="channels4Lines.series" [x]="month"
    [activePoint]="point('jul', 'c0')"></figure>`,
);

export const TooltipModes = story(
  'tooltip-modes',
  `<div slGrid [columns]="3" [gap]="4">
  <figure slChart size="sm" trigger="axis" title="Por eixo" description='trigger="axis", ordenado'
    [tooltip]="sortDesc" [data]="channels3Lines.data" [series]="channels3Lines.series" [x]="month"
    [activePoint]="point('mai', 'c1')"></figure>
  <figure slChart size="sm" trigger="item" title="Por item" description='trigger="item"'
    [data]="channels3Lines.data" [series]="channels3Lines.series" [x]="month"
    [activePoint]="point('mai', 'c1')"></figure>
  <figure slChart size="sm" trigger="none" legendValues title="Sem tooltip" description='trigger="none", valores na legenda'
    [data]="channels3Lines.data" [series]="channels3Lines.series" [x]="month"
    [activePoint]="point('mai', 'c1')"></figure>
</div>`,
);

export const TooltipCustom = story(
  'tooltip-custom',
  `<figure slChart title="Monthly revenue" description="Change against the previous month, composed by the consumer"
    [data]="monthly" [series]="revenueBars" [x]="month" [y]="brl"
    [activePoint]="point('out', 'revenue')">
  <ng-template slChartTooltip let-context let-model="model">
    @let delta = change(context, model);
    <div data-part="tooltip-title" data-part-tooltip-title="">{{ context.title }} · {{ brlOf(context.items[0]?.value) }}</div>
    <div data-part="tooltip-item" data-part-tooltip-item="" data-current [attr.data-tone]="delta === null ? 'neutral' : delta >= 0 ? 'success' : 'danger'">
      <span data-part="tooltip-marker" data-part-tooltip-marker="" data-kind="line"></span>
      <span data-part="tooltip-label" data-part-tooltip-label="">against the previous month</span>
      <span data-part="tooltip-value" data-part-tooltip-value="">{{ percent(delta) }}</span>
    </div>
  </ng-template>
</figure>`,
);

export const Selection = story(
  'selection',
  `<figure slChart selectable title="Monthly revenue"
    [description]="selected() ? 'Filtering orders from ' + selected()!.key : 'Click a month to filter'"
    [data]="monthly" [series]="revenueBars" [x]="month" [y]="brl" [(selection)]="selected"></figure>`,
  { selected: signal<ChartPoint | null>({ series: 'revenue', key: 'jul' }) },
);

export const Zoom = story(
  'zoom',
  `<figure slChart zoomable title="Daily sessions" description="Drag, Ctrl+wheel, or + − 0 with the chart focused"
    [data]="daily" [series]="sessions" [x]="day" [(zoom)]="zoom"></figure>`,
  { zoom: signal({ start: 0.35, end: 0.7 }) },
);

export const Sync = story(
  'sync',
  `<div slGrid [columns]="2" [gap]="4">
  <figure slChart size="sm" title="Revenue" [data]="monthly" [series]="revenue" [x]="month" [y]="brl"
    [activePoint]="shared() && point(shared()!.key, 'revenue')" (activePointChange)="shared.set($event)"></figure>
  <figure slChart size="sm" title="Orders" [data]="monthly" [series]="orders" [x]="month"
    [activePoint]="shared() && point(shared()!.key, 'orders')" (activePointChange)="shared.set($event)"></figure>
</div>`,
  { shared: signal<ChartPoint | null>(null) },
);

export const Sizes = story(
  'sizes',
  `<figure slChart size="sm" variant="card" title='size="sm"' description="192 px de plot" [data]="monthly" [series]="revenueAndCostLines" [x]="month"></figure>
<figure slChart size="md" variant="card" title='size="md"' description="256 px de plot" [data]="monthly" [series]="revenueAndCostLines" [x]="month"></figure>
<figure slChart size="lg" variant="card" title='size="lg"' description="384 px de plot" [data]="monthly" [series]="revenueAndCostLines" [x]="month"></figure>`,
);

export const ManySeries = story(
  'many-series',
  `<figure slChart legendOverflow="wrap" title="Onze canais"
    description="Oito cores da paleta; as restantes no neutro de transbordo"
    [data]="channels11.data" [series]="channels11.series" [x]="month"></figure>`,
);

export const LargeData = story(
  'large-data',
  `<figure slChart zoomable title="Latency (ms)" description="12,000 samples, one per second"
    [data]="latency" [series]="latencySeries" [x]="sample"></figure>`,
);

export const Gaps = story(
  'gaps',
  `<div slGrid [columns]="2" [gap]="4">
  <figure slChart size="sm" title="Gaps" description="A missing value breaks the line"
    [data]="withGaps" [series]="broken" [x]="month"></figure>
  <figure slChart size="sm" title="Connected gaps" description="connectNulls connects the points"
    [data]="withGaps" [series]="connected" [x]="month"></figure>
</div>`,
);

export const Negative = story(
  'negative',
  `<figure slChart title="Resultado mensal" description="Positivos e negativos, empilhados por sinal"
    [data]="result" [series]="operatingAndFx" [x]="month" [y]="brl"
    [activePoint]="point('mai', 'operating')"></figure>`,
);

export const LongLabels = story(
  'long-labels',
  `<figure slChart [title]="longTitle" [description]="markup"
    [data]="segments" [series]="segmentSeries" [x]="segment"
    [activePoint]="point(markup, 'b')"></figure>`,
);

export const Texture = story(
  'texture',
  `<figure slChart texture title="Orders by channel" description="One pattern per series, besides color"
    [data]="channels4Half" [series]="channels4.series" [x]="month"></figure>`,
);

export const Loading = story(
  'loading',
  `<div slGrid [columns]="3" [gap]="4">
  <figure slChart loading size="sm" variant="card" title="Orders by channel" [data]="empty" [series]="channels4.series" [x]="month"></figure>
  <figure slChart loading size="sm" variant="card" title="Revenue" [data]="empty" [series]="revenueLine" [x]="month"></figure>
  <figure slChart loading size="sm" variant="card" title="Tickets by status" [data]="empty" [series]="ring" [x]="status"></figure>
</div>`,
);

export const Empty = story(
  'empty',
  `<figure slChart title="Refunds" description="Last 12 months"
    [data]="empty" [series]="refunds" [x]="month"></figure>`,
);

export const AllHidden = story(
  'all-hidden',
  `<figure slChart title="Acquisition channels"
    [data]="channels3.data" [series]="channels3.series" [x]="month" [hidden]="allHidden"></figure>`,
);

export const ErrorState: Story = {
  ...story(
    'error',
    `<figure slChart error title="Conversion"
    [description]="attempts() === 0 ? 'Last 12 months' : 'Attempts: ' + attempts()"
    [data]="monthly" [series]="conversion" [x]="month" (retry)="attempts.set(attempts() + 1)"></figure>`,
    { attempts: signal(0) },
  ),
  name: 'Error',
};

export const Dashboard = story(
  'dashboard',
  `<div slGrid [columns]="4" [gap]="4" minItemWidth="sm">
  <figure slChart size="sm" variant="card" title="Revenue" description="Last 12 months"
    help="Revenue recognized in the month, excluding taxes. Updated every day at 6 AM."
    [data]="monthly" [series]="revenueAndTarget" [x]="month" [y]="brl"></figure>
  <figure slChart loading size="sm" variant="card" title="Orders by channel" description="Last 6 months"
    [data]="empty" [series]="stackedTiles" [x]="month"></figure>
  <figure slChart size="sm" variant="card" title="Tickets by status"
    [data]="tickets" [series]="donut" [x]="status"></figure>
  <figure slChart size="sm" variant="card"
    title="Sessions by acquisition channel, compared to the same period last year"
    description="Eight channels on a single row: those that do not fit wait in the +N"
    [data]="channels8.data" [series]="channels8.series" [x]="month"></figure>
</div>`,
);

export const Card = story(
  'card',
  `<div slGrid [columns]="2" [gap]="4">
  <figure slChart size="sm" title="Plan, on the page" description='variant="plain"'
    [data]="monthly" [series]="revenue" [x]="month" [y]="brl"></figure>
  <figure slChart size="sm" variant="card" title="As a dashboard tile" description='variant="card"'
    [data]="monthly" [series]="revenue" [x]="month" [y]="brl"></figure>
</div>`,
);

export const Toolbar = story(
  'toolbar',
  `<div slGrid [columns]="3" [gap]="4" minItemWidth="sm">
  <figure slChart zoomable size="sm" variant="card" title="Daily sessions" description='toolbar="visible"'
    [data]="daily" [series]="sessions" [x]="day" [zoom]="{ start: 0.4, end: 0.8 }"></figure>
  <figure slChart toolbar="hover" size="sm" variant="card" title="Daily sessions" description='toolbar="hover"'
    [data]="daily" [series]="sessions" [x]="day"></figure>
  <figure slChart toolbar="none" size="sm" variant="card" title="Daily sessions" description='toolbar="none"'
    [data]="daily" [series]="sessions" [x]="day"></figure>
</div>
<div class="slotted-demo-measure">
  <figure slChart size="sm" variant="card" title="Daily sessions" description="Below 480 px, only the menu"
    [data]="daily" [series]="sessions" [x]="day"></figure>
</div>`,
);

export const Fullscreen = story(
  'fullscreen',
  `<figure slChart variant="card" title="Revenue" description="Escape or the same button returns the tile to its place"
    [data]="monthly" [series]="revenue" [x]="month" [y]="brl" [(fullscreen)]="presenting">
  <button slButton slChartActions size="sm" type="button" variant="ghost" (click)="presenting.set(true)">Present</button>
</figure>`,
  { presenting: signal(false) },
);

export const Palette = story(
  'palette',
  `<div slGrid [columns]="3" [gap]="4" minItemWidth="sm">
  <figure slChart size="sm" variant="card" title="Channels" description='palette="categorical"'
    [data]="channels4Lines.data" [series]="channels4Lines.series" [x]="month"></figure>
  <figure slChart palette="sequential" size="sm" variant="card" title="Revenue by region" description='palette="sequential"'
    [data]="regions" [series]="regionDonut" [x]="region" [y]="brl"></figure>
  <figure slChart palette="focus" size="sm" variant="card" title="Organic against the rest" description='palette="focus"'
    [data]="channels4Lines.data" [series]="channels4Lines.series" [x]="month"></figure>
</div>
<figure slChart size="sm" title="Revenue, cost and target" description="slot and tone pin the color of a series"
  [data]="monthly" [series]="pinned" [x]="month" [y]="brl"></figure>`,
);

export const Help = story(
  'help',
  `<figure slChart size="sm" variant="card" title="Revenue" description="Last 12 months"
    help="Revenue recognized in the month, excluding taxes. Updated every day at 6 AM."
    [data]="monthly" [series]="revenue" [x]="month" [y]="brl"></figure>`,
);

export const TableView: Story = {
  ...story(
    'table',
    `<figure slChart variant="card" title="Receita e custo" description="A tabela abre dentro do plot; CSV e imagem ficam no menu"
    [data]="monthly" [series]="revenueAndCostBars" [x]="monthLabelled" [y]="brl" [(tableOpen)]="asTable">
  <button slButton slChartActions size="sm" type="button" variant="ghost">12 meses</button>
</figure>`,
    { asTable: signal(true) },
  ),
  name: 'Table',
};

export const Accessibility = story(
  'accessibility',
  `<figure slChart title="Receita e custo" description="Tab entra no plot; setas percorrem os pontos; Escape limpa"
    [data]="monthlyHalf" [series]="revenueAndCostLines" [x]="month" [y]="brl"
    [activePoint]="point('mar', 'cost')"></figure>`,
);
