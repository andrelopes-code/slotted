import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { emptyQuery, type GridQuery } from '@slotted/core/grid';
import type { ListQuery, ListResponse, NexoraApi } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { LIST_PAGE_SIZE, toListQuery, type ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';
import {
  ticketQueues,
  type SupportMetrics,
  type TicketListItem,
  type TicketQueue,
} from './support.model';

/** A queue's tree, the most pressing resolution first. */
export function inboxQuery(queue: TicketQueue, size = LIST_PAGE_SIZE): GridQuery {
  return {
    ...emptyQuery({ index: 0, size }),
    filter: queue.value,
    sort: [{ column: 'resolutionDueAt', direction: 'ascending' }],
  };
}

/** The tickets (§14, §68), the inbox's queue. */
@Injectable({ providedIn: 'root' })
export class TicketsStore extends ListStore<TicketListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The tickets could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<TicketListItem>> {
    return api.support.tickets.list(query);
  }
}

/**
 * How many tickets each queue holds, and the figures of `GET /support/metrics`.
 * The queues' counts are the list's own totals for the queue's tree, so the
 * number beside a queue is the number of rows it opens on. The navigation's
 * Inbox count is the reader's own open tickets, for a reader who answers them.
 */
@Injectable({ providedIn: 'root' })
export class SupportQueuesStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);

  readonly counts = signal<Readonly<Record<string, number>> | null>(null);
  readonly metrics = signal<SupportMetrics | null>(null);
  readonly metricsFailed = signal(false);

  private sequence = 0;

  readonly queues = computed(() => ticketQueues(this.session.user()?.id ?? null));

  /** The reader's own open tickets, drawn on the navigation for a reader who answers them. */
  readonly mine = computed(() => {
    void this.session.session();
    if (!this.session.can('support.reply')) return null;
    return this.counts()?.['mine'] ?? null;
  });

  constructor() {
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant === key) return;
        tenant = key;
        this.counts.set(null);
        this.metrics.set(null);
        // The navigation draws the count for a reader who answers tickets; the inbox reads the rest when opened.
        if (this.session.can('support.reply')) void this.load();
      });
    });
  }

  async load(): Promise<void> {
    if (!this.session.can('support.view')) return;
    const ticket = ++this.sequence;
    const api = await this.backend.ready();
    const queues = this.queues();
    const [totals, metrics] = await Promise.all([
      Promise.all(
        queues.map((queue) =>
          this.health.read(
            () =>
              api.support.tickets
                .list(toListQuery(inboxQuery(queue)).query)
                .then((answer) => answer.page.totalItems),
            null,
          ),
        ),
      ),
      this.readMetrics(api),
    ]);
    if (ticket !== this.sequence) return;
    if (totals.every((total) => total !== null))
      this.counts.set(Object.fromEntries(queues.map((queue, index) => [queue.key, totals[index]!])));
    if (metrics !== undefined) this.metrics.set(metrics);
  }

  private async readMetrics(api: NexoraApi): Promise<SupportMetrics | undefined> {
    try {
      const metrics = await api.support.metrics();
      this.metricsFailed.set(false);
      return metrics;
    } catch (error) {
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.metricsFailed.set(true);
      return undefined;
    }
  }
}
