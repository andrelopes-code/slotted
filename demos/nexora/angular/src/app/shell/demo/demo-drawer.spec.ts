import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { SessionStore } from '../../core/session/session.store';
import { DemoDrawer } from './demo-drawer';

describe('DemoDrawer', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('switches persona from the list and reloads the session', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    const drawer = harness.fixture.debugElement.query(
      (d) => d.componentInstance instanceof DemoDrawer,
    ).componentInstance as DemoDrawer;
    drawer.openAt('persona');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 100));
    harness.fixture.detectChanges();
    const doc = TestBed.inject(DOCUMENT);
    const noah = [...doc.querySelectorAll('[data-ui="drawer"] button')].find((b) =>
      b.textContent?.includes('Noah Bennett'),
    ) as HTMLButtonElement;
    expect(noah).toBeDefined();
    noah.click();
    const session = TestBed.inject(SessionStore);
    for (let i = 0; i < 60 && session.user()?.displayName !== 'Noah Bennett'; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(session.user()?.displayName).toBe('Noah Bennett');
  });
});
