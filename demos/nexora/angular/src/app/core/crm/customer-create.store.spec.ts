import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { SessionStore } from '../session/session.store';
import { CustomerCreateStore } from './customer-create.store';

describe('CustomerCreateStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    TestBed.inject(CustomerCreateStore).reset();
  });

  it('creates a prospect with its primary contact and its billing address in one command', async () => {
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({
      displayName: 'Harbor Line Fabrication',
      industry: 'Metal Fabrication',
      segment: 'mid_market',
      withContact: true,
      withAddress: true,
    });
    store.patchContact({ firstName: 'Dana', lastName: 'Whitfield', email: 'dana@harborline.com' });
    store.patchAddress({
      line1: '4120 Bayfront Parkway',
      city: 'Milwaukee',
      region: 'WI',
      postalCode: '53207',
    });

    const request = store.submit();
    expect(store.submitting()).toBe(true);
    const created = await request;

    expect(created?.status).toBe('prospect');
    expect(created?.accountNumber).toMatch(/^CUS-/);
    expect(store.submitting()).toBe(false);
    // A created account leaves no draft behind.
    expect(store.draft().displayName).toBe('');

    const api = await TestBed.inject(NEXORA_BACKEND).ready();
    const detail = await api.customers.get(created!.id);
    expect(detail.contacts.map((contact) => contact.displayName)).toEqual(['Dana Whitfield']);
    expect(detail.contacts[0]!.isPrimary).toBe(true);
    expect(detail.addresses[0]!.city).toBe('Milwaukee');
    expect(detail.customer.billingAddressId).toBe(detail.addresses[0]!.id);
  });

  it('puts a 422 on the control the backend named and keeps what was typed', async () => {
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({ displayName: '  ', industry: '', segment: '' });

    const created = await store.submit();

    expect(created).toBeNull();
    expect(Object.keys(store.errors()).sort()).toEqual(['displayName', 'industry', 'segment']);
    expect(store.errors()['displayName']![0]).toBe(
      'Give the account the name an operator would search for.',
    );
    expect(store.failure()).toBeNull();
    expect(store.draft().displayName).toBe('  ');
  });

  it('refuses a credit limit to a representative and keeps the draft', async () => {
    await signInAs('noah-bennett');
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({
      displayName: 'Delta Rail Components',
      industry: 'Automotive Components',
      segment: 'smb',
      creditLimit: 50_000,
    });

    const created = await store.submit();

    expect(created).toBeNull();
    expect(store.failure()?.code).toBe('FORBIDDEN');
    expect(store.errors()).toEqual({});
    expect(store.draft().creditLimit).toBe(50_000);
  });

  it('lets a representative create an account owned by them', async () => {
    await signInAs('noah-bennett');
    const session = TestBed.inject(SessionStore);
    await session.load();
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({
      displayName: 'Delta Rail Components',
      industry: 'Automotive Components',
      segment: 'smb',
    });

    const created = await store.submit();

    expect(created?.accountOwnerId).toBe(session.user()?.id);
    expect(created?.health).toBe('healthy');
  });

  it('sends the credit limit in minor units of the region currency', async () => {
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({
      displayName: 'Aurora Ceramics',
      industry: 'Building Materials',
      segment: 'smb',
      regionCode: 'BR',
      creditLimit: 1_250.5,
    });

    const created = await store.submit();

    expect(created?.creditLimit).toEqual({ currency: 'BRL', minor: 125_050 });
    expect(created?.preferredCurrency).toBe('BRL');
  });
});
