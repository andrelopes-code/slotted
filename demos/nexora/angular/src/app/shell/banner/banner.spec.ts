import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { ApprovalsStore } from '../../core/activity/approvals.store';
import { SessionStore } from '../../core/session/session.store';
import { CommandPalette } from '../palette/command-palette';

describe('Banner', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('shows the product and the approvals count', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const banner = harness.fixture.nativeElement.querySelector(
      '[data-ui="top-navigation"]',
    ) as HTMLElement;
    expect(banner.textContent).toContain('Nexora');
    const approvals = banner.querySelector('[aria-label^="Approvals"]') as HTMLElement;
    expect(approvals.getAttribute('aria-label')).toMatch(/^Approvals, \d+ pending$/);
  });

  /**
   * The end cluster is one row of equals. A control the app draws with another
   * family — an icon button, a badge in an anchor — brings that family's
   * height, ink and count into the row beside the bell's, and the row reads as
   * two kinds of button. Every control here is a top-navigation part, and every
   * count is the family's own.
   */
  it('draws every control in the actions cluster as a top-navigation part', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const actions = harness.fixture.nativeElement.querySelector(
      '[data-ui="top-navigation"] [data-part="actions"]',
    ) as HTMLElement;
    const controls = [...actions.querySelectorAll('button, a')] as HTMLElement[];
    expect(controls.length).toBeGreaterThan(3);
    for (const control of controls) {
      expect(control.getAttribute('data-part'), control.outerHTML).toMatch(
        /^(search-toggle|help|notifications|account|action)$/,
      );
      expect(control.getAttribute('data-ui'), control.outerHTML).toBeNull();
    }
    expect(actions.querySelector('[data-ui="badge"]')).toBeNull();
    for (const count of actions.querySelectorAll('[data-part="count"]')) {
      expect(count.closest('[data-part="notifications"], [data-part="action"]')).not.toBeNull();
    }
  });

  it('keeps the bar to the product: the workspace is the column header, not the brand', async () => {
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).reload();
    const harness = await RouterTestingHarness.create('/dashboard');
    const root = harness.fixture.nativeElement as HTMLElement;
    const brand = root.querySelector(
      '[data-ui="top-navigation"] [data-part="brand"]',
    ) as HTMLElement;
    expect(brand.textContent?.trim()).toBe('Nexora');
    expect(root.querySelector('[data-ui="top-navigation"] [data-part="context"]')).toBeNull();
    const header = root.querySelector('[data-part="nav-header"]') as HTMLElement;
    expect(header.textContent).toContain('Asteron Industrial Supply');
    expect(header.textContent).toContain('CHI-01');
  });

  /**
   * Below 600px the bar folds the search region behind a magnifier. The region
   * holds the palette's trigger, not a field, so the magnifier opening the
   * region would cost a second press: it opens the palette instead, and the
   * region stays folded.
   */
  it('opens the command palette from the magnifier instead of the search region', async () => {
    // jsdom has no `CSS.escape`; the palette's list uses it to address a row by id.
    (globalThis as { CSS?: unknown }).CSS ??= { escape: (value: string) => value };
    const harness = await RouterTestingHarness.create('/dashboard');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const root = harness.fixture.nativeElement as HTMLElement;
    const bar = root.querySelector('[data-ui="top-navigation"]') as HTMLElement;
    const toggle = bar.querySelector('[data-part="search-toggle"]') as HTMLButtonElement;
    toggle.click();
    harness.fixture.detectChanges();
    expect(bar.hasAttribute('data-search-open')).toBe(false);
    const palette = harness.fixture.debugElement.query(
      (d) => d.componentInstance instanceof CommandPalette,
    ).componentInstance as CommandPalette;
    expect(palette.open()).toBe(true);
  });

  /**
   * The banner is a flex row with a gap. A host element left in it as an empty
   * box still takes a gap, which is what put 16px more air at the bar's end
   * than at its start.
   */
  it('leaves nothing but the bar in the banner row', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const root = harness.fixture.nativeElement as HTMLElement;
    const banner = root.querySelector(
      '[data-ui="app-shell"] > [data-part="banner"]',
    ) as HTMLElement;
    const boxes = [...banner.querySelectorAll(':scope > *, :scope > app-banner > *')].filter(
      (el) => getComputedStyle(el).display !== 'contents',
    );
    expect(boxes.map((el) => el.tagName.toLowerCase())).toEqual(['div']);
  });

  /**
   * Pending is not empty. The approvals panel shows placeholder rows and a
   * busy region while an answer is on its way, never the words for a queue
   * with nothing in it. The shell reads the queue once at startup — it is
   * where the banner's count comes from — so the wait is arranged here.
   */
  it('shows the approvals panel pending, not empty, while an answer is on its way', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const store = TestBed.inject(ApprovalsStore);
    await vi.waitFor(() => expect(store.loading()).toBe(false));

    store.items.set([]);
    const reading = store.load();
    const trigger = harness.fixture.nativeElement.querySelector(
      '[aria-label^="Approvals"]',
    ) as HTMLButtonElement;
    trigger.click();
    harness.fixture.detectChanges();

    const layer = document.querySelector('[data-ui="popover"]') as HTMLElement;
    expect(layer, 'the panel is open').not.toBeNull();
    expect(layer.querySelector('[data-ui="skeleton"][data-part="region"]')).not.toBeNull();
    expect(layer.textContent).not.toContain('Nothing waiting for you');

    await reading;
    harness.fixture.detectChanges();
    expect(layer.querySelector('[data-ui="skeleton"][data-part="region"]')).toBeNull();
    expect(layer.querySelectorAll('[data-ui="list-item"]').length).toBeGreaterThan(0);
  });
});
