import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlGrid } from '@slotted/angular/grid';
import { provideSlotted } from '@slotted/angular/i18n';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlSparkline } from './sparkline';
import type { SparklineCurve, SparklineSize, SparklineType } from './sparkline.constants';
import { ANGULAR_SPARKLINE_DOCS, ANGULAR_SPARKLINE_TOKENS } from './sparkline.docs';

interface SparklineStoryArgs {
  area: boolean;
  curve: SparklineCurve;
  marker: boolean;
  size: SparklineSize;
  type: SparklineType;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SPARKLINE_DOCS.sparkline.scenes, {
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

/* Asteron Industrial Supply, twelve weeks of operations. */
const DATA = {
  fillRate: [0.929, 0.934, 0.931, 0.94, 0.947, 0.945, 0.951, 0.955, 0.953, 0.958, 0.96, 0.961],
  orders: [820, 940, 910, 1020, 1180, 1050, 1230, 1310, 1290, 1420, 1380, 1510],
  errorRate: [4.2, 3.9, 4.6, 4.1, 3.2, 2.8, 3.0, 2.4, 2.1, 1.9, 2.2, 1.6],
  leadTime: [3.1, 3.2, 3.4, 3.3, 3.6, 3.8, 3.7, 4.1, 4.2, 4.4, 4.3, 4.6],
  lastQuarter: [910, 880, 960, 1010, 990, 1040, 1080, 1050, 1120, 1090, 1150, 1180],
  onTime: [0.86, 0.88, 0.87, 0.9, 0.89, 0.91, 0.9, 0.91, 0.89, 0.9, 0.91, 0.91],
  netStock: [3, -2, 5, -4, 6, 1, -1, 4],
  withGaps: [10, 12, null, null, 15, 14, 16, null, 18, 19],
  flat: [5, 5, 5, 5, 5, 5, 5, 5],
  one: [7],
  none: [] as number[],
  everyMinute: Array.from(
    { length: 400 },
    (_, i) => 50 + 30 * Math.sin(i / 9) + 12 * Math.sin(i / 2.3) + (i % 7),
  ),
  percent: { style: 'percent', maximumFractionDigits: 1 } as Intl.NumberFormatOptions,
  warehouses: [
    { id: 'rot', name: 'Rotterdam', shipments: [30, 12, 44, 8, 51, 22, 39, 17, 48, 11, 35, 26] },
    { id: 'ham', name: 'Hamburg', shipments: [22, 25, 21, 30, 28, 33, 31, 36, 34, 39, 37, 41] },
    { id: 'ant', name: 'Antwerp', shipments: [40, 38, 41, 35, 36, 33, 34, 30, 31, 28, 29, 26] },
    { id: 'gdn', name: 'Gdańsk', shipments: [12, 14, 13, 17, 16, 19, 22, 21, 24, 23, 27, 30] },
    { id: 'bcn', name: 'Barcelona', shipments: [18, 18, 19, 18, 20, 19, 21, 20, 22, 21, 23, 22] },
    { id: 'lis', name: 'Lisbon', shipments: [9, 11, 8, 14, 10, 16, 12, 18, 13, 21, 15, 24] },
    { id: 'mil', name: 'Milan', shipments: [27, 24, 29, 22, 31, 20, 33, 19, 35, 17, 36, 16] },
    { id: 'vie', name: 'Vienna', shipments: [15, 16, 15, 17, 16, 18, 17, 19, 18, 20, 19, 21] },
  ],
  lines: [
    {
      name: 'Hydraulic fittings',
      orders: '1,510',
      fillRate: '96.1%',
      trend: [0.929, 0.934, 0.931, 0.94, 0.947, 0.945, 0.951, 0.955, 0.953, 0.958, 0.96, 0.961],
    },
    {
      name: 'Bearings',
      orders: '980',
      fillRate: '91.0%',
      trend: [0.86, 0.88, 0.87, 0.9, 0.89, 0.91, 0.9, 0.91, 0.89, 0.9, 0.91, 0.91],
    },
    {
      name: 'Pneumatic valves',
      orders: '640',
      fillRate: '90.0%',
      trend: [0.91, 0.9, 0.92, 0.89, 0.93, 0.9, 0.94, 0.9, 0.95, 0.9, 0.96, 0.9],
    },
    {
      name: 'Safety equipment',
      orders: '412',
      fillRate: '97.0%',
      trend: [0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97],
    },
  ],
};

const family = moduleMetadata({
  imports: [
    SlSparkline,
    SlGrid,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
});

const meta: Meta<SparklineStoryArgs> = {
  title: 'Components/Sparkline',
  component: SlSparkline,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Sparkline',
        description:
          'A series of numbers drawn in a box beside the value it explains: a line or bars, a marker on the last point, and a description a screen reader hears in its place.',
        framework: 'Angular',
        ...ANGULAR_SPARKLINE_DOCS.sparkline,
        tokens: ANGULAR_SPARKLINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SparklineStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

export const Playground: Story = {
  args: { area: true, curve: 'linear', marker: true, size: 'md', type: 'line' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...DATA },
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div class="slotted-demo-measure">
    <span
      slSparkline
      [data]="fillRate"
      [type]="type"
      [size]="size"
      [curve]="curve"
      [area]="area"
      [marker]="marker"
      [formatOptions]="percent"
      label="Fill rate, last 12 weeks"
    ></span>
  </div>
</div>`,
  }),
};

export const Types: Story = {
  parameters: scenario('types'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="4" [gap]="6">
  ${scene('line', 'Twelve weeks of orders, joined by straight segments; the disc marks the current week.', `<span slSparkline [data]="orders" label="Orders"></span>`)}
  ${scene('line, area', 'The same line with its wash, the color fading to nothing at the bottom edge.', `<span slSparkline [data]="orders" label="Orders" area></span>`)}
  ${scene('curve="monotone"', 'Smoothed, and still never higher or lower than a point it passes through.', `<span slSparkline [data]="orders" label="Orders" area curve="monotone"></span>`)}
  ${scene('type="bar"', 'One bar per week, grown from nought; the earlier weeks are dimmed and the current one is full.', `<span slSparkline [data]="orders" label="Orders" type="bar"></span>`)}
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="3" [gap]="6">
  ${scene('size="sm"', 'Twenty pixels tall, a thinner stroke and a smaller disc: the step for a table row.', `<span slSparkline [data]="orders" size="sm" area></span><span slSparkline [data]="orders" size="sm" type="bar"></span>`)}
  ${scene('size="md"', 'Thirty-two pixels: the step a card’s trend region takes.', `<span slSparkline [data]="orders" size="md" area></span><span slSparkline [data]="orders" size="md" type="bar"></span>`)}
  ${scene('size="lg"', 'Forty-eight pixels, for the card that leads a page.', `<span slSparkline [data]="orders" size="lg" area></span><span slSparkline [data]="orders" size="lg" type="bar"></span>`)}
</div>`,
  }),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="4" [gap]="6">
  ${scene('no tone', 'The first slot of the data scale, the accent’s own hue: a series that means nothing but itself.', `<span slSparkline [data]="orders" label="Orders" area></span><span slSparkline [data]="orders" label="Orders" type="bar"></span>`)}
  ${scene('tone="success"', 'An error rate that fell: the fall is good, so the line says so.', `<span slSparkline [data]="errorRate" label="Error rate" tone="success" area></span><span slSparkline [data]="errorRate" label="Error rate" tone="success" type="bar"></span>`)}
  ${scene('tone="danger"', 'A lead time that grew. The shape is a rise; the tone is what the rise means.', `<span slSparkline [data]="leadTime" label="Lead time" tone="danger" area></span><span slSparkline [data]="leadTime" label="Lead time" tone="danger" type="bar"></span>`)}
  ${scene('tone="neutral"', 'The comparison series, in the step the page uses for an aside, behind a current one.', `<span slSparkline [data]="lastQuarter" label="Last quarter" tone="neutral"></span><span slSparkline [data]="orders" label="This quarter" area></span>`)}
</div>`,
  }),
};

export const Series: Story = {
  parameters: scenario('series'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="4" [gap]="6">
  @for (warehouse of warehouses; track warehouse.id; let index = $index) {
    ${scene(
      'series · {{ warehouse.name }}',
      'Shipments per week, in the slot its position in the list gives it. The order is fixed; a filter that removes Hamburg must not repaint Antwerp.',
      `<span slSparkline [data]="warehouse.shipments" [label]="warehouse.name + ' shipments'" [series]="index + 1" area></span>
       <span slSparkline [data]="warehouse.shipments" [label]="warehouse.name + ' shipments'" [series]="index + 1" type="bar"></span>`,
    )}
  }
</div>`,
  }),
};

export const Reference: Story = {
  parameters: scenario('reference'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="3" [gap]="6">
  ${scene('reference inside the extent', 'On-time delivery against a target of 90%: the dashed hairline crosses the series where the weeks fell short.', `<span slSparkline [data]="onTime" [formatOptions]="percent" label="On-time delivery" area [reference]="0.9"></span>`)}
  ${scene('reference above the extent', 'A target of 95% the series never reached is drawn above it, and the extent widens to hold it rather than clipping the line.', `<span slSparkline [data]="onTime" [formatOptions]="percent" label="On-time delivery" area [reference]="0.95"></span>`)}
  ${scene('[min]="0" on bars', 'A share of a whole grown from nought, with the target as a line through the bars.', `<span slSparkline [data]="onTime" [formatOptions]="percent" label="On-time delivery" [min]="0" [reference]="0.9" type="bar"></span>`)}
</div>`,
  }),
};

export const Gaps: Story = {
  parameters: scenario('gaps'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="4" [gap]="6">
  ${scene('null on a line', 'Two missing weeks break the line; nothing is drawn across them and the marker sits on the last real point.', `<span slSparkline [data]="withGaps" label="Returns" area></span>`)}
  ${scene('null on bars', 'The slot stays empty, so the weeks either side keep their place in the calendar.', `<span slSparkline [data]="withGaps" label="Returns" type="bar"></span>`)}
  ${scene('one point, and none', 'A single value is a disc with no line; an empty series draws nothing and describes itself as “no data”.', `<span slSparkline [data]="one" label="Returns"></span><span slSparkline [data]="none" label="Returns"></span>`)}
  ${scene('a constant series', 'No high and no low, so the line runs through the middle of the box rather than along its top.', `<span slSparkline [data]="flat" label="Seats" area></span>`)}
</div>`,
  }),
};

export const Extremes: Story = {
  parameters: scenario('extremes'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="4" [gap]="6">
  ${scene('400 points', 'Requests per minute for a shift: four hundred segments in one path, and the marker on the last.', `<span slSparkline [data]="everyMinute" label="Requests per minute" size="sm"></span><span slSparkline [data]="everyMinute" label="Requests per minute" size="sm" type="bar"></span>`)}
  ${scene('a series that crosses nought', 'Net stock movement: positive bars grow from the baseline and negative ones hang from it.', `<span slSparkline [data]="netStock" label="Net stock movement" type="bar"></span>`)}
  ${scene('dir="rtl"', 'Time runs from the right, so the current week and its disc sit at the left end.', `<div dir="rtl"><span slSparkline [data]="orders" label="Orders" area></span></div>`)}
  ${scene('a wide box', 'A lone card that leads a page: the line takes every pixel it is given and the marker stays eight.', `<span slSparkline [data]="everyMinute" label="Requests per minute" size="lg" area></span>`)}
</div>`,
  }),
};

export const InTable: Story = {
  parameters: scenario('in-table'),
  render: () => ({
    props: DATA,
    template: `
<div slTable [columns]="4">
  <div slTableContent>
    <caption slTableCaption>Product lines, fill rate over the last twelve weeks</caption>
    <thead slTableHead>
      <tr slTableRow>
        <th slTableColumnHeader>Line</th>
        <th slTableColumnHeader numeric>Orders</th>
        <th slTableColumnHeader numeric>Fill rate</th>
        <th slTableColumnHeader>Trend</th>
      </tr>
    </thead>
    <tbody slTableBody>
      @for (line of lines; track line.name) {
        <tr slTableRow [value]="line.name">
          <th slTableRowHeader>{{ line.name }}</th>
          <td slTableCell numeric>{{ line.orders }}</td>
          <td slTableCell numeric>{{ line.fillRate }}</td>
          <td slTableCell>
            <span slSparkline [data]="line.trend" [formatOptions]="percent" [label]="line.name + ' fill rate'" size="sm"></span>
          </td>
        </tr>
      }
    </tbody>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  decorators: [
    applicationConfig({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  parameters: scenario('accessibility'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('the generated name', 'Inspect the root: “Taxa de atendimento: 96,1%, alta de 3,2% desde 92,9%”, with every number in the percent format given and the sentences of the language in force.', `<span slSparkline [data]="fillRate" [formatOptions]="percent" label="Taxa de atendimento" area></span>`)}
  ${scene('a description of your own', 'description replaces the whole sentence; an aria-label written on the element itself wins over both.', `<span slSparkline [data]="fillRate" description="Twelve weeks of fill rate, rising" area></span>`)}
</div>`,
  }),
};
