import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { SessionStore } from '../session/session.store';
import { CustomerStore } from './customer.store';
import { CustomersStore } from './customers.store';

describe('CustomerStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  async function firstActive(): Promise<string> {
    const api = await TestBed.inject(NEXORA_BACKEND).ready();
    const page = await api.customers.list({
      filter: { status: 'active', openOrderCount: { gte: 1 } },
      pageSize: 25,
    });
    return page.data[0]!.id;
  }

  /** Pending is not empty: the record is null and the fact set until the answer; another id removes the record first. */
  it('opens a record with its related records and its activity, and starts over on another id', async () => {
    const store = TestBed.inject(CustomerStore);
    const id = await firstActive();
    const request = store.open(id);
    expect(store.loading()).toBe(true);
    expect(store.detail()).toBeNull();
    await request;
    expect(store.customer()?.id).toBe(id);
    expect(Array.isArray(store.detail()?.contacts)).toBe(true);
    expect(store.activity().length).toBeGreaterThan(0);
    const api = await TestBed.inject(NEXORA_BACKEND).ready();
    const other = (await api.customers.list({ filter: { status: 'prospect' }, pageSize: 25 }))
      .data[0]!;
    const next = store.open(other.id);
    expect(store.detail()).toBeNull();
    await next;
    expect(store.customer()?.id).toBe(other.id);
  });

  it('says not found for an id the backend does not hold', async () => {
    const store = TestBed.inject(CustomerStore);
    await store.open('cus_does_not_exist');
    expect(store.error()?.code).toBe('NOT_FOUND');
    expect(store.detail()).toBeNull();
  });

  /** The control waits on `busy`; the record is read back; the list, when it has rows, is read back too. */
  it('places the record on hold, releases it, and marks what is in flight', async () => {
    const store = TestBed.inject(CustomerStore);
    const list = TestBed.inject(CustomersStore);
    await list.reset();
    await store.open(await firstActive());
    const hold = store.hold('Overdue invoices past 60 days');
    expect(store.busy()).toBe('hold');
    await hold;
    expect(store.busy()).toBeNull();
    expect(store.customer()?.status).toBe('on_hold');
    expect(store.customer()?.holdReason).toBe('Overdue invoices past 60 days');
    await store.releaseHold();
    expect(store.customer()?.status).toBe('active');
  });

  it('adds a note at the top of the record’s notes', async () => {
    const store = TestBed.inject(CustomerStore);
    await store.open(await firstActive());
    const before = store.detail()!.notes.length;
    await store.addNote('Called about the September invoice.', 'team');
    expect(store.detail()!.notes.length).toBe(before + 1);
    expect(store.detail()!.notes[0]!.body).toBe('Called about the September invoice.');
    expect(store.detail()!.notes[0]!.visibility).toBe('team');
  });

  it('refuses to archive a customer with open activity and keeps the record', async () => {
    const store = TestBed.inject(CustomerStore);
    const api = await TestBed.inject(NEXORA_BACKEND).ready();
    const busy = (
      await api.customers.list({ filter: { openOrderCount: { gte: 1 } }, pageSize: 25 })
    ).data[0]!;
    await store.open(busy.id);
    await expect(store.archive()).rejects.toMatchObject({ code: 'CUSTOMER_HAS_OPEN_ACTIVITY' });
    expect(store.busy()).toBeNull();
    expect(store.customer()?.status).toBe(busy.status);
  });
});
