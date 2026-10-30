import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CustomerListItem, NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { SessionStore } from '../session/session.store';
import { CustomerEditStore } from './customer-edit.store';
import { CustomerStore } from './customer.store';

describe('CustomerEditStore', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    TestBed.inject(CustomerEditStore).cancel();
  });

  async function openFirstActive(): Promise<CustomerListItem> {
    const page = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    const id = page.data[0]!.id;
    const record = TestBed.inject(CustomerStore);
    await record.open(id);
    return record.customer()!;
  }

  it('writes the account and reads it back on the record', async () => {
    const customer = await openFirstActive();
    // The answer shares its metadata object with the store, so the version is read as a number.
    const version = customer.metadata.version;
    const store = TestBed.inject(CustomerEditStore);
    store.start(customer);
    store.patch({ industry: 'Water & Wastewater', tags: ['key-account'] });

    const saved = store.save();
    expect(store.saving()).toBe(true);
    expect(await saved).toBe(true);

    const record = TestBed.inject(CustomerStore).customer()!;
    expect(record.industry).toBe('Water & Wastewater');
    expect(record.tags).toEqual(['key-account']);
    expect(record.metadata.version).toBe(version + 1);
    expect(store.editing()).toBe(false);
  });

  it('answers a version someone else moved past with what they changed', async () => {
    const customer = await openFirstActive();
    const store = TestBed.inject(CustomerEditStore);
    store.start(customer);
    store.patch({ displayName: `${customer.displayName} Holdings` });

    // Another writer, between the form opening and its submit.
    await api.customers.update(
      customer.id,
      { industry: 'Renewable Energy' },
      { ifMatch: customer.metadata.version },
    );

    expect(await store.save()).toBe(false);
    const conflict = store.conflict()!;
    expect(conflict.map((field) => field.label)).toEqual(['Industry']);
    expect(conflict[0]!.theirs).toBe('Renewable Energy');
    // The reader did not touch the industry, and the form still holds their name.
    expect(conflict[0]!.mine).toBeNull();
    expect(store.draft()!.displayName).toBe(`${customer.displayName} Holdings`);

    expect(await store.applyMine()).toBe(true);
    const record = TestBed.inject(CustomerStore).customer()!;
    expect(record.displayName).toBe(`${customer.displayName} Holdings`);
    expect(record.industry).toBe('Renewable Energy');
  });

  it('is refused by the backend when the command carries no version', async () => {
    const customer = await openFirstActive();
    await expect(
      api.customers.update(customer.id, { industry: 'Packaging' }),
    ).rejects.toMatchObject({ code: 'PRECONDITION_REQUIRED', status: 428 });
  });

  it('keeps the draft when the account belongs to someone else', async () => {
    await signInAs('noah-bennett');
    const session = TestBed.inject(SessionStore);
    await session.load();
    const page = await api.customers.list({ pageSize: 100 });
    const other = page.data.find((item) => item.accountOwnerId !== session.user()?.id)!;
    const record = TestBed.inject(CustomerStore);
    await record.open(other.id);
    const store = TestBed.inject(CustomerEditStore);
    store.start(record.customer()!);
    store.patch({ industry: 'Packaging' });

    expect(await store.save()).toBe(false);
    expect(store.failure()?.code).toBe('FORBIDDEN');
    expect(store.editing()).toBe(true);
    expect(store.draft()!.industry).toBe('Packaging');
  });

  it('lets a representative save their own account without writing the credit limit', async () => {
    await signInAs('noah-bennett');
    const session = TestBed.inject(SessionStore);
    await session.load();
    const page = await api.customers.list({ pageSize: 100 });
    const mine = page.data.find((item) => item.accountOwnerId === session.user()?.id)!;
    const record = TestBed.inject(CustomerStore);
    await record.open(mine.id);
    const store = TestBed.inject(CustomerEditStore);
    store.start(record.customer()!);
    store.patch({ industry: 'Mining & Aggregates' });

    expect(await store.save()).toBe(true);
    const saved = TestBed.inject(CustomerStore).customer()!;
    expect(saved.industry).toBe('Mining & Aggregates');
    expect(saved.creditLimit.minor).toBe(mine.creditLimit.minor);
  });
});
