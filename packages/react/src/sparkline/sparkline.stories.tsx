import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Grid } from '../grid';
import { SlottedProvider } from '../i18n';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '../table';
import { Sparkline } from './sparkline';
import type { SparklineSeries } from './sparkline.types';
import { REACT_SPARKLINE_DOCS, REACT_SPARKLINE_TOKENS } from './sparkline.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SPARKLINE_DOCS.sparkline.scenes, {
    playground: Playground,
    types: Types,
    sizes: Sizes,
    tone: Tone,
    series: Series,
    reference: Reference,
    gaps: Gaps,
    extremes: Extremes,
    'in-table': InTable,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Sparkline',
  component: Sparkline,
  args: { data: [] },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Sparkline',
        description:
          'A series of numbers drawn in a box beside the value it explains: a line or bars, a marker on the last point, and a description a screen reader hears in its place.',
        framework: 'React',
        ...REACT_SPARKLINE_DOCS.sparkline,
        tokens: REACT_SPARKLINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Asteron Industrial Supply, twelve weeks of operations. */
const FILL_RATE = [
  0.929, 0.934, 0.931, 0.94, 0.947, 0.945, 0.951, 0.955, 0.953, 0.958, 0.96, 0.961,
];
const ORDERS = [820, 940, 910, 1020, 1180, 1050, 1230, 1310, 1290, 1420, 1380, 1510];
const ERROR_RATE = [4.2, 3.9, 4.6, 4.1, 3.2, 2.8, 3.0, 2.4, 2.1, 1.9, 2.2, 1.6];
const LEAD_TIME = [3.1, 3.2, 3.4, 3.3, 3.6, 3.8, 3.7, 4.1, 4.2, 4.4, 4.3, 4.6];
const LAST_QUARTER = [910, 880, 960, 1010, 990, 1040, 1080, 1050, 1120, 1090, 1150, 1180];
const ON_TIME = [0.86, 0.88, 0.87, 0.9, 0.89, 0.91, 0.9, 0.91, 0.89, 0.9, 0.91, 0.91];
const NET_STOCK = [3, -2, 5, -4, 6, 1, -1, 4];
const WITH_GAPS = [10, 12, null, null, 15, 14, 16, null, 18, 19];
const EVERY_MINUTE = Array.from(
  { length: 400 },
  (_, i) => 50 + 30 * Math.sin(i / 9) + 12 * Math.sin(i / 2.3) + (i % 7),
);
const WAREHOUSES = [
  { id: 'rot', name: 'Rotterdam', shipments: [30, 12, 44, 8, 51, 22, 39, 17, 48, 11, 35, 26] },
  { id: 'ham', name: 'Hamburg', shipments: [22, 25, 21, 30, 28, 33, 31, 36, 34, 39, 37, 41] },
  { id: 'ant', name: 'Antwerp', shipments: [40, 38, 41, 35, 36, 33, 34, 30, 31, 28, 29, 26] },
  { id: 'gdn', name: 'Gdańsk', shipments: [12, 14, 13, 17, 16, 19, 22, 21, 24, 23, 27, 30] },
  { id: 'bcn', name: 'Barcelona', shipments: [18, 18, 19, 18, 20, 19, 21, 20, 22, 21, 23, 22] },
  { id: 'lis', name: 'Lisbon', shipments: [9, 11, 8, 14, 10, 16, 12, 18, 13, 21, 15, 24] },
  { id: 'mil', name: 'Milan', shipments: [27, 24, 29, 22, 31, 20, 33, 19, 35, 17, 36, 16] },
  { id: 'vie', name: 'Vienna', shipments: [15, 16, 15, 17, 16, 18, 17, 19, 18, 20, 19, 21] },
];
const LINES = [
  { name: 'Hydraulic fittings', fillRate: FILL_RATE, orders: 1510 },
  { name: 'Bearings', fillRate: ON_TIME, orders: 980 },
  {
    name: 'Pneumatic valves',
    fillRate: [0.91, 0.9, 0.92, 0.89, 0.93, 0.9, 0.94, 0.9, 0.95, 0.9, 0.96, 0.9],
    orders: 640,
  },
  {
    name: 'Safety equipment',
    fillRate: [0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97],
    orders: 412,
  },
];
const PERCENT = { style: 'percent', maximumFractionDigits: 1 } as const;

function Scene({
  children,
  label,
  layout = 'block',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

export const Playground: Story = {
  args: {
    area: true,
    curve: 'linear',
    data: FILL_RATE,
    formatOptions: PERCENT,
    label: 'Fill rate, last 12 weeks',
    marker: true,
    size: 'md',
    type: 'line',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-measure">
        <Sparkline {...args} />
      </div>
    </div>
  ),
};

export const Types: Story = {
  parameters: scenario('types'),
  render: () => (
    <Grid columns={4} gap={6}>
      <Scene
        label="line"
        note="Twelve weeks of orders, joined by straight segments; the disc marks the current week."
      >
        <Sparkline data={ORDERS} label="Orders" />
      </Scene>
      <Scene
        label="line, area"
        note="The same line with its wash, the color fading to nothing at the bottom edge."
      >
        <Sparkline area data={ORDERS} label="Orders" />
      </Scene>
      <Scene
        label='curve="monotone"'
        note="Smoothed, and still never higher or lower than a point it passes through."
      >
        <Sparkline area curve="monotone" data={ORDERS} label="Orders" />
      </Scene>
      <Scene
        label='type="bar"'
        note="One bar per week, grown from nought; the earlier weeks are dimmed and the current one is full."
      >
        <Sparkline data={ORDERS} label="Orders" type="bar" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3} gap={6}>
      <Scene
        label='size="sm"'
        note="Twenty pixels tall, a thinner stroke and a smaller disc: the step for a table row."
      >
        <Sparkline area data={ORDERS} size="sm" />
        <Sparkline data={ORDERS} size="sm" type="bar" />
      </Scene>
      <Scene label='size="md"' note="Thirty-two pixels: the step a card’s trend region takes.">
        <Sparkline area data={ORDERS} size="md" />
        <Sparkline data={ORDERS} size="md" type="bar" />
      </Scene>
      <Scene label='size="lg"' note="Forty-eight pixels, for the card that leads a page.">
        <Sparkline area data={ORDERS} size="lg" />
        <Sparkline data={ORDERS} size="lg" type="bar" />
      </Scene>
    </Grid>
  ),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => (
    <Grid columns={4} gap={6}>
      <Scene
        label="no tone"
        note="The first slot of the data scale, the accent’s own hue: a series that means nothing but itself."
      >
        <Sparkline area data={ORDERS} label="Orders" />
        <Sparkline data={ORDERS} label="Orders" type="bar" />
      </Scene>
      <Scene
        label='tone="success"'
        note="An error rate that fell: the fall is good, so the line says so."
      >
        <Sparkline area data={ERROR_RATE} label="Error rate" tone="success" />
        <Sparkline data={ERROR_RATE} label="Error rate" tone="success" type="bar" />
      </Scene>
      <Scene
        label='tone="danger"'
        note="A lead time that grew. The shape is a rise; the tone is what the rise means."
      >
        <Sparkline area data={LEAD_TIME} label="Lead time" tone="danger" />
        <Sparkline data={LEAD_TIME} label="Lead time" tone="danger" type="bar" />
      </Scene>
      <Scene
        label='tone="neutral"'
        note="The comparison series, in the step the page uses for an aside, behind a current one."
      >
        <Sparkline data={LAST_QUARTER} label="Last quarter" tone="neutral" />
        <Sparkline area data={ORDERS} label="This quarter" />
      </Scene>
    </Grid>
  ),
};

export const Series: Story = {
  parameters: scenario('series'),
  render: () => (
    <Grid columns={4} gap={6}>
      {WAREHOUSES.map((warehouse, index) => (
        <Scene
          key={warehouse.id}
          label={`series={${index + 1}} · ${warehouse.name}`}
          note="Shipments per week, in the slot its position in the list gives it. The order is fixed; a filter that removes Hamburg must not repaint Antwerp."
        >
          <Sparkline
            area
            data={warehouse.shipments}
            label={`${warehouse.name} shipments`}
            series={(index + 1) as SparklineSeries}
          />
          <Sparkline
            data={warehouse.shipments}
            label={`${warehouse.name} shipments`}
            series={(index + 1) as SparklineSeries}
            type="bar"
          />
        </Scene>
      ))}
    </Grid>
  ),
};

export const Reference: Story = {
  parameters: scenario('reference'),
  render: () => (
    <Grid columns={3} gap={6}>
      <Scene
        label="reference inside the extent"
        note="On-time delivery against a target of 90%: the dashed hairline crosses the series where the weeks fell short."
      >
        <Sparkline
          area
          data={ON_TIME}
          formatOptions={PERCENT}
          label="On-time delivery"
          reference={0.9}
        />
      </Scene>
      <Scene
        label="reference above the extent"
        note="A target of 95% the series never reached is drawn above it, and the extent widens to hold it rather than clipping the line."
      >
        <Sparkline
          area
          data={ON_TIME}
          formatOptions={PERCENT}
          label="On-time delivery"
          reference={0.95}
        />
      </Scene>
      <Scene
        label="min={0} on bars"
        note="A share of a whole grown from nought, with the target as a line through the bars."
      >
        <Sparkline
          data={ON_TIME}
          formatOptions={PERCENT}
          label="On-time delivery"
          min={0}
          reference={0.9}
          type="bar"
        />
      </Scene>
    </Grid>
  ),
};

export const Gaps: Story = {
  parameters: scenario('gaps'),
  render: () => (
    <Grid columns={4} gap={6}>
      <Scene
        label="null on a line"
        note="Two missing weeks break the line; nothing is drawn across them and the marker sits on the last real point."
      >
        <Sparkline area data={WITH_GAPS} label="Returns" />
      </Scene>
      <Scene
        label="null on bars"
        note="The slot stays empty, so the weeks either side keep their place in the calendar."
      >
        <Sparkline data={WITH_GAPS} label="Returns" type="bar" />
      </Scene>
      <Scene
        label="one point, and none"
        note="A single value is a disc with no line; an empty series draws nothing and describes itself as “no data”."
      >
        <Sparkline data={[7]} label="Returns" />
        <Sparkline data={[]} label="Returns" />
      </Scene>
      <Scene
        label="a constant series"
        note="No high and no low, so the line runs through the middle of the box rather than along its top."
      >
        <Sparkline area data={[5, 5, 5, 5, 5, 5, 5, 5]} label="Seats" />
      </Scene>
    </Grid>
  ),
};

export const Extremes: Story = {
  parameters: scenario('extremes'),
  render: () => (
    <Grid columns={4} gap={6}>
      <Scene
        label="400 points"
        note="Requests per minute for a shift: four hundred segments in one path, and the marker on the last."
      >
        <Sparkline data={EVERY_MINUTE} label="Requests per minute" size="sm" />
        <Sparkline data={EVERY_MINUTE} label="Requests per minute" size="sm" type="bar" />
      </Scene>
      <Scene
        label="a series that crosses nought"
        note="Net stock movement: positive bars grow from the baseline and negative ones hang from it."
      >
        <Sparkline data={NET_STOCK} label="Net stock movement" type="bar" />
      </Scene>
      <Scene
        label='dir="rtl"'
        note="Time runs from the right, so the current week and its disc sit at the left end."
      >
        <div dir="rtl">
          <Sparkline area data={ORDERS} label="Orders" />
        </div>
      </Scene>
      <Scene
        label="a wide box"
        note="A lone card that leads a page: the line takes every pixel it is given and the marker stays eight."
      >
        <Sparkline area data={EVERY_MINUTE} label="Requests per minute" size="lg" />
      </Scene>
    </Grid>
  ),
};

export const InTable: Story = {
  parameters: scenario('in-table'),
  render: () => (
    <Table columns={4}>
      <TableContent>
        <TableCaption>Product lines, fill rate over the last twelve weeks</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Line</TableColumnHeader>
            <TableColumnHeader numeric>Orders</TableColumnHeader>
            <TableColumnHeader numeric>Fill rate</TableColumnHeader>
            <TableColumnHeader>Trend</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {LINES.map((line) => (
            <TableRow key={line.name} value={line.name}>
              <TableRowHeader>{line.name}</TableRowHeader>
              <TableCell numeric>{line.orders.toLocaleString('en-US')}</TableCell>
              <TableCell numeric>
                {new Intl.NumberFormat('en-US', PERCENT).format(line.fillRate.at(-1) ?? 0)}
              </TableCell>
              <TableCell>
                <Sparkline
                  data={line.fillRate}
                  formatOptions={PERCENT}
                  label={`${line.name} fill rate`}
                  size="sm"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label="the generated name"
        note="Hover or inspect the root: “Fill rate: 96.1%, up 3.2% since 92.9%”, with every number in the percent format given."
      >
        <Sparkline area data={FILL_RATE} formatOptions={PERCENT} label="Fill rate" />
      </Scene>
      <Scene
        label="translated once"
        note="The language in force sets the locale and the four sentences for everything below it: “Taxa de atendimento: 96,1%, alta de 3,2% desde 92,9%”."
      >
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Sparkline area data={FILL_RATE} formatOptions={PERCENT} label="Taxa de atendimento" />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};
