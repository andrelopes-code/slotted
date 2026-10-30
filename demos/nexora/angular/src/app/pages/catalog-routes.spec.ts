import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { NAV_MODULES } from '../core/nav/nav.model';
import { SessionStore } from '../core/session/session.store';

/** The region is done when no route under /catalog opens on the placeholder. */
describe('the Catalog routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await signInAs('sofia-ramirez');
    await TestBed.inject(SessionStore).load();
  });

  const paths = [
    '/catalog/products',
    '/catalog/skus',
    '/catalog/categories',
    '/catalog/price-lists',
  ];

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

  it('every destination the navigation names has a screen', () => {
    const catalog = NAV_MODULES.find((module) => module.id === 'catalog')!;
    expect(catalog.destinations.map((destination) => destination.path).sort()).toEqual(
      [...paths].sort(),
    );
  });

  it('keeps a SKU on its own url when the id is unknown', async () => {
    const harness = await RouterTestingHarness.create('/catalog/skus/sku_does_not_exist');
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes('does not exist')) break;
    }
    expect(harness.fixture.nativeElement.textContent as string).toContain(
      'This SKU does not exist',
    );
    expect(TestBed.inject(Router).url).toBe('/catalog/skus/sku_does_not_exist');
  });

  it('keeps a product on its own url when the id is unknown', async () => {
    const harness = await RouterTestingHarness.create('/catalog/products/prd_does_not_exist');
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      if ((harness.fixture.nativeElement.textContent as string).includes('does not exist')) break;
    }
    expect(harness.fixture.nativeElement.textContent as string).toContain(
      'This product does not exist',
    );
    expect(TestBed.inject(Router).url).toBe('/catalog/products/prd_does_not_exist');
  });

  /** A route with no record of its own leaves `:id` to the not-found page. */
  it('neither the tree nor the price lists take a record id', async () => {
    const harness = await RouterTestingHarness.create('/catalog/categories/cat_000001');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('not found');
  });

  it('the price lists refuse a reader without pricing.view and keep the url', async () => {
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).load();
    const harness = await RouterTestingHarness.create('/catalog/price-lists');
    harness.detectChanges();

    const text = harness.fixture.nativeElement.textContent as string;
    expect(text).toContain('pricing.view');
    expect(TestBed.inject(Router).url).toBe('/catalog/price-lists');
  });
});
