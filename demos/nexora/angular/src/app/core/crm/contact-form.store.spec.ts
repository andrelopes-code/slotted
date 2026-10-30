import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { AddressFormStore } from './address-form.store';
import { ContactFormStore } from './contact-form.store';
import { CustomerStore } from './customer.store';

describe('the people and the places of an account', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    TestBed.inject(ContactFormStore).cancel();
    TestBed.inject(AddressFormStore).cancel();
  });

  async function openWithContacts(): Promise<CustomerStore> {
    const page = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    const record = TestBed.inject(CustomerStore);
    for (const item of page.data) {
      await record.open(item.id);
      if ((record.detail()?.contacts.length ?? 0) > 1) return record;
    }
    return record;
  }

  it('adds a contact to the account and reads the record back', async () => {
    const record = await openWithContacts();
    const before = record.detail()!.contacts.length;
    const form = TestBed.inject(ContactFormStore);
    form.startNew();
    form.patch({ firstName: 'Dana', lastName: 'Whitfield', email: 'dana@harborline.com' });

    expect(await form.save()).toBe(true);

    const contacts = record.detail()!.contacts;
    expect(contacts.length).toBe(before + 1);
    expect(contacts.some((contact) => contact.displayName === 'Dana Whitfield')).toBe(true);
    expect(form.mode()).toBe('closed');
  });

  it('refuses an address the backend cannot read and keeps the words on the fields', async () => {
    const record = await openWithContacts();
    void record;
    const form = TestBed.inject(ContactFormStore);
    form.startNew();
    form.patch({ firstName: 'Dana', lastName: 'Whitfield', email: 'dana at harborline' });

    expect(await form.save()).toBe(false);
    expect(form.errors()['email']?.[0]).toBe('Write the address as name@company.com.');
    expect(form.mode()).toBe('new');
    expect(form.draft().firstName).toBe('Dana');
  });

  it('moves the primary mark to one contact and takes it from the other', async () => {
    const record = await openWithContacts();
    const contacts = record.detail()!.contacts;
    const previous = contacts.find((contact) => contact.isPrimary)!;
    const next = contacts.find((contact) => !contact.isPrimary && contact.status === 'active')!;
    const form = TestBed.inject(ContactFormStore);

    const request = form.setPrimary(next);
    expect(form.promoting()).toBe(next.id);
    expect(await request).toBe(true);

    const after = record.detail()!.contacts;
    expect(after.find((contact) => contact.id === next.id)!.isPrimary).toBe(true);
    expect(after.find((contact) => contact.id === previous.id)!.isPrimary).toBe(false);
    expect(after.filter((contact) => contact.isPrimary).length).toBe(1);
    expect(record.customer()!.primaryContactId).toBe(next.id);
  });

  it('takes the primary mark from a contact who is marked inactive', async () => {
    const record = await openWithContacts();
    const primary = record.detail()!.contacts.find((contact) => contact.isPrimary)!;
    const form = TestBed.inject(ContactFormStore);
    form.startEdit(primary);
    form.patch({ status: 'inactive' });

    expect(await form.save()).toBe(true);

    const after = record.detail()!.contacts.find((contact) => contact.id === primary.id)!;
    expect(after.status).toBe('inactive');
    expect(after.isPrimary).toBe(false);
    expect(record.customer()!.primaryContactId).toBeUndefined();
  });

  it('adds an address and makes it the default of its type', async () => {
    const record = await openWithContacts();
    const before = record.detail()!.addresses.length;
    const form = TestBed.inject(AddressFormStore);
    form.start();
    form.patch({
      type: 'shipping',
      line1: '4120 Bayfront Parkway',
      city: 'Milwaukee',
      region: 'WI',
      postalCode: '53207',
      deliveryInstructions: 'Receiving hours 7:00–15:00.',
      isDefault: true,
    });

    expect(await form.save()).toBe(true);

    const addresses = record.detail()!.addresses;
    expect(addresses.length).toBe(before + 1);
    const added = addresses.find((address) => address.line1 === '4120 Bayfront Parkway')!;
    expect(added.isDefault).toBe(true);
    expect(added.deliveryInstructions).toBe('Receiving hours 7:00–15:00.');
    expect(record.customer()!.defaultShippingAddressId).toBe(added.id);
    expect(form.open()).toBe(false);
  });

  it('puts the backend’s refusal of an empty address on its own fields', async () => {
    await openWithContacts();
    const form = TestBed.inject(AddressFormStore);
    form.start();
    form.patch({ line1: '  ', city: '', region: '', postalCode: '' });

    expect(await form.save()).toBe(false);
    expect(Object.keys(form.errors()).sort()).toEqual(['city', 'line1', 'postalCode', 'region']);
    expect(form.errors()['line1']?.[0]).toBe('Write the street and number the carrier reads.');
    expect(form.open()).toBe(true);
  });
});
