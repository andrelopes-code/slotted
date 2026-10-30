import {
  SLA_TARGETS,
  addBusinessMinutes,
  diffDays,
  type ConversationMessage,
  type SlaEvent,
  type SupportTicket,
  type TicketChannel,
  type TicketPriority,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import { getTicket, refreshTicketSla, type TicketDetail } from '../resources/support';
import {
  domainError,
  finalize,
  load,
  metadata,
  open,
  transition,
  trimmed,
  Validator,
} from './helpers';

const PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

export interface TicketUpdateInput {
  subject?: string;
  priority?: TicketPriority;
  category?: string;
  tags?: string[];
  relatedOrderId?: string;
  relatedInvoiceId?: string;
  relatedSkuId?: string;
}
const CHANNELS: TicketChannel[] = ['email', 'phone', 'portal', 'chat', 'internal'];

export function createSupportCommands(runtime: ApiRuntime) {
  const slaEvent = (tx: Transaction, ticketId: string, type: SlaEvent['type']): void => {
    tx.create('slaEvents', {
      id: runtime.store.nextId('slaEvent'),
      organizationId: runtime.store.dataset.organization.id,
      ticketId,
      type,
      occurredAt: tx.occurredAt,
    });
  };

  const message = (
    tx: Transaction,
    ticket: SupportTicket,
    input: {
      authorType: ConversationMessage['authorType'];
      visibility: ConversationMessage['visibility'];
      body: string;
      authorContactId?: string;
    },
  ): ConversationMessage => {
    const record: ConversationMessage = {
      id: runtime.store.nextId('conversationMessage'),
      organizationId: ticket.organizationId,
      ticketId: ticket.id,
      authorType: input.authorType,
      visibility: input.visibility,
      body: input.body.trim(),
      attachmentIds: [],
      createdAt: tx.occurredAt,
      ...(input.authorType === 'user' ? { authorUserId: tx.actor.id } : {}),
      ...(input.authorContactId ? { authorContactId: input.authorContactId } : {}),
    };
    tx.create('conversationMessages', record);
    ticket.messageCount += 1;
    if (input.authorType === 'customer') ticket.lastCustomerMessageAt = tx.occurredAt;
    if (input.authorType === 'user' && input.visibility === 'public')
      ticket.lastAgentMessageAt = tx.occurredAt;
    return record;
  };

  /**
   * Section 68.5 "Escalate" — the manager an escalation goes to when none is named: the support
   * lead, whom the persona switcher offers, then any active Support Manager; never the one who
   * escalates.
   */
  const escalationTarget = (actorId: string): string | undefined => {
    const lead = runtime.store.seed.personaUserIds.get('support-lead');
    if (lead && lead !== actorId && runtime.authorization.hasRole(lead, 'support_manager'))
      return lead;
    for (const assignment of runtime.store.dataset.roleAssignments.values()) {
      if (runtime.store.dataset.roles.get(assignment.roleId)?.name !== 'Support Manager') continue;
      if (assignment.userId === actorId) continue;
      if (runtime.store.dataset.users.get(assignment.userId)?.status !== 'active') continue;
      return assignment.userId;
    }
    return undefined;
  };

  const supportTeamId = (): string =>
    [...runtime.store.dataset.teams.values()].find((team) => team.type === 'support')?.id ?? '';

  const finish = (
    tx: Transaction,
    ticket: SupportTicket,
    action: string,
    changed: string[],
  ): TicketDetail => {
    refreshTicketSla(runtime, ticket);
    finalize(tx, 'tickets', ticket, action, 'support_ticket', changed);
    return getTicket(runtime, ticket.id);
  };

  /** Section 68.5: edits a ticket's subject, priority, category, tags and links — the command and a workflow's tag actions. */
  const updateTicket = (
    tx: Transaction,
    id: string,
    input: TicketUpdateInput,
    options?: MutationOptions,
  ): TicketDetail => {
    tx.require('support.change_status');
    const ticket = open(tx, 'tickets', id, 'Ticket', options);
    if (ticket.status === 'closed')
      throw domainError('TICKET_CLOSED', `Ticket ${ticket.ticketNumber} is closed`, 409);
    new Validator().oneOf('priority', input.priority, PRIORITIES).throwIfAny();
    const changed: string[] = [];
    if (trimmed(input.subject)) {
      ticket.subject = trimmed(input.subject) as string;
      changed.push('subject');
    }
    if (input.priority && input.priority !== ticket.priority) {
      ticket.priority = input.priority;
      const targets = SLA_TARGETS[input.priority];
      ticket.firstResponseDueAt = addBusinessMinutes(
        ticket.metadata.createdAt,
        targets.firstResponseMinutes,
      );
      ticket.resolutionDueAt = addBusinessMinutes(
        ticket.metadata.createdAt,
        targets.resolutionMinutes,
      );
      changed.push('priority');
    }
    if (trimmed(input.category)) {
      ticket.category = trimmed(input.category) as string;
      changed.push('category');
    }
    if (input.tags) {
      ticket.tags = input.tags;
      changed.push('tags');
    }
    if (input.relatedOrderId !== undefined) {
      if (input.relatedOrderId)
        ticket.relatedOrderId = load(runtime, 'salesOrders', input.relatedOrderId, 'Order').id;
      else delete ticket.relatedOrderId;
      changed.push('relatedOrderId');
    }
    if (input.relatedInvoiceId !== undefined) {
      if (input.relatedInvoiceId)
        ticket.relatedInvoiceId = load(runtime, 'invoices', input.relatedInvoiceId, 'Invoice').id;
      else delete ticket.relatedInvoiceId;
      changed.push('relatedInvoiceId');
    }
    if (input.relatedSkuId !== undefined) {
      if (input.relatedSkuId)
        ticket.relatedSkuId = load(runtime, 'skus', input.relatedSkuId, 'SKU').id;
      else delete ticket.relatedSkuId;
      changed.push('relatedSkuId');
    }
    return finish(tx, ticket, 'ticket.updated', changed);
  };

  /** Section 68.5 "Assign/open" — the interactive command and a workflow's assignment. */
  const assignTicket = (
    tx: Transaction,
    id: string,
    input: { assigneeId: string },
    options?: MutationOptions,
  ): TicketDetail => {
    tx.require('support.assign');
    const assignee = load(runtime, 'users', input.assigneeId, 'User');
    const ticket = open(tx, 'tickets', id, 'Ticket', options);
    if (ticket.status === 'closed')
      throw domainError('TICKET_CLOSED', `Ticket ${ticket.ticketNumber} is closed`, 409);
    ticket.assigneeId = assignee.id;
    if (ticket.status === 'new') ticket.status = 'open';
    tx.notify(
      assignee.id,
      'action_required',
      `Ticket ${ticket.ticketNumber} assigned to you`,
      ticket.subject,
      { type: 'support_ticket', id },
    );
    return finish(tx, ticket, 'ticket.assigned', ['assigneeId', 'status']);
  };

  return {
    services: { updateTicket, assignTicket },
    create: (
      input: {
        customerId: string;
        subject: string;
        description: string;
        priority?: TicketPriority;
        channel?: TicketChannel;
        category?: string;
        contactId?: string;
        relatedOrderId?: string;
        relatedInvoiceId?: string;
        relatedSkuId?: string;
        assigneeId?: string;
        tags?: string[];
      },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets', options, input, (tx) => {
        runtime.require('support.create');
        const customer = load(runtime, 'customers', input.customerId, 'Customer');
        new Validator()
          .required('subject', input.subject)
          .required('description', input.description)
          .oneOf('priority', input.priority, PRIORITIES)
          .oneOf('channel', input.channel, CHANNELS)
          .throwIfAny();
        const priority = input.priority ?? 'normal';
        const targets = SLA_TARGETS[priority];
        const id = runtime.store.nextId('ticket');
        const ticket: SupportTicket = {
          id,
          organizationId: customer.organizationId,
          ticketNumber: runtime.store.nextBusinessNumber('ticket'),
          customerId: customer.id,
          subject: input.subject.trim(),
          description: input.description.trim(),
          channel: input.channel ?? 'email',
          category: trimmed(input.category) ?? 'other',
          priority,
          status: input.assigneeId ? 'open' : 'new',
          assignedTeamId: supportTeamId(),
          firstResponseDueAt: addBusinessMinutes(tx.occurredAt, targets.firstResponseMinutes),
          resolutionDueAt: addBusinessMinutes(tx.occurredAt, targets.resolutionMinutes),
          firstResponseSla: 'running',
          resolutionSla: 'running',
          messageCount: 0,
          tags: input.tags ?? [],
          metadata: metadata(tx, id),
          ...(input.contactId
            ? { contactId: input.contactId }
            : customer.primaryContactId
              ? { contactId: customer.primaryContactId }
              : {}),
          ...(input.relatedOrderId
            ? { relatedOrderId: load(runtime, 'salesOrders', input.relatedOrderId, 'Order').id }
            : {}),
          ...(input.relatedInvoiceId
            ? { relatedInvoiceId: load(runtime, 'invoices', input.relatedInvoiceId, 'Invoice').id }
            : {}),
          ...(input.relatedSkuId
            ? { relatedSkuId: load(runtime, 'skus', input.relatedSkuId, 'SKU').id }
            : {}),
          ...(input.assigneeId
            ? { assigneeId: load(runtime, 'users', input.assigneeId, 'User').id }
            : {}),
        };
        tx.create('tickets', ticket);
        message(tx, ticket, {
          authorType: input.channel === 'internal' ? 'user' : 'customer',
          visibility: 'public',
          body: input.description,
          ...(ticket.contactId && input.channel !== 'internal'
            ? { authorContactId: ticket.contactId }
            : {}),
        });
        slaEvent(tx, id, 'first_response_started');
        slaEvent(tx, id, 'resolution_started');
        tx.dirty('tickets', ticket);
        tx.audit('ticket.created', 'support_ticket', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'ticket.created',
          subjectType: 'support_ticket',
          subjectId: id,
          subjectLabel: ticket.ticketNumber,
          customerId: customer.id,
          orderId: ticket.relatedOrderId,
          summary: `Ticket ${ticket.ticketNumber} opened: ${ticket.subject}`,
        });
        if (ticket.assigneeId)
          tx.notify(
            ticket.assigneeId,
            'action_required',
            `Ticket ${ticket.ticketNumber} assigned to you`,
            ticket.subject,
            { type: 'support_ticket', id },
          );
        return getTicket(runtime, id);
      }),

    update: (
      id: string,
      input: TicketUpdateInput,
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('PATCH /support/tickets/:id', options, { id, input }, (tx) =>
        updateTicket(tx, id, input, options),
      ),

    assign: (
      id: string,
      input: { assigneeId: string },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/assign', options, { id, input }, (tx) =>
        assignTicket(tx, id, input, options),
      ),

    /** Section 68.5 "Reply" — a public reply records the first response. */
    reply: (
      id: string,
      input: {
        body: string;
        setStatus?: 'open' | 'pending_customer' | 'pending_internal' | 'resolved';
        resolutionCode?: string;
        macroId?: string;
      },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/reply', options, { id, input }, (tx) => {
        runtime.require('support.reply');
        const ticket = open(tx, 'tickets', id, 'Ticket', options);
        if (ticket.status === 'closed')
          throw domainError('TICKET_CLOSED', `Ticket ${ticket.ticketNumber} is closed`, 409);
        const macro = input.macroId
          ? load(runtime, 'supportMacros', input.macroId, 'Macro')
          : undefined;
        const body = trimmed(input.body) ?? macro?.body;
        if (!body) throw domainError('VALIDATION_FAILED', 'A reply needs a body');
        message(tx, ticket, { authorType: 'user', visibility: 'public', body });
        if (!ticket.firstRespondedAt) {
          ticket.firstRespondedAt = tx.occurredAt;
          refreshTicketSla(runtime, ticket);
          slaEvent(
            tx,
            id,
            ticket.firstResponseSla === 'met' ? 'first_response_met' : 'first_response_breached',
          );
        }
        if (ticket.status === 'new' || ticket.status === 'pending_customer') ticket.status = 'open';
        if (!ticket.assigneeId) ticket.assigneeId = tx.actor.id;
        if (macro?.addTags.length) ticket.tags = [...new Set([...ticket.tags, ...macro.addTags])];
        const next = input.setStatus ?? macro?.setStatus;
        if (
          next === 'pending_customer' &&
          (ticket.status === 'open' || ticket.status === 'escalated')
        ) {
          ticket.status = 'pending_customer';
          slaEvent(tx, id, 'resolution_paused');
        } else if (
          next === 'pending_internal' &&
          (ticket.status === 'open' || ticket.status === 'escalated')
        )
          ticket.status = 'pending_internal';
        else if (next === 'resolved') {
          const code = trimmed(input.resolutionCode) ?? 'resolved_information';
          ticket.status = 'resolved';
          ticket.resolvedAt = tx.occurredAt;
          ticket.resolutionCode = code;
          refreshTicketSla(runtime, ticket);
          slaEvent(
            tx,
            id,
            ticket.resolutionSla === 'met' ? 'resolution_met' : 'resolution_breached',
          );
        }
        return finish(tx, ticket, 'ticket.replied', ['status', 'messageCount']);
      }),

    internalNote: (
      id: string,
      input: { body: string },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/internal-note', options, { id, input }, (tx) => {
        runtime.require('support.reply');
        new Validator().required('body', input.body).throwIfAny();
        const ticket = open(tx, 'tickets', id, 'Ticket', options);
        message(tx, ticket, { authorType: 'user', visibility: 'internal', body: input.body });
        return finish(tx, ticket, 'ticket.note_added', ['messageCount']);
      }),

    /** Simulated customer message (portal/email) — may reopen a resolved ticket within 7 days (section 68.5). */
    customerMessage: (
      id: string,
      input: { body: string },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command(
        'POST /support/tickets/:id/customer-message',
        options,
        { id, input },
        (tx) => {
          runtime.require('support.reply');
          new Validator().required('body', input.body).throwIfAny();
          const ticket = open(tx, 'tickets', id, 'Ticket', options);
          if (ticket.status === 'closed')
            throw domainError(
              'TICKET_CLOSED',
              `Ticket ${ticket.ticketNumber} is closed; open a new ticket`,
              409,
            );
          message(tx, ticket, {
            authorType: 'customer',
            visibility: 'public',
            body: input.body,
            ...(ticket.contactId ? { authorContactId: ticket.contactId } : {}),
          });
          if (ticket.status === 'resolved') {
            if (
              ticket.resolvedAt &&
              diffDays(runtime.store.today, ticket.resolvedAt.slice(0, 10)) > 7
            )
              throw domainError(
                'REOPEN_WINDOW_EXPIRED',
                'The 7-day reopen window has passed; a Support Manager can reopen manually',
                409,
              );
            ticket.status = 'open';
            delete ticket.resolvedAt;
            delete ticket.resolutionCode;
            slaEvent(tx, id, 'resolution_resumed');
          } else if (ticket.status === 'pending_customer') {
            ticket.status = 'open';
            slaEvent(tx, id, 'resolution_resumed');
          }
          return finish(tx, ticket, 'ticket.customer_message', ['status', 'messageCount']);
        },
      ),

    pendingCustomer: (
      id: string,
      input: { reason?: string } = {},
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command(
        'POST /support/tickets/:id/pending-customer',
        options,
        { id, input },
        (tx) => {
          runtime.require('support.change_status');
          const ticket = open(tx, 'tickets', id, 'Ticket', options);
          if (ticket.status !== 'open' && ticket.status !== 'escalated')
            throw transition('Ticket', ticket.status, 'wait on the customer');
          if (!ticket.lastAgentMessageAt && !trimmed(input.reason))
            throw domainError(
              'VALIDATION_FAILED',
              'A public reply or a reason is required before waiting on the customer',
            );
          if (trimmed(input.reason))
            message(tx, ticket, {
              authorType: 'user',
              visibility: 'internal',
              body: `Waiting on customer: ${trimmed(input.reason)}`,
            });
          ticket.status = 'pending_customer';
          slaEvent(tx, id, 'resolution_paused');
          return finish(tx, ticket, 'ticket.pending_customer', ['status']);
        },
      ),

    pendingInternal: (id: string, options?: MutationOptions): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/pending-internal', options, { id }, (tx) => {
        runtime.require('support.change_status');
        const ticket = open(tx, 'tickets', id, 'Ticket', options);
        if (ticket.status !== 'open' && ticket.status !== 'escalated')
          throw transition('Ticket', ticket.status, 'wait on an internal team');
        ticket.status = 'pending_internal';
        return finish(tx, ticket, 'ticket.pending_internal', ['status']);
      }),

    escalate: (
      id: string,
      input: { reason: string; assigneeId?: string },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/escalate', options, { id, input }, (tx) => {
        runtime.require('support.escalate');
        new Validator().required('reason', input.reason).throwIfAny();
        const ticket = open(tx, 'tickets', id, 'Ticket', options);
        if (
          ticket.status !== 'new' &&
          ticket.status !== 'open' &&
          ticket.status !== 'pending_internal'
        )
          throw transition('Ticket', ticket.status, 'be escalated');
        ticket.status = 'escalated';
        ticket.escalationReason = input.reason.trim();
        tx.emit('ticket.escalated', { ticketId: id, customerId: ticket.customerId });
        const target = input.assigneeId ?? escalationTarget(tx.actor.id);
        if (target) {
          ticket.assigneeId = target;
          tx.notify(
            target,
            'action_required',
            `Ticket ${ticket.ticketNumber} escalated`,
            input.reason.trim(),
            { type: 'support_ticket', id },
          );
        }
        message(tx, ticket, {
          authorType: 'system',
          visibility: 'internal',
          body: `Escalated by ${tx.actor.displayName}: ${input.reason.trim()}`,
        });
        tx.activityEvent({
          type: 'ticket.escalated',
          subjectType: 'support_ticket',
          subjectId: id,
          subjectLabel: ticket.ticketNumber,
          customerId: ticket.customerId,
          orderId: ticket.relatedOrderId,
          summary: `Ticket ${ticket.ticketNumber} escalated — ${input.reason.trim()}`,
        });
        return finish(tx, ticket, 'ticket.escalated', ['status', 'escalationReason', 'assigneeId']);
      }),

    resolve: (
      id: string,
      input: { resolutionCode: string; body?: string },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/resolve', options, { id, input }, (tx) => {
        runtime.require('support.change_status');
        if (!trimmed(input.resolutionCode))
          throw domainError('RESOLUTION_CODE_REQUIRED', 'A resolution code is required');
        const ticket = open(tx, 'tickets', id, 'Ticket', options);
        if (ticket.status === 'resolved' || ticket.status === 'closed')
          throw transition('Ticket', ticket.status, 'be resolved');
        if (trimmed(input.body)) {
          message(tx, ticket, {
            authorType: 'user',
            visibility: 'public',
            body: trimmed(input.body) as string,
          });
          if (!ticket.firstRespondedAt) {
            ticket.firstRespondedAt = tx.occurredAt;
            refreshTicketSla(runtime, ticket);
            slaEvent(
              tx,
              id,
              ticket.firstResponseSla === 'met' ? 'first_response_met' : 'first_response_breached',
            );
          }
        }
        ticket.status = 'resolved';
        ticket.resolvedAt = tx.occurredAt;
        ticket.resolutionCode = trimmed(input.resolutionCode) as string;
        refreshTicketSla(runtime, ticket);
        slaEvent(tx, id, ticket.resolutionSla === 'met' ? 'resolution_met' : 'resolution_breached');
        message(tx, ticket, {
          authorType: 'system',
          visibility: 'internal',
          body: `Ticket resolved with code ${ticket.resolutionCode}.`,
        });
        tx.activityEvent({
          type: 'ticket.resolved',
          subjectType: 'support_ticket',
          subjectId: id,
          subjectLabel: ticket.ticketNumber,
          customerId: ticket.customerId,
          orderId: ticket.relatedOrderId,
          summary: `Ticket ${ticket.ticketNumber} resolved (${ticket.resolutionCode})`,
        });
        return finish(tx, ticket, 'ticket.resolved', ['status', 'resolvedAt', 'resolutionCode']);
      }),

    reopen: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/reopen', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        const ticket = load(runtime, 'tickets', id, 'Ticket');
        if (ticket.status !== 'resolved' && ticket.status !== 'closed')
          throw transition('Ticket', ticket.status, 'be reopened');
        const withinWindow =
          ticket.resolvedAt !== undefined &&
          diffDays(runtime.store.today, ticket.resolvedAt.slice(0, 10)) <= 7;
        if (!withinWindow || ticket.status === 'closed') runtime.require('support.manage');
        else runtime.require('support.change_status');
        open(tx, 'tickets', id, 'Ticket', options);
        ticket.status = 'open';
        delete ticket.resolvedAt;
        delete ticket.resolutionCode;
        delete ticket.closedAt;
        message(tx, ticket, {
          authorType: 'system',
          visibility: 'internal',
          body: `Reopened by ${tx.actor.displayName}: ${input.reason.trim()}`,
        });
        slaEvent(tx, id, 'resolution_resumed');
        return finish(tx, ticket, 'ticket.reopened', ['status']);
      }),

    close: (id: string, options?: MutationOptions): Promise<TicketDetail> =>
      runtime.command('POST /support/tickets/:id/close', options, { id }, (tx) => {
        runtime.require('support.change_status');
        const ticket = open(tx, 'tickets', id, 'Ticket', options);
        if (ticket.status !== 'resolved') throw transition('Ticket', ticket.status, 'be closed');
        ticket.status = 'closed';
        ticket.closedAt = tx.occurredAt;
        return finish(tx, ticket, 'ticket.closed', ['status', 'closedAt']);
      }),

    /** Section 68.5 "Close" — resolved tickets close 72 hours after resolution when the clock advances. */
    autoClose: (tx: Transaction): number => {
      let count = 0;
      const nowMs = Date.parse(runtime.store.now);
      for (const ticket of runtime.store.dataset.tickets.values()) {
        if (ticket.status !== 'resolved' || !ticket.resolvedAt) continue;
        if (nowMs - Date.parse(ticket.resolvedAt) < 72 * 3_600_000) continue;
        tx.touch('tickets', ticket);
        ticket.status = 'closed';
        ticket.closedAt = tx.occurredAt;
        finalize(tx, 'tickets', ticket, 'ticket.auto_closed', 'support_ticket', [
          'status',
          'closedAt',
        ]);
        count += 1;
      }
      return count;
    },
  };
}

export type SupportCommands = ReturnType<typeof createSupportCommands>;
