import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { NotificationsStore } from './notifications.store';

describe('NotificationsStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  it('counts unread and updates after markRead', async () => {
    const store = TestBed.inject(NotificationsStore);
    await store.refreshCount();
    const before = store.unread();
    expect(before).toBeGreaterThan(0);
    await store.loadPage();
    const unread = store.items().find((n) => n.readAt === undefined)!;
    await store.markRead(unread.id);
    expect(store.unread()).toBe(before - 1);
  });

  /**
   * The control that started a mutation waits on it: the row's id is in
   * `busy` from the request until the list has been read back, and gone after.
   */
  it('marks a row busy while its mutation is in flight', async () => {
    const store = TestBed.inject(NotificationsStore);
    await store.loadPage();
    const unread = store.items().find((n) => n.readAt === undefined)!;
    const request = store.markRead(unread.id);
    expect(store.busy().has(unread.id)).toBe(true);
    await request;
    expect(store.busy().has(unread.id)).toBe(false);
    expect(store.busy().size).toBe(0);
  });

  it('marks the whole list busy while marking all as read', async () => {
    const store = TestBed.inject(NotificationsStore);
    await store.loadPage();
    const request = store.markAllRead();
    expect(store.busyAll()).toBe(true);
    await request;
    expect(store.busyAll()).toBe(false);
    expect(store.unread()).toBe(0);
  });
});
