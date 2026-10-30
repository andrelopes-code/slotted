import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { SessionStore } from '../../core/session/session.store';
import { CommandPalette } from './command-palette';

describe('CommandPalette', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  it('offers Go to for visible modules and demo commands, and groups search hits', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    const palette = harness.fixture.debugElement.query(
      (d) => d.componentInstance instanceof CommandPalette,
    ).componentInstance as CommandPalette;
    const labels = palette.items().map((i) => i.label);
    expect(labels).toContain('Go to Sales');
    expect(labels).not.toContain('Go to Finance › Overview');
    expect(labels).toContain('Switch persona…');
    palette.query.set('meridian');
    harness.fixture.detectChanges();
    for (let i = 0; i < 40 && palette.hits().length === 0; i++) await new Promise((r) => setTimeout(r, 50));
    const hits = palette.items().filter((i) => i.kind === 'hit');
    expect(hits.map((h) => h.group)).toContain('customer');
    expect(hits.some((h) => h.label.includes('Meridian'))).toBe(true);
  });
});
