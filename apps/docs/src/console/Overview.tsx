import { Pencil, PackageX, ReceiptText, Timer, Undo2, AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@slotted/react/button';
import { Chart } from '@slotted/react/chart';
import {
  DashboardGrid,
  DashboardWidget,
  type DashboardLayout,
} from '@slotted/react/dashboard-grid';
import { Icon } from '@slotted/react/icon';
import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemButton,
  ListItemDescription,
  ListItemLabel,
  ListItemStart,
} from '@slotted/react/list-item';
import { Page, PageBody } from '@slotted/react/page';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { Segment, SegmentedControl } from '@slotted/react/segmented-control';
import { Sparkline } from '@slotted/react/sparkline';
import {
  StatCard,
  StatCardComparison,
  StatCardDelta,
  StatCardFigure,
  StatCardPeriod,
  StatCardTrend,
  StatCardValue,
} from '@slotted/react/stat-card';
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
  TableSummary,
} from '@slotted/react/table';
import { Timeline, TimelineItem } from '@slotted/react/timeline';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

import {
  CHANNELS,
  DAILY,
  FULFILLMENTS,
  INVOICES,
  NOW,
  ORDERS,
  PRODUCTS,
  RETURNS,
  SHIPMENTS,
  WAREHOUSES,
  count,
  daysOfCover,
  instant,
  isLate,
  money,
  orderById,
  percent,
  shortDate,
  wholeMoney,
} from './data';
import type { Screen } from './nav';
import { ScreenHeader } from './ScreenHeader';

type Period = 7 | 30 | 90;

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** The figures of one period and of the one before it. */
function figures(period: Period) {
  const current = DAILY.slice(-period);
  /* The 90-day period has no prior period in the data; it compares with its own first half. */
  const prior = period === 90 ? DAILY.slice(0, 45) : DAILY.slice(-period * 2, -period);
  const scale = period === 90 ? 2 : 1;
  const revenue = sum(current.map((day) => day.revenue));
  const revenuePrior = sum(prior.map((day) => day.revenue)) * scale;
  const orders = sum(current.map((day) => day.orders));
  const ordersPrior = sum(prior.map((day) => day.orders)) * scale;
  const since = current[0]!.date;
  const shipped = SHIPMENTS.filter((shipment) => shipment.shipped.slice(0, 10) >= since);
  const onTime = shipped.filter(
    (shipment) => shipment.shipped.slice(0, 10) <= orderById.get(shipment.order)!.shipBy,
  ).length;
  return {
    current,
    revenue,
    revenuePrior,
    orders,
    ordersPrior,
    aov: revenue / Math.max(1, orders),
    aovPrior: revenuePrior / Math.max(1, ordersPrior),
    onTime: onTime / Math.max(1, shipped.length),
    shipped: shipped.length,
  };
}

const late = ORDERS.filter(isLate);
const delayed = SHIPMENTS.filter((shipment) => shipment.state === 'delayed');
const lowStock = PRODUCTS.filter((product) => product.onHand < product.reorderAt);
const overdue = INVOICES.filter((invoice) => invoice.state === 'overdue');
const openReturns = RETURNS.filter((entry) => entry.state === 'received');

/** The work the period leaves waiting, most urgent first. */
const EXCEPTIONS: {
  key: string;
  icon: typeof AlertTriangle;
  tone: 'danger' | 'warning' | 'secondary';
  label: string;
  description: string;
  screen: Screen;
}[] = [
  {
    key: 'late',
    icon: Timer,
    tone: 'danger',
    label: `${late.length} orders past their ship-by date`,
    description: `${count.format(sum(late.map((order) => order.items)))} units, ${money.format(sum(late.map((order) => order.total)))}`,
    screen: 'orders',
  },
  {
    key: 'delayed',
    icon: AlertTriangle,
    tone: 'warning',
    label: `${delayed.length} shipments delayed in transit`,
    description: [...new Set(delayed.map((shipment) => shipment.carrier))].join(', '),
    screen: 'shipments',
  },
  {
    key: 'stock',
    icon: PackageX,
    tone: 'warning',
    label: `${lowStock.length} products under their reorder point`,
    description: `${lowStock.filter((product) => product.incoming === 0).length} with nothing on order`,
    screen: 'stock',
  },
  {
    key: 'overdue',
    icon: ReceiptText,
    tone: 'danger',
    label: `${overdue.length} invoices overdue`,
    description: `${money.format(sum(overdue.map((invoice) => invoice.amount - invoice.paid)))} outstanding`,
    screen: 'invoices',
  },
  {
    key: 'returns',
    icon: Undo2,
    tone: 'secondary',
    label: `${openReturns.length} returns received, not refunded`,
    description: 'Inspect and refund or restock',
    screen: 'returns',
  },
];

const pipeline = FULFILLMENTS.filter((stage) => stage.value !== 'delivered').map((stage) => ({
  ...stage,
  count: ORDERS.filter(
    (order) =>
      order.status !== 'voided' &&
      order.fulfillment === stage.value &&
      order.placed >= '2026-09-23',
  ).length,
}));
const pipelineMax = Math.max(...pipeline.map((stage) => stage.count));

const warehouses = WAREHOUSES.map((warehouse) => {
  const open = ORDERS.filter(
    (order) =>
      order.warehouse === warehouse.value &&
      order.status !== 'voided' &&
      ['unfulfilled', 'picking', 'packed'].includes(order.fulfillment),
  );
  const shipped = SHIPMENTS.filter((shipment) => shipment.warehouse === warehouse.value);
  const onTime = shipped.filter(
    (shipment) => shipment.shipped.slice(0, 10) <= orderById.get(shipment.order)!.shipBy,
  ).length;
  return {
    ...warehouse,
    open: open.length,
    units: sum(open.map((order) => order.items)),
    onTime: onTime / Math.max(1, shipped.length),
  };
});

const ACTIVITY: {
  title: string;
  actor: string;
  minutes: number;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}[] = [
  {
    title: 'Refunded RMA-7313 to Wren & Finch',
    actor: 'Ruth Adeyemi',
    minutes: 12,
    tone: 'warning',
  },
  {
    title: 'Raised PO-3478 for 240 Stoneware mugs',
    actor: 'Automation',
    minutes: 38,
    tone: 'accent',
  },
  {
    title: `Marked ${ORDERS[13]!.id} as rush`,
    actor: 'Kenji Watanabe',
    minutes: 61,
    tone: 'danger',
  },
  {
    title: 'Handed 38 parcels to UPS in Reno',
    actor: 'Avery Collins',
    minutes: 118,
    tone: 'success',
  },
  {
    title: 'Closed INV-21462, Harbor & Pine',
    actor: 'Lucía Fernández',
    minutes: 190,
    tone: 'success',
  },
  { title: 'Flagged 4 shipments as delayed', actor: 'Automation', minutes: 302, tone: 'warning' },
  { title: 'Finished the cycle count in aisle C', actor: 'Tomasz Nowak', minutes: 410 },
];

/**
 * Where each widget starts, on twelve columns. Average order starts hidden, so
 * the edit bar's Add widget has one to offer.
 */
const DEFAULT_LAYOUT: DashboardLayout = [
  { key: 'revenue', x: 0, y: 0, w: 3, h: 2 },
  { key: 'orders', x: 3, y: 0, w: 3, h: 2 },
  { key: 'on-time', x: 6, y: 0, w: 3, h: 2 },
  { key: 'late', x: 9, y: 0, w: 3, h: 2 },
  { key: 'aov', x: 0, y: 2, w: 3, h: 2, hidden: true },
  { key: 'trend', x: 0, y: 2, w: 8, h: 4 },
  { key: 'attention', x: 8, y: 2, w: 4, h: 4 },
  { key: 'pipeline', x: 0, y: 6, w: 4, h: 3 },
  { key: 'channels', x: 4, y: 6, w: 4, h: 3 },
  { key: 'warehouses', x: 8, y: 6, w: 4, h: 3 },
  { key: 'products', x: 0, y: 9, w: 7, h: 4 },
  { key: 'activity', x: 7, y: 9, w: 5, h: 4 },
];

export function Overview({ onScreen }: { onScreen: (screen: Screen) => void }) {
  const [period, setPeriod] = useState<Period>(30);
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const f = useMemo(() => figures(period), [period]);
  const since = f.current[0]!.date;

  const series = useMemo(
    () =>
      f.current.map((day, index) => ({
        day: Date.parse(`${day.date}T00:00:00Z`),
        revenue: day.revenue,
        prior:
          (period === 90 ? undefined : DAILY[DAILY.length - period * 2 + index]?.revenue) ?? null,
      })),
    [f, period],
  );

  const channels = useMemo(
    () =>
      CHANNELS.map((channel) => ({
        channel: channel.label,
        revenue: Math.round(
          sum(
            ORDERS.filter(
              (order) =>
                order.channel === channel.value &&
                order.status !== 'voided' &&
                order.placed >= since,
            ).map((order) => order.total),
          ),
        ),
      })),
    [since],
  );

  const top = useMemo(() => {
    const units = new Map<string, { units: number; revenue: number }>();
    for (const order of ORDERS) {
      if (order.placed < since || order.status === 'voided') continue;
      for (const line of order.lines) {
        const entry = units.get(line.sku) ?? { units: 0, revenue: 0 };
        entry.units += line.quantity;
        entry.revenue += line.quantity * line.price;
        units.set(line.sku, entry);
      }
    }
    return PRODUCTS.map((product) => ({
      product,
      ...(units.get(product.sku) ?? { units: 0, revenue: 0 }),
    }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [since]);

  const periodLabel =
    period === 7 ? 'prior 7 days' : period === 30 ? 'prior 30 days' : 'first 45 days';

  /* A figure's door opens the list it counts (OV-01). */
  const door = (screen: Screen) => ({
    detailHref: `#${screen}`,
    onDetail: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      onScreen(screen);
    },
  });

  return (
    <Page landmark="none" inset={5}>
      <ScreenHeader
        title="Overview"
        subheading={`Wednesday, September 30 · all warehouses · last ${period} days`}
        actions={
          <>
            <SegmentedControl
              aria-label="Period"
              size="sm"
              value={String(period)}
              onValueChange={(value) => {
                if (value) setPeriod(Number(value) as Period);
              }}
            >
              <Segment value="7">7 days</Segment>
              <Segment value="30">30 days</Segment>
              <Segment value="90">90 days</Segment>
            </SegmentedControl>
            <Button
              size="sm"
              variant="outline"
              tone="secondary"
              disabled={editing}
              start={<Pencil aria-hidden="true" size={14} strokeWidth={1.75} />}
              onClick={() => setEditing(true)}
            >
              Edit layout
            </Button>
          </>
        }
      />
      <PageBody>
        <DashboardGrid
          aria-label="Overview"
          editing={editing}
          onEditingChange={setEditing}
          layout={layout}
          onLayoutChange={setLayout}
          headingLevel={2}
        >
          <DashboardWidget
            value="revenue"
            title="Revenue"
            defaultColumns={3}
            defaultRows={2}
            {...door('orders')}
          >
            <StatCard
              delta={(f.revenue - f.revenuePrior) / f.revenuePrior}
              goodWhen="up"
              fill="plain"
              layout="stacked"
              size="sm"
            >
              <StatCardFigure>
                <StatCardValue
                  value={f.revenue}
                  formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                />
                <StatCardDelta />
                <StatCardComparison>
                  from {wholeMoney.format(f.revenuePrior)}{' '}
                  <StatCardPeriod>{periodLabel}</StatCardPeriod>
                </StatCardComparison>
              </StatCardFigure>
              <StatCardTrend>
                <Sparkline area data={f.current.map((day) => day.revenue)} label="Daily revenue" />
              </StatCardTrend>
            </StatCard>
          </DashboardWidget>

          <DashboardWidget
            value="orders"
            title="Orders"
            defaultColumns={3}
            defaultRows={2}
            {...door('orders')}
          >
            <StatCard
              delta={(f.orders - f.ordersPrior) / f.ordersPrior}
              goodWhen="up"
              fill="plain"
              layout="stacked"
              size="sm"
            >
              <StatCardFigure>
                <StatCardValue value={f.orders} />
                <StatCardDelta />
                <StatCardComparison>
                  from {count.format(f.ordersPrior)} <StatCardPeriod>{periodLabel}</StatCardPeriod>
                </StatCardComparison>
              </StatCardFigure>
              <StatCardTrend>
                <Sparkline area data={f.current.map((day) => day.orders)} label="Daily orders" />
              </StatCardTrend>
            </StatCard>
          </DashboardWidget>

          <DashboardWidget
            value="on-time"
            title="Shipped on time"
            defaultColumns={3}
            defaultRows={2}
            {...door('shipments')}
          >
            <StatCard fill="plain" layout="stacked" size="sm">
              <StatCardFigure>
                <StatCardValue
                  value={f.onTime}
                  formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
                />
                <StatCardComparison>
                  of {count.format(f.shipped)} shipments, target 95%
                </StatCardComparison>
              </StatCardFigure>
            </StatCard>
          </DashboardWidget>

          <DashboardWidget
            value="late"
            title="Late orders"
            defaultColumns={3}
            defaultRows={2}
            {...door('orders')}
          >
            <StatCard fill="plain" layout="stacked" size="sm">
              <StatCardFigure>
                <StatCardValue value={late.length} />
                <StatCardComparison>
                  {late.length > 0
                    ? `past ship-by, oldest due ${shortDate.format(instant(late[late.length - 1]!.shipBy))}`
                    : 'none past ship-by'}
                </StatCardComparison>
              </StatCardFigure>
            </StatCard>
          </DashboardWidget>

          <DashboardWidget value="aov" title="Average order" defaultColumns={3} defaultRows={2}>
            <StatCard
              delta={(f.aov - f.aovPrior) / f.aovPrior}
              goodWhen="up"
              fill="plain"
              layout="stacked"
              size="sm"
            >
              <StatCardFigure>
                <StatCardValue
                  value={f.aov}
                  formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }}
                />
                <StatCardDelta />
                <StatCardComparison>
                  from {money.format(f.aovPrior)} <StatCardPeriod>{periodLabel}</StatCardPeriod>
                </StatCardComparison>
              </StatCardFigure>
              <StatCardTrend>
                <Sparkline
                  data={f.current.map((day) => day.revenue / Math.max(1, day.orders))}
                  label="Daily average order"
                />
              </StatCardTrend>
            </StatCard>
          </DashboardWidget>

          <DashboardWidget
            value="trend"
            title="Revenue by day"
            description={`All channels${period === 90 ? '' : `, against the ${periodLabel}`}`}
            defaultColumns={8}
            defaultRows={4}
            minColumns={4}
            minRows={3}
          >
            <Chart
              aria-label="Revenue by day"
              variant="plain"
              size="sm"
              data={series}
              x={{
                field: 'day',
                type: 'time',
                format: { month: 'short', day: 'numeric', timeZone: 'UTC' },
              }}
              y={{ format: { style: 'currency', currency: 'USD', notation: 'compact' } }}
              series={[
                { kind: 'area', field: 'revenue', label: 'This period', curve: 'monotone' },
                ...(period === 90
                  ? []
                  : [
                      {
                        kind: 'line',
                        field: 'prior',
                        label: 'Prior period',
                        curve: 'monotone',
                        stroke: 'dashed',
                        tone: 'neutral',
                      } as const,
                    ]),
              ]}
              toolbar="none"
            />
          </DashboardWidget>

          <DashboardWidget
            value="attention"
            title="Needs attention"
            description="Work waiting on the team, most urgent first"
            defaultColumns={4}
            defaultRows={4}
            minColumns={3}
          >
            <List aria-label="Needs attention" variant="ruled" size="sm">
              {EXCEPTIONS.map((entry) => (
                <ListItem key={entry.key}>
                  <ListItemButton onClick={() => onScreen(entry.screen)}>
                    <ListItemStart>
                      <span className="console-exception" data-tone={entry.tone}>
                        <Icon size="sm">
                          <entry.icon aria-hidden="true" strokeWidth={1.75} />
                        </Icon>
                      </span>
                    </ListItemStart>
                    <ListItemBody>
                      <ListItemLabel>{entry.label}</ListItemLabel>
                      <ListItemDescription>{entry.description}</ListItemDescription>
                    </ListItemBody>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DashboardWidget>

          <DashboardWidget
            value="pipeline"
            title="Fulfillment pipeline"
            description="Orders of the last 7 days not yet delivered"
            defaultColumns={4}
            defaultRows={3}
            minColumns={3}
          >
            <ul className="console-pipeline">
              {pipeline.map((stage) => (
                <li key={stage.value}>
                  <span className="console-pipeline-label">{stage.label}</span>
                  <ProgressBar
                    size="sm"
                    hideLabel
                    label={`${stage.label} orders`}
                    value={stage.count}
                    max={pipelineMax}
                    tone={stage.value === 'unfulfilled' ? 'warning' : 'accent'}
                  />
                  <span className="console-pipeline-count">{stage.count}</span>
                </li>
              ))}
            </ul>
          </DashboardWidget>

          <DashboardWidget
            value="channels"
            title="Revenue by channel"
            description={`Last ${period} days`}
            defaultColumns={4}
            defaultRows={3}
            minColumns={3}
          >
            <Chart
              aria-label="Revenue by channel"
              variant="plain"
              size="sm"
              data={channels}
              orientation="horizontal"
              x={{ field: 'channel' }}
              y={{ format: { style: 'currency', currency: 'USD', notation: 'compact' } }}
              series={[{ kind: 'bar', field: 'revenue', label: 'Revenue', labels: true }]}
              legend={false}
              toolbar="none"
            />
          </DashboardWidget>

          <DashboardWidget
            value="warehouses"
            title="Warehouses"
            description="Open orders and on-time rate"
            defaultColumns={4}
            defaultRows={3}
            minColumns={3}
          >
            <Table columns={4} variant="plain">
              <TableContent>
                <VisuallyHidden
                  render={(props) => <TableCaption {...props}>Warehouses</TableCaption>}
                />
                <TableHead>
                  <TableRow>
                    <TableColumnHeader>Site</TableColumnHeader>
                    <TableColumnHeader numeric>Orders</TableColumnHeader>
                    <TableColumnHeader numeric>Units</TableColumnHeader>
                    <TableColumnHeader numeric>On time</TableColumnHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.value} value={warehouse.value}>
                      <TableRowHeader>{warehouse.label}</TableRowHeader>
                      <TableCell numeric>{warehouse.open}</TableCell>
                      <TableCell numeric>{count.format(warehouse.units)}</TableCell>
                      <TableCell numeric>{percent.format(warehouse.onTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableSummary>
                  <TableRow>
                    <TableCell>All sites</TableCell>
                    <TableCell numeric>
                      {sum(warehouses.map((warehouse) => warehouse.open))}
                    </TableCell>
                    <TableCell numeric>
                      {count.format(sum(warehouses.map((warehouse) => warehouse.units)))}
                    </TableCell>
                    <TableCell numeric>{percent.format(f.onTime)}</TableCell>
                  </TableRow>
                </TableSummary>
              </TableContent>
            </Table>
          </DashboardWidget>

          <DashboardWidget
            value="products"
            title="Top products"
            description={`By revenue, last ${period} days`}
            defaultColumns={7}
            defaultRows={4}
            minColumns={4}
            {...door('stock')}
          >
            <Table columns={5} variant="plain">
              <TableContent>
                <VisuallyHidden
                  render={(props) => <TableCaption {...props}>Top products</TableCaption>}
                />
                <TableHead>
                  <TableRow>
                    <TableColumnHeader>Product</TableColumnHeader>
                    <TableColumnHeader numeric>Units</TableColumnHeader>
                    <TableColumnHeader numeric>Revenue</TableColumnHeader>
                    <TableColumnHeader numeric>On hand</TableColumnHeader>
                    <TableColumnHeader numeric>Cover</TableColumnHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {top.map(({ product, units, revenue }) => {
                    const cover = daysOfCover(product);
                    return (
                      <TableRow key={product.sku} value={product.sku}>
                        <TableRowHeader>
                          <span className="console-product">
                            <span>{product.name}</span>
                            <span className="console-muted">{product.sku}</span>
                          </span>
                        </TableRowHeader>
                        <TableCell numeric>{count.format(units)}</TableCell>
                        <TableCell numeric>{wholeMoney.format(revenue)}</TableCell>
                        <TableCell numeric>{count.format(product.onHand)}</TableCell>
                        <TableCell numeric>
                          <span data-short={cover < 14 ? '' : undefined} className="console-cover">
                            {cover} days
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </TableContent>
            </Table>
          </DashboardWidget>

          <DashboardWidget
            value="activity"
            title="Activity"
            description="Today, across the team"
            defaultColumns={5}
            defaultRows={4}
            minColumns={3}
          >
            <Timeline
              label="Activity"
              order="newest-first"
              locale="en-US"
              timeZone="UTC"
              now={NOW}
              size="sm"
            >
              {ACTIVITY.map((entry) => (
                <TimelineItem
                  key={entry.title}
                  title={entry.title}
                  actor={entry.actor}
                  time={new Date(NOW - entry.minutes * 60_000).toISOString()}
                  {...(entry.tone ? { tone: entry.tone } : {})}
                />
              ))}
            </Timeline>
          </DashboardWidget>
        </DashboardGrid>
      </PageBody>
    </Page>
  );
}
