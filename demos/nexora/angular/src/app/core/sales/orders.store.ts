import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { FilterGroup } from '@slotted/core/filter';
import {
  emptyQuery,
  sameQuery,
  withFilter,
  withSearch,
  type GridQuery,
} from '@slotted/core/grid';
import type { OrderListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { LIST_PAGE_SIZE, toListQuery, type ScaleMap } from '../backend/list-query';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';

/** The two values the list shows in a unit the backend does not store. */
const SCALE: ScaleMap = { grossMarginBps: 100, total: 100 };

export const ORDERS_ROUTE = '/sales/orders';

/**
 * The tenant's sales orders, one page at a time, in the shape the grid asks
 * for. The store owns the query so a change of filter, sort or page empties
 * the rows before the request (LP-06) and a read-back keeps them.
 */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);

  readonly query = signal<GridQuery>(emptyQuery({ index: 0, size: LIST_PAGE_SIZE }));
  readonly rows = signal<readonly OrderListItem[]>([]);
  readonly total = signal<number | null>(null);
  readonly grandTotal = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly flattened = signal(false);

  readonly filter = computed(() => this.query().filter);
  readonly search = computed(() => this.query().search);
  readonly page = computed(() => {
    const page = this.query().page;
    return page && 'index' in page ? page : { index: 0, size: LIST_PAGE_SIZE };
  });

  private sequence = 0;
  private tenant: string | null = null;

  constructor() {
    this.tenant = untracked(() => this.tenantKey());
    effect(() => {
      const key = this.tenantKey();
      if (key === null) return;
      untracked(() => {
        if (this.tenant !== null && this.tenant !== key && this.total() !== null) this.forget();
        this.tenant = key;
      });
    });
  }

  /** The persona, the scenario and the clock: another one, and nothing kept applies. */
  private tenantKey(): string | null {
    const session = this.session.session();
    return session === null
      ? null
      : `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
  }

  private forget(): void {
    this.sequence++;
    this.rows.set([]);
    this.total.set(null);
    this.grandTotal.set(null);
    this.error.set(null);
    this.query.set(emptyQuery({ index: 0, size: this.page().size }));
  }

  /** The first read of a visit may start from the reader's saved view rather than from the default query. */
  async open(initial: GridQuery | null = null): Promise<void> {
    if (initial && this.total() === null) this.query.set(initial);
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
      const answer = await api.orders.list(request.query);
      if (ticket !== this.sequence) return;
      this.rows.set(answer.data);
      this.total.set(answer.page.totalItems);
      if (!this.isNarrowed(query)) this.grandTotal.set(answer.page.totalItems);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : 'The orders could not be loaded');
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The tenant's count, with nothing applied, so the bar can say "12 of 1,480". */
  async loadGrandTotal(): Promise<void> {
    if (this.grandTotal() !== null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(() => api.orders.list({ page: 1, pageSize: 25 }), null);
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
    return `${ORDERS_ROUTE}/${id}`;
  }

  private isNarrowed(query: GridQuery): boolean {
    return query.filter !== null || query.search.trim().length > 0;
  }
}
