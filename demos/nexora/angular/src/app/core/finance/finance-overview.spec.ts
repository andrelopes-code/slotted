import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CHART_ENGINE } from '@slotted/angular/chart';
import { emptyQuery } from '@slotted/core/grid';
import { NexoraApiError, type NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { financeFigures } from '../../pages/finance/overview-page';
import { FinanceOverviewPage } from '../../pages/finance/overview-page';
import { toListQuery } from '../backend/list-query';
import { SessionStore } from '../session/session.store';
import { invoiceDoorFilter, type FinanceOverview } from './finance.model';
import { FinanceOverviewStore, OVERDUE_DANGER_SHARE, OVERDUE_WARNING_SHARE, overdueTone } from './finance-overview.store';

const silentEngine = () => ({
  update: () => Promise.resolve(),
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});

const unavailable = () => new NexoraApiError('SERVICE_UNAVAILABLE', 'Nexora did not answer', { status: 503, retryable: true });

describe('the finance overview', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTestBackend(), provideRouter([]), { provide: CHART_ENGINE, useValue: silentEngine }],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('priya-shah');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const all = () => true;

  /** The invoices a door's pills keep, counted by the backend as the list page asks for them. */
  async function countThrough(params: Record<string, string>, today: string): Promise<number> {
    const filter = invoiceDoorFilter(new URLSearchParams(params), today);
    expect(filter, JSON.stringify(params)).not.toBeNull();
    const request = toListQuery({ ...emptyQuery({ index: 0, size: 25 }), filter }, { total: 100, outstanding: 100, paidAmount: 100 });
    return (await api.finance.invoices.list(request.query)).page.totalItems;
  }

  it('opens every figure that counts records on the list it counts, whose count is the figure (OV-01)', async () => {
    const overview = await api.finance.overview();
    const today = (await api.session.get()).demo.today;
    const figures = financeFigures(overview, today, all);
    const door = (key: string) => figures.find((figure) => figure.key === key)!.door;

    expect(door('overdue')).toEqual({ route: '/finance/invoices', params: { collection: 'overdue' }, permission: 'invoices.view' });
    expect(door('disputed')?.params).toEqual({ collection: 'disputed' });
    expect(door('dueSoon')?.params).toEqual({ due: 'soon' });
    expect(door('receivables')?.params).toEqual({ owing: '1' });
    expect(door('cash')).toEqual({ route: '/finance/payments', params: { received: 'month' }, permission: 'payments.view' });
    expect(door('unmatched')).toEqual({ route: '/finance/reconciliation', params: {}, permission: 'reconciliation.view' });
    // A ratio, and a sum over two lists: neither counts the records of one list.
    expect(door('dso')).toBeNull();
    expect(door('unapplied')).toBeNull();

    expect(await countThrough({ collection: 'overdue' }, today)).toBe(overview.overdueInvoiceCount);
    expect(await countThrough({ collection: 'disputed' }, today)).toBe(overview.disputedInvoiceCount);
    expect(await countThrough({ due: 'soon' }, today)).toBe(overview.invoicesDueWithin5Days);
    for (const bucket of overview.aging)
      expect(await countThrough({ aging: bucket.bucket }, today), bucket.bucket).toBe(bucket.count);
    // The receivables door names the open invoices that owe: the condition `owing=1` stands for.
    const owing = await api.finance.invoices.list({
      pageSize: 25,
      filter: { lifecycle: { in: ['open'] }, outstanding: { gt: 0 } },
    });
    expect(owing.page.totalItems).toBe(overview.openInvoiceCount);
    const month = await api.finance.payments.list({
      pageSize: 25,
      filter: { status: { eq: 'posted' }, receivedDate: { gte: `${today.slice(0, 8)}01`, lte: today } },
    });
    expect(month.page.totalItems).toBe(overview.paymentsReceivedMonthToDate);
    expect(
      (await api.finance.bankTransactions.list({ pageSize: 25, filter: { status: { in: ['unmatched', 'suggested', 'needs_review'] } } }))
        .page.totalItems,
    ).toBe(overview.unmatchedBankTransactions);
  });

  it('offers no door into a list the reader may not read', () => {
    const figures = financeFigures(null, '2026-09-04', (permission) => permission !== 'payments.view');
    expect(figures.find((figure) => figure.key === 'cash')!.door).toBeNull();
    expect(figures.find((figure) => figure.key === 'overdue')!.door).not.toBeNull();
  });

  it('draws nothing as a number before the first answer, and says why DSO is undefined: no revenue, or invoices not kept (§72.7)', async () => {
    expect(financeFigures(null, '2026-09-04', all).every((figure) => figure.value === null)).toBe(true);
    const overview = await api.finance.overview();
    const dso = financeFigures({ ...overview, dsoDays: null, dsoUndefined: 'no-revenue' }, '2026-09-04', all).find((figure) => figure.key === 'dso')!;
    expect(dso.value).toBe('—');
    expect(dso.unit).toBeUndefined();
    expect(dso.comparison).toBe('nothing invoiced in 90 days');
    // The light window keeps 30 days of invoices: a ratio over 90 would be over a third of them (§75.4).
    expect(overview).toMatchObject({ dsoDays: null, dsoUndefined: 'not-kept' });
    const unkept = financeFigures(overview, '2026-09-04', all).find((figure) => figure.key === 'dso')!;
    expect(unkept.comparison).toBe('needs 90 days of invoices');
    expect(unkept.description).toContain('invoices are kept from');
    const days = financeFigures({ ...overview, dsoDays: 84 }, '2026-09-04', all).find((figure) => figure.key === 'dso')!;
    expect(days.value).toBe('84');
    expect(days.unit).toBe('days');
  });

  it('turns the overdue figure to a warning and a danger at the shares the page states', () => {
    const at = (share: number) =>
      overdueTone({ receivables: { currency: 'USD', minor: 1_000_000 }, overdueReceivables: { currency: 'USD', minor: Math.round(share * 1_000_000) } } as FinanceOverview);
    expect(at(OVERDUE_WARNING_SHARE - 0.01)).toBe('neutral');
    expect(at(OVERDUE_WARNING_SHARE)).toBe('warning');
    expect(at(OVERDUE_DANGER_SHARE + 0.01)).toBe('danger');
  });

  it('reads differently under collections pressure: the overdue share crosses the danger', async () => {
    const healthy = await api.finance.overview();
    expect(overdueTone(healthy)).toBe('neutral');
    await api.demo.setScenario('collections_pressure');
    await signIn('priya-shah');
    const pressure = await api.finance.overview();
    expect(pressure.overdueReceivables.minor).toBeGreaterThan(healthy.overdueReceivables.minor);
    // §77.7: overdue ×2.2, measured in US dollars as this page measures it.
    expect(pressure.overdueReceivables.minor / healthy.overdueReceivables.minor).toBeGreaterThanOrEqual(2.2);
    expect(overdueTone(pressure)).toBe('danger');
    // The card's tone paints only a trend: the crossed threshold is said in the comparison line.
    const today = (await api.session.get()).demo.today;
    expect(financeFigures(healthy, today, all).find((figure) => figure.key === 'overdue')!.comparison).toBe('15% of receivables');
    expect(financeFigures(pressure, today, all).find((figure) => figure.key === 'overdue')!.comparison).toMatch(/^\d+% of receivables, above 33%$/);
  }, 120_000);

  it('answers a refused summary with its failure and a way to ask again, never with zeros', async () => {
    const spy = vi.spyOn(api.finance, 'overview').mockRejectedValue(unavailable());
    const fixture = TestBed.createComponent(FinanceOverviewPage);
    const store = TestBed.inject(FinanceOverviewStore);
    for (let attempt = 0; attempt < 80 && !store.overview().failed; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      fixture.detectChanges();
    }
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(store.overview().value).toBeNull();
    expect(element.querySelector('[data-testid="figures-failed"]')).not.toBeNull();
    expect(element.textContent).not.toContain('$0.00');

    spy.mockRestore();
    (element.querySelector('[data-testid="figures-retry"]') as HTMLButtonElement).click();
    for (let attempt = 0; attempt < 80 && store.overview().value === null; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      fixture.detectChanges();
    }
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="figures-failed"]')).toBeNull();
    expect(element.querySelector('[data-figure="receivables"]')?.textContent).toContain('$');
  });

  it('keeps the figures it has when a later read fails, and says so (AF-02)', async () => {
    const store = TestBed.inject(FinanceOverviewStore);
    await store.open();
    const first = store.overview().value;
    expect(first).not.toBeNull();
    vi.spyOn(api.finance, 'overview').mockRejectedValue(unavailable());
    await store.open();
    expect(store.overview().value).toBe(first);
    expect(store.overview().failed).toBe(true);
  });

  it('adds the aging rows back up to the receivables figure (RP-07)', async () => {
    const overview = await api.finance.overview();
    const sum = overview.aging.reduce((total, bucket) => total + bucket.amount.minor, 0);
    const count = overview.aging.reduce((total, bucket) => total + bucket.count, 0);
    expect(sum).toBe(overview.receivables.minor);
    expect(count).toBe(overview.openInvoiceCount);
  });

  it('reads the overdue invoices longest past due first, and the payments last received', async () => {
    const store = TestBed.inject(FinanceOverviewStore);
    await store.open();
    const rows = store.overdue().value!.rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.collectionState === 'overdue')).toBe(true);
    const days = rows.map((row) => row.daysOverdue);
    expect(days).toEqual([...days].sort((a, b) => b - a));
    const received = store.recent().value!.map((row) => row.receivedDate);
    expect(received.length).toBe(8);
    expect(received).toEqual([...received].sort().reverse());
  });
});
