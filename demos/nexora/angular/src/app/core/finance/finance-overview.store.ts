import { computed, inject, Injectable, signal, type WritableSignal } from '@angular/core';
import type { InvoiceListItem, NexoraApi } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';
import type { FinanceOverview, PaymentListItem } from './finance.model';

/** A region of the overview: its answer, whether one is on its way, and whether the last one failed. */
export interface Region<T> {
  readonly value: T | null;
  readonly pending: boolean;
  readonly failed: boolean;
}

const idle = <T>(): Region<T> => ({ value: null, pending: false, failed: false });

/** The rows each listing region reads: its first page, and what the wait reserves (loading-states §2). */
export const OVERVIEW_ROWS = 8;

/**
 * Overdue from this share of receivables takes the warning tone, and from the
 * second the danger tone. §66 states no threshold for a book of receivables;
 * the product states these two and the page says them in words beside the
 * figures, so a tone is never a threshold the reader has to guess.
 */
export const OVERDUE_WARNING_SHARE = 0.2;
export const OVERDUE_DANGER_SHARE = 1 / 3;

export type OverdueTone = 'neutral' | 'warning' | 'danger';

/** The tone §66's overdue figure takes against the stated shares. */
export function overdueTone(overview: Pick<FinanceOverview, 'receivables' | 'overdueReceivables'>): OverdueTone {
  const share = overdueShare(overview);
  if (share === null) return 'neutral';
  return share >= OVERDUE_DANGER_SHARE ? 'danger' : share >= OVERDUE_WARNING_SHARE ? 'warning' : 'neutral';
}

/** Overdue as a share of receivables, or null where nothing is owed. */
export function overdueShare(overview: Pick<FinanceOverview, 'receivables' | 'overdueReceivables'>): number | null {
  return overview.receivables.minor <= 0 ? null : overview.overdueReceivables.minor / overview.receivables.minor;
}

/**
 * The finance overview (§13 "Finance dashboard metrics", §72.6–§72.7): one
 * summary answer from `GET /finance/overview`, the overdue invoices to act on
 * and the payments last received.
 *
 * The summary is the one read the degraded transport refuses a third of the
 * time (§77.10). A region that has never been answered shows its failure
 * with a way to ask again, never a zero; a region that has an answer keeps it
 * when a newer read fails (AF-02).
 */
@Injectable({ providedIn: 'root' })
export class FinanceOverviewStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);

  readonly overview = signal<Region<FinanceOverview>>(idle());
  readonly overdue = signal<Region<{ rows: readonly InvoiceListItem[]; total: number }>>(idle());
  readonly recent = signal<Region<readonly PaymentListItem[]>>(idle());

  readonly today = computed(() => this.session.session()?.demo.today ?? '');

  private ticket = 0;

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  async open(): Promise<void> {
    const ticket = ++this.ticket;
    const api = await this.backend.ready();
    if (ticket !== this.ticket) return;
    await Promise.all([
      this.region(this.overview, ticket, () => api.finance.overview()),
      this.can('invoices.view')
        ? this.region(this.overdue, ticket, () => this.readOverdue(api))
        : Promise.resolve(),
      this.can('payments.view')
        ? this.region(this.recent, ticket, () => this.readRecent(api))
        : Promise.resolve(),
    ]);
  }

  /** The summary alone, asked for again after its read failed. */
  async retry(): Promise<void> {
    const ticket = this.ticket;
    const api = await this.backend.ready();
    const reads: Promise<void>[] = [];
    if (this.overview().failed) reads.push(this.region(this.overview, ticket, () => api.finance.overview()));
    if (this.overdue().failed) reads.push(this.region(this.overdue, ticket, () => this.readOverdue(api)));
    if (this.recent().failed) reads.push(this.region(this.recent, ticket, () => this.readRecent(api)));
    await Promise.all(reads);
  }

  /** A tenant read again — another persona, scenario or day — starts every region from nothing. */
  forget(): void {
    this.ticket++;
    this.overview.set(idle());
    this.overdue.set(idle());
    this.recent.set(idle());
  }

  /** A region keeps what it shows while a newer answer is on its way (AF-02). */
  private async region<T>(
    target: WritableSignal<Region<T>>,
    ticket: number,
    read: () => Promise<T>,
  ): Promise<void> {
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

  /** The overdue invoices longest past due first: what a collector calls about today. */
  private async readOverdue(api: NexoraApi) {
    const answer = await api.finance.invoices.list({
      pageSize: 25,
      sort: '-daysOverdue,-outstanding',
      filter: { collectionState: { in: ['overdue'] } },
    });
    return { rows: answer.data.slice(0, OVERVIEW_ROWS), total: answer.page.totalItems };
  }

  /** The payments last received, whatever their state: the history, read last (OV-02). */
  private async readRecent(api: NexoraApi): Promise<readonly PaymentListItem[]> {
    const answer = await api.finance.payments.list({ pageSize: 25, sort: '-receivedDate' });
    return answer.data.slice(0, OVERVIEW_ROWS);
  }
}
