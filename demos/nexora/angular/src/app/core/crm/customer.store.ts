import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  ActivityEvent,
  CustomerDetail,
  CustomerNote,
  NexoraApi,
  NoteVisibility,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { CustomersStore } from './customers.store';

export type CustomerActivity = ActivityEvent & { actorName: string };

/** What a control may be waiting on. */
export type CustomerBusy = 'hold' | 'release' | 'archive' | 'note';

/**
 * One customer at a time: the record the list opened, its related records
 * and its activity. Kept across navigation so the back gesture finds the
 * record it left; another id replaces everything.
 */
@Injectable({ providedIn: 'root' })
export class CustomerStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly list = inject(CustomersStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<CustomerDetail | null>(null);
  readonly loading = signal(false);
  /** The code of a failed load: NOT_FOUND, FORBIDDEN, SERVICE_UNAVAILABLE or another. */
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly activity = signal<readonly CustomerActivity[]>([]);
  readonly activityLoading = signal(false);
  readonly activityHasMore = signal(false);
  /** The identity of what is in flight: 'hold', 'release', 'archive' or 'note'. */
  readonly busy = signal<CustomerBusy | null>(null);

  readonly customer = computed(() => this.detail()?.customer ?? null);

  private sequence = 0;

  /** The record's own request; a different id removes the record first, the same id reads it back. */
  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.activity.set([]);
      this.activityHasMore.set(false);
      this.error.set(null);
    }
    await Promise.all([this.load(), this.loadActivity()]);
  }

  /** The reader's Refresh (AF-07): the record and its activity read again, the values on screen kept until the answers land. */
  async refresh(): Promise<void> {
    await Promise.all([this.load(), this.loadActivity()]);
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.customers.get(id);
      if (ticket !== this.sequence) return;
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The customer could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  async loadActivity(more = false): Promise<void> {
    const id = this.id();
    if (id === null) return;
    this.activityLoading.set(true);
    try {
      const api = await this.backend.ready();
      const last = more ? this.activity().at(-1)?.occurredAt : undefined;
      const answer = await this.health.read(
        () => api.customers.activity(id, { limit: 20, ...(last ? { before: last } : {}) }),
        { data: [], hasMore: false },
      );
      if (this.id() !== id) return;
      this.activity.set(more ? [...this.activity(), ...answer.data] : answer.data);
      this.activityHasMore.set(answer.hasMore);
    } finally {
      this.activityLoading.set(false);
    }
  }

  hold(reason: string): Promise<void> {
    return this.mutate('hold', async (api, id, version) => {
      await api.customers.hold(id, reason, { ifMatch: version });
    });
  }

  releaseHold(): Promise<void> {
    return this.mutate('release', async (api, id, version) => {
      await api.customers.releaseHold(id, { ifMatch: version });
    });
  }

  archive(): Promise<void> {
    return this.mutate('archive', async (api, id, version) => {
      await api.customers.archive(id, { ifMatch: version });
    });
  }

  addNote(body: string, visibility: NoteVisibility): Promise<void> {
    return this.mutate('note', async (api, id) => {
      const note: CustomerNote = await api.customers.notes.add(id, { body, visibility });
      this.detail.update((detail) =>
        detail ? { ...detail, notes: [note, ...detail.notes] } : detail,
      );
    });
  }

  /** The control that started it waits on `busy`; the record and the list are read back after. */
  private async mutate(
    kind: CustomerBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<void>,
  ): Promise<void> {
    const customer = this.customer();
    if (!customer) return;
    this.busy.set(kind);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, customer.id, customer.metadata.version));
      await Promise.all([this.load(), this.loadActivity()]);
      if (this.list.total() !== null) void this.list.reload();
    } finally {
      this.busy.set(null);
    }
  }
}
