import { effect, inject, signal, computed, untracked } from '@angular/core';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, sameQuery, withFilter, withSearch, type GridQuery } from '@slotted/core/grid';
import type {
  FilterValue,
  ListQuery,
  ListResponse,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import { SessionStore } from '../session/session.store';
import { isApiError } from './api-error';
import { LIST_PAGE_SIZE, toListQuery, type ScaleMap } from './list-query';
import { NEXORA_BACKEND } from './nexora-backend.provider';
import { TransportHealth } from './transport-health';

/**
 * What every paged listing over a backend resource shares: one query, one
 * sequence of requests, the count of the query beside the count of the place,
 * and the rule LP-06 states — a different query empties the rows, the same
 * query read back keeps them.
 *
 * A subclass names the resource (`read`) and, where the list stands in a place
 * rather than in the whole tenant, the condition that narrows it
 * (`scopeFilter`). The place is not one of the bar's pills (BR-01).
 */
export abstract class ListStore<Row> {
  protected readonly backend = inject(NEXORA_BACKEND);
  protected readonly health = inject(TransportHealth);
  protected readonly sessionStore = inject(SessionStore);

  readonly query = signal<GridQuery>(emptyQuery({ index: 0, size: LIST_PAGE_SIZE }));
  readonly rows = signal<readonly Row[]>([]);
  /** Rows the current query holds, every page counted; null before the first answer. */
  readonly total = signal<number | null>(null);
  /** Rows the place holds with no filter and no search; null before the first answer. */
  readonly grandTotal = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** True while the applied tree holds an `or` or a nested group the backend cannot evaluate. */
  readonly flattened = signal(false);

  readonly filter = computed(() => this.query().filter);
  readonly search = computed(() => this.query().search);
  readonly page = computed(() => {
    const page = this.query().page;
    return page && 'index' in page ? page : { index: 0, size: LIST_PAGE_SIZE };
  });

  /** The factors a filter value is scaled by before it travels (money in minor units). */
  protected abstract readonly scales: ScaleMap;
  protected abstract readonly failureMessage: string;
  protected abstract read(api: NexoraApi, query: ListQuery): Promise<ListResponse<Row>>;

  /** What narrows the list beside the reader's own tree; nothing by default. */
  protected scopeFilter(): Record<string, FilterValue> {
    return {};
  }

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

  private tenantKey(): string | null {
    const session = this.sessionStore.session();
    return session === null
      ? null
      : `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
  }

  protected forget(): void {
    this.sequence++;
    this.rows.set([]);
    this.total.set(null);
    this.grandTotal.set(null);
    this.error.set(null);
    this.query.set(emptyQuery({ index: 0, size: this.page().size }));
  }

  async load(query: GridQuery = this.query(), options: { keepRows?: boolean } = {}): Promise<void> {
    const replace = !options.keepRows && !sameQuery(query, this.query());
    this.query.set(query);
    if (replace || (!options.keepRows && this.total() === null)) this.rows.set([]);
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    const request = toListQuery(query, this.scales);
    this.flattened.set(request.flattened);
    try {
      const api = await this.backend.ready();
      const answer = await this.read(api, this.withScope(request.query));
      if (ticket !== this.sequence) return;
      this.rows.set(answer.data);
      this.total.set(answer.page.totalItems);
      if (!this.isNarrowed(query)) this.grandTotal.set(answer.page.totalItems);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : this.failureMessage);
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The reader's tree, and the place the page stands in, as one list query. */
  protected withScope(query: ListQuery): ListQuery {
    const scope = this.scopeFilter();
    if (Object.keys(scope).length === 0) return query;
    return { ...query, filter: { ...(query.filter ?? {}), ...scope } };
  }

  /** The count of the place, read once with nothing applied, so the bar can say "12 of 340". */
  async loadGrandTotal(): Promise<void> {
    if (this.grandTotal() !== null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () => this.read(api, this.withScope({ page: 1, pageSize: LIST_PAGE_SIZE })),
      null,
    );
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

  /** The first read of a list may start from the reader's saved view rather than from the default query. */
  async open(initial: GridQuery | null = null): Promise<void> {
    if (initial && this.total() === null) this.query.set(initial);
    await Promise.all([this.load(), this.loadGrandTotal()]);
  }

  protected isNarrowed(query: GridQuery): boolean {
    return query.filter !== null || query.search.trim().length >= 2;
  }
}
