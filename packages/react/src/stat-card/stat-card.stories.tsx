import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Card, CardBody } from '../card';
import { Grid } from '../grid';
import { SlottedProvider } from '../i18n';
import { Link } from '../link';
import { Sparkline } from '../sparkline';
import { StatCard } from './stat-card';
import { StatCardDefaultsProvider } from './stat-card-defaults';
import { StatCardDelta } from './stat-card-delta';
import {
  StatCardAction,
  StatCardComparison,
  StatCardFigure,
  StatCardHeader,
  StatCardLabel,
  StatCardMessage,
  StatCardPeriod,
  StatCardStatus,
  StatCardTrend,
  StatCardUnit,
} from './stat-card-parts';
import { StatCardValue } from './stat-card-value';
import type { StatCardProps } from './stat-card.types';
import { REACT_STAT_CARD_DOCS, REACT_STAT_CARD_TOKENS } from './stat-card.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_STAT_CARD_DOCS['stat-card'].scenes, {
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

const meta = {
  title: 'Components/Stat card',
  component: StatCard,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stat card',
        description:
          'A metric with its name, its change and its trend, in a frame — and a change whose color comes from what the metric means, never from its sign.',
        framework: 'React',
        ...REACT_STAT_CARD_DOCS['stat-card'],
        tokens: REACT_STAT_CARD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Asteron Industrial Supply, this week against last. */
const ORDERS = [820, 940, 910, 1020, 1180, 1050, 1230, 1310, 1290, 1420, 1380, 1510];
const FILL_RATE = [
  0.929, 0.934, 0.931, 0.94, 0.947, 0.945, 0.951, 0.955, 0.953, 0.958, 0.96, 0.961,
];
const LEAD_TIME = [3.1, 3.2, 3.4, 3.3, 3.6, 3.8, 3.7, 4.1, 4.2, 4.4, 4.3, 4.6];
const STOCKOUTS = [42, 39, 46, 41, 32, 28, 30, 24, 21, 19, 22, 16];
const NEW_CUSTOMERS = [12, 14, 13, 17, 16, 19, 22, 21, 24, 23, 27, 30];
const FLAT = [250, 250, 250, 250, 250, 250, 250, 250];
const REVENUE = [1.12, 1.15, 1.13, 1.19, 1.21, 1.2, 1.24, 1.26, 1.25, 1.28, 1.27, 1.31];

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

function OpenOrders(props: Partial<StatCardProps>) {
  return (
    <StatCard delta={0.124} {...props}>
      <StatCardHeader>
        <StatCardLabel>Open orders</StatCardLabel>
      </StatCardHeader>
      <StatCardFigure>
        <StatCardValue value={1510} />
        <StatCardDelta />
        <StatCardComparison>
          from 1,343 <StatCardPeriod>last week</StatCardPeriod>
        </StatCardComparison>
      </StatCardFigure>
      <StatCardTrend>
        <Sparkline area data={ORDERS} label="Open orders" />
      </StatCardTrend>
      <StatCardMessage>No orders recorded for this period.</StatCardMessage>
    </StatCard>
  );
}

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
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-measure">
        <OpenOrders {...args} />
      </div>
    </div>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-measure">
        <StatCard delta={0.032} goodWhen="up">
          <StatCardHeader>
            <StatCardLabel>Fill rate</StatCardLabel>
            <StatCardStatus>
              <Badge size="sm" tone="success" variant="soft">
                Live
              </Badge>
            </StatCardStatus>
            <StatCardAction>
              <Link href="#fill-rate">Details</Link>
            </StatCardAction>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue>
              96.1<StatCardUnit>%</StatCardUnit>
            </StatCardValue>
            <StatCardDelta />
            <StatCardComparison>
              from 92.9% <StatCardPeriod>vs. previous quarter</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline
              area
              data={FILL_RATE}
              formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
              label="Fill rate"
            />
          </StatCardTrend>
          <StatCardMessage>No data for this period yet.</StatCardMessage>
        </StatCard>
      </div>
    </div>
  ),
};

export const GoodWhen: Story = {
  parameters: scenario('good-when'),
  render: () => (
    <Grid columns={3} gap={5}>
      <StatCard delta={0.032} goodWhen="up">
        <StatCardHeader>
          <StatCardLabel>Fill rate</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue>
            96.1<StatCardUnit>%</StatCardUnit>
          </StatCardValue>
          <StatCardDelta />
          <StatCardComparison>
            from 92.9% <StatCardPeriod>last quarter</StatCardPeriod>
          </StatCardComparison>
        </StatCardFigure>
        <StatCardTrend>
          <Sparkline area data={FILL_RATE} label="Fill rate" />
        </StatCardTrend>
      </StatCard>
      <StatCard delta={-0.62} goodWhen="down">
        <StatCardHeader>
          <StatCardLabel>Stockouts</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue value={16} />
          <StatCardDelta />
          <StatCardComparison>
            from 42 <StatCardPeriod>last quarter</StatCardPeriod>
          </StatCardComparison>
        </StatCardFigure>
        <StatCardTrend>
          <Sparkline area data={STOCKOUTS} label="Stockouts" />
        </StatCardTrend>
      </StatCard>
      <StatCard delta={0.48} goodWhen="down">
        <StatCardHeader>
          <StatCardLabel>Average lead time</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue>
            4.6<StatCardUnit>days</StatCardUnit>
          </StatCardValue>
          <StatCardDelta />
          <StatCardComparison>
            from 3.1 days <StatCardPeriod>last quarter</StatCardPeriod>
          </StatCardComparison>
        </StatCardFigure>
        <StatCardTrend>
          <Sparkline area data={LEAD_TIME} label="Average lead time" />
        </StatCardTrend>
      </StatCard>
      <StatCard delta={-0.021} goodWhen="up">
        <StatCardHeader>
          <StatCardLabel>Orders shipped</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue value={12480} />
          <StatCardDelta />
          <StatCardComparison>
            from 12,748 <StatCardPeriod>last week</StatCardPeriod>
          </StatCardComparison>
        </StatCardFigure>
        <StatCardTrend>
          <Sparkline area data={[...ORDERS].reverse()} label="Orders shipped" />
        </StatCardTrend>
      </StatCard>
      <StatCard delta={0}>
        <StatCardHeader>
          <StatCardLabel>Active suppliers</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue value={250} />
          <StatCardDelta />
          <StatCardComparison>
            unchanged <StatCardPeriod>this quarter</StatCardPeriod>
          </StatCardComparison>
        </StatCardFigure>
        <StatCardTrend>
          <Sparkline area data={FLAT} label="Active suppliers" />
        </StatCardTrend>
      </StatCard>
      <StatCard delta={0.094} goodWhen="none">
        <StatCardHeader>
          <StatCardLabel>Warehouse visits</StatCardLabel>
        </StatCardHeader>
        <StatCardFigure>
          <StatCardValue formatOptions={{ notation: 'compact' }} value={1510} />
          <StatCardDelta />
          <StatCardComparison>
            from 1.38K <StatCardPeriod>yesterday</StatCardPeriod>
          </StatCardComparison>
        </StatCardFigure>
        <StatCardTrend>
          <Sparkline data={ORDERS} label="Warehouse visits" type="bar" />
        </StatCardTrend>
      </StatCard>
    </Grid>
  ),
};

function NetRevenue(props: Partial<StatCardProps>) {
  return (
    <StatCard delta={0.042} {...props}>
      <StatCardHeader>
        <StatCardLabel>Net revenue</StatCardLabel>
      </StatCardHeader>
      <StatCardFigure>
        <StatCardValue>
          <StatCardUnit>€</StatCardUnit>1.31<StatCardUnit>M</StatCardUnit>
        </StatCardValue>
        <StatCardDelta />
        <StatCardComparison>
          from €1.26M <StatCardPeriod>vs. last quarter</StatCardPeriod>
        </StatCardComparison>
      </StatCardFigure>
      <StatCardTrend>
        <Sparkline area data={REVENUE} label="Net revenue" />
      </StatCardTrend>
    </StatCard>
  );
}

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3} gap={5}>
      <Scene
        label='size="sm"'
        note="Twenty-pixel figure, tighter inset, a four-rem trend: the step for a row of eight."
      >
        <NetRevenue size="sm" />
      </Scene>
      <Scene label='size="md"' note="The step a dashboard opens with, four across.">
        <NetRevenue size="md" />
      </Scene>
      <Scene
        label='size="lg"'
        note="A 32-pixel figure — the 4xl step — and an eight-rem trend, for the one metric a page leads with."
      >
        <NetRevenue size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Fill: Story = {
  parameters: scenario('fill'),
  render: () => (
    <Grid columns={4} gap={5}>
      <Scene label='fill="outline"' note="A hairline on the raised surface: the default card.">
        <OpenOrders fill="outline" />
      </Scene>
      <Scene
        label='fill="elevated"'
        note="Lifted on the medium shadow; the hairline stays for forced colors."
      >
        <OpenOrders fill="elevated" />
      </Scene>
      <Scene
        label='fill="subtle"'
        note="Recedes onto the sunken surface, for a summary that should not compete with the table under it."
      >
        <OpenOrders fill="subtle" />
      </Scene>
      <Scene
        label='fill="plain"'
        note="No frame and no inset: the card inside a cell, or in a rail whose rules already separate it."
      >
        <OpenOrders fill="plain" />
      </Scene>
    </Grid>
  ),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <Grid columns={2} gap={5}>
      <Scene
        label='layout="inline"'
        note="The trend in its own column, as tall as the figure beside it."
      >
        <OpenOrders layout="inline" />
      </Scene>
      <Scene
        label='layout="stacked"'
        note="The trend takes the last row and runs to the card’s edges, level with the bottom of every card in the row."
      >
        <OpenOrders layout="stacked" />
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={2} gap={5}>
      <Scene
        label="loading, inline"
        note="Placeholders the height of each line and a block the height of the sparkline: the card is the size it will be."
      >
        <OpenOrders loading />
      </Scene>
      <Scene
        label="loading, stacked"
        note="The same wait under the figure; the label stays, because the name of the metric is already known."
      >
        <OpenOrders layout="stacked" loading />
      </Scene>
    </Grid>
  ),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <Grid columns={2} gap={5}>
      <Scene
        label='status="empty"'
        note="A dash where the value was and the message under it; the delta, the comparison and the trend are not rendered."
      >
        <StatCard status="empty">
          <StatCardHeader>
            <StatCardLabel>Churn</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue />
          </StatCardFigure>
          <StatCardMessage>No data for this period yet.</StatCardMessage>
        </StatCard>
      </Scene>
      <Scene
        label='status="error"'
        note="The same frame, the message in the danger tone, and the action still there to try again."
      >
        <StatCard status="error">
          <StatCardHeader>
            <StatCardLabel>Churn</StatCardLabel>
            <StatCardAction>
              <Link href="#retry">Retry</Link>
            </StatCardAction>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue />
          </StatCardFigure>
          <StatCardMessage>The metrics service did not answer.</StatCardMessage>
        </StatCard>
      </Scene>
    </Grid>
  ),
};

export const Row: Story = {
  parameters: scenario('row'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <Grid columns={4} gap={4}>
        <StatCard delta={0.124}>
          <StatCardHeader>
            <StatCardLabel>Revenue</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue>
              <StatCardUnit>€</StatCardUnit>48.2<StatCardUnit>K</StatCardUnit>
            </StatCardValue>
            <StatCardDelta />
            <StatCardComparison>
              from €42.9K <StatCardPeriod>last month</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline area data={REVENUE} label="Revenue" />
          </StatCardTrend>
        </StatCard>
        <StatCard delta={0.032}>
          <StatCardHeader>
            <StatCardLabel>New customers</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue value={1204} />
            <StatCardDelta />
            <StatCardComparison>
              from 1,167 <StatCardPeriod>last month</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline data={NEW_CUSTOMERS} label="New customers" type="bar" />
          </StatCardTrend>
        </StatCard>
        <StatCard delta={0.003} goodWhen="down">
          <StatCardHeader>
            <StatCardLabel>Churn</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue>
              2.4<StatCardUnit>%</StatCardUnit>
            </StatCardValue>
            <StatCardDelta
              format="decimal"
              formatOptions={{ style: 'unit', unit: 'percent' }}
              value={0.3}
            />
            <StatCardComparison>
              from 2.1% <StatCardPeriod>last month</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline area data={NEW_CUSTOMERS} label="Churn" />
          </StatCardTrend>
        </StatCard>
        <StatCard>
          <StatCardHeader>
            <StatCardLabel>Average order</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue>
              <StatCardUnit>€</StatCardUnit>87.04
            </StatCardValue>
            <StatCardComparison>
              first month <StatCardPeriod>no comparison yet</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline area data={STOCKOUTS} label="Average order" />
          </StatCardTrend>
        </StatCard>
      </Grid>
      <Card fill="outline">
        <CardBody>
          <Grid columns={3} gap={8}>
            <StatCardDefaultsProvider fill="plain" size="sm">
              <StatCard delta={0.081}>
                <StatCardHeader>
                  <StatCardLabel>Requests</StatCardLabel>
                </StatCardHeader>
                <StatCardFigure>
                  <StatCardValue formatOptions={{ notation: 'compact' }} value={4200000} />
                  <StatCardDelta />
                  <StatCardComparison>vs. previous hour</StatCardComparison>
                </StatCardFigure>
                <StatCardTrend>
                  <Sparkline area data={ORDERS} label="Requests" />
                </StatCardTrend>
              </StatCard>
              <StatCard delta={-0.0004} goodWhen="down">
                <StatCardHeader>
                  <StatCardLabel>Errors</StatCardLabel>
                </StatCardHeader>
                <StatCardFigure>
                  <StatCardValue>
                    0.21<StatCardUnit>%</StatCardUnit>
                  </StatCardValue>
                  <StatCardDelta formatOptions={{ maximumFractionDigits: 2 }} />
                  <StatCardComparison>vs. previous hour</StatCardComparison>
                </StatCardFigure>
                <StatCardTrend>
                  <Sparkline area data={STOCKOUTS} label="Errors" />
                </StatCardTrend>
              </StatCard>
              <StatCard delta={0.024}>
                <StatCardHeader>
                  <StatCardLabel>Latency p50</StatCardLabel>
                </StatCardHeader>
                <StatCardFigure>
                  <StatCardValue>
                    84<StatCardUnit>ms</StatCardUnit>
                  </StatCardValue>
                  <StatCardDelta goodWhen="none" />
                  <StatCardComparison>vs. previous hour</StatCardComparison>
                </StatCardFigure>
                <StatCardTrend>
                  <Sparkline area data={FLAT} label="Latency p50" />
                </StatCardTrend>
              </StatCard>
            </StatCardDefaultsProvider>
          </Grid>
        </CardBody>
      </Card>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2} gap={5}>
      <Scene
        label="a long translated label"
        note="Three lines of German keep the badge on the first line and the link at its end; the trend stays beside the figure."
      >
        <StatCard delta={-0.14} goodWhen="down">
          <StatCardHeader>
            <StatCardLabel>Durchschnittliche Bearbeitungszeit der Supportanfragen</StatCardLabel>
            <StatCardStatus>
              <Badge size="sm" tone="success" variant="soft">
                Live
              </Badge>
            </StatCardStatus>
            <StatCardAction>
              <Link href="#support">Details</Link>
            </StatCardAction>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue>4h 12m</StatCardValue>
            <StatCardDelta />
            <StatCardComparison>
              from 4h 53m <StatCardPeriod>last 30 days</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline area data={STOCKOUTS} label="Bearbeitungszeit" />
          </StatCardTrend>
        </StatCard>
      </Scene>
      <Scene
        label="a value too wide for the trend"
        note="The number keeps its column and the trend gives way to nothing; compact notation is the answer, shown in the code."
      >
        <StatCard delta={0.008} locale="pt-BR">
          <StatCardHeader>
            <StatCardLabel>Gross volume</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue
              formatOptions={{ style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }}
              value={1234567890}
            />
            <StatCardDelta />
            <StatCardComparison>
              from R$ 1.224.771.320,00 <StatCardPeriod>last month</StatCardPeriod>
            </StatCardComparison>
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline area data={REVENUE} label="Gross volume" />
          </StatCardTrend>
        </StatCard>
      </Scene>
      <Scene
        label="200 pixels"
        note="Under 220 pixels the card stacks on its own and the value drops one step; the sparkline takes the full width."
      >
        <div className="slotted-demo-room" data-room="phone">
          <div className="slotted-demo-viewport">
            <Grid columns={2} gap={4}>
              <OpenOrders />
              <OpenOrders delta={-0.03} />
            </Grid>
          </div>
        </div>
      </Scene>
      <Scene
        label='dir="rtl"'
        note="The sign stays in front of the number, the indicator and the sparkline read from the right, the action sits at the inline end."
      >
        <div dir="rtl">
          <StatCard delta={0.124} locale="ar-EG">
            <StatCardHeader>
              <StatCardLabel>الطلبات المفتوحة</StatCardLabel>
              <StatCardAction>
                <Link href="#orders">التفاصيل</Link>
              </StatCardAction>
            </StatCardHeader>
            <StatCardFigure>
              <StatCardValue value={1510} />
              <StatCardDelta />
              <StatCardComparison>
                من ١٬٣٤٣ <StatCardPeriod>الأسبوع الماضي</StatCardPeriod>
              </StatCardComparison>
            </StatCardFigure>
            <StatCardTrend>
              <Sparkline area data={ORDERS} label="الطلبات المفتوحة" />
            </StatCardTrend>
          </StatCard>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2} gap={5}>
      <Scene
        label="the group and its name"
        note="Tab to the link: a screen reader says “Details, link, Fill rate, group”. The delta reads “up +3.2%”; the sparkline is an image described in the same numbers."
      >
        <StatCard delta={0.032}>
          <StatCardHeader>
            <StatCardLabel>Fill rate</StatCardLabel>
            <StatCardAction>
              <Link href="#fill-rate">Details</Link>
            </StatCardAction>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue>
              96.1<StatCardUnit>%</StatCardUnit>
            </StatCardValue>
            <StatCardDelta />
          </StatCardFigure>
          <StatCardTrend>
            <Sparkline
              area
              data={FILL_RATE}
              formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
              label="Fill rate"
            />
          </StatCardTrend>
        </StatCard>
      </Scene>
      <Scene
        label="translated once"
        note="The language in force sets the locale and the words a reader hears: “alta +3,2%”, and a missing value says “—” in whatever the product calls one."
      >
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <StatCard delta={0.032}>
            <StatCardHeader>
              <StatCardLabel>Taxa de atendimento</StatCardLabel>
            </StatCardHeader>
            <StatCardFigure>
              <StatCardValue
                formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
                value={0.961}
              />
              <StatCardDelta />
            </StatCardFigure>
          </StatCard>
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};
