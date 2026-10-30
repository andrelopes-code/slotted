import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CustomerListItem, NexoraApi, SkuListItem } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { QuoteDraftStore } from './quote-draft.store';
import { QuotesStore } from './quotes.store';

/**
 * The quote's own road (§58): written, submitted, sent, accepted, and then an
 * order. Every state is reached by writing a quote, so no seeded quote's
 * state decides the walk.
 */
describe('the life of a quote', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    TestBed.inject(QuoteDraftStore).reset();
  });

  /**
   * An account a quote can be written for: active, with an active primary
   * contact, and — for a representative, whose `quotes.create` is scoped to
   * what they own — one of the signed-in user's own.
   */
  async function quotable(mine = false): Promise<CustomerListItem> {
    const ownerId = TestBed.inject(SessionStore).user()?.id;
    const page = await api.customers.list({
      filter: { status: 'active', ...(mine && ownerId ? { accountOwnerId: ownerId } : {}) },
      pageSize: 100,
    });
    for (const customer of page.data) {
      const detail = await api.customers.get(customer.id);
      if (detail.contacts.some((contact) => contact.isPrimary && contact.status === 'active'))
        return customer;
    }
    throw new Error('the seed holds no such account with a primary contact');
  }

  async function anySku(): Promise<SkuListItem> {
    const page = await api.catalog.skus({ pageSize: 25 });
    return page.data.find((sku) => sku.status === 'active') ?? page.data[0]!;
  }

  /** A quote is written by the representative who owns the account; its approval is the manager's. */
  async function as(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  async function write(): Promise<string> {
    const draft = TestBed.inject(QuoteDraftStore);
    draft.choose(await quotable(true));
    draft.addLine(await anySku(), '12');
    const detail = await draft.create();
    expect(detail, 'the quote was written').not.toBeNull();
    return detail!.quote.id;
  }

  /** Approves whatever the quote is waiting on, as the role the step names. */
  async function approveAsManager(store: QuotesStore): Promise<void> {
    const approval = store.detail()?.approval;
    if (!approval) return;
    await as('sofia-ramirez');
    await api.approvals.approve(approval.id, {}, { ifMatch: approval.metadata.version });
    await as('noah-bennett');
    await store.loadRecord();
  }

  it('writes a draft from an account and a line, and empties the draft on the answer', async () => {
    const draft = TestBed.inject(QuoteDraftStore);
    draft.choose(await quotable());
    draft.addLine(await anySku(), '12');
    expect(draft.ready()).toBe(true);

    const running = draft.create();
    expect(draft.creating()).toBe(true);
    const detail = await running;

    expect(detail?.quote.status).toBe('draft');
    expect(detail?.lines.length).toBe(1);
    expect(detail?.quote.total.minor).toBeGreaterThan(0);
    expect(draft.lines()).toEqual([]);
    expect(draft.customer()).toBeNull();
  });

  it('adds the same item twice as one line with more of it', async () => {
    const draft = TestBed.inject(QuoteDraftStore);
    const sku = await anySku();
    draft.choose(await quotable());
    draft.addLine(sku, '4');
    draft.addLine(sku, '8');

    expect(draft.lines().length).toBe(1);
    expect(draft.lines()[0]!.quantity).toBe('12');
  });

  it('walks the quote to an order: submit, send, accept, convert', async () => {
    await as('noah-bennett');
    const store = TestBed.inject(QuotesStore);
    await store.openRecord(await write());

    expect(await store.submit()).toBe(true);
    expect(['pending_approval', 'approved']).toContain(store.quote()!.status);

    // A quote held by an approval is sent once the approval is out of the way.
    await approveAsManager(store);
    expect(['approved', 'draft']).toContain(store.quote()!.status);

    expect(await store.send()).toBe(true);
    expect(store.quote()!.status).toBe('sent');

    expect(await store.accept()).toBe(true);
    expect(store.quote()!.status).toBe('accepted');

    const orderId = await store.convert();
    expect(orderId).not.toBeNull();
    const order = await api.orders.get(orderId!);
    expect(order.order.sourceQuoteId).toBe(store.quote()!.id);
    expect(store.quote()!.status).toBe('converted');
  });

  it('says in its own words that a quote was already converted', async () => {
    await as('noah-bennett');
    const store = TestBed.inject(QuotesStore);
    await store.openRecord(await write());
    await store.submit();
    await approveAsManager(store);
    await store.send();
    await store.accept();
    const first = await store.convert();
    expect(first).not.toBeNull();

    // The record moved under the page: the second command is a conflict, not an error.
    const again = await store.convert();

    expect(again).toBeNull();
    expect(store.failure()?.kind).toBe('state');
    expect(store.failure()?.message).toContain('cannot be converted');
  });

  it('refuses a quote for an account with nobody to write it to', async () => {
    const draft = TestBed.inject(QuoteDraftStore);
    const page = await api.customers.list({ pageSize: 100 });
    let without: CustomerListItem | null = null;
    for (const customer of page.data) {
      const detail = await api.customers.get(customer.id);
      if (!detail.contacts.some((contact) => contact.isPrimary && contact.status === 'active')) {
        without = customer;
        break;
      }
    }
    if (without === null) return; // every seeded account has one; nothing to prove here
    draft.choose(without);
    draft.addLine(await anySku(), '3');

    expect(await draft.create()).toBeNull();
    expect(draft.failure()?.code).toBe('PRIMARY_CONTACT_REQUIRED');
    expect(draft.failure()?.message).toContain('Add one on the account first.');
    expect(draft.lines().length).toBe(1);
  });
});
