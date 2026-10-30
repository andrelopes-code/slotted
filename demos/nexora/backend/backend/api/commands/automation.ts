import {
  AUTOMATION_ACTOR_ID,
  FX_RATES_TO_USD,
  NexoraApiError,
  SYSTEM_ACTOR_ID,
  WEEKDAY_NUMBER,
  WEEKDAY_OPTIONS,
  WORKFLOW_LIMITS,
  WORKFLOW_RELATIVE_PEOPLE,
  addDays,
  businessDateOf,
  businessDateToInstant,
  compareDates,
  diffDays,
  evaluateConditions,
  quantityToMilli,
  triggerDefinition,
  usdMinor,
  weekdayOf,
  type Invoice,
  type Task,
  type User,
  type Workflow,
  type WorkflowAction,
  type WorkflowActionResult,
  type WorkflowRun,
  type WorkflowRunErrorCode,
  type WorkflowTriggerDefinition,
} from '../../domain';
import type { CustomerListItem } from '../resources/customers';
import type { ApiRuntime, MutationOptions, Transaction, WorkflowEvent } from '../runtime';
import type { UpdateCustomerInput } from './crm';
import { finalize } from './helpers';
import type { PurchaseOrderInput } from './procurement';
import type { TicketUpdateInput } from './support';

/** The domain services the actions invoke: the interactive commands' own (section 69.3). */
export interface AutomationServices {
  updateCustomer: (
    tx: Transaction,
    id: string,
    input: UpdateCustomerInput,
    options?: MutationOptions,
  ) => CustomerListItem;
  holdCustomer: (tx: Transaction, id: string, reason: string, options?: MutationOptions) => unknown;
  holdOrder: (tx: Transaction, id: string, reason: string, options?: MutationOptions) => unknown;
  requestOrderApproval: (
    tx: Transaction,
    id: string,
    role: string,
    reason: string,
    options?: MutationOptions,
  ) => unknown;
  updateTicket: (
    tx: Transaction,
    id: string,
    input: TicketUpdateInput,
    options?: MutationOptions,
  ) => unknown;
  assignTicket: (
    tx: Transaction,
    id: string,
    input: { assigneeId: string },
    options?: MutationOptions,
  ) => unknown;
  createPurchaseOrder: (
    tx: Transaction,
    input: PurchaseOrderInput,
  ) => {
    purchaseOrder: { purchaseOrderNumber: string };
  };
  createTask: (
    tx: Transaction,
    input: {
      title: string;
      description?: string;
      assigneeId?: string;
      dueDate?: string;
      priority?: Task['priority'];
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ) => Task;
}

/** An action that did not happen, with the code the run is written with. */
class ActionFailure extends Error {
  constructor(
    readonly code: WorkflowRunErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** What a domain service's refusal becomes in the run's vocabulary. */
function failureOf(error: unknown): ActionFailure {
  if (error instanceof ActionFailure) return error;
  if (error instanceof NexoraApiError) {
    switch (error.code) {
      case 'NOT_FOUND':
        return new ActionFailure('ACTION_TARGET_NOT_FOUND', error.message);
      case 'FORBIDDEN':
        return new ActionFailure(
          'ACTION_NOT_PERMITTED',
          `The automation actor does not hold ${String(error.details?.['permission'] ?? 'the permission')}`,
        );
      case 'VALIDATION_FAILED':
        return new ActionFailure(
          'ACTION_INVALID',
          error.fieldErrors?.map((field) => field.message).join('; ') || error.message,
        );
      default:
        return new ActionFailure('ACTION_REFUSED', error.message);
    }
  }
  throw error;
}

const DONE = (message: string) => ({ status: 'succeeded' as const, message });
const NOTHING = (message: string) => ({ status: 'skipped' as const, message });

/**
 * Section 69 — the automation engine. A command queues the events it
 * produces on its transaction; after its own work the engine runs every
 * active workflow whose trigger is the event's, in the same transaction:
 * the subject is read, the condition tree evaluated, and each action invokes
 * the interactive command's service as the automation actor. An action that
 * fails takes back only its own writes. A run is written once per workflow
 * and event (`workflowId:eventId`), and a chain stops at its sixth workflow.
 */
export function createAutomation(runtime: ApiRuntime, services: AutomationServices) {
  const { store } = runtime;

  const automationActor = (): User => {
    const user = store.dataset.users.get(AUTOMATION_ACTOR_ID);
    if (!user) throw new NexoraApiError('INTERNAL_ERROR', 'The automation actor is not seeded');
    return user;
  };

  // ---------------------------------------------------------------------------
  // The subject of an event (section 69.1)

  const customerFacts = (customerId: string | undefined): Record<string, unknown> | undefined => {
    const customer = customerId ? store.dataset.customers.get(customerId) : undefined;
    if (!customer) return undefined;
    const summary = runtime.projections.customerSummary(customer.id);
    return {
      id: customer.id,
      accountOwnerId: customer.accountOwnerId,
      segment: customer.segment,
      status: customer.status,
      health: customer.health,
      regionCode: customer.regionCode,
      creditUtilizationBps: summary.creditUtilizationBps,
      overdueReceivablesUsd: usdMinor(
        summary.overdueReceivables,
        FX_RATES_TO_USD[summary.overdueReceivables.currency],
      ),
      tags: [...customer.tags],
    };
  };

  const metrics = (): Record<string, number> => {
    const today = store.today;
    const soon = addDays(today, 3);
    let overdueInvoices = 0;
    for (const invoice of store.dataset.invoices.values())
      if (invoice.lifecycle === 'open' && invoice.collectionState === 'overdue')
        overdueInvoices += 1;
    let delayedPurchaseOrders = 0;
    for (const po of store.dataset.purchaseOrders.values())
      if (po.exceptionFlags.includes('delayed')) delayedPurchaseOrders += 1;
    let quotesExpiringSoon = 0;
    for (const quote of store.dataset.quotes.values())
      if (
        (quote.status === 'sent' || quote.status === 'viewed') &&
        compareDates(quote.expirationDate, today) >= 0 &&
        compareDates(quote.expirationDate, soon) <= 0
      )
        quotesExpiringSoon += 1;
    let escalatedTickets = 0;
    for (const ticket of store.dataset.tickets.values())
      if (ticket.status === 'escalated') escalatedTickets += 1;
    let positionsBelowReorderPoint = 0;
    for (const position of runtime.projections.inventory().values())
      if (position.belowReorderPoint) positionsBelowReorderPoint += 1;
    let pendingApprovals = 0;
    for (const request of store.dataset.approvalRequests.values())
      if (request.status === 'pending') pendingApprovals += 1;
    return {
      overdueInvoices,
      delayedPurchaseOrders,
      quotesExpiringSoon,
      escalatedTickets,
      positionsBelowReorderPoint,
      pendingApprovals,
    };
  };

  /** What the event's records hold now, under the paths the trigger's fields name. */
  const subjectOf = (event: WorkflowEvent): Record<string, unknown> => {
    const { refs } = event;
    const subject: Record<string, unknown> = {};
    const order = refs.orderId ? store.dataset.salesOrders.get(refs.orderId) : undefined;
    const invoice = refs.invoiceId ? store.dataset.invoices.get(refs.invoiceId) : undefined;
    const ticket = refs.ticketId ? store.dataset.tickets.get(refs.ticketId) : undefined;
    const customerId =
      refs.customerId ?? order?.customerId ?? invoice?.customerId ?? ticket?.customerId;
    const customer = customerFacts(customerId);
    if (customer) {
      if (refs.previousStatus) customer['previousStatus'] = refs.previousStatus;
      subject['customer'] = customer;
    }
    if (order)
      subject['order'] = {
        id: order.id,
        ownerId: order.ownerId,
        totalUsd: usdMinor(order.total, order.fxRateToUsd),
        grossMarginBps: order.grossMarginBps,
        status: order.status,
        approvalStatus: order.approvalStatus,
        riskFlags: [...order.riskFlags],
        lineCount: runtime.indexes.linesByOrder.get(order.id).length,
        customerPoNumber: order.customerPoNumber ?? '',
        currency: order.currency,
        ...(refs.previousTotalUsd !== undefined ? { previousTotalUsd: refs.previousTotalUsd } : {}),
      };
    if (invoice) subject['invoice'] = invoiceFacts(invoice);
    if (ticket)
      subject['ticket'] = {
        id: ticket.id,
        assigneeId: ticket.assigneeId,
        priority: ticket.priority,
        channel: ticket.channel,
        category: ticket.category,
        tags: [...ticket.tags],
        firstResponseSla: ticket.firstResponseSla,
        resolutionSla: ticket.resolutionSla,
      };
    if (refs.skuId && refs.warehouseId) {
      const sku = store.dataset.skus.get(refs.skuId);
      const position = runtime.projections.inventoryAt(refs.skuId, refs.warehouseId);
      const quantity = (value: string): number => quantityToMilli(value) / 1000;
      if (sku)
        subject['sku'] = {
          id: sku.id,
          status: sku.status,
          categoryId: sku.categoryId,
          leadTimeDays: sku.leadTimeDays,
        };
      subject['inventory'] = {
        available: quantity(position.available),
        onHand: quantity(position.onHand),
        inbound: quantity(position.inbound),
        reorderPoint: quantity(position.reorderPoint),
        suggestedQuantity: quantity(position.suggestedQuantity),
      };
      subject['warehouse'] = { code: store.dataset.warehouses.get(refs.warehouseId)?.code };
    }
    if (event.schedule) {
      subject['schedule'] = {
        date: event.schedule.date,
        hour: event.schedule.hour,
        weekday: event.schedule.weekday,
      };
      subject['metrics'] = metrics();
    }
    return subject;
  };

  const invoiceFacts = (invoice: Invoice): Record<string, unknown> => {
    const rate = invoice.fxRateToUsd ?? FX_RATES_TO_USD[invoice.currency];
    return {
      id: invoice.id,
      outstandingUsd: usdMinor(invoice.outstanding, rate),
      totalUsd: usdMinor(invoice.total, rate),
      daysOverdue: Math.max(0, diffDays(store.today, invoice.dueDate)),
      currency: invoice.currency,
    };
  };

  /** The record a run is about, and how the history names it. */
  const affectedOf = (
    event: WorkflowEvent,
    trigger: WorkflowTriggerDefinition,
  ): { type: string; id: string; label: string } | undefined => {
    const { refs } = event;
    switch (trigger.affects) {
      case 'sales_order': {
        const order = refs.orderId ? store.dataset.salesOrders.get(refs.orderId) : undefined;
        return order ? { type: 'sales_order', id: order.id, label: order.orderNumber } : undefined;
      }
      case 'invoice': {
        const invoice = refs.invoiceId ? store.dataset.invoices.get(refs.invoiceId) : undefined;
        return invoice
          ? { type: 'invoice', id: invoice.id, label: invoice.invoiceNumber ?? invoice.id }
          : undefined;
      }
      case 'support_ticket': {
        const ticket = refs.ticketId ? store.dataset.tickets.get(refs.ticketId) : undefined;
        return ticket
          ? { type: 'support_ticket', id: ticket.id, label: ticket.ticketNumber }
          : undefined;
      }
      case 'customer': {
        const customer = refs.customerId ? store.dataset.customers.get(refs.customerId) : undefined;
        return customer
          ? { type: 'customer', id: customer.id, label: customer.displayName }
          : undefined;
      }
      case 'sku': {
        const sku = refs.skuId ? store.dataset.skus.get(refs.skuId) : undefined;
        const warehouse = refs.warehouseId
          ? store.dataset.warehouses.get(refs.warehouseId)
          : undefined;
        return sku
          ? {
              type: 'sku',
              id: sku.id,
              label: warehouse ? `${sku.sku} at ${warehouse.code}` : sku.sku,
            }
          : undefined;
      }
      default:
        return undefined;
    }
  };

  // ---------------------------------------------------------------------------
  // Actions (section 69.3)

  const personName = (id: string): string => store.dataset.users.get(id)?.displayName ?? id;

  /** A named, active person; or the person a relation names on the event's records. */
  const resolvePerson = (
    value: unknown,
    workflow: Workflow,
    subject: Record<string, unknown>,
  ): string => {
    const key = typeof value === 'string' ? value : '';
    const relative = WORKFLOW_RELATIVE_PEOPLE[key];
    let id: string | undefined;
    if (relative) {
      const record =
        relative.record === null
          ? undefined
          : (subject[relative.record] as Record<string, unknown> | undefined);
      id =
        key === 'workflow_owner'
          ? workflow.ownerId
          : key === 'account_owner'
            ? (record?.['accountOwnerId'] as string | undefined)
            : key === 'order_owner'
              ? (record?.['ownerId'] as string | undefined)
              : (record?.['assigneeId'] as string | undefined);
      if (!id)
        throw new ActionFailure(
          'ACTION_TARGET_NOT_FOUND',
          relative.record !== null && !record
            ? `${relative.label} names no one: this event has no ${relative.record}`
            : `${relative.label} names no one on this ${relative.record ?? 'workflow'}`,
        );
    } else if (key.startsWith('usr_')) id = key;
    else
      throw new ActionFailure(
        'ACTION_TARGET_NOT_FOUND',
        key ? `“${key}” names no one on this event` : 'The action names no one',
      );
    const user = store.dataset.users.get(id);
    if (!user || user.status !== 'active')
      throw new ActionFailure(
        'ACTION_TARGET_NOT_FOUND',
        user ? `${user.displayName} is ${user.status}` : `No user ${id} exists`,
      );
    return user.id;
  };

  const text = (config: Record<string, unknown>, key: string): string =>
    typeof config[key] === 'string' ? (config[key] as string).trim() : '';

  const required = (config: Record<string, unknown>, key: string, label: string): string => {
    const value = text(config, key);
    if (!value) throw new ActionFailure('ACTION_INVALID', `${label} is missing`);
    return value;
  };

  const versionOf = (entity: { metadata: { version: number } }): MutationOptions => ({
    ifMatch: entity.metadata.version,
  });

  const runAction = (
    tx: Transaction,
    workflow: Workflow,
    action: WorkflowAction,
    event: WorkflowEvent,
    subject: Record<string, unknown>,
    affected: { type: string; id: string } | undefined,
  ): { status: 'succeeded' | 'skipped'; message: string } => {
    const config = action.config ?? {};
    const { refs } = event;
    switch (action.type) {
      case 'send_notification': {
        const recipient = resolvePerson(config['recipient'], workflow, subject);
        const title = required(config, 'title', 'The title');
        tx.notify(recipient, 'info', title, text(config, 'body'), affected);
        return DONE(`Notified ${personName(recipient)}`);
      }
      case 'create_task': {
        const assignee = resolvePerson(config['assignee'], workflow, subject);
        const title = required(config, 'title', 'The title');
        const priority = (['low', 'normal', 'high'] as const).find(
          (candidate) => candidate === config['priority'],
        );
        const days = config['dueInDays'];
        const task = services.createTask(tx, {
          title,
          assigneeId: assignee,
          description: `Created by the workflow “${workflow.name}”.`,
          ...(priority ? { priority } : {}),
          ...(typeof days === 'number' ? { dueDate: addDays(store.today, days) } : {}),
          ...(affected ? { relatedEntityType: affected.type, relatedEntityId: affected.id } : {}),
        });
        return DONE(`Created the task “${task.title}” for ${personName(assignee)}`);
      }
      case 'assign_user': {
        const assignee = resolvePerson(config['assignee'], workflow, subject);
        if (refs.ticketId) {
          const ticket = store.dataset.tickets.get(refs.ticketId);
          if (!ticket) throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The ticket is gone');
          if (ticket.assigneeId === assignee)
            return NOTHING(
              `${ticket.ticketNumber} was already assigned to ${personName(assignee)}`,
            );
          services.assignTicket(tx, ticket.id, { assigneeId: assignee }, versionOf(ticket));
          return DONE(`Assigned ${ticket.ticketNumber} to ${personName(assignee)}`);
        }
        const customer = refs.customerId ? store.dataset.customers.get(refs.customerId) : undefined;
        if (!customer)
          throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no record to assign');
        if (customer.accountOwnerId === assignee)
          return NOTHING(`${personName(assignee)} already owned ${customer.displayName}`);
        services.updateCustomer(tx, customer.id, { accountOwnerId: assignee }, versionOf(customer));
        return DONE(`Made ${personName(assignee)} the account owner of ${customer.displayName}`);
      }
      case 'request_approval': {
        const order = refs.orderId ? store.dataset.salesOrders.get(refs.orderId) : undefined;
        if (!order) throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no order');
        const role = required(config, 'role', 'The approver');
        if (order.status === 'pending_approval')
          return NOTHING(`${order.orderNumber} already waited on an approval`);
        services.requestOrderApproval(
          tx,
          order.id,
          role,
          `The workflow “${workflow.name}” asks for a ${role.replace(/_/g, ' ')}'s review`,
          versionOf(order),
        );
        return DONE(`Sent ${order.orderNumber} for a ${role.replace(/_/g, ' ')}'s approval`);
      }
      case 'add_tag':
      case 'remove_tag': {
        const tag = required(config, 'tag', 'The tag');
        const adding = action.type === 'add_tag';
        if (config['record'] === 'ticket') {
          const ticket = refs.ticketId ? store.dataset.tickets.get(refs.ticketId) : undefined;
          if (!ticket)
            throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no ticket');
          const has = ticket.tags.includes(tag);
          if (has === adding)
            return NOTHING(
              `${ticket.ticketNumber} ${adding ? 'already carried' : 'did not carry'} “${tag}”`,
            );
          const tags = adding
            ? [...ticket.tags, tag]
            : ticket.tags.filter((entry) => entry !== tag);
          services.updateTicket(tx, ticket.id, { tags }, versionOf(ticket));
          return DONE(`${adding ? 'Tagged' : 'Untagged'} ${ticket.ticketNumber} “${tag}”`);
        }
        const customerId = (subject['customer'] as { id?: string } | undefined)?.id;
        const customer = customerId ? store.dataset.customers.get(customerId) : undefined;
        if (!customer)
          throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no customer');
        const has = customer.tags.includes(tag);
        if (has === adding)
          return NOTHING(
            `${customer.displayName} ${adding ? 'already carried' : 'did not carry'} “${tag}”`,
          );
        const tags = adding
          ? [...customer.tags, tag]
          : customer.tags.filter((entry) => entry !== tag);
        services.updateCustomer(tx, customer.id, { tags }, versionOf(customer));
        return DONE(`${adding ? 'Tagged' : 'Untagged'} ${customer.displayName} “${tag}”`);
      }
      case 'place_customer_on_hold': {
        const customerId = (subject['customer'] as { id?: string } | undefined)?.id;
        const customer = customerId ? store.dataset.customers.get(customerId) : undefined;
        if (!customer)
          throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no customer');
        const reason = required(config, 'reason', 'The reason');
        if (customer.status === 'on_hold')
          return NOTHING(`${customer.displayName} was already on hold`);
        services.holdCustomer(tx, customer.id, reason, versionOf(customer));
        return DONE(`Placed ${customer.displayName} on hold`);
      }
      case 'place_order_on_hold': {
        const order = refs.orderId ? store.dataset.salesOrders.get(refs.orderId) : undefined;
        if (!order) throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no order');
        const reason = required(config, 'reason', 'The reason');
        if (order.status === 'on_hold') return NOTHING(`${order.orderNumber} was already on hold`);
        services.holdOrder(tx, order.id, reason, versionOf(order));
        return DONE(`Placed ${order.orderNumber} on hold`);
      }
      case 'create_purchase_order_draft': {
        const sku = refs.skuId ? store.dataset.skus.get(refs.skuId) : undefined;
        const warehouseId = refs.warehouseId;
        if (!sku || !warehouseId)
          throw new ActionFailure('ACTION_TARGET_NOT_FOUND', 'The event has no stock position');
        const position = runtime.projections.inventoryAt(sku.id, warehouseId);
        if (!position.reorderSuggested || quantityToMilli(position.suggestedQuantity) <= 0)
          return NOTHING(`Stock on hand and inbound already covered ${sku.sku}'s reorder point`);
        const mappings = runtime.indexes.mappingsBySku.get(sku.id);
        const supplierId =
          sku.preferredSupplierId ??
          mappings.find(
            (mapping) => store.dataset.suppliers.get(mapping.supplierId)?.status === 'active',
          )?.supplierId;
        if (!supplierId)
          throw new ActionFailure(
            'ACTION_TARGET_NOT_FOUND',
            `${sku.sku} has no supplier to order from`,
          );
        const detail = services.createPurchaseOrder(tx, {
          supplierId,
          destinationWarehouseId: warehouseId,
          lines: [{ skuId: sku.id, quantity: position.suggestedQuantity }],
          notes: `Drafted by the workflow “${workflow.name}” when ${sku.sku} fell below its reorder point.`,
        });
        return DONE(
          `Drafted ${detail.purchaseOrder.purchaseOrderNumber} for ${position.suggestedQuantity} ${sku.unitOfMeasure} of ${sku.sku}`,
        );
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Runs (section 69.4)

  const clock = (): number => globalThis.performance?.now() ?? Date.now();

  const execute = (
    tx: Transaction,
    workflow: Workflow,
    event: WorkflowEvent,
  ): WorkflowRun | undefined => {
    if (
      runtime.indexes.runsByWorkflow.get(workflow.id).some((run) => run.triggerEventId === event.id)
    )
      return undefined;
    const trigger = triggerDefinition(workflow.trigger.type);
    if (!trigger) return undefined;
    const started = clock();
    const affected = affectedOf(event, trigger);
    const run: WorkflowRun = {
      id: store.nextId('workflowRun'),
      organizationId: workflow.organizationId,
      workflowId: workflow.id,
      triggerEventId: event.id,
      status: 'running',
      startedAt: tx.occurredAt,
      actionResults: [],
      triggerType: trigger.type,
      conditionsMet: false,
      causedBy: event.causedBy,
      chainDepth: event.depth,
      ...(event.parentRunId ? { parentRunId: event.parentRunId } : {}),
      ...(event.schedule ? { occurrences: event.schedule.occurrences } : {}),
      ...(affected
        ? {
            affectedEntityType: affected.type,
            affectedEntityId: affected.id,
            affectedLabel: affected.label,
          }
        : {}),
    };
    const context = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      runId: run.id,
      depth: event.depth,
    };
    const skipAll = (message: string): WorkflowActionResult[] =>
      workflow.actions.map((_, actionIndex) => ({ actionIndex, status: 'skipped', message }));
    if (event.depth > WORKFLOW_LIMITS.maxChainDepth) {
      run.status = 'failed';
      run.errorCode = 'WORKFLOW_RECURSION_LIMIT';
      run.actionResults = skipAll(
        `Not run: this would have been workflow ${event.depth} of one chain of events, and a chain stops at ${WORKFLOW_LIMITS.maxChainDepth}`,
      );
    } else {
      const subject = subjectOf(event);
      run.conditionsMet = evaluateConditions(workflow.conditions, subject);
      if (!run.conditionsMet) {
        run.status = 'skipped';
        run.actionResults = skipAll('The conditions did not match');
      } else {
        tx.runAs(automationActor(), context, () => {
          for (const [actionIndex, action] of workflow.actions.entries()) {
            const mark = tx.savepoint();
            const queued = tx.events.length;
            try {
              const outcome = runAction(tx, workflow, action, event, subject, affected);
              run.actionResults.push({ actionIndex, ...outcome });
            } catch (error) {
              const failure = failureOf(error);
              tx.rollbackTo(mark);
              // The events of a write that was taken back never happened.
              tx.events.splice(queued);
              run.actionResults.push({
                actionIndex,
                status: 'failed',
                errorCode: failure.code,
                message: failure.message,
              });
            }
          }
        });
        const failed = run.actionResults.filter((result) => result.status === 'failed');
        const succeeded = run.actionResults.some((result) => result.status === 'succeeded');
        run.status =
          failed.length === 0
            ? succeeded
              ? 'succeeded'
              : 'skipped'
            : succeeded
              ? 'partially_failed'
              : 'failed';
        if (failed[0]?.errorCode) run.errorCode = failed[0].errorCode;
      }
    }
    run.completedAt = new Date(
      Date.parse(run.startedAt) + Math.max(1, Math.round(clock() - started)),
    ).toISOString();
    tx.create('workflowRuns', run);
    tx.touch('workflows', workflow);
    workflow.runCount += 1;
    workflow.lastRunAt = tx.occurredAt;
    tx.runAs(automationActor(), context, () => {
      tx.audit('workflow.run_completed', 'workflow_run', run.id, {
        after: { status: run.status, workflowId: workflow.id, triggerEventId: event.id },
      });
      if (run.status === 'failed') {
        workflow.status = 'error';
        finalize(tx, 'workflows', workflow, 'workflow.failed', 'workflow', ['status']);
        const reason =
          run.actionResults.find((result) => result.status === 'failed')?.message ??
          run.actionResults[0]?.message ??
          'A run failed';
        tx.notify(
          workflow.ownerId,
          'action_required',
          `Workflow stopped: ${workflow.name}`,
          `${reason}. It runs again once it is edited and activated.`,
          { type: 'workflow', id: workflow.id },
        );
      }
    });
    tx.dirty('workflows', workflow);
    return run;
  };

  /**
   * Runs the workflows of every event the transaction queued, first the
   * positions it moved below their reorder point. An action's own events join
   * the queue one link further down the chain.
   */
  const dispatch = (tx: Transaction): void => {
    for (const [key, wasBelow] of tx.movedPositions()) {
      if (wasBelow) continue;
      const [skuId, warehouseId] = key.split(':') as [string, string];
      if (runtime.projections.inventoryAt(skuId, warehouseId).belowReorderPoint)
        tx.emit('inventory.below_reorder_point', { skuId, warehouseId });
    }
    while (tx.events.length > 0) {
      const event = tx.events.shift() as WorkflowEvent;
      const workflows = [...store.dataset.workflows.values()]
        .filter(
          (workflow) =>
            workflow.status === 'active' &&
            workflow.trigger.type === event.type &&
            (event.workflowId === undefined || event.workflowId === workflow.id),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
      for (const workflow of workflows) execute(tx, workflow, event);
    }
  };

  // ---------------------------------------------------------------------------
  // The clock (sections 66.2 and 69.5)

  /** Invoices the clock moved to overdue: each is one `invoice.overdue` event, once per due date. */
  const overdueEvents = (tx: Transaction, invoices: readonly Invoice[]): void => {
    for (const invoice of invoices)
      tx.enqueue({
        id: `invoice.overdue:${invoice.id}:${invoice.dueDate}`,
        type: 'invoice.overdue',
        refs: { invoiceId: invoice.id, customerId: invoice.customerId },
        depth: 1,
        causedBy: SYSTEM_ACTOR_ID,
      });
  };

  const weekdayName = (date: string): string =>
    WEEKDAY_OPTIONS.find((option) => WEEKDAY_NUMBER[option.value] === weekdayOf(date))?.value ??
    'monday';

  /**
   * Section 69.5 — every active scheduled workflow whose occurrences fell
   * between the last evaluation and now runs once, for the last of them; the
   * run says how many it stands for. The event is the occurrence's date, so a
   * workflow runs at most once a day however often the clock moves.
   */
  const evaluateSchedules = (tx: Transaction): void => {
    const from = store.metadata.schedulesEvaluatedAt;
    const to = store.now;
    store.metadata.schedulesEvaluatedAt = to;
    if (Date.parse(to) <= Date.parse(from)) return;
    const first = businessDateOf(from);
    const last = businessDateOf(to);
    for (const workflow of [...store.dataset.workflows.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      if (workflow.status !== 'active') continue;
      const type = workflow.trigger.type;
      if (type !== 'schedule.daily' && type !== 'schedule.weekly') continue;
      const config = workflow.trigger.config ?? {};
      const hour = typeof config['hour'] === 'number' ? config['hour'] : 0;
      const weekday =
        typeof config['weekday'] === 'string' ? WEEKDAY_NUMBER[config['weekday']] : undefined;
      let count = 0;
      let latest: string | undefined;
      for (let date = first; compareDates(date, last) <= 0; date = addDays(date, 1)) {
        if (type === 'schedule.weekly' && weekdayOf(date) !== weekday) continue;
        const at = Date.parse(businessDateToInstant(date, hour));
        if (at <= Date.parse(from) || at > Date.parse(to)) continue;
        count += 1;
        latest = date;
      }
      if (!latest) continue;
      tx.enqueue({
        id: `schedule:${latest}`,
        type,
        refs: {},
        depth: 1,
        causedBy: SYSTEM_ACTOR_ID,
        workflowId: workflow.id,
        schedule: { date: latest, weekday: weekdayName(latest), hour, occurrences: count },
      });
    }
  };

  return { dispatch, evaluateSchedules, overdueEvents, subjectOf };
}

export type Automation = ReturnType<typeof createAutomation>;
