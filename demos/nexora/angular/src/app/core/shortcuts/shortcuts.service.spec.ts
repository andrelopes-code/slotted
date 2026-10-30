import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { routes } from '../../app.routes';
import { ShortcutsService } from './shortcuts.service';

const press = (doc: Document, key: string, init: KeyboardEventInit = {}) =>
  doc.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));

describe('ShortcutsService', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('navigates with g then s, ignores modules the user cannot see, opens the dialog on ?', async () => {
    await RouterTestingHarness.create('/dashboard');
    const doc = TestBed.inject(DOCUMENT);
    const router = TestBed.inject(Router);
    press(doc, 'g');
    press(doc, 's');
    for (let i = 0; i < 40 && !router.url.startsWith('/sales'); i++) await new Promise((r) => setTimeout(r, 50));
    expect(router.url.startsWith('/sales')).toBe(true);
    await signInAs('jordan-wells');
    await TestBed.inject(SessionStore).reload();
    press(doc, 'g');
    press(doc, 'f');
    await new Promise((r) => setTimeout(r, 200));
    expect(router.url.startsWith('/finance')).toBe(false);
    press(doc, '?', { shiftKey: true });
    expect(TestBed.inject(ShortcutsService).dialogOpen()).toBe(true);
  });
});
