import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CHART_ENGINE } from '@slotted/angular/chart';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { NAV_MODULES } from '../core/nav/nav.model';
import { SessionStore } from '../core/session/session.store';

/**
 * jsdom has no ResizeObserver and no layout, so the overview's charts are
 * drawn by an engine that records nothing: the token the family publishes for
 * exactly this.
 */
const silentEngine = () => ({
  update: () => Promise.resolve(),
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});

/** The module is done when no route under /inventory opens on the placeholder. */
describe('the Inventory routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestBackend(),
        provideRouter(routes),
        { provide: CHART_ENGINE, useValue: silentEngine },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await signInAs('maya-chen');
    await TestBed.inject(SessionStore).load();
  });

  const paths = [
    '/inventory/overview',
    '/inventory/stock',
    '/inventory/warehouses',
    '/inventory/transfers',
    '/inventory/movements',
    '/inventory/cycle-counts',
  ];

  const settle = async (harness: RouterTestingHarness, text: string): Promise<string> => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes(text)) break;
    }
    return harness.fixture.nativeElement.textContent as string;
  };

  it('opens a screen of its own on every destination of the module, and on the two create forms', async () => {
    const harness = await RouterTestingHarness.create(paths[0]!);
    for (const path of [...paths, '/inventory/transfers/new', '/inventory/cycle-counts/new']) {
      await harness.navigateByUrl(path);
      harness.detectChanges();
      const text = harness.fixture.nativeElement.textContent as string;
      expect(text, path).not.toContain('is part of the');
      expect(text, path).not.toContain('is not built yet');
      expect(TestBed.inject(Router).url, path).toBe(path);
    }
    // Eight screens, the overview's fifty counts among them: longer than the runner's default.
  }, 60_000);

  it('every destination the navigation names has a screen, cycle counts and stock included', () => {
    const inventory = NAV_MODULES.find((module) => module.id === 'inventory')!;
    expect(inventory.destinations.map((destination) => destination.path).sort()).toEqual(
      [...paths].sort(),
    );
  });

  it('declares /new before :id, so "new" is never read as a transfer or a count id', async () => {
    const harness = await RouterTestingHarness.create('/inventory/transfers/new');
    expect(await settle(harness, 'New transfer')).toContain('New transfer');
    await harness.navigateByUrl('/inventory/cycle-counts/new');
    expect(await settle(harness, 'Plan a count')).toContain('Plan a count');
  });

  it.each([
    ['/inventory/stock/sku_does_not_exist', 'This SKU does not exist'],
    ['/inventory/transfers/trf_does_not_exist', 'This transfer does not exist'],
    ['/inventory/cycle-counts/ccn_does_not_exist', 'This count does not exist'],
    ['/inventory/warehouses/wh_does_not_exist', 'This warehouse does not exist'],
  ])('keeps %s on its own url and answers with the page’s own not-found (RP-04)', async (path, words) => {
    const harness = await RouterTestingHarness.create(path);
    expect(await settle(harness, words)).toContain(words);
    expect(TestBed.inject(Router).url).toBe(path);
  });

  it('the overview has no record of its own: its :id is the not-found page', async () => {
    const harness = await RouterTestingHarness.create('/inventory/overview/anything');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('not found');
  });

  it('refuses the create forms to a persona without the command, and keeps the url', async () => {
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create('/inventory/transfers/new');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('inventory.transfer');
    expect(TestBed.inject(Router).url).toBe('/inventory/transfers/new');

    await signInAs('noah-bennett');
    await TestBed.inject(SessionStore).load();
    await harness.navigateByUrl('/inventory/cycle-counts/new');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('inventory.cycle_count');
  });

  it('tells a persona without inventory.view that the module is not theirs, rather than opening it empty', async () => {
    await signInAs('aisha-grant');
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create('/inventory/overview');
    harness.detectChanges();
    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain('inventory.view');
    expect(text).not.toContain('Below safety stock');
  });
});
