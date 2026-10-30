import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setFilter } from '@slotted/core/filter';
import { withFilter, withPageIndex, withSortPress } from '@slotted/core/grid';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { SessionStore } from '../session/session.store';
import { CustomersStore } from './customers.store';

describe('CustomersStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    await TestBed.inject(CustomersStore).reset();
  });

  it('opens on the first page of every customer, with the tenant’s count beside the query’s', async () => {
    const store = TestBed.inject(CustomersStore);
    expect(store.rows().length).toBe(25);
    expect(store.total()).toBeGreaterThan(25);
    expect(store.grandTotal()).toBe(store.total());
    expect(store.loading()).toBe(false);
  });

  /** Pending is not empty: before the first answer the rows are none and the fact is set. */
  it('is loading before the first answer and empties the rows on a different query', async () => {
    const store = TestBed.inject(CustomersStore);
    const request = store.load(withPageIndex(store.query(), 1).query);
    expect(store.loading()).toBe(true);
    expect(store.rows()).toEqual([]);
    await request;
    expect(store.loading()).toBe(false);
    expect(store.rows().length).toBe(25);
    expect(store.page().index).toBe(1);
  });

  /** Reading the same query back after a mutation keeps the rows on screen. */
  it('keeps the rows while the same query is read back', async () => {
    const store = TestBed.inject(CustomersStore);
    const before = store.rows();
    const request = store.reload();
    expect(store.loading()).toBe(true);
    expect(store.rows()).toBe(before);
    await request;
  });

  it('filters, searches and sorts through the backend and keeps the tenant’s count', async () => {
    const store = TestBed.inject(CustomersStore);
    const total = store.grandTotal();
    await store.setFilter({
      join: 'and',
      rules: [{ field: 'health', filter: setFilter(['at_risk']) }],
    });
    expect(store.rows().every((row) => row.health === 'at_risk')).toBe(true);
    expect(store.total()).toBeLessThan(total!);
    expect(store.grandTotal()).toBe(total);
    await store.setSearch('agro');
    expect(
      store
        .rows()
        .every((row) => row.health === 'at_risk' && /agro/i.test(row.displayName + row.legalName)),
    ).toBe(true);
    await store.setFilter(null);
    await store.setSearch('');
    await store.load(withSortPress(store.query(), 'creditUtilizationBps').query);
    const values = store.rows().map((row) => row.summary.creditUtilizationBps);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  /** The last request wins: an earlier answer arriving late does not replace a later one. */
  it('discards the answer of a request that was superseded', async () => {
    const store = TestBed.inject(CustomersStore);
    const first = store.load(withPageIndex(store.query(), 1).query);
    const second = store.load(withPageIndex(store.query(), 3).query);
    await Promise.all([first, second]);
    expect(store.page().index).toBe(3);
    expect(store.loading()).toBe(false);
  });

  /** One fact for the whole selection; the rows are read back once; a refused row stays selected. */
  it('places the selection on hold, reports what the backend refused and keeps it selected', async () => {
    const store = TestBed.inject(CustomersStore);
    const active = store.rows().find((row) => row.status === 'active')!;
    const held = store.rows().find((row) => row.status === 'on_hold');
    await store.load(
      withFilter(store.query(), {
        join: 'and',
        rules: [{ field: 'status', filter: setFilter(['on_hold']) }],
      }).query,
    );
    const alreadyHeld = held ?? store.rows()[0]!;
    store.selected.set([active.id, alreadyHeld.id]);
    const request = store.hold('Overdue invoices past 60 days');
    expect(store.bulkBusy()).toBe(true);
    const outcome = await request;
    expect(store.bulkBusy()).toBe(false);
    expect(outcome.done).toEqual([active.id]);
    expect(outcome.failed.map((failure) => failure.id)).toEqual([alreadyHeld.id]);
    expect(store.selected()).toEqual([alreadyHeld.id]);
    const api = await TestBed.inject(NEXORA_BACKEND).ready();
    expect((await api.customers.get(active.id)).customer.status).toBe('on_hold');
  });

  /** Another persona is another tenant: the rows and the selection are forgotten, and the list is read again. */
  it('forgets what it read when the session changes tenant and reads the list again', async () => {
    const store = TestBed.inject(CustomersStore);
    store.selected.set([store.rows()[0]!.id]);
    await signInAs('noah-bennett');
    await TestBed.inject(SessionStore).load();
    TestBed.tick();
    expect(store.total()).toBeNull();
    expect(store.selected()).toEqual([]);
    await store.open();
    expect(store.total()).not.toBeNull();
    expect(store.rows().length).toBeGreaterThan(0);
  });
});
