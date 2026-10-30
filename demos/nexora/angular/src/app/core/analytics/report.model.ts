import type {
  ReportAnswer,
  ReportComparison,
  ReportDoor,
  ReportFigure,
  ReportKey,
  ReportList,
  ReportQuery,
  ReportRange,
  ReportRecords,
  ReportValue,
  ReportWithheld,
} from '@slotted/demo-nexora-backend';

import { doorParams } from '../backend/door';
import { formatDate } from '../catalog/catalog.model';

export type {
  ReportAnswer,
  ReportComparison,
  ReportDoor,
  ReportFigure,
  ReportKey,
  ReportQuery,
  ReportRange,
  ReportRecords,
  ReportValue,
  ReportWithheld,
};

export const ANALYTICS_ROUTE = '/analytics';
export const reportRoute = (key: ReportKey): string => `${ANALYTICS_ROUTE}/${key}`;

/**
 * The periods a report offers, each ending today on the demo clock (§25). A
 * period the backend does not keep the report's records for is not offered
 * (§75.4): the control lists the ones `coverage` reaches.
 */
export type PeriodKey = '7d' | '30d' | '90d' | '12m' | '24m';

export const PERIODS: readonly { key: PeriodKey; label: string; days: number }[] = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '12m', label: 'Last 12 months', days: 365 },
  { key: '24m', label: 'Last 24 months', days: 730 },
];

export const DEFAULT_PERIOD: PeriodKey = '30d';
export const DEFAULT_COMPARISON: ReportComparison = 'previous';

export const COMPARISONS: readonly { key: ReportComparison; label: string }[] = [
  // The field says "Compared with": an option is the rest of that sentence, short enough to stand whole.
  { key: 'previous', label: 'The period before' },
  { key: 'year', label: 'A year earlier' },
  { key: 'none', label: 'Nothing' },
];

export function addDays(iso: string, days: number): string {
  const at = new Date(`${iso}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

export const periodOf = (key: PeriodKey) => PERIODS.find((period) => period.key === key) ?? PERIODS[1]!;

/** The first and last days of a period ending today. */
export function periodRange(key: PeriodKey, today: string): { from: string; to: string } {
  return { from: addDays(today, -(periodOf(key).days - 1)), to: today };
}

/** The segment filters a report accepts, as the address names them and the backend reads them. */
export type ReportFilterKey = 'region' | 'segment' | 'warehouseId' | 'categoryId' | 'ownerId';

export const FILTER_PARAM: Record<ReportFilterKey, string> = {
  region: 'region',
  segment: 'segment',
  warehouseId: 'warehouse',
  categoryId: 'category',
  ownerId: 'owner',
};

export const FILTER_LABEL: Record<ReportFilterKey, string> = {
  region: 'Region',
  segment: 'Segment',
  warehouseId: 'Warehouse',
  categoryId: 'Category',
  ownerId: 'Representative',
};

/** What a report's address holds: the period, its comparison and the filters, each a parameter. */
export interface ReportChoice {
  readonly period: PeriodKey;
  readonly compare: ReportComparison;
  readonly filters: Partial<Record<ReportFilterKey, string>>;
}

export function readChoice(params: { get(name: string): string | null }): ReportChoice {
  const period = params.get('period');
  const compare = params.get('compare');
  const filters: Partial<Record<ReportFilterKey, string>> = {};
  for (const [key, param] of Object.entries(FILTER_PARAM) as [ReportFilterKey, string][]) {
    const value = params.get(param);
    if (value) filters[key] = value;
  }
  return {
    period: PERIODS.some((entry) => entry.key === period) ? (period as PeriodKey) : DEFAULT_PERIOD,
    compare: COMPARISONS.some((entry) => entry.key === compare)
      ? (compare as ReportComparison)
      : DEFAULT_COMPARISON,
    filters,
  };
}

export function choiceParams(choice: ReportChoice): Record<string, string> {
  const params: Record<string, string> = { period: choice.period, compare: choice.compare };
  for (const [key, value] of Object.entries(choice.filters) as [ReportFilterKey, string][])
    if (value) params[FILTER_PARAM[key]] = value;
  return params;
}

export function reportQuery(choice: ReportChoice, today: string): ReportQuery {
  return {
    ...periodRange(choice.period, today),
    compare: choice.compare,
    ...(choice.filters as ReportQuery),
  };
}

/** The periods a report can offer: those whose first day its records are kept from. */
export function offeredPeriods(
  today: string,
  keptFrom: string | null,
): readonly { key: PeriodKey; label: string; days: number }[] {
  if (keptFrom === null) return PERIODS;
  return PERIODS.filter((period) => periodRange(period.key, today).from >= keptFrom);
}

// ---------------------------------------------------------------------------
// Words

const date = (iso: string) => formatDate(`${iso}T12:00:00Z`);
const shortDate = (iso: string) => date(iso).replace(/, \d{4}$/, '');

/** "6 Aug – 4 Sep 2026", or one day. */
export function rangeWords(range: { from: string; to: string }): string {
  if (range.from === range.to) return date(range.from);
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  return `${sameYear ? shortDate(range.from) : date(range.from)} – ${date(range.to)}`;
}

/** The base a change is read against, said once per figure: "the 30 days before". */
export function comparisonWords(answer: Pick<ReportAnswer, 'comparison' | 'period'>): string {
  const comparison = answer.comparison;
  if (comparison === null) return '';
  const before = comparison.to < answer.period.from && addDays(comparison.to, 1) === answer.period.from;
  return before ? `the ${days(comparison.days)} before` : `${rangeWords(comparison)}, a year earlier`;
}

const days = (count: number) => `${count.toLocaleString('en-US')} ${count === 1 ? 'day' : 'days'}`;

/** A bucket's name on an axis and in a table. */
export function bucketLabel(range: ReportRange, grain: ReportAnswer['grain'], phone = false): string {
  if (grain === 'month') {
    const at = new Date(`${range.from}T12:00:00Z`);
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: phone ? '2-digit' : 'numeric' }).format(at);
  }
  if (grain === 'day') return phone ? `${Number(range.from.slice(5, 7))}/${Number(range.from.slice(8))}` : shortDate(range.from);
  // A week is named by its first day; a short first week says so by its range.
  return phone ? `${Number(range.from.slice(5, 7))}/${Number(range.from.slice(8))}` : range.days === 7 ? `Week of ${shortDate(range.from)}` : rangeWords(range);
}

// ---------------------------------------------------------------------------
// Units and numbers

/**
 * How a measure is counted. `usd` is minor units of US dollars (§72.1);
 * `share` is basis points; `minutes` are business minutes (§68.3); `score` is
 * a satisfaction score out of five; `turns` a yearly rate.
 */
export type ReportUnit = 'usd' | 'count' | 'share' | 'days' | 'minutes' | 'score' | 'turns' | 'cubic';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const tenth = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

/** A business duration in the words CV-02 uses: hours and minutes, or days of ten business hours. */
export function businessTime(minutes: number): string {
  if (minutes < 60) return `${whole.format(minutes)} min`;
  if (minutes < 600) {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes - hours * 60);
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  }
  const days = Math.round((minutes / 600) * 10) / 10;
  return `${tenth.format(days)} ${days === 1 ? 'business day' : 'business days'}`;
}

/** A value in its unit, the way a table and a figure write it. */
export function formatValue(value: number, unit: ReportUnit): string {
  switch (unit) {
    case 'usd':
      return money.format(value / 100);
    case 'count':
      return whole.format(value);
    case 'share':
      return `${tenth.format(value / 100)}%`;
    case 'days':
      return `${whole.format(value)} ${value === 1 ? 'day' : 'days'}`;
    case 'minutes':
      return businessTime(value);
    case 'score':
      return `${tenth.format(value)} of 5`;
    case 'turns':
      return `${tenth.format(value)} a year`;
    case 'cubic':
      return `${whole.format(value)} m³`;
  }
}

/** The value as a chart plots it: dollars, percent, days, hours, the rest as counted. */
export function plotted(value: number, unit: ReportUnit): number {
  if (unit === 'usd') return value / 100;
  if (unit === 'share') return value / 100;
  if (unit === 'minutes') return value / 60;
  return value;
}

/** The axis' unit, said in its label. */
export const AXIS_LABEL: Record<ReportUnit, string> = {
  usd: 'US dollars',
  count: 'Count',
  share: 'Percent',
  days: 'Days',
  minutes: 'Business hours',
  score: 'Score out of 5',
  turns: 'Turns a year',
  cubic: 'Cubic metres',
};

/**
 * The change from the comparison: a fraction for amounts and counts, which the
 * card reads as a percentage; a difference in the unit's own points for shares,
 * days, minutes and scores, where a percentage of a percentage misleads.
 */
export function change(
  figure: Pick<ReportFigure, 'value' | 'previous'>,
  unit: ReportUnit,
): { kind: 'relative' | 'points'; value: number } | null {
  const now = figure.value;
  const before = figure.previous?.value;
  if (now === null || before === null || before === undefined) return null;
  if (unit === 'usd' || unit === 'count') return before === 0 ? null : { kind: 'relative', value: (now - before) / before };
  return { kind: 'points', value: now - before };
}

export function changeWords(delta: { kind: 'relative' | 'points'; value: number }, unit: ReportUnit): string {
  const sign = delta.value > 0 ? '+' : delta.value < 0 ? '−' : '';
  const size = Math.abs(delta.value);
  if (delta.kind === 'relative') return `${sign}${tenth.format(size * 100)}%`;
  if (unit === 'share') return `${sign}${tenth.format(size / 100)} pts`;
  return `${sign}${formatValue(size, unit)}`;
}

// ---------------------------------------------------------------------------
// Doors

export const LIST_ROUTE: Record<ReportList, string> = {
  orders: '/sales/orders',
  quotes: '/sales/quotes',
  invoices: '/finance/invoices',
  'credit-memos': '/finance/invoices/credit-memos',
  payments: '/finance/payments',
  tickets: '/support/inbox',
  stock: '/inventory/stock',
  movements: '/inventory/movements',
  transfers: '/inventory/transfers',
  'purchase-orders': '/procurement/purchase-orders',
};

/** The permission the list a door opens asks for: a door the reader cannot follow is not drawn. */
export const LIST_PERMISSION: Record<ReportList, string> = {
  orders: 'orders.view',
  quotes: 'quotes.view',
  invoices: 'invoices.view',
  'credit-memos': 'credit_memos.view',
  payments: 'payments.view',
  tickets: 'support.view',
  stock: 'inventory.view',
  movements: 'inventory.view',
  transfers: 'inventory.view',
  'purchase-orders': 'purchase_orders.view',
};

export interface DoorLink {
  readonly route: string;
  readonly params: Record<string, string>;
}

/** The link a door is: the list and its condition in the address, with the names the answer gave. */
export function doorLink(door: ReportDoor, labels: Readonly<Record<string, string>>): DoorLink {
  return { route: LIST_ROUTE[door.list], params: doorParams(door.filter, labels) };
}

// ---------------------------------------------------------------------------
// Who holds a permission

const ROLE_WORD: Record<string, string> = {
  administrator: 'an administrator',
  executive: 'an executive',
  sales_manager: 'a sales manager',
  sales_representative: 'a sales representative',
  finance_manager: 'a finance manager',
  accountant: 'an accountant',
  procurement_manager: 'a procurement manager',
  buyer: 'a buyer',
  warehouse_manager: 'a warehouse manager',
  warehouse_operator: 'a warehouse operator',
  support_manager: 'a support manager',
  support_agent: 'a support agent',
  auditor: 'an auditor',
};

/** "an executive, a sales manager or an administrator": the roles, the administrator last. */
export function holderWords(roles: readonly string[]): string {
  const ordered = [...roles.filter((role) => role !== 'administrator'), ...roles.filter((role) => role === 'administrator')];
  const words = ordered.map((role) => ROLE_WORD[role] ?? role);
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`;
}

export const RECORDS_WORD: Record<ReportRecords, string> = {
  orders: 'orders',
  'order-lines': 'order lines and owners',
  invoices: 'invoices and credit memos',
  payments: 'payments',
  quotes: 'quotes',
  tickets: 'tickets',
  movements: 'stock movements',
  transfers: 'transfers',
  'purchase-orders': 'purchase orders and receipts',
  positions: 'stock positions',
};

export { date as dateWords };
