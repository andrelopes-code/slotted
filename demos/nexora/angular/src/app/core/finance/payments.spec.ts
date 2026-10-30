import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { InvoiceListItem, NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { ALLOCATIONS_KEY, allocationKey } from './payment-allocation';
import { PaymentStore } from './payment.store';
import { methodsFor, RecordPaymentStore } from './record-payment.store';

describe('recording, allocating and reversing a payment', () => {
  let api: NexoraApi;
  let fixtures: Record<string, string>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    fixtures = api.demo.fixtures();
    await signIn('priya-shah');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  /** The partly paid fixture: an open invoice that still owes, and the form opened on it from its record. */
  async function formOnPartlyPaid(): Promise<{ store: RecordPaymentStore; invoice: InvoiceListItem }> {
    const invoice = (await api.finance.invoices.get(fixtures['edge.invoice.partially_paid']!)).invoice;
    const store = TestBed.inject(RecordPaymentStore);
    store.reset();
    await store.start(invoice.customerId, invoice.id);
    return { store, invoice };
  }

  it('opens on the invoice it came from: the account chosen, the amount what the invoice owes, all of it given', async () => {
    const { store, invoice } = await formOnPartlyPaid();
    expect(store.customer()?.id).toBe(invoice.customerId);
    expect(store.currency()).toBe(invoice.currency);
    expect(store.amountMinor()).toBe(invoice.outstanding.minor);
    const line = store.lines().find((candidate) => candidate.invoiceId === invoice.id)!;
    expect(Math.round(line.amount! * 100)).toBe(invoice.outstanding.minor);
    expect(store.lines().every((candidate) => candidate.currency === invoice.currency)).toBe(true);
    expect(store.unapplied()).toBe(0);
  });

  it('refuses an allocation above what the invoice owes as it is typed, before the backend does (FM-11)', async () => {
    const { store, invoice } = await formOnPartlyPaid();
    store.setAmount(invoice.outstanding.minor / 100 + 500);
    store.setLine(invoice.id, invoice.outstanding.minor / 100 + 1);
    expect(store.errors()[allocationKey(invoice.id)]?.[0]).toContain('larger than what the invoice still owes');
    expect(await store.record()).toBeNull();
  });

  it('refuses allocations that add up to more than the payment as they are typed (FM-11)', async () => {
    const { store, invoice } = await formOnPartlyPaid();
    store.setAmount(10);
    store.setLine(invoice.id, 20);
    expect(store.errors()[ALLOCATIONS_KEY]?.[0]).toContain('add up to more than the payment');
    expect(await store.record()).toBeNull();
  });

  it('records a payment allocated in part, and what no invoice takes stays unapplied as the customer’s credit', async () => {
    const { store, invoice } = await formOnPartlyPaid();
    store.setAmount(invoice.outstanding.minor / 100 + 100);
    expect(store.unapplied()).toBe(10_000);
    store.reference.set('ACH-12345678');
    const detail = (await store.record())!;
    expect(detail.payment.status).toBe('posted');
    expect(detail.payment.unappliedAmount.minor).toBe(10_000);
    expect(detail.payment.allocatedAmount.minor).toBe(invoice.outstanding.minor);
    expect((await api.finance.invoices.get(invoice.id)).invoice.settlement).toBe('paid');
    // The draft is emptied by the answer that recorded it (FM-05).
    expect(store.customer()).toBeNull();
    expect(store.amount()).toBeNull();
  });

  it('allocates what a payment left unapplied, within what it has, and reversing it reopens the invoice', async () => {
    const { store: form, invoice } = await formOnPartlyPaid();
    form.setLine(invoice.id, null);
    const recorded = (await form.record())!;
    expect(recorded.payment.unappliedAmount.minor).toBe(invoice.outstanding.minor);

    const store = TestBed.inject(PaymentStore);
    await store.open(recorded.payment.id);
    expect(store.canAllocate()).toBe(true);
    await store.startAllocation();
    store.setLine(invoice.id, invoice.outstanding.minor / 100 + 1);
    expect(Object.keys(store.allocationErrors())).toContain(allocationKey(invoice.id));
    expect(await store.allocate()).toBe(false);
    store.fillOldestFirst();
    expect(Object.keys(store.allocationErrors())).toHaveLength(0);
    expect(await store.allocate()).toBe(true);
    expect(store.payment()!.unappliedAmount.minor).toBe(0);
    expect((await api.finance.invoices.get(invoice.id)).invoice.outstanding.minor).toBe(0);

    expect(await store.reverse('Returned by the bank')).toBe(true);
    expect(store.payment()!.status).toBe('reversed');
    expect((await api.finance.invoices.get(invoice.id)).invoice.outstanding.minor).toBe(invoice.outstanding.minor);
  });

  it('refuses a refund above what the payment left unapplied as it is typed', async () => {
    const store = TestBed.inject(PaymentStore);
    await store.open(fixtures['edge.payment.unapplied']!);
    expect(store.canRefund()).toBe(true);
    // The customer owes nothing in the payment's currency: no allocation could succeed, and none is offered (RP-09).
    expect(store.openInvoices()).toBe(0);
    expect(store.canAllocate()).toBe(false);
    store.startRefund();
    const unapplied = store.payment()!.unappliedAmount.minor;
    expect(Math.round(store.refundDraft().amount! * 100)).toBe(unapplied);
    store.patchRefund({ amount: unapplied / 100 + 1, reason: 'Overpaid' });
    expect(store.refundLimitErrors()['amountMinor']?.[0]).toContain('at most what it left unapplied');
    expect(await store.refund()).toBe(false);
    store.patchRefund({ amount: 10 });
    expect(await store.refund()).toBe(true);
    expect(store.payment()!.unappliedAmount.minor).toBe(unapplied - 1_000);
    expect(store.refunds().map((refund) => refund.amount.minor)).toContain(1_000);
  });

  it('draws no command for a sales manager, who reads payments and records none', async () => {
    await signIn('sofia-ramirez');
    const store = TestBed.inject(PaymentStore);
    await store.open(fixtures['edge.payment.unapplied']!);
    expect(store.payment()).not.toBeNull();
    expect(store.canAllocate()).toBe(false);
    expect(store.canReverse()).toBe(false);
    expect(store.canRefund()).toBe(false);
  });

  it('answers a version someone else moved past by reading the payment again (ER-02, ER-03)', async () => {
    const store = TestBed.inject(PaymentStore);
    await store.open(fixtures['edge.payment.unapplied']!);
    const payment = store.payment()!;
    await api.finance.refunds.create({
      customerId: payment.customerId,
      paymentId: payment.id,
      amountMinor: 100,
      method: payment.method,
      reason: 'Elsewhere',
    });
    expect(await store.reverse('Stale')).toBe(false);
    expect(store.failure()?.kind).toBe('conflict');
    expect(store.payment()!.unappliedAmount.minor).toBe(payment.unappliedAmount.minor - 100);
  });

  it('offers Pix and boleto to a customer paying in reais, and not to one paying in dollars', () => {
    expect(methodsFor('BRL')).toContain('pix');
    expect(methodsFor('USD')).not.toContain('pix');
    expect(methodsFor('USD')).not.toContain('boleto');
  });
});
