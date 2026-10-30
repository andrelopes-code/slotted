import type { ChartModel, ChartTooltipContext } from '@slotted/core/chart';
import { categoryIndex } from '@slotted/core/chart';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Grid } from '../grid';
import { Chart } from './chart';
import { SlottedProvider } from '../i18n';
import type { ChartPoint, ChartRecord, ChartSeries } from './index';
import { REACT_CHART_DOCS, REACT_CHART_TOKENS } from './chart.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CHART_DOCS.chart.scenes, {
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

const meta = {
  title: 'Components/Chart',
  component: Chart,
  args: { data: [], series: [] },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Chart',
        description:
          'Lines, areas, bars, pies and scatter plots drawn by ECharts inside a frame the design system owns: caption, toolbar, interactive legend, tooltip, table view, full screen, and a keyboard and screen-reader reading of every point.',
        framework: 'React',
        ...REACT_CHART_DOCS.chart,
        tokens: REACT_CHART_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    x: { field: 'month' },
  };
}
const CHANNELS_4 = channels(4, 7, 'bar');
const CHANNELS_8 = channels(8, 11);
const CHANNELS_11 = channels(11, 29, 'line', [
  ...CHANNELS,
  'Afiliados',
  'Marketplace',
  'Televendas',
]);

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

const REGIONS = [
  { region: 'Sudeste', value: 482 },
  { region: 'Sul', value: 214 },
  { region: 'Nordeste', value: 176 },
  { region: 'Centro-Oeste', value: 98 },
  { region: 'Norte', value: 61 },
];
const TICKETS = [
  { status: 'Abertos', n: 128 },
  { status: 'Em andamento', n: 86 },
  { status: 'Aguardando', n: 41 },
  { status: 'Resolvidos', n: 312 },
];
const WORK = (() => {
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
})();
const LATENCY = (() => {
  const next = random(17);
  let value = 500;
  return Array.from({ length: 12000 }, (_, index) => {
    value += (next() - 0.5) * 12;
    return { t: index, v: Math.round(value * 10) / 10 };
  });
})();

const REVENUE_CHART = {
  data: MONTHLY,
  series: [{ kind: 'area', field: 'revenue', label: 'Receita' }] satisfies ChartSeries[],
  x: { field: 'month' },
  y: { format: brlThousands },
};
const ORDERS_CHART = {
  data: MONTHLY,
  series: [{ kind: 'bar', field: 'orders', label: 'Orders', slot: 3 }] satisfies ChartSeries[],
  x: { field: 'month' },
};
const DAILY_CHART = {
  data: days(1, 90, 5),
  series: [{ kind: 'line', field: 'sessions', label: 'Sessions' }] as const,
  x: { field: 'day', type: 'time' } as const,
};

/** Every scene speaks the product's language, set once as an application would. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
      <div className="slotted-demo-stage" data-align="start" data-layout="block">
        {children}
      </div>
    </SlottedProvider>
  );
}

const PLAYGROUND_SERIES: Record<string, ChartSeries[]> = {
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
    data: MONTHLY,
    series: PLAYGROUND_SERIES['line']!,
    x: { field: 'month', label: 'Month' },
    y: { format: brlThousands },
    title: 'Revenue and cost',
    description: 'Milhares de reais, 2026',
    size: 'md',
    variant: 'card',
    palette: 'categorical',
    toolbar: 'visible',
    trigger: 'axis',
    legendValues: false,
    zoomable: true,
    selectable: false,
    texture: false,
    loading: false,
    error: false,
  },
  argTypes: {
    series: {
      control: 'select',
      options: Object.keys(PLAYGROUND_SERIES),
      mapping: PLAYGROUND_SERIES,
    },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Stage>
      <Chart {...args} />
    </Stage>
  ),
};

export const Line: Story = {
  parameters: scenario('line'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHLY}
        defaultActivePoint={{ series: 'revenue', key: 'ago' }}
        description="Milhares de reais, 2026"
        series={[
          { kind: 'line', field: 'revenue', label: 'Receita', markers: 'last' },
          { kind: 'line', field: 'cost', label: 'Custo', markers: 'last' },
          { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral', stroke: 'dashed' },
        ]}
        title="Revenue and cost"
        x={{ field: 'month', label: 'Month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

const SESSIONS_3 = channels(3, 5);

export const Area: Story = {
  parameters: scenario('area'),
  render: () => (
    <Stage>
      <Chart
        {...SESSIONS_3}
        description="Stacked areas, monotone curve"
        series={SESSIONS_3.series.map((series) => ({
          ...series,
          kind: 'area',
          stack: 'canal',
          curve: 'monotone',
        }))}
        title="Sessions by channel"
      />
    </Stage>
  ),
};

export const Bar: Story = {
  parameters: scenario('bar'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_4}
        data={CHANNELS_4.data.slice(0, 6)}
        defaultActivePoint={{ series: 'c1', key: 'mar' }}
        description="First half"
        series={CHANNELS_4.series.slice(0, 3)}
        title="Orders by channel"
      />
    </Stage>
  ),
};

export const BarHorizontal: Story = {
  parameters: scenario('bar-horizontal'),
  render: () => (
    <Stage>
      <Chart
        data={REGIONS}
        description="Ranking, with value labels"
        orientation="horizontal"
        series={[{ kind: 'bar', field: 'value', label: 'Revenue', labels: true }]}
        title="Revenue by region"
        x={{ field: 'region' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

export const Stacked: Story = {
  parameters: scenario('stacked'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_4}
        defaultActivePoint={{ series: 'c2', key: 'jun' }}
        description="The tooltip sums the stack"
        series={CHANNELS_4.series.map((series) => ({ ...series, stack: 'total' }))}
        title="Orders by channel"
      />
    </Stage>
  ),
};

export const StackedPercent: Story = {
  parameters: scenario('stacked-percent'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_4}
        defaultActivePoint={{ series: 'c0', key: 'set' }}
        series={CHANNELS_4.series.map((series) => ({ ...series, kind: 'area', stack: 'total' }))}
        stackMode="percent"
        title="Share by channel"
      />
    </Stage>
  ),
};

export const Combo: Story = {
  parameters: scenario('combo'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHLY}
        defaultActivePoint={{ series: 'revenue', key: 'mai' }}
        series={[
          { kind: 'bar', field: 'revenue', label: 'Receita' },
          {
            kind: 'line',
            field: 'target',
            label: 'Meta',
            tone: 'neutral',
            stroke: 'dashed',
            markers: 'all',
          },
        ]}
        title="Receita e meta"
        x={{ field: 'month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

export const DualAxis: Story = {
  parameters: scenario('dual-axis'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHLY}
        series={[
          { kind: 'bar', field: 'orders', label: 'Orders' },
          {
            kind: 'line',
            field: 'margin',
            label: 'Margem',
            axis: 'end',
            markers: 'all',
            curve: 'monotone',
          },
        ]}
        title="Orders and margin"
        x={{ field: 'month' }}
        y={[
          { label: 'Orders', format: { maximumFractionDigits: 0 } },
          { label: 'Margin', format: { style: 'percent', maximumFractionDigits: 0 } },
        ]}
      />
    </Stage>
  ),
};

export const TimeAxis: Story = {
  parameters: scenario('time-axis'),
  render: () => (
    <Stage>
      <Chart
        data={days(10, 40, 21)}
        description="March 10 to April 18"
        series={[
          { kind: 'area', field: 'sessions', label: 'Sessions' },
          { kind: 'line', field: 'conversions', label: 'Conversions', axis: 'end' },
        ]}
        title="Daily sessions"
        x={{ field: 'day', type: 'time' }}
        y={[{}, { label: 'Conversions' }]}
      />
    </Stage>
  ),
};

export const LogScale: Story = {
  parameters: scenario('log-scale'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHS.map((month, index) => ({ month, users: Math.round(40 * 2.1 ** index) }))}
        description="Logarithmic scale"
        series={[{ kind: 'line', field: 'users', label: 'Users', markers: 'all' }]}
        title="Active users"
        x={{ field: 'month' }}
        y={{ scale: 'log', format: { notation: 'compact' } }}
      />
    </Stage>
  ),
};

export const Pie: Story = {
  parameters: scenario('pie'),
  render: () => (
    <Stage>
      <Chart
        data={REGIONS}
        defaultActivePoint={{ series: 'value', key: 'South' }}
        series={[{ kind: 'pie', field: 'value', label: 'Revenue', labels: true }]}
        title="Revenue by region"
        x={{ field: 'region' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

export const Donut: Story = {
  parameters: scenario('donut'),
  render: () => (
    <Stage>
      <Grid columns={2} gap={4}>
        <Chart
          data={TICKETS}
          description="The center sums the slices; the legend shows each one"
          legendValues
          series={[{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.64 }]}
          title="Tickets por estado"
          x={{ field: 'status' }}
        />
        <Chart
          data={TICKETS}
          renderCenter={(model) => (
            <>
              <span data-part="center-value" data-part-center-value="">
                {Math.round((312 / model.total) * 100).toLocaleString('pt-BR')}%
              </span>
              <span data-part="center-label" data-part-center-label="">
                resolvidos
              </span>
            </>
          )}
          series={[{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.64 }]}
          title="Tickets by status"
          description="renderCenter shows the resolution rate"
          x={{ field: 'status' }}
        />
      </Grid>
    </Stage>
  ),
};

export const Scatter: Story = {
  parameters: scenario('scatter'),
  render: () => (
    <Stage>
      <Chart
        data={WORK}
        description="Dois grupos de tickets"
        recordKey="id"
        series={[
          { kind: 'scatter', field: 'product', label: 'Produto' },
          { kind: 'scatter', field: 'infra', label: 'Infrastructure' },
        ]}
        title="Effort and impact"
        x={{ field: 'effort', type: 'value', label: 'Effort (h)' }}
        y={{ label: 'Impact' }}
      />
    </Stage>
  ),
};

export const Bubble: Story = {
  parameters: scenario('bubble'),
  render: () => (
    <Stage>
      <Chart
        data={WORK}
        recordKey="id"
        series={[
          { kind: 'scatter', field: 'product', label: 'Produto', sizeField: 'customers' },
          { kind: 'scatter', field: 'infra', label: 'Infrastructure', sizeField: 'customers' },
        ]}
        title="Effort, impact and affected customers"
        x={{ field: 'effort', type: 'value', label: 'Effort (h)' }}
        y={{ label: 'Impact' }}
      />
    </Stage>
  ),
};

export const Annotations: Story = {
  parameters: scenario('annotations'),
  render: () => (
    <Stage>
      <Chart
        annotations={[
          { kind: 'band', from: 55, to: 70, label: 'Tolerance', tone: 'success' },
          { kind: 'line', value: 80, label: 'Annual target', tone: 'danger' },
          { kind: 'line', axis: 'x', value: 'jun', label: 'Campaign' },
        ]}
        data={MONTHLY}
        description="Target line, tolerance band and an event"
        series={[{ kind: 'area', field: 'revenue', label: 'Revenue', curve: 'monotone' }]}
        title="Revenue against target"
        x={{ field: 'month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

function ControlledLegend() {
  const [hidden, setHidden] = useState<readonly string[]>(['c5']);
  return (
    <Chart
      {...CHANNELS_8}
      description={`Hidden: ${hidden.length === 0 ? 'none' : hidden.map((id) => CHANNELS[Number(id.slice(1))]).join(', ')}`}
      hidden={hidden}
      onHiddenChange={setHidden}
      title="Acquisition channels"
    />
  );
}

export const Legend: Story = {
  parameters: scenario('legend'),
  render: () => (
    <Stage>
      <ControlledLegend />
    </Stage>
  ),
};

const CHANNELS_4_LINES = channels(4, 13);

export const LegendValues: Story = {
  parameters: scenario('legend-values'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_4_LINES}
        defaultActivePoint={{ series: 'c0', key: 'jul' }}
        description="The legend shows the value of each series at the active point"
        legendValues
        title="Acquisition channels"
      />
    </Stage>
  ),
};

const CHANNELS_3_LINES = channels(3, 13);

export const TooltipModes: Story = {
  parameters: scenario('tooltip-modes'),
  render: () => (
    <Stage>
      <Grid columns={3} gap={4}>
        <Chart
          {...CHANNELS_3_LINES}
          defaultActivePoint={{ series: 'c1', key: 'mai' }}
          description='trigger="axis", ordenado'
          size="sm"
          title="Por eixo"
          tooltip={{ sort: 'desc' }}
          trigger="axis"
        />
        <Chart
          {...CHANNELS_3_LINES}
          defaultActivePoint={{ series: 'c1', key: 'mai' }}
          description='trigger="item"'
          size="sm"
          title="Por item"
          trigger="item"
        />
        <Chart
          {...CHANNELS_3_LINES}
          defaultActivePoint={{ series: 'c1', key: 'mai' }}
          description='trigger="none", valores na legenda'
          legendValues
          size="sm"
          title="Sem tooltip"
          trigger="none"
        />
      </Grid>
    </Stage>
  ),
};

function MonthOverMonth({ context, model }: { context: ChartTooltipContext; model: ChartModel }) {
  const index = categoryIndex(model, context.point.key);
  const value = context.items[0]?.value ?? 0;
  const previous = model.series[0]?.values[index - 1];
  const change = previous ? (value - previous) / previous : null;
  return (
    <>
      <div data-part="tooltip-title" data-part-tooltip-title="">
        {context.title} · {brlThousands(value, 'pt-BR')}
      </div>
      <div
        data-current=""
        data-part="tooltip-item"
        data-part-tooltip-item=""
        data-tone={change === null ? 'neutral' : change >= 0 ? 'success' : 'danger'}
      >
        <span data-kind="line" data-part="tooltip-marker" data-part-tooltip-marker="" />
        <span data-part="tooltip-label" data-part-tooltip-label="">
          against the previous month
        </span>
        <span data-part="tooltip-value" data-part-tooltip-value="">
          {change === null
            ? '—'
            : new Intl.NumberFormat('pt-BR', {
                style: 'percent',
                signDisplay: 'always',
                maximumFractionDigits: 1,
              }).format(change)}
        </span>
      </div>
    </>
  );
}

export const TooltipCustom: Story = {
  parameters: scenario('tooltip-custom'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHLY}
        defaultActivePoint={{ series: 'revenue', key: 'out' }}
        description="Change against the previous month, composed by the consumer"
        renderTooltip={(context, model) => <MonthOverMonth context={context} model={model} />}
        series={[{ kind: 'bar', field: 'revenue', label: 'Revenue' }]}
        title="Receita mensal"
        x={{ field: 'month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

function SelectableRevenue() {
  const [selected, setSelected] = useState<ChartPoint | null>({ series: 'revenue', key: 'jul' });
  return (
    <Chart
      {...REVENUE_CHART}
      description={selected ? `Filtering orders from ${selected.key}` : 'Click a month to filter'}
      onSelectionChange={setSelected}
      selectable
      selection={selected}
      series={[{ kind: 'bar', field: 'revenue', label: 'Receita' }]}
      title="Receita mensal"
    />
  );
}

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <Stage>
      <SelectableRevenue />
    </Stage>
  ),
};

export const Zoom: Story = {
  parameters: scenario('zoom'),
  render: () => (
    <Stage>
      <Chart
        {...DAILY_CHART}
        defaultZoom={{ start: 0.35, end: 0.7 }}
        description="Drag, Ctrl+wheel, or + − 0 with the chart in focus"
        title="Daily sessions"
        zoomable
      />
    </Stage>
  ),
};

function SyncedPair() {
  const [point, setPoint] = useState<ChartPoint | null>(null);
  const both = (series: string) => (point ? { series, key: point.key } : null);
  return (
    <Grid columns={2} gap={4}>
      <Chart
        {...REVENUE_CHART}
        activePoint={both('revenue')}
        onActivePointChange={setPoint}
        size="sm"
        title="Receita"
      />
      <Chart
        {...ORDERS_CHART}
        activePoint={both('orders')}
        onActivePointChange={setPoint}
        size="sm"
        title="Orders"
      />
    </Grid>
  );
}

export const Sync: Story = {
  parameters: scenario('sync'),
  render: () => (
    <Stage>
      <SyncedPair />
    </Stage>
  ),
};

const CHANNELS_2 = channels(2, 3);

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_2}
        description="192 px de plot"
        size="sm"
        title='size="sm"'
        variant="card"
      />
      <Chart
        {...CHANNELS_2}
        description="256 px de plot"
        size="md"
        title='size="md"'
        variant="card"
      />
      <Chart
        {...CHANNELS_2}
        description="384 px de plot"
        size="lg"
        title='size="lg"'
        variant="card"
      />
    </Stage>
  ),
};

export const ManySeries: Story = {
  parameters: scenario('many-series'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_11}
        description="Oito cores da paleta; as restantes no neutro de transbordo"
        legendOverflow="wrap"
        title="Onze canais"
      />
    </Stage>
  ),
};

export const LargeData: Story = {
  parameters: scenario('large-data'),
  render: () => (
    <Stage>
      <Chart
        data={LATENCY}
        description="12,000 samples, one per second"
        series={[{ kind: 'line', field: 'v', label: 'Latency' }]}
        title="Latency (ms)"
        x={{ field: 't', type: 'value' }}
        zoomable
      />
    </Stage>
  ),
};

const WITH_GAPS: ChartRecord[] = MONTHLY.map((row, index) => ({
  ...row,
  revenue: [3, 4, 8].includes(index) ? null : row['revenue'],
}));

export const Gaps: Story = {
  parameters: scenario('gaps'),
  render: () => (
    <Stage>
      <Grid columns={2} gap={4}>
        <Chart
          data={WITH_GAPS}
          description="A missing value breaks the line"
          series={[{ kind: 'line', field: 'revenue', label: 'Revenue', markers: 'all' }]}
          size="sm"
          title="Lacunas"
          x={{ field: 'month' }}
        />
        <Chart
          data={WITH_GAPS}
          description="connectNulls liga os pontos"
          series={[
            {
              kind: 'line',
              field: 'revenue',
              label: 'Receita',
              markers: 'all',
              connectNulls: true,
            },
          ]}
          size="sm"
          title="Lacunas ligadas"
          x={{ field: 'month' }}
        />
      </Grid>
    </Stage>
  ),
};

export const Negative: Story = {
  parameters: scenario('negative'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHS.map((month, index) => ({
          month,
          operating: [12, 8, -4, 6, -9, 14, 3, -2, 11, 7, -6, 15][index],
          fx: [2, -3, 1, -1, 2, -2, 4, 1, -3, 2, 1, -1][index],
        }))}
        defaultActivePoint={{ series: 'operating', key: 'mai' }}
        description="Positivos e negativos, empilhados por sinal"
        series={[
          { kind: 'bar', field: 'operating', label: 'Operational', stack: 'r' },
          { kind: 'bar', field: 'fx', label: 'Exchange', stack: 'r', tone: 'warning' },
        ]}
        title="Monthly result"
        x={{ field: 'month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

const MARKUP = '<img src=x onerror="alert(1)">';

export const LongLabels: Story = {
  parameters: scenario('long-labels'),
  render: () => (
    <Stage>
      <Chart
        data={[
          { k: 'Assisted rollout with a dedicated manager', a: 42, b: 31 },
          { k: MARKUP, a: 28, b: 35 },
          { k: 'Self-service', a: 51, b: 44 },
          { k: 'Supercalifragilisticexpialidocious-enterprise-tier', a: 37, b: 29 },
        ]}
        defaultActivePoint={{ series: 'b', key: MARKUP }}
        description={MARKUP}
        series={[
          {
            kind: 'bar',
            field: 'a',
            label: 'Customers with legacy systems integration completed',
          },
          { kind: 'bar', field: 'b', label: MARKUP },
        ]}
        title="Onboarding funnel conversion rate by enterprise customer segment, current fiscal quarter"
        x={{ field: 'k' }}
      />
    </Stage>
  ),
};

export const Texture: Story = {
  parameters: scenario('texture'),
  render: () => (
    <Stage>
      <Chart
        {...CHANNELS_4}
        data={CHANNELS_4.data.slice(0, 6)}
        description="A pattern per series, in addition to color"
        texture
        title="Orders by channel"
      />
    </Stage>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Stage>
      <Grid columns={3} gap={4}>
        <Chart
          {...CHANNELS_4}
          data={[]}
          loading
          size="sm"
          title="Orders by channel"
          variant="card"
        />
        <Chart
          data={[]}
          loading
          series={[{ kind: 'line', field: 'revenue', label: 'Receita' }]}
          size="sm"
          title="Receita"
          variant="card"
          x={{ field: 'month' }}
        />
        <Chart
          data={[]}
          loading
          series={[{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.6 }]}
          size="sm"
          title="Tickets por estado"
          variant="card"
          x={{ field: 'status' }}
        />
      </Grid>
    </Stage>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Stage>
      <Chart
        data={[]}
        description="Last 12 months"
        series={[{ kind: 'bar', field: 'refunds', label: 'Refunds' }]}
        title="Refunds"
        x={{ field: 'month' }}
      />
    </Stage>
  ),
};

export const AllHidden: Story = {
  parameters: scenario('all-hidden'),
  render: () => (
    <Stage>
      <Chart {...channels(3, 2)} defaultHidden={['c0', 'c1', 'c2']} title="Acquisition channels" />
    </Stage>
  ),
};

function FailingChart() {
  const [attempts, setAttempts] = useState(0);
  return (
    <Chart
      {...REVENUE_CHART}
      description={attempts === 0 ? 'Last 12 months' : `Attempts: ${attempts}`}
      error
      onRetry={() => setAttempts((count) => count + 1)}
      title="Conversion"
    />
  );
}

export const ErrorState: Story = {
  name: 'Error',
  parameters: scenario('error'),
  render: () => (
    <Stage>
      <FailingChart />
    </Stage>
  ),
};

export const Dashboard: Story = {
  parameters: scenario('dashboard'),
  render: () => (
    <Stage>
      <Grid columns={4} gap={4} minItemWidth="sm">
        <Chart
          {...REVENUE_CHART}
          description="Last 12 months"
          help="Revenue recognized in the month, excluding taxes. Updated every day at 6 AM."
          series={[
            { kind: 'area', field: 'revenue', label: 'Revenue' },
            { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral', stroke: 'dashed' },
          ]}
          size="sm"
          title="Receita"
          variant="card"
        />
        <Chart
          {...CHANNELS_4}
          data={[]}
          description="Last 6 months"
          loading
          series={CHANNELS_4.series.map((series) => ({ ...series, stack: 't' }))}
          size="sm"
          title="Orders by channel"
          variant="card"
        />
        <Chart
          data={TICKETS}
          series={[{ kind: 'pie', field: 'n', label: 'Tickets', innerRadius: 0.66 }]}
          size="sm"
          title="Tickets por estado"
          variant="card"
          x={{ field: 'status' }}
        />
        <Chart
          {...CHANNELS_8}
          description="Eight channels on one row: those that do not fit wait in the +N"
          size="sm"
          title="Sessions by acquisition channel, compared to the same period last year"
          variant="card"
        />
      </Grid>
    </Stage>
  ),
};

export const Card: Story = {
  parameters: scenario('card'),
  render: () => (
    <Stage>
      <Grid columns={2} gap={4}>
        <Chart
          {...REVENUE_CHART}
          description='variant="plain"'
          size="sm"
          title="Plan, on the page"
        />
        <Chart
          {...REVENUE_CHART}
          description='variant="card"'
          size="sm"
          title="Como um tile de dashboard"
          variant="card"
        />
      </Grid>
    </Stage>
  ),
};

export const Toolbar: Story = {
  parameters: scenario('toolbar'),
  render: () => (
    <Stage>
      <Grid columns={3} gap={4} minItemWidth="sm">
        <Chart
          {...DAILY_CHART}
          defaultZoom={{ start: 0.4, end: 0.8 }}
          description='toolbar="visible"'
          size="sm"
          title="Daily sessions"
          variant="card"
          zoomable
        />
        <Chart
          {...DAILY_CHART}
          description='toolbar="hover"'
          size="sm"
          title="Daily sessions"
          toolbar="hover"
          variant="card"
        />
        <Chart
          {...DAILY_CHART}
          description='toolbar="none"'
          size="sm"
          title="Daily sessions"
          toolbar="none"
          variant="card"
        />
      </Grid>
      <div className="slotted-demo-measure">
        <Chart
          {...DAILY_CHART}
          description="Below 480 px, only the menu"
          size="sm"
          title="Daily sessions"
          variant="card"
        />
      </div>
    </Stage>
  ),
};

function ControlledFullscreen() {
  const [full, setFull] = useState(false);
  return (
    <Chart
      {...REVENUE_CHART}
      actions={
        <Button onClick={() => setFull(true)} size="sm" variant="ghost">
          Apresentar
        </Button>
      }
      description="Escape or the same button returns the tile to its place"
      fullscreen={full}
      onFullscreenChange={setFull}
      title="Receita"
      variant="card"
    />
  );
}

export const Fullscreen: Story = {
  parameters: scenario('fullscreen'),
  render: () => (
    <Stage>
      <ControlledFullscreen />
    </Stage>
  ),
};

const RANKED = {
  data: REGIONS,
  series: [{ kind: 'pie', field: 'value', label: 'Receita', innerRadius: 0.6 }] as const,
  x: { field: 'region' } as const,
  y: { format: brlThousands },
};

export const Palette: Story = {
  parameters: scenario('palette'),
  render: () => (
    <Stage>
      <Grid columns={3} gap={4} minItemWidth="sm">
        <Chart
          {...CHANNELS_4_LINES}
          description='palette="categorical"'
          size="sm"
          title="Canais"
          variant="card"
        />
        <Chart
          {...RANKED}
          description='palette="sequential"'
          palette="sequential"
          size="sm"
          title="Revenue by region"
          variant="card"
        />
        <Chart
          {...CHANNELS_4_LINES}
          description='palette="focus"'
          palette="focus"
          size="sm"
          title="Organic against the rest"
          variant="card"
        />
      </Grid>
      <Chart
        data={MONTHLY}
        description="slot and tone pin the color of a series"
        series={[
          { kind: 'line', field: 'revenue', label: 'Revenue', tone: 'success' },
          { kind: 'line', field: 'cost', label: 'Custo', slot: 5 },
          { kind: 'line', field: 'target', label: 'Meta', tone: 'neutral', stroke: 'dashed' },
        ]}
        size="sm"
        title="Receita, custo e meta"
        x={{ field: 'month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

export const Help: Story = {
  parameters: scenario('help'),
  render: () => (
    <Stage>
      <Chart
        {...REVENUE_CHART}
        description="Last 12 months"
        help="Revenue recognized in the month, excluding taxes. Updated every day at 6 AM."
        size="sm"
        title="Revenue"
        variant="card"
      />
    </Stage>
  ),
};

export const TableView: Story = {
  name: 'Table',
  parameters: scenario('table'),
  render: () => (
    <Stage>
      <Chart
        actions={
          <Button size="sm" variant="ghost">
            12 meses
          </Button>
        }
        data={MONTHLY}
        defaultTableOpen
        description="A tabela abre dentro do plot; CSV e imagem ficam no menu"
        series={[
          { kind: 'bar', field: 'revenue', label: 'Receita' },
          { kind: 'bar', field: 'cost', label: 'Custo' },
        ]}
        title="Revenue and cost"
        variant="card"
        x={{ field: 'month', label: 'Month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Stage>
      <Chart
        data={MONTHLY.slice(0, 6)}
        defaultActivePoint={{ series: 'cost', key: 'mar' }}
        description="Tab entra no plot; setas percorrem os pontos; Escape limpa"
        series={[
          { kind: 'line', field: 'revenue', label: 'Receita' },
          { kind: 'line', field: 'cost', label: 'Custo' },
        ]}
        title="Receita e custo"
        x={{ field: 'month' }}
        y={{ format: brlThousands }}
      />
    </Stage>
  ),
};
