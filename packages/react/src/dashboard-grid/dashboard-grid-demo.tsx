import type { ReactNode } from 'react';

import { Button } from '../button';
import { Chart } from '../chart';
import { Skeleton, SkeletonText } from '../skeleton';
import { Sparkline } from '../sparkline';
import {
  StatCard,
  StatCardDelta,
  StatCardFigure,
  StatCardTrend,
  StatCardValue,
} from '../stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '../table';
import { DashboardWidget } from './dashboard-widget';
import type { DashboardWidgetProps } from './dashboard-grid.types';

/* ── Trailhead, an outdoor retailer, one month of sales ─────────────────── */

const EURO = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } as const;

const WEEKS = [42, 55, 48, 61, 58, 70, 66, 74, 69, 81, 77, 88];
const ORDERS = [310, 322, 298, 341, 356, 349, 372, 368, 381, 390, 402, 391];
const REFUNDS = [9, 11, 8, 14, 10, 12, 9, 13, 15, 11, 16, 18];
const CONVERSION = [3.1, 3.0, 3.2, 2.9, 3.0, 2.8, 2.9, 3.0, 2.7, 2.8, 2.9, 2.8];

const PRODUCTS = [
  ['Trail runner 2', 61204],
  ['Merino crew', 44810],
  ['Rain shell', 39377],
  ['Day pack 24 l', 28960],
  ['Wool beanie', 12118],
  ['Trail socks', 9874],
  ['Head torch', 7215],
] as const;

const euro = (value: number) => new Intl.NumberFormat('en', EURO).format(value);

function Figure({
  value,
  delta,
  data,
  goodWhen = 'up',
  format,
}: {
  value: number;
  delta: number;
  data: readonly number[];
  goodWhen?: 'up' | 'down';
  format?: Intl.NumberFormatOptions;
}) {
  return (
    <StatCard delta={delta} fill="plain" goodWhen={goodWhen} layout="stacked" size="sm">
      <StatCardFigure>
        <StatCardValue value={value} {...(format === undefined ? {} : { formatOptions: format })} />
        <StatCardDelta />
      </StatCardFigure>
      <StatCardTrend>
        <Sparkline area data={data} size="lg" />
      </StatCardTrend>
    </StatCard>
  );
}

const WEEKLY = WEEKS.map((thousands, index) => ({
  week: `W${index + 27}`,
  revenue: thousands * 1000,
}));

/** Twelve weeks of revenue in bars: the chart the widget's title already names. */
export function RevenueTrend() {
  return (
    <Chart
      aria-label="Revenue by week"
      data={WEEKLY}
      legend={false}
      series={[{ kind: 'bar', field: 'revenue', label: 'Revenue' }]}
      size="sm"
      toolbar="none"
      variant="plain"
      x={{ field: 'week' }}
      y={{ format: { style: 'currency', currency: 'EUR', notation: 'compact' } }}
    />
  );
}

export function TopProducts() {
  return (
    <Table columns={2} variant="plain">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Product</TableColumnHeader>
            <TableColumnHeader numeric>Revenue</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {PRODUCTS.map(([name, amount]) => (
            <TableRow key={name} value={name}>
              <TableRowHeader>{name}</TableRowHeader>
              <TableCell numeric>{euro(amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

/** The skeleton of the product table: its header, then seven rows. */
export function TopProductsSkeleton() {
  return <SkeletonText lines={8} />;
}

export type SalesKey = 'revenue' | 'orders' | 'refunds' | 'conversion' | 'trend' | 'products';

type Overrides = Partial<Record<SalesKey, Partial<DashboardWidgetProps>>>;

/**
 * The six widgets of the sales overview. Each story states only what it
 * changes about them, so the page reads as one product throughout.
 */
export function salesWidgets(overrides: Overrides = {}): ReactNode[] {
  const widget = (key: SalesKey, props: DashboardWidgetProps) => (
    <DashboardWidget key={key} {...props} {...overrides[key]} />
  );
  return [
    widget('revenue', {
      value: 'revenue',
      title: 'Revenue',
      defaultColumns: 3,
      detailHref: '#revenue',
      children: <Figure data={WEEKS} delta={0.124} format={EURO} value={482190} />,
    }),
    widget('orders', {
      value: 'orders',
      title: 'Orders',
      defaultColumns: 3,
      detailHref: '#orders',
      children: <Figure data={ORDERS} delta={0.031} value={3914} />,
    }),
    widget('refunds', {
      value: 'refunds',
      title: 'Refunds',
      defaultColumns: 3,
      detailHref: '#refunds',
      children: <Figure data={REFUNDS} delta={0.163} goodWhen="down" value={128} />,
    }),
    widget('conversion', {
      value: 'conversion',
      title: 'Conversion',
      defaultColumns: 3,
      children: (
        <Figure
          data={CONVERSION}
          delta={-0.067}
          format={{ style: 'percent', maximumFractionDigits: 1 }}
          value={0.028}
        />
      ),
    }),
    widget('trend', {
      value: 'trend',
      title: 'Revenue by week',
      description: 'Last twelve weeks, all channels',
      defaultColumns: 8,
      defaultRows: 4,
      minColumns: 4,
      detailHref: '#trend',
      children: <RevenueTrend />,
    }),
    widget('products', {
      value: 'products',
      title: 'Top products',
      defaultColumns: 4,
      defaultRows: 4,
      minColumns: 3,
      actions: (
        <Button size="sm" tone="secondary" variant="ghost">
          Export
        </Button>
      ),
      children: <TopProducts />,
    }),
  ];
}

export { Skeleton };
