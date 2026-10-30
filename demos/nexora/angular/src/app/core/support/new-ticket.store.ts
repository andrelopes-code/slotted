import { inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  CustomerDetail,
  CustomerListItem,
  TicketChannel,
  TicketPriority,
} from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { classifySupport, type TicketDetail } from './support.model';
import { SupportQueuesStore, TicketsStore } from './tickets.store';

/**
 * The draft of a new ticket (§14, §68.5 "Create"). It lives in this store, so
 * leaving the form and opening it again finds it (FM-05); a ticket created
 * empties it. A customer or an order record links here with `?customer=` and
 * `?order=`, so the ticket opens on its customer with the order linked.
 */
@Injectable({ providedIn: 'root' })
export class NewTicketStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly list = inject(TicketsStore);
  private readonly queues = inject(SupportQueuesStore);

  readonly customer = signal<CustomerListItem | null>(null);
  readonly customerQuery = signal('');
  readonly customerOptions = signal<readonly CustomerListItem[]>([]);
  readonly searching = signal(false);
  /** The chosen customer's contacts and recent orders; null before they are read. */
  readonly context = signal<Pick<CustomerDetail, 'contacts' | 'recentOrders'> | null>(null);

  readonly subject = signal('');
  readonly description = signal('');
  readonly priority = signal<TicketPriority>('normal');
  readonly channel = signal<TicketChannel>('phone');
  readonly category = signal<string>('other');
  readonly contactId = signal<string | null>(null);
  readonly relatedOrderId = signal<string | null>(null);

  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal(false);

  private ticket = 0;

  /**
   * A link naming another customer than the draft holds starts a new draft;
   * otherwise what was typed stays (FM-05), and a named order is linked.
   */
  async prefill(customerId: string | null, orderId: string | null): Promise<void> {
    if (customerId === null || customerId === this.customer()?.id) {
      if (orderId !== null && this.customer() !== null) this.relatedOrderId.set(orderId);
      if (this.customer() !== null && this.context() === null) await this.loadContext();
      return;
    }
    this.reset();
    const api = await this.backend.ready();
    const answer = await this.health.read(() => api.customers.get(customerId), null);
    if (answer === null) return;
    this.customer.set(answer.customer);
    this.customerQuery.set(answer.customer.displayName);
    this.context.set({ contacts: answer.contacts, recentOrders: answer.recentOrders });
    this.contactId.set(answer.customer.primaryContactId ?? null);
    this.relatedOrderId.set(orderId);
  }

  async search(query: string): Promise<void> {
    this.customerQuery.set(query);
    const ticket = ++this.ticket;
    if (query.trim().length < 2) {
      this.customerOptions.set([]);
      return;
    }
    this.searching.set(true);
    try {
      const api = await this.backend.ready();
      const answer = await this.health.read(
        () => api.customers.list({ q: query.trim(), pageSize: 25, sort: 'displayName' }),
        null,
      );
      if (ticket !== this.ticket || answer === null) return;
      this.customerOptions.set(answer.data);
    } finally {
      if (ticket === this.ticket) this.searching.set(false);
    }
  }

  /** Another customer empties the contact and the order: they were the other customer's. */
  async choose(customer: CustomerListItem | null): Promise<void> {
    if (customer?.id === this.customer()?.id) return;
    this.customer.set(customer);
    this.customerQuery.set(customer?.displayName ?? '');
    this.context.set(null);
    this.contactId.set(customer?.primaryContactId ?? null);
    this.relatedOrderId.set(null);
    this.forget('customerId');
    if (customer !== null) await this.loadContext();
  }

  forget(name: string): void {
    if (!(name in this.errors())) return;
    this.errors.update((errors) => {
      const next = { ...errors };
      delete next[name];
      return next;
    });
  }

  private async loadContext(): Promise<void> {
    const customer = this.customer();
    if (customer === null) return;
    const api = await this.backend.ready();
    const answer = await this.health.read(() => api.customers.get(customer.id), null);
    if (answer === null || this.customer()?.id !== customer.id) return;
    this.context.set({ contacts: answer.contacts, recentOrders: answer.recentOrders });
  }

  reset(): void {
    this.customer.set(null);
    this.customerQuery.set('');
    this.customerOptions.set([]);
    this.context.set(null);
    this.subject.set('');
    this.description.set('');
    this.priority.set('normal');
    this.channel.set('phone');
    this.category.set('other');
    this.contactId.set(null);
    this.relatedOrderId.set(null);
    this.errors.set({});
    this.failure.set(null);
  }

  /** The backend's required fields, checked before the request and keyed by its names (FM-02, FM-03). */
  private check(): FormErrors {
    const errors: Record<string, string[]> = {};
    if (this.customer() === null) errors['customerId'] = ['Choose the customer the ticket is for.'];
    if (this.subject().trim().length === 0) errors['subject'] = ['Say in one line what is wrong.'];
    if (this.description().trim().length === 0)
      errors['description'] = ['Write what the customer reported: it opens the conversation.'];
    return errors;
  }

  async create(): Promise<TicketDetail | null> {
    const errors = this.check();
    if (Object.keys(errors).length > 0) {
      this.errors.set(errors);
      return null;
    }
    this.creating.set(true);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const contact = this.contactId();
      const order = this.relatedOrderId();
      const answer = await this.health.mutation(() =>
        api.support.tickets.create({
          customerId: this.customer()!.id,
          subject: this.subject().trim(),
          description: this.description().trim(),
          priority: this.priority(),
          channel: this.channel(),
          category: this.category(),
          ...(contact ? { contactId: contact } : {}),
          ...(order ? { relatedOrderId: order } : {}),
        }),
      );
      this.reset();
      if (this.list.total() !== null) void this.list.reload();
      void this.queues.load();
      return answer;
    } catch (error) {
      this.failure.set(classifySupport(error, 'The ticket was not created.'));
      this.errors.set(fieldErrors(error));
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}
