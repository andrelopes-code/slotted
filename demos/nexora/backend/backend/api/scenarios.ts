import {
  usdMinor,
  ORGANIZATION_ID,
  addBusinessMinutes,
  addDays,
  businessDateToInstant,
  compareDates,
  formatBusinessNumber,
  formatId,
  lastBusinessDayOfMonth,
  milliToQuantity,
  parseBusinessDate,
  quantityToMilli,
  addMoney,
  money,
  usd,
  SLA_TARGETS,
  type ApprovalRequest,
  type BankTransaction,
  type Customer,
  type SalesOrder,
  type StockMovement,
  type SupportTicket,
  type ConversationMessage,
} from '../domain';
import { createRandom } from '../data/random';
import type { ScaleProfile } from '../data/scale';
import type { ApiRuntime, WorkflowEventRefs } from './runtime';
import type { WorkflowTriggerType } from '../domain';

/** A section 69.1 event a scenario wrote as a fact; the engine runs it once the scenario stands. */
export interface ScenarioEvent {
  type: WorkflowTriggerType;
  refs: WorkflowEventRefs;
}

export type ScenarioId =
  | 'healthy'
  | 'new_tenant'
  | 'enterprise_scale'
  | 'heavy_data'
  | 'month_end'
  | 'inventory_crisis'
  | 'collections_pressure'
  | 'restricted_user'
  | 'support_incident'
  | 'system_degraded';

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  description: string;
  /** Structural scenarios reset the dataset before the overlay (section 74.6). */
  structural: boolean;
  scale?: ScaleProfile['id'];
  persona?: string;
}

/** Section 77 — scenario catalog. */
export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: 'healthy',
    name: 'Healthy Operations',
    description: 'Default baseline: normal latency, limited exceptions, receivables within range.',
    structural: true,
  },
  {
    id: 'new_tenant',
    name: 'New Tenant',
    description:
      '14 customers, 24 SKUs, 2 suppliers, 1 warehouse and 30 days of history; empty states and onboarding tasks.',
    structural: true,
    scale: 'new_tenant',
    persona: 'maya-chen',
  },
  {
    id: 'enterprise_scale',
    name: 'Enterprise Scale',
    description:
      'Customers ×4, SKUs ×3 and transaction history ×5; larger pagination totals and search volumes.',
    structural: true,
    scale: 'enterprise',
  },
  {
    id: 'heavy_data',
    name: 'Heavy Data',
    description:
      'Difficult UI records: 148-line order, 28-contact customer, 120-message ticket, product with 40 supplier mappings, long names and notes.',
    structural: true,
    scale: 'heavy_data',
  },
  {
    id: 'month_end',
    name: 'Month End',
    description:
      'Last business day of the month; invoices due within 5 days ×2.5, unmatched bank transactions ×3, approval queue ×1.8.',
    structural: true,
    persona: 'priya-shah',
  },
  {
    id: 'inventory_crisis',
    name: 'Inventory Crisis',
    description:
      '42 SKUs below safety stock, 17 confirmed orders short, 8 urgent purchase orders, 3 warehouses affected; MX-240 shortage active.',
    structural: true,
    persona: 'marcus-lee',
  },
  {
    id: 'collections_pressure',
    name: 'Collections Pressure',
    description:
      'Overdue receivables ×2.2, 18 customers above 90% credit utilization, 6 customers on hold.',
    structural: true,
    persona: 'priya-shah',
  },
  {
    id: 'restricted_user',
    name: 'Restricted User',
    description:
      'Jordan Wells, warehouse operator scoped to CHI-01: no finance, role management or broad CRM access.',
    structural: true,
    persona: 'jordan-wells',
  },
  {
    id: 'support_incident',
    name: 'Support Incident',
    description:
      'Shipment incident at a strategic customer: 12 related tickets (3 high, 1 urgent), one SLA breach, queue load ×2.',
    structural: true,
    persona: 'aisha-grant',
  },
  {
    id: 'system_degraded',
    name: 'System Degraded',
    description:
      'Transport profile only: 700 ms base latency with jitter, finance overview 35% unavailable, activity 15%, writes 5% retryable failures.',
    structural: false,
  },
];

export function scenarioScale(scenario: ScenarioId | undefined): ScaleProfile['id'] | undefined {
  return SCENARIOS.find((entry) => entry.id === scenario)?.scale;
}

/** Applies a deterministic overlay on top of the canonical seed. */
export function applyScenario(runtime: ApiRuntime, scenario: ScenarioId): ScenarioEvent[] {
  /* Taken before the scenario rewrites the dataset, as `Transaction` does. */
  if (scenario !== 'healthy') void runtime.store.history.summaries;
  switch (scenario) {
    case 'month_end':
      applyMonthEnd(runtime);
      return [];
    case 'inventory_crisis':
      applyInventoryCrisis(runtime);
      return [];
    case 'collections_pressure':
      applyCollectionsPressure(runtime);
      return [];
    case 'support_incident':
      return applySupportIncident(runtime);
    case 'heavy_data':
      applyHeavyData(runtime);
      return [];
    case 'system_degraded':
      runtime.latency.profile = 'degraded';
      return [];
    default:
      return [];
  }
}

function applyMonthEnd(runtime: ApiRuntime): void {
  const { store } = runtime;
  const random = createRandom(store.metadata.seedVersion, 'scenario/month-end');
  const { year, month } = parseBusinessDate(store.today);
  const lastDay = lastBusinessDayOfMonth(year, month);
  if (compareDates(lastDay, store.today) < 0) {
    const next =
      month === 12 ? lastBusinessDayOfMonth(year + 1, 1) : lastBusinessDayOfMonth(year, month + 1);
    store.metadata.demoClock = businessDateToInstant(next, 15);
  } else {
    store.metadata.demoClock = businessDateToInstant(lastDay, 15);
  }
  const today = store.today;
  store.batch(() => {
    // Invoices due within 5 days ×2.5.
    const open = [...store.dataset.invoices.values()].filter(
      (invoice) => invoice.lifecycle === 'open' && invoice.outstanding.minor > 0,
    );
    const dueSoon = open.filter(
      (invoice) =>
        compareDates(invoice.dueDate, today) >= 0 &&
        compareDates(invoice.dueDate, addDays(today, 5)) <= 0,
    );
    const target = Math.round(dueSoon.length * 2.5);
    const candidates = open.filter(
      (invoice) => compareDates(invoice.dueDate, addDays(today, 6)) > 0,
    );
    for (const invoice of random.sample(candidates, Math.max(0, target - dueSoon.length)))
      invoice.dueDate = addDays(today, random.int(0, 5));
    store.invalidate('invoices');
    // Unmatched bank transactions ×3.
    const unmatched = [...store.dataset.bankTransactions.values()].filter(
      (transaction) =>
        transaction.status === 'suggested' ||
        transaction.status === 'needs_review' ||
        transaction.status === 'unmatched',
    );
    const openInvoices = open.filter(
      (invoice) => compareDates(invoice.dueDate, addDays(today, 10)) <= 0,
    );
    let counter = 0;
    for (let index = 0; index < unmatched.length * 2 && openInvoices.length > 0; index += 1) {
      const invoice = random.pick(openInvoices);
      const customer = store.dataset.customers.get(invoice.customerId);
      counter += 1;
      const transaction: BankTransaction = {
        id: formatId('bankTransaction', 700_000 + counter),
        organizationId: ORGANIZATION_ID,
        postedDate: addDays(today, -random.int(0, 3)),
        // language: pt-BR
        description: `${random.pick(invoice.currency === 'BRL' ? ['PIX RECEBIDO', 'TED RECEBIDA', 'LIQ BOLETO'] : ['ACH CREDIT', 'FED WIRE IN', 'LOCKBOX DEPOSIT'])} ${(customer?.legalName ?? '').toUpperCase().replace(/[.,]/g, '').slice(0, 22)}`,
        // language: en-US
        amount: money(
          random.chance(0.6)
            ? invoice.outstanding.minor
            : Math.round(invoice.outstanding.minor * random.float(0.5, 1.2)),
          invoice.currency,
        ),
        status: random.chance(0.6) ? 'suggested' : 'needs_review',
        candidates: [],
        metadata: {
          id: '',
          organizationId: ORGANIZATION_ID,
          createdAt: store.now,
          createdBy: 'usr_system',
          updatedAt: store.now,
          updatedBy: 'usr_system',
          version: 1,
        },
      };
      transaction.metadata.id = transaction.id;
      store.put('bankTransactions', transaction);
    }
    // Approval queue ×1.8: recent confirmed orders re-enter approval.
    const pending = [...store.dataset.approvalRequests.values()].filter(
      (request) => request.status === 'pending',
    );
    const recent = [...store.dataset.salesOrders.values()].filter(
      (order) =>
        order.status === 'confirmed' &&
        order.fulfillmentStatus === 'unfulfilled' &&
        !order.approvalRequestId,
    );
    const sofia = store.seed.personaUserIds.get('sofia-ramirez') as string;
    for (const order of random.sample(recent, Math.round(pending.length * 0.8))) {
      const request: ApprovalRequest = {
        id: formatId('approvalRequest', 700_000 + Number(order.id.slice(4))),
        organizationId: ORGANIZATION_ID,
        targetType: 'sales_order',
        targetId: order.id,
        targetNumber: order.orderNumber,
        policyCode: 'sales_order.v1',
        reasons: ['month-end credit review'],
        status: 'pending',
        requestedBy: order.ownerId,
        requestedAt: store.now,
        amount: addMoney(order.subtotal, order.freight),
        steps: [
          {
            id: `aps_${order.id.slice(4)}_1`,
            sequence: 1,
            requiredRole: 'sales_manager',
            assignedUserId: sofia,
            status: 'pending',
          },
        ],
        metadata: {
          id: '',
          organizationId: ORGANIZATION_ID,
          createdAt: store.now,
          createdBy: order.ownerId,
          updatedAt: store.now,
          updatedBy: order.ownerId,
          version: 1,
        },
      };
      request.metadata.id = request.id;
      store.put('approvalRequests', request);
      order.status = 'pending_approval';
      order.approvalStatus = 'pending';
      order.approvalRequestId = request.id;
      for (const reservation of runtime.indexes.reservationsByOrder.get(order.id))
        if (reservation.status === 'active') reservation.status = 'released';
      store.invalidate('reservations');
    }
    store.invalidate('salesOrders');
    const priya = store.seed.personaUserIds.get('priya-shah') as string;
    for (const [index, title] of [
      'Month-end close checklist ready',
      'AR aging report generated',
      'Unmatched deposits require review',
    ].entries()) {
      store.put('notifications', {
        id: formatId('notification', 700_000 + index + 1),
        organizationId: ORGANIZATION_ID,
        userId: priya,
        type: index === 2 ? 'action_required' : 'info',
        title,
        body: 'Month-end scenario',
        createdAt: store.now,
      });
    }
  });
  runtime.projections.refreshCollectionStates();
}

function applyInventoryCrisis(runtime: ApiRuntime): void {
  const { store, indexes, projections } = runtime;
  const random = createRandom(store.metadata.seedVersion, 'scenario/inventory-crisis');
  const today = store.today;
  store.batch(() => {
    // Exactly 42 SKUs below safety stock across 3 warehouses.
    const positions = [...projections.inventory().values()].filter(
      (position) =>
        !position.belowSafetyStock &&
        quantityToMilli(position.onHand) > 0 &&
        quantityToMilli(position.safetyStock) > 0,
    );
    const warehouses = random.sample([...store.dataset.warehouses.keys()], 3);
    const seen = new Set<string>();
    const belowNow = new Set(
      [...projections.inventory().values()]
        .filter((position) => position.belowSafetyStock)
        .map((position) => position.skuId),
    );
    let created = 0;
    const needed = Math.max(0, 42 - belowNow.size);
    let counter = 0;
    for (const position of random.shuffle(positions)) {
      if (created >= needed) break;
      if (
        !warehouses.includes(position.warehouseId) ||
        seen.has(position.skuId) ||
        belowNow.has(position.skuId)
      )
        continue;
      seen.add(position.skuId);
      const sellable = quantityToMilli(position.sellableOnHand);
      const safety = quantityToMilli(position.safetyStock);
      const drop = sellable - Math.max(0, Math.floor(safety / 2));
      if (drop <= 0) continue;
      counter += 1;
      const movement: StockMovement = {
        id: formatId('stockMovement', 700_000_000 + counter),
        organizationId: ORGANIZATION_ID,
        type: 'adjustment_out',
        skuId: position.skuId,
        warehouseId: position.warehouseId,
        onHandDelta: milliToQuantity(-drop),
        damagedDelta: '0',
        quarantineDelta: '0',
        sourceEntityType: 'manual_adjustment',
        sourceEntityId: 'scenario:inventory-crisis',
        reason: 'count_correction: cycle count found shortage after supplier recall',
        occurredAt: store.now,
        actorId: 'usr_system',
      };
      store.put('stockMovements', movement);
      created += 1;
    }
    // 17 confirmed orders with allocation shortage.
    const confirmed = [...store.dataset.salesOrders.values()].filter(
      (order) =>
        order.status === 'confirmed' &&
        order.allocationStatus === 'allocated' &&
        order.fulfillmentStatus === 'unfulfilled',
    );
    for (const order of random.sample(confirmed, 17)) {
      const reservations = indexes.reservationsByOrder
        .get(order.id)
        .filter((reservation) => reservation.status === 'active');
      const victim = reservations[0];
      if (!victim) continue;
      victim.status = 'released';
      order.metadata.updatedAt = store.now;
    }
    store.invalidate('reservations');
    // 8 urgent/delayed purchase orders.
    const open = [...store.dataset.purchaseOrders.values()].filter(
      (po) =>
        (po.status === 'sent' || po.status === 'acknowledged') &&
        !po.exceptionFlags.includes('delayed'),
    );
    for (const po of random.sample(open, 8)) {
      po.exceptionFlags.push('delayed');
      po.expectedDate = addDays(today, -random.int(2, 12));
      po.notes = `URGENT — ${po.notes ?? 'supplier recall; expedite replacement lot.'}`;
      po.metadata.updatedAt = store.now;
    }
    store.invalidate('purchaseOrders');
    const marcus = store.seed.personaUserIds.get('marcus-lee') as string;
    store.put('notifications', {
      id: formatId('notification', 700_100),
      organizationId: ORGANIZATION_ID,
      userId: marcus,
      type: 'action_required',
      title: '42 SKUs below safety stock',
      body: 'Supplier recall impacted three warehouses; review reorder suggestions.',
      createdAt: store.now,
    });
    store.put('tasks', {
      id: formatId('task', 700_001),
      organizationId: ORGANIZATION_ID,
      title: 'Expedite replacement lots for recalled SKUs',
      assigneeId: marcus,
      createdBy: 'usr_system_automation',
      dueDate: addDays(today, 1),
      priority: 'high',
      status: 'open',
      createdAt: store.now,
    });
  });
  for (const order of store.dataset.salesOrders.values())
    if (order.status === 'confirmed') projections.recalculateOrder(order);
  store.invalidate('salesOrders');
}

function applyCollectionsPressure(runtime: ApiRuntime): void {
  const { store, projections } = runtime;
  const random = createRandom(store.metadata.seedVersion, 'scenario/collections-pressure');
  const today = store.today;
  store.batch(() => {
    const open = [...store.dataset.invoices.values()].filter(
      (invoice) => invoice.lifecycle === 'open' && invoice.outstanding.minor > 0,
    );
    // Measured as the overview measures it (§72.6): in US dollars, whatever each invoice is written in.
    const worth = (invoice: (typeof open)[number]) =>
      usdMinor(invoice.outstanding, invoice.fxRateToUsd);
    let overdueUsd = 0;
    for (const invoice of open)
      if (invoice.collectionState === 'overdue') overdueUsd += worth(invoice);
    const target = overdueUsd * 2.2;
    const current = open
      .filter(
        (invoice) =>
          invoice.collectionState === 'current' && compareDates(invoice.dueDate, today) >= 0,
      )
      .sort((a, b) => worth(b) - worth(a));
    let added = 0;
    for (const invoice of current) {
      if (overdueUsd + added >= target) break;
      invoice.dueDate = addDays(today, -random.int(3, 45));
      added += worth(invoice);
    }
    store.invalidate('invoices');
  });
  projections.refreshCollectionStates();
  store.batch(() => {
    // 18 customers above 90% utilization: lower credit limits of the most exposed active accounts.
    const active = [...store.dataset.customers.values()].filter(
      (customer) => customer.status === 'active',
    );
    const exposed = active
      .map((customer) => ({ customer, summary: projections.customerSummary(customer.id) }))
      .filter(
        (entry) =>
          entry.summary.creditExposure.minor > 0 && entry.summary.creditUtilizationBps < 9_000,
      )
      .sort((a, b) => b.summary.creditUtilizationBps - a.summary.creditUtilizationBps);
    const currentlyAbove = active.filter(
      (customer) => projections.customerSummary(customer.id).creditUtilizationBps >= 9_000,
    ).length;
    for (const entry of exposed.slice(0, Math.max(0, 18 - currentlyAbove))) {
      entry.customer.creditLimit = money(
        Math.max(100_000, Math.round(entry.summary.creditExposure.minor / 0.95 / 100) * 100),
        entry.customer.preferredCurrency,
      );
      entry.customer.metadata.updatedAt = store.now;
    }
    // 6 customers on hold.
    const onHold = active.filter((customer) => customer.status === 'on_hold').length;
    const candidates = exposed
      .slice(0, 40)
      .map((entry) => entry.customer)
      .filter(
        (customer) => customer.id !== store.dataset.fixtures.get('flagship.customer.meridian'),
      );
    for (const customer of random.sample(candidates, Math.max(0, 6 - onHold))) {
      customer.status = 'on_hold';
      customer.holdReason = 'Overdue receivables beyond 60 days';
      customer.health = 'at_risk';
      customer.metadata.updatedAt = store.now;
    }
    store.invalidate('customers');
    const priya = store.seed.personaUserIds.get('priya-shah') as string;
    for (const [index, customer] of [...store.dataset.customers.values()]
      .filter((entry) => entry.status === 'on_hold')
      .slice(0, 6)
      .entries()) {
      store.put('tasks', {
        id: formatId('task', 700_100 + index),
        organizationId: ORGANIZATION_ID,
        title: `Collections call: ${customer.displayName}`,
        assigneeId: priya,
        createdBy: priya,
        dueDate: addDays(today, index % 3),
        priority: 'high',
        status: 'open',
        relatedEntityType: 'customer',
        relatedEntityId: customer.id,
        createdAt: store.now,
      });
    }
  });
}

/** Section 77.9 — the incident's tickets; its one escalation is answered as an escalation (section 69.1). */
function applySupportIncident(runtime: ApiRuntime): ScenarioEvent[] {
  const { store, indexes } = runtime;
  const random = createRandom(store.metadata.seedVersion, 'scenario/support-incident');
  const now = store.now;
  const events: ScenarioEvent[] = [];
  store.batch(() => {
    const strategic =
      [...store.dataset.customers.values()].find(
        (customer) =>
          customer.segment === 'strategic' &&
          customer.status === 'active' &&
          indexes.shipmentsByOrder.get(indexes.ordersByCustomer.get(customer.id)[0]?.id ?? '')
            .length > 0,
      ) ??
      [...store.dataset.customers.values()].find((customer) => customer.segment === 'strategic');
    if (!strategic) return;
    const orders = indexes.ordersByCustomer
      .get(strategic.id)
      .filter((order) => order.status === 'confirmed' || order.status === 'closed');
    const shipment = orders
      .flatMap((order) => indexes.shipmentsByOrder.get(order.id))
      .find(
        (entry) =>
          entry.status === 'in_transit' ||
          entry.status === 'shipped' ||
          entry.status === 'delivered',
      );
    if (shipment) {
      shipment.status = 'exception';
      shipment.exceptionCode = 'DAMAGED_IN_TRANSIT';
      shipment.exceptionMessage =
        'Trailer fire at carrier hub; entire consignment written off by the carrier.';
      shipment.metadata.updatedAt = now;
      store.invalidate('shipments');
    }
    const affected = [
      strategic,
      ...random.sample(
        [...store.dataset.customers.values()].filter(
          (customer) => customer.status === 'active' && customer.id !== strategic.id,
        ),
        6,
      ),
    ];
    const supportTeam =
      [...store.dataset.teams.values()].find((team) => team.type === 'support')?.id ?? '';
    const agents = [...store.dataset.roleAssignments.values()]
      .filter((assignment) => store.dataset.roles.get(assignment.roleId)?.name === 'Support Agent')
      .map((assignment) => assignment.userId);
    const priorities: SupportTicket['priority'][] = [
      'urgent',
      'high',
      'high',
      'high',
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'low',
      'normal',
    ];
    const baseCount = [...store.dataset.tickets.values()].filter(
      (ticket) => ticket.status !== 'closed' && ticket.status !== 'resolved',
    ).length;
    const total = Math.max(12, baseCount);
    let maxNumber = 0;
    for (const ticket of store.dataset.tickets.values())
      maxNumber = Math.max(maxNumber, Number(ticket.ticketNumber.slice(4)) || 0);
    for (let index = 0; index < total; index += 1) {
      const incident = index < 12;
      const customer = incident
        ? index === 0
          ? strategic
          : random.pick(affected)
        : random.pick(affected);
      const priority = incident
        ? (priorities[index] as SupportTicket['priority'])
        : random.pick(['normal', 'normal', 'high', 'low'] as SupportTicket['priority'][]);
      const createdAt = new Date(Date.parse(now) - random.int(1, 30) * 3_600_000)
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z');
      const targets = SLA_TARGETS[priority];
      const breach = index === 1;
      const ticket: SupportTicket = {
        id: formatId('ticket', 700_000 + index + 1),
        organizationId: ORGANIZATION_ID,
        ticketNumber: formatBusinessNumber('ticket', maxNumber + index + 1),
        customerId: customer.id,
        subject: incident
          ? random.pick([
              'Consignment lost in carrier hub fire — replacement needed',
              'Delivery missing after carrier incident',
              'Need ETA on replacement shipment after hub fire',
              'Damaged goods claim — carrier incident',
            ])
          : random.pick([
              'Portal login issue',
              'Invoice copy request',
              'Backorder ETA request',
              'Pricing question',
            ]),
        description: incident
          ? `Our shipment was on the trailer involved in the carrier hub fire. Production is affected and we need a replacement plan${index === 0 ? ' today' : ''}.`
          : 'General inquiry raised during the incident window.',
        channel: random.pick(['email', 'phone', 'portal']),
        category: incident ? 'shipping' : random.pick(['portal', 'billing', 'product', 'pricing']),
        priority,
        status:
          index === 0 ? 'escalated' : random.pick(['new', 'open', 'open', 'pending_internal']),
        assignedTeamId: supportTeam,
        firstResponseDueAt: addBusinessMinutes(createdAt, targets.firstResponseMinutes),
        resolutionDueAt: addBusinessMinutes(createdAt, targets.resolutionMinutes),
        firstResponseSla: breach ? 'breached' : 'running',
        resolutionSla: 'running',
        messageCount: 1,
        tags: incident ? ['carrier-incident'] : [],
        metadata: {
          id: '',
          organizationId: ORGANIZATION_ID,
          createdAt,
          createdBy: 'usr_system',
          updatedAt: createdAt,
          updatedBy: 'usr_system',
          version: 1,
        },
        ...(index === 0
          ? { escalationReason: 'Strategic customer production stoppage after carrier incident' }
          : {}),
        ...(agents.length > 0 && random.chance(0.8) ? { assigneeId: random.pick(agents) } : {}),
        ...(shipment && incident
          ? { relatedShipmentId: shipment.id, relatedOrderId: shipment.orderId }
          : {}),
      };
      ticket.metadata.id = ticket.id;
      store.put('tickets', ticket);
      if (ticket.status === 'escalated')
        events.push({
          type: 'ticket.escalated',
          refs: { ticketId: ticket.id, customerId: ticket.customerId },
        });
      const message: ConversationMessage = {
        id: formatId('conversationMessage', 700_000 + index + 1),
        organizationId: ORGANIZATION_ID,
        ticketId: ticket.id,
        authorType: 'customer',
        visibility: 'public',
        body: ticket.description,
        attachmentIds: [],
        createdAt,
      };
      store.put('conversationMessages', message);
    }
    const aisha = store.seed.personaUserIds.get('aisha-grant') as string;
    store.put('notifications', {
      id: formatId('notification', 700_200),
      organizationId: ORGANIZATION_ID,
      userId: aisha,
      type: 'action_required',
      title: 'Carrier incident — 12 tickets opened',
      body: `${strategic.displayName} and six other customers are affected.`,
      createdAt: now,
    });
  });
  return events;
}

function applyHeavyData(runtime: ApiRuntime): void {
  const { store, indexes } = runtime;
  const random = createRandom(store.metadata.seedVersion, 'scenario/heavy-data');
  store.batch(() => {
    // Product with 40 supplier mappings.
    const product = [...store.dataset.products.values()].find(
      (entry) => entry.status === 'active' && indexes.skusByProduct.get(entry.id).length > 0,
    );
    const sku = product ? indexes.skusByProduct.get(product.id)[0] : undefined;
    if (product && sku) {
      const existing = new Set(
        indexes.mappingsBySku.get(sku.id).map((mapping) => mapping.supplierId),
      );
      const suppliers = [...store.dataset.suppliers.values()].filter(
        (supplier) => supplier.status === 'active' && !existing.has(supplier.id),
      );
      for (const [index, supplier] of random
        .sample(suppliers, Math.max(0, 40 - existing.size))
        .entries()) {
        store.put('supplierSkuMappings', {
          id: formatId('supplierSkuMapping', 700_000 + index + 1),
          organizationId: ORGANIZATION_ID,
          supplierId: supplier.id,
          skuId: sku.id,
          supplierSku: `${random.letters(2)}${random.digits(6)}`,
          unitCost: usd(Math.round(sku.standardCost.minor * random.float(0.95, 1.25))),
          minimumOrderQuantity: '1',
          packMultiple: '1',
          leadTimeDays: random.int(3, 40),
          currency: 'USD',
          status: 'active',
          isPreferred: false,
        });
      }
      store.dataset.fixtures.set('edge.product.many_suppliers', product.id);
      product.name = `${product.name} — Extended Temperature Range, Conformal Coated, with Integrated Diagnostics Module and Remote Telemetry Option (Long Description Variant)`;
      product.description = `${product.description} ${'This variant is intended for continuous-duty installations in washdown and high-vibration environments; consult the engineering bulletin before substituting. '.repeat(6)}`;
      store.invalidate('products');
    }
    const meridian = store.dataset.fixtures.get('flagship.customer.meridian');
    if (meridian) {
      const priya = store.seed.personaUserIds.get('priya-shah') as string;
      store.put('customerNotes', {
        id: formatId('customerNote', 700_001),
        organizationId: ORGANIZATION_ID,
        customerId: meridian,
        authorId: priya,
        body: 'Very long note. '.repeat(120).trim(),
        visibility: 'organization',
        isPinned: false,
        mentionedUserIds: [],
        attachmentIds: [],
        metadata: {
          id: 'nte_700001',
          organizationId: ORGANIZATION_ID,
          createdAt: store.now,
          createdBy: priya,
          updatedAt: store.now,
          updatedBy: priya,
          version: 1,
        },
      });
    }
  });
}

export { type Customer, type SalesOrder };
