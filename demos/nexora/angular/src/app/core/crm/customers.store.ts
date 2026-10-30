import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { FilterDescriptor, FilterGroup } from '@slotted/core/filter';
import {
  emptyQuery,
  sameQuery,
  withFilter,
  withSearch,
  type GridQuery,
} from '@slotted/core/grid';
import type { CustomerListItem, NexoraApi } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';
import { CUSTOMER_PAGE_SIZE, toCustomerListQuery } from './customers-query';

/** The filter kinds the list offers, by the backend field each one reads. */
export const CUSTOMER_FILTER_KINDS: Readonly<Record<string, FilterDescriptor['kind']>> = {
  status: 'set',
  segment: 'set',
  health: 'set',
  accountOwnerName: 'text',
  accountOwnerId: 'text',
  regionCode: 'set',
  paymentTermsCode: 'set',
  industry: 'text',
  tags: 'text',
  creditUtilizationBps: 'number',
  overdueReceivables: 'number',
  openOrderCount: 'number',
  customerSince: 'date',
};

/** The columns, in the order the grid draws them; the id is the backend field. */
export const CUSTOMER_COLUMN_IDS = [
  'displayName',
  'accountNumber',
  'status',
  'health',
  'segment',
  'accountOwnerName',
  'city',
  'creditUtilizationBps',
  'grossReceivables',
  'overdueReceivables',
  'openOrderCount',
  'openTicketCount',
  'customerSince',
] as const;

export interface BulkOutcome {
  readonly done: string[];
  readonly failed: { id: string; name: string; message: string }[];
}

export const CUSTOMER_ROUTE = '/crm/customers';

@Injectable({ providedIn: 'root' })
export class CustomersStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);

  readonly query = signal<GridQuery>(emptyQuery({ index: 0, size: CUSTOMER_PAGE_SIZE }));
  readonly rows = signal<readonly CustomerListItem[]>([]);
  /** Rows the current query holds, every page counted; null before the first answer. */
  readonly total = signal<number | null>(null);
  /** Customers in the tenant with no filter and no search; null before the first answer. */
  readonly grandTotal = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** True while the applied tree holds an `or` or a nested group the backend cannot evaluate. */
  readonly flattened = signal(false);
  readonly selected = signal<readonly string[]>([]);
  /** One fact for the whole selection: the bulk action's control waits on it. */
  readonly bulkBusy = signal(false);

  readonly filter = computed(() => this.query().filter);
  readonly search = computed(() => this.query().search);
  readonly page = computed(() => {
    const page = this.query().page;
    return page && 'index' in page ? page : { index: 0, size: CUSTOMER_PAGE_SIZE };
  });

  private sequence = 0;
  /** The tenant the rows belong to: persona, scenario and clock. Another one, and nothing kept applies. */
  private tenant: string | null = null;
  private readonly sessionStore = inject(SessionStore);

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

  /** Drops what was read for another tenant; the next `open` starts over. */
  private forget(): void {
    this.sequence++;
    this.rows.set([]);
    this.total.set(null);
    this.grandTotal.set(null);
    this.selected.set([]);
    this.error.set(null);
    this.query.set(emptyQuery({ index: 0, size: this.page().size }));
  }

  /**
   * A different query removes the rows first, so the placeholders stand while
   * the answer is on its way; the same query read back keeps the rows and
   * marks the grid busy.
   */
  async load(query: GridQuery = this.query(), options: { keepRows?: boolean } = {}): Promise<void> {
    const replace = !options.keepRows && !sameQuery(query, this.query());
    this.query.set(query);
    if (replace || (!options.keepRows && this.total() === null)) this.rows.set([]);
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    const request = toCustomerListQuery(query);
    this.flattened.set(request.flattened);
    try {
      const api = await this.backend.ready();
      const answer = await api.customers.list(request.query);
      if (ticket !== this.sequence) return;
      this.rows.set(answer.data);
      this.total.set(answer.page.totalItems);
      if (!this.isNarrowed(query)) this.grandTotal.set(answer.page.totalItems);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : 'The customers could not be loaded');
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The tenant's count, read once with nothing applied, so the bar can say "12 of 148". */
  async loadGrandTotal(): Promise<void> {
    if (this.grandTotal() !== null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () => api.customers.list({ page: 1, pageSize: 25 }),
      null,
    );
    if (answer) this.grandTotal.set(answer.page.totalItems);
  }

  reload(): Promise<void> {
    return this.load(this.query(), { keepRows: true });
  }

  /** A new persona or scenario is a new tenant: nothing kept applies. */
  async reset(): Promise<void> {
    this.forget();
    await Promise.all([this.load(), this.loadGrandTotal()]);
  }

  setFilter(filter: FilterGroup | null): Promise<void> {
    return this.load(withFilter(this.query(), filter).query);
  }

  setSearch(search: string): Promise<void> {
    return this.load(withSearch(this.query(), search).query);
  }

  /**
   * The list asks for its rows and its grand total at once. A list opened
   * again keeps its rows and reads them back; a first read may start from
   * the query of the reader's saved grid view.
   */
  async open(initial: GridQuery | null = null): Promise<void> {
    if (this.total() === null && initial) this.query.set(initial);
    await Promise.all([this.load(), this.loadGrandTotal()]);
  }

  // ── Bulk actions ─────────────────────────────────────────────────────

  /** Every selected customer on hold, one command each; the list is read back once. */
  hold(reason: string): Promise<BulkOutcome> {
    return this.bulk((api, row) =>
      api.customers.hold(row.id, reason, { ifMatch: row.metadata.version }),
    );
  }

  releaseHold(): Promise<BulkOutcome> {
    return this.bulk((api, row) =>
      api.customers.releaseHold(row.id, { ifMatch: row.metadata.version }),
    );
  }

  private async bulk(
    command: (api: NexoraApi, row: CustomerListItem) => Promise<unknown>,
  ): Promise<BulkOutcome> {
    this.bulkBusy.set(true);
    const outcome: BulkOutcome = { done: [], failed: [] };
    try {
      const api = await this.backend.ready();
      for (const id of this.selected()) {
        let row = this.rows().find((candidate) => candidate.id === id);
        try {
          row ??= (await api.customers.get(id)).customer;
          await command(api, row);
          outcome.done.push(id);
        } catch (error) {
          if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
          outcome.failed.push({
            id,
            name: row?.displayName ?? id,
            message: isApiError(error) ? error.message : 'Nexora did not answer',
          });
        }
      }
      if (outcome.done.length > 0) {
        this.selected.set(outcome.failed.map((failure) => failure.id));
        await this.reload();
      }
      return outcome;
    } finally {
      this.bulkBusy.set(false);
    }
  }

  routeFor(id: string): string {
    return `${CUSTOMER_ROUTE}/${id}`;
  }

  private isNarrowed(query: GridQuery): boolean {
    return query.filter !== null || query.search.trim().length >= 2;
  }
}
