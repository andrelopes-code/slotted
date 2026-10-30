import { describe, expect, it } from 'vitest';
import { formatBusinessNumber, formatId, SequenceAllocator } from './ids';
import { applyBps, multiplyMoneyByQuantity, roundHalfUp, usd } from './money';
import { documentTotals, evaluateOrderApproval, priceLine, taxRateBpsFor } from './pricing';
import { milliToQuantity, quantityFitsPrecision, quantityToMilli } from './quantity';
import {
  addBusinessMinutes,
  addDays,
  businessDateOf,
  businessDateToInstant,
  businessMinutesBetween,
  diffDays,
  lastBusinessDayOfMonth,
} from './time';

describe('money', () => {
  it('rounds half-up symmetrically', () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(2.4999)).toBe(2);
    expect(roundHalfUp(-2.5)).toBe(-3);
  });

  it('multiplies by decimal quantities in minor units', () => {
    expect(multiplyMoneyByQuantity(usd(1_999), '3').minor).toBe(5_997);
    expect(multiplyMoneyByQuantity(usd(1_000), '2.5').minor).toBe(2_500);
    expect(applyBps(usd(10_000), 825).minor).toBe(825);
  });
});

describe('quantity', () => {
  it('round-trips decimal strings through thousandths', () => {
    expect(quantityToMilli('12.5')).toBe(12_500);
    expect(milliToQuantity(12_500)).toBe('12.5');
    expect(milliToQuantity(-250, 3)).toBe('-0.25');
    expect(quantityFitsPrecision('1.25', 1)).toBe(false);
    expect(quantityFitsPrecision('1.2', 1)).toBe(true);
  });
});

describe('ids', () => {
  it('formats ids and business numbers', () => {
    expect(formatId('customer', 428)).toBe('cus_000428');
    expect(formatBusinessNumber('salesOrder', 1842, 2026)).toBe('SO-2026-01842');
    expect(formatBusinessNumber('ticket', 10492)).toBe('TCK-10492');
  });

  it('skips reserved business numbers', () => {
    const allocator = new SequenceAllocator();
    allocator.reserveBusinessNumber('SO-2026-00002');
    expect(allocator.nextBusinessNumber('salesOrder', 2026)).toBe('SO-2026-00001');
    expect(allocator.nextBusinessNumber('salesOrder', 2026)).toBe('SO-2026-00003');
  });
});

describe('pricing', () => {
  it('prices a line and reconciles header totals from rounded lines', () => {
    const line = priceLine({
      quantity: '3',
      listUnitPrice: usd(12_345),
      discountBps: 1_000,
      taxRateBps: 825,
      unitCost: usd(7_000),
    });
    expect(line.netAmount.minor).toBe(33_331); // 37035 - 3704 (3703.5 rounds up)
    expect(line.taxAmount.minor).toBe(2_750);
    expect(line.totalAmount.minor).toBe(36_081);
    const totals = documentTotals([line], usd(1_500), 'USD');
    expect(totals.discountTotal.minor).toBe(3_704);
    expect(totals.total.minor).toBe(33_331 + 2_750 + 1_500);
  });

  it('evaluates order approval steps', () => {
    const result = evaluateOrderApproval({
      approvalValueUsdMinor: 12_000_000,
      grossMarginBps: 1_400,
      maxLineDiscountBps: 0,
      creditLimitExceeded: false,
      customerOnHold: false,
    });
    expect(result.required).toBe(true);
    expect(result.steps.map((step) => step.requiredRole)).toEqual([
      'sales_manager',
      'finance_manager',
    ]);
    expect(taxRateBpsFor('IL', { type: 'taxable' })).toBe(825);
    expect(taxRateBpsFor('IL', { type: 'exempt' })).toBe(0);
  });
});

describe('time', () => {
  /**
   * `diffDays` is called with instants as well as dates; the day-number cache
   * kept the instant as the date of its day, and `addDays` then answered
   * "2026-08-28T13:00:00Z" — four seeded bank transactions carried it.
   */
  it('answers a date, never an instant, after reading an instant of the same day', () => {
    diffDays('2027-03-10T13:00:00Z', '2027-03-01');
    expect(addDays('2027-03-09', 1)).toBe('2027-03-10');
  });

  it('derives Chicago business dates and instants', () => {
    expect(businessDateOf('2026-09-04T15:00:00Z')).toBe('2026-09-04');
    expect(businessDateOf('2026-09-05T03:30:00Z')).toBe('2026-09-04');
    expect(businessDateToInstant('2026-09-04', 9)).toBe('2026-09-04T14:00:00Z');
    expect(businessDateToInstant('2026-01-15', 9)).toBe('2026-01-15T15:00:00Z');
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(lastBusinessDayOfMonth(2026, 8)).toBe('2026-08-31');
    expect(lastBusinessDayOfMonth(2026, 5)).toBe('2026-05-29');
  });

  it('counts business minutes across nights and weekends', () => {
    // Friday 2026-09-04 17:00 Chicago -> Monday 2026-09-07 09:00 Chicago
    const start = businessDateToInstant('2026-09-04', 17);
    const end = businessDateToInstant('2026-09-07', 9);
    expect(businessMinutesBetween(start, end)).toBe(120);
    expect(addBusinessMinutes(start, 120)).toBe(end);
    expect(addBusinessMinutes(businessDateToInstant('2026-09-04', 10), 15)).toBe(
      businessDateToInstant('2026-09-04', 10, 15),
    );
  });
});
