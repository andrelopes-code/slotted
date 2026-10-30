import {
  addDays,
  compareDates,
  diffDays,
  parseBusinessDate,
  weekdayOf,
  type Customer,
} from '../../domain';
import type { Random } from '../random';
import type { SeedContext } from './context';
import type { CustomerSeedResult } from './customers';
import type { TenantSeedResult } from './tenant';
import { decideOrderKind, type OrderKind, type OrderSkeleton } from './orders';

const WAREHOUSE_BY_REGION: Record<string, string> = {
  IL: 'CHI-01',
  WI: 'CHI-01',
  MN: 'CHI-01',
  IA: 'CHI-01',
  MO: 'CHI-01',
  NE: 'CHI-01',
  KS: 'CHI-01',
  SD: 'CHI-01',
  IN: 'CHI-01',
  MI: 'CHI-01',
  OH: 'CHI-01',
  KY: 'CHI-01',
  TX: 'DAL-01',
  OK: 'DAL-01',
  LA: 'DAL-01',
  AR: 'DAL-01',
  NM: 'DAL-01',
  GA: 'ATL-01',
  FL: 'ATL-01',
  AL: 'ATL-01',
  SC: 'ATL-01',
  NC: 'ATL-01',
  TN: 'ATL-01',
  CO: 'DEN-01',
  UT: 'DEN-01',
  AZ: 'DEN-01',
  ID: 'DEN-01',
  NV: 'DEN-01',
  WA: 'DEN-01',
  OR: 'DEN-01',
  CA: 'DEN-01',
  NJ: 'NJ-01',
  NY: 'NJ-01',
  PA: 'NJ-01',
  CT: 'NJ-01',
  MA: 'NJ-01',
  RI: 'NJ-01',
  MD: 'NJ-01',
  VA: 'NJ-01',
};

const WEEKDAY_FACTOR = [0.05, 1.05, 1.1, 1.1, 1.05, 0.95, 0.12];
const WEEKDAY_NORMALIZER = 7 / WEEKDAY_FACTOR.reduce((sum, factor) => sum + factor, 0);

/** Mild seasonality by month (1–12). */
const SEASONALITY = [0, 0.92, 0.98, 1.08, 1.04, 1.02, 1.0, 0.94, 1.0, 1.1, 1.06, 0.96, 0.82];

export function dailyVolumeFactor(
  date: string,
  today: string,
  historyYears = 2,
  annualGrowth = 0.08,
): number {
  const { month } = parseBusinessDate(date);
  const weekday = weekdayOf(date);
  const yearsBack = diffDays(today, date) / 365;
  // Growth is centred on the history midpoint so the average daily rate is preserved.
  const growth = Math.pow(1 + annualGrowth, historyYears / 2 - yearsBack);
  return (
    (WEEKDAY_FACTOR[weekday] as number) *
    WEEKDAY_NORMALIZER *
    (SEASONALITY[month] as number) *
    growth
  );
}

export function warehouseForRegion(tenant: TenantSeedResult, region: string): string {
  const code = WAREHOUSE_BY_REGION[region] ?? 'CHI-01';
  return (
    tenant.warehouseIdsByCode.get(code) ??
    (tenant.warehouseIdsByCode.values().next().value as string)
  );
}

/**
 * Builds the chronological order skeleton for the whole logical history.
 * Skeleton decisions use only the order's own random stream, so an index can
 * be rebuilt in isolation later.
 */
export function buildOrderSkeletons(
  context: SeedContext,
  tenant: TenantSeedResult,
  customers: CustomerSeedResult,
): OrderSkeleton[] {
  const { scale, today, historyStart, dataset } = context;
  const random = context.random('timeline/orders');
  const perDay = scale.ordersPerYear / 365;
  const skeletons: OrderSkeleton[] = [];
  const weighted = customers.orderWeightedCustomerIds;
  for (let date = historyStart; compareDates(date, today) <= 0; date = addDays(date, 1)) {
    const expected = perDay * dailyVolumeFactor(date, today, scale.historyMonths / 12);
    const count = Math.max(
      0,
      Math.round(expected + random.normal(0, Math.sqrt(Math.max(1, expected)))),
    );
    for (let position = 0; position < count; position += 1) {
      const index = skeletons.length;
      const stream = context.random(`order/${index}/skeleton`);
      const customerId = pickCustomerFor(stream, weighted, dataset.customers, date);
      if (!customerId) continue;
      const city = customers.cityByCustomer.get(customerId);
      skeletons.push({
        index,
        customerId,
        orderDate: date,
        warehouseId: warehouseForRegion(tenant, city?.region ?? 'IL'),
        kind: decideOrderKind(stream, diffDays(today, date)),
      });
    }
  }
  return skeletons;
}

function pickCustomerFor(
  random: Random,
  weighted: readonly string[],
  customersById: Map<string, Customer>,
  date: string,
): string | undefined {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = random.pick(weighted);
    const customer = customersById.get(candidate);
    if (!customer) continue;
    if (customer.customerSince && compareDates(customer.customerSince, date) > 0) continue;
    if (customer.status === 'inactive' && diffDays(customersLastActiveGuess(customer), date) < 0)
      continue;
    return candidate;
  }
  return undefined;
}

/** Inactive customers stop ordering roughly a year before the demo clock. */
function customersLastActiveGuess(customer: Customer): string {
  return addDays(customer.metadata.updatedAt.slice(0, 10), -30);
}

export function firstIndexesByYear(skeletons: readonly OrderSkeleton[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const skeleton of skeletons) {
    const year = Number(skeleton.orderDate.slice(0, 4));
    if (!map.has(year)) map.set(year, skeleton.index);
  }
  return map;
}

export type { OrderKind };
