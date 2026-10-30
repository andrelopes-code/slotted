import { inject, Injectable, signal, type WritableSignal } from '@angular/core';
import type { NexoraApi, ReportAnswer, ReportKey, ReportQuery, SupportMetrics } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import type { Region } from '../finance/finance-overview.store';
import type { FinanceOverview } from '../finance/finance.model';
import { SessionStore } from '../session/session.store';

const idle = <T>(): Region<T> => ({ value: null, pending: false, failed: false });

/**
 * One report's reads (§16): the report over its period, and beside it the
 * state of today as the operational screen reads it — the finance overview's
 * `GET /finance/overview`, the inbox's `GET /support/metrics` — so a figure
 * both screens show is one read and one number. Each is a region of its own:
 * one that fails leaves the other on screen (§33 "partial data", §77.10).
 *
 * A read after the first keeps the answer on screen and marks it pending
 * (AF-02, AF-07); a failed read keeps it too and says it failed.
 */
@Injectable()
export class ReportStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);

  readonly answer = signal<Region<ReportAnswer>>(idle());
  readonly finance = signal<Region<FinanceOverview>>(idle());
  readonly support = signal<Region<SupportMetrics>>(idle());

  private ticket = 0;
  private last: { key: ReportKey; query: ReportQuery; today: 'finance' | 'support' | null } | null = null;

  /** Reads the report for a period and its filters, and the state of today where the report has one. */
  async read(key: ReportKey, query: ReportQuery, today: 'finance' | 'support' | null): Promise<void> {
    const ticket = ++this.ticket;
    this.last = { key, query, today };
    // Busy from the request on, in the same frame as the change that asked for it (AF-02).
    this.answer.update((region) => ({ ...region, pending: true, failed: false }));
    const api = await this.backend.ready();
    if (ticket !== this.ticket) return;
    await Promise.all([
      this.region(this.answer, ticket, () => (api.analytics[key] as (q: ReportQuery) => Promise<ReportAnswer>)(query)),
      today === 'finance' && this.session.can('finance.dashboard')
        ? this.region(this.finance, ticket, () => api.finance.overview())
        : Promise.resolve(),
      today === 'support' && this.session.can('support.view')
        ? this.region(this.support, ticket, () => api.support.metrics())
        : Promise.resolve(),
    ]);
  }

  /** The same reads again: the values stay and the page is busy until the answers (AF-07). */
  refresh(): Promise<void> {
    if (this.last === null) return Promise.resolve();
    return this.read(this.last.key, this.last.query, this.last.today);
  }

  /** Only the regions whose last read failed, asked again. */
  async retry(): Promise<void> {
    if (this.last === null) return;
    const { key, query, today } = this.last;
    const ticket = this.ticket;
    const api: NexoraApi = await this.backend.ready();
    const reads: Promise<void>[] = [];
    if (this.answer().failed)
      reads.push(this.region(this.answer, ticket, () => (api.analytics[key] as (q: ReportQuery) => Promise<ReportAnswer>)(query)));
    if (today === 'finance' && this.finance().failed)
      reads.push(this.region(this.finance, ticket, () => api.finance.overview()));
    if (today === 'support' && this.support().failed)
      reads.push(this.region(this.support, ticket, () => api.support.metrics()));
    await Promise.all(reads);
  }

  /** Another persona, scenario or day: nothing read before applies. */
  forget(): void {
    this.ticket++;
    this.answer.set(idle());
    this.finance.set(idle());
    this.support.set(idle());
  }

  private async region<T>(target: WritableSignal<Region<T>>, ticket: number, read: () => Promise<T>): Promise<void> {
    target.update((region) => ({ ...region, pending: true, failed: false }));
    try {
      const value = await read();
      if (ticket !== this.ticket) return;
      target.set({ value, pending: false, failed: false });
    } catch (error) {
      if (ticket !== this.ticket) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      target.update((region) => ({ ...region, pending: false, failed: true }));
    }
  }
}
