import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { By } from '@angular/platform-browser';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CHART_ENGINE } from '@slotted/angular/chart';
import type { FilterRule } from '@slotted/core/filter';
import { emptyQuery } from '@slotted/core/grid';
import {
  NexoraApiError,
  type NexoraApi,
  type ReportAnswer,
  type ReportDoor,
  type ReportList,
  type ReportValue,
} from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { doorLink } from '../../core/analytics/report.model';
import { doorFilter, type DoorField } from '../../core/backend/door';
import { DemoStore } from '../../core/demo/demo.store';
import { toListQuery } from '../../core/backend/list-query';
import { SessionStore } from '../../core/session/session.store';
import { creditMemoFilterFields } from '../finance/credit-memo-columns';
import { FINANCE_DOOR_FIELDS, invoiceFilterFields, paymentFilterFields } from '../finance/finance-columns';
import { MOVEMENT_DOOR_FIELDS, movementFilterFields } from '../inventory/movement-columns';
import { STOCK_DOOR_FIELDS, stockFilterFields } from '../inventory/stock-columns';
import { transferFilterFields } from '../inventory/transfers-page';
import { ORDER_DOOR_FIELDS, ORDER_FILTER_FIELDS } from '../orders/order-labels';
import { PURCHASE_ORDER_DOOR_FIELDS, purchaseOrderFilterFields } from '../procurement/procurement-columns';
import { QUOTE_DOOR_FIELDS, QUOTE_FILTER_FIELDS } from '../quotes/quotes-page';
import { TICKET_DOOR_FIELDS } from '../support/inbox-page';
import { ReportPage } from './report-page';

const silentEngine = () => ({
  update: () => Promise.resolve(),
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});

/** The fields each list page's bar reads a door with: its own, and the ones a door alone names. */
const LIST_FIELDS: Record<ReportList, readonly DoorField[]> = {
  orders: [...ORDER_FILTER_FIELDS, ...ORDER_DOOR_FIELDS],
  quotes: [...QUOTE_FILTER_FIELDS, ...QUOTE_DOOR_FIELDS],
  invoices: [...invoiceFilterFields(), ...FINANCE_DOOR_FIELDS],
  'credit-memos': [...creditMemoFilterFields(), ...FINANCE_DOOR_FIELDS],
  payments: [...paymentFilterFields(), ...FINANCE_DOOR_FIELDS],
  tickets: TICKET_DOOR_FIELDS,
  stock: [...stockFilterFields(() => true, []), ...STOCK_DOOR_FIELDS],
  movements: [...movementFilterFields([]), ...MOVEMENT_DOOR_FIELDS],
  transfers: transferFilterFields([]),
  'purchase-orders': [...purchaseOrderFilterFields([]), ...PURCHASE_ORDER_DOOR_FIELDS],
};

const unavailable = () =>
  new NexoraApiError('SERVICE_UNAVAILABLE', 'Nexora did not answer', { status: 503, retryable: true });

describe('a report', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestBackend(),
        provideRouter(routes),
        provideLocationMocks(),
        { provide: CHART_ENGINE, useValue: silentEngine },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('maya-chen');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const text = (harness: RouterTestingHarness) => harness.fixture.nativeElement.textContent as string;
  const query = (harness: RouterTestingHarness, selector: string) =>
    (harness.fixture.nativeElement as HTMLElement).querySelector(selector);

  const settle = async (harness: RouterTestingHarness, done: () => boolean): Promise<void> => {
    for (let attempt = 0; attempt < 240 && !done(); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
  };

  const listOf: Record<ReportList, (q: Parameters<NexoraApi['orders']['list']>[0]) => Promise<{ page: { totalItems: number } }>> = {
    orders: (q) => api.orders.list(q),
    quotes: (q) => api.quotes.list(q),
    invoices: (q) => api.finance.invoices.list(q),
    'credit-memos': (q) => api.finance.creditMemos.list(q),
    payments: (q) => api.finance.payments.list(q),
    tickets: (q) => api.support.tickets.list(q),
    stock: (q) => api.inventory.list(q),
    movements: (q) => api.inventory.movements(q),
    transfers: (q) => api.inventory.transfers.list(q),
    'purchase-orders': (q) => api.purchaseOrders.list(q),
  };

  /**
   * A door as the reader follows it: the link's address, read back by the list page's bar into its
   * pills, sent as the list page sends its query. The list's total is the value's count.
   */
  async function follow(door: ReportDoor, labels: Record<string, string>): Promise<number> {
    const link = doorLink(door, labels);
    // A door with no condition is the whole list: the stock a valuation counts.
    if (Object.keys(door.filter).length === 0) return (await listOf[door.list]({ pageSize: 25 })).page.totalItems;
    const read = doorFilter(new URLSearchParams(link.params), LIST_FIELDS[door.list]);
    expect(read, JSON.stringify(door)).not.toBeNull();
    // Every condition of the door is a pill the list holds: none is dropped on the way.
    expect(read!.filter.rules.map((rule) => (rule as FilterRule).field).sort(), door.list).toEqual(Object.keys(door.filter).sort());
    const request = toListQuery({ ...emptyQuery({ index: 0, size: 25 }), filter: read!.filter });
    expect(request.flattened).toBe(false);
    return (await listOf[door.list](request.query)).page.totalItems;
  }

  function doorsOf(answer: ReportAnswer): [string, ReportValue][] {
    const values: [string, ReportValue][] = [];
    for (const figure of answer.figures) {
      values.push([`figure ${figure.key}`, figure]);
      if (figure.previous) values.push([`figure ${figure.key} (previous)`, figure.previous]);
    }
    for (const table of answer.tables)
      for (const row of [...table.rows, ...(table.total ? [table.total] : [])])
        for (const [key, cell] of Object.entries(row.cells)) values.push([`${table.key} › ${row.key} › ${key}`, cell]);
    return values.filter(([, cell]) => cell.door !== undefined && cell.value !== null);
  }

  it.each(['executive', 'sales', 'inventory', 'procurement', 'finance', 'support'] as const)(
    'opens every figure, bar and cell of the %s report on a list whose pills count the same records (OV-01)',
    async (report) => {
      const answer = (await api.analytics[report]()) as ReportAnswer;
      const doors = doorsOf(answer);
      expect(doors.length).toBeGreaterThan(5);
      for (const [where, cell] of doors) expect(await follow(cell.door!, answer.labels), where).toBe(cell.count);
    },
    180_000,
  );

  it('carries the names of the records a door names, so the pill says them', async () => {
    const answer = await api.analytics.sales();
    const account = answer.tables.find((table) => table.key === 'byAccount')!.rows[0]!;
    const link = doorLink(account.cells['bookedValue']!.door!, answer.labels);
    const read = doorFilter(new URLSearchParams(link.params), LIST_FIELDS.orders)!;
    expect(read.options['customerId']).toEqual([{ value: account.key, label: account.label }]);
    expect(link.params['orderDate']).toBe(`${answer.period.from}..${answer.period.to}`);
  });

  it('returns from a list it opened to the report on the same period, by the back gesture', async () => {
    const harness = await RouterTestingHarness.create('/analytics/sales?period=7d&compare=none');
    await settle(harness, () => query(harness, '[data-figure="orders"] a') !== null);
    const door = query(harness, '[data-figure="orders"] a') as HTMLAnchorElement;
    door.click();
    await settle(harness, () => TestBed.inject(Router).url.startsWith('/sales/orders'));
    expect(TestBed.inject(Router).url).toContain('orderDate=');
    // The gesture's entry is the report at its period: the address it left, which it reads again.
    const location = TestBed.inject(Location);
    location.back();
    expect(location.path()).toBe('/analytics/sales?period=7d&compare=none');
    await harness.navigateByUrl(location.path());
    expect(TestBed.inject(Router).url).toBe('/analytics/sales?period=7d&compare=none');
    await settle(harness, () => text(harness).includes('Last 7 days'));
    expect(text(harness)).toContain('Last 7 days');
  }, 60_000);

  it('takes the period last chosen when a report is opened with none', async () => {
    const harness = await RouterTestingHarness.create('/analytics/sales?period=7d&compare=year');
    await settle(harness, () => text(harness).includes('Orders booked'));
    await harness.navigateByUrl('/analytics/finance');
    await settle(harness, () => TestBed.inject(Router).url.includes('period='));
    expect(TestBed.inject(Router).url).toBe('/analytics/finance?period=7d&compare=year');
  });

  it('leaves the margin out for a representative and says once who reads it (PM-01, PM-02)', async () => {
    await signIn('noah-bennett');
    const harness = await RouterTestingHarness.create('/analytics/sales');
    await settle(harness, () => query(harness, '[data-testid="withheld"]') !== null && text(harness).includes('Orders booked'));
    expect(query(harness, '[data-figure="bookedMargin"]')).toBeNull();
    for (const header of (harness.fixture.nativeElement as HTMLElement).querySelectorAll('th'))
      expect(header.textContent?.trim()).not.toBe('Margin');
    const withheld = query(harness, '[data-testid="withheld"]')!.textContent!;
    expect(withheld).toContain('margins, which cost.view gives to');
    expect(withheld).toContain('a sales manager');
    expect(withheld).not.toContain('$0');
  });

  it('stays useful when the book of receivables does not arrive, and says what is missing (§33 partial data)', async () => {
    vi.spyOn(api.finance, 'overview').mockRejectedValue(unavailable());
    await signIn('evan-brooks');
    const harness = await RouterTestingHarness.create('/analytics/executive');
    await settle(harness, () => query(harness, '[data-testid="stale"]') !== null && text(harness).includes('Booked value'));
    expect(query(harness, '[data-testid="stale"]')!.textContent).toContain('The book of receivables did not arrive');
    expect(query(harness, '[data-figure="bookedValue"]')!.textContent).toMatch(/\$[\d,]+\.\d\d/);
    expect(query(harness, '[data-figure="receivables"]')!.textContent).toContain('Did not arrive');
  });

  it('draws nothing as a number where the records are not kept: the light window holds 30 days of lines', async () => {
    const harness = await RouterTestingHarness.create('/analytics/sales?period=12m&compare=previous');
    await settle(harness, () => query(harness, '[data-section="byProduct"] [data-testid="not-kept"]') !== null);
    expect(query(harness, '[data-section="byProduct"] [data-testid="not-kept"]')!.textContent).toContain('Nexora keeps order lines and owners from');
    expect(query(harness, '[data-section="byProduct"] [data-testid="table-byProduct"]')).toBeNull();
    expect(query(harness, '[data-figure="discountRate"]')!.textContent).toContain('Not kept for this period');
    expect(query(harness, '[data-figure="bookedValue"]')!.textContent).toMatch(/\$[\d,]+\.\d\d/);
  });

  it('offers only the periods its records are kept for (§75.4)', async () => {
    const harness = await RouterTestingHarness.create('/analytics/support');
    await settle(harness, () => harness.fixture.debugElement.query(By.directive(ReportPage)) !== null);
    const page = harness.fixture.debugElement.query(By.directive(ReportPage)).componentInstance as ReportPage;
    await settle(harness, () => page.store.answer().value !== null);
    expect(page.periods().map((period) => period.key)).toEqual(['7d', '30d']);
    // Orders are kept for the whole history: the sales report offers its 24 months.
    await harness.navigateByUrl('/analytics/sales');
    await settle(harness, () => harness.fixture.debugElement.query(By.directive(ReportPage)) !== null);
    const sales = harness.fixture.debugElement.query(By.directive(ReportPage)).componentInstance as ReportPage;
    await settle(harness, () => sales.store.answer().value !== null && !sales.store.answer().pending);
    expect(sales.periods().map((period) => period.key)).toEqual(['7d', '30d', '90d', '12m', '24m']);
  });

  it('reads its period again when the demo clock moves, so the last seven days end on the new day', async () => {
    const harness = await RouterTestingHarness.create('/analytics/sales?period=7d&compare=previous');
    const page = () => harness.fixture.debugElement.query(By.directive(ReportPage))?.componentInstance as ReportPage | undefined;
    await settle(harness, () => page()?.store.answer().value != null);
    const before = page()!.store.answer().value!.period;
    await TestBed.inject(DemoStore).advanceDays(1);
    // The session is read again, so the page may be a new one: it is looked up on each pass.
    await settle(harness, () => {
      const to = page()?.store.answer().value?.period.to;
      return to !== undefined && to !== before.to;
    });
    const after = page()!.store.answer().value!.period;
    expect(after.days).toBe(7);
    expect(new Date(`${after.to}T12:00:00Z`).getTime() - new Date(`${before.to}T12:00:00Z`).getTime()).toBeGreaterThan(0);
    expect(TestBed.inject(Router).url).toBe('/analytics/sales?period=7d&compare=previous');
  });

  it('keeps its numbers on screen and marks them busy while another period is read (AF-02, CP-08)', async () => {
    const harness = await RouterTestingHarness.create('/analytics/sales?period=30d&compare=previous');
    await settle(harness, () => /\$[\d,]+\.\d\d/.test(query(harness, '[data-figure="bookedValue"]')?.textContent ?? ''));
    const before = query(harness, '[data-figure="bookedValue"]')!.textContent;
    await TestBed.inject(Router).navigateByUrl('/analytics/sales?period=7d&compare=previous', { replaceUrl: true });
    harness.detectChanges();
    expect(query(harness, '.report')!.getAttribute('aria-busy')).toBe('true');
    expect(query(harness, '[data-figure="bookedValue"]')!.textContent).toBe(before);
    expect(query(harness, '[data-figure="bookedValue"] [data-ui="skeleton"]')).toBeNull();
    await settle(harness, () => query(harness, '.report')!.getAttribute('aria-busy') === null);
    expect(query(harness, '[data-figure="bookedValue"]')!.textContent).not.toBe(before);
  });

  it('flags an incident by its rule and opens the tickets it counts', async () => {
    await api.demo.setScenario('support_incident');
    await signIn('support-lead');
    const harness = await RouterTestingHarness.create('/analytics/support?period=30d&compare=previous');
    await settle(harness, () => query(harness, '[data-anomaly="support.ticketVolume"]') !== null);
    const item = query(harness, '[data-anomaly="support.ticketVolume"]')!;
    expect(item.textContent).toContain('above its usual range');
    expect(item.querySelector('a')?.getAttribute('href')).toContain('/support/inbox?createdDate=');
    expect(text(harness)).toContain('plus or minus two standard deviations');
  });

  it('crosses the overdue threshold the overview states under collections pressure (OV-04)', async () => {
    await api.demo.setScenario('collections_pressure');
    await signIn('priya-shah');
    const harness = await RouterTestingHarness.create('/analytics/finance?period=30d&compare=previous');
    await settle(harness, () => query(harness, '[data-anomaly="finance.overdueShare"]') !== null);
    expect(query(harness, '[data-anomaly="finance.overdueShare"]')!.textContent).toMatch(/Overdue is \d+% of receivables, above 33%/);
  });
});
