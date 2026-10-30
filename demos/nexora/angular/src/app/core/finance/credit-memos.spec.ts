import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { InvoiceListItem, NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { creditMemoColumns, creditMemoFilterFields } from '../../pages/finance/credit-memo-columns';
import { SessionStore } from '../session/session.store';
import { CreditMemoDraftStore } from './credit-memo-draft.store';
import { CreditMemoStore, refundMethods } from './credit-memo.store';

describe('credit memos and refunds', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('priya-shah');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  /** An open invoice in dollars that still owes, of a customer who is invoiced in dollars. */
  async function owingInvoice(): Promise<InvoiceListItem> {
    const answer = await api.finance.invoices.list({
      pageSize: 50,
      sort: '-outstanding',
      filter: { lifecycle: { eq: 'open' }, currency: { eq: 'USD' }, outstanding: { gt: 100_00 } },
    });
    for (const invoice of answer.data) {
      const customer = await api.customers.get(invoice.customerId);
      if (customer.customer.preferredCurrency === 'USD') return invoice;
    }
    throw new Error('no dollar invoice that owes');
  }

  /** A draft memo written through the form's own store, for the invoice's customer. */
  async function draft(invoice: InvoiceListItem, dollars: number): Promise<string> {
    const form = TestBed.inject(CreditMemoDraftStore);
    form.reset();
    await form.prefill(invoice.customerId, invoice.id);
    form.reason.set('pricing_correction');
    form.amount.set(dollars);
    form.description.set('Contract price on two lines');
    const memo = await form.create();
    expect(memo?.lifecycle).toBe('draft');
    expect(memo?.sourceInvoiceId).toBe(invoice.id);
    return memo!.id;
  }

  it('refuses a memo with no description before the backend is asked, keyed by the backend’s name', async () => {
    const invoice = await owingInvoice();
    const form = TestBed.inject(CreditMemoDraftStore);
    form.reset();
    await form.prefill(invoice.customerId, null);
    form.reason.set('service_recovery');
    form.amount.set(25);
    const before = (await api.finance.creditMemos.list({ pageSize: 25 })).page.totalItems;
    expect(await form.create()).toBeNull();
    expect(Object.keys(form.errors())).toEqual(['description']);
    expect((await api.finance.creditMemos.list({ pageSize: 25 })).page.totalItems).toBe(before);
  });

  it('keeps the draft when the form is left and opened again on the same customer (FM-05)', async () => {
    const invoice = await owingInvoice();
    const form = TestBed.inject(CreditMemoDraftStore);
    form.reset();
    await form.prefill(invoice.customerId, invoice.id);
    form.amount.set(12);
    await form.prefill(invoice.customerId, invoice.id);
    expect(form.amount()).toBe(12);
    expect(form.currency()).toBe('USD');
  });

  it('opens a draft, refuses as typed an application above what the invoice owes or the memo holds, and applies it whole', async () => {
    const invoice = await owingInvoice();
    const id = await draft(invoice, 50);
    const store = TestBed.inject(CreditMemoStore);
    await store.open(id);
    expect(store.commands()).toEqual(['open', 'void']);

    expect(await store.openMemo()).toBe(true);
    expect(store.memo()?.lifecycle).toBe('open');
    expect(store.commands()).toEqual(['apply', 'refund', 'void']);

    await store.loadInvoices();
    store.chooseInvoice(invoice.id);
    // The memo holds less than the invoice owes: the limit is the memo's credit.
    expect(store.applyLimitMinor()).toBe(50_00);
    expect(store.applyAmount()).toBe(50);
    store.applyAmount.set(50.01);
    expect(store.applyTyped()['amountMinor']?.[0]).toContain('$50.00');
    expect(await store.apply()).toBe(false);
    expect((await api.finance.creditMemos.get(id)).applications).toHaveLength(0);

    store.applyAmount.set(50);
    expect(await store.apply()).toBe(true);
    expect(store.memo()?.lifecycle).toBe('fully_applied');
    expect(store.appliedMinor()).toBe(50_00);
    expect(store.commands()).toEqual([]);
    const after = await api.finance.invoices.get(invoice.id);
    expect(after.invoice.outstanding.minor).toBe(invoice.outstanding.minor - 50_00);
  });

  it('refuses as typed a refund above the credit left, posts one within it, and no longer offers the void', async () => {
    const invoice = await owingInvoice();
    const id = await draft(invoice, 100);
    const store = TestBed.inject(CreditMemoStore);
    await store.open(id);
    await store.openMemo();

    store.startRefund();
    expect(store.refundAmount()).toBe(100);
    expect(store.refundMethod()).toBe('ach');
    store.refundAmount.set(150);
    expect(store.refundTyped()['amountMinor']?.[0]).toContain('$100.00');
    expect(await store.refund()).toBe(false);

    store.refundAmount.set(40);
    expect(await store.refund()).toBe(false);
    expect(store.refundErrors()['reason']).toBeDefined();
    store.refundReason.set('No invoice left to apply it to');
    expect(await store.refund()).toBe(true);
    expect(store.memo()?.unappliedAmount.minor).toBe(60_00);
    expect(store.refundedMinor()).toBe(40_00);
    expect(store.postedRefunds()).toHaveLength(1);
    // §66.11: a memo something was used from is not voided.
    expect(store.commands()).toEqual(['apply', 'refund']);
  });

  it('offers the void on a draft, and voids it', async () => {
    const invoice = await owingInvoice();
    const id = await draft(invoice, 20);
    const store = TestBed.inject(CreditMemoStore);
    await store.open(id);
    expect(store.commands()).toContain('void');
    expect(await store.voidMemo()).toBe(true);
    expect(store.memo()?.lifecycle).toBe('voided');
    expect(store.commands()).toEqual([]);
  });

  it('answers a version someone else moved past by reading the memo again (ER-02)', async () => {
    const invoice = await owingInvoice();
    const id = await draft(invoice, 30);
    const store = TestBed.inject(CreditMemoStore);
    await store.open(id);
    const memo = await api.finance.creditMemos.get(id);
    await api.finance.creditMemos.open(id, { ifMatch: memo.creditMemo.metadata.version });
    expect(await store.voidMemo()).toBe(false);
    expect(store.failure()?.kind).toBe('conflict');
    expect(store.memo()?.lifecycle).toBe('open');
  });

  it.each(['sofia-ramirez', 'evan-brooks', 'owen-price'])(
    'gives %s, who reads credit memos and holds none of their commands, no command',
    async (persona) => {
      const invoice = await owingInvoice();
      const id = await draft(invoice, 20);
      const memo = await api.finance.creditMemos.get(id);
      await api.finance.creditMemos.open(id, { ifMatch: memo.creditMemo.metadata.version });
      await signIn(persona);
      const store = TestBed.inject(CreditMemoStore);
      await store.open(id);
      expect(store.memo()?.lifecycle).toBe('open');
      expect(store.commands()).toEqual([]);
    },
  );

  it('refunds a memo in reais by Pix or boleto as well', () => {
    expect(refundMethods('BRL').slice(0, 2)).toEqual(['pix', 'boleto']);
    expect(refundMethods('USD')).not.toContain('pix');
  });

  it('filters and sorts by the resource’s own fields only', () => {
    const fields = creditMemoFilterFields().map((field) => field.key);
    expect(fields).toEqual(['lifecycle', 'reason', 'customerName', 'issueDate', 'unappliedAmount', 'total', 'regionCode', 'customerSegment']);
    const joined = creditMemoColumns().find((column) => column.id === 'source')!;
    expect(joined.filterable).toBe(false);
    expect(joined.sortable).toBe(false);
  });
});
