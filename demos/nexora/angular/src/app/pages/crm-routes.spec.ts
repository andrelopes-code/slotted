import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../test/testing';
import { routes } from '../app.routes';
import { SessionStore } from '../core/session/session.store';

/** The module is done when no route under /crm opens on the placeholder. */
describe('the CRM routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await signInAs('maya-chen');
    await TestBed.inject(SessionStore).load();
  });

  const paths = ['/crm/customers', '/crm/customers/new', '/crm/contacts', '/crm/imports'];

  it('opens a screen of its own on every destination of the module', async () => {
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

  it('answers a contact id with the not-found page: a contact is read on its account', async () => {
    const harness = await RouterTestingHarness.create('/crm/contacts/con_000001');
    harness.detectChanges();
    expect(harness.fixture.nativeElement.textContent as string).toContain('not found');
  });
});
