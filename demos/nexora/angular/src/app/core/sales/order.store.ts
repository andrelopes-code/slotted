import { computed, inject, Injectable, signal } from '@angular/core';
import type { ApprovalRequest, NexoraApi, OrderDetail } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { OrdersStore } from './orders.store';

/** What a control on the order may be waiting on. */
export type OrderBusy =
  | 'submit'
  | 'hold'
  | 'release'
  | 'cancel'
  | 'cancelRemaining'
  | 'decision'
  | 'invoice';

/**
 * A refusal the order screen has words for. `conflict` is the class §78.2
 * names: the record moved under the reader, and the answer is to read it
 * again rather than to try the same command harder.
 */
export interface OrderFailure {
  code: string;
  message: string;
  kind: 'conflict' | 'transport' | 'permission' | 'state' | 'unknown';
}

const CONFLICTS = new Set([
  'STALE_VERSION',
  'ORDER_ALREADY_CANCELLED',
  'APPROVAL_ALREADY_DECIDED',
  'INVENTORY_CHANGED',
]);

/** The words the module says for a refusal the reader must act on, by code. */
const WORDS: Record<string, string> = {
  ORDER_ALREADY_CANCELLED: 'This order was cancelled while the page was open.',
  APPROVAL_ALREADY_DECIDED:
    'Another approver decided this one a moment ago. The outcome below is the one that counts.',
  INVENTORY_CHANGED:
    'The stock behind this order moved while the page was open. The quantities below are the ones Nexora now holds.',
  STALE_VERSION: 'Someone else wrote to this order while the page was open.',
  ORDER_HAS_FULFILLED_QUANTITY:
    'Part of this order has already shipped, so it cannot be cancelled whole. Cancel what is left instead.',
  OVER_INVOICING: 'Everything shipped on this order is already invoiced.',
};

/**
 * One sales order at a time: the record, its lines, what blocks it and the
 * commands it allows. Every command carries the version the page read
 * (§53.11); a refusal is classed before it is shown, because a conflict and a
 * transport failure ask the reader for different things.
 */
@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly list = inject(OrdersStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<OrderDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<OrderBusy | null>(null);
  /** The last refusal, in the words of this module; cleared by the next command. */
  readonly failure = signal<OrderFailure | null>(null);

  readonly order = computed(() => this.detail()?.order ?? null);
  readonly lines = computed(() => this.detail()?.lines ?? []);
  /** The request as the backend stores it; the panel reads nothing a list adds. */
  readonly approval = computed<ApprovalRequest | null>(() => this.detail()?.approval ?? null);
  /** The approval's version as the page read it, for the same reason as the order's. */
  private approvalVersion = 0;

  private sequence = 0;
  /**
   * The version the page read, held as a number. An answer shares its
   * `metadata` object with the store, so reading the version at command time
   * would send whatever another writer has just written — and the command
   * would never be refused for being stale (§53.11). See the ledger row
   * "an answer shares its nested objects with the store".
   */
  private version = 0;

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.error.set(null);
      this.failure.set(null);
    }
    await this.load();
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.orders.get(id);
      if (ticket !== this.sequence) return;
      this.detail.set(detail);
      this.version = detail.order.metadata.version;
      this.approvalVersion = detail.approval?.metadata.version ?? 0;
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The order could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  submit(): Promise<boolean> {
    return this.run('submit', (api, id, version) => api.orders.submit(id, { ifMatch: version }));
  }

  hold(reason: string): Promise<boolean> {
    return this.run('hold', (api, id, version) =>
      api.orders.hold(id, { reason }, { ifMatch: version }),
    );
  }

  releaseHold(): Promise<boolean> {
    return this.run('release', (api, id, version) =>
      api.orders.releaseHold(id, { ifMatch: version }),
    );
  }

  cancel(reason: string): Promise<boolean> {
    return this.run('cancel', (api, id, version) =>
      api.orders.cancel(id, { reason }, { ifMatch: version }),
    );
  }

  /**
   * Shipped and not yet invoiced, line by line (§66.4): what `invoices.createFromOrder`
   * would put on a new draft invoice.
   */
  readonly uninvoicedLines = computed(() =>
    this.lines().filter(
      (line) => Number(line.fulfilledQuantity) > Number(line.invoicedQuantity),
    ),
  );

  /**
   * Writes a draft invoice of what has shipped and is not invoiced yet, and
   * answers its id. The command creates a record and carries no version.
   */
  async createInvoice(): Promise<string | null> {
    const order = this.order();
    if (order === null || this.busy() !== null) return null;
    this.busy.set('invoice');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const created = await this.health.mutation(() =>
        api.finance.invoices.createFromOrder({ orderId: order.id }),
      );
      await this.load();
      return created.invoice.id;
    } catch (error) {
      this.report(error);
      if (isApiError(error) && (CONFLICTS.has(error.code) || error.code === 'OVER_INVOICING'))
        await this.load();
      return null;
    } finally {
      this.busy.set(null);
    }
  }

  cancelRemaining(reason: string, lineIds?: readonly string[]): Promise<boolean> {
    return this.run('cancelRemaining', (api, id, version) =>
      api.orders.cancelRemaining(
        id,
        { reason, ...(lineIds && lineIds.length > 0 ? { lineIds: [...lineIds] } : {}) },
        { ifMatch: version },
      ),
    );
  }

  /** The approval of this order, decided from the order itself (§67). */
  async decide(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<boolean> {
    const approval = this.approval();
    if (approval === null || this.busy() !== null) return false;
    this.busy.set('decision');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const version = this.approvalVersion;
      await this.health.mutation(() => {
        if (decision === 'approve')
          return api.approvals.approve(approval.id, { comment: reason }, { ifMatch: version });
        if (decision === 'reject')
          return api.approvals.reject(approval.id, { reason }, { ifMatch: version });
        return api.approvals.requestChanges(approval.id, { reason }, { ifMatch: version });
      });
      await this.load();
      return true;
    } catch (error) {
      this.report(error);
      await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  private async run(
    kind: OrderBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const order = this.order();
    if (order === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, order.id, this.version));
      await this.load();
      if (this.list.total() !== null) void this.list.reload();
      return true;
    } catch (error) {
      this.report(error);
      // A conflict is answered by reading the record again: the screen shows what is true now.
      if (isApiError(error) && CONFLICTS.has(error.code)) await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  private report(error: unknown): void {
    if (!isApiError(error)) {
      this.failure.set({ code: 'UNKNOWN', message: 'The order was not changed.', kind: 'unknown' });
      return;
    }
    const kind: OrderFailure['kind'] = CONFLICTS.has(error.code)
      ? 'conflict'
      : error.code === 'SERVICE_UNAVAILABLE'
        ? 'transport'
        : error.code === 'FORBIDDEN'
          ? 'permission'
          : 'state';
    this.failure.set({ code: error.code, message: WORDS[error.code] ?? error.message, kind });
  }
}
