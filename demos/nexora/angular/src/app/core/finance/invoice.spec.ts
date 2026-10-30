import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { InvoiceListItem, NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { SessionStore } from '../session/session.store';
import { InvoiceContactStore } from './invoice-contact.store';
import { InvoiceCreditStore } from './invoice-credit.store';
import { contactAttemptPrefix, InvoiceStore } from './invoice.store';

describe('the invoice record', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  /** Every open invoice that owes, read a hundred at a time with the filter given. */
  async function owing(filter: Record<string, unknown> = {}): Promise<InvoiceListItem[]> {
    const rows: InvoiceListItem[] = [];
    for (let page = 1; page <= 60; page += 1) {
      const answer = await api.finance.invoices.list({
        page,
        pageSize: 100,
        filter: { lifecycle: 'open', ...filter } as never,
      });
      rows.push(...answer.data);
      if (page >= answer.page.totalPages) break;
    }
    return rows.filter((row) => row.outstanding.minor > 0);
  }

  const usd = (row: InvoiceListItem) => Math.round(row.outstanding.minor * Number(row.fxRateToUsd ?? '1'));

  async function opened(id: string): Promise<InvoiceStore> {
    const store = TestBed.inject(InvoiceStore);
    await store.open(id);
    return store;
  }

  describe('the write-off, said before any control (FM-11, FM-13)', () => {
    it('measures a balance in reais in US dollars, and lets an accountant write off up to US$500', async () => {
      await signIn('staff-accountant');
      const brl = (await owing({ currency: 'BRL', settlement: 'unpaid' })).find(
        (row) => row.outstanding.minor > 50_000 && usd(row) <= 50_000,
      )!;
      const store = await opened(brl.id);
      const rule = store.writeOff()!;
      expect(rule.authority).toBe('accountant');
      expect(rule.words).toContain('US$500 an accountant may write off');
      expect(rule.words).toMatch(/\(US\$\d/);
      expect(store.commands()).toContain('writeOff');
      expect(await store.requestWriteOff('Below the cost of collecting it')).toBe(true);
      expect(store.invoice()!.lifecycle).toBe('written_off');
    });

    it('tells an accountant that a balance above US$500 is a Finance Manager’s, and draws no control', async () => {
      await signIn('staff-accountant');
      const usdInvoice = (await owing({ currency: 'USD' })).find(
        (row) => row.outstanding.minor > 50_000 && row.outstanding.minor <= 500_000,
      )!;
      const store = await opened(usdInvoice.id);
      expect(store.writeOff()!.allowed).toBe(false);
      expect(store.writeOff()!.words).toContain('only a Finance Manager writes it off');
      expect(store.commands()).not.toContain('writeOff');
    });

    it('asks for an approval above US$5,000, hides the control while it waits, and the controller’s approval writes it off', async () => {
      await signIn('priya-shah');
      const large = (await owing()).find((row) => usd(row) > 500_000 && row.settlement === 'unpaid')!;
      const store = await opened(large.id);
      expect(store.writeOff()!.asksApproval).toBe(true);
      expect(store.commands()).toContain('writeOff');
      expect(await store.requestWriteOff('Customer entered administration')).toBe(true);
      expect(store.approval()!.status).toBe('pending');
      expect(store.invoice()!.lifecycle).toBe('open');
      expect(store.commands()).not.toContain('writeOff');

      await signIn('finance-controller');
      await store.load();
      expect(await store.decide('approve', '')).toBe(true);
      expect(store.invoice()!.lifecycle).toBe('written_off');
      expect(store.approval()!.status).toBe('approved');
    });

    it('draws the rule in the sentence and names the control for what it asks', async () => {
      await signIn('priya-shah');
      const large = (await owing()).find((row) => usd(row) > 500_000 && row.settlement === 'unpaid')!;
      const harness = await RouterTestingHarness.create(`/finance/invoices/${large.id}`);
      let text = '';
      for (let attempt = 0; attempt < 160 && !text.includes('US$5,000'); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        harness.detectChanges();
        text = harness.fixture.nativeElement.textContent as string;
      }
      expect(text).toContain('a Finance Manager asks for it');
      expect(text).toContain('Request write-off approval');
    });
  });

  describe('the commands the state allows (RP-09)', () => {
    beforeEach(() => signIn('priya-shah'));

    it('offers no void once a payment is applied, and says what to do instead', async () => {
      const paid = api.demo.fixtures()['edge.invoice.partially_paid']!;
      const store = await opened(paid);
      expect(store.hasAllocations()).toBe(true);
      expect(store.commands()).not.toContain('void');
      const clean = (await owing({ settlement: 'unpaid' }))[0]!;
      await store.open(clean.id);
      expect(store.hasAllocations()).toBe(false);
      expect(store.commands()).toContain('void');
      expect(await store.void('Raised against the wrong account')).toBe(true);
      expect(store.invoice()!.lifecycle).toBe('voided');
      expect(store.commands()).toEqual([]);
    });

    it('marks a dispute that keeps the aging, and resolves it back into collection', async () => {
      const overdue = (await owing({ collectionState: 'overdue' }))[0]!;
      const store = await opened(overdue.id);
      expect(store.commands()).toContain('dispute');
      expect(await store.dispute('Quantity short on delivery')).toBe(true);
      expect(store.invoice()!.collectionState).toBe('disputed');
      expect(store.invoice()!.daysOverdue).toBe(overdue.daysOverdue);
      expect(store.commands()).toContain('resolve');
      expect(await store.resolveDispute()).toBe(true);
      expect(store.invoice()!.collectionState).toBe('overdue');
    });

    it('answers a version someone else moved past by reading the invoice again (ER-02)', async () => {
      const overdue = (await owing({ collectionState: 'overdue' }))[0]!;
      const store = await opened(overdue.id);
      const read = await api.finance.invoices.get(overdue.id);
      await api.finance.invoices.send(overdue.id, { ifMatch: read.invoice.metadata.version });
      expect(await store.dispute('Price differs from the quote')).toBe(false);
      expect(store.failure()!.kind).toBe('conflict');
      expect(store.invoice()!.sentAt).toBeDefined();
      expect(store.invoice()!.collectionState).toBe('overdue');
    });
  });

  it('records a contact attempt as the customer’s note and reads it back on the invoice', async () => {
    await signIn('priya-shah');
    const overdue = (await owing({ collectionState: 'overdue' }))[0]!;
    const store = await opened(overdue.id);
    expect(store.commands()).toContain('contact');
    expect(store.attempts()).toEqual([]);
    const contact = TestBed.inject(InvoiceContactStore);
    contact.reset();
    expect(await contact.save()).toBe(false);
    expect(contact.errors()['body']).toBeDefined();
    contact.channel.set('Email');
    contact.said.set('Accounts payable confirmed the run on Friday.');
    expect(await contact.save()).toBe(true);
    expect(store.attempts()).toHaveLength(1);
    expect(store.attempts()[0]!.channel).toBe('Email');
    expect(store.attempts()[0]!.authorName).toBe('Priya Shah');
    const customer = await api.customers.get(overdue.customerId);
    expect(customer.notes.some((note) => note.body.startsWith(contactAttemptPrefix(overdue.invoiceNumber!)))).toBe(true);
  });

  it('limits the credit applied to the smaller of the memo’s credit and the balance, as it is typed', async () => {
    await signIn('priya-shah');
    const target = (await owing({ currency: 'USD', settlement: 'unpaid' })).find(
      (row) => row.outstanding.minor > 20_000,
    )!;
    const memo = await api.finance.creditMemos.create({
      customerId: target.customerId,
      reason: 'service_recovery',
      amountMinor: 10_000,
      description: 'Late delivery goodwill',
    });
    await api.finance.creditMemos.open(memo.creditMemo.id, { ifMatch: memo.creditMemo.metadata.version });
    const store = await opened(target.id);
    expect(store.commands()).toContain('credit');
    const credit = TestBed.inject(InvoiceCreditStore);
    credit.reset();
    credit.start();
    expect(credit.limitMinor()).toBe(10_000);
    expect(credit.amount()).toBe(100);
    credit.amount.set(150);
    expect(credit.errors()['amountMinor']![0]).toContain('At most $100.00');
    expect(await credit.apply()).toBe(false);
    credit.amount.set(60);
    expect(credit.errors()).toEqual({});
    expect(await credit.apply()).toBe(true);
    expect(store.invoice()!.paidAmount.minor).toBe(target.paidAmount.minor + 6_000);
    expect(store.detail()!.creditApplications.some((row) => row.creditMemoId === memo.creditMemo.id)).toBe(true);
  });

  it.each(['owen-price', 'evan-brooks', 'aisha-grant', 'noah-bennett', 'sofia-ramirez'])(
    'gives %s the invoice to read and no command',
    async (persona) => {
      await signIn(persona);
      const overdue = (await owing({ collectionState: 'overdue' }))[0]!;
      const store = await opened(overdue.id);
      expect(store.invoice()!.id).toBe(overdue.id);
      // A note on the account is the one thing a sales or support role may write here, as §55.5 scopes it.
      const owner = store.customer()!.customer.accountOwnerId === TestBed.inject(SessionStore).user()!.id;
      const expected = persona === 'owen-price' || persona === 'evan-brooks' || (persona === 'noah-bennett' && !owner) ? [] : ['contact'];
      expect(store.commands()).toEqual(expected);
    },
  );
});
