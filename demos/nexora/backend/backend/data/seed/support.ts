import {
  ORGANIZATION_ID,
  SLA_TARGETS,
  addBusinessMinutes,
  addDays,
  addMs,
  businessMinutesBetween,
  compareDates,
  diffDays,
  formatBusinessNumber,
  formatId,
  instantMs,
  type ConversationMessage,
  type SlaEvent,
  type SupportMacro,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from '../../domain';
import type { Random } from '../random';
import { RESOLUTION_CODES, TICKET_CATEGORIES, TICKET_SUBJECTS } from '../vocabulary';
import {
  AGENT_REPLIES_BY_CATEGORY,
  INTERNAL_NOTES,
  TICKET_FOLLOWUPS,
  TICKET_OPENERS_BY_CATEGORY,
} from '../corpora';
import type { SeedContext } from './context';
import type { CustomerSeedResult } from './customers';
import { instantOn, metadataAt } from './orders';
import type { TenantSeedResult } from './tenant';
import { dailyVolumeFactor } from './timeline';

export interface TicketOverride {
  customerId?: string;
  subject?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: string;
  relatedOrderId?: string;
  relatedInvoiceId?: string;
  relatedSkuId?: string;
  relatedShipmentId?: string;
  ticketNumber?: string;
  messageCount?: number;
  createdDaysAgo?: number;
  assigneePersona?: string;
  breachFirstResponse?: boolean;
  nearBreach?: boolean;
  escalationReason?: string;
  tags?: string[];
  fixtureKey?: string;
}

export interface SupportSeedResult {
  ticketCount: number;
  agentIds: string[];
}

export function seedSupport(
  context: SeedContext,
  tenant: TenantSeedResult,
  customers: CustomerSeedResult,
  options: {
    overrides?: Map<number, TicketOverride>;
    reservedNumbers?: Set<string>;
    extraTickets?: TicketOverride[];
  } = {},
): SupportSeedResult {
  const { dataset, scale, today, operationalStart } = context;
  const random = context.random('timeline/tickets');
  const reserved = options.reservedNumbers ?? new Set<string>();
  const supportTeamId =
    tenant.teamIdsByCode.get('SUPPORT') ?? (tenant.teamIdsByCode.values().next().value as string);
  const agentRole = tenant.roleIdsByKey.get('support_agent');
  const managerRole = tenant.roleIdsByKey.get('support_manager');
  const agentIds = [...dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        (assignment.roleId === agentRole || assignment.roleId === managerRole) &&
        dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  if (agentIds.length === 0) agentIds.push(tenant.personaUserIds.get('aisha-grant') as string);
  const managerIds = [...dataset.roleAssignments.values()]
    .filter((assignment) => assignment.roleId === managerRole)
    .map((assignment) => assignment.userId);

  // Customer weighting: active customers with materialized orders raise tickets more often.
  const ordersByCustomer = new Map<string, string[]>();
  for (const order of dataset.salesOrders.values()) {
    const bucket = ordersByCustomer.get(order.customerId) ?? [];
    bucket.push(order.id);
    ordersByCustomer.set(order.customerId, bucket);
  }
  const invoicesByCustomer = new Map<string, string[]>();
  for (const invoice of dataset.invoices.values()) {
    const bucket = invoicesByCustomer.get(invoice.customerId) ?? [];
    bucket.push(invoice.id);
    invoicesByCustomer.set(invoice.customerId, bucket);
  }
  const weightedCustomers: string[] = [];
  for (const customer of dataset.customers.values()) {
    if (customer.status === 'closed' || customer.status === 'prospect') continue;
    const weight =
      1 +
      Math.min(12, ordersByCustomer.get(customer.id)?.length ?? 0) +
      (customer.health === 'at_risk' ? 6 : customer.health === 'watch' ? 2 : 0);
    for (let index = 0; index < weight; index += 1) weightedCustomers.push(customer.id);
  }

  const perDay = scale.ticketsPerYear / 365;
  let historyCount = 0;
  const windowTickets: { index: number; date: string }[] = [];
  for (let date = context.historyStart; compareDates(date, today) <= 0; date = addDays(date, 1)) {
    const expected = perDay * dailyVolumeFactor(date, today, scale.historyMonths / 12);
    const count = Math.max(
      0,
      Math.round(expected + random.normal(0, Math.sqrt(Math.max(1, expected)))),
    );
    for (let position = 0; position < count; position += 1) {
      const index = historyCount + windowTickets.length;
      if (compareDates(date, operationalStart) < 0 && !options.overrides?.has(index)) {
        historyCount += 1;
        continue;
      }
      windowTickets.push({ index, date });
    }
  }
  const ticketNumber = (sequence: number): string => {
    let candidate = sequence;
    for (let guard = 0; guard < 8; guard += 1) {
      const number = formatBusinessNumber('ticket', candidate);
      if (!reserved.has(number)) return number;
      candidate += 1;
    }
    return formatBusinessNumber('ticket', candidate);
  };

  const deps = {
    supportTeamId,
    agentIds,
    managerIds,
    ordersByCustomer,
    invoicesByCustomer,
    weightedCustomers,
    customers,
    ticketNumber,
  };
  for (const entry of windowTickets) {
    buildTicket(
      context,
      tenant,
      random.fork(`ticket/${entry.index}`),
      entry.index,
      entry.date,
      options.overrides?.get(entry.index),
      deps,
    );
  }
  let extraIndex = historyCount + windowTickets.length;
  for (const override of options.extraTickets ?? []) {
    const date = addDays(today, -(override.createdDaysAgo ?? 0));
    buildTicket(
      context,
      tenant,
      random.fork(`ticket/${extraIndex}`),
      extraIndex,
      date,
      override,
      deps,
    );
    extraIndex += 1;
  }

  seedMacros(context, tenant);
  return { ticketCount: extraIndex, agentIds };
}

interface TicketDependencies {
  supportTeamId: string;
  agentIds: string[];
  managerIds: string[];
  ordersByCustomer: Map<string, string[]>;
  invoicesByCustomer: Map<string, string[]>;
  weightedCustomers: string[];
  customers: CustomerSeedResult;
  ticketNumber: (sequence: number) => string;
}

function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => tokens[key] ?? key);
}

function buildTicket(
  context: SeedContext,
  tenant: TenantSeedResult,
  random: Random,
  index: number,
  date: string,
  override: TicketOverride | undefined,
  deps: TicketDependencies,
): void {
  const { dataset, today, now } = context;
  const customerId = override?.customerId ?? random.pick(deps.weightedCustomers);
  const contacts = deps.customers.contactsByCustomer.get(customerId) ?? [];
  const contact = contacts.find((entry) => entry.status === 'active') ?? contacts[0];
  const category =
    override?.category ??
    random.weighted(
      TICKET_CATEGORIES.map((value) => ({
        value,
        weight:
          value === 'shipping'
            ? 30
            : value === 'billing'
              ? 20
              : value === 'product'
                ? 18
                : value === 'returns'
                  ? 10
                  : value === 'account'
                    ? 8
                    : value === 'portal'
                      ? 6
                      : value === 'pricing'
                        ? 5
                        : 3,
      })),
    );
  const priority: TicketPriority =
    override?.priority ??
    random.weighted([
      { value: 'low', weight: 14 },
      { value: 'normal', weight: 62 },
      { value: 'high', weight: 20 },
      { value: 'urgent', weight: 4 },
    ]);
  const orderIds = deps.ordersByCustomer.get(customerId) ?? [];
  const relatedOrderId =
    override?.relatedOrderId ??
    ((category === 'shipping' || category === 'returns' || category === 'pricing') &&
    orderIds.length > 0 &&
    random.chance(0.85)
      ? random.pick(orderIds)
      : undefined);
  const invoiceIds = deps.invoicesByCustomer.get(customerId) ?? [];
  const relatedInvoiceId =
    override?.relatedInvoiceId ??
    (category === 'billing' && invoiceIds.length > 0 && random.chance(0.8)
      ? random.pick(invoiceIds)
      : undefined);
  const relatedSkuId =
    override?.relatedSkuId ??
    (category === 'product' && random.chance(0.8)
      ? random.pick(
          context.dataset.skus.size > 0 ? [...context.dataset.skus.keys()].slice(0, 400) : [''],
        )
      : undefined);
  const order = relatedOrderId ? dataset.salesOrders.get(relatedOrderId) : undefined;
  const invoice = relatedInvoiceId ? dataset.invoices.get(relatedInvoiceId) : undefined;
  const sku = relatedSkuId ? dataset.skus.get(relatedSkuId) : undefined;
  const tokens = {
    order: order?.orderNumber ?? 'our last order',
    invoice: invoice?.invoiceNumber ?? 'the latest invoice',
    sku: sku?.name ?? 'the part',
  };
  const subject =
    override?.subject ??
    fill(random.pick(TICKET_SUBJECTS[category] ?? (TICKET_SUBJECTS['other'] as string[])), tokens);
  // A ticket opened today is never opened after the demo clock: an hour drawn past it is
  // mirrored to before it, with no draw of its own, so the random sequence is the one it was.
  const drawn = instantOn(date, random, 7, 19);
  const overshoot = instantMs(drawn) - instantMs(now);
  const createdAt = overshoot > 0 ? addMs(now, -overshoot) : drawn;
  const age = diffDays(today, date);
  const targets = SLA_TARGETS[priority];
  const firstResponseDueAt = addBusinessMinutes(createdAt, targets.firstResponseMinutes);
  const resolutionDueAt = addBusinessMinutes(createdAt, targets.resolutionMinutes);
  const assigneeId = override?.assigneePersona
    ? tenant.personaUserIds.get(override.assigneePersona)
    : random.chance(0.92)
      ? random.pick(deps.agentIds)
      : undefined;

  // First response
  const respondsWithin =
    override?.breachFirstResponse === undefined
      ? random.chance(priority === 'urgent' ? 0.82 : priority === 'high' ? 0.88 : 0.93)
      : !override.breachFirstResponse;
  const responseMinutes = respondsWithin
    ? Math.max(3, Math.round(targets.firstResponseMinutes * random.float(0.1, 0.95)))
    : Math.round(targets.firstResponseMinutes * random.float(1.05, 2.4));
  let firstRespondedAt: string | undefined = addBusinessMinutes(createdAt, responseMinutes);
  if (instantMs(firstRespondedAt) > instantMs(now)) firstRespondedAt = undefined;

  // Resolution
  const resolvesWithin = random.chance(priority === 'urgent' ? 0.7 : 0.84);
  const resolutionMinutes = resolvesWithin
    ? Math.max(15, Math.round(targets.resolutionMinutes * random.float(0.15, 0.95)))
    : Math.round(targets.resolutionMinutes * random.float(1.1, 3.2));
  let resolvedAt: string | undefined = firstRespondedAt
    ? addBusinessMinutes(createdAt, resolutionMinutes)
    : undefined;
  if (resolvedAt && instantMs(resolvedAt) > instantMs(now)) resolvedAt = undefined;
  let closedAt: string | undefined = resolvedAt ? addMs(resolvedAt, 72 * 3_600_000) : undefined;
  if (closedAt && instantMs(closedAt) > instantMs(now)) closedAt = undefined;

  let status: TicketStatus;
  if (override?.status) {
    status = override.status;
    if (status !== 'resolved' && status !== 'closed') {
      resolvedAt = undefined;
      closedAt = undefined;
    }
    if (status === 'new') firstRespondedAt = undefined;
  } else if (closedAt) status = 'closed';
  else if (resolvedAt) status = 'resolved';
  else if (!firstRespondedAt)
    status = age === 0 && !assigneeId ? 'new' : assigneeId ? 'open' : 'new';
  else
    status = random.weighted([
      { value: 'open', weight: 55 },
      { value: 'pending_customer', weight: 22 },
      { value: 'pending_internal', weight: 13 },
      { value: 'escalated', weight: priority === 'urgent' || priority === 'high' ? 18 : 4 },
    ]);
  if (override?.nearBreach) {
    firstRespondedAt = undefined;
    resolvedAt = undefined;
    closedAt = undefined;
    status = 'open';
  }

  const ticketId = formatId('ticket', index + 1);
  const ticket: SupportTicket = {
    id: ticketId,
    organizationId: ORGANIZATION_ID,
    ticketNumber: override?.ticketNumber ?? deps.ticketNumber(index + 1),
    customerId,
    subject,
    description:
      override?.description ??
      fill(
        random.pick(
          TICKET_OPENERS_BY_CATEGORY[category] ?? (TICKET_OPENERS_BY_CATEGORY['other'] as string[]),
        ),
        tokens,
      ),
    channel: random.weighted([
      { value: 'email', weight: 52 },
      { value: 'portal', weight: 24 },
      { value: 'phone', weight: 16 },
      { value: 'chat', weight: 6 },
      { value: 'internal', weight: 2 },
    ]),
    category,
    priority,
    status,
    assignedTeamId: deps.supportTeamId,
    firstResponseDueAt,
    resolutionDueAt,
    firstResponseSla: 'running',
    resolutionSla: 'running',
    messageCount: 0,
    tags:
      override?.tags ??
      (random.chance(0.35)
        ? random.sample(
            ['carrier', 'key-account', 'warranty', 'follow-up', 'credit', 'expedite', 'portal-bug'],
            random.int(1, 2),
          )
        : []),
    metadata: metadataAt(
      createdAt,
      assigneeId ?? 'usr_system',
      createdAt,
      assigneeId ?? 'usr_system',
      1,
    ),
    ...(contact ? { contactId: contact.id } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(relatedOrderId ? { relatedOrderId } : {}),
    ...(relatedInvoiceId ? { relatedInvoiceId } : {}),
    ...(relatedSkuId ? { relatedSkuId } : {}),
    ...(override?.relatedShipmentId ? { relatedShipmentId: override.relatedShipmentId } : {}),
    ...(firstRespondedAt ? { firstRespondedAt } : {}),
    ...(resolvedAt ? { resolvedAt, resolutionCode: random.pick(RESOLUTION_CODES) } : {}),
    ...(closedAt ? { closedAt } : {}),
    ...(status === 'escalated'
      ? {
          escalationReason:
            override?.escalationReason ??
            random.pick([
              'Customer threatened to cancel the account',
              'Repeated carrier failure on the same lane',
              'Production line down at customer site',
              'Billing dispute above $10,000',
            ]),
        }
      : {}),
    ...(resolvedAt && random.chance(0.6)
      ? {
          satisfactionScore: random.weighted([
            { value: 5, weight: 45 },
            { value: 4, weight: 30 },
            { value: 3, weight: 14 },
            { value: 2, weight: 7 },
            { value: 1, weight: 4 },
          ]),
        }
      : {}),
  };

  // SLA projections
  const firstMinutesUsed = businessMinutesBetween(createdAt, firstRespondedAt ?? now);
  ticket.firstResponseSla = firstRespondedAt
    ? firstMinutesUsed <= targets.firstResponseMinutes
      ? 'met'
      : 'breached'
    : firstMinutesUsed > targets.firstResponseMinutes
      ? 'breached'
      : firstMinutesUsed > targets.firstResponseMinutes * 0.75
        ? 'at_risk'
        : 'running';
  const resolutionMinutesUsed = businessMinutesBetween(createdAt, resolvedAt ?? now);
  ticket.resolutionSla = resolvedAt
    ? resolutionMinutesUsed <= targets.resolutionMinutes
      ? 'met'
      : 'breached'
    : status === 'pending_customer'
      ? 'paused'
      : resolutionMinutesUsed > targets.resolutionMinutes
        ? 'breached'
        : resolutionMinutesUsed > targets.resolutionMinutes * 0.75
          ? 'at_risk'
          : 'running';

  // Conversation
  const messages: ConversationMessage[] = [];
  const messageTarget =
    override?.messageCount ??
    (status === 'new'
      ? 1
      : random.weighted([
          { value: 2, weight: 30 },
          { value: 3, weight: 25 },
          { value: 4, weight: 18 },
          { value: random.int(5, 8), weight: 20 },
          { value: random.int(9, 16), weight: 7 },
        ]));
  let cursor = createdAt;
  const lastAllowed = closedAt ?? resolvedAt ?? now;
  const addMessage = (
    authorType: ConversationMessage['authorType'],
    body: string,
    visibility: ConversationMessage['visibility'],
    at: string,
  ): void => {
    const message: ConversationMessage = {
      id: formatId('conversationMessage', index * 200 + messages.length + 1),
      organizationId: ORGANIZATION_ID,
      ticketId,
      authorType,
      visibility,
      body,
      attachmentIds: [],
      createdAt: at,
      ...(authorType === 'user'
        ? { authorUserId: assigneeId ?? (deps.agentIds[0] as string) }
        : contact
          ? { authorContactId: contact.id }
          : {}),
    };
    messages.push(message);
    dataset.conversationMessages.set(message.id, message);
    if (authorType === 'customer') ticket.lastCustomerMessageAt = at;
    if (authorType === 'user' && visibility === 'public') ticket.lastAgentMessageAt = at;
  };
  addMessage('customer', ticket.description, 'public', createdAt);
  if (firstRespondedAt) {
    addMessage(
      'user',
      random.pick(
        AGENT_REPLIES_BY_CATEGORY[category] ?? (AGENT_REPLIES_BY_CATEGORY['other'] as string[]),
      ),
      'public',
      firstRespondedAt,
    );
    cursor = firstRespondedAt;
  }
  while (messages.length < messageTarget) {
    const next = addMs(cursor, random.int(30, 60 * 30) * 60_000);
    if (instantMs(next) > instantMs(lastAllowed)) break;
    const roll = random.next();
    if (roll < 0.4) addMessage('customer', random.pick(TICKET_FOLLOWUPS), 'public', next);
    else if (roll < 0.8)
      addMessage(
        'user',
        random.pick(
          AGENT_REPLIES_BY_CATEGORY[category] ?? (AGENT_REPLIES_BY_CATEGORY['other'] as string[]),
        ),
        'public',
        next,
      );
    else addMessage('user', random.pick(INTERNAL_NOTES), 'internal', next);
    cursor = next;
  }
  if (resolvedAt)
    addMessage(
      'system',
      `Ticket resolved with code ${ticket.resolutionCode}.`,
      'internal',
      resolvedAt,
    );
  ticket.messageCount = messages.length;
  ticket.metadata.updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;
  ticket.metadata.version = Math.max(1, messages.length);
  dataset.tickets.set(ticketId, ticket);
  if (override?.fixtureKey) dataset.fixtures.set(override.fixtureKey, ticketId);

  // SLA events (section 89.38)
  const events: Omit<SlaEvent, 'id' | 'organizationId' | 'ticketId'>[] = [
    { type: 'first_response_started', occurredAt: createdAt },
    { type: 'resolution_started', occurredAt: createdAt },
  ];
  if (firstRespondedAt)
    events.push({
      type: ticket.firstResponseSla === 'met' ? 'first_response_met' : 'first_response_breached',
      occurredAt: firstRespondedAt,
    });
  else if (ticket.firstResponseSla === 'breached')
    events.push({ type: 'first_response_breached', occurredAt: firstResponseDueAt });
  if (status === 'pending_customer')
    events.push({ type: 'resolution_paused', occurredAt: ticket.metadata.updatedAt });
  if (resolvedAt)
    events.push({
      type: ticket.resolutionSla === 'met' ? 'resolution_met' : 'resolution_breached',
      occurredAt: resolvedAt,
    });
  else if (ticket.resolutionSla === 'breached')
    events.push({ type: 'resolution_breached', occurredAt: resolutionDueAt });
  for (const [position, event] of events.entries()) {
    const slaEvent: SlaEvent = {
      id: formatId('slaEvent', index * 8 + position + 1),
      organizationId: ORGANIZATION_ID,
      ticketId,
      ...event,
    };
    dataset.slaEvents.set(slaEvent.id, slaEvent);
  }
  void tenant;
}

function seedMacros(context: SeedContext, tenant: TenantSeedResult): void {
  const { dataset, now } = context;
  const manager = tenant.personaUserIds.get('aisha-grant') as string;
  const macros: Omit<SupportMacro, 'id' | 'organizationId' | 'metadata'>[] = [
    {
      name: 'Acknowledge shipping delay',
      body: 'Thanks for flagging this. I have contacted the carrier and will update you within one business day.',
      setStatus: 'pending_internal',
      addTags: ['carrier'],
      status: 'active',
    },
    {
      name: 'Request damage photos',
      body: 'Could you share photos of the packaging and the damaged items? They allow us to file the carrier claim immediately.',
      setStatus: 'pending_customer',
      addTags: ['claim'],
      status: 'active',
    },
    {
      name: 'RMA issued',
      body: 'Your RMA has been issued and a prepaid return label is attached. We will inspect the return within two business days of receipt.',
      setStatus: 'pending_customer',
      addTags: ['rma'],
      status: 'active',
    },
    {
      name: 'Invoice copy sent',
      body: 'A copy of the invoice is attached. Let us know if your AP team needs anything else.',
      setStatus: 'resolved',
      addTags: [],
      status: 'active',
    },
    {
      name: 'Portal password reset',
      body: 'A password reset link has been sent to the email on file. It expires in 24 hours.',
      setStatus: 'pending_customer',
      addTags: ['portal'],
      status: 'active',
    },
    {
      name: 'Escalate to warehouse manager',
      body: 'Escalating to the warehouse manager for priority handling.',
      setStatus: 'open',
      addTags: ['expedite'],
      status: 'active',
    },
    {
      name: 'Legacy: fax confirmation',
      body: 'A fax confirmation has been sent.',
      addTags: [],
      status: 'inactive',
    },
  ];
  for (const [index, macro] of macros.entries()) {
    const id = formatId('supportMacro', index + 1);
    dataset.supportMacros.set(id, {
      id,
      organizationId: ORGANIZATION_ID,
      ...macro,
      metadata: metadataAt(
        addMs(now, -400 * 24 * 3_600_000),
        manager,
        addMs(now, -400 * 24 * 3_600_000),
        manager,
        1,
      ),
    });
  }
}
