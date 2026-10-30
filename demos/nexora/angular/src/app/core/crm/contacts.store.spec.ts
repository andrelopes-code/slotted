import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FilterGroup } from '@slotted/core/filter';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { ContactsStore } from './contacts.store';

const anyOf = (field: string, values: string[]): FilterGroup => ({
  join: 'and',
  rules: [
    {
      field,
      filter: { kind: 'set', join: 'or', conditions: [{ operator: 'anyOf', value: values }] },
    },
  ],
});

describe('ContactsStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(ContactsStore);
    store.loaded.set([]);
    store.page.set({ index: 0, size: 25 });
    store.search.set('');
    store.filter.set(null);
  });

  it('reads one page of accounts and holds the people on them', async () => {
    const store = TestBed.inject(ContactsStore);
    const request = store.load();
    expect(store.loading()).toBe(true);
    expect(store.loaded().length).toBe(0);
    await request;

    expect(store.accountsRead()).toBe(25);
    expect(store.accountTotal()).toBeGreaterThan(1000);
    expect(store.loaded().length).toBeGreaterThan(0);
    expect(store.accountsFailed()).toBe(0);
    // Every row carries the account it belongs to: the list is read account by account.
    expect(store.rows().every((row) => row.customerName.length > 0)).toBe(true);
  });

  it('filters and searches over the page it holds', async () => {
    const store = TestBed.inject(ContactsStore);
    await store.load();
    const all = store.rows().length;

    store.setFilter(anyOf('isPrimary', ['yes']));
    const primary = store.rows();
    expect(primary.length).toBeLessThan(all);
    expect(primary.every((row) => row.isPrimary)).toBe(true);

    store.setFilter(null);
    const first = store.loaded()[0]!;
    store.setSearch(first.displayName.split(' ')[0]!);
    expect(store.rows().length).toBeGreaterThan(0);
    expect(store.rows().some((row) => row.id === first.id)).toBe(true);
  });

  it('empties the rows before the next page of accounts', async () => {
    const store = TestBed.inject(ContactsStore);
    await store.load();
    const firstNames = store.loaded().map((row) => row.id);

    const turning = store.goTo(1);
    expect(store.loaded().length).toBe(0);
    await turning;

    expect(store.page().index).toBe(1);
    expect(store.loaded().length).toBeGreaterThan(0);
    expect(store.loaded().some((row) => firstNames.includes(row.id))).toBe(false);
  });
});
