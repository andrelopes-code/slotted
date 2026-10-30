import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CHART_ENGINE } from '@slotted/angular/chart';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { NAV_MODULES, visibleModules } from '../core/nav/nav.model';
import { SessionStore } from '../core/session/session.store';

const silentEngine = () => ({
  update: () => Promise.resolve(),
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});

const REPORTS = ['executive', 'sales', 'inventory', 'procurement', 'finance', 'support'];

/** The module is done when no route under /analytics opens on the placeholder. */
describe('the Analytics routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTestBackend(), provideRouter(routes), { provide: CHART_ENGINE, useValue: silentEngine }],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await signIn('maya-chen');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  const text = (harness: RouterTestingHarness) => harness.fixture.nativeElement.textContent as string;

  const settle = async (harness: RouterTestingHarness, words: string): Promise<string> => {
    for (let attempt = 0; attempt < 600; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if (text(harness).includes(words)) break;
    }
    return text(harness);
  };

  it('opens a screen of its own on every report, each with its period in the address', async () => {
    const harness = await RouterTestingHarness.create('/analytics/executive');
    for (const report of REPORTS) {
      await harness.navigateByUrl(`/analytics/${report}`);
      const words = await settle(harness, 'What needs attention');
      expect(words, report).not.toContain('is part of the');
      expect(words, report).not.toContain('is not built yet');
      expect(words, report).toContain('What needs attention');
      // A report opened with no period takes the one last chosen, in its address.
      expect(TestBed.inject(Router).url, report).toBe(`/analytics/${report}?period=30d&compare=previous`);
    }
  }, 120_000);

  it('names six destinations, one per report type of §16, Procurement among them', () => {
    const analytics = NAV_MODULES.find((module) => module.id === 'analytics')!;
    expect(analytics.destinations.map((destination) => destination.path)).toEqual(
      REPORTS.map((report) => `/analytics/${report}`),
    );
    expect(analytics.destinations.every((destination) => destination.record === false)).toBe(true);
  });

  it('has no record under a report: /analytics/sales/123 is the not-found page', async () => {
    const harness = await RouterTestingHarness.create('/analytics/sales/123');
    harness.detectChanges();
    expect(text(harness)).toContain('Page not found');
    expect(text(harness)).not.toContain('What needs attention');
  });

  it('opens the module on the first report the reader may open', async () => {
    const harness = await RouterTestingHarness.create('/analytics');
    await settle(harness, 'What needs attention');
    expect(TestBed.inject(Router).url.split('?')[0]).toBe('/analytics/executive');
  });

  it('offers a procurement lead the reports of the records they read, and no other', async () => {
    await signIn('procurement-lead');
    const session = TestBed.inject(SessionStore);
    const analytics = visibleModules((permission) => session.can(permission)).find((module) => module.id === 'analytics')!;
    expect(analytics.destinations.map((destination) => destination.id)).toEqual([
      'analytics.executive',
      'analytics.inventory',
      'analytics.procurement',
    ]);
    const harness = await RouterTestingHarness.create('/analytics');
    await settle(harness, 'What needs attention');
    expect(TestBed.inject(Router).url.split('?')[0]).toBe('/analytics/executive');
    // A report the reader cannot read is refused by name, not opened empty.
    await harness.navigateByUrl('/analytics/sales');
    harness.detectChanges();
    expect(text(harness)).toContain('orders.view');
  });

  it('tells Jordan Wells, Aisha Grant and Marcus Lee the module is not theirs, rather than opening it empty', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    for (const persona of ['jordan-wells', 'aisha-grant', 'marcus-lee']) {
      await signIn(persona);
      const session = TestBed.inject(SessionStore);
      expect(visibleModules((permission) => session.can(permission)).some((module) => module.id === 'analytics'), persona).toBe(false);
      await harness.navigateByUrl(`/analytics/support?persona=${persona}`);
      harness.detectChanges();
      expect(text(harness), persona).toContain('analytics.view');
      expect(text(harness), persona).not.toContain('What needs attention');
    }
  });

  it('gives the support report to the support lead, who holds analytics.view, and not to the agent', async () => {
    await signIn('support-lead');
    const harness = await RouterTestingHarness.create('/analytics/support');
    expect(await settle(harness, 'Tickets opened')).toContain('Tickets opened');
  });
});
