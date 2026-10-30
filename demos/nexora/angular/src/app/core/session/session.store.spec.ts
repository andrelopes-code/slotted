import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('loads Sofia and answers can()', async () => {
    const store = TestBed.inject(SessionStore);
    await store.load();
    expect(store.status()).toBe('ready');
    expect(store.can('orders.approve')).toBe(true);
    expect(store.can('inventory.adjust')).toBe(false);
    expect(store.canAny('finance.dashboard', 'invoices.view')).toBe(true);
    expect(store.warehouses().length).toBeGreaterThanOrEqual(5);
  });

  it('scopes Jordan to one warehouse', async () => {
    await signInAs('jordan-wells');
    const store = TestBed.inject(SessionStore);
    await store.load();
    expect(store.warehouses().map((w) => w.code)).toEqual(['CHI-01']);
  });

  it('is unauthenticated after sign-out until a persona is chosen', async () => {
    const store = TestBed.inject(SessionStore);
    await store.load();
    store.signOut();
    expect(store.status()).toBe('unauthenticated');
  });
});
