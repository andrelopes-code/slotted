import { computed, inject, Injectable, signal } from '@angular/core';
import type { NexoraApi, TicketPriority } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { INVENTORY_CONFLICTS, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import {
  classifySupport,
  COMMAND_PERMISSION,
  reopenPermission,
  statusAllows,
  type SupportAgent,
  type TicketCommand,
  type TicketDetail,
} from './support.model';
import { SupportQueuesStore, TicketsStore } from './tickets.store';

export type ComposerMode = 'reply' | 'note';

/** What the reader has written on a ticket and not yet sent. */
interface Draft {
  readonly reply: string;
  readonly note: string;
}

const EMPTY_DRAFT: Draft = { reply: '', note: '' };

export type TicketBusy = TicketCommand | 'customerMessage';

/** What a reply may move the ticket to as it is sent (§68.5 "Reply"). */
export type ReplyStatus = 'open' | 'pending_customer' | 'pending_internal' | 'resolved';

/**
 * The ticket the inbox has open (§14, §68): its conversation, its two clocks,
 * what it is linked to, and §68.5's commands. Every command but create carries
 * the version the page read, held as a number (ER-03); a refusal is classed
 * (ER-01), and a conflict or a refused transition reads the ticket again
 * (ER-02). What the reader wrote in the composer is kept per ticket until it
 * is sent: a transport failure or a conflict never loses it.
 */
@Injectable({ providedIn: 'root' })
export class TicketStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly queue = inject(TicketsStore);
  private readonly queues = inject(SupportQueuesStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<TicketDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<TicketBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);
  readonly mode = signal<ComposerMode>('reply');
  readonly agents = signal<readonly SupportAgent[] | null>(null);

  private readonly drafts = signal<Readonly<Record<string, Draft>>>({});
  private sequence = 0;
  private version = 0;
  private agentsTenant: string | null = null;

  readonly ticket = computed(() => this.detail()?.ticket ?? null);

  readonly draft = computed(() => {
    const id = this.id();
    return (id !== null ? this.drafts()[id] : undefined) ?? EMPTY_DRAFT;
  });

  /** The words in the composer for the mode it is in. */
  readonly composing = computed(() => this.draft()[this.mode()]);

  /** True while a ticket is shown and is being read again. */
  readonly refreshing = computed(() => this.loading() && this.detail() !== null);

  private readonly today = computed(() => this.session.session()?.demo.today ?? '');

  /** Whether the reader may give the command now: the role holds it and the status allows it. */
  can(command: TicketCommand): boolean {
    void this.session.session();
    const ticket = this.ticket();
    if (ticket === null || !statusAllows(command, ticket.status)) return false;
    const permission =
      command === 'reopen' ? reopenPermission(ticket, this.today()) : COMMAND_PERMISSION[command];
    return this.session.can(permission);
  }

  /** Whether the role holds the command, whatever the status (RP-09 names the holder otherwise). */
  holds(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  write(mode: ComposerMode, text: string): void {
    const id = this.id();
    if (id === null) return;
    this.drafts.update((drafts) => ({ ...drafts, [id]: { ...(drafts[id] ?? EMPTY_DRAFT), [mode]: text } }));
  }

  async select(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.error.set(null);
      this.failure.set(null);
      this.mode.set('reply');
    }
    await this.load();
  }

  clear(): void {
    this.sequence++;
    this.id.set(null);
    this.detail.set(null);
    this.error.set(null);
    this.failure.set(null);
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.support.tickets.get(id);
      if (ticket !== this.sequence) return;
      this.show(detail);
      void this.ensureAgents();
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The ticket could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The people an assignment or an escalation names, read once per persona and scenario. */
  async ensureAgents(): Promise<void> {
    const session = this.session.session();
    const tenant = session ? `${session.user.id}|${session.demo.scenarioId}` : null;
    if (tenant === this.agentsTenant && this.agents() !== null) return;
    this.agentsTenant = tenant;
    const api = await this.backend.ready();
    const agents = await this.health.read(() => api.support.agents(), null);
    if (agents !== null) this.agents.set(agents);
  }

  /** A public reply, which may move the ticket on as it is sent (§68.5 "Reply"). */
  async reply(setStatus?: ReplyStatus, resolutionCode?: string, macroId?: string): Promise<boolean> {
    const body = this.draft().reply.trim();
    const ok = await this.run('reply', (api, id, version) =>
      api.support.tickets.reply(
        id,
        {
          body,
          ...(setStatus ? { setStatus } : {}),
          ...(resolutionCode ? { resolutionCode } : {}),
          ...(macroId ? { macroId } : {}),
        },
        { ifMatch: version },
      ),
    );
    if (ok) this.write('reply', '');
    return ok;
  }

  async note(): Promise<boolean> {
    const body = this.draft().note.trim();
    const ok = await this.run('note', (api, id, version) =>
      api.support.tickets.internalNote(id, { body }, { ifMatch: version }),
    );
    if (ok) this.write('note', '');
    return ok;
  }

  assign(assigneeId: string): Promise<boolean> {
    return this.run('assign', (api, id, version) =>
      api.support.tickets.assign(id, { assigneeId }, { ifMatch: version }),
    );
  }

  setPriority(priority: TicketPriority): Promise<boolean> {
    return this.run('priority', (api, id, version) =>
      api.support.tickets.update(id, { priority }, { ifMatch: version }),
    );
  }

  pendingCustomer(reason?: string): Promise<boolean> {
    return this.run('pendingCustomer', (api, id, version) =>
      api.support.tickets.pendingCustomer(id, reason ? { reason } : {}, { ifMatch: version }),
    );
  }

  pendingInternal(): Promise<boolean> {
    return this.run('pendingInternal', (api, id, version) =>
      api.support.tickets.pendingInternal(id, { ifMatch: version }),
    );
  }

  escalate(reason: string, assigneeId?: string): Promise<boolean> {
    return this.run('escalate', (api, id, version) =>
      api.support.tickets.escalate(
        id,
        { reason, ...(assigneeId ? { assigneeId } : {}) },
        { ifMatch: version },
      ),
    );
  }

  /** Resolves with a code; a public reply written in the composer goes with it and leaves it. */
  async resolve(resolutionCode: string): Promise<boolean> {
    const body = this.draft().reply.trim();
    const ok = await this.run('resolve', (api, id, version) =>
      api.support.tickets.resolve(
        id,
        { resolutionCode, ...(body ? { body } : {}) },
        { ifMatch: version },
      ),
    );
    if (ok && body) this.write('reply', '');
    return ok;
  }

  reopen(reason: string): Promise<boolean> {
    return this.run('reopen', (api, id, version) =>
      api.support.tickets.reopen(id, { reason }, { ifMatch: version }),
    );
  }

  close(): Promise<boolean> {
    return this.run('close', (api, id, version) => api.support.tickets.close(id, { ifMatch: version }));
  }

  /** A message from the customer, simulated for the demo (§68.5 "Reopen"). */
  customerMessage(body: string): Promise<boolean> {
    return this.run('customerMessage', (api, id, version) =>
      api.support.tickets.customerMessage(id, { body }, { ifMatch: version }),
    );
  }

  private show(detail: TicketDetail): void {
    this.version = detail.ticket.metadata.version;
    this.detail.set(detail);
  }

  private async run(
    kind: TicketBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<TicketDetail>,
  ): Promise<boolean> {
    const id = this.id();
    if (id === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await this.health.mutation(() => action(api, id, this.version));
      if (this.id() === id) this.show(detail);
      this.afterChange();
      return true;
    } catch (error) {
      this.failure.set(classifySupport(error, 'The ticket was not changed.'));
      if (
        isApiError(error) &&
        (INVENTORY_CONFLICTS.has(error.code) ||
          error.code === 'INVALID_STATE_TRANSITION' ||
          error.code === 'TICKET_CLOSED')
      ) {
        await this.load();
        this.afterChange();
      }
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  /** The queue and its counts follow a change: a resolved ticket leaves the open queue. */
  private afterChange(): void {
    if (this.queue.total() !== null) void this.queue.reload();
    void this.queues.load();
  }
}
