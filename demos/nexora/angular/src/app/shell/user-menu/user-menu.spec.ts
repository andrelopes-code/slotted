import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { PreferencesStore } from '../../core/session/preferences.store';

describe('UserMenu', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('opens with the signed-in user and switches the scheme', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    const account = harness.fixture.nativeElement.querySelector(
      '[data-ui="top-navigation"] [data-part="account"]',
    ) as HTMLButtonElement;
    account.click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const doc = TestBed.inject(DOCUMENT);
    const menu = doc.querySelector('[data-ui="menu"]') as HTMLElement;
    expect(menu.textContent).toContain('Sofia Ramirez');
    expect(menu.textContent).toContain('Sales Manager');
    const dark = [...menu.querySelectorAll('[role="menuitemradio"]')].find((el) =>
      el.textContent?.includes('Dark'),
    ) as HTMLElement;
    dark.click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(TestBed.inject(PreferencesStore).preferences().scheme).toBe('dark');
    expect(doc.documentElement.getAttribute('data-slotted-scheme')).toBe('dark');
  });
});
