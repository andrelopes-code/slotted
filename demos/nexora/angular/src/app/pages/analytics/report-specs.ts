import type { ReportKey, ReportRecords } from '@slotted/demo-nexora-backend';

import type { ReportFilterKey, ReportUnit } from '../../core/analytics/report.model';
import { CATEGORY_LABEL } from '../../core/support/support.model';

/** One figure of a report: its words, its unit, and which way is good (stat-card `goodWhen`). */
export interface FigureSpec {
  readonly key: string;
  readonly label: string;
  readonly unit: ReportUnit;
  readonly goodWhen: 'up' | 'down' | 'none';
  /** What the door's records are, by their count: "1,690 orders". */
  readonly noun: readonly [one: string, many: string];
  /** One line under the number on a phone, and the definition the figure follows. */
  readonly description: string;
}

export interface ColumnSpec {
  readonly key: string;
  readonly label: string;
  readonly unit: ReportUnit;
}

/**
 * A breakdown of the answer, drawn as a chart over a table of the same
 * numbers. The title is the question the chart answers (§16, "every chart
 * should answer a plausible business question").
 */
export interface SectionSpec {
  /** The backend table it draws. */
  readonly table: string;
  readonly title: string;
  /** What the table lists and in which order, for its caption. */
  readonly caption: string;
  /** The row header's column. */
  readonly rows: string;
  /** The rows the wait reserves where the answer always holds the same ones. */
  readonly reserve?: number;
  readonly columns: readonly ColumnSpec[];
  /**
   * The chart: the columns drawn, one unit for all of them (one axis), and
   * how. `series` names a bucket of time (a trend) or a category (a ranking).
   * Absent where the table is the answer.
   */
  readonly chart?: {
    /** The measure drawn, the chart's own title (OV-05): never the section's question again. */
    readonly measure: string;
    readonly columns: readonly string[];
    /** One kind per column, so two series differ by mark as well as by colour. */
    readonly kinds?: readonly ('bar' | 'line')[];
    readonly stacked?: boolean;
    readonly orientation?: 'horizontal';
    /** Rows the chart leaves to the table: "every other account" would flatten the ten it ranks. */
    readonly skipRows?: readonly string[];
    /** The rows a ranking draws, from the top: a plot holds about ten bars and their names. */
    readonly limit?: number;
  };
  /** The columns a phone keeps (RP-03); the row header always stays. */
  readonly phoneColumns: readonly string[];
  /** Row words where the backend answers a key: a method, a priority, a band. */
  readonly labels?: Readonly<Record<string, string>>;
  /** One sentence under the table: what the numbers are and are not. */
  readonly note?: string;
  /** The words of the summary row the answer ends in (RP-07), which the wait reserves. */
  readonly total?: string;
  /** A state as of today, whatever the period: the stock a valuation counts. */
  readonly today?: boolean;
}

export interface ReportSpec {
  readonly key: ReportKey;
  readonly title: string;
  /** What the report answers, said under its title. */
  readonly question: string;
  /** The records the report's period is chosen against: a period they do not cover is not offered. */
  readonly primary: ReportRecords;
  readonly filters: readonly ReportFilterKey[];
  readonly figures: readonly FigureSpec[];
  readonly sections: readonly SectionSpec[];
  /** The read of today's state beside the period's: the overview's own, so the numbers are the same. */
  readonly today?: 'finance' | 'support';
}

const SEGMENT_LABELS = { strategic: 'Strategic', enterprise: 'Enterprise', mid_market: 'Mid-market', smb: 'SMB' };

const BOOKED = {
  bookedValue: {
    key: 'bookedValue',
    label: 'Booked value',
    unit: 'usd',
    goodWhen: 'up',
    noun: ['order', 'orders'],
    description: 'confirmed orders, net of tax (§72.4)',
  },
  orders: {
    key: 'orders',
    label: 'Orders booked',
    unit: 'count',
    goodWhen: 'up',
    noun: ['order', 'orders'],
    description: 'confirmed and not cancelled (§72.4)',
  },
  averageOrderValue: {
    key: 'averageOrderValue',
    label: 'Average order value',
    unit: 'usd',
    goodWhen: 'up',
    noun: ['order', 'orders'],
    description: 'booked value over orders booked (§72.5)',
  },
} as const satisfies Record<string, FigureSpec>;

const SEGMENT_SECTION: SectionSpec = {
  table: 'bySegment',
  total: 'All segments',
  title: 'Which segments moved bookings?',
  caption: 'Booked value by customer segment, against the comparison period',
  rows: 'Segment',
  columns: [
    { key: 'bookedValue', label: 'Booked', unit: 'usd' },
    { key: 'previousBookedValue', label: 'Compared with', unit: 'usd' },
    { key: 'orders', label: 'Orders', unit: 'count' },
  ],
  chart: { measure: 'Booked value, this period and the one compared', columns: ['bookedValue', 'previousBookedValue'] },
  phoneColumns: ['bookedValue'],
  labels: SEGMENT_LABELS,
};

export const REPORT_SPECS: Record<ReportKey, ReportSpec> = {
  executive: {
    key: 'executive',
    title: 'Executive',
    question: 'How the business performed over the period, what changed and what needs attention',
    primary: 'orders',
    filters: [],
    today: 'finance',
    figures: [
      {
        key: 'revenue',
        label: 'Invoiced revenue',
        unit: 'usd',
        goodWhen: 'up',
        noun: ['invoice', 'invoices'],
        description: 'opened invoices less credit memos, net of tax (§72.2)',
      },
      {
        key: 'grossMargin',
        label: 'Gross margin',
        unit: 'share',
        goodWhen: 'up',
        noun: ['invoice', 'invoices'],
        description: 'invoiced merchandise less its cost (§72.3)',
      },
      BOOKED.bookedValue,
      BOOKED.orders,
      BOOKED.averageOrderValue,
      {
        key: 'topAccountShare',
        label: 'Ten largest accounts',
        unit: 'share',
        goodWhen: 'down',
        noun: ['order', 'orders'],
        description: 'their share of booked value: the concentration of the book',
      },
      {
        key: 'inventoryValue',
        label: 'Inventory value',
        unit: 'usd',
        goodWhen: 'none',
        noun: ['position', 'positions'],
        description: 'on hand at standard cost, today (§72.8)',
      },
      {
        key: 'firstResponseSla',
        label: 'First replies on time',
        unit: 'share',
        goodWhen: 'up',
        noun: ['ticket', 'tickets'],
        description: 'tickets opened whose first reply met its target (§72.11)',
      },
    ],
    sections: [
      {
        table: 'trend',
        title: 'How did bookings and invoicing move over the period?',
        caption: 'Booked value and invoiced revenue by period, oldest first',
        rows: 'Period',
        columns: [
          { key: 'bookedValue', label: 'Booked', unit: 'usd' },
          { key: 'revenue', label: 'Invoiced revenue', unit: 'usd' },
        ],
        chart: { measure: 'Booked value and invoiced revenue', columns: ['bookedValue', 'revenue'], kinds: ['bar', 'line'] },
        phoneColumns: ['bookedValue', 'revenue'],
        note: 'Revenue counts an invoice on the day it was issued and booked value an order on its date: the two meet a few days apart. An order placed before invoices are kept is history, and its invoice is not counted even when it falls in the period.',
      },
      SEGMENT_SECTION,
      {
        table: 'byAccount',
        total: 'All accounts',
        title: 'How much of the book do the largest accounts hold?',
        caption: 'The ten accounts with the most booked value, the rest, and all of them',
        rows: 'Account',
        columns: [
          { key: 'bookedValue', label: 'Booked', unit: 'usd' },
          { key: 'share', label: 'Share', unit: 'share' },
          { key: 'orders', label: 'Orders', unit: 'count' },
        ],
        chart: { measure: 'Booked value of the ten largest accounts', columns: ['bookedValue'], orientation: 'horizontal', skipRows: ['others'] },
        phoneColumns: ['bookedValue'],
      },
    ],
  },
  sales: {
    key: 'sales',
    title: 'Sales',
    question: 'What was booked, by whom, of what and for whom, and how quotes and orders moved',
    primary: 'orders',
    filters: ['region', 'segment', 'ownerId'],
    figures: [
      BOOKED.bookedValue,
      BOOKED.orders,
      BOOKED.averageOrderValue,
      {
        key: 'bookedMargin',
        label: 'Margin on bookings',
        unit: 'share',
        goodWhen: 'up',
        noun: ['order', 'orders'],
        description: 'booked merchandise less its cost',
      },
      {
        key: 'conversionRate',
        label: 'Quotes converted',
        unit: 'share',
        goodWhen: 'up',
        noun: ['quote decided', 'quotes decided'],
        description: 'of the period’s quotes since decided, the share that became orders',
      },
      {
        key: 'discountRate',
        label: 'Discount given',
        unit: 'share',
        goodWhen: 'down',
        noun: ['order', 'orders'],
        description: 'line discounts over the merchandise before them',
      },
      {
        key: 'cycleTime',
        label: 'Days to ship complete',
        unit: 'days',
        goodWhen: 'down',
        noun: ['order shipped', 'orders shipped'],
        description: 'median, from order date to the shipment that completed it',
      },
    ],
    sections: [
      {
        table: 'trend',
        title: 'How did bookings move over the period?',
        caption: 'Booked value and orders by period, oldest first',
        rows: 'Period',
        columns: [
          { key: 'bookedValue', label: 'Booked', unit: 'usd' },
          { key: 'orders', label: 'Orders', unit: 'count' },
        ],
        chart: { measure: 'Booked value', columns: ['bookedValue'] },
        phoneColumns: ['bookedValue', 'orders'],
      },
      SEGMENT_SECTION,
      {
        table: 'byAccount',
        total: 'All accounts',
        title: 'Which accounts booked the most?',
        caption: 'The ten accounts with the most booked value, the rest, and all of them',
        rows: 'Account',
        columns: [
          { key: 'bookedValue', label: 'Booked', unit: 'usd' },
          { key: 'share', label: 'Share', unit: 'share' },
          { key: 'orders', label: 'Orders', unit: 'count' },
          { key: 'margin', label: 'Margin', unit: 'share' },
        ],
        chart: { measure: 'Booked value of the ten largest accounts', columns: ['bookedValue'], orientation: 'horizontal', skipRows: ['others'] },
        phoneColumns: ['bookedValue'],
      },
      {
        table: 'byProduct',
        title: 'Which products sold the most?',
        caption: 'The ten SKUs with the most line revenue, net of discount and tax',
        rows: 'Product',
        columns: [
          { key: 'lineRevenue', label: 'Line revenue', unit: 'usd' },
          { key: 'orders', label: 'Orders', unit: 'count' },
        ],
        chart: { measure: 'Line revenue by product', columns: ['lineRevenue'], orientation: 'horizontal' },
        phoneColumns: ['lineRevenue'],
        note: 'An order counts once under each product on it; its door opens the orders that carry the product.',
      },
      {
        table: 'quoteOutcomes',
        total: 'Quotes written',
        title: 'Where did the period’s quotes end up?',
        caption: 'Quotes written in the period, by where they stand today',
        rows: 'Outcome',
        columns: [{ key: 'quotes', label: 'Quotes', unit: 'count' }],
        chart: { measure: 'Quotes by outcome', columns: ['quotes'], orientation: 'horizontal' },
        phoneColumns: ['quotes'],
        labels: {
          converted: 'Became an order',
          accepted: 'Accepted, not yet an order',
          open: 'Still open',
          lost: 'Rejected, expired or cancelled',
        },
      },
      {
        table: 'cycleBands',
        total: 'Orders shipped complete',
        title: 'How long did orders take to ship complete?',
        caption: 'Orders of the period shipped complete, by days from order to the last shipment',
        rows: 'Days',
        columns: [{ key: 'orders', label: 'Orders', unit: 'count' }],
        chart: { measure: 'Orders by days to ship complete', columns: ['orders'] },
        phoneColumns: ['orders'],
        reserve: 5,
      },
      // Last: the table holds every representative, a number the wait cannot know, and grows with nothing under it.
      {
        table: 'byRep',
        title: 'How did each representative book?',
        caption: 'Booked value by the order’s owner, most first',
        rows: 'Representative',
        columns: [
          { key: 'bookedValue', label: 'Booked', unit: 'usd' },
          { key: 'orders', label: 'Orders', unit: 'count' },
          { key: 'averageOrderValue', label: 'Average order', unit: 'usd' },
          { key: 'margin', label: 'Margin', unit: 'share' },
        ],
        chart: { measure: 'Booked value of the ten representatives who booked most', columns: ['bookedValue'], orientation: 'horizontal', limit: 10 },
        phoneColumns: ['bookedValue'],
      },
    ],
  },
  inventory: {
    key: 'inventory',
    title: 'Inventory',
    question: 'What the stock is worth and where, how fast it turns, and what moved it',
    primary: 'movements',
    filters: ['warehouseId', 'categoryId'],
    figures: [
      {
        key: 'valuation',
        label: 'Stock valuation',
        unit: 'usd',
        goodWhen: 'none',
        noun: ['position', 'positions'],
        description: 'on hand at standard cost, today (§72.8)',
      },
      {
        key: 'turns',
        label: 'Inventory turns',
        unit: 'turns',
        goodWhen: 'up',
        noun: ['shipment movement', 'shipment movements'],
        description: 'cost shipped in the period at a yearly rate, over today’s value (§72.9)',
      },
      {
        key: 'agedPositions',
        label: 'Not shipped from',
        unit: 'count',
        goodWhen: 'down',
        noun: ['position', 'positions'],
        description: 'positions with stock and no shipment since movements are kept',
      },
      {
        key: 'agedValue',
        label: 'Aged stock value',
        unit: 'usd',
        goodWhen: 'down',
        noun: ['position', 'positions'],
        description: 'what those positions hold, at standard cost',
      },
      {
        key: 'stockoutRate',
        label: 'Orders short of stock',
        unit: 'share',
        goodWhen: 'down',
        noun: ['order short', 'orders short'],
        description: 'the period’s orders a reservation does not cover today',
      },
      {
        key: 'transfers',
        label: 'Transfers',
        unit: 'count',
        goodWhen: 'none',
        noun: ['transfer', 'transfers'],
        description: 'requested in the period between warehouses',
      },
      {
        key: 'utilization',
        label: 'Warehouse utilization',
        unit: 'share',
        goodWhen: 'none',
        noun: ['position', 'positions'],
        description: 'the space stock takes against capacity',
      },
    ],
    sections: [
      {
        table: 'movements',
        title: 'What moved stock over the period?',
        caption: 'Stock movements by period and by what moved them, oldest first',
        rows: 'Period',
        columns: [
          { key: 'shipments', label: 'Shipments', unit: 'count' },
          { key: 'receipts', label: 'Receipts', unit: 'count' },
          { key: 'losses', label: 'Losses', unit: 'count' },
          { key: 'transfers', label: 'Transfers out', unit: 'count' },
        ],
        chart: { measure: 'Stock movements by kind', columns: ['shipments', 'receipts', 'losses', 'transfers'], stacked: true },
        phoneColumns: ['shipments', 'losses'],
        note: 'Movements are counted, not their quantities: SKUs are counted in different units (RP-08). A loss is an adjustment out or damage.',
      },
      {
        table: 'byWarehouse',
        total: 'All warehouses',
        today: true,
        title: 'Where is the stock’s value held?',
        caption: 'Stock valuation by warehouse, most first',
        rows: 'Warehouse',
        columns: [
          { key: 'value', label: 'Value', unit: 'usd' },
          { key: 'positions', label: 'Positions', unit: 'count' },
        ],
        chart: { measure: 'Stock value by warehouse', columns: ['value'], orientation: 'horizontal' },
        phoneColumns: ['value'],
      },
      {
        table: 'byCategory',
        title: 'Which categories hold the most value?',
        total: 'All categories',
        today: true,
        caption: 'Stock valuation by top-level category, most first',
        rows: 'Category',
        columns: [
          { key: 'value', label: 'Value', unit: 'usd' },
          { key: 'positions', label: 'Positions', unit: 'count' },
        ],
        chart: { measure: 'Stock value by category', columns: ['value'], orientation: 'horizontal' },
        phoneColumns: ['value'],
      },
    ],
  },
  procurement: {
    key: 'procurement',
    title: 'Procurement',
    question: 'What was committed with suppliers, and how they delivered',
    primary: 'purchase-orders',
    filters: ['warehouseId'],
    figures: [
      {
        key: 'spend',
        label: 'Committed spend',
        unit: 'usd',
        goodWhen: 'none',
        noun: ['purchase order', 'purchase orders'],
        description: 'approved purchase orders written in the period, net of tax',
      },
      {
        key: 'onTimeDelivery',
        label: 'Lines on time',
        unit: 'share',
        goodWhen: 'up',
        noun: ['order received', 'orders received'],
        description: 'lines of orders received in full, satisfied by their date (§72.10)',
      },
      {
        key: 'leadTime',
        label: 'Lead time',
        unit: 'days',
        goodWhen: 'down',
        noun: ['order received', 'orders received'],
        description: 'median, from sending an order to receiving it in full',
      },
      {
        key: 'priceVariance',
        label: 'Price paid against standard',
        unit: 'share',
        goodWhen: 'down',
        noun: ['order received', 'orders received'],
        description: 'accepted units at the price paid, against their standard cost',
      },
    ],
    sections: [
      {
        table: 'bySupplier',
        title: 'Which suppliers took the most spend?',
        caption: 'The ten suppliers with the most committed spend in the period',
        rows: 'Supplier',
        columns: [
          { key: 'spend', label: 'Spend', unit: 'usd' },
          { key: 'orders', label: 'Orders', unit: 'count' },
          { key: 'onTimeDelivery', label: 'Lines on time', unit: 'share' },
        ],
        chart: { measure: 'Committed spend by supplier', columns: ['spend'], orientation: 'horizontal' },
        phoneColumns: ['spend'],
      },
      {
        table: 'received',
        title: 'How many orders arrived complete, and on time?',
        caption: 'Purchase orders received in full, by period, oldest first',
        rows: 'Period',
        columns: [
          { key: 'received', label: 'Received in full', unit: 'count' },
          { key: 'onTimeDelivery', label: 'Lines on time', unit: 'share' },
        ],
        chart: { measure: 'Purchase orders received in full', columns: ['received'] },
        phoneColumns: ['received', 'onTimeDelivery'],
      },
    ],
  },
  finance: {
    key: 'finance',
    title: 'Finance',
    question: 'What was invoiced and collected over the period, and how the book of receivables stands',
    primary: 'invoices',
    filters: ['region', 'segment'],
    today: 'finance',
    figures: [
      {
        key: 'revenue',
        label: 'Invoiced revenue',
        unit: 'usd',
        goodWhen: 'up',
        noun: ['invoice', 'invoices'],
        description: 'opened invoices less credit memos, net of tax (§72.2)',
      },
      {
        key: 'collected',
        label: 'Collected',
        unit: 'usd',
        goodWhen: 'up',
        noun: ['payment', 'payments'],
        description: 'posted payments received in the period',
      },
      {
        key: 'overdueOfInvoiced',
        label: 'Overdue of invoiced',
        unit: 'share',
        goodWhen: 'down',
        noun: ['invoice overdue', 'invoices overdue'],
        description: 'of what the period invoiced, the share overdue today',
      },
    ],
    sections: [
      {
        table: 'trend',
        title: 'What was invoiced and what came in?',
        caption: 'Invoiced revenue and cash collected by period, oldest first',
        rows: 'Period',
        columns: [
          { key: 'invoiced', label: 'Invoiced', unit: 'usd' },
          { key: 'credited', label: 'Credited', unit: 'usd' },
          { key: 'revenue', label: 'Revenue', unit: 'usd' },
          { key: 'collected', label: 'Collected', unit: 'usd' },
        ],
        chart: { measure: 'Invoiced revenue and cash collected', columns: ['revenue', 'collected'], kinds: ['bar', 'line'] },
        phoneColumns: ['revenue', 'collected'],
        note: 'An order placed before invoices and payments are kept is history: its invoice and its payment are not counted, even when they fall in the period, so collections read low against invoicing.',
      },
      {
        table: 'overdueByIssue',
        title: 'Of what each period invoiced, how much is overdue today?',
        caption: 'Invoices by the period they were issued in, and what of them is overdue now',
        rows: 'Issued in',
        columns: [
          { key: 'invoicedTotal', label: 'Invoiced, tax included', unit: 'usd' },
          { key: 'overdue', label: 'Overdue today', unit: 'usd' },
          { key: 'overdueShare', label: 'Share', unit: 'share' },
        ],
        chart: { measure: 'Overdue today, by period of issue', columns: ['overdue'] },
        phoneColumns: ['overdue', 'overdueShare'],
        note: 'Nexora keeps the book as it stands today, not as it stood: an invoice’s lateness is read now, by the period that issued it.',
      },
      {
        table: 'methods',
        total: 'All methods',
        title: 'How did customers pay?',
        caption: 'Posted payments of the period by method, most collected first',
        rows: 'Method',
        columns: [
          { key: 'collected', label: 'Collected', unit: 'usd' },
          { key: 'payments', label: 'Payments', unit: 'count' },
          { key: 'share', label: 'Share', unit: 'share' },
        ],
        chart: { measure: 'Cash collected by method', columns: ['collected'], orientation: 'horizontal' },
        phoneColumns: ['collected', 'share'],
        labels: {
          ach: 'ACH',
          wire: 'Wire',
          credit_card: 'Card',
          check: 'Check',
          pix: 'Pix',
          boleto: 'Boleto',
          other: 'Other',
        },
      },
    ],
  },
  support: {
    key: 'support',
    title: 'Support',
    question: 'How many tickets came in, how fast they were answered and solved, and how customers rated it',
    primary: 'tickets',
    filters: ['region', 'segment'],
    today: 'support',
    figures: [
      {
        key: 'ticketVolume',
        label: 'Tickets opened',
        unit: 'count',
        goodWhen: 'none',
        noun: ['ticket', 'tickets'],
        description: 'opened in the period, any channel',
      },
      {
        key: 'firstResponseSla',
        label: 'First replies on time',
        unit: 'share',
        goodWhen: 'up',
        noun: ['ticket decided', 'tickets decided'],
        description: 'of the opened tickets whose first reply is decided (§72.11)',
      },
      {
        key: 'resolutionTime',
        label: 'Time to resolve',
        unit: 'minutes',
        goodWhen: 'down',
        noun: ['ticket resolved', 'tickets resolved'],
        description: 'median business time, over tickets resolved in the period',
      },
      {
        key: 'satisfaction',
        label: 'Satisfaction',
        unit: 'score',
        goodWhen: 'up',
        noun: ['rating', 'ratings'],
        description: 'mean score of the tickets resolved in the period and rated',
      },
      {
        key: 'escalationRate',
        label: 'Escalated',
        unit: 'share',
        goodWhen: 'down',
        noun: ['ticket escalated', 'tickets escalated'],
        description: 'of the tickets opened in the period',
      },
    ],
    sections: [
      {
        table: 'trend',
        title: 'Did resolution keep up with what came in?',
        caption: 'Tickets opened and resolved by period, oldest first',
        rows: 'Period',
        columns: [
          { key: 'opened', label: 'Opened', unit: 'count' },
          { key: 'resolved', label: 'Resolved', unit: 'count' },
        ],
        chart: { measure: 'Tickets opened and resolved', columns: ['opened', 'resolved'], kinds: ['bar', 'line'] },
        phoneColumns: ['opened', 'resolved'],
      },
      {
        table: 'byPriority',
        total: 'All priorities',
        title: 'Did each priority get its first reply in time?',
        caption: 'Tickets opened in the period by priority, and their first replies',
        rows: 'Priority',
        columns: [
          { key: 'opened', label: 'Opened', unit: 'count' },
          { key: 'met', label: 'On time', unit: 'count' },
          { key: 'breached', label: 'Late', unit: 'count' },
          { key: 'firstResponseSla', label: 'On-time share', unit: 'share' },
        ],
        chart: { measure: 'First replies on time, by priority', columns: ['firstResponseSla'], orientation: 'horizontal' },
        phoneColumns: ['firstResponseSla'],
        labels: { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' },
      },
      {
        table: 'resolutionBands',
        total: 'Tickets resolved',
        title: 'How long did resolution take?',
        caption: 'Tickets resolved in the period by business time to resolution',
        rows: 'Resolved within',
        columns: [{ key: 'resolved', label: 'Tickets', unit: 'count' }],
        chart: { measure: 'Tickets resolved by time to resolve', columns: ['resolved'] },
        phoneColumns: ['resolved'],
        labels: {
          'under-4h': 'Under 4 hours',
          '4-8h': '4 to 8 hours',
          '1-3d': '1 to 3 business days',
          '3-5d': '3 to 5 business days',
          'over-5d': 'Over 5 business days',
        },
        note: 'A business day is ten hours of the support calendar (§68.3).',
      },
      {
        table: 'byCategory',
        title: 'Which kinds of request escalate?',
        total: 'All categories',
        caption: 'Tickets opened in the period by category, and how many were escalated',
        rows: 'Category',
        columns: [
          { key: 'opened', label: 'Opened', unit: 'count' },
          { key: 'escalated', label: 'Escalated', unit: 'count' },
        ],
        chart: { measure: 'Tickets opened and escalated, by category', columns: ['opened', 'escalated'], kinds: ['bar', 'bar'], orientation: 'horizontal' },
        phoneColumns: ['opened', 'escalated'],
        labels: CATEGORY_LABEL,
      },
    ],
  },
};
