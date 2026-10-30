import { computed, inject, Injectable, signal } from '@angular/core';
import type { FilterGroup } from '@slotted/core/filter';
import {
  emptyQuery,
  sameQuery,
  withFilter,
  withSearch,
  type GridQuery,
} from '@slotted/core/grid';
import type { QuoteDetail, QuoteListItem, NexoraApi } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { LIST_PAGE_SIZE, toListQuery, type ScaleMap } from '../backend/list-query';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';

const SCALE: ScaleMap = { grossMarginBps: 100, total: 100 };

export const QUOTES_ROUTE = '/sales/quotes';

/** What a control on a quote may be waiting on. */
export type QuoteBusy = 'submit' | 'send' | 'accept' | 'reject' | 'cancel' | 'convert';

export interface QuoteFailure {
  code: string;
  message: string;
  kind: 'conflict' | 'transport' | 'permission' | 'state';
}

const WORDS: Record<string, string> = {
  QUOTE_EXPIRED: 'This quote expired, so the customer cannot accept it as it stands.',
  QUOTE_ALREADY_CONVERTED: 'This quote already became an order while the page was open.',
  QUOTE_EMPTY: 'A quote needs at least one line before it goes anywhere.',
  STALE_VERSION: 'Someone else wrote to this quote while the page was open.',
};

const CONFLICTS = new Set(['STALE_VERSION', 'QUOTE_ALREADY_CONVERTED']);

/** A quote still in play: written, waiting, sent, read or accepted. */
const OPEN_QUOTES: FilterGroup = {
  join: 'and',
  rules: [
    {
      field: 'status',
      filter: {
        kind: 'set',
        join: 'or',
        conditions: [
          {
            operator: 'anyOf',
            value: ['draft', 'pending_approval', 'approved', 'sent', 'viewed', 'accepted'],
          },
        ],
      },
    },
  ],
};

/** The query the list opens on: the quotes still in play, on the first page. */
export const OPEN_QUOTES_QUERY: GridQuery = withFilter(
  emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
  OPEN_QUOTES,
).query;

/**
 * The quotes of the tenant and the one the reader opened. A quote is the
 * order's first draft (§58): the list says which ones are close to expiring,
 * and the record carries the commands that move it towards an order.
 */
@Injectable({ providedIn: 'root' })
export class QuotesStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);

  // ── The list ─────────────────────────────────────────────────────────
  readonly query = signal<GridQuery>(emptyQuery({ index: 0, size: LIST_PAGE_SIZE }));
  readonly rows = signal<readonly QuoteListItem[]>([]);
  readonly total = signal<number | null>(null);
  readonly grandTotal = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly flattened = signal(false);

  // ── The record ───────────────────────────────────────────────────────
  readonly id = signal<string | null>(null);
  readonly detail = signal<QuoteDetail | null>(null);
  readonly recordLoading = signal(false);
  readonly recordError = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<QuoteBusy | null>(null);
  readonly failure = signal<QuoteFailure | null>(null);

  readonly quote = computed(() => this.detail()?.quote ?? null);
  readonly filter = computed(() => this.query().filter);
  readonly search = computed(() => this.query().search);
  readonly page = computed(() => {
    const page = this.query().page;
    return page && 'index' in page ? page : { index: 0, size: LIST_PAGE_SIZE };
  });

  private sequence = 0;
  private recordSequence = 0;
  /** The version the record page read, held as a number (§53.11); see the order store. */
  private version = 0;
  private opened = false;

  /**
   * The list opens on the quotes that are still alive. It is a filter the bar
   * draws as a pill and the count explains — "218 of 895 quotes" — rather than
   * a hidden rule: a reader who wants the closed ones clears it. A reader's
   * saved view, when the visit opens on one, is the first query instead.
   */
  async open(initial: GridQuery | null = null): Promise<void> {
    if (!this.opened && this.total() === null) {
      this.opened = true;
      this.query.set(initial ?? withFilter(this.query(), OPEN_QUOTES).query);
    }
    await Promise.all([this.load(), this.loadGrandTotal()]);
  }

  async load(query: GridQuery = this.query(), options: { keepRows?: boolean } = {}): Promise<void> {
    const replace = !options.keepRows && !sameQuery(query, this.query());
    this.query.set(query);
    if (replace || (!options.keepRows && this.total() === null)) this.rows.set([]);
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    const request = toListQuery(query, SCALE);
    this.flattened.set(request.flattened);
    try {
      const api = await this.backend.ready();
      const answer = await api.quotes.list(request.query);
      if (ticket !== this.sequence) return;
      this.rows.set(answer.data);
      this.total.set(answer.page.totalItems);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : 'The quotes could not be loaded');
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  async loadGrandTotal(): Promise<void> {
    if (this.grandTotal() !== null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(() => api.quotes.list({ page: 1, pageSize: 25 }), null);
    if (answer) this.grandTotal.set(answer.page.totalItems);
  }

  reload(): Promise<void> {
    return this.load(this.query(), { keepRows: true });
  }

  setFilter(filter: FilterGroup | null): Promise<void> {
    return this.load(withFilter(this.query(), filter).query);
  }

  setSearch(search: string): Promise<void> {
    return this.load(withSearch(this.query(), search).query);
  }

  routeFor(id: string): string {
    return `${QUOTES_ROUTE}/${id}`;
  }

  // ── The record ───────────────────────────────────────────────────────

  async openRecord(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.recordError.set(null);
      this.failure.set(null);
    }
    await this.loadRecord();
  }

  async loadRecord(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.recordSequence;
    this.recordLoading.set(true);
    this.recordError.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.quotes.get(id);
      if (ticket !== this.recordSequence) return;
      this.detail.set(detail);
      this.version = detail.quote.metadata.version;
    } catch (error) {
      if (ticket !== this.recordSequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.recordError.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The quote could not be loaded' },
      );
    } finally {
      if (ticket === this.recordSequence) this.recordLoading.set(false);
    }
  }

  submit(): Promise<boolean> {
    return this.run('submit', (api, id, version) => api.quotes.submit(id, { ifMatch: version }));
  }

  send(): Promise<boolean> {
    return this.run('send', (api, id, version) => api.quotes.send(id, { ifMatch: version }));
  }

  accept(): Promise<boolean> {
    return this.run('accept', (api, id, version) => api.quotes.accept(id, { ifMatch: version }));
  }

  reject(reason: string): Promise<boolean> {
    return this.run('reject', (api, id, version) =>
      api.quotes.reject(id, { reason }, { ifMatch: version }),
    );
  }

  cancel(): Promise<boolean> {
    return this.run('cancel', (api, id, version) => api.quotes.cancel(id, { ifMatch: version }));
  }

  /** Converting answers with the order it made, which is where the reader goes next (§58.4). */
  async convert(input: { customerPoNumber?: string } = {}): Promise<string | null> {
    const quote = this.quote();
    if (quote === null || this.busy() !== null) return null;
    this.busy.set('convert');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const order = await this.health.mutation(() =>
        api.quotes.convert(quote.id, input, { ifMatch: this.version }),
      );
      await this.loadRecord();
      return order.order.id;
    } catch (error) {
      this.report(error);
      if (isApiError(error) && CONFLICTS.has(error.code)) await this.loadRecord();
      return null;
    } finally {
      this.busy.set(null);
    }
  }

  private async run(
    kind: QuoteBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const quote = this.quote();
    if (quote === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, quote.id, this.version));
      await this.loadRecord();
      if (this.total() !== null) void this.reload();
      return true;
    } catch (error) {
      this.report(error);
      if (isApiError(error) && CONFLICTS.has(error.code)) await this.loadRecord();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  private report(error: unknown): void {
    if (!isApiError(error)) {
      this.failure.set({ code: 'UNKNOWN', message: 'The quote was not changed.', kind: 'state' });
      return;
    }
    this.failure.set({
      code: error.code,
      message: WORDS[error.code] ?? error.message,
      kind: CONFLICTS.has(error.code)
        ? 'conflict'
        : error.code === 'SERVICE_UNAVAILABLE'
          ? 'transport'
          : error.code === 'FORBIDDEN'
            ? 'permission'
            : 'state',
    });
  }
}
