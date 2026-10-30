import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { ApprovalsStore } from '../activity/approvals.store';
import { SessionStore } from '../session/session.store';
import { ApprovalsQueueStore } from './approvals-queue.store';

describe('ApprovalsQueueStore', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    // A Sales Manager is who the seeded sales approvals wait on.
    await signInAs('sofia-ramirez');
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(ApprovalsQueueStore);
    store.rows.set([]);
    store.view.set('mine');
  });

  it('holds only what this persona can decide, oldest first', async () => {
    const store = TestBed.inject(ApprovalsQueueStore);
    const reading = store.load();
    expect(store.loading()).toBe(true);
    await reading;

    expect(store.rows().length).toBeGreaterThan(0);
    expect(store.rows().every((row) => row.actionable && row.status === 'pending')).toBe(true);
    const dates = store.rows().map((row) => row.requestedAt);
    expect([...dates].sort()).toEqual(dates);
  });

  it('empties the rows when the reader asks for another queue', async () => {
    const store = TestBed.inject(ApprovalsQueueStore);
    await store.load();

    const turning = store.setView('decided');
    expect(store.rows()).toEqual([]);
    await turning;

    expect(store.view()).toBe('decided');
  });

  it('decides a request, takes it out of the queue and keeps the banner in step', async () => {
    const store = TestBed.inject(ApprovalsQueueStore);
    const banner = TestBed.inject(ApprovalsStore);
    await Promise.all([store.load(), banner.load()]);
    const before = store.rows().length;
    const row = store.rows()[0]!;

    const deciding = store.decide(row, 'approve', 'Within the discount policy for this account.');
    expect(store.deciding()).toBe(row.id);
    expect(await deciding).toBe(true);

    expect(store.rows().some((candidate) => candidate.id === row.id)).toBe(false);
    expect(store.rows().length).toBe(before - 1);
    // The count the shell draws is the count this screen draws.
    expect(banner.pending()).toBe(store.rows().length);
  });

  it('answers a request decided elsewhere by reading the queue again', async () => {
    const store = TestBed.inject(ApprovalsQueueStore);
    await store.load();
    const row = store.rows()[0]!;

    // Another approver, between the queue's read and this decision.
    await api.approvals.approve(row.id, {}, { ifMatch: row.metadata.version });

    expect(await store.decide(row, 'approve', '')).toBe(false);
    expect(store.failure()?.kind).toBe('conflict');
    expect(store.failure()?.message).toContain('decided this one a moment ago');
    expect(store.rows().some((candidate) => candidate.id === row.id)).toBe(false);
  });

  it('is empty, and says why, for a persona no step names', async () => {
    await signInAs('maya-chen');
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(ApprovalsQueueStore);
    store.rows.set([]);

    await store.load();

    expect(store.rows()).toEqual([]);
    expect(store.error()).toBeNull();
  });
});
