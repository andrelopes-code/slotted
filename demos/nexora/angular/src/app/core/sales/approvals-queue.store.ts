import { computed, inject, Injectable, signal } from '@angular/core';
import type { ApprovalListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { ApprovalsStore } from '../activity/approvals.store';

export type QueueView = 'mine' | 'pending' | 'decided';

/** A refusal the queue has words for; a decided request is a conflict, not an error. */
export interface QueueFailure {
  id: string;
  code: string;
  message: string;
  kind: 'conflict' | 'transport' | 'permission' | 'state';
}

const WORDS: Record<string, string> = {
  APPROVAL_ALREADY_DECIDED:
    'Another approver decided this one a moment ago. The queue has been read again.',
  STALE_VERSION: 'This request changed while the queue was open; it has been read again.',
  FORBIDDEN: 'This step is not yours to decide.',
};

/**
 * The approvals a persona can act on (§67), read as a queue rather than as a
 * list of records: the rows are work, the first one is what to do now, and a
 * decision on a row removes it from the queue.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalsQueueStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  /** The banner's own count, which must agree with this screen. */
  private readonly banner = inject(ApprovalsStore);

  readonly view = signal<QueueView>('mine');
  readonly rows = signal<readonly ApprovalListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** The request whose decision is in flight, so its own controls wait on it. */
  readonly deciding = signal<string | null>(null);
  readonly failure = signal<QueueFailure | null>(null);

  readonly mineCount = computed(
    () => this.rows().filter((row) => row.actionable && row.status === 'pending').length,
  );

  private sequence = 0;
  /** The version each row was read at; an answer's own `metadata` moves under the queue. */
  private versions = new Map<string, number>();

  async open(): Promise<void> {
    if (this.rows().length === 0) await this.load();
  }

  setView(view: QueueView): Promise<void> {
    this.view.set(view);
    // A change of view is a different answer: the rows go before the request (AF-04).
    this.rows.set([]);
    return this.load();
  }

  async load(): Promise<void> {
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const view = this.view();
      const answer = await api.approvals.list({
        pageSize: 100,
        sort: view === 'decided' ? '-requestedAt' : 'requestedAt',
        ...(view === 'decided' ? {} : { filter: { status: 'pending' } }),
      });
      if (ticket !== this.sequence) return;
      const rows = view === 'mine' ? answer.data.filter((row) => row.actionable) : answer.data;
      this.versions = new Map(rows.map((row) => [row.id, row.metadata.version]));
      this.rows.set(rows);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : 'The queue could not be read');
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  reload(): Promise<void> {
    return this.load();
  }

  /** Decides one request and reads the queue back, with the banner's count. */
  async decide(
    row: ApprovalListItem,
    decision: 'approve' | 'reject' | 'changes',
    reason: string,
  ): Promise<boolean> {
    if (this.deciding() !== null) return false;
    this.deciding.set(row.id);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const version = this.versions.get(row.id) ?? row.metadata.version;
      await this.health.mutation(() => {
        if (decision === 'approve')
          return api.approvals.approve(row.id, { comment: reason }, { ifMatch: version });
        if (decision === 'reject')
          return api.approvals.reject(row.id, { reason }, { ifMatch: version });
        return api.approvals.requestChanges(row.id, { reason }, { ifMatch: version });
      });
      await Promise.all([this.load(), this.banner.load()]);
      return true;
    } catch (error) {
      const code = isApiError(error) ? error.code : 'UNKNOWN';
      this.failure.set({
        id: row.id,
        code,
        message: WORDS[code] ?? (isApiError(error) ? error.message : 'The decision was not saved.'),
        kind:
          code === 'APPROVAL_ALREADY_DECIDED' || code === 'STALE_VERSION'
            ? 'conflict'
            : code === 'SERVICE_UNAVAILABLE'
              ? 'transport'
              : code === 'FORBIDDEN'
                ? 'permission'
                : 'state',
      });
      // The queue is read again on a conflict: the row the reader saw is gone or decided.
      if (code === 'APPROVAL_ALREADY_DECIDED' || code === 'STALE_VERSION')
        await Promise.all([this.load(), this.banner.load()]);
      return false;
    } finally {
      this.deciding.set(null);
    }
  }
}
