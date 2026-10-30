import { ApplicationInitStatus, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { PermissionGate } from './permission-gate';

@Component({ selector: 'app-probe', template: '<p>finance overview</p>' })
class Probe {}

describe('PermissionGate', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestBackend(),
        provideRouter([
          {
            path: 'finance',
            component: PermissionGate,
            data: { permissions: ['finance.dashboard'], page: Probe, title: 'Finance' },
          },
        ]),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  it('renders ForbiddenPage for Sofia, who lacks finance.dashboard', async () => {
    const harness = await RouterTestingHarness.create('/finance');
    expect(harness.routeNativeElement?.textContent).toContain('finance.dashboard');
    expect(harness.routeNativeElement?.textContent).not.toContain('finance overview');
  });

  it('renders the page for Priya', async () => {
    await signInAs('priya-shah');
    await TestBed.inject(SessionStore).reload();
    const harness = await RouterTestingHarness.create('/finance');
    expect(harness.routeNativeElement?.textContent).toContain('finance overview');
  });
});
