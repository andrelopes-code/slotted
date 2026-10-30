import {
  SLA_TARGETS,
  businessDateOf,
  businessMinutesBetween,
  notFound,
  type ConversationMessage,
  type SlaEvent,
  type SupportMacro,
  type SupportTicket,
} from '../../domain';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

export interface TicketListItem extends SupportTicket {
  customerName: string;
  customerSegment: string;
  regionCode: string;
  /** Business dates of the ticket's opening and resolution, the days a report counts it on. */
  createdDate: string;
  resolvedDate?: string;
  /** Escalated at any point, whether or not it still is. */
  escalated: boolean;
  /** Business minutes from opening to resolution; absent until resolved. */
  resolutionMinutes?: number;
  assigneeName?: string;
  contactName?: string;
  relatedOrderNumber?: string;
  /** Business minutes remaining on the resolution clock; negative when breached. */
  resolutionMinutesRemaining: number;
  firstResponseMinutesRemaining: number;
  ageBusinessMinutes: number;
}

function slaState(
  minutesUsed: number,
  target: number,
  done: boolean,
  paused: boolean,
): SupportTicket['firstResponseSla'] {
  if (done) return minutesUsed <= target ? 'met' : 'breached';
  if (paused) return 'paused';
  if (minutesUsed > target) return 'breached';
  if (minutesUsed > target * 0.75) return 'at_risk';
  return 'running';
}

/** Recomputes live SLA projections against the demo clock (section 68.4). */
export function refreshTicketSla(runtime: ApiRuntime, ticket: SupportTicket): void {
  const now = runtime.store.now;
  const targets = SLA_TARGETS[ticket.priority];
  const firstUsed = businessMinutesBetween(
    ticket.metadata.createdAt,
    ticket.firstRespondedAt ?? now,
  );
  ticket.firstResponseSla = slaState(
    firstUsed,
    targets.firstResponseMinutes,
    ticket.firstRespondedAt !== undefined,
    false,
  );
  const resolvedOrClosed = ticket.resolvedAt !== undefined || ticket.status === 'closed';
  const resolutionUsed = businessMinutesBetween(
    ticket.metadata.createdAt,
    ticket.resolvedAt ?? (ticket.status === 'pending_customer' ? ticket.metadata.updatedAt : now),
  );
  ticket.resolutionSla = slaState(
    resolutionUsed,
    targets.resolutionMinutes,
    resolvedOrClosed,
    ticket.status === 'pending_customer',
  );
}

export function ticketListItem(runtime: ApiRuntime, ticket: SupportTicket): TicketListItem {
  const { dataset } = runtime.store;
  const now = runtime.store.now;
  const targets = SLA_TARGETS[ticket.priority];
  const customer = dataset.customers.get(ticket.customerId);
  const assignee = ticket.assigneeId ? dataset.users.get(ticket.assigneeId) : undefined;
  const contact = ticket.contactId ? dataset.contacts.get(ticket.contactId) : undefined;
  const order = ticket.relatedOrderId ? dataset.salesOrders.get(ticket.relatedOrderId) : undefined;
  const age = businessMinutesBetween(ticket.metadata.createdAt, now);
  const firstUsed = businessMinutesBetween(
    ticket.metadata.createdAt,
    ticket.firstRespondedAt ?? now,
  );
  const resolutionUsed = businessMinutesBetween(
    ticket.metadata.createdAt,
    ticket.resolvedAt ?? now,
  );
  return {
    ...ticket,
    customerName: customer?.displayName ?? ticket.customerId,
    customerSegment: customer?.segment ?? 'smb',
    regionCode: customer?.regionCode ?? 'US',
    createdDate: businessDateOf(ticket.metadata.createdAt),
    escalated: ticket.escalationReason !== undefined || ticket.status === 'escalated',
    ...(ticket.resolvedAt
      ? {
          resolvedDate: businessDateOf(ticket.resolvedAt),
          resolutionMinutes: businessMinutesBetween(ticket.metadata.createdAt, ticket.resolvedAt),
        }
      : {}),
    resolutionMinutesRemaining: targets.resolutionMinutes - resolutionUsed,
    firstResponseMinutesRemaining: targets.firstResponseMinutes - firstUsed,
    ageBusinessMinutes: age,
    ...(assignee ? { assigneeName: assignee.displayName } : {}),
    ...(contact ? { contactName: contact.displayName } : {}),
    ...(order ? { relatedOrderNumber: order.orderNumber } : {}),
  };
}

export const ticketResource: ResourceDefinition<TicketListItem> = {
  fields: fields<TicketListItem>({
    id: ['string', (item) => item.id],
    ticketNumber: ['string', (item) => item.ticketNumber],
    subject: ['string', (item) => item.subject],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    customerSegment: ['enum', (item) => item.customerSegment],
    regionCode: ['enum', (item) => item.regionCode],
    assigneeId: ['string', (item) => item.assigneeId],
    assigneeName: ['string', (item) => item.assigneeName],
    assigned: ['boolean', (item) => item.assigneeId !== undefined],
    assignedTeamId: ['string', (item) => item.assignedTeamId],
    channel: ['enum', (item) => item.channel],
    category: ['enum', (item) => item.category],
    priority: ['enum', (item) => item.priority],
    status: ['enum', (item) => item.status],
    firstResponseSla: ['enum', (item) => item.firstResponseSla],
    resolutionSla: ['enum', (item) => item.resolutionSla],
    resolutionDueAt: ['datetime', (item) => item.resolutionDueAt],
    firstResponseDueAt: ['datetime', (item) => item.firstResponseDueAt],
    resolutionMinutesRemaining: ['number', (item) => item.resolutionMinutesRemaining],
    messageCount: ['number', (item) => item.messageCount],
    tags: ['array', (item) => item.tags],
    relatedOrderId: ['string', (item) => item.relatedOrderId],
    createdAt: ['datetime', (item) => item.metadata.createdAt],
    createdDate: ['date', (item) => item.createdDate],
    resolvedDate: ['date', (item) => item.resolvedDate],
    escalated: ['boolean', (item) => item.escalated],
    resolutionMinutes: ['number', (item) => item.resolutionMinutes],
    satisfactionScore: ['number', (item) => item.satisfactionScore],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [
    item.ticketNumber,
    item.subject,
    item.customerName,
    item.relatedOrderNumber,
    item.contactName,
  ],
  defaultSort: '-createdAt',
};

export function listTickets(runtime: ApiRuntime, query: ListQuery): ListResponse<TicketListItem> {
  runtime.require('support.view');
  const items: TicketListItem[] = [];
  for (const ticket of runtime.store.dataset.tickets.values()) {
    refreshTicketSla(runtime, ticket);
    items.push(ticketListItem(runtime, ticket));
  }
  return runListQuery(items, ticketResource, query);
}

export interface TicketDetail {
  ticket: TicketListItem;
  messages: (ConversationMessage & { authorName: string })[];
  slaEvents: SlaEvent[];
  customer: {
    id: string;
    displayName: string;
    segment: string;
    health: string;
    accountOwnerName: string;
  };
  relatedOrder?: { id: string; orderNumber: string; status: string; fulfillmentStatus: string };
  relatedInvoice?: {
    id: string;
    invoiceNumber?: string;
    outstanding: unknown;
    collectionState: string;
  };
  relatedSku?: { id: string; sku: string; name: string };
  relatedShipment?: {
    id: string;
    shipmentNumber: string;
    status: string;
    carrier: string;
    trackingNumber?: string;
  };
  macros: SupportMacro[];
}

export function getTicket(runtime: ApiRuntime, id: string): TicketDetail {
  runtime.require('support.view');
  const { dataset } = runtime.store;
  const ticket = dataset.tickets.get(id);
  if (!ticket) throw notFound('Ticket', id);
  refreshTicketSla(runtime, ticket);
  const customer = dataset.customers.get(ticket.customerId);
  if (!customer) throw notFound('Customer', ticket.customerId);
  const internalAllowed = runtime.can('support.reply') || runtime.can('support.manage');
  const order = ticket.relatedOrderId ? dataset.salesOrders.get(ticket.relatedOrderId) : undefined;
  const invoice = ticket.relatedInvoiceId
    ? dataset.invoices.get(ticket.relatedInvoiceId)
    : undefined;
  const sku = ticket.relatedSkuId ? dataset.skus.get(ticket.relatedSkuId) : undefined;
  const shipment = ticket.relatedShipmentId
    ? dataset.shipments.get(ticket.relatedShipmentId)
    : undefined;
  return {
    ticket: ticketListItem(runtime, ticket),
    messages: runtime.indexes.messagesByTicket
      .get(id)
      .filter((message) => internalAllowed || message.visibility === 'public')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((message) => ({
        ...message,
        authorName:
          message.authorType === 'system'
            ? 'Nexora'
            : message.authorUserId
              ? (dataset.users.get(message.authorUserId)?.displayName ?? 'Agent')
              : message.authorContactId
                ? (dataset.contacts.get(message.authorContactId)?.displayName ??
                  customer.displayName)
                : customer.displayName,
      })),
    slaEvents: runtime.indexes.slaEventsByTicket
      .get(id)
      .slice()
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    customer: {
      id: customer.id,
      displayName: customer.displayName,
      segment: customer.segment,
      health: customer.health,
      accountOwnerName:
        dataset.users.get(customer.accountOwnerId)?.displayName ?? customer.accountOwnerId,
    },
    macros: [...dataset.supportMacros.values()].filter((macro) => macro.status === 'active'),
    ...(order
      ? {
          relatedOrder: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            fulfillmentStatus: order.fulfillmentStatus,
          },
        }
      : {}),
    ...(invoice
      ? {
          relatedInvoice: {
            id: invoice.id,
            outstanding: invoice.outstanding,
            collectionState: invoice.collectionState,
            ...(invoice.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
          },
        }
      : {}),
    ...(sku ? { relatedSku: { id: sku.id, sku: sku.sku, name: sku.name } } : {}),
    ...(shipment
      ? {
          relatedShipment: {
            id: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            status: shipment.status,
            carrier: shipment.carrier,
            ...(shipment.trackingNumber ? { trackingNumber: shipment.trackingNumber } : {}),
          },
        }
      : {}),
  };
}

/** A person a ticket can be assigned to (section 14 "assignment controls"). */
export interface SupportAgent {
  id: string;
  displayName: string;
  title?: string;
  role: 'support_agent' | 'support_manager';
  /** Tickets assigned to them that are neither resolved nor closed. */
  openTicketCount: number;
}

/**
 * The active holders of a support role, the people an assignment or an
 * escalation names. A support agent holds no `users.view`, so the support
 * module answers its own roster under `support.view`.
 */
export function listSupportAgents(runtime: ApiRuntime): SupportAgent[] {
  runtime.require('support.view');
  const { dataset } = runtime.store;
  const open = new Map<string, number>();
  for (const ticket of dataset.tickets.values()) {
    if (!ticket.assigneeId || ticket.status === 'resolved' || ticket.status === 'closed') continue;
    open.set(ticket.assigneeId, (open.get(ticket.assigneeId) ?? 0) + 1);
  }
  const agents: SupportAgent[] = [];
  for (const user of dataset.users.values()) {
    if (user.status !== 'active') continue;
    const roles = runtime.indexes.roleAssignmentsByUser
      .get(user.id)
      .map((assignment) => dataset.roles.get(assignment.roleId)?.name);
    const role = roles.includes('Support Manager')
      ? 'support_manager'
      : roles.includes('Support Agent')
        ? 'support_agent'
        : undefined;
    if (!role) continue;
    agents.push({
      id: user.id,
      displayName: user.displayName,
      ...(user.title ? { title: user.title } : {}),
      role,
      openTicketCount: open.get(user.id) ?? 0,
    });
  }
  return agents.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export interface SupportMetrics {
  openTickets: number;
  newTickets: number;
  escalated: number;
  breachedResolution: number;
  atRisk: number;
  firstResponseSlaBps: number;
  averageCsat: number | null;
  byPriority: Record<SupportTicket['priority'], number>;
  byStatus: Record<SupportTicket['status'], number>;
}

/** Section 72.11 plus queue counts for the inbox header. */
export function supportMetrics(runtime: ApiRuntime): SupportMetrics {
  runtime.require('support.view');
  const byPriority: SupportMetrics['byPriority'] = { low: 0, normal: 0, high: 0, urgent: 0 };
  const byStatus: SupportMetrics['byStatus'] = {
    new: 0,
    open: 0,
    pending_customer: 0,
    pending_internal: 0,
    escalated: 0,
    resolved: 0,
    closed: 0,
  };
  let open = 0;
  let escalated = 0;
  let breached = 0;
  let atRisk = 0;
  let responded = 0;
  let withinTarget = 0;
  let csatSum = 0;
  let csatCount = 0;
  for (const ticket of runtime.store.dataset.tickets.values()) {
    refreshTicketSla(runtime, ticket);
    byStatus[ticket.status] += 1;
    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
      open += 1;
      byPriority[ticket.priority] += 1;
      if (ticket.status === 'escalated') escalated += 1;
      if (ticket.resolutionSla === 'breached') breached += 1;
      if (ticket.resolutionSla === 'at_risk') atRisk += 1;
    }
    if (ticket.firstRespondedAt) {
      responded += 1;
      if (ticket.firstResponseSla === 'met') withinTarget += 1;
    }
    if (ticket.satisfactionScore !== undefined) {
      csatSum += ticket.satisfactionScore;
      csatCount += 1;
    }
  }
  return {
    openTickets: open,
    newTickets: byStatus.new,
    escalated,
    breachedResolution: breached,
    atRisk,
    firstResponseSlaBps: responded === 0 ? 0 : Math.round((withinTarget / responded) * 10_000),
    averageCsat: csatCount === 0 ? null : Math.round((csatSum / csatCount) * 10) / 10,
    byPriority,
    byStatus,
  };
}
