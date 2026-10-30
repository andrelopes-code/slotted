import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlLink } from '@slotted/angular/link';
import { SlSparkline } from '@slotted/angular/sparkline';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlStatCard } from './stat-card';
import { SlStatCardDelta } from './stat-card-delta';
import {
  SlStatCardAction,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardMessage,
  SlStatCardPeriod,
  SlStatCardStatus,
  SlStatCardTrend,
  SlStatCardUnit,
} from './stat-card-parts';
import { SlStatCardValue } from './stat-card-value';
import type {
  StatCardFill,
  StatCardGoodWhen,
  StatCardLayout,
  StatCardSize,
  StatCardValueStatus,
} from './stat-card.constants';
import { ANGULAR_STAT_CARD_DOCS, ANGULAR_STAT_CARD_TOKENS } from './stat-card.docs';

interface StatCardStoryArgs {
  delta: number;
  fill: StatCardFill;
  goodWhen: StatCardGoodWhen;
  layout: StatCardLayout;
  loading: boolean;
  size: StatCardSize;
  status: StatCardValueStatus;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_STAT_CARD_DOCS['stat-card'].scenes, {
    playground: Playground,
    anatomy: Anatomy,
    'good-when': GoodWhen,
    sizes: Sizes,
    fill: Fill,
    layout: Layout,
    loading: Loading,
    status: Status,
    row: Row,
    content: Content,
    accessibility: Accessibility,
  }) as never;

/* Asteron Industrial Supply, this week against last. */
const DATA = {
  orders: [820, 940, 910, 1020, 1180, 1050, 1230, 1310, 1290, 1420, 1380, 1510],
  ordersDown: [1510, 1380, 1420, 1290, 1310, 1230, 1050, 1180, 1020, 910, 940, 820],
  fillRate: [0.929, 0.934, 0.931, 0.94, 0.947, 0.945, 0.951, 0.955, 0.953, 0.958, 0.96, 0.961],
  leadTime: [3.1, 3.2, 3.4, 3.3, 3.6, 3.8, 3.7, 4.1, 4.2, 4.4, 4.3, 4.6],
  stockouts: [42, 39, 46, 41, 32, 28, 30, 24, 21, 19, 22, 16],
  newCustomers: [12, 14, 13, 17, 16, 19, 22, 21, 24, 23, 27, 30],
  flat: [250, 250, 250, 250, 250, 250, 250, 250],
  revenue: [1.12, 1.15, 1.13, 1.19, 1.21, 1.2, 1.24, 1.26, 1.25, 1.28, 1.27, 1.31],
  percent: { style: 'percent', maximumFractionDigits: 1 } as Intl.NumberFormatOptions,
  compact: { notation: 'compact' } as Intl.NumberFormatOptions,
  brl: { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 } as Intl.NumberFormatOptions,
  twoDecimals: { maximumFractionDigits: 2 } as Intl.NumberFormatOptions,
  percentPoints: { style: 'unit', unit: 'percent' } as Intl.NumberFormatOptions,
};

const family = moduleMetadata({
  imports: [
    SlStatCard,
    SlStatCardAction,
    SlStatCardComparison,
    SlStatCardDelta,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardMessage,
    SlStatCardPeriod,
    SlStatCardStatus,
    SlStatCardTrend,
    SlStatCardUnit,
    SlStatCardValue,
    SlSparkline,
    SlBadge,
    SlCard,
    SlCardBody,
    SlGrid,
    SlLink,
  ],
});

const meta: Meta<StatCardStoryArgs> = {
  title: 'Components/Stat card',
  component: SlStatCard,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stat card',
        description:
          'A metric with its name, its change and its trend, in a frame — and a change whose colour comes from what the metric means, never from its sign.',
        framework: 'Angular',
        ...ANGULAR_STAT_CARD_DOCS['stat-card'],
        tokens: ANGULAR_STAT_CARD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<StatCardStoryArgs>;

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

/** One card, the same every time it is asked for, with the attributes the scene adds. */
const openOrders = (attributes = '', delta = '0.124') => `
<div slStatCard [delta]="${delta}" ${attributes}>
  <div slStatCardHeader><span slStatCardLabel>Open orders</span></div>
  <div slStatCardFigure>
    <span slStatCardValue [value]="1510"></span>
    <span slStatCardDelta></span>
    <p slStatCardComparison>from 1,343 <span slStatCardPeriod>last week</span></p>
  </div>
  <div slStatCardTrend><span slSparkline [data]="orders" label="Open orders" area></span></div>
  <p slStatCardMessage>No orders recorded for this period.</p>
</div>`;

const card = (
  attributes: string,
  label: string,
  value: string,
  comparison: string,
  trend: string,
  delta = '<span slStatCardDelta></span>',
) => `
<div slStatCard ${attributes}>
  <div slStatCardHeader><span slStatCardLabel>${label}</span></div>
  <div slStatCardFigure>
    <span slStatCardValue>${value}</span>
    ${delta}
    <p slStatCardComparison>${comparison}</p>
  </div>
  <div slStatCardTrend>${trend}</div>
</div>`;

export const Playground: Story = {
  args: {
    delta: 0.124,
    fill: 'outline',
    goodWhen: 'up',
    layout: 'inline',
    loading: false,
    size: 'md',
    status: 'ready',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...DATA },
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div class="slotted-demo-measure">
    ${openOrders(
      '[fill]="fill" [goodWhen]="goodWhen" [layout]="layout" [loading]="loading" [size]="size" [status]="status"',
      'delta',
    )}
  </div>
</div>`,
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: DATA,
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div class="slotted-demo-measure">
    <div slStatCard [delta]="0.032" goodWhen="up">
      <div slStatCardHeader>
        <span slStatCardLabel>Fill rate</span>
        <span slStatCardStatus><span slBadge size="sm" tone="success" variant="soft">Live</span></span>
        <span slStatCardAction><a slLink href="#fill-rate">Details</a></span>
      </div>
      <div slStatCardFigure>
        <span slStatCardValue>96.1<span slStatCardUnit>%</span></span>
        <span slStatCardDelta></span>
        <p slStatCardComparison>from 92.9% <span slStatCardPeriod>vs. previous quarter</span></p>
      </div>
      <div slStatCardTrend>
        <span slSparkline [data]="fillRate" [formatOptions]="percent" label="Fill rate" area></span>
      </div>
      <p slStatCardMessage>No data for this period yet.</p>
    </div>
  </div>
</div>`,
  }),
};

export const GoodWhen: Story = {
  parameters: scenario('good-when'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="3" [gap]="5">
  ${card('[delta]="0.032" goodWhen="up"', 'Fill rate', '96.1<span slStatCardUnit>%</span>', 'from 92.9% <span slStatCardPeriod>last quarter</span>', '<span slSparkline [data]="fillRate" label="Fill rate" area></span>')}
  ${card('[delta]="-0.62" goodWhen="down"', 'Stockouts', '16', 'from 42 <span slStatCardPeriod>last quarter</span>', '<span slSparkline [data]="stockouts" label="Stockouts" area></span>')}
  ${card('[delta]="0.48" goodWhen="down"', 'Average lead time', '4.6<span slStatCardUnit>days</span>', 'from 3.1 days <span slStatCardPeriod>last quarter</span>', '<span slSparkline [data]="leadTime" label="Average lead time" area></span>')}
  ${card('[delta]="-0.021" goodWhen="up"', 'Orders shipped', '12,480', 'from 12,748 <span slStatCardPeriod>last week</span>', '<span slSparkline [data]="ordersDown" label="Orders shipped" area></span>')}
  ${card('[delta]="0"', 'Active suppliers', '250', 'unchanged <span slStatCardPeriod>this quarter</span>', '<span slSparkline [data]="flat" label="Active suppliers" area></span>')}
  ${card('[delta]="0.094" goodWhen="none"', 'Warehouse visits', '1.51<span slStatCardUnit>K</span>', 'from 1.38K <span slStatCardPeriod>yesterday</span>', '<span slSparkline [data]="orders" label="Warehouse visits" type="bar"></span>')}
</div>`,
  }),
};

const netRevenue = (attributes: string) =>
  card(
    `[delta]="0.042" ${attributes}`,
    'Net revenue',
    '<span slStatCardUnit>€</span>1.31<span slStatCardUnit>M</span>',
    'from €1.26M <span slStatCardPeriod>vs. last quarter</span>',
    '<span slSparkline [data]="revenue" label="Net revenue" area></span>',
  );

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="3" [gap]="5">
  ${scene('size="sm"', 'Twenty-pixel figure, tighter inset, a four-rem trend: the step for a row of eight.', netRevenue('size="sm"'))}
  ${scene('size="md"', 'The step a dashboard opens with, four across.', netRevenue('size="md"'))}
  ${scene('size="lg"', 'A 32-pixel figure — the 4xl step — and an eight-rem trend, for the one metric a page leads with.', netRevenue('size="lg"'))}
</div>`,
  }),
};

export const Fill: Story = {
  parameters: scenario('fill'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="4" [gap]="5">
  ${scene('fill="outline"', 'A hairline on the raised surface: the default card.', openOrders('fill="outline"'))}
  ${scene('fill="elevated"', 'Lifted on the medium shadow; the hairline stays for forced colours.', openOrders('fill="elevated"'))}
  ${scene('fill="subtle"', 'Recedes onto the sunken surface, for a summary that should not compete with the table under it.', openOrders('fill="subtle"'))}
  ${scene('fill="plain"', 'No frame and no inset: the card inside a cell, or in a rail whose rules already separate it.', openOrders('fill="plain"'))}
</div>`,
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="2" [gap]="5">
  ${scene('layout="inline"', 'The trend in its own column, as tall as the figure beside it.', openOrders('layout="inline"'))}
  ${scene('layout="stacked"', 'The trend takes the last row and runs to the card’s edges, level with the bottom of every card in the row.', openOrders('layout="stacked"'))}
</div>`,
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="2" [gap]="5">
  ${scene('loading, inline', 'Placeholders the height of each line and a block the height of the sparkline: the card is the size it will be.', openOrders('loading'))}
  ${scene('loading, stacked', 'The same wait under the figure; the label stays, because the name of the metric is already known.', openOrders('loading layout="stacked"'))}
</div>`,
  }),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="2" [gap]="5">
  ${scene(
    'status="empty"',
    'A dash where the value was and the message under it; the delta, the comparison and the trend are hidden.',
    `<div slStatCard status="empty">
      <div slStatCardHeader><span slStatCardLabel>Churn</span></div>
      <div slStatCardFigure><span slStatCardValue></span></div>
      <p slStatCardMessage>No data for this period yet.</p>
    </div>`,
  )}
  ${scene(
    'status="error"',
    'The same frame, the message in the danger tone, and the action still there to try again.',
    `<div slStatCard status="error">
      <div slStatCardHeader>
        <span slStatCardLabel>Churn</span>
        <span slStatCardAction><a slLink href="#retry">Retry</a></span>
      </div>
      <div slStatCardFigure><span slStatCardValue></span></div>
      <p slStatCardMessage>The metrics service did not answer.</p>
    </div>`,
  )}
</div>`,
  }),
};

export const Row: Story = {
  parameters: scenario('row'),
  render: () => ({
    props: DATA,
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div slGrid [columns]="4" [gap]="4">
    ${card('[delta]="0.124"', 'Revenue', '<span slStatCardUnit>€</span>48.2<span slStatCardUnit>K</span>', 'from €42.9K <span slStatCardPeriod>last month</span>', '<span slSparkline [data]="revenue" label="Revenue" area></span>')}
    ${card('[delta]="0.032"', 'New customers', '1,204', 'from 1,167 <span slStatCardPeriod>last month</span>', '<span slSparkline [data]="newCustomers" label="New customers" type="bar"></span>')}
    ${card('[delta]="0.003" goodWhen="down"', 'Churn', '2.4<span slStatCardUnit>%</span>', 'from 2.1% <span slStatCardPeriod>last month</span>', '<span slSparkline [data]="newCustomers" label="Churn" area></span>', '<span slStatCardDelta format="decimal" [formatOptions]="percentPoints" [value]="0.3"></span>')}
    ${card('', 'Average order', '<span slStatCardUnit>€</span>87.04', 'first month <span slStatCardPeriod>no comparison yet</span>', '<span slSparkline [data]="stockouts" label="Average order" area></span>', '')}
  </div>
  <div slCard fill="outline">
    <div slCardBody>
      <div slGrid [columns]="3" [gap]="8">
        ${card('fill="plain" size="sm" [delta]="0.081"', 'Requests', '4.2<span slStatCardUnit>M</span>', 'vs. previous hour', '<span slSparkline [data]="orders" label="Requests" area></span>')}
        ${card('fill="plain" size="sm" [delta]="-0.0004" goodWhen="down"', 'Errors', '0.21<span slStatCardUnit>%</span>', 'vs. previous hour', '<span slSparkline [data]="stockouts" label="Errors" area></span>', '<span slStatCardDelta [formatOptions]="twoDecimals"></span>')}
        ${card('fill="plain" size="sm" [delta]="0.024"', 'Latency p50', '84<span slStatCardUnit>ms</span>', 'vs. previous hour', '<span slSparkline [data]="flat" label="Latency p50" area></span>', '<span slStatCardDelta goodWhen="none"></span>')}
      </div>
    </div>
  </div>
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: DATA,
    template: `
<div slGrid [columns]="2" [gap]="5">
  ${scene(
    'a long translated label',
    'Three lines of German keep the badge on the first line and the link at its end; the trend stays beside the figure.',
    `<div slStatCard [delta]="-0.14" goodWhen="down">
      <div slStatCardHeader>
        <span slStatCardLabel>Durchschnittliche Bearbeitungszeit der Supportanfragen</span>
        <span slStatCardStatus><span slBadge size="sm" tone="success" variant="soft">Live</span></span>
        <span slStatCardAction><a slLink href="#support">Details</a></span>
      </div>
      <div slStatCardFigure>
        <span slStatCardValue>4h 12m</span>
        <span slStatCardDelta></span>
        <p slStatCardComparison>from 4h 53m <span slStatCardPeriod>last 30 days</span></p>
      </div>
      <div slStatCardTrend><span slSparkline [data]="stockouts" label="Bearbeitungszeit" area></span></div>
    </div>`,
  )}
  ${scene(
    'a value too wide for the trend',
    'The number keeps its column and the trend gives way to nothing; compact notation is the answer, shown in the code.',
    `<div slStatCard [delta]="0.008" locale="pt-BR">
      <div slStatCardHeader><span slStatCardLabel>Gross volume</span></div>
      <div slStatCardFigure>
        <span slStatCardValue [value]="1234567890" [formatOptions]="brl"></span>
        <span slStatCardDelta></span>
        <p slStatCardComparison>from R$ 1.224.771.320,00 <span slStatCardPeriod>last month</span></p>
      </div>
      <div slStatCardTrend><span slSparkline [data]="revenue" label="Gross volume" area></span></div>
    </div>`,
  )}
  ${scene(
    '200 pixels',
    'Under 220 pixels the card stacks on its own and the value drops one step; the sparkline takes the full width.',
    `<div class="slotted-demo-room" data-room="phone">
      <div class="slotted-demo-viewport">
        <div slGrid [columns]="2" [gap]="4">${openOrders()}${openOrders('', '-0.03')}</div>
      </div>
    </div>`,
  )}
  ${scene(
    'dir="rtl"',
    'The sign stays in front of the number, the indicator and the sparkline read from the right, the action sits at the inline end.',
    `<div dir="rtl">
      <div slStatCard [delta]="0.124" locale="ar-EG">
        <div slStatCardHeader>
          <span slStatCardLabel>الطلبات المفتوحة</span>
          <span slStatCardAction><a slLink href="#orders">التفاصيل</a></span>
        </div>
        <div slStatCardFigure>
          <span slStatCardValue [value]="1510"></span>
          <span slStatCardDelta></span>
          <p slStatCardComparison>من ١٬٣٤٣ <span slStatCardPeriod>الأسبوع الماضي</span></p>
        </div>
        <div slStatCardTrend><span slSparkline [data]="orders" label="الطلبات المفتوحة" area></span></div>
      </div>
    </div>`,
  )}
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
<div slGrid [columns]="2" [gap]="5">
  ${scene(
    'the group and its name',
    'Tab to the link: a screen reader says “Details, link, Fill rate, group”. The delta reads “alta +3,2%”; the sparkline is an image described in the same numbers.',
    `<div slStatCard [delta]="0.032">
      <div slStatCardHeader>
        <span slStatCardLabel>Fill rate</span>
        <span slStatCardAction><a slLink href="#fill-rate">Details</a></span>
      </div>
      <div slStatCardFigure>
        <span slStatCardValue>96.1<span slStatCardUnit>%</span></span>
        <span slStatCardDelta></span>
      </div>
      <div slStatCardTrend><span slSparkline [data]="fillRate" [formatOptions]="percent" label="Fill rate" area></span></div>
    </div>`,
  )}
  ${scene(
    'translated once',
    'provideSlotted sets the locale and the words a reader hears for every card in the application; a missing value says “—” in whatever the product calls one.',
    `<div slStatCard status="empty">
      <div slStatCardHeader><span slStatCardLabel>Fulfillment rate</span></div>
      <div slStatCardFigure><span slStatCardValue></span></div>
      <p slStatCardMessage>No data in this period.</p>
    </div>`,
  )}
</div>`,
  }),
};
