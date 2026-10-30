import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { emptyQuery } from '@slotted/core/grid';
import { invoiceResource, paymentResource, type NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import {
  invoiceColumns,
  invoiceFilterFields,
  paymentColumns,
  paymentDoorFilter,
  paymentFilterFields,
} from '../../pages/finance/finance-columns';
import { SessionStore } from '../session/session.store';
import { invoiceDoorFilter, type InvoiceDoor, invoiceDoorParams } from './finance.model';
import { InvoicesStore } from './invoices.store';
import { PaymentsStore } from './payments.store';

describe('the invoice and payment lists', () => {
  let api: NexoraApi;
  let today: string;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signInAs('priya-shah');
    await TestBed.inject(SessionStore).load();
    today = TestBed.inject(SessionStore).session()!.demo.today;
  });

  const fieldsOf = (resource: { fields: Record<string, unknown> }) => new Set(Object.keys(resource.fields));

  it('offers only the fields invoiceResource filters by, and draws only columns it sorts by or says it does not', () => {
    const fields = fieldsOf(invoiceResource);
    for (const field of invoiceFilterFields()) expect(fields.has(field.key), field.key).toBe(true);
    for (const column of invoiceColumns(() => true, today))
      if (column.filterable !== false) expect(fields.has(column.id), column.id).toBe(true);
    const payments = fieldsOf(paymentResource);
    for (const field of paymentFilterFields()) expect(payments.has(field.key), field.key).toBe(true);
    for (const column of paymentColumns())
      if (column.filterable !== false) expect(payments.has(column.id), column.id).toBe(true);
  });

  /** Each overview door opens the list on its condition as the bar's own pills, and counts what the figure counts (OV-01). */
  it.each<[string, InvoiceDoor, (overview: Awaited<ReturnType<NexoraApi['finance']['overview']>>) => number]>([
    ['receivables', { owing: '1' }, (o) => o.openInvoiceCount],
    ['overdue', { collection: 'overdue' }, (o) => o.overdueInvoiceCount],
    ['disputed', { collection: 'disputed' }, (o) => o.disputedInvoiceCount],
    ['due within five days', { due: 'soon' }, (o) => o.invoicesDueWithin5Days],
    ['aging 1–30', { aging: '1-30' }, (o) => o.aging.find((row) => row.bucket === '1-30')!.count],
    ['aging over 90', { aging: '90+' }, (o) => o.aging.find((row) => row.bucket === '90+')!.count],
    ['not yet due', { aging: 'current' }, (o) => o.aging.find((row) => row.bucket === 'current')!.count],
  ])('opens the %s door with pills the bar owns, counting what the figure counts', async (_name, door, figure) => {
    const filter = invoiceDoorFilter(convertToParamMap(invoiceDoorParams(door)), today)!;
    const fields = new Map(invoiceFilterFields().map((field) => [field.key, field]));
    for (const rule of filter.rules) {
      if (!('field' in rule)) throw new Error('a door is flat');
      const field = fields.get(rule.field);
      expect(field, rule.field).toBeDefined();
      expect(field!.kind).toBe(rule.filter.kind);
      for (const condition of rule.filter.conditions) expect(field!.operators).toContain(condition.operator);
    }
    const store = TestBed.inject(InvoicesStore);
    await store.load({ ...emptyQuery({ index: 0, size: 25 }), filter });
    expect(store.total()).toBe(figure(await api.finance.overview()));
  });

  it('opens the cash door on this month’s posted payments, counting what the overview counts', async () => {
    const filter = paymentDoorFilter(convertToParamMap({ received: 'month' }), today)!;
    const store = TestBed.inject(PaymentsStore);
    await store.load({ ...emptyQuery({ index: 0, size: 25 }), filter });
    expect(store.total()).toBe((await api.finance.overview()).paymentsReceivedMonthToDate);
    const received = filter.rules.find((rule) => 'field' in rule && rule.field === 'receivedDate')!;
    expect('filter' in received && received.filter.conditions[0]).toMatchObject({
      operator: 'between',
      value: `${today.slice(0, 7)}-01`,
      end: today,
    });
  });

  it('sorts by what an invoice owes in US dollars, and draws it in the invoice’s own currency', async () => {
    const store = TestBed.inject(InvoicesStore);
    await store.load({ ...emptyQuery({ index: 0, size: 100 }), sort: [{ column: 'outstanding', direction: 'descending' }] });
    const usd = store.rows().map((row) => Math.round(row.outstanding.minor * Number(row.fxRateToUsd ?? '1')));
    expect(usd).toEqual([...usd].sort((a, b) => b - a));
    const column = invoiceColumns(() => true, today).find((candidate) => candidate.id === 'outstanding')!;
    const brl = store.rows().find((row) => row.currency === 'BRL');
    if (brl) expect(String(column.format!(0, brl))).toContain('R$');
  });

  it('says where an invoice stands against its due date, and a dispute does not stop the count', async () => {
    const column = invoiceColumns(() => true, today).find((candidate) => candidate.id === 'daysOverdue')!;
    const answer = await api.finance.invoices.list({ pageSize: 25, filter: { collectionState: { in: ['disputed'] } }, sort: '-daysOverdue' });
    const disputed = answer.data[0]!;
    const words = String(column.format!(disputed.daysOverdue, disputed));
    expect(words).toMatch(disputed.daysOverdue > 0 ? /days? past due, disputed/ : /Due/);
  });
});
