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

/** The module is done when no route under /automations opens on the placeholder. */
describe('the Automation routes', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('maya-chen');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const settle = async (harness: RouterTestingHarness, text: string): Promise<string> => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes(text)) break;
    }
    return harness.fixture.nativeElement.textContent as string;
  };

  const text = (harness: RouterTestingHarness) => harness.fixture.nativeElement.textContent as string;
  const query = (harness: RouterTestingHarness, selector: string) =>
    (harness.fixture.nativeElement as HTMLElement).querySelector(selector);

  const failedRun = () => api.store.dataset.workflowRuns.get(api.demo.fixtures()['edge.workflow.failed_run']!)!;

  it('opens a screen of its own on the list, a workflow, its history and the form', async () => {
    const id = api.demo.fixtures()['edge.workflow.nested_conditions'] as string;
    const harness = await RouterTestingHarness.create('/automations/workflows');
    for (const path of ['/automations/workflows', `/automations/workflows/${id}`, `/automations/workflows/${id}/runs`, '/automations/workflows/new']) {
      await harness.navigateByUrl(path);
      harness.detectChanges();
      expect(text(harness), path).not.toContain('is part of the');
      expect(text(harness), path).not.toContain('is not built yet');
      expect(TestBed.inject(Router).url, path).toBe(path);
    }
  }, 60_000);

  it('every destination the navigation names has a screen', () => {
    const automations = NAV_MODULES.find((module) => module.id === 'automations')!;
    expect(automations.destinations.map((destination) => destination.path)).toEqual(['/automations/workflows']);
  });

  it('declares /new before :id, so it is not read as a workflow id', async () => {
    const harness = await RouterTestingHarness.create('/automations/workflows/new');
    expect(await settle(harness, 'Step 1')).toContain('New workflow');
    expect(query(harness, '[data-testid="new-workflow-form"]')).not.toBeNull();
  });

  it('keeps a missing workflow on its own url and answers with its own not-found (RP-04)', async () => {
    const path = '/automations/workflows/wfl_does_not_exist';
    const harness = await RouterTestingHarness.create(path);
    expect(await settle(harness, 'This workflow does not exist')).toContain('Back to workflows');
    expect(TestBed.inject(Router).url).toBe(path);
  });

  it('lists every workflow with a view per state, and a door to the ones a run stopped', async () => {
    const harness = await RouterTestingHarness.create('/automations/workflows');
    const words = await settle(harness, 'stopped by a failed run');
    expect(words).toContain('1 workflow was stopped by a failed run');
    (query(harness, '[data-testid="error-door"]') as HTMLElement).click();
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if (text(harness).includes('1 of 10 workflows')) break;
    }
    expect(text(harness)).toContain('1 of 10 workflows');
    expect(text(harness)).toContain('Hold orders that push a customer past its credit limit');
  });

  it('says why a workflow stopped, that an edit pauses it, and draws the commands its state allows', async () => {
    const run = failedRun();
    const harness = await RouterTestingHarness.create(`/automations/workflows/${run.workflowId}`);
    const words = await settle(harness, 'Editing the workflow pauses it');
    expect(words).toContain('The record refused the change in its current state');
    expect(words).toContain('Order in status draft cannot be placed on hold');
    expect(query(harness, '[data-testid="activate"]')).not.toBeNull();
    expect(query(harness, '[data-testid="pause"]')).not.toBeNull();
    expect(query(harness, '[data-testid="archive"]')).not.toBeNull();
    expect(query(harness, '[data-testid="edit"]')).not.toBeNull();
  });

  it('reads the nested tree as a rule, every later line led by its join', async () => {
    const id = api.demo.fixtures()['edge.workflow.nested_conditions'] as string;
    const harness = await RouterTestingHarness.create(`/automations/workflows/${id}`);
    await settle(harness, 'and any of:');
    // The sheet sets the trigger beside its "When": the rule's opening, then the event.
    expect(query(harness, '[data-testid="map-trigger"]')?.textContent).toMatch(/When\s*An order is confirmed/);
    const lines = [...(harness.fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="map-decision"] .line')].map((line) =>
      (line.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(lines).toEqual([
      'Order total is at least $50,000',
      'and any of:',
      'Customer segment is not Strategic',
      'or all of:',
      'Order risk flags includes Low margin',
      'and Customer health is not Healthy',
    ]);
    expect(query(harness, '[data-testid="map-actions"]')?.textContent).toContain('Notify Sofia Ramirez');
  });

  it('draws what the workflow did in fourteen days on its map, and a day of the strip opens the history on it', async () => {
    const id = api.demo.fixtures()['edge.workflow.nested_conditions'] as string;
    const { insight } = await api.workflows.get(id);
    const busiest = insight.days.reduce((top, day) => (day.skipped + day.succeeded > top.skipped + top.succeeded ? day : top));
    const onBusiest = busiest.succeeded + busiest.skipped + busiest.failed + busiest.partially_failed;
    const harness = await RouterTestingHarness.create(`/automations/workflows/${id}`);
    await settle(harness, 'events matched');
    expect(query(harness, '[data-testid="workflow-map"]')?.textContent).toContain(`${insight.events} events in 14 days`);
    expect(query(harness, '[data-testid="map-decision"]')?.textContent).toContain(`${insight.matched} of ${insight.events} events matched`);
    expect(query(harness, '[data-testid="map-action-0"]')?.textContent).toContain(`${insight.actions[0]!.succeeded} done`);
    const skipped = insight.events - insight.matched;
    expect(query(harness, '[data-testid="map-sink"]')?.textContent).toContain(`${skipped} events skipped`);
    const column = query(harness, `[data-testid="run-strip"] button[data-date="${busiest.date}"]`) as HTMLButtonElement;
    expect(column.getAttribute('aria-label')).toContain(`${onBusiest} runs`);
    column.click();
    await settle(harness, 'Run history');
    expect(TestBed.inject(Router).url).toBe(`/automations/workflows/${id}/runs?day=${busiest.date}`);
    const words = await settle(harness, `${onBusiest} of ${insight.events} runs`);
    expect(words).toContain(`${onBusiest} of ${insight.events} runs`);
    expect(query(harness, `[data-testid="run-strip"] button[data-date="${busiest.date}"]`)?.getAttribute('aria-pressed')).toBe('true');
  }, 30_000);

  it('opens a run action by action, its record at the record’s own address', async () => {
    const run = failedRun();
    const harness = await RouterTestingHarness.create(`/automations/workflows/${run.workflowId}/runs?run=${run.id}`);
    // The drawer is a layer of its own, drawn in the document's body.
    for (let attempt = 0; attempt < 200 && !document.body.querySelector('[data-testid="run-results"]'); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
    }
    expect(document.body.querySelector('[data-testid="run-results"]')?.textContent).toContain('Order in status draft cannot be placed on hold');
    // The trace is the workflow's map: the decision matched, and the action says how it failed.
    const trace = document.body.querySelector('[data-testid="run-actions"]')!;
    expect(trace.querySelector('[data-testid="map-decision"]')?.textContent).toContain('Matched');
    expect(trace.querySelector('[data-testid="map-action-0"]')?.getAttribute('data-tone')).toBe('danger');
    expect(trace.querySelector('[data-testid="map-action-0"]')?.textContent).toContain('Failed: Order in status draft cannot be placed on hold');
    const link = document.body.querySelector('[data-testid="run-affected"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/sales/orders/${run.affectedEntityId}`);
  });

  it('lets an executive and an auditor read a workflow with no editor, and names who writes them', async () => {
    const id = api.demo.fixtures()['edge.workflow.nested_conditions'] as string;
    const harness = await RouterTestingHarness.create('/dashboard');
    for (const persona of ['owen-price', 'evan-brooks', 'sofia-ramirez']) {
      await signIn(persona);
      await harness.navigateByUrl(`/automations/workflows/${id}?edit=1`);
      const words = await settle(harness, 'Workflows are written');
      expect(words, persona).toContain('and any of:');
      expect(query(harness, '[data-testid="definition-form"]'), persona).toBeNull();
      expect(query(harness, '[data-testid="edit"]'), persona).toBeNull();
      expect(query(harness, '[data-testid="activate"]'), persona).toBeNull();
    }
  });

  it('tells a reader without workflows.view the module is not theirs, rather than opening it empty', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    for (const persona of ['jordan-wells', 'marcus-lee', 'noah-bennett', 'aisha-grant']) {
      await signIn(persona);
      await harness.navigateByUrl(`/automations/workflows?${persona}`);
      harness.detectChanges();
      expect(text(harness), persona).toContain('workflows.view');
    }
  });

  it('refuses the form to a reader who does not write workflows', async () => {
    await signIn('sofia-ramirez');
    const harness = await RouterTestingHarness.create('/automations/workflows/new');
    harness.detectChanges();
    expect(text(harness)).toContain('workflows.create');
    expect(TestBed.inject(Router).url).toBe('/automations/workflows/new');
  });

  it('answers a new tenant with no workflow, and the way to write the first', async () => {
    await api.demo.setScenario('new_tenant');
    try {
      await signIn('maya-chen');
      const harness = await RouterTestingHarness.create('/automations/workflows');
      const words = await settle(harness, 'No workflow yet');
      expect(words).toContain('No workflow yet');
      expect(query(harness, '[data-testid="workflows-empty"] a')?.getAttribute('href')).toBe('/automations/workflows/new');
    } finally {
      // The backend is shared by the files of a worker: the next one opens on the healthy tenant.
      await api.demo.reset('healthy');
    }
  }, 120_000);
});
