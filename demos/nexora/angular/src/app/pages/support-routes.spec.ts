import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { NAV_MODULES } from '../core/nav/nav.model';
import { SessionStore } from '../core/session/session.store';

/** The module is done when no route under /support opens on the placeholder. */
describe('the Support routes', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('aisha-grant');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const settle = async (harness: RouterTestingHarness, text: string): Promise<string> => {
    for (let attempt = 0; attempt < 160; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes(text)) break;
    }
    return harness.fixture.nativeElement.textContent as string;
  };

  const text = (harness: RouterTestingHarness) => harness.fixture.nativeElement.textContent as string;
  const query = (harness: RouterTestingHarness, selector: string) =>
    (harness.fixture.nativeElement as HTMLElement).querySelector(selector);

  it('opens a screen of its own on the inbox, a ticket and the form', async () => {
    const id = api.demo.fixtures()['flagship.ticket.meridian'] as string;
    const harness = await RouterTestingHarness.create('/support/inbox');
    for (const path of ['/support/inbox', `/support/inbox/${id}`, '/support/inbox/new']) {
      await harness.navigateByUrl(path);
      harness.detectChanges();
      expect(text(harness), path).not.toContain('is part of the');
      expect(text(harness), path).not.toContain('is not built yet');
      expect(TestBed.inject(Router).url, path).toBe(path);
    }
  }, 60_000);

  it('every destination the navigation names has a screen', () => {
    const support = NAV_MODULES.find((module) => module.id === 'support')!;
    expect(support.destinations.map((destination) => destination.path)).toEqual(['/support/inbox']);
  });

  it('declares /new before :id, so it is not read as a ticket id', async () => {
    const harness = await RouterTestingHarness.create('/support/inbox/new');
    expect(await settle(harness, 'New ticket')).toContain('What the customer reported');
  });

  it('keeps a missing ticket on its own url and answers with its own not-found (RP-04)', async () => {
    const path = '/support/inbox/tkt_does_not_exist';
    const harness = await RouterTestingHarness.create(path);
    expect(await settle(harness, 'This ticket does not exist')).toContain('This ticket does not exist');
    expect(TestBed.inject(Router).url).toBe(path);
  });

  it('opens the flagship ticket with its conversation, its clocks and the shipment it is about', async () => {
    const id = api.demo.fixtures()['flagship.ticket.meridian'] as string;
    const harness = await RouterTestingHarness.create(`/support/inbox/${id}`);
    await settle(harness, 'Send reply');
    expect(query(harness, '[data-testid="thread"]')).not.toBeNull();
    expect(query(harness, '[data-testid="composer"]')).not.toBeNull();
    // Narrower than two readable columns, the context is the header's second tab.
    ([...(harness.fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]')].find((tab) =>
      tab.textContent?.includes('Details'),
    ) as HTMLElement).click();
    expect(await settle(harness, 'First response')).toContain('Service level');
    expect(query(harness, '[data-testid="linked-shipment"]')).not.toBeNull();
    expect(query(harness, '[data-testid="escalate"]')).toBeNull();
    expect(query(harness, '[data-testid="resolve"]')).not.toBeNull();
  });

  it('opens a ticket in reading to a sales manager: no composer, no command, the holders named', async () => {
    const id = api.demo.fixtures()['flagship.ticket.meridian'] as string;
    const held = await api.support.tickets.get(id);
    await api.support.tickets.internalNote(id, { body: 'Carrier claim filed.' }, { ifMatch: held.ticket.metadata.version });
    await signIn('sofia-ramirez');
    const harness = await RouterTestingHarness.create(`/support/inbox/${id}`);
    await settle(harness, 'You read this ticket');
    expect(text(harness)).not.toContain('Carrier claim');
    expect(query(harness, '[data-testid="composer"]')).toBeNull();
    expect(query(harness, '[data-testid="resolve"]')).toBeNull();
    expect(text(harness)).toContain('a support manager or agent, or an administrator');
    expect(query(harness, '[data-testid="internal-mark"]')).toBeNull();
  });

  it('asks for a reason before waiting on a customer who has not been asked anything', async () => {
    const fresh = await api.support.tickets.create({
      customerId: (await api.customers.list({ pageSize: 25 })).data[0]!.id,
      subject: 'Portal login fails',
      description: 'The reset link expired.',
    });
    const assigned = await api.support.tickets.assign(
      fresh.ticket.id,
      { assigneeId: TestBed.inject(SessionStore).user()!.id },
      { ifMatch: fresh.ticket.metadata.version },
    );
    expect(assigned.ticket.status).toBe('open');
    const harness = await RouterTestingHarness.create(`/support/inbox/${fresh.ticket.id}`);
    await settle(harness, 'Wait on customer');
    (query(harness, '[data-testid="pending-customer"]') as HTMLButtonElement).click();
    expect(await settle(harness, 'What the ticket waits for')).toContain('No public reply has been sent yet');
    expect((await api.support.tickets.get(fresh.ticket.id)).ticket.status).toBe('open');
  });

  it('tells Jordan Wells the module is not theirs, rather than opening it empty', async () => {
    await signIn('jordan-wells');
    const harness = await RouterTestingHarness.create('/support/inbox');
    harness.detectChanges();
    expect(text(harness)).toContain('support.view');
  });

  it('refuses the form to a representative, who reads tickets and does not create them', async () => {
    await signIn('noah-bennett');
    const harness = await RouterTestingHarness.create('/support/inbox/new');
    harness.detectChanges();
    expect(text(harness)).toContain('support.create');
    expect(TestBed.inject(Router).url).toBe('/support/inbox/new');
  });

  it('opens a queue from its door, with the queue as the bar’s view', async () => {
    const harness = await RouterTestingHarness.create('/support/inbox?queue=escalated');
    await settle(harness, 'Escalated');
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if (query(harness, '[data-testid="queue-rows"] [data-id]')) break;
    }
    const rows = [...(harness.fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="queue-rows"] [data-id]')];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.textContent).toContain('Escalated');
  });
});
