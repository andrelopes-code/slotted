import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { PreferencesStore } from '../core/session/preferences.store';
import { SessionStore } from '../core/session/session.store';

async function persona(key: string): Promise<void> {
  await signInAs(key);
  await TestBed.inject(SessionStore).reload();
}

describe('ShellLayout', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('shows Sofia the Sales module and hides Finance reconciliation', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain('Sales');
    expect(text).toContain('Approvals');
    expect(text).not.toContain('Reconciliation');
  });

  it('shows Jordan only what a warehouse operator can view', async () => {
    await persona('jordan-wells');
    const harness = await RouterTestingHarness.create('/dashboard');
    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain('Inventory');
    expect(text).not.toContain('Finance');
    expect(text).not.toContain('Settings');
  });

  /**
   * The shell draws the arrangement the reader chose. `inset` is what the
   * preference starts at, so a reader who has chosen nothing sees the shell the
   * demo has always drawn.
   */
  it('draws the arrangement the reader chose in their preferences', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    const shell = () =>
      harness.fixture.nativeElement.querySelector('[data-ui="app-shell"]') as HTMLElement;
    expect(shell().getAttribute('data-canvas')).toBe('inset');
    expect(shell().getAttribute('data-primary')).toBe('banner');
    expect(shell().getAttribute('data-separation')).toBe('rule');

    TestBed.inject(PreferencesStore).update({ shell: 'tones' });
    harness.fixture.detectChanges();

    expect(shell().getAttribute('data-canvas')).toBe('flush');
    expect(shell().getAttribute('data-primary')).toBe('main');
    expect(shell().getAttribute('data-separation')).toBe('tone');
  });

  /** A dark region is the scheme on the region, and its ground restated there. */
  it('paints the column dark when the arrangement says so', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    TestBed.inject(PreferencesStore).update({ shell: 'dark-column' });
    harness.fixture.detectChanges();

    const nav = harness.fixture.nativeElement.querySelector('[data-part="nav"]') as HTMLElement;
    expect(nav.getAttribute('data-slotted-scheme')).toBe('dark');
  });

  /**
   * The two-level arrangement puts the modules in a strip of the rail's own and
   * the destinations of one module in the column. The module shown follows the
   * route, and pressing another shows its destinations.
   */
  it('shows the modules in a strip and one module in the column', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    TestBed.inject(PreferencesStore).update({ shell: 'two-level' });
    harness.fixture.detectChanges();
    const root = harness.fixture.nativeElement as HTMLElement;

    const rail = root.querySelector('[data-part="nav-rail"]') as HTMLElement;
    expect(rail).not.toBeNull();
    const sales = rail.querySelector('button[aria-label="Sales"]') as HTMLButtonElement;
    expect(sales).not.toBeNull();
    expect(root.querySelectorAll('nav').length).toBeGreaterThanOrEqual(1);

    sales.click();
    harness.fixture.detectChanges();
    expect(sales.getAttribute('aria-current')).toBe('true');
    const column = root.querySelector('[data-part="nav-body"]') as HTMLElement;
    expect(column.textContent).toContain('Quotes');
  });

  /**
   * A persona switch reloads the session. The column and the page are already painted, so
   * they stay, and say they are busy until the new session arrives (loading-states §1).
   */
  it('keeps the destinations and the page on screen while the session reloads', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    const root = harness.fixture.nativeElement as HTMLElement;
    const reload = TestBed.inject(SessionStore).reload();
    harness.fixture.detectChanges();

    const nav = root.querySelector('[data-ui="side-navigation"]');
    expect(nav?.getAttribute('aria-busy')).toBe('true');
    expect(nav?.textContent).toContain('Sales');
    expect(root.querySelector('[data-ui="skeleton"]')).toBeNull();
    expect(root.querySelector('main')?.getAttribute('aria-busy')).toBe('true');

    await reload;
    harness.fixture.detectChanges();
    expect(root.querySelector('[data-ui="side-navigation"]')?.hasAttribute('aria-busy')).toBe(
      false,
    );
    expect(root.querySelector('main')?.hasAttribute('aria-busy')).toBe(false);
  });

  it('marks the current destination from the url', async () => {
    const harness = await RouterTestingHarness.create('/sales/orders');
    const current = harness.fixture.nativeElement.querySelector(
      '[data-ui="side-navigation"] [aria-current="page"]',
    ) as HTMLElement | null;
    expect(current?.textContent).toContain('Orders');
  });
});
