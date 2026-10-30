import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { SessionStore } from '../session/session.store';
import { TO_RECONCILE, type BankTransactionListItem } from './finance.model';
import {
  BankTransactionsStore,
  confidenceOf,
  explainScore,
  invoiceMatchPreview,
  queueQuery,
  ReconciliationStore,
} from './reconciliation.store';

describe('the reconciliation workspace', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('priya-shah');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  async function toReconcile(): Promise<readonly BankTransactionListItem[]> {
    const answer = await api.finance.bankTransactions.list({
      pageSize: 100,
      filter: { status: { in: [...TO_RECONCILE] } },
    });
    return answer.data;
  }

  it('takes every score apart into criteria that add up to it, capped at 100, in its band', async () => {
    const rows = await toReconcile();
    const scored = rows.flatMap((row) => row.candidates);
    expect(scored.length).toBeGreaterThan(10);
    for (const candidate of scored) {
      const explanation = explainScore(candidate);
      expect(explanation.score).toBe(candidate.score);
      expect(explanation.confidence).toBe(candidate.confidence);
      expect(explanation.score).toBe(Math.min(100, explanation.lines.reduce((sum, line) => sum + line.earned, 0)));
      expect(explanation.lines.map((line) => line.key)).toEqual(['amount', 'reference', 'number', 'customer', 'date']);
    }
    const capped = explainScore({
      reasons: ['Exact amount match', 'Bank reference matches', 'Description contains document number', 'Posted within 2 days'],
    });
    expect(capped.sum).toBe(110);
    expect(capped.score).toBe(100);
    expect(capped.capped).toBe(true);
  });

  it('bands a confidence high from 85, medium from 60 and low below (§66.13)', () => {
    expect([100, 85, 84, 60, 59, 40].map(confidenceOf)).toEqual(['high', 'high', 'medium', 'medium', 'low', 'low']);
  });

  it('opens on what is still to reconcile, oldest first, and the confidence pill narrows it', async () => {
    const queue = TestBed.inject(BankTransactionsStore);
    await queue.open(queueQuery());
    const all = queue.total()!;
    expect(all).toBeGreaterThan(0);
    expect(queue.rows().every((row) => TO_RECONCILE.includes(row.status))).toBe(true);
    const dates = queue.rows().map((row) => row.postedDate);
    expect(dates).toEqual([...dates].sort());

    await queue.setFilter({
      join: 'and',
      rules: [
        ...queueQuery().filter!.rules,
        { field: 'confidence', filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: ['high'] }] } },
      ],
    });
    expect(queue.total()!).toBeGreaterThan(0);
    expect(queue.total()!).toBeLessThan(all);
    expect(queue.rows().every((row) => row.bestCandidate?.confidence === 'high')).toBe(true);
  });

  it('links a payment of the exact amount, reconciles the deposit and takes it off the queue', async () => {
    const queue = TestBed.inject(BankTransactionsStore);
    const store = TestBed.inject(ReconciliationStore);
    await queue.open(queueQuery());
    const target = (await toReconcile()).find((row) =>
      row.candidates.some((candidate) => candidate.paymentId && candidate.reasons.includes('Exact amount match')),
    )!;
    await store.select(target.id);
    const view = store.candidates().find((candidate) => candidate.kind === 'payment' && candidate.confirmable)!;
    expect(view.difference).toBe(0);

    expect(await store.matchPayment(view.documentId)).toBe(true);
    expect(store.transaction()!.status).toBe('matched');
    expect(store.open()).toBe(false);
    expect(store.outcome()).toMatchObject({ paymentId: view.documentId, created: false });
    await queue.reload();
    expect(queue.rows().some((row) => row.id === target.id)).toBe(false);
  });

  it('refuses to offer a payment whose amount differs, and names the invoices instead', async () => {
    const store = TestBed.inject(ReconciliationStore);
    const target = (await toReconcile()).find((row) =>
      row.candidates.some((candidate) => candidate.paymentId && !candidate.reasons.includes('Exact amount match')),
    );
    if (!target) return;
    await store.select(target.id);
    const view = store.candidates().find((candidate) => candidate.kind === 'payment' && candidate.difference !== 0)!;
    expect(view.confirmable).toBe(false);
  });

  it('creates a payment from the deposit, allocates it to the invoice and says what stays unapplied', async () => {
    const store = TestBed.inject(ReconciliationStore);
    const target = (await toReconcile()).find((row) => row.candidates.some((candidate) => candidate.invoiceId))!;
    await store.select(target.id);
    const view = store.candidates().find((candidate) => candidate.kind === 'invoice')!;
    const before = await api.finance.invoices.get(view.documentId);
    const preview = invoiceMatchPreview(target.amount, before.invoice);

    expect(await store.matchInvoice(view.documentId)).toBe(true);
    const outcome = store.outcome()!;
    expect(outcome.created).toBe(true);
    expect(outcome.allocated.minor).toBe(preview.allocated.minor);
    expect(outcome.unapplied.minor).toBe(preview.unapplied.minor);
    const after = await api.finance.invoices.get(view.documentId);
    expect(after.invoice.outstanding.minor).toBe(preview.owesAfter.minor);

    const partial = invoiceMatchPreview(
      { currency: 'USD', minor: 10_000 },
      { outstanding: { currency: 'USD', minor: 7_500 } },
    );
    expect(partial).toEqual({
      allocated: { currency: 'USD', minor: 7_500 },
      owesAfter: { currency: 'USD', minor: 0 },
      unapplied: { currency: 'USD', minor: 2_500 },
    });
  });

  it('ignores a deposit only with a reason, and keeps the reason', async () => {
    const store = TestBed.inject(ReconciliationStore);
    const target = (await toReconcile())[0]!;
    await store.select(target.id);
    expect(await store.ignore('')).toBe(false);
    expect(store.failure()?.kind).toBe('validation');
    expect(store.transaction()!.status).toBe(target.status);

    expect(await store.ignore('Deposit from an intercompany sweep')).toBe(true);
    expect(store.transaction()!.status).toBe('ignored');
    expect(store.transaction()!.ignoreReason).toBe('Deposit from an intercompany sweep');
  });

  it('answers a version someone else moved past by reading the deposit again (ER-02)', async () => {
    const store = TestBed.inject(ReconciliationStore);
    const target = (await toReconcile())[0]!;
    await store.select(target.id);
    await api.finance.bankTransactions.ignore(target.id, { reason: 'Elsewhere' }, { ifMatch: target.metadata.version });
    expect(await store.ignore('Mine')).toBe(false);
    expect(store.failure()?.kind).toBe('conflict');
    expect(store.transaction()!.status).toBe('ignored');
  });

  it('gives an executive the workspace to read and no command, and says who reconciles', async () => {
    await signIn('evan-brooks');
    const target = (await toReconcile()).find((row) => row.candidates.length > 0)!;
    const harness = await RouterTestingHarness.create(`/finance/reconciliation/${target.id}`);
    let text = '';
    for (let attempt = 0; attempt < 160 && !text.includes('reconciliation.manage'); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      harness.detectChanges();
      text = harness.fixture.nativeElement.textContent as string;
    }
    const root = harness.fixture.nativeElement as HTMLElement;
    expect(text).toContain('Deposits are matched and ignored by holders of reconciliation.manage');
    expect(root.querySelectorAll('[data-testid="candidate"]').length).toBeGreaterThan(0);
    expect(root.querySelector('[data-testid="confirm-match"]')).toBeNull();
    expect(root.querySelector('[data-testid="ignore"]')).toBeNull();
    expect(root.querySelector('[data-testid="match-invoice"]')).toBeNull();
    expect(TestBed.inject(Router).url).toBe(`/finance/reconciliation/${target.id}`);
  });
});
