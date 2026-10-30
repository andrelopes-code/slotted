import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { CustomerEditStore } from '../../core/crm/customer-edit.store';
import { CustomerStore } from '../../core/crm/customer.store';
import { SessionStore } from '../../core/session/session.store';

describe('AccountSection', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    TestBed.inject(CustomerEditStore).cancel();
  });

  async function openRecord(): Promise<{ harness: RouterTestingHarness; id: string }> {
    const page = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    const id = page.data[0]!.id;
    const harness = await RouterTestingHarness.create(`/crm/customers/${id}`);
    for (
      let attempt = 0;
      attempt < 80 && TestBed.inject(CustomerStore).customer() === null;
      attempt += 1
    )
      await new Promise((resolve) => setTimeout(resolve, 25));
    harness.detectChanges();
    return { harness, id };
  }

  function text(harness: RouterTestingHarness): string {
    return harness.fixture.nativeElement.textContent as string;
  }

  it('reads the account, and writes it in the section it was read in', async () => {
    const { harness } = await openRecord();
    expect(text(harness)).toContain('Legal name');

    TestBed.inject(CustomerEditStore).start(TestBed.inject(CustomerStore).customer()!);
    harness.detectChanges();

    const name = harness.fixture.nativeElement.querySelector(
      'input[name="displayName"]',
    ) as HTMLInputElement;
    expect(name.value).toBe(TestBed.inject(CustomerStore).customer()!.displayName);
    // The record's own header and its tabs stay: the form is the section's body.
    expect(text(harness)).toContain('Overview');
    expect(text(harness)).toContain('Save account');
  });

  it('says what the other writer changed, and offers the two answers', async () => {
    const { harness, id } = await openRecord();
    const edit = TestBed.inject(CustomerEditStore);
    const customer = TestBed.inject(CustomerStore).customer()!;
    const version = customer.metadata.version;
    edit.start(customer);
    edit.patch({ displayName: `${customer.displayName} Holdings` });

    await api.customers.update(id, { industry: 'Renewable Energy' }, { ifMatch: version });
    await edit.save();
    harness.detectChanges();

    const body = text(harness);
    expect(body).toContain('Someone changed one field while this form was open.');
    expect(body).toContain('Now on the account: Renewable Energy');
    expect(body).toContain('Keep what I wrote');
    expect(body).toContain('Start from the account');
  });

  it('offers no Edit to a persona who cannot write customers', async () => {
    await signInAs('owen-price');
    await TestBed.inject(SessionStore).load();
    const { harness } = await openRecord();

    const buttons = [...harness.fixture.nativeElement.querySelectorAll('button')].map((button) =>
      (button as HTMLButtonElement).textContent?.trim(),
    );
    expect(buttons).not.toContain('Edit');
  });
});
