import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { SessionStore } from '../core/session/session.store';

/** The region is done when no route under /sales opens on the placeholder. */
describe('the Sales routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await signInAs('sofia-ramirez');
    await TestBed.inject(SessionStore).load();
  });

  const paths = ['/sales/quotes', '/sales/quotes/new', '/sales/orders', '/sales/approvals'];

  it('opens a screen of its own on every destination of the region', async () => {
    const harness = await RouterTestingHarness.create(paths[0]!);
    for (const path of paths) {
      await harness.navigateByUrl(path);
      harness.detectChanges();
      const text = harness.fixture.nativeElement.textContent as string;
      expect(text, path).not.toContain('is part of the');
      expect(text, path).not.toContain('is not built yet');
      expect(TestBed.inject(Router).url, path).toBe(path);
    }
  });

  it('keeps the record pages on their own url when the id is unknown', async () => {
    const harness = await RouterTestingHarness.create('/sales/orders/ord_does_not_exist');
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes('does not exist')) break;
    }
    expect(harness.fixture.nativeElement.textContent as string).toContain(
      'This order does not exist',
    );
    expect(TestBed.inject(Router).url).toBe('/sales/orders/ord_does_not_exist');
  });
});
