import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { NotificationsStore } from '../../core/activity/notifications.store';

describe('NotificationsPopover', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTestBackend(), provideRouter(routes)],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('lists notifications and marks one read from the row action', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const store = TestBed.inject(NotificationsStore);
    await store.refreshCount();
    const before = store.unread();
    const bell = harness.fixture.nativeElement.querySelector(
      '[data-ui="top-navigation"] [data-part="notifications"]',
    ) as HTMLButtonElement;
    bell.click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 50));
    harness.fixture.detectChanges();
    const doc = TestBed.inject(DOCUMENT);
    const popover = doc.querySelector('[data-ui="popover"]') as HTMLElement;
    expect(popover.textContent).toContain('Notifications');
    const markRead = popover.querySelector('button[aria-label^="Mark as read"]') as HTMLButtonElement;
    markRead.click();
    await harness.fixture.whenStable();
    await new Promise((r) => setTimeout(r, 50));
    expect(store.unread()).toBe(before - 1);
  });
});
