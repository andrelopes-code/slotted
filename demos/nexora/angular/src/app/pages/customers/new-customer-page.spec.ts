import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { CustomerCreateStore } from '../../core/crm/customer-create.store';
import { SessionStore } from '../../core/session/session.store';

async function open(): Promise<RouterTestingHarness> {
  const harness = await RouterTestingHarness.create('/crm/customers/new');
  harness.detectChanges();
  return harness;
}

function submit(harness: RouterTestingHarness): void {
  const form = harness.fixture.nativeElement.querySelector(
    'form[data-ui="form"]',
  ) as HTMLFormElement;
  form.requestSubmit();
}

async function settle(harness: RouterTestingHarness, predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 60 && !predicate(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    harness.detectChanges();
  }
  harness.detectChanges();
}

describe('NewCustomerPage', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
    TestBed.inject(CustomerCreateStore).reset();
  });

  it('opens the form on its own route rather than the record page', async () => {
    const harness = await open();
    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain('New customer');
    expect(text).toContain('Billing address');
  });

  it('answers an unchosen segment without asking the backend, and keeps what was typed', async () => {
    const harness = await open();
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({ displayName: 'Harbor Line Fabrication', industry: 'Metal Fabrication' });
    harness.detectChanges();

    submit(harness);
    await settle(harness, () =>
      (harness.fixture.nativeElement.textContent as string).includes(
        'This account was not created',
      ),
    );

    // The platform's own check ran: the request never left, so the store holds no answer.
    expect(store.submitting()).toBe(false);
    expect(store.failure()).toBeNull();
    const name = harness.fixture.nativeElement.querySelector(
      'input[name="displayName"]',
    ) as HTMLInputElement;
    expect(name.value).toBe('Harbor Line Fabrication');
  });

  it('puts the backend’s refusal on the control the backend named', async () => {
    const harness = await open();
    const store = TestBed.inject(CustomerCreateStore);
    // Spaces satisfy the platform's `required` and are nothing once the backend trims them.
    store.patch({ displayName: '   ', industry: 'Metal Fabrication', segment: 'mid_market' });
    harness.detectChanges();

    submit(harness);
    await settle(harness, () => store.errors()['displayName'] !== undefined);

    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain('Give the account the name an operator would search for.');
    const field = harness.fixture.nativeElement
      .querySelector('input[name="displayName"]')
      ?.closest('[data-ui="field"]') as HTMLElement;
    expect(field.hasAttribute('data-invalid')).toBe(true);
  });

  it('opens the account it created', async () => {
    const harness = await open();
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({
      displayName: 'Harbor Line Fabrication',
      industry: 'Metal Fabrication',
      segment: 'mid_market',
    });
    harness.detectChanges();

    submit(harness);
    const router = TestBed.inject(Router);
    await settle(harness, () => /\/crm\/customers\/cus_/.test(router.url));

    expect(router.url).toMatch(/\/crm\/customers\/cus_/);
    expect(store.draft().displayName).toBe('');
  });

  it('shows a representative the credit limit as a value they cannot write', async () => {
    await signInAs('noah-bennett');
    await TestBed.inject(SessionStore).load();
    const harness = await open();

    const field = [...harness.fixture.nativeElement.querySelectorAll('[data-ui="field"]')].find(
      (element) => (element as HTMLElement).textContent?.includes('Credit limit'),
    ) as HTMLElement | undefined;
    expect(field).toBeDefined();
    expect(field!.hasAttribute('data-readonly')).toBe(true);
    expect(harness.fixture.nativeElement.textContent as string).toContain(
      'Finance sets the limit.',
    );
  });

  it('keeps the draft when the reader leaves the form and opens it again', async () => {
    const harness = await open();
    const store = TestBed.inject(CustomerCreateStore);
    store.patch({ displayName: 'Harbor Line Fabrication' });
    harness.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/crm/customers');
    await harness.navigateByUrl('/crm/customers/new');
    harness.detectChanges();

    const name = harness.fixture.nativeElement.querySelector(
      'input[name="displayName"]',
    ) as HTMLInputElement;
    expect(name.value).toBe('Harbor Line Fabrication');
  });

  it('opens the optional groups closed, and requires what an opened group holds', async () => {
    const harness = await open();
    const store = TestBed.inject(CustomerCreateStore);
    expect(
      harness.fixture.nativeElement.querySelector('input[name="contact.firstName"]'),
    ).toBeNull();

    store.patch({ withContact: true });
    harness.detectChanges();

    const first = harness.fixture.nativeElement.querySelector(
      'input[name="contact.firstName"]',
    ) as HTMLInputElement;
    expect(first.required).toBe(true);
  });

  it('denies the route to a persona without customers.create', async () => {
    await signInAs('owen-price');
    await TestBed.inject(SessionStore).load();
    const harness = await open();

    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Create account');
    expect(TestBed.inject(Router).url).toBe('/crm/customers/new');
  });
});
