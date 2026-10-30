import {
  NexoraApiError,
  ROLE_DEFINITIONS,
  addDays,
  addMoney,
  businessDateOf,
  businessMinutesBetween,
  compareDates,
  dayNumber,
  diffDays,
  lastBusinessDayOfMonth,
  parseBusinessDate,
  quantityToMilli,
  roundHalfUp,
  subtractMoney,
  usdMinor,
  type CustomerSegment,
  type PaymentMethod,
  type RegionCode,
  type RoleKey,
  type SupportTicket,
} from '../../domain';
import { purchaseOrderWindowStart } from '../../data/seed/procurement';
import type { FilterValue } from '../query';
import type { ApiRuntime } from '../runtime';
import { SCENARIOS } from '../scenarios';
import { purchaseOrderReceivedOn } from './procurement';
import type { OrderListItem, SalesReadModels } from './sales';
import { refreshTicketSla } from './support';

/**
 * Section 16's six report types, each a read over a chosen period and against
 * another of the same length (section 72's definitions, in US dollars at each
 * document's own rate, section 72.1).
 *
 * Every figure, every bucket of a series and every row of a breakdown carries
 * the list that counts it (`door`): the list resource and the filter that
 * selects the same records under the same condition. The value is computed
 * from those records only, so the list opened with the door holds the
 * figure's records and adds up to it (`api.test.ts`, "reports").
 *
 * The backend keeps every order of the logical history and every other record
 * from the operational window on (section 75.4). A measure whose records are
 * not kept for the whole period is answered `missing: 'not-kept'`, never as a
 * zero; `coverage` says from which date each kind of record is kept.
 */

export type ReportKey = 'executive' | 'sales' | 'inventory' | 'procurement' | 'finance' | 'support';
export type ReportComparison = 'previous' | 'year' | 'none';
export type ReportGrain = 'day' | 'week' | 'month';

/** The kinds of record a report reads, each kept from its own date (section 75.4). */
export type ReportRecords =
  | 'orders'
  | 'order-lines'
  | 'invoices'
  | 'payments'
  | 'quotes'
  | 'tickets'
  | 'movements'
  | 'transfers'
  | 'purchase-orders'
  | 'positions';

/** The list pages a door opens. */
export type ReportList =
  | 'orders'
  | 'invoices'
  | 'credit-memos'
  | 'payments'
  | 'quotes'
  | 'tickets'
  | 'stock'
  | 'movements'
  | 'transfers'
  | 'purchase-orders';

export interface ReportQuery {
  /** First and last business dates of the period, inclusive; the last 30 days to today by default. */
  from?: string;
  to?: string;
  /** The period compared with: the one before it, the same weeks a year earlier, or none. */
  compare?: ReportComparison;
  region?: RegionCode;
  segment?: CustomerSegment;
  warehouseId?: string;
  categoryId?: string;
  ownerId?: string;
}

export interface ReportRange {
  from: string;
  to: string;
  days: number;
}

/** A list and the filter that selects the records a value counts (OV-01). */
export interface ReportDoor {
  list: ReportList;
  filter: Record<string, FilterValue>;
}

export interface ReportValue {
  /** USD minor units, basis points, a count, days or minutes, as the measure's unit says; null when missing. */
  value: number | null;
  /**
   * `not-kept`: the records are not kept for the range; `no-base`: a ratio over
   * nothing; `not-recorded`: `count` of the `of` records lack the field the measure reads.
   */
  missing?: 'not-kept' | 'no-base' | 'not-recorded';
  /** The records the value is computed over: the total of the list the door opens. */
  count?: number;
  of?: number;
  door?: ReportDoor;
}

export interface ReportFigure extends ReportValue {
  key: string;
  /** A flow over the period, or a state as of today. */
  basis: 'period' | 'today';
  records: ReportRecords;
  /** The comparison period's value; absent when no comparison is asked or the figure is a state. */
  previous?: ReportValue;
}

export interface ReportRow {
  key: string;
  label: string;
  /** The bucket a row of a series stands for. */
  range?: ReportRange;
  cells: Record<string, ReportValue>;
}

export interface ReportTable {
  key: string;
  records: ReportRecords;
  rows: ReportRow[];
  /** The row that adds the rows back up (RP-07), where they decompose a whole. */
  total?: ReportRow;
  /** The table's records are not kept for the whole period. */
  missing?: 'not-kept';
}

/**
 * A value outside the band its own history draws: the mean of the earlier
 * samples plus or minus two standard deviations, never narrower than one unit
 * either side. `against` says which history: the six periods of the same
 * length before the period, or the earlier buckets of the period's own series.
 */
export interface ReportAnomaly {
  key: string;
  report: ReportKey;
  measure: string;
  against: 'periods' | 'buckets';
  value: number;
  low: number;
  high: number;
  direction: 'above' | 'below';
  samples: number;
  range: ReportRange;
  door?: ReportDoor;
}

/** A fact of the domain dated inside the period: never a sentence of the report's own. */
export interface ReportAnnotation {
  date: string;
  kind: 'scenario' | 'month-end' | 'records-kept';
  label: string;
}

/** What a permission withholds from the answer (PM-01, PM-02): the parts left out and who holds it. */
export interface ReportWithheld {
  permission: string;
  roles: RoleKey[];
  parts: string[];
}

export interface ReportOption {
  value: string;
  label: string;
}

export interface ReportAnswer {
  report: ReportKey;
  asOf: string;
  today: string;
  period: ReportRange;
  comparison: ReportRange | null;
  grain: ReportGrain;
  buckets: ReportRange[];
  /** First business date from which each kind of record the report reads is kept. */
  coverage: Partial<Record<ReportRecords, string>>;
  /** The filters applied, and the values each filter the report accepts can take. */
  filters: Omit<ReportQuery, 'from' | 'to' | 'compare'>;
  options: Partial<
    Record<'region' | 'segment' | 'warehouseId' | 'categoryId' | 'ownerId', ReportOption[]>
  >;
  figures: ReportFigure[];
  tables: ReportTable[];
  anomalies: ReportAnomaly[];
  annotations: ReportAnnotation[];
  withheld: ReportWithheld[];
  /** The name of every record a door's filter names by id, so a list can say it in its pills. */
  labels: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Period, buckets and coverage

const BUSINESS_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** The longest period a report reads: the 24 months of section 75.3 and a day. */
const LONGEST_PERIOD_DAYS = 731;
/** Section 72.4: an order counts once confirmed, and stops counting when cancelled. */
const BOOKED_STATUSES = ['confirmed', 'on_hold', 'closed'] as const;
/** Section 72.2: an invoice counts once opened, and a written-off one stays revenue. */
const REVENUE_LIFECYCLES = ['open', 'written_off'] as const;
const MEMO_LIFECYCLES = ['open', 'fully_applied'] as const;
/** The earlier periods of the same length a figure's band is drawn from. */
const BAND_PERIODS = 6;
/** The fewest earlier buckets a series' band is drawn from. */
const BAND_BUCKETS = 3;
const TOP_ROWS = 10;

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  strategic: 'Strategic',
  enterprise: 'Enterprise',
  mid_market: 'Mid-market',
  smb: 'SMB',
};
const REGION_LABEL: Record<RegionCode, string> = { US: 'United States', BR: 'Brazil' };

const rangeOf = (from: string, to: string): ReportRange => ({
  from,
  to,
  days: diffDays(to, from) + 1,
});

function invalid(field: string, message: string): NexoraApiError {
  return new NexoraApiError('VALIDATION_FAILED', message, {
    fieldErrors: [{ field, code: 'invalid', message }],
  });
}

interface Frame {
  runtime: ApiRuntime;
  today: string;
  period: ReportRange;
  comparison: ReportRange | null;
  grain: ReportGrain;
  buckets: ReportRange[];
  coverage: Record<ReportRecords, string>;
  query: ReportQuery;
  access: Access;
  /** What one request reads more than once, read once (`once`). */
  memo: Map<string, unknown>;
}

function once<T>(frame: Frame, key: string, build: () => T): T {
  if (!frame.memo.has(key)) frame.memo.set(key, build());
  return frame.memo.get(key) as T;
}

/** The business day of an instant, cached by its hour: the time zone is the organization's, and fixed. */
const dayByHour = new Map<string, string>();
function businessDay(instant: string): string {
  const hour = instant.slice(0, 13);
  let day = dayByHour.get(hour);
  if (day === undefined) {
    day = businessDateOf(`${hour}:00:00Z`);
    dayByHour.set(hour, day);
  }
  return day;
}

function bucketsOf(period: ReportRange, grain: ReportGrain): ReportRange[] {
  const buckets: ReportRange[] = [];
  if (grain === 'day') {
    for (let date = period.from; compareDates(date, period.to) <= 0; date = addDays(date, 1))
      buckets.push(rangeOf(date, date));
    return buckets;
  }
  if (grain === 'week') {
    // Weeks end on the period's last day, so the last bucket is a whole week and the first may be short.
    for (let end = period.to; compareDates(end, period.from) >= 0; end = addDays(end, -7)) {
      const start = addDays(end, -6);
      buckets.unshift(rangeOf(compareDates(start, period.from) < 0 ? period.from : start, end));
    }
    return buckets;
  }
  let start = period.from;
  while (compareDates(start, period.to) <= 0) {
    const { year, month } = parseBusinessDate(start);
    const next =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const end = compareDates(addDays(next, -1), period.to) > 0 ? period.to : addDays(next, -1);
    buckets.push(rangeOf(start, end));
    start = next;
  }
  return buckets;
}

/** Section 75.4: every order of the history, and every other record from the operational window. */
export function reportCoverage(runtime: ApiRuntime): Record<ReportRecords, string> {
  const context = runtime.store.seed.context;
  const window = context.operationalStart;
  return {
    orders: context.historyStart,
    'order-lines': window,
    invoices: window,
    payments: window,
    quotes: window,
    tickets: window,
    movements: window,
    transfers: window,
    'purchase-orders': purchaseOrderWindowStart(context),
    positions: runtime.store.today,
  };
}

function resolveFrame(runtime: ApiRuntime, query: ReportQuery): Frame {
  runtime.require('analytics.view');
  const today = runtime.store.today;
  const historyStart = runtime.store.seed.context.historyStart;
  const to = query.to ?? today;
  const from = query.from ?? addDays(to, -29);
  if (!BUSINESS_DATE.test(from)) throw invalid('from', 'from is a business date, YYYY-MM-DD');
  if (!BUSINESS_DATE.test(to)) throw invalid('to', 'to is a business date, YYYY-MM-DD');
  if (compareDates(from, to) > 0) throw invalid('from', 'from is after to');
  if (compareDates(to, today) > 0) throw invalid('to', `to is after today, ${today}`);
  if (compareDates(from, historyStart) < 0)
    throw invalid('from', `from precedes the history Nexora keeps, which starts ${historyStart}`);
  const period = rangeOf(from, to);
  if (period.days > LONGEST_PERIOD_DAYS)
    throw invalid('from', `a period is at most ${LONGEST_PERIOD_DAYS} days`);
  const compare = query.compare ?? 'previous';
  if (compare !== 'previous' && compare !== 'year' && compare !== 'none')
    throw invalid('compare', 'compare is previous, year or none');
  // A year earlier is 52 weeks earlier: the same length and the same weekdays.
  const comparison =
    compare === 'none'
      ? null
      : compare === 'previous'
        ? rangeOf(addDays(from, -period.days), addDays(from, -1))
        : rangeOf(addDays(from, -364), addDays(to, -364));
  const grain: ReportGrain = period.days <= 14 ? 'day' : period.days <= 92 ? 'week' : 'month';
  return {
    runtime,
    today,
    period,
    comparison,
    grain,
    buckets: bucketsOf(period, grain),
    coverage: reportCoverage(runtime),
    query,
    access: new Access(runtime),
    memo: new Map(),
  };
}

const keptFor = (frame: Frame, records: ReportRecords, range: ReportRange): boolean =>
  compareDates(range.from, frame.coverage[records]) >= 0;

/** The six periods of the period's length before it, oldest first. */
function earlierPeriods(period: ReportRange): ReportRange[] {
  return Array.from({ length: BAND_PERIODS }, (_, index) => {
    const end = addDays(period.from, -1 - (BAND_PERIODS - 1 - index) * period.days);
    return rangeOf(addDays(end, -(period.days - 1)), end);
  });
}

// ---------------------------------------------------------------------------
// Permissions

const ROLE_ORDER = ROLE_DEFINITIONS.map((role) => role.key);

/** The roles whose grants hold a permission, in the seed's role order. */
export function rolesHolding(permission: string): RoleKey[] {
  return ROLE_DEFINITIONS.filter((role) =>
    role.grants.some((grant) => grant.permission === permission),
  )
    .map((role) => role.key)
    .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
}

/** Decides each part from the reader's permissions and keeps what it left out, once per permission. */
class Access {
  private readonly left = new Map<string, Set<string>>();

  constructor(private readonly runtime: ApiRuntime) {}

  /** Every permission held; each one missing withholds the part. */
  allows(part: string, ...permissions: string[]): boolean {
    let allowed = true;
    for (const permission of permissions) {
      if (this.runtime.can(permission)) continue;
      allowed = false;
      const parts = this.left.get(permission) ?? new Set<string>();
      parts.add(part);
      this.left.set(permission, parts);
    }
    return allowed;
  }

  withheld(): ReportWithheld[] {
    return [...this.left.entries()].map(([permission, parts]) => ({
      permission,
      roles: rolesHolding(permission),
      parts: [...parts],
    }));
  }
}

// ---------------------------------------------------------------------------
// Values, bands and doors

const between = (range: ReportRange): FilterValue => ({ gte: range.from, lte: range.to });

const inRange = (date: string, range: ReportRange): boolean =>
  compareDates(date, range.from) >= 0 && compareDates(date, range.to) <= 0;

const ratio = (part: number, whole: number): number | null =>
  whole === 0 ? null : roundHalfUp((part / whole) * 10_000);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : roundHalfUp(((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2);
}

function value(
  amount: number | null,
  count: number,
  door: ReportDoor | undefined,
  kept = true,
): ReportValue {
  if (!kept) return { value: null, missing: 'not-kept' };
  return {
    value: amount,
    ...(amount === null ? { missing: 'no-base' as const } : {}),
    count,
    ...(door ? { door } : {}),
  };
}

/**
 * Mean ± two standard deviations of the samples. A count is never given a band
 * narrower than its own chance variation, two square roots of its mean: a few
 * samples of a count that happened to agree would otherwise flag ordinary noise.
 */
function band(samples: number[], count: boolean): { low: number; high: number } {
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const variance =
    samples.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) /
    Math.max(1, samples.length - 1);
  const half = Math.max(2 * Math.sqrt(variance), count ? 2 * Math.sqrt(Math.max(mean, 1)) : 1);
  return { low: Math.max(0, roundHalfUp(mean - half)), high: roundHalfUp(mean + half) };
}

function outside(
  report: ReportKey,
  measure: string,
  against: ReportAnomaly['against'],
  current: number,
  samples: number[],
  range: ReportRange,
  count: boolean,
  door?: ReportDoor,
): ReportAnomaly | null {
  if (samples.length < (against === 'periods' ? BAND_PERIODS : BAND_BUCKETS)) return null;
  const { low, high } = band(samples, count);
  if (current >= low && current <= high) return null;
  return {
    key: `${report}.${measure}`,
    report,
    measure,
    against,
    value: current,
    low,
    high,
    direction: current > high ? 'above' : 'below',
    samples: samples.length,
    range,
    ...(door ? { door } : {}),
  };
}

/** The last bucket of a count's series against the earlier ones, where every bucket's records are kept. */
function bucketAnomaly(
  frame: Frame,
  report: ReportKey,
  measure: string,
  records: ReportRecords,
  values: number[],
  door: (range: ReportRange) => ReportDoor,
): ReportAnomaly | null {
  const buckets = frame.buckets;
  if (buckets.length < BAND_BUCKETS + 1) return null;
  const last = buckets[buckets.length - 1] as ReportRange;
  // A short first bucket would draw the band low; only whole buckets are samples.
  const samples: number[] = [];
  buckets.slice(0, -1).forEach((bucket, index) => {
    if (bucket.days === last.days && keptFor(frame, records, bucket))
      samples.push(values[index] as number);
  });
  if (!keptFor(frame, records, last)) return null;
  return outside(
    report,
    measure,
    'buckets',
    values[values.length - 1] as number,
    samples,
    last,
    true,
    door(last),
  );
}

// ---------------------------------------------------------------------------
// Annotations

function annotations(frame: Frame, records: readonly ReportRecords[]): ReportAnnotation[] {
  const { runtime, period } = frame;
  const notes: ReportAnnotation[] = [];
  const applied = runtime.store.metadata.scenarioAppliedOn;
  const scenario = SCENARIOS.find((entry) => entry.id === runtime.store.metadata.scenarioId);
  if (applied && scenario && scenario.structural && inRange(applied, period))
    notes.push({ date: applied, kind: 'scenario', label: scenario.name });
  // The window opens inside a long period: before it, only orders are kept.
  const window = runtime.store.seed.context.operationalStart;
  if (
    records.some((kind) => kind !== 'orders' && kind !== 'positions') &&
    compareDates(window, period.from) > 0 &&
    inRange(window, period)
  )
    notes.push({ date: window, kind: 'records-kept', label: 'Records kept from here' });
  if (frame.grain !== 'month') {
    const first = parseBusinessDate(period.from);
    for (let year = first.year, month = first.month; ;) {
      const last = lastBusinessDayOfMonth(year, month);
      if (compareDates(last, period.to) > 0) break;
      if (compareDates(last, period.from) >= 0)
        notes.push({ date: last, kind: 'month-end', label: 'Month end' });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  }
  return notes.sort((a, b) => compareDates(a.date, b.date));
}

// ---------------------------------------------------------------------------
// Orders: both tiers, as the order list reads them

/** What a report reads of an order row: the order list's own fields, for both tiers. */
type OrderFact = Pick<
  OrderListItem,
  | 'id'
  | 'customerId'
  | 'customerSegment'
  | 'regionCode'
  | 'ownerId'
  | 'defaultWarehouseId'
  | 'status'
  | 'riskFlags'
  | 'cycleDays'
  | 'historical'
>;

interface OrderFacts {
  rows: OrderFact[];
  day: Int32Array;
  /** USD minor: booked value, net merchandise, and margin on it (section 72.3's base on orders). */
  net: Float64Array;
  merchandise: Float64Array;
  margin: Float64Array;
  /** USD minor of line discounts; NaN for the historical tier, which keeps none. */
  discount: Float64Array;
  booked: Uint8Array;
}

const factsCache = new WeakMap<ApiRuntime, { facts: OrderFacts | undefined }>();

/**
 * The order list's rows, both tiers, with what a report sums over them: the
 * same status, date, account, owner and booked value the list derives
 * (`SalesReadModels`), without the fields only a list row draws. Rebuilt when
 * an order, a line, a shipment, a customer or a user changes.
 */
function orderFacts(runtime: ApiRuntime, models: SalesReadModels): OrderFacts {
  let holder = factsCache.get(runtime);
  if (!holder) {
    const created = { facts: undefined as OrderFacts | undefined };
    holder = created;
    factsCache.set(runtime, created);
    runtime.store.subscribe((collection) => {
      if (
        collection === 'salesOrders' ||
        collection === 'salesOrderLines' ||
        collection === 'shipments' ||
        collection === 'customers' ||
        collection === 'users'
      )
        created.facts = undefined;
    });
  }
  if (holder.facts) return holder.facts;
  const { store } = runtime;
  const rows: OrderFact[] = [];
  const day: number[] = [];
  const net: number[] = [];
  const merchandise: number[] = [];
  const margin: number[] = [];
  const discount: number[] = [];
  for (const order of store.dataset.salesOrders.values()) {
    const customer = store.dataset.customers.get(order.customerId);
    const cycleDays = models.cycleDaysOf(order);
    rows.push({
      id: order.id,
      customerId: order.customerId,
      customerSegment: customer?.segment ?? 'smb',
      regionCode: customer?.regionCode ?? 'US',
      ownerId: order.ownerId,
      defaultWarehouseId: order.defaultWarehouseId,
      status: order.status,
      riskFlags: order.riskFlags,
      historical: false,
      ...(cycleDays !== undefined ? { cycleDays } : {}),
    });
    day.push(dayNumber(order.orderDate));
    net.push(usdMinor(addMoney(order.subtotal, order.freight), order.fxRateToUsd));
    merchandise.push(usdMinor(order.subtotal, order.fxRateToUsd));
    margin.push(usdMinor(subtractMoney(order.subtotal, order.costTotal), order.fxRateToUsd));
    discount.push(usdMinor(order.discountTotal, order.fxRateToUsd));
  }
  for (const summary of store.history.summaries) {
    if (!store.history.skeletons[summary.index]) continue;
    const customer = store.dataset.customers.get(summary.customerId);
    const rate = Number(summary.fxRateToUsd);
    rows.push({
      id: store.historicalOrderId(summary.index),
      customerId: summary.customerId,
      customerSegment: customer?.segment ?? 'smb',
      regionCode: customer?.regionCode ?? 'US',
      ownerId: customer?.accountOwnerId ?? '',
      defaultWarehouseId: store.history.skeletons[summary.index]?.warehouseId ?? '',
      status: summary.kind === 'cancelled' ? 'cancelled' : 'closed',
      riskFlags: [],
      historical: true,
    });
    day.push(dayNumber(summary.orderDate));
    net.push(roundHalfUp((summary.subtotalMinor + summary.freightMinor) * rate));
    merchandise.push(roundHalfUp(summary.subtotalMinor * rate));
    margin.push(roundHalfUp((summary.subtotalMinor - summary.costMinor) * rate));
    // The historical tier keeps no lines, and so no discount.
    discount.push(Number.NaN);
  }
  // In day order, so a range is read from its first day to its last and no further.
  const order = Array.from(rows, (_, index) => index).sort(
    (a, b) => (day[a] as number) - (day[b] as number),
  );
  const facts: OrderFacts = {
    rows: order.map((index) => rows[index] as OrderFact),
    day: Int32Array.from(order, (index) => day[index] as number),
    net: Float64Array.from(order, (index) => net[index] as number),
    merchandise: Float64Array.from(order, (index) => merchandise[index] as number),
    margin: Float64Array.from(order, (index) => margin[index] as number),
    discount: Float64Array.from(order, (index) => discount[index] as number),
    booked: Uint8Array.from(order, (index) =>
      (BOOKED_STATUSES as readonly string[]).includes((rows[index] as OrderFact).status) ? 1 : 0,
    ),
  };
  holder.facts = facts;
  return facts;
}

/** The order list's filter for orders booked in a range, narrowed by the report's filters. */
function bookedFilter(range: ReportRange, query: ReportQuery): Record<string, FilterValue> {
  return {
    orderDate: between(range),
    status: { in: [...BOOKED_STATUSES] },
    ...(query.region ? { regionCode: { in: [query.region] } } : {}),
    ...(query.segment ? { customerSegment: { in: [query.segment] } } : {}),
    ...(query.ownerId ? { ownerId: query.ownerId } : {}),
  };
}

const ordersDoor = (filter: Record<string, FilterValue>): ReportDoor => ({
  list: 'orders',
  filter,
});

/** Indexes of booked orders in a range under the report's filters. */
function bookedIn(facts: OrderFacts, range: ReportRange, query: ReportQuery): number[] {
  const first = dayNumber(range.from);
  const last = dayNumber(range.to);
  const picked: number[] = [];
  let low = 0;
  let high = facts.rows.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((facts.day[middle] as number) < first) low = middle + 1;
    else high = middle;
  }
  for (let index = low; index < facts.rows.length; index += 1) {
    const day = facts.day[index] as number;
    if (day > last) break;
    if (facts.booked[index] === 0) continue;
    const row = facts.rows[index] as OrderFact;
    if (query.region && row.regionCode !== query.region) continue;
    if (query.segment && row.customerSegment !== query.segment) continue;
    if (query.ownerId && row.ownerId !== query.ownerId) continue;
    picked.push(index);
  }
  return picked;
}

const sumOf = (array: Float64Array, picked: number[]): number =>
  picked.reduce((sum, index) => sum + (array[index] as number), 0);

interface BookedTotals {
  orders: number;
  booked: number;
}

function bookedTotals(facts: OrderFacts, range: ReportRange, query: ReportQuery): BookedTotals {
  const picked = bookedIn(facts, range, query);
  return { orders: picked.length, booked: sumOf(facts.net, picked) };
}

/** Booked value, order count and average order value, each with its comparison and its door. */
function bookedFigures(frame: Frame, facts: OrderFacts): ReportFigure[] {
  const { period, comparison, query } = frame;
  const door = ordersDoor(bookedFilter(period, query));
  const now = bookedTotals(facts, period, query);
  const before = comparison ? bookedTotals(facts, comparison, query) : null;
  const beforeKept = comparison !== null && keptFor(frame, 'orders', comparison);
  const previousDoor = comparison ? ordersDoor(bookedFilter(comparison, query)) : undefined;
  const pair = (key: string, pick: (totals: BookedTotals) => number | null): ReportFigure => ({
    key,
    basis: 'period',
    records: 'orders',
    ...value(pick(now), now.orders, door),
    ...(comparison && before
      ? { previous: value(pick(before), before.orders, previousDoor, beforeKept) }
      : {}),
  });
  return [
    pair('bookedValue', (totals) => totals.booked),
    pair('orders', (totals) => totals.orders),
    pair('averageOrderValue', (totals) =>
      totals.orders === 0 ? null : roundHalfUp(totals.booked / totals.orders),
    ),
  ];
}

/** Section 72.3 on booked orders: margin over net merchandise, in basis points. */
function bookedMarginFigure(frame: Frame, facts: OrderFacts): ReportFigure {
  const { period, comparison, query } = frame;
  const of = (range: ReportRange): ReportValue => {
    const picked = bookedIn(facts, range, query);
    return value(
      ratio(sumOf(facts.margin, picked), sumOf(facts.merchandise, picked)),
      picked.length,
      ordersDoor(bookedFilter(range, query)),
      keptFor(frame, 'orders', range),
    );
  };
  return {
    key: 'bookedMargin',
    basis: 'period',
    records: 'orders',
    ...of(period),
    ...(comparison ? { previous: of(comparison) } : {}),
  };
}

/** Booked value and orders per bucket: a series of the period. */
function bookedTrend(frame: Frame, facts: OrderFacts, key = 'trend'): ReportTable {
  return {
    key,
    records: 'orders',
    rows: frame.buckets.map((bucket) => {
      const picked = bookedIn(facts, bucket, frame.query);
      const door = ordersDoor(bookedFilter(bucket, frame.query));
      return {
        key: bucket.from,
        label: bucket.from,
        range: bucket,
        cells: {
          bookedValue: value(sumOf(facts.net, picked), picked.length, door),
          orders: value(picked.length, picked.length, door),
        },
      };
    }),
  };
}

/** Booked value and orders by segment, now and in the comparison period. */
function segmentChanges(frame: Frame, facts: OrderFacts): ReportTable {
  const { period, comparison, query } = frame;
  const segments = (Object.keys(SEGMENT_LABEL) as CustomerSegment[]).filter(
    (segment) => !query.segment || segment === query.segment,
  );
  const cellsFor = (segment: CustomerSegment | undefined): Record<string, ReportValue> => {
    const scoped = { ...query, ...(segment ? { segment } : {}) };
    const now = bookedIn(facts, period, scoped);
    const cells: Record<string, ReportValue> = {
      bookedValue: value(
        sumOf(facts.net, now),
        now.length,
        ordersDoor(bookedFilter(period, scoped)),
      ),
      orders: value(now.length, now.length, ordersDoor(bookedFilter(period, scoped))),
    };
    if (comparison) {
      const before = bookedIn(facts, comparison, scoped);
      cells['previousBookedValue'] = value(
        sumOf(facts.net, before),
        before.length,
        ordersDoor(bookedFilter(comparison, scoped)),
        keptFor(frame, 'orders', comparison),
      );
    }
    return cells;
  };
  return {
    key: 'bySegment',
    records: 'orders',
    rows: segments.map((segment) => ({
      key: segment,
      label: SEGMENT_LABEL[segment],
      cells: cellsFor(segment),
    })),
    total: { key: 'total', label: 'All segments', cells: cellsFor(query.segment) },
  };
}

/** The ten accounts with the most booked value, the rest, and the whole (customer concentration). */
function accountRanking(frame: Frame, facts: OrderFacts, withMargin: boolean): ReportTable {
  const { period, query, runtime } = frame;
  const picked = bookedIn(facts, period, query);
  const byCustomer = new Map<string, number[]>();
  for (const index of picked) {
    const customerId = (facts.rows[index] as OrderFact).customerId;
    const bucket = byCustomer.get(customerId) ?? [];
    bucket.push(index);
    byCustomer.set(customerId, bucket);
  }
  const ranked = [...byCustomer.entries()]
    .map(([customerId, indexes]) => ({ customerId, indexes, booked: sumOf(facts.net, indexes) }))
    .sort((a, b) => b.booked - a.booked || a.customerId.localeCompare(b.customerId));
  const top = ranked.slice(0, TOP_ROWS);
  const rest = ranked.slice(TOP_ROWS).flatMap((entry) => entry.indexes);
  const whole = sumOf(facts.net, picked);
  const base = bookedFilter(period, query);
  const cells = (
    indexes: number[],
    filter: Record<string, FilterValue>,
  ): Record<string, ReportValue> => {
    const door = ordersDoor(filter);
    const booked = sumOf(facts.net, indexes);
    return {
      bookedValue: value(booked, indexes.length, door),
      orders: value(indexes.length, indexes.length, door),
      share: value(ratio(booked, whole), indexes.length, door),
      ...(withMargin
        ? {
            margin: value(
              ratio(sumOf(facts.margin, indexes), sumOf(facts.merchandise, indexes)),
              indexes.length,
              door,
            ),
          }
        : {}),
    };
  };
  const rows: ReportRow[] = top.map((entry) => ({
    key: entry.customerId,
    label: runtime.store.dataset.customers.get(entry.customerId)?.displayName ?? entry.customerId,
    cells: cells(entry.indexes, { ...base, customerId: entry.customerId }),
  }));
  if (rest.length > 0)
    rows.push({
      key: 'others',
      label: `${ranked.length - top.length} other accounts`,
      cells: cells(rest, { ...base, customerId: { not_in: top.map((entry) => entry.customerId) } }),
    });
  return {
    key: 'byAccount',
    records: 'orders',
    rows,
    total: { key: 'total', label: 'All accounts', cells: cells(picked, base) },
  };
}

function concentrationFigure(frame: Frame, facts: OrderFacts): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const picked = bookedIn(facts, range, frame.query);
    const byCustomer = new Map<string, number>();
    for (const index of picked) {
      const row = facts.rows[index] as OrderFact;
      byCustomer.set(
        row.customerId,
        (byCustomer.get(row.customerId) ?? 0) + (facts.net[index] as number),
      );
    }
    const ranked = [...byCustomer.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    const top = ranked.slice(0, TOP_ROWS);
    const share = ratio(
      top.reduce((sum, entry) => sum + entry[1], 0),
      sumOf(facts.net, picked),
    );
    return value(
      share,
      picked.filter((index) =>
        top.some((entry) => entry[0] === (facts.rows[index] as OrderFact).customerId),
      ).length,
      ordersDoor({
        ...bookedFilter(range, frame.query),
        customerId: { in: top.map((entry) => entry[0]) },
      }),
      keptFor(frame, 'orders', range),
    );
  };
  return {
    key: 'topAccountShare',
    basis: 'period',
    records: 'orders',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

function bookedAnomalies(frame: Frame, facts: OrderFacts, report: ReportKey): ReportAnomaly[] {
  const earlier = earlierPeriods(frame.period);
  if (!earlier.every((range) => keptFor(frame, 'orders', range))) return [];
  const now = bookedTotals(facts, frame.period, frame.query);
  const history = earlier.map((range) => bookedTotals(facts, range, frame.query));
  const door = ordersDoor(bookedFilter(frame.period, frame.query));
  return [
    outside(
      report,
      'bookedValue',
      'periods',
      now.booked,
      history.map((h) => h.booked),
      frame.period,
      false,
      door,
    ),
    outside(
      report,
      'orders',
      'periods',
      now.orders,
      history.map((h) => h.orders),
      frame.period,
      true,
      door,
    ),
  ].filter((anomaly): anomaly is ReportAnomaly => anomaly !== null);
}

// ---------------------------------------------------------------------------
// Invoices and credit memos (section 72.2, 72.3)

function customerFilter(query: ReportQuery): Record<string, FilterValue> {
  return {
    ...(query.region ? { regionCode: { in: [query.region] } } : {}),
    ...(query.segment ? { customerSegment: { in: [query.segment] } } : {}),
  };
}

function customerMatches(runtime: ApiRuntime, customerId: string, query: ReportQuery): boolean {
  if (!query.region && !query.segment) return true;
  const customer = runtime.store.dataset.customers.get(customerId);
  if (!customer) return false;
  return (
    (!query.region || customer.regionCode === query.region) &&
    (!query.segment || customer.segment === query.segment)
  );
}

interface RevenueTotals {
  invoices: number;
  invoiced: number;
  merchandise: number;
  margin: number;
  memos: number;
  credited: number;
}

interface InvoiceFact {
  day: number;
  invoiced: number;
  merchandise: number;
  margin: number;
  total: number;
  outstanding: number;
  overdue: boolean;
}

/** The invoices section 72.2 counts and the memos it subtracts, in US dollars, read once per request. */
function invoiceFacts(frame: Frame): {
  invoices: InvoiceFact[];
  memos: { day: number; credited: number }[];
} {
  return once(frame, 'invoices', () => {
    const { runtime, query } = frame;
    const invoices: InvoiceFact[] = [];
    for (const invoice of runtime.store.dataset.invoices.values()) {
      if (!(REVENUE_LIFECYCLES as readonly string[]).includes(invoice.lifecycle)) continue;
      if (!customerMatches(runtime, invoice.customerId, query)) continue;
      invoices.push({
        day: dayNumber(invoice.issueDate),
        invoiced: usdMinor(addMoney(invoice.subtotal, invoice.freight), invoice.fxRateToUsd),
        merchandise: usdMinor(invoice.subtotal, invoice.fxRateToUsd),
        margin: usdMinor(subtractMoney(invoice.subtotal, invoice.costTotal), invoice.fxRateToUsd),
        // The total invoiced, tax included: what an overdue balance is a part of.
        total: usdMinor(invoice.total, invoice.fxRateToUsd),
        outstanding: usdMinor(invoice.outstanding, invoice.fxRateToUsd),
        overdue: invoice.collectionState === 'overdue',
      });
    }
    const memos: { day: number; credited: number }[] = [];
    for (const memo of runtime.store.dataset.creditMemos.values()) {
      if (!(MEMO_LIFECYCLES as readonly string[]).includes(memo.lifecycle)) continue;
      if (!customerMatches(runtime, memo.customerId, query)) continue;
      memos.push({ day: dayNumber(memo.issueDate), credited: usdMinor(memo.subtotal) });
    }
    return { invoices, memos };
  });
}

function revenueIn(frame: Frame, range: ReportRange): RevenueTotals {
  const totals: RevenueTotals = {
    invoices: 0,
    invoiced: 0,
    merchandise: 0,
    margin: 0,
    memos: 0,
    credited: 0,
  };
  const first = dayNumber(range.from);
  const last = dayNumber(range.to);
  const { invoices, memos } = invoiceFacts(frame);
  for (const invoice of invoices) {
    if (invoice.day < first || invoice.day > last) continue;
    totals.invoices += 1;
    totals.invoiced += invoice.invoiced;
    totals.merchandise += invoice.merchandise;
    totals.margin += invoice.margin;
  }
  for (const memo of memos) {
    if (memo.day < first || memo.day > last) continue;
    totals.memos += 1;
    totals.credited += memo.credited;
  }
  return totals;
}

function invoiceFilter(range: ReportRange, query: ReportQuery): Record<string, FilterValue> {
  return {
    issueDate: between(range),
    lifecycle: { in: [...REVENUE_LIFECYCLES] },
    ...customerFilter(query),
  };
}

function memoFilter(range: ReportRange, query: ReportQuery): Record<string, FilterValue> {
  return {
    issueDate: between(range),
    lifecycle: { in: [...MEMO_LIFECYCLES] },
    ...customerFilter(query),
  };
}

const invoicesDoor = (filter: Record<string, FilterValue>): ReportDoor => ({
  list: 'invoices',
  filter,
});

/** Section 72.2's revenue and section 72.3's margin over the period, with their comparison. */
function revenueFigures(frame: Frame, withMargin: boolean): ReportFigure[] {
  const { period, comparison, query } = frame;
  const of = (range: ReportRange) => ({
    totals: revenueIn(frame, range),
    kept: keptFor(frame, 'invoices', range),
    door: invoicesDoor(invoiceFilter(range, query)),
  });
  const now = of(period);
  const before = comparison ? of(comparison) : null;
  const figure = (key: string, pick: (totals: RevenueTotals) => number | null): ReportFigure => ({
    key,
    basis: 'period',
    records: 'invoices',
    ...value(pick(now.totals), now.totals.invoices, now.door, now.kept),
    ...(before
      ? { previous: value(pick(before.totals), before.totals.invoices, before.door, before.kept) }
      : {}),
  });
  return [
    figure('revenue', (totals) => totals.invoiced - totals.credited),
    ...(withMargin
      ? [figure('grossMargin', (totals) => ratio(totals.margin, totals.merchandise))]
      : []),
  ];
}

/** Invoiced, credited and revenue per bucket, each part with its own list. */
function revenueTrendCells(frame: Frame, bucket: ReportRange): Record<string, ReportValue> {
  const kept = keptFor(frame, 'invoices', bucket);
  const totals = revenueIn(frame, bucket);
  return {
    invoiced: value(
      totals.invoiced,
      totals.invoices,
      invoicesDoor(invoiceFilter(bucket, frame.query)),
      kept,
    ),
    credited: value(
      totals.credited,
      totals.memos,
      { list: 'credit-memos', filter: memoFilter(bucket, frame.query) },
      kept,
    ),
    revenue: value(
      totals.invoiced - totals.credited,
      totals.invoices,
      invoicesDoor(invoiceFilter(bucket, frame.query)),
      kept,
    ),
  };
}

// ---------------------------------------------------------------------------
// Inventory (section 72.8, 72.9)

/** The warehouses a reader's scope and the report's filter leave. */
function warehousesFor(frame: Frame): string[] {
  const { runtime, query } = frame;
  const scope = runtime.authorization.warehouseIdsFor(runtime.actor.id);
  return [...runtime.store.dataset.warehouses.values()]
    .filter((warehouse) => scope === 'all' || scope.includes(warehouse.id))
    .filter((warehouse) => !query.warehouseId || warehouse.id === query.warehouseId)
    .map((warehouse) => warehouse.id);
}

/** Leaf categories under a category, itself included: SKUs are filed on leaves. */
function categoryLeaves(runtime: ApiRuntime, categoryId: string): string[] {
  const children = new Map<string, string[]>();
  for (const category of runtime.store.dataset.categories.values()) {
    if (!category.parentId) continue;
    const bucket = children.get(category.parentId) ?? [];
    bucket.push(category.id);
    children.set(category.parentId, bucket);
  }
  const leaves: string[] = [];
  const walk = (id: string): void => {
    const below = children.get(id);
    if (!below || below.length === 0) leaves.push(id);
    else for (const child of below) walk(child);
  };
  walk(categoryId);
  return leaves.sort();
}

const rootCache = new WeakMap<ApiRuntime, Map<string, string>>();

/** The top of a category's branch; categories do not move, so it is kept per runtime. */
function rootCategoryOf(runtime: ApiRuntime, categoryId: string): string {
  let roots = rootCache.get(runtime);
  if (!roots) {
    roots = new Map();
    rootCache.set(runtime, roots);
  }
  const known = roots.get(categoryId);
  if (known !== undefined) return known;
  let current = runtime.store.dataset.categories.get(categoryId);
  while (current?.parentId) current = runtime.store.dataset.categories.get(current.parentId);
  const root = current?.id ?? categoryId;
  roots.set(categoryId, root);
  return root;
}

function stockFilter(
  frame: Frame,
  extra: Record<string, FilterValue> = {},
): Record<string, FilterValue> {
  const { query, runtime } = frame;
  return {
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.categoryId ? { categoryId: { in: categoryLeaves(runtime, query.categoryId) } } : {}),
    ...extra,
  };
}

const stockDoor = (filter: Record<string, FilterValue>): ReportDoor => ({ list: 'stock', filter });

interface PositionFact {
  skuId: string;
  warehouseId: string;
  rootCategoryId: string;
  value: number;
  /** Cubic metres the position takes; null where the SKU carries no dimensions. */
  volume: number | null;
  onHand: number;
  lastShippedOn: string | undefined;
}

/** Every position the reader's scope and the filters leave, valued at standard cost (section 72.8). */
function positionsFor(frame: Frame): PositionFact[] {
  return once(frame, 'positions', () => readPositions(frame));
}

/** Every position with its value, volume and last shipment, kept per tenant while nothing that moves stock changes. */
const positionCache = new WeakMap<
  ApiRuntime,
  { facts: (PositionFact & { categoryId: string })[] | undefined }
>();

const STOCK_COLLECTIONS: readonly string[] = [
  'stockMovements',
  'reservations',
  'salesOrderLines',
  'salesOrders',
  'purchaseOrders',
  'purchaseOrderLines',
  'transfers',
  'transferLines',
  'skus',
  'categories',
];

function allPositions(runtime: ApiRuntime): (PositionFact & { categoryId: string })[] {
  let holder = positionCache.get(runtime);
  if (!holder) {
    const created = { facts: undefined as (PositionFact & { categoryId: string })[] | undefined };
    holder = created;
    positionCache.set(runtime, created);
    runtime.store.subscribe((collection) => {
      if (STOCK_COLLECTIONS.includes(collection)) created.facts = undefined;
    });
  }
  if (holder.facts) return holder.facts;
  const facts: (PositionFact & { categoryId: string })[] = [];
  for (const position of runtime.projections.inventory().values()) {
    const sku = runtime.store.dataset.skus.get(position.skuId);
    if (!sku) continue;
    const onHand = quantityToMilli(position.onHand);
    const dimensions = sku.dimensionsMm;
    const unitVolume = dimensions
      ? (dimensions.length * dimensions.width * dimensions.height) / 1e9
      : null;
    facts.push({
      skuId: position.skuId,
      warehouseId: position.warehouseId,
      categoryId: sku.categoryId,
      rootCategoryId: rootCategoryOf(runtime, sku.categoryId),
      // The stock list's own rounding of on-hand value, so its rows add up to the figure.
      value: Math.round((sku.standardCost.minor * onHand) / 1000),
      volume: unitVolume === null ? null : (unitVolume * onHand) / 1000,
      onHand,
      lastShippedOn: runtime.projections.lastShipmentOn(position.skuId, position.warehouseId),
    });
  }
  holder.facts = facts;
  return facts;
}

function readPositions(frame: Frame): PositionFact[] {
  const { runtime, query } = frame;
  const warehouses = new Set(warehousesFor(frame));
  const leaves = query.categoryId ? new Set(categoryLeaves(runtime, query.categoryId)) : null;
  return allPositions(runtime).filter(
    (fact) => warehouses.has(fact.warehouseId) && (!leaves || leaves.has(fact.categoryId)),
  );
}

const isAged = (fact: PositionFact): boolean => fact.onHand > 0 && fact.lastShippedOn === undefined;

interface MovementTotals {
  count: number;
  cost: number;
}

interface MovementFact {
  type: string;
  warehouseId: string;
  categoryId: string;
  day: number;
  /** The quantity moved at standard cost, USD minor, whichever way it moved. */
  cost: number;
}

const movementCache = new WeakMap<ApiRuntime, { facts: MovementFact[] | undefined }>();

/** Every movement with its business day and its value, read once per change of the ledger. */
function movementFacts(runtime: ApiRuntime): MovementFact[] {
  let holder = movementCache.get(runtime);
  if (!holder) {
    const created = { facts: undefined as MovementFact[] | undefined };
    holder = created;
    movementCache.set(runtime, created);
    runtime.store.subscribe((collection) => {
      if (collection === 'stockMovements' || collection === 'skus') created.facts = undefined;
    });
  }
  if (holder.facts) return holder.facts;
  const facts: MovementFact[] = [];
  for (const movement of runtime.store.dataset.stockMovements.values()) {
    const sku = runtime.store.dataset.skus.get(movement.skuId);
    facts.push({
      type: movement.type,
      warehouseId: movement.warehouseId,
      categoryId: sku?.categoryId ?? '',
      day: dayNumber(businessDay(movement.occurredAt)),
      cost: Math.abs(
        Math.round(((sku?.standardCost.minor ?? 0) * quantityToMilli(movement.onHandDelta)) / 1000),
      ),
    });
  }
  // In day order, so a range is read from its first day to its last and no further.
  facts.sort((a, b) => a.day - b.day);
  holder.facts = facts;
  return facts;
}

/** Stock movements of some types in a range, counted and valued at standard cost. */
function movementsIn(frame: Frame, types: readonly string[], range: ReportRange): MovementTotals {
  const { runtime, query } = frame;
  const warehouses = new Set(warehousesFor(frame));
  const leaves = query.categoryId ? new Set(categoryLeaves(runtime, query.categoryId)) : null;
  const first = dayNumber(range.from);
  const last = dayNumber(range.to);
  const totals: MovementTotals = { count: 0, cost: 0 };
  const facts = movementFacts(runtime);
  let low = 0;
  let high = facts.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((facts[middle] as MovementFact).day < first) low = middle + 1;
    else high = middle;
  }
  for (let index = low; index < facts.length; index += 1) {
    const fact = facts[index] as MovementFact;
    if (fact.day > last) break;
    if (!types.includes(fact.type) || !warehouses.has(fact.warehouseId)) continue;
    if (leaves && !leaves.has(fact.categoryId)) continue;
    totals.count += 1;
    totals.cost += fact.cost;
  }
  return totals;
}

function movementFilter(
  frame: Frame,
  types: readonly string[],
  range: ReportRange,
): Record<string, FilterValue> {
  const { query, runtime } = frame;
  return {
    type: { in: [...types] },
    occurredOn: between(range),
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.categoryId ? { categoryId: { in: categoryLeaves(runtime, query.categoryId) } } : {}),
  };
}

const movementsDoor = (filter: Record<string, FilterValue>): ReportDoor => ({
  list: 'movements',
  filter,
});

const SHIPMENT_TYPES = ['shipment'] as const;
const RECEIPT_TYPES = ['receipt'] as const;
/** Stock that left a position without a customer: what an inventory crisis writes (section 77.6). */
const LOSS_TYPES = ['adjustment_out', 'damage'] as const;
const TRANSFER_TYPES = ['transfer_out'] as const;

// ---------------------------------------------------------------------------
// Reports

const LABELLED_FIELDS = new Set([
  'customerId',
  'ownerId',
  'skuIds',
  'supplierId',
  'categoryId',
  'warehouseId',
  'sourceWarehouseId',
]);

/** The display name of each id a door names, read from the record it names. */
function doorLabels(runtime: ApiRuntime, doors: ReportDoor[]): Record<string, string> {
  const { dataset } = runtime.store;
  const labels: Record<string, string> = {};
  const name = (field: string, id: string): string | undefined => {
    switch (field) {
      case 'customerId':
        return dataset.customers.get(id)?.displayName;
      case 'ownerId':
        return dataset.users.get(id)?.displayName;
      case 'skuIds': {
        const sku = dataset.skus.get(id);
        return sku ? `${sku.sku} · ${sku.name}` : undefined;
      }
      case 'supplierId':
        return dataset.suppliers.get(id)?.displayName;
      case 'categoryId':
        return dataset.categories.get(id)?.name;
      default:
        return dataset.warehouses.get(id)?.code;
    }
  };
  for (const door of doors)
    for (const [field, clause] of Object.entries(door.filter)) {
      if (!LABELLED_FIELDS.has(field)) continue;
      const ids =
        typeof clause === 'string'
          ? [clause]
          : clause && typeof clause === 'object' && !Array.isArray(clause)
            ? Object.values(clause).flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
            : [];
      for (const id of ids) {
        const label = typeof id === 'string' ? name(field, id) : undefined;
        if (label !== undefined) labels[id as string] = label;
      }
    }
  return labels;
}

function doorsOf(parts: Pick<ReportAnswer, 'figures' | 'tables' | 'anomalies'>): ReportDoor[] {
  const doors: ReportDoor[] = [];
  const add = (cell: ReportValue | undefined) => {
    if (cell?.door) doors.push(cell.door);
  };
  for (const figure of parts.figures) {
    add(figure);
    add(figure.previous);
  }
  for (const table of parts.tables)
    for (const row of [...table.rows, ...(table.total ? [table.total] : [])])
      for (const cell of Object.values(row.cells)) add(cell);
  for (const anomaly of parts.anomalies) if (anomaly.door) doors.push(anomaly.door);
  return doors;
}

function answer(
  frame: Frame,
  report: ReportKey,
  records: readonly ReportRecords[],
  parts: Pick<ReportAnswer, 'figures' | 'tables' | 'anomalies' | 'options' | 'filters'>,
): ReportAnswer {
  const coverage: Partial<Record<ReportRecords, string>> = {};
  for (const kind of records) coverage[kind] = frame.coverage[kind];
  return {
    labels: doorLabels(frame.runtime, doorsOf(parts)),
    report,
    asOf: frame.runtime.store.now,
    today: frame.today,
    period: frame.period,
    comparison: frame.comparison,
    grain: frame.grain,
    buckets: frame.buckets,
    coverage,
    ...parts,
    annotations: annotations(frame, records),
    withheld: frame.access.withheld(),
  };
}

const regionOptions = (): ReportOption[] =>
  (Object.keys(REGION_LABEL) as RegionCode[]).map((code) => ({
    value: code,
    label: REGION_LABEL[code],
  }));
const segmentOptions = (): ReportOption[] =>
  (Object.keys(SEGMENT_LABEL) as CustomerSegment[]).map((segment) => ({
    value: segment,
    label: SEGMENT_LABEL[segment],
  }));

function customerFilters(query: ReportQuery): Pick<ReportQuery, 'region' | 'segment'> {
  return {
    ...(query.region ? { region: query.region } : {}),
    ...(query.segment ? { segment: query.segment } : {}),
  };
}

function checkCustomerFilters(query: ReportQuery): void {
  if (query.region && !(query.region in REGION_LABEL))
    throw invalid('region', 'region is US or BR');
  if (query.segment && !(query.segment in SEGMENT_LABEL))
    throw invalid('segment', 'segment is strategic, enterprise, mid_market or smb');
}

/** Section 16 "Sales" and the booked half of section 34.1. */
export function salesReport(
  runtime: ApiRuntime,
  models: SalesReadModels,
  query: ReportQuery = {},
): ReportAnswer {
  const frame = resolveFrame(runtime, query);
  checkCustomerFilters(query);
  if (query.ownerId && !runtime.store.dataset.users.has(query.ownerId))
    throw invalid('ownerId', 'ownerId names no user');
  const { access } = frame;
  const figures: ReportFigure[] = [];
  const tables: ReportTable[] = [];
  const anomalies: ReportAnomaly[] = [];
  let owners: ReportOption[] = [];
  if (access.allows('orders', 'orders.view')) {
    const facts = orderFacts(runtime, models);
    const withMargin = access.allows('margin', 'cost.view');
    figures.push(...bookedFigures(frame, facts));
    if (withMargin) figures.push(bookedMarginFigure(frame, facts));
    figures.push(discountFigure(frame, facts), cycleTimeFigure(frame, facts));
    tables.push(
      bookedTrend(frame, facts),
      segmentChanges(frame, facts),
      accountRanking(frame, facts, withMargin),
      productRanking(frame, facts),
      repRanking(frame, facts, withMargin),
      cycleBands(frame, facts),
    );
    anomalies.push(...bookedAnomalies(frame, facts, 'sales'));
    owners = ownerOptions(runtime, facts);
  }
  if (access.allows('conversion', 'quotes.view')) {
    figures.push(conversionFigure(frame));
    tables.push(quoteOutcomes(frame));
  }
  return answer(frame, 'sales', ['orders', 'order-lines', 'quotes'], {
    figures,
    tables,
    anomalies,
    filters: { ...customerFilters(query), ...(query.ownerId ? { ownerId: query.ownerId } : {}) },
    options: { region: regionOptions(), segment: segmentOptions(), ownerId: owners },
  });
}

function windowOrders(frame: Frame, facts: OrderFacts, range: ReportRange): number[] {
  return bookedIn(facts, range, frame.query).filter(
    (index) => !(facts.rows[index] as OrderFact).historical,
  );
}

/** Line discounts over the gross merchandise they came off (section 16 "discount rate"). */
function discountFigure(frame: Frame, facts: OrderFacts): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const picked = windowOrders(frame, facts, range);
    const discount = sumOf(facts.discount, picked);
    return value(
      ratio(discount, sumOf(facts.merchandise, picked) + discount),
      picked.length,
      ordersDoor(bookedFilter(range, frame.query)),
      keptFor(frame, 'order-lines', range),
    );
  };
  return {
    key: 'discountRate',
    basis: 'period',
    records: 'order-lines',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

/** The median of the days from order date to complete shipment, over orders of the period that shipped complete. */
function cycleTimeFigure(frame: Frame, facts: OrderFacts): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const picked = windowOrders(frame, facts, range).filter(
      (index) => (facts.rows[index] as OrderFact).cycleDays !== undefined,
    );
    return value(
      median(picked.map((index) => (facts.rows[index] as OrderFact).cycleDays as number)),
      picked.length,
      ordersDoor({ ...bookedFilter(range, frame.query), cycleDays: { is_not_empty: true } }),
      keptFor(frame, 'order-lines', range),
    );
  };
  return {
    key: 'cycleTime',
    basis: 'period',
    records: 'order-lines',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

const CYCLE_BANDS: { key: string; label: string; low: number; high: number | null }[] = [
  { key: '0-1', label: '0–1 days', low: 0, high: 1 },
  { key: '2-3', label: '2–3 days', low: 2, high: 3 },
  { key: '4-7', label: '4–7 days', low: 4, high: 7 },
  { key: '8-14', label: '8–14 days', low: 8, high: 14 },
  { key: '15+', label: '15 days or more', low: 15, high: null },
];

function cycleBands(frame: Frame, facts: OrderFacts): ReportTable {
  const kept = keptFor(frame, 'order-lines', frame.period);
  const picked = windowOrders(frame, facts, frame.period).filter(
    (index) => (facts.rows[index] as OrderFact).cycleDays !== undefined,
  );
  const base = bookedFilter(frame.period, frame.query);
  return {
    key: 'cycleBands',
    records: 'order-lines',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: CYCLE_BANDS.map((bandOf) => {
      const inBand = picked.filter((index) => {
        const days = (facts.rows[index] as OrderFact).cycleDays as number;
        return days >= bandOf.low && (bandOf.high === null || days <= bandOf.high);
      });
      return {
        key: bandOf.key,
        label: bandOf.label,
        cells: {
          orders: value(
            inBand.length,
            inBand.length,
            ordersDoor({
              ...base,
              cycleDays:
                bandOf.high === null ? { gte: bandOf.low } : { gte: bandOf.low, lte: bandOf.high },
            }),
            kept,
          ),
        },
      };
    }),
    total: {
      key: 'total',
      label: 'Orders shipped complete',
      cells: {
        orders: value(
          picked.length,
          picked.length,
          ordersDoor({ ...base, cycleDays: { is_not_empty: true } }),
          kept,
        ),
      },
    },
  };
}

/** Line revenue by SKU: the ten that sold the most, from the lines Nexora keeps. */
function productRanking(frame: Frame, facts: OrderFacts): ReportTable {
  const { runtime, period } = frame;
  const kept = keptFor(frame, 'order-lines', period);
  const byProduct = new Map<string, { revenue: number; orders: Set<string> }>();
  if (kept)
    for (const index of windowOrders(frame, facts, period)) {
      const row = facts.rows[index] as OrderFact;
      const order = runtime.store.dataset.salesOrders.get(row.id);
      if (!order) continue;
      for (const line of runtime.indexes.linesByOrder.get(order.id)) {
        const entry = byProduct.get(line.skuId) ?? { revenue: 0, orders: new Set<string>() };
        entry.revenue += usdMinor(line.netAmount, order.fxRateToUsd);
        entry.orders.add(order.id);
        byProduct.set(line.skuId, entry);
      }
    }
  const ranked = [...byProduct.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue || a[0].localeCompare(b[0]))
    .slice(0, TOP_ROWS);
  const base = bookedFilter(period, frame.query);
  return {
    key: 'byProduct',
    records: 'order-lines',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: ranked.map(([skuId, entry]) => {
      const sku = runtime.store.dataset.skus.get(skuId);
      const door = ordersDoor({ ...base, skuIds: { in: [skuId] } });
      return {
        key: skuId,
        label: sku ? `${sku.sku} · ${sku.name}` : skuId,
        cells: {
          lineRevenue: value(entry.revenue, entry.orders.size, door),
          orders: value(entry.orders.size, entry.orders.size, door),
        },
      };
    }),
  };
}

/**
 * Booked value by the order's owner, from the window only: a historical order
 * keeps no owner of its own and is read as its account owner's (section 55.5
 * gives a representative read access to every order, colleagues' included).
 */
function repRanking(frame: Frame, facts: OrderFacts, withMargin: boolean): ReportTable {
  const { runtime, period } = frame;
  const kept = keptFor(frame, 'order-lines', period);
  const byOwner = new Map<string, number[]>();
  if (kept)
    for (const index of windowOrders(frame, facts, period)) {
      const ownerId = (facts.rows[index] as OrderFact).ownerId;
      const bucket = byOwner.get(ownerId) ?? [];
      bucket.push(index);
      byOwner.set(ownerId, bucket);
    }
  const base = bookedFilter(period, frame.query);
  return {
    key: 'byRep',
    records: 'order-lines',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: [...byOwner.entries()]
      .map(([ownerId, indexes]) => ({ ownerId, indexes, booked: sumOf(facts.net, indexes) }))
      .sort((a, b) => b.booked - a.booked || a.ownerId.localeCompare(b.ownerId))
      .map(({ ownerId, indexes, booked }) => {
        const door = ordersDoor({ ...base, ownerId });
        return {
          key: ownerId,
          label: runtime.store.dataset.users.get(ownerId)?.displayName ?? ownerId,
          cells: {
            bookedValue: value(booked, indexes.length, door),
            orders: value(indexes.length, indexes.length, door),
            averageOrderValue: value(
              indexes.length === 0 ? null : roundHalfUp(booked / indexes.length),
              indexes.length,
              door,
            ),
            ...(withMargin
              ? {
                  margin: value(
                    ratio(sumOf(facts.margin, indexes), sumOf(facts.merchandise, indexes)),
                    indexes.length,
                    door,
                  ),
                }
              : {}),
          },
        };
      }),
  };
}

function ownerOptions(runtime: ApiRuntime, facts: OrderFacts): ReportOption[] {
  const owners = new Set<string>();
  facts.rows.forEach((row) => {
    if (!row.historical) owners.add(row.ownerId);
  });
  return [...owners]
    .map((id) => ({ value: id, label: runtime.store.dataset.users.get(id)?.displayName ?? id }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Quote outcomes a period's quotes reached; open ones are still undecided. */
const QUOTE_OUTCOMES: { key: string; statuses: string[] }[] = [
  { key: 'converted', statuses: ['converted'] },
  { key: 'accepted', statuses: ['accepted'] },
  { key: 'open', statuses: ['draft', 'pending_approval', 'approved', 'sent', 'viewed'] },
  { key: 'lost', statuses: ['rejected', 'expired', 'cancelled'] },
];
const DECIDED = ['converted', 'rejected', 'expired', 'cancelled'];

function quoteFilter(
  frame: Frame,
  range: ReportRange,
  statuses: string[],
): Record<string, FilterValue> {
  return {
    createdBusinessDate: between(range),
    status: { in: statuses },
    ...customerFilter(frame.query),
    ...(frame.query.ownerId ? { ownerId: frame.query.ownerId } : {}),
  };
}

function quotesIn(frame: Frame, range: ReportRange): Map<string, number> {
  const counts = new Map<string, number>();
  for (const quote of frame.runtime.store.dataset.quotes.values()) {
    if (!inRange(quote.createdBusinessDate, range)) continue;
    if (!customerMatches(frame.runtime, quote.customerId, frame.query)) continue;
    if (frame.query.ownerId && quote.ownerId !== frame.query.ownerId) continue;
    counts.set(quote.status, (counts.get(quote.status) ?? 0) + 1);
  }
  return counts;
}

/** Of the quotes written in the period and decided since, the share converted into an order. */
function conversionFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const counts = quotesIn(frame, range);
    const decided = DECIDED.reduce((sum, status) => sum + (counts.get(status) ?? 0), 0);
    return value(
      ratio(counts.get('converted') ?? 0, decided),
      decided,
      {
        list: 'quotes',
        filter: quoteFilter(frame, range, DECIDED),
      },
      keptFor(frame, 'quotes', range),
    );
  };
  return {
    key: 'conversionRate',
    basis: 'period',
    records: 'quotes',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

function quoteOutcomes(frame: Frame): ReportTable {
  const kept = keptFor(frame, 'quotes', frame.period);
  const counts = quotesIn(frame, frame.period);
  const all = QUOTE_OUTCOMES.flatMap((outcome) => outcome.statuses);
  const total = all.reduce((sum, status) => sum + (counts.get(status) ?? 0), 0);
  return {
    key: 'quoteOutcomes',
    records: 'quotes',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: QUOTE_OUTCOMES.map((outcome) => {
      const count = outcome.statuses.reduce((sum, status) => sum + (counts.get(status) ?? 0), 0);
      return {
        key: outcome.key,
        label: outcome.key,
        cells: {
          quotes: value(
            count,
            count,
            { list: 'quotes', filter: quoteFilter(frame, frame.period, outcome.statuses) },
            kept,
          ),
        },
      };
    }),
    total: {
      key: 'total',
      label: 'Quotes written',
      cells: {
        quotes: value(
          total,
          total,
          { list: 'quotes', filter: quoteFilter(frame, frame.period, all) },
          kept,
        ),
      },
    },
  };
}

// ---------------------------------------------------------------------------

/** Section 16 "Executive" and section 34.1: how the business performs, what changed, what needs attention. */
export function executiveReport(
  runtime: ApiRuntime,
  models: SalesReadModels,
  query: ReportQuery = {},
): ReportAnswer {
  // The executive report reads the whole company: it takes the period and no segment filter.
  const frame = resolveFrame(runtime, {
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
    ...(query.compare ? { compare: query.compare } : {}),
  });
  const { access } = frame;
  const figures: ReportFigure[] = [];
  const tables: ReportTable[] = [];
  const anomalies: ReportAnomaly[] = [];
  if (access.allows('revenue', 'invoices.view')) {
    const withMargin = access.allows('grossMargin', 'cost.view');
    figures.push(...revenueFigures(frame, withMargin));
  }
  let facts: OrderFacts | null = null;
  if (access.allows('orders', 'orders.view')) {
    facts = orderFacts(runtime, models);
    figures.push(...bookedFigures(frame, facts), concentrationFigure(frame, facts));
    tables.push(segmentChanges(frame, facts), accountRanking(frame, facts, false));
    anomalies.push(...bookedAnomalies(frame, facts, 'sales'));
  }
  tables.unshift(executiveTrend(frame, facts));
  if (access.allows('inventoryValue', 'inventory.view', 'cost.view'))
    figures.push(inventoryValueFigure(frame));
  if (access.allows('inventory', 'inventory.view')) anomalies.push(...inventoryAnomalies(frame));
  if (access.allows('service', 'support.view')) {
    figures.push(firstResponseFigure(frame));
    anomalies.push(...supportAnomalies(frame));
  }
  return answer(frame, 'executive', ['orders', 'invoices', 'tickets', 'positions'], {
    figures,
    tables,
    anomalies,
    filters: {},
    options: {},
  });
}

/** Booked value over the whole period, and revenue where invoices are kept. */
function executiveTrend(frame: Frame, facts: OrderFacts | null): ReportTable {
  const withRevenue = frame.runtime.can('invoices.view');
  return {
    key: 'trend',
    records: 'orders',
    rows: frame.buckets.map((bucket) => {
      const cells: Record<string, ReportValue> = {};
      if (facts) {
        const picked = bookedIn(facts, bucket, frame.query);
        cells['bookedValue'] = value(
          sumOf(facts.net, picked),
          picked.length,
          ordersDoor(bookedFilter(bucket, frame.query)),
        );
      }
      if (withRevenue)
        cells['revenue'] = revenueTrendCells(frame, bucket)['revenue'] as ReportValue;
      return { key: bucket.from, label: bucket.from, range: bucket, cells };
    }),
  };
}

// ---------------------------------------------------------------------------

/** Section 16 "Inventory", section 72.8 and 72.9. */
export function inventoryReport(
  runtime: ApiRuntime,
  models: SalesReadModels,
  query: ReportQuery = {},
): ReportAnswer {
  const frame = resolveFrame(runtime, query);
  if (query.warehouseId && !runtime.store.dataset.warehouses.has(query.warehouseId))
    throw invalid('warehouseId', 'warehouseId names no warehouse');
  if (query.categoryId && !runtime.store.dataset.categories.has(query.categoryId))
    throw invalid('categoryId', 'categoryId names no category');
  const { access } = frame;
  const figures: ReportFigure[] = [];
  const tables: ReportTable[] = [];
  const anomalies: ReportAnomaly[] = [];
  const scoped = warehousesFor(frame);
  if (query.warehouseId && !scoped.includes(query.warehouseId))
    throw new NexoraApiError('FORBIDDEN', 'The warehouse is outside the reader’s scope', {
      details: { permission: 'inventory.view' },
    });
  if (access.allows('inventory', 'inventory.view')) {
    const positions = positionsFor(frame);
    const withCost = access.allows('valuation', 'cost.view');
    const valuation = positions.reduce((sum, fact) => sum + fact.value, 0);
    const allDoor = stockDoor(stockFilter(frame));
    if (withCost) {
      figures.push({
        key: 'valuation',
        basis: 'today',
        records: 'positions',
        ...value(valuation, positions.length, allDoor),
      });
      figures.push(turnsFigure(frame, valuation));
    }
    const aged = positions.filter(isAged);
    const agedDoor = stockDoor(
      stockFilter(frame, { onHand: { gt: 0 }, lastShippedOn: { is_empty: true } }),
    );
    figures.push({
      key: 'agedPositions',
      basis: 'today',
      records: 'movements',
      ...value(aged.length, aged.length, agedDoor),
    });
    if (withCost)
      figures.push({
        key: 'agedValue',
        basis: 'today',
        records: 'movements',
        ...value(
          aged.reduce((sum, fact) => sum + fact.value, 0),
          aged.length,
          agedDoor,
        ),
      });
    figures.push(transferFigure(frame), utilizationFigure(frame, positions));
    if (access.allows('stockouts', 'orders.view')) figures.push(stockoutFigure(frame, models));
    tables.push(
      ...(withCost
        ? [valueBy(frame, positions, 'byWarehouse'), valueBy(frame, positions, 'byCategory')]
        : []),
      movementTrend(frame),
    );
    anomalies.push(...inventoryAnomalies(frame));
  }
  return answer(frame, 'inventory', ['positions', 'movements', 'transfers', 'order-lines'], {
    figures,
    tables,
    anomalies,
    filters: {
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    },
    options: {
      warehouseId: scoped
        .map((id) => runtime.store.dataset.warehouses.get(id))
        .filter((warehouse) => warehouse !== undefined)
        .map((warehouse) => ({ value: warehouse.id, label: warehouse.code })),
      categoryId: [...runtime.store.dataset.categories.values()]
        .filter((category) => !category.parentId)
        .map((category) => ({ value: category.id, label: category.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
  });
}

function inventoryValueFigure(frame: Frame): ReportFigure {
  const positions = positionsFor(frame);
  return {
    key: 'inventoryValue',
    basis: 'today',
    records: 'positions',
    ...value(
      positions.reduce((sum, fact) => sum + fact.value, 0),
      positions.length,
      stockDoor(stockFilter(frame)),
    ),
  };
}

/**
 * Section 72.9 over the period: the standard cost shipped, at a yearly rate,
 * over today's inventory value. Movements are kept from the window on.
 */
function turnsFigure(frame: Frame, valuation: number): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const shipped = movementsIn(frame, SHIPMENT_TYPES, range);
    return value(
      valuation === 0
        ? null
        : Math.round(((shipped.cost * (365 / range.days)) / valuation) * 10) / 10,
      shipped.count,
      movementsDoor(movementFilter(frame, SHIPMENT_TYPES, range)),
      keptFor(frame, 'movements', range),
    );
  };
  return {
    key: 'turns',
    basis: 'period',
    records: 'movements',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

function transferFigure(frame: Frame): ReportFigure {
  const { runtime } = frame;
  const warehouses = new Set(warehousesFor(frame));
  const of = (range: ReportRange): ReportValue => {
    let count = 0;
    for (const transfer of runtime.store.dataset.transfers.values()) {
      if (!inRange(transfer.requestedDate, range)) continue;
      if (
        !warehouses.has(transfer.sourceWarehouseId) &&
        !warehouses.has(transfer.destinationWarehouseId)
      )
        continue;
      if (frame.query.warehouseId && transfer.sourceWarehouseId !== frame.query.warehouseId)
        continue;
      count += 1;
    }
    return value(
      count,
      count,
      {
        list: 'transfers',
        filter: {
          requestedDate: between(range),
          ...(frame.query.warehouseId ? { sourceWarehouseId: frame.query.warehouseId } : {}),
        },
      },
      keptFor(frame, 'transfers', range),
    );
  };
  return {
    key: 'transfers',
    basis: 'period',
    records: 'transfers',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

/** Section 16 "stockout frequency": the share of the period's orders short of stock now. */
function stockoutFigure(frame: Frame, models: SalesReadModels): ReportFigure {
  const facts = orderFacts(frame.runtime, models);
  const warehouses = new Set(warehousesFor(frame));
  const of = (range: ReportRange): ReportValue => {
    const picked = bookedIn(facts, range, {}).filter((index) => {
      const row = facts.rows[index] as OrderFact;
      return !row.historical && warehouses.has(row.defaultWarehouseId);
    });
    const short = picked.filter((index) =>
      (facts.rows[index] as OrderFact).riskFlags.includes('inventory_shortage'),
    );
    return value(
      ratio(short.length, picked.length),
      short.length,
      ordersDoor({
        ...bookedFilter(range, {}),
        riskFlags: { in: ['inventory_shortage'] },
        ...(frame.query.warehouseId ? { warehouseId: frame.query.warehouseId } : {}),
      }),
      keptFor(frame, 'order-lines', range),
    );
  };
  return {
    key: 'stockoutRate',
    basis: 'period',
    records: 'order-lines',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

/**
 * Section 16 "warehouse utilization": the space stock takes against each
 * warehouse's capacity. Dimensions are optional on a SKU (section 57); while
 * a stocked SKU carries none, the space is not known and no share is stated.
 */
function utilizationFigure(frame: Frame, positions: PositionFact[]): ReportFigure {
  const stocked = positions.filter((fact) => fact.onHand > 0);
  const unmeasured = stocked.filter((fact) => fact.volume === null).length;
  const capacity = warehousesFor(frame).reduce(
    (sum, id) => sum + (frame.runtime.store.dataset.warehouses.get(id)?.capacityCubicMeters ?? 0),
    0,
  );
  const used = stocked.reduce((sum, fact) => sum + (fact.volume ?? 0), 0);
  return {
    key: 'utilization',
    basis: 'today',
    records: 'positions',
    ...(unmeasured > 0
      ? { value: null, missing: 'not-recorded' as const, count: unmeasured, of: stocked.length }
      : value(
          ratio(used, capacity),
          stocked.length,
          stockDoor(stockFilter(frame, { onHand: { gt: 0 } })),
        )),
  };
}

function valueBy(
  frame: Frame,
  positions: PositionFact[],
  key: 'byWarehouse' | 'byCategory',
): ReportTable {
  const { runtime } = frame;
  const groups = new Map<string, PositionFact[]>();
  for (const fact of positions) {
    const group = key === 'byWarehouse' ? fact.warehouseId : fact.rootCategoryId;
    const bucket = groups.get(group) ?? [];
    bucket.push(fact);
    groups.set(group, bucket);
  }
  const rows = [...groups.entries()]
    .map(([group, facts]) => ({
      group,
      facts,
      total: facts.reduce((sum, fact) => sum + fact.value, 0),
    }))
    .sort((a, b) => b.total - a.total || a.group.localeCompare(b.group))
    .map(({ group, facts, total }) => {
      const door = stockDoor(
        stockFilter(
          frame,
          key === 'byWarehouse'
            ? { warehouseId: group }
            : { categoryId: { in: categoryLeaves(runtime, group) } },
        ),
      );
      return {
        key: group,
        label:
          key === 'byWarehouse'
            ? (runtime.store.dataset.warehouses.get(group)?.code ?? group)
            : (runtime.store.dataset.categories.get(group)?.name ?? group),
        cells: {
          value: value(total, facts.length, door),
          positions: value(facts.length, facts.length, door),
        },
      };
    });
  const door = stockDoor(stockFilter(frame));
  return {
    key,
    records: 'positions',
    rows,
    total: {
      key: 'total',
      label: key === 'byWarehouse' ? 'All warehouses' : 'All categories',
      cells: {
        value: value(
          positions.reduce((sum, fact) => sum + fact.value, 0),
          positions.length,
          door,
        ),
        positions: value(positions.length, positions.length, door),
      },
    },
  };
}

/** Movements per bucket by what moved stock: shipments, receipts, losses and transfers out. */
function movementTrend(frame: Frame): ReportTable {
  const kinds: [string, readonly string[]][] = [
    ['shipments', SHIPMENT_TYPES],
    ['receipts', RECEIPT_TYPES],
    ['losses', LOSS_TYPES],
    ['transfers', TRANSFER_TYPES],
  ];
  return {
    key: 'movements',
    records: 'movements',
    rows: frame.buckets.map((bucket) => {
      const kept = keptFor(frame, 'movements', bucket);
      return {
        key: bucket.from,
        label: bucket.from,
        range: bucket,
        cells: Object.fromEntries(
          kinds.map(([key, types]) => {
            const totals = movementsIn(frame, types, bucket);
            return [
              key,
              value(
                totals.count,
                totals.count,
                movementsDoor(movementFilter(frame, types, bucket)),
                kept,
              ),
            ];
          }),
        ),
      };
    }),
  };
}

/** Losses in the last bucket against the earlier ones: what a recall or a count shortfall writes. */
function inventoryAnomalies(frame: Frame): ReportAnomaly[] {
  const counts = frame.buckets.map((bucket) => movementsIn(frame, LOSS_TYPES, bucket).count);
  const anomaly = bucketAnomaly(frame, 'inventory', 'losses', 'movements', counts, (range) =>
    movementsDoor(movementFilter(frame, LOSS_TYPES, range)),
  );
  return anomaly ? [anomaly] : [];
}

// ---------------------------------------------------------------------------

/** Section 16 "Procurement" and section 72.10. */
export function procurementReport(runtime: ApiRuntime, query: ReportQuery = {}): ReportAnswer {
  const frame = resolveFrame(runtime, query);
  if (query.warehouseId && !runtime.store.dataset.warehouses.has(query.warehouseId))
    throw invalid('warehouseId', 'warehouseId names no warehouse');
  const { access } = frame;
  const figures: ReportFigure[] = [];
  const tables: ReportTable[] = [];
  if (access.allows('purchaseOrders', 'purchase_orders.view')) {
    const withCost = access.allows('spend', 'cost.view');
    if (withCost) figures.push(spendFigure(frame));
    figures.push(onTimeFigure(frame), leadTimeFigure(frame));
    if (withCost) figures.push(priceVarianceFigure(frame));
    tables.push(supplierTable(frame, withCost), receivedTrend(frame));
  }
  return answer(frame, 'procurement', ['purchase-orders'], {
    figures,
    tables,
    anomalies: [],
    filters: query.warehouseId ? { warehouseId: query.warehouseId } : {},
    options: {
      warehouseId: [...runtime.store.dataset.warehouses.values()]
        .filter((warehouse) => runtime.can('purchase_orders.view', { warehouseId: warehouse.id }))
        .map((warehouse) => ({ value: warehouse.id, label: warehouse.code })),
    },
  });
}

const COMMITTED_PO = [
  'approved',
  'sent',
  'acknowledged',
  'partially_received',
  'received',
  'closed',
];

function readablePurchaseOrders(frame: Frame) {
  return once(frame, 'purchaseOrders', () => readPurchaseOrders(frame));
}

function readPurchaseOrders(frame: Frame) {
  const { runtime, query } = frame;
  return [...runtime.store.dataset.purchaseOrders.values()].filter(
    (po) =>
      runtime.can('purchase_orders.view', { warehouseId: po.destinationWarehouseId }) &&
      (!query.warehouseId || po.destinationWarehouseId === query.warehouseId),
  );
}

function poFilter(frame: Frame, extra: Record<string, FilterValue>): Record<string, FilterValue> {
  return { ...(frame.query.warehouseId ? { warehouseId: frame.query.warehouseId } : {}), ...extra };
}

const poDoor = (filter: Record<string, FilterValue>): ReportDoor => ({
  list: 'purchase-orders',
  filter,
});

/** Committed spend: what the period's approved and later orders cost, excluding tax (PC-01). */
function spendFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    let spend = 0;
    let count = 0;
    for (const po of readablePurchaseOrders(frame)) {
      if (!COMMITTED_PO.includes(po.status) || !inRange(po.createdBusinessDate, range)) continue;
      spend += usdMinor(addMoney(po.subtotal, po.freight), po.fxRateToUsd);
      count += 1;
    }
    return value(
      spend,
      count,
      poDoor(
        poFilter(frame, { createdBusinessDate: between(range), status: { in: COMMITTED_PO } }),
      ),
      keptFor(frame, 'purchase-orders', range),
    );
  };
  return {
    key: 'spend',
    basis: 'period',
    records: 'purchase-orders',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

interface ReceivedOrder {
  po: ReturnType<typeof readablePurchaseOrders>[number];
  receivedOn: string;
  lines: number;
  onTime: number;
  standard: number;
  paid: number;
}

/** Orders received in full in a range, with section 72.10's lines and the price paid against standard. */
function receivedIn(frame: Frame, range: ReportRange): ReceivedOrder[] {
  return receivedAll(frame).filter((entry) => inRange(entry.receivedOn, range));
}

/** Every order received in full between the comparison's first day and the period's last, read once per request. */
function receivedAll(frame: Frame): ReceivedOrder[] {
  return once(frame, 'received', () => {
    const from =
      frame.comparison && compareDates(frame.comparison.from, frame.period.from) < 0
        ? frame.comparison.from
        : frame.period.from;
    return readReceived(frame, rangeOf(from, frame.period.to));
  });
}

function readReceived(frame: Frame, range: ReportRange): ReceivedOrder[] {
  const { runtime } = frame;
  const received: ReceivedOrder[] = [];
  for (const po of readablePurchaseOrders(frame)) {
    const receivedOn = purchaseOrderReceivedOn(runtime, po);
    if (!receivedOn || !inRange(receivedOn, range)) continue;
    const entry: ReceivedOrder = { po, receivedOn, lines: 0, onTime: 0, standard: 0, paid: 0 };
    for (const line of runtime.indexes.poLinesByPo.get(po.id)) {
      const ordered = quantityToMilli(line.orderedQuantity);
      let accepted = 0;
      let completedOn: string | undefined;
      const receiptLines = runtime.indexes.receiptLinesByPoLine
        .get(line.id)
        .map((receiptLine) => ({
          receiptLine,
          at: runtime.store.dataset.goodsReceipts.get(receiptLine.goodsReceiptId)?.receivedAt ?? '',
        }))
        .sort((a, b) => a.at.localeCompare(b.at));
      const sku = runtime.store.dataset.skus.get(line.skuId);
      for (const { receiptLine, at } of receiptLines) {
        const quantity = quantityToMilli(receiptLine.acceptedQuantity);
        accepted += quantity;
        entry.standard += Math.round(((sku?.standardCost.minor ?? 0) * quantity) / 1000);
        entry.paid += Math.round(
          (usdMinor(receiptLine.unitCost, po.fxRateToUsd) * quantity) / 1000,
        );
        // Section 72.10: the receipt whose accepted quantity satisfies the line, within the 5% receiving tolerance.
        if (completedOn === undefined && accepted >= ordered * 0.95 && at)
          completedOn = businessDateOf(at);
      }
      if (completedOn === undefined) continue;
      entry.lines += 1;
      if (compareDates(completedOn, line.expectedDate) <= 0) entry.onTime += 1;
    }
    received.push(entry);
  }
  return received;
}

function receivedDoor(
  frame: Frame,
  range: ReportRange,
  extra: Record<string, FilterValue> = {},
): ReportDoor {
  return poDoor(poFilter(frame, { receivedOn: between(range), ...extra }));
}

function onTimeFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const received = receivedIn(frame, range);
    return value(
      ratio(
        received.reduce((sum, entry) => sum + entry.onTime, 0),
        received.reduce((sum, entry) => sum + entry.lines, 0),
      ),
      received.length,
      receivedDoor(frame, range),
      keptFor(frame, 'purchase-orders', range),
    );
  };
  return {
    key: 'onTimeDelivery',
    basis: 'period',
    records: 'purchase-orders',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

/** The median of the days from an order's send to its complete receipt. */
function leadTimeFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const received = receivedIn(frame, range);
    return value(
      median(
        received.map((entry) =>
          diffDays(
            entry.receivedOn,
            entry.po.sentAt ? businessDateOf(entry.po.sentAt) : entry.po.createdBusinessDate,
          ),
        ),
      ),
      received.length,
      receivedDoor(frame, range),
      keptFor(frame, 'purchase-orders', range),
    );
  };
  return {
    key: 'leadTime',
    basis: 'period',
    records: 'purchase-orders',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

/** Purchase price variance: what the accepted units cost against their standard cost, in basis points. */
function priceVarianceFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const received = receivedIn(frame, range);
    const standard = received.reduce((sum, entry) => sum + entry.standard, 0);
    const paid = received.reduce((sum, entry) => sum + entry.paid, 0);
    return value(
      standard === 0 ? null : roundHalfUp(((paid - standard) / standard) * 10_000),
      received.length,
      receivedDoor(frame, range),
      keptFor(frame, 'purchase-orders', range),
    );
  };
  return {
    key: 'priceVariance',
    basis: 'period',
    records: 'purchase-orders',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

function supplierTable(frame: Frame, withCost: boolean): ReportTable {
  const { runtime, period } = frame;
  const kept = keptFor(frame, 'purchase-orders', period);
  const bySupplier = new Map<
    string,
    { spend: number; committed: number; received: ReceivedOrder[] }
  >();
  const entry = (id: string) => {
    const found = bySupplier.get(id) ?? { spend: 0, committed: 0, received: [] };
    bySupplier.set(id, found);
    return found;
  };
  for (const po of readablePurchaseOrders(frame)) {
    if (!COMMITTED_PO.includes(po.status) || !inRange(po.createdBusinessDate, period)) continue;
    const supplier = entry(po.supplierId);
    supplier.spend += usdMinor(addMoney(po.subtotal, po.freight), po.fxRateToUsd);
    supplier.committed += 1;
  }
  for (const received of receivedIn(frame, period))
    entry(received.po.supplierId).received.push(received);
  const ranked = [...bySupplier.entries()]
    .sort((a, b) =>
      withCost
        ? b[1].spend - a[1].spend || a[0].localeCompare(b[0])
        : b[1].committed - a[1].committed || a[0].localeCompare(b[0]),
    )
    .slice(0, TOP_ROWS);
  return {
    key: 'bySupplier',
    records: 'purchase-orders',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: ranked.map(([supplierId, data]) => {
      const committedDoor = poDoor(
        poFilter(frame, {
          createdBusinessDate: between(period),
          status: { in: COMMITTED_PO },
          supplierId,
        }),
      );
      const lines = data.received.reduce((sum, item) => sum + item.lines, 0);
      return {
        key: supplierId,
        label: runtime.store.dataset.suppliers.get(supplierId)?.displayName ?? supplierId,
        cells: {
          ...(withCost ? { spend: value(data.spend, data.committed, committedDoor, kept) } : {}),
          orders: value(data.committed, data.committed, committedDoor, kept),
          onTimeDelivery: value(
            ratio(
              data.received.reduce((sum, item) => sum + item.onTime, 0),
              lines,
            ),
            data.received.length,
            receivedDoor(frame, period, { supplierId }),
            kept,
          ),
        },
      };
    }),
  };
}

function receivedTrend(frame: Frame): ReportTable {
  return {
    key: 'received',
    records: 'purchase-orders',
    rows: frame.buckets.map((bucket) => {
      const kept = keptFor(frame, 'purchase-orders', bucket);
      const received = receivedIn(frame, bucket);
      const lines = received.reduce((sum, entry) => sum + entry.lines, 0);
      const door = receivedDoor(frame, bucket);
      return {
        key: bucket.from,
        label: bucket.from,
        range: bucket,
        cells: {
          received: value(received.length, received.length, door, kept),
          onTimeDelivery: value(
            ratio(
              received.reduce((sum, entry) => sum + entry.onTime, 0),
              lines,
            ),
            received.length,
            door,
            kept,
          ),
        },
      };
    }),
  };
}

// ---------------------------------------------------------------------------

/**
 * Section 16 "Finance": the period's invoicing and collections. The book of
 * receivables as of today, its aging and DSO are the finance overview's own
 * read (section 13), which the report page asks for beside this one.
 */
export function financeReport(runtime: ApiRuntime, query: ReportQuery = {}): ReportAnswer {
  const frame = resolveFrame(runtime, query);
  checkCustomerFilters(query);
  const { access } = frame;
  const figures: ReportFigure[] = [];
  const tables: ReportTable[] = [];
  const anomalies: ReportAnomaly[] = [];
  const invoices = access.allows('invoicing', 'invoices.view');
  const payments = access.allows('collections', 'payments.view');
  if (invoices) {
    figures.push(...revenueFigures(frame, false), overdueOfInvoicedFigure(frame));
    tables.push(overdueByIssue(frame));
  }
  if (payments) {
    figures.push(collectedFigure(frame));
    tables.push(paymentMethods(frame));
  }
  if (invoices || payments) tables.unshift(financeTrend(frame, invoices, payments));
  return answer(frame, 'finance', ['invoices', 'payments'], {
    figures,
    tables,
    anomalies,
    filters: customerFilters(query),
    options: { region: regionOptions(), segment: segmentOptions() },
  });
}

interface PaymentTotals {
  payments: number;
  collected: number;
  byMethod: Map<PaymentMethod, { payments: number; collected: number }>;
}

/** Posted payments received in a range: what came in, on the day it came (section 13 "cash collected"). */
function paymentsIn(frame: Frame, range: ReportRange): PaymentTotals {
  const totals: PaymentTotals = { payments: 0, collected: 0, byMethod: new Map() };
  const posted = once(frame, 'payments', () =>
    [...frame.runtime.store.dataset.payments.values()]
      .filter(
        (payment) =>
          payment.status === 'posted' &&
          customerMatches(frame.runtime, payment.customerId, frame.query),
      )
      .map((payment) => ({
        day: dayNumber(payment.receivedDate),
        method: payment.method,
        amount: usdMinor(payment.amount, payment.fxRateToUsd),
      })),
  );
  const first = dayNumber(range.from);
  const last = dayNumber(range.to);
  for (const payment of posted) {
    if (payment.day < first || payment.day > last) continue;
    const amount = payment.amount;
    totals.payments += 1;
    totals.collected += amount;
    const method = totals.byMethod.get(payment.method) ?? { payments: 0, collected: 0 };
    method.payments += 1;
    method.collected += amount;
    totals.byMethod.set(payment.method, method);
  }
  return totals;
}

function paymentFilter(frame: Frame, range: ReportRange, extra: Record<string, FilterValue> = {}) {
  return {
    receivedDate: between(range),
    status: { in: ['posted'] },
    ...customerFilter(frame.query),
    ...extra,
  };
}

const paymentsDoor = (filter: Record<string, FilterValue>): ReportDoor => ({
  list: 'payments',
  filter,
});

function collectedFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const totals = paymentsIn(frame, range);
    return value(
      totals.collected,
      totals.payments,
      paymentsDoor(paymentFilter(frame, range)),
      keptFor(frame, 'payments', range),
    );
  };
  return {
    key: 'collected',
    basis: 'period',
    records: 'payments',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

/**
 * Of what the period invoiced, the share overdue today: the overdue trend the
 * records can state, since a past state of the book is not kept (section 75.4).
 */
function overdueOfInvoicedFigure(frame: Frame): ReportFigure {
  const of = (range: ReportRange): ReportValue => {
    const { invoiced, overdue, overdueCount } = overdueOfIssued(frame, range);
    return value(
      ratio(overdue, invoiced),
      overdueCount,
      invoicesDoor({ ...invoiceFilter(range, frame.query), collectionState: { in: ['overdue'] } }),
      keptFor(frame, 'invoices', range),
    );
  };
  return {
    key: 'overdueOfInvoiced',
    basis: 'period',
    records: 'invoices',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

function overdueOfIssued(frame: Frame, range: ReportRange) {
  let invoiced = 0;
  let count = 0;
  let overdue = 0;
  let overdueCount = 0;
  const first = dayNumber(range.from);
  const last = dayNumber(range.to);
  for (const invoice of invoiceFacts(frame).invoices) {
    if (invoice.day < first || invoice.day > last) continue;
    invoiced += invoice.total;
    count += 1;
    if (invoice.overdue) {
      overdue += invoice.outstanding;
      overdueCount += 1;
    }
  }
  return { invoiced, count, overdue, overdueCount };
}

function overdueByIssue(frame: Frame): ReportTable {
  return {
    key: 'overdueByIssue',
    records: 'invoices',
    rows: frame.buckets.map((bucket) => {
      const kept = keptFor(frame, 'invoices', bucket);
      const totals = overdueOfIssued(frame, bucket);
      const all = invoicesDoor(invoiceFilter(bucket, frame.query));
      const late = invoicesDoor({
        ...invoiceFilter(bucket, frame.query),
        collectionState: { in: ['overdue'] },
      });
      return {
        key: bucket.from,
        label: bucket.from,
        range: bucket,
        cells: {
          invoicedTotal: value(totals.invoiced, totals.count, all, kept),
          overdue: value(totals.overdue, totals.overdueCount, late, kept),
          overdueShare: value(
            ratio(totals.overdue, totals.invoiced),
            totals.overdueCount,
            late,
            kept,
          ),
        },
      };
    }),
  };
}

function financeTrend(frame: Frame, invoices: boolean, payments: boolean): ReportTable {
  return {
    key: 'trend',
    records: 'invoices',
    rows: frame.buckets.map((bucket) => {
      const cells: Record<string, ReportValue> = {};
      if (invoices) Object.assign(cells, revenueTrendCells(frame, bucket));
      if (payments) {
        const totals = paymentsIn(frame, bucket);
        cells['collected'] = value(
          totals.collected,
          totals.payments,
          paymentsDoor(paymentFilter(frame, bucket)),
          keptFor(frame, 'payments', bucket),
        );
      }
      return { key: bucket.from, label: bucket.from, range: bucket, cells };
    }),
  };
}

const METHOD_ORDER: PaymentMethod[] = [
  'ach',
  'wire',
  'credit_card',
  'check',
  'pix',
  'boleto',
  'other',
];

function paymentMethods(frame: Frame): ReportTable {
  const kept = keptFor(frame, 'payments', frame.period);
  const totals = paymentsIn(frame, frame.period);
  return {
    key: 'methods',
    records: 'payments',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: METHOD_ORDER.filter((method) => totals.byMethod.has(method)).map((method) => {
      const entry = totals.byMethod.get(method) as { payments: number; collected: number };
      const door = paymentsDoor(paymentFilter(frame, frame.period, { method: { in: [method] } }));
      return {
        key: method,
        label: method,
        cells: {
          collected: value(entry.collected, entry.payments, door, kept),
          payments: value(entry.payments, entry.payments, door, kept),
          share: value(ratio(entry.collected, totals.collected), entry.payments, door, kept),
        },
      };
    }),
    total: {
      key: 'total',
      label: 'All methods',
      cells: {
        collected: value(
          totals.collected,
          totals.payments,
          paymentsDoor(paymentFilter(frame, frame.period)),
          kept,
        ),
        payments: value(
          totals.payments,
          totals.payments,
          paymentsDoor(paymentFilter(frame, frame.period)),
          kept,
        ),
      },
    },
  };
}

// ---------------------------------------------------------------------------

/**
 * Section 16 "Support" and section 72.11. The backlog as of today is the
 * inbox's own read (`GET /support/metrics`), which the report page asks for
 * beside this one.
 */
export function supportReport(runtime: ApiRuntime, query: ReportQuery = {}): ReportAnswer {
  const frame = resolveFrame(runtime, query);
  checkCustomerFilters(query);
  const { access } = frame;
  const figures: ReportFigure[] = [];
  const tables: ReportTable[] = [];
  const anomalies: ReportAnomaly[] = [];
  if (access.allows('tickets', 'support.view')) {
    figures.push(
      ticketVolumeFigure(frame),
      firstResponseFigure(frame),
      resolutionFigure(frame),
      satisfactionFigure(frame),
      escalationFigure(frame),
    );
    tables.push(
      ticketTrend(frame),
      slaByPriority(frame),
      resolutionBands(frame),
      escalationsByCategory(frame),
    );
    anomalies.push(...supportAnomalies(frame));
  }
  return answer(frame, 'support', ['tickets'], {
    figures,
    tables,
    anomalies,
    filters: customerFilters(query),
    options: { region: regionOptions(), segment: segmentOptions() },
  });
}

interface TicketFact {
  ticket: SupportTicket;
  createdDate: string;
  resolvedDate: string | undefined;
  resolutionMinutes: number | undefined;
  escalated: boolean;
}

/** The tickets the filters leave, with the dates and minutes the ticket list states for them, read once per request. */
function ticketFacts(frame: Frame): TicketFact[] {
  return once(frame, 'tickets', () => readTicketFacts(frame));
}

function readTicketFacts(frame: Frame): TicketFact[] {
  const { runtime, query } = frame;
  const facts: TicketFact[] = [];
  for (const ticket of runtime.store.dataset.tickets.values()) {
    if (!customerMatches(runtime, ticket.customerId, query)) continue;
    refreshTicketSla(runtime, ticket);
    facts.push({
      ticket,
      createdDate: businessDateOf(ticket.metadata.createdAt),
      resolvedDate: ticket.resolvedAt ? businessDateOf(ticket.resolvedAt) : undefined,
      resolutionMinutes: ticket.resolvedAt
        ? businessMinutesBetween(ticket.metadata.createdAt, ticket.resolvedAt)
        : undefined,
      escalated: ticket.escalationReason !== undefined || ticket.status === 'escalated',
    });
  }
  return facts;
}

function ticketFilter(
  frame: Frame,
  extra: Record<string, FilterValue>,
): Record<string, FilterValue> {
  return { ...customerFilter(frame.query), ...extra };
}

const ticketsDoor = (filter: Record<string, FilterValue>): ReportDoor => ({
  list: 'tickets',
  filter,
});

function ticketFigure(
  frame: Frame,
  key: string,
  measure: (
    facts: TicketFact[],
    range: ReportRange,
  ) => { value: number | null; count: number; door: ReportDoor },
): ReportFigure {
  const facts = ticketFacts(frame);
  const of = (range: ReportRange): ReportValue => {
    const result = measure(facts, range);
    return value(result.value, result.count, result.door, keptFor(frame, 'tickets', range));
  };
  return {
    key,
    basis: 'period',
    records: 'tickets',
    ...of(frame.period),
    ...(frame.comparison ? { previous: of(frame.comparison) } : {}),
  };
}

function ticketVolumeFigure(frame: Frame): ReportFigure {
  return ticketFigure(frame, 'ticketVolume', (facts, range) => {
    const count = facts.filter((fact) => inRange(fact.createdDate, range)).length;
    return {
      value: count,
      count,
      door: ticketsDoor(ticketFilter(frame, { createdDate: between(range) })),
    };
  });
}

/** Section 72.11 over the tickets opened in the period whose first response is decided. */
function firstResponseFigure(frame: Frame): ReportFigure {
  return ticketFigure(frame, 'firstResponseSla', (facts, range) => {
    const decided = facts.filter(
      (fact) =>
        inRange(fact.createdDate, range) &&
        (fact.ticket.firstResponseSla === 'met' || fact.ticket.firstResponseSla === 'breached'),
    );
    const met = decided.filter((fact) => fact.ticket.firstResponseSla === 'met').length;
    return {
      value: ratio(met, decided.length),
      count: decided.length,
      door: ticketsDoor(
        ticketFilter(frame, {
          createdDate: between(range),
          firstResponseSla: { in: ['met', 'breached'] },
        }),
      ),
    };
  });
}

/** The median business minutes from opening to resolution, over the tickets resolved in the period. */
function resolutionFigure(frame: Frame): ReportFigure {
  return ticketFigure(frame, 'resolutionTime', (facts, range) => {
    const resolved = facts.filter((fact) => fact.resolvedDate && inRange(fact.resolvedDate, range));
    return {
      value: median(resolved.map((fact) => fact.resolutionMinutes as number)),
      count: resolved.length,
      door: ticketsDoor(ticketFilter(frame, { resolvedDate: between(range) })),
    };
  });
}

/** The mean satisfaction score, to one decimal, of the scored tickets resolved in the period. */
function satisfactionFigure(frame: Frame): ReportFigure {
  return ticketFigure(frame, 'satisfaction', (facts, range) => {
    const scored = facts.filter(
      (fact) =>
        fact.resolvedDate !== undefined &&
        inRange(fact.resolvedDate, range) &&
        fact.ticket.satisfactionScore !== undefined,
    );
    const sum = scored.reduce(
      (total, fact) => total + (fact.ticket.satisfactionScore as number),
      0,
    );
    return {
      value: scored.length === 0 ? null : Math.round((sum / scored.length) * 10) / 10,
      count: scored.length,
      door: ticketsDoor(
        ticketFilter(frame, {
          resolvedDate: between(range),
          satisfactionScore: { is_not_empty: true },
        }),
      ),
    };
  });
}

function escalationFigure(frame: Frame): ReportFigure {
  return ticketFigure(frame, 'escalationRate', (facts, range) => {
    const opened = facts.filter((fact) => inRange(fact.createdDate, range));
    const escalated = opened.filter((fact) => fact.escalated).length;
    return {
      value: ratio(escalated, opened.length),
      count: escalated,
      door: ticketsDoor(ticketFilter(frame, { createdDate: between(range), escalated: true })),
    };
  });
}

function ticketTrend(frame: Frame): ReportTable {
  const facts = ticketFacts(frame);
  return {
    key: 'trend',
    records: 'tickets',
    rows: frame.buckets.map((bucket) => {
      const kept = keptFor(frame, 'tickets', bucket);
      const opened = facts.filter((fact) => inRange(fact.createdDate, bucket)).length;
      const resolved = facts.filter(
        (fact) => fact.resolvedDate && inRange(fact.resolvedDate, bucket),
      ).length;
      return {
        key: bucket.from,
        label: bucket.from,
        range: bucket,
        cells: {
          opened: value(
            opened,
            opened,
            ticketsDoor(ticketFilter(frame, { createdDate: between(bucket) })),
            kept,
          ),
          resolved: value(
            resolved,
            resolved,
            ticketsDoor(ticketFilter(frame, { resolvedDate: between(bucket) })),
            kept,
          ),
        },
      };
    }),
  };
}

const PRIORITIES: SupportTicket['priority'][] = ['urgent', 'high', 'normal', 'low'];

function slaByPriority(frame: Frame): ReportTable {
  const facts = ticketFacts(frame);
  const kept = keptFor(frame, 'tickets', frame.period);
  const cells = (priorities: SupportTicket['priority'][]): Record<string, ReportValue> => {
    const opened = facts.filter(
      (fact) =>
        inRange(fact.createdDate, frame.period) && priorities.includes(fact.ticket.priority),
    );
    const met = opened.filter((fact) => fact.ticket.firstResponseSla === 'met').length;
    const breached = opened.filter((fact) => fact.ticket.firstResponseSla === 'breached').length;
    const base = { createdDate: between(frame.period), priority: { in: priorities } };
    return {
      opened: value(opened.length, opened.length, ticketsDoor(ticketFilter(frame, base)), kept),
      met: value(
        met,
        met,
        ticketsDoor(ticketFilter(frame, { ...base, firstResponseSla: { in: ['met'] } })),
        kept,
      ),
      breached: value(
        breached,
        breached,
        ticketsDoor(ticketFilter(frame, { ...base, firstResponseSla: { in: ['breached'] } })),
        kept,
      ),
      firstResponseSla: value(
        ratio(met, met + breached),
        met + breached,
        ticketsDoor(
          ticketFilter(frame, { ...base, firstResponseSla: { in: ['met', 'breached'] } }),
        ),
        kept,
      ),
    };
  };
  return {
    key: 'byPriority',
    records: 'tickets',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: PRIORITIES.map((priority) => ({
      key: priority,
      label: priority,
      cells: cells([priority]),
    })),
    total: { key: 'total', label: 'All priorities', cells: cells(PRIORITIES) },
  };
}

const RESOLUTION_BANDS: { key: string; low: number; high: number | null }[] = [
  { key: 'under-4h', low: 0, high: 239 },
  { key: '4-8h', low: 240, high: 479 },
  { key: '1-3d', low: 480, high: 1_799 },
  { key: '3-5d', low: 1_800, high: 2_999 },
  { key: 'over-5d', low: 3_000, high: null },
];

/** Tickets resolved in the period by business time to resolution (a business day is ten hours, section 68.3). */
function resolutionBands(frame: Frame): ReportTable {
  const facts = ticketFacts(frame).filter(
    (fact) => fact.resolvedDate !== undefined && inRange(fact.resolvedDate, frame.period),
  );
  const kept = keptFor(frame, 'tickets', frame.period);
  return {
    key: 'resolutionBands',
    records: 'tickets',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: RESOLUTION_BANDS.map((bandOf) => {
      const count = facts.filter(
        (fact) =>
          (fact.resolutionMinutes as number) >= bandOf.low &&
          (bandOf.high === null || (fact.resolutionMinutes as number) <= bandOf.high),
      ).length;
      return {
        key: bandOf.key,
        label: bandOf.key,
        cells: {
          resolved: value(
            count,
            count,
            ticketsDoor(
              ticketFilter(frame, {
                resolvedDate: between(frame.period),
                resolutionMinutes:
                  bandOf.high === null
                    ? { gte: bandOf.low }
                    : { gte: bandOf.low, lte: bandOf.high },
              }),
            ),
            kept,
          ),
        },
      };
    }),
    total: {
      key: 'total',
      label: 'Tickets resolved',
      cells: {
        resolved: value(
          facts.length,
          facts.length,
          ticketsDoor(ticketFilter(frame, { resolvedDate: between(frame.period) })),
          kept,
        ),
      },
    },
  };
}

function escalationsByCategory(frame: Frame): ReportTable {
  const facts = ticketFacts(frame).filter((fact) => inRange(fact.createdDate, frame.period));
  const kept = keptFor(frame, 'tickets', frame.period);
  const categories = [...new Set(facts.map((fact) => fact.ticket.category))].sort();
  return {
    key: 'byCategory',
    records: 'tickets',
    ...(kept ? {} : { missing: 'not-kept' as const }),
    rows: categories
      .map((category) => {
        const here = facts.filter((fact) => fact.ticket.category === category);
        const escalated = here.filter((fact) => fact.escalated).length;
        const base = { createdDate: between(frame.period), category: { in: [category] } };
        return {
          key: category,
          label: category,
          cells: {
            opened: value(here.length, here.length, ticketsDoor(ticketFilter(frame, base)), kept),
            escalated: value(
              escalated,
              escalated,
              ticketsDoor(ticketFilter(frame, { ...base, escalated: true })),
              kept,
            ),
          },
        };
      })
      .sort(
        (a, b) =>
          (b.cells.opened.value ?? 0) - (a.cells.opened.value ?? 0) || a.key.localeCompare(b.key),
      ),
    total: {
      key: 'total',
      label: 'All categories',
      cells: {
        opened: value(
          facts.length,
          facts.length,
          ticketsDoor(ticketFilter(frame, { createdDate: between(frame.period) })),
          kept,
        ),
        escalated: value(
          facts.filter((fact) => fact.escalated).length,
          facts.filter((fact) => fact.escalated).length,
          ticketsDoor(ticketFilter(frame, { createdDate: between(frame.period), escalated: true })),
          kept,
        ),
      },
    },
  };
}

/** Tickets opened in the last bucket against the earlier ones: what an incident writes (section 77.9). */
function supportAnomalies(frame: Frame): ReportAnomaly[] {
  const facts = ticketFacts(frame);
  const counts = frame.buckets.map(
    (bucket) => facts.filter((fact) => inRange(fact.createdDate, bucket)).length,
  );
  const anomaly = bucketAnomaly(frame, 'support', 'ticketVolume', 'tickets', counts, (range) =>
    ticketsDoor(ticketFilter(frame, { createdDate: between(range) })),
  );
  return anomaly ? [anomaly] : [];
}
