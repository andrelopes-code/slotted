import {
  AUTOMATION_ACTOR_ID,
  FX_RATES_TO_USD,
  ORGANIZATION_ID,
  SYSTEM_ACTOR_ID,
  addDays,
  addMs,
  businessDateOf,
  businessDateToInstant,
  compareDates,
  diffDays,
  evaluateConditions,
  formatId,
  idSequence,
  usdMinor,
  weekdayOf,
  type ImportJob,
  type Notification,
  type SavedView,
  type Task,
  type Workflow,
  type WorkflowActionResult,
  type WorkflowRun,
} from '../../domain';
import type { SeedContext } from './context';
import { instantOn, metadataAt } from './orders';
import type { TenantSeedResult } from './tenant';

export function seedCrossCutting(context: SeedContext, tenant: TenantSeedResult): void {
  const effects = seedWorkflows(context, tenant);
  seedNotificationsAndTasks(context, tenant);
  seedSavedViews(context, tenant);
  seedImportJob(context, tenant);
  seedWorkflowEffects(context, effects);
}

const DAY = 86_400_000;

/** A notification or task a seeded run's action wrote, applied after the other cross-cutting records. */
type WorkflowEffect =
  | { kind: 'notification'; record: Omit<Notification, 'id'> }
  | { kind: 'task'; record: Omit<Task, 'id'>; notify: boolean };

/**
 * Section 15 and 69 — one workflow in each state, the nested tree of
 * `edge.workflow.nested_conditions` and the failed run of
 * `edge.workflow.failed_run`. A seeded run is the engine's answer to a seeded
 * event: its conditions are evaluated against the records as seeded, and a
 * run says an action succeeded only where the seed also writes the effect —
 * the notification, the task and the task's own notification. A new tenant
 * has written no workflow yet.
 */
function seedWorkflows(context: SeedContext, tenant: TenantSeedResult): WorkflowEffect[] {
  const { dataset, now, today, scale } = context;
  const effects: WorkflowEffect[] = [];
  if (scale.id === 'new_tenant') return effects;
  const random = context.random('workflows');
  const persona = (key: string): string | undefined => tenant.personaUserIds.get(key);
  const admin = persona('maya-chen') as string;
  const sofia = persona('sofia-ramirez') as string;
  const priya = persona('priya-shah') as string;
  const marcus = persona('marcus-lee') as string;
  const aisha = persona('aisha-grant') as string;
  // A workflow is owned by someone who reads it (section 55.5): the buyer reads no workflow.
  const procurementLead = persona('procurement-lead') ?? admin;
  const active = (userId: string | undefined): boolean =>
    userId !== undefined && dataset.users.get(userId)?.status === 'active';
  const windowStart = addMs(now, -10 * DAY);

  type Definition = Omit<
    Workflow,
    'id' | 'organizationId' | 'metadata' | 'runCount' | 'lastRunAt'
  > & {
    /** When the workflow took its current status. */
    since: string;
    createdDaysAgo: number;
  };
  const definitions: Definition[] = [
    {
      name: 'Review high-value orders from non-strategic accounts',
      description:
        'Confirmed orders of US$50,000 or more get a review of margin and delivery plan before they ship, unless the account is strategic and healthy.',
      status: 'active',
      trigger: { type: 'order.confirmed' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'order.totalUsd', operator: 'gte', value: 5_000_000 },
          {
            type: 'group',
            operator: 'or',
            children: [
              { type: 'condition', field: 'customer.segment', operator: 'neq', value: 'strategic' },
              {
                type: 'group',
                operator: 'and',
                children: [
                  {
                    type: 'condition',
                    field: 'order.riskFlags',
                    operator: 'contains',
                    value: 'low_margin',
                  },
                  {
                    type: 'condition',
                    field: 'customer.health',
                    operator: 'neq',
                    value: 'healthy',
                  },
                ],
              },
            ],
          },
        ],
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: sofia,
            title: 'High-value order confirmed',
            body: 'Review the margin and the delivery plan before it ships.',
          },
        },
        {
          type: 'create_task',
          config: {
            assignee: 'order_owner',
            title: 'Review the delivery plan of a high-value order',
            priority: 'high',
            dueInDays: 2,
          },
        },
      ],
      ownerId: sofia,
      since: addMs(now, -60 * DAY),
      createdDaysAgo: 210,
    },
    {
      name: 'Tell the account owner when a key account goes on hold',
      status: 'active',
      trigger: { type: 'customer.status_changed' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'customer.status', operator: 'eq', value: 'on_hold' },
          {
            type: 'condition',
            field: 'customer.segment',
            operator: 'in',
            value: ['strategic', 'enterprise'],
          },
        ],
      },
      actions: [
        {
          type: 'send_notification',
          config: { recipient: 'account_owner', title: 'Key account placed on hold' },
        },
        {
          type: 'create_task',
          config: {
            assignee: 'account_owner',
            title: 'Call the customer about the credit hold',
            priority: 'high',
            dueInDays: 1,
          },
        },
      ],
      ownerId: sofia,
      since: addMs(now, -45 * DAY),
      createdDaysAgo: 320,
    },
    {
      name: 'Draft a purchase order when stock falls below its reorder point',
      description:
        'A position with nothing inbound gets a draft from its preferred supplier for the quantity that tops it up; the buyer reviews it.',
      status: 'active',
      trigger: { type: 'inventory.below_reorder_point' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'inventory.inbound', operator: 'eq', value: 0 },
          { type: 'condition', field: 'sku.status', operator: 'eq', value: 'active' },
        ],
      },
      actions: [
        { type: 'create_purchase_order_draft', config: {} },
        {
          type: 'create_task',
          config: {
            assignee: marcus,
            title: 'Review the drafted purchase order',
            priority: 'normal',
            dueInDays: 2,
          },
        },
      ],
      ownerId: procurementLead,
      since: addMs(now, -1 * DAY),
      createdDaysAgo: 3,
    },
    {
      name: 'Follow up overdue invoices above $25,000',
      status: 'active',
      trigger: { type: 'invoice.overdue' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'invoice.outstandingUsd', operator: 'gte', value: 2_500_000 },
          { type: 'condition', field: 'customer.segment', operator: 'neq', value: 'smb' },
        ],
      },
      actions: [
        {
          type: 'send_notification',
          config: { recipient: priya, title: 'Large invoice overdue' },
        },
        {
          type: 'create_task',
          config: {
            assignee: 'account_owner',
            title: 'Call about the overdue invoice',
            priority: 'high',
            dueInDays: 1,
          },
        },
      ],
      ownerId: priya,
      since: addMs(now, -90 * DAY),
      createdDaysAgo: 400,
    },
    {
      name: 'Assign urgent escalations to Aisha Grant',
      status: 'active',
      trigger: { type: 'ticket.escalated' },
      conditions: {
        type: 'group',
        operator: 'or',
        children: [
          { type: 'condition', field: 'ticket.priority', operator: 'eq', value: 'urgent' },
          {
            type: 'group',
            operator: 'and',
            children: [
              { type: 'condition', field: 'ticket.priority', operator: 'eq', value: 'high' },
              {
                type: 'condition',
                field: 'customer.segment',
                operator: 'in',
                value: ['enterprise', 'strategic'],
              },
            ],
          },
        ],
      },
      actions: [{ type: 'assign_user', config: { assignee: aisha } }],
      ownerId: admin,
      since: addMs(now, -6 * DAY),
      createdDaysAgo: 150,
    },
    {
      name: 'Weekly digest of delayed purchase orders',
      status: 'active',
      trigger: { type: 'schedule.weekly', config: { weekday: 'monday', hour: 7 } },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'metrics.delayedPurchaseOrders', operator: 'gt', value: 0 },
        ],
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: marcus,
            title: 'Delayed purchase orders this week',
            body: 'Open Purchase orders and filter on the Delayed exception.',
          },
        },
      ],
      ownerId: procurementLead,
      since: addMs(now, -120 * DAY),
      createdDaysAgo: 260,
    },
    {
      name: 'Ask for the PO number of orders confirmed without one',
      description: 'Paused while Sales agrees which customers order without a purchase order.',
      status: 'paused',
      trigger: { type: 'order.confirmed' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'order.customerPoNumber', operator: 'is_empty', value: null },
        ],
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: 'order_owner',
            title: 'Confirmed order without a PO number',
            body: 'Ask the customer for their purchase-order number before it ships.',
          },
        },
      ],
      ownerId: sofia,
      since: addMs(now, -12 * DAY),
      createdDaysAgo: 40,
    },
    {
      name: 'Hold orders that push a customer past its credit limit',
      description:
        'An order whose new value takes the customer beyond its approved credit is held for Finance.',
      status: 'error',
      trigger: { type: 'order.value_changed' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          {
            type: 'condition',
            field: 'customer.creditUtilizationBps',
            operator: 'gt',
            value: 10_000,
          },
        ],
      },
      actions: [
        {
          type: 'place_order_on_hold',
          config: { reason: 'Credit exposure exceeds the approved limit' },
        },
      ],
      ownerId: priya,
      since: addMs(now, -2 * DAY - 5 * 3_600_000),
      createdDaysAgo: 30,
    },
    {
      name: 'Remind quote owners of quotes about to expire',
      status: 'draft',
      trigger: { type: 'schedule.daily', config: { hour: 6 } },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'metrics.quotesExpiringSoon', operator: 'gt', value: 0 },
        ],
      },
      actions: [
        {
          type: 'send_notification',
          config: { recipient: 'quote_owner', title: 'Quotes expiring within 3 days' },
        },
        {
          type: 'create_task',
          config: { assignee: 'quote_owner', title: 'Follow up on the expiring quotes' },
        },
      ],
      ownerId: sofia,
      since: addMs(now, -4 * DAY),
      createdDaysAgo: 4,
    },
    {
      name: 'Notify on every new order (replaced)',
      description: 'Archived the day it was written: the dashboard lists every new order.',
      status: 'archived',
      trigger: { type: 'order.created' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [{ type: 'condition', field: 'order.totalUsd', operator: 'gt', value: 0 }],
      },
      actions: [{ type: 'send_notification', config: { recipient: admin, title: 'New order' } }],
      ownerId: admin,
      since: addMs(now, -96 * DAY),
      createdDaysAgo: 96,
    },
  ];

  let runSequence = 0;
  const notify = (
    userId: string,
    title: string,
    body: string,
    at: string,
    entity: { type: string; id: string } | undefined,
    type: Notification['type'] = 'info',
  ): void => {
    // A notification older than a day was read an hour after it arrived.
    const read = Date.parse(now) - Date.parse(at) > DAY;
    effects.push({
      kind: 'notification',
      record: {
        organizationId: ORGANIZATION_ID,
        userId,
        type,
        title,
        body,
        createdAt: at,
        ...(entity ? { entityType: entity.type, entityId: entity.id } : {}),
        ...(read ? { readAt: addMs(at, 3_600_000) } : {}),
      },
    });
  };

  for (const [index, definition] of definitions.entries()) {
    const id = formatId('workflow', index + 1);
    const { since, createdDaysAgo, ...rest } = definition;
    const workflow: Workflow = {
      id,
      organizationId: ORGANIZATION_ID,
      ...rest,
      runCount: 0,
      metadata: metadataAt(
        addMs(now, -createdDaysAgo * DAY),
        admin,
        since,
        definition.status === 'error' ? AUTOMATION_ACTOR_ID : admin,
        definition.status === 'draft' ? 1 : random.int(2, 6),
      ),
    };
    if (definition.status === 'archived') workflow.metadata.archivedAt = since;
    dataset.workflows.set(id, workflow);
    if (index === 0) dataset.fixtures.set('edge.workflow.nested_conditions', id);

    const runs: WorkflowRun[] = [];
    const addRun = (
      at: string,
      eventId: string,
      subject: Record<string, unknown>,
      affected: { type: string; id: string; label: string } | undefined,
      perform: (actionIndex: number) => WorkflowActionResult,
      extra: Partial<WorkflowRun> = {},
    ): WorkflowRun => {
      runSequence += 1;
      const conditionsMet = evaluateConditions(workflow.conditions, subject);
      const actionResults = workflow.actions.map((_, actionIndex) =>
        conditionsMet
          ? perform(actionIndex)
          : { actionIndex, status: 'skipped' as const, message: 'The conditions did not match' },
      );
      const failed = actionResults.filter((result) => result.status === 'failed');
      const succeeded = actionResults.some((result) => result.status === 'succeeded');
      const run: WorkflowRun = {
        id: formatId('workflowRun', runSequence),
        organizationId: ORGANIZATION_ID,
        workflowId: id,
        triggerEventId: eventId,
        status:
          failed.length === 0
            ? succeeded
              ? 'succeeded'
              : 'skipped'
            : succeeded
              ? 'partially_failed'
              : 'failed',
        startedAt: at,
        completedAt: addMs(at, random.int(120, 4_000)),
        actionResults,
        triggerType: definition.trigger.type,
        conditionsMet,
        causedBy: SYSTEM_ACTOR_ID,
        chainDepth: 1,
        ...(affected
          ? {
              affectedEntityType: affected.type,
              affectedEntityId: affected.id,
              affectedLabel: affected.label,
            }
          : {}),
        ...(failed[0]?.errorCode ? { errorCode: failed[0].errorCode } : {}),
        ...extra,
      };
      runs.push(run);
      return run;
    };
    /** The notification and task actions of a matched run, written as the engine writes them. */
    const perform =
      (
        at: string,
        subject: Record<string, unknown>,
        affected: { type: string; id: string } | undefined,
      ) =>
      (actionIndex: number): WorkflowActionResult => {
        const action = workflow.actions[actionIndex] as Workflow['actions'][number];
        const key = String(action.config['recipient'] ?? action.config['assignee'] ?? '');
        const relation: Record<string, string | undefined> = {
          account_owner: (subject['customer'] as { accountOwnerId?: string } | undefined)
            ?.accountOwnerId,
          order_owner: (subject['order'] as { ownerId?: string } | undefined)?.ownerId,
          workflow_owner: workflow.ownerId,
        };
        const userId = key.startsWith('usr_') ? key : relation[key];
        const user = userId ? dataset.users.get(userId) : undefined;
        if (!user || user.status !== 'active')
          return {
            actionIndex,
            status: 'failed',
            errorCode: 'ACTION_TARGET_NOT_FOUND',
            message: user
              ? `${user.displayName} is ${user.status}`
              : `“${key}” names no one on this event`,
          };
        const title = String(action.config['title']);
        if (action.type === 'send_notification') {
          notify(user.id, title, String(action.config['body'] ?? ''), at, affected);
          return { actionIndex, status: 'succeeded', message: `Notified ${user.displayName}` };
        }
        const days = action.config['dueInDays'];
        const task: Omit<Task, 'id'> = {
          organizationId: ORGANIZATION_ID,
          title,
          description: `Created by the workflow “${workflow.name}”.`,
          assigneeId: user.id,
          createdBy: AUTOMATION_ACTOR_ID,
          priority: (action.config['priority'] as Task['priority'] | undefined) ?? 'normal',
          status: 'open',
          createdAt: at,
          ...(typeof days === 'number' ? { dueDate: addDays(businessDateOf(at), days) } : {}),
          ...(affected ? { relatedEntityType: affected.type, relatedEntityId: affected.id } : {}),
        };
        effects.push({ kind: 'task', record: task, notify: true });
        return {
          actionIndex,
          status: 'succeeded',
          message: `Created the task “${title}” for ${user.displayName}`,
        };
      };

    const customerSubject = (customerId: string): Record<string, unknown> | undefined => {
      const customer = dataset.customers.get(customerId);
      return customer
        ? {
            id: customer.id,
            accountOwnerId: customer.accountOwnerId,
            segment: customer.segment,
            status: customer.status,
            health: customer.health,
            regionCode: customer.regionCode,
            tags: [...customer.tags],
          }
        : undefined;
    };
    const inWindow = (at: string | undefined, from = windowStart, to = now): boolean =>
      at !== undefined && at > from && at <= to;
    const eventsBefore = (status: Workflow['status']) =>
      status === 'paused' ? addMs(since, -4 * DAY) : windowStart;

    switch (definition.trigger.type) {
      case 'order.confirmed': {
        if (definition.status !== 'active' && definition.status !== 'paused') break;
        const until = definition.status === 'paused' ? since : now;
        const from = eventsBefore(definition.status);
        const orders = [...dataset.salesOrders.values()]
          .filter((order) => inWindow(order.confirmedAt, from, until))
          .filter((order) => definition.status === 'active' || active(order.ownerId))
          .sort((a, b) => (a.confirmedAt as string).localeCompare(b.confirmedAt as string))
          .slice(definition.status === 'paused' ? -40 : -1000);
        for (const order of orders) {
          const at = order.confirmedAt as string;
          const subject = {
            customer: customerSubject(order.customerId),
            order: {
              id: order.id,
              ownerId: order.ownerId,
              totalUsd: usdMinor(order.total, order.fxRateToUsd),
              grossMarginBps: order.grossMarginBps,
              riskFlags: [...order.riskFlags],
              customerPoNumber: order.customerPoNumber ?? '',
              currency: order.currency,
            },
          };
          const affected = { type: 'sales_order', id: order.id, label: order.orderNumber };
          addRun(
            at,
            `order.confirmed:${order.id}`,
            subject,
            affected,
            perform(at, subject, affected),
          );
        }
        break;
      }
      case 'customer.status_changed': {
        const customers = [...dataset.customers.values()]
          .filter(
            (customer) => customer.status === 'on_hold' && inWindow(customer.metadata.updatedAt),
          )
          .sort((a, b) => a.metadata.updatedAt.localeCompare(b.metadata.updatedAt));
        for (const customer of customers) {
          const at = customer.metadata.updatedAt;
          const subject = {
            customer: { ...customerSubject(customer.id), previousStatus: 'active' },
          };
          const affected = { type: 'customer', id: customer.id, label: customer.displayName };
          addRun(
            at,
            `customer.status_changed:${customer.id}:${at}`,
            subject,
            affected,
            perform(at, subject, affected),
          );
        }
        break;
      }
      case 'invoice.overdue': {
        const invoices = [...dataset.invoices.values()]
          .filter(
            (invoice) =>
              invoice.lifecycle === 'open' &&
              invoice.collectionState === 'overdue' &&
              compareDates(addDays(invoice.dueDate, 1), businessDateOf(windowStart)) >= 0 &&
              compareDates(addDays(invoice.dueDate, 1), today) <= 0,
          )
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
          .slice(-150);
        for (const invoice of invoices) {
          const turned = businessDateToInstant(addDays(invoice.dueDate, 1), 6);
          const at = turned > now ? now : turned;
          const rate = invoice.fxRateToUsd ?? FX_RATES_TO_USD[invoice.currency];
          const subject = {
            customer: customerSubject(invoice.customerId),
            invoice: {
              id: invoice.id,
              outstandingUsd: usdMinor(invoice.outstanding, rate),
              totalUsd: usdMinor(invoice.total, rate),
              currency: invoice.currency,
            },
          };
          const affected = {
            type: 'invoice',
            id: invoice.id,
            label: invoice.invoiceNumber ?? invoice.id,
          };
          addRun(
            at,
            `invoice.overdue:${invoice.id}:${invoice.dueDate}`,
            subject,
            affected,
            perform(at, subject, affected),
          );
        }
        break;
      }
      case 'ticket.escalated': {
        const escalated = [...dataset.tickets.values()]
          .filter(
            (ticket) => ticket.status === 'escalated' && inWindow(ticket.metadata.updatedAt, since),
          )
          .sort((a, b) => a.metadata.updatedAt.localeCompare(b.metadata.updatedAt));
        for (const ticket of escalated) {
          const subject = {
            customer: customerSubject(ticket.customerId),
            ticket: { id: ticket.id, priority: ticket.priority, assigneeId: ticket.assigneeId },
          };
          const matched = evaluateConditions(workflow.conditions, subject);
          // A matched escalation the ticket shows no trace of is not seeded as a run of this workflow.
          if (matched && ticket.assigneeId !== aisha) continue;
          const at = ticket.metadata.updatedAt;
          const affected = { type: 'support_ticket', id: ticket.id, label: ticket.ticketNumber };
          addRun(at, `ticket.escalated:${ticket.id}`, subject, affected, (actionIndex) => ({
            actionIndex,
            status: 'succeeded',
            message: `Assigned ${ticket.ticketNumber} to Aisha Grant`,
          }));
        }
        break;
      }
      case 'schedule.weekly': {
        const delayed = [...dataset.purchaseOrders.values()].filter((po) =>
          po.exceptionFlags.includes('delayed'),
        ).length;
        for (let back = 28; back >= 0; back -= 1) {
          const date = addDays(today, -back);
          if (weekdayOf(date) !== 1) continue;
          const at = businessDateToInstant(date, 7);
          if (at > now) continue;
          const subject = {
            schedule: { date, hour: 7, weekday: 'monday' },
            metrics: { delayedPurchaseOrders: delayed },
          };
          addRun(at, `schedule:${date}`, subject, undefined, perform(at, subject, undefined), {
            occurrences: 1,
          });
        }
        break;
      }
      case 'order.value_changed': {
        if (definition.status !== 'error') break;
        // The run that put it in error: a draft's value changed, and a draft cannot be held.
        const draft =
          [...dataset.salesOrders.values()].find((order) => order.status === 'draft') ??
          [...dataset.salesOrders.values()][0];
        if (!draft) break;
        const subject = { customer: { creditUtilizationBps: 11_840 } };
        const run = addRun(
          since,
          `order.value_changed:${draft.id}`,
          subject,
          { type: 'sales_order', id: draft.id, label: draft.orderNumber },
          (actionIndex) => ({
            actionIndex,
            status: 'failed',
            errorCode: 'ACTION_REFUSED',
            message: `Order in status ${draft.status} cannot be placed on hold`,
          }),
          { causedBy: draft.ownerId },
        );
        dataset.fixtures.set('edge.workflow.failed_run', run.id);
        notify(
          workflow.ownerId,
          `Workflow stopped: ${workflow.name}`,
          `Order in status ${draft.status} cannot be placed on hold. It runs again once it is edited and activated.`,
          since,
          { type: 'workflow', id },
          'action_required',
        );
        break;
      }
      default:
        break;
    }
    for (const run of runs) dataset.workflowRuns.set(run.id, run);
    workflow.runCount = runs.length;
    const last = runs.reduce<string | undefined>(
      (latest, run) => (latest === undefined || run.startedAt > latest ? run.startedAt : latest),
      undefined,
    );
    if (last) workflow.lastRunAt = last;
  }
  return effects;
}

/** Writes the seeded runs' notifications and tasks, numbered after every other one. */
function seedWorkflowEffects(context: SeedContext, effects: readonly WorkflowEffect[]): void {
  const { dataset } = context;
  const next = (map: Map<string, unknown>): (() => number) => {
    let sequence = 0;
    for (const id of map.keys()) sequence = Math.max(sequence, idSequence(id));
    return () => (sequence += 1);
  };
  const notificationId = next(dataset.notifications);
  const taskId = next(dataset.tasks);
  for (const effect of effects) {
    if (effect.kind === 'notification') {
      const id = formatId('notification', notificationId());
      dataset.notifications.set(id, { id, ...effect.record });
      continue;
    }
    const id = formatId('task', taskId());
    const task: Task = { id, ...effect.record };
    dataset.tasks.set(id, task);
    if (!effect.notify) continue;
    const noticeId = formatId('notification', notificationId());
    const read = Date.parse(context.now) - Date.parse(task.createdAt) > DAY;
    dataset.notifications.set(noticeId, {
      id: noticeId,
      organizationId: ORGANIZATION_ID,
      userId: task.assigneeId,
      type: 'action_required',
      title: `New task: ${task.title}`,
      body: task.description ?? '',
      createdAt: task.createdAt,
      ...(task.relatedEntityType && task.relatedEntityId
        ? { entityType: task.relatedEntityType, entityId: task.relatedEntityId }
        : { entityType: 'task', entityId: id }),
      ...(read ? { readAt: addMs(task.createdAt, 3_600_000) } : {}),
    });
  }
}

function seedNotificationsAndTasks(context: SeedContext, tenant: TenantSeedResult): void {
  const { dataset, now, today } = context;
  const random = context.random('notifications');
  const pendingApprovals = [...dataset.approvalRequests.values()].filter(
    (request) => request.status === 'pending',
  );
  const overdueInvoices = [...dataset.invoices.values()]
    .filter((invoice) => invoice.collectionState === 'overdue')
    .slice(0, 60);
  const delayedPos = [...dataset.purchaseOrders.values()]
    .filter((po) => po.exceptionFlags.includes('delayed'))
    .slice(0, 40);
  const escalatedTickets = [...dataset.tickets.values()]
    .filter((ticket) => ticket.status === 'escalated')
    .slice(0, 40);
  const recentShipments = [...dataset.shipments.values()].filter(
    (shipment) => shipment.status === 'exception',
  );
  let counter = 0;
  const add = (
    userId: string,
    type: Notification['type'],
    title: string,
    body: string,
    entityType: string | undefined,
    entityId: string | undefined,
    hoursAgo: number,
    read: boolean,
  ): void => {
    counter += 1;
    const createdAt = addMs(now, -hoursAgo * 3_600_000);
    const notification: Notification = {
      id: formatId('notification', counter),
      organizationId: ORGANIZATION_ID,
      userId,
      type,
      title,
      body,
      createdAt,
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(read ? { readAt: addMs(createdAt, random.int(5, 600) * 60_000) } : {}),
    };
    dataset.notifications.set(notification.id, notification);
  };
  for (const [personaKey, userId] of tenant.personaUserIds) {
    const count = random.int(9, 22);
    for (let index = 0; index < count; index += 1) {
      const hoursAgo = Math.round(random.logNormal(20, 1.1));
      const read = hoursAgo > 30 ? random.chance(0.85) : random.chance(0.35);
      const roll = random.next();
      if (
        roll < 0.25 &&
        pendingApprovals.length > 0 &&
        (personaKey === 'sofia-ramirez' ||
          personaKey === 'priya-shah' ||
          personaKey === 'maya-chen')
      ) {
        const approval = random.pick(pendingApprovals);
        add(
          userId,
          'action_required',
          `Approval requested: ${approval.targetNumber}`,
          `${approval.reasons.join('; ')}.`,
          'approval_request',
          approval.id,
          hoursAgo,
          read,
        );
      } else if (
        roll < 0.45 &&
        overdueInvoices.length > 0 &&
        (personaKey === 'priya-shah' ||
          personaKey === 'noah-bennett' ||
          personaKey === 'sofia-ramirez')
      ) {
        const invoice = random.pick(overdueInvoices);
        const customer = dataset.customers.get(invoice.customerId);
        add(
          userId,
          'warning',
          `Invoice ${invoice.invoiceNumber} is ${diffDays(today, invoice.dueDate)} days overdue`,
          `${customer?.displayName ?? 'Customer'} owes ${(invoice.outstanding.minor / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency })}.`,
          'invoice',
          invoice.id,
          hoursAgo,
          read,
        );
      } else if (
        roll < 0.6 &&
        delayedPos.length > 0 &&
        (personaKey === 'marcus-lee' || personaKey === 'jordan-wells')
      ) {
        const po = random.pick(delayedPos);
        add(
          userId,
          'warning',
          `${po.purchaseOrderNumber} is past its expected date`,
          `Expected ${po.expectedDate}; supplier has not confirmed a new date.`,
          'purchase_order',
          po.id,
          hoursAgo,
          read,
        );
      } else if (
        roll < 0.75 &&
        escalatedTickets.length > 0 &&
        (personaKey === 'aisha-grant' || personaKey === 'evan-brooks')
      ) {
        const ticket = random.pick(escalatedTickets);
        add(
          userId,
          'action_required',
          `Ticket ${ticket.ticketNumber} escalated`,
          ticket.subject,
          'support_ticket',
          ticket.id,
          hoursAgo,
          read,
        );
      } else if (roll < 0.85 && recentShipments.length > 0) {
        const shipment = random.pick(recentShipments);
        add(
          userId,
          'warning',
          `Shipment ${shipment.shipmentNumber} reported an exception`,
          shipment.exceptionMessage ?? 'Carrier exception.',
          'shipment',
          shipment.id,
          hoursAgo,
          read,
        );
      } else {
        add(
          userId,
          random.pick(['info', 'success']),
          random.pick([
            'Weekly digest is ready',
            'Your saved view was shared',
            'Import completed with warnings',
            'Password will expire in 7 days',
            'New release notes available',
          ]),
          random.pick([
            "Open the report to review last week's numbers.",
            'The Finance team can now see "Overdue > 60 days".',
            '2 of 240 rows were skipped.',
            'Update it from your profile settings.',
            'Highlights: faster order search, new inventory filters.',
          ]),
          undefined,
          undefined,
          hoursAgo,
          read,
        );
      }
    }
  }

  // Tasks
  let taskCounter = 0;
  const addTask = (
    task: Omit<Task, 'id' | 'organizationId' | 'createdAt'> & { daysAgo: number },
  ): void => {
    taskCounter += 1;
    const { daysAgo, ...rest } = task;
    const record: Task = {
      id: formatId('task', taskCounter),
      organizationId: ORGANIZATION_ID,
      createdAt: instantOn(addDays(today, -daysAgo), random),
      ...rest,
    };
    if (record.status === 'completed')
      record.completedAt = addMs(record.createdAt, random.int(2, 96) * 3_600_000);
    dataset.tasks.set(record.id, record);
  };
  const noah = tenant.personaUserIds.get('noah-bennett') as string;
  const sofia = tenant.personaUserIds.get('sofia-ramirez') as string;
  const priya = tenant.personaUserIds.get('priya-shah') as string;
  const marcus = tenant.personaUserIds.get('marcus-lee') as string;
  const aisha = tenant.personaUserIds.get('aisha-grant') as string;
  const meridian = dataset.fixtures.get('flagship.customer.meridian');
  addTask({
    title: 'Prepare Meridian renewal pricing on top 20 SKUs',
    description: 'Include contract price comparison and OTD metrics for the QBR.',
    assigneeId: noah,
    createdBy: sofia,
    dueDate: addDays(today, 6),
    priority: 'high',
    status: 'open',
    daysAgo: 3,
    ...(meridian ? { relatedEntityType: 'customer', relatedEntityId: meridian } : {}),
  });
  addTask({
    title: 'Call Meridian AP about INV-2026-02891',
    assigneeId: priya,
    createdBy: priya,
    dueDate: today,
    priority: 'high',
    status: 'open',
    daysAgo: 1,
    ...(meridian ? { relatedEntityType: 'customer', relatedEntityId: meridian } : {}),
  });
  for (const [index, invoice] of overdueInvoices.slice(0, 14).entries()) {
    const customer = dataset.customers.get(invoice.customerId);
    addTask({
      title: `Collections follow-up: ${customer?.displayName ?? invoice.customerId}`,
      assigneeId: index % 3 === 0 ? priya : random.pick(overdueActors(context, tenant)),
      createdBy: priya,
      dueDate: addDays(today, random.int(-2, 10)),
      priority: invoice.outstanding.minor > 2_500_000 ? 'high' : 'normal',
      status: random.chance(0.3) ? 'completed' : 'open',
      relatedEntityType: 'invoice',
      relatedEntityId: invoice.id,
      daysAgo: random.int(1, 20),
    });
  }
  for (const po of delayedPos.slice(0, 10)) {
    addTask({
      title: `Confirm new ship date for ${po.purchaseOrderNumber}`,
      assigneeId: marcus,
      createdBy: marcus,
      dueDate: addDays(today, random.int(0, 5)),
      priority: 'normal',
      status: random.chance(0.25) ? 'completed' : 'open',
      relatedEntityType: 'purchase_order',
      relatedEntityId: po.id,
      daysAgo: random.int(1, 12),
    });
  }
  for (const ticket of escalatedTickets.slice(0, 8)) {
    addTask({
      title: `Escalation review: ${ticket.ticketNumber}`,
      assigneeId: aisha,
      createdBy: aisha,
      dueDate: addDays(today, random.int(0, 2)),
      priority: ticket.priority === 'urgent' ? 'high' : 'normal',
      status: 'open',
      relatedEntityType: 'support_ticket',
      relatedEntityId: ticket.id,
      daysAgo: random.int(0, 4),
    });
  }
  addTask({
    title: 'Review reorder suggestions for CHI-01',
    assigneeId: marcus,
    createdBy: 'usr_system_automation',
    dueDate: addDays(today, 2),
    priority: 'normal',
    status: 'open',
    daysAgo: 1,
  });
  addTask({
    title: 'Archive inactive suppliers without POs in 18 months',
    assigneeId: marcus,
    createdBy: tenant.personaUserIds.get('maya-chen') as string,
    dueDate: addDays(today, 30),
    priority: 'low',
    status: 'open',
    daysAgo: 9,
  });
  addTask({
    title: 'Cancelled: migrate legacy price list',
    assigneeId: tenant.personaUserIds.get('maya-chen') as string,
    createdBy: tenant.personaUserIds.get('maya-chen') as string,
    priority: 'low',
    status: 'cancelled',
    daysAgo: 40,
  });
}

function overdueActors(context: SeedContext, tenant: TenantSeedResult): string[] {
  const accountant = tenant.roleIdsByKey.get('accountant');
  const actors = [...context.dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        assignment.roleId === accountant &&
        context.dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  return actors.length > 0 ? actors : [tenant.personaUserIds.get('priya-shah') as string];
}

function seedSavedViews(context: SeedContext, tenant: TenantSeedResult): void {
  const { dataset, now } = context;
  const random = context.random('saved-views');
  const definitions: {
    persona: string;
    resource: SavedView['resource'];
    name: string;
    isDefault: boolean;
    filters: SavedView['state']['filters'];
    sort: SavedView['state']['sort'];
    columns: string[];
  }[] = [
    {
      persona: 'sofia-ramirez',
      resource: 'orders',
      name: 'Pending my approval',
      isDefault: true,
      filters: [{ field: 'status', operator: 'eq', value: 'pending_approval' }],
      sort: [{ field: 'total', direction: 'desc' }],
      columns: ['orderNumber', 'customer', 'total', 'grossMarginBps', 'riskFlags', 'orderDate'],
    },
    {
      persona: 'sofia-ramirez',
      resource: 'orders',
      name: 'Central region — this month',
      isDefault: false,
      filters: [
        { field: 'salesTeamId', operator: 'eq', value: tenant.teamIdsByCode.get('SALES-C') },
        { field: 'orderDate', operator: 'gte', value: `${context.today.slice(0, 7)}-01` },
      ],
      sort: [{ field: 'orderDate', direction: 'desc' }],
      columns: ['orderNumber', 'customer', 'status', 'fulfillmentStatus', 'total'],
    },
    {
      persona: 'sofia-ramirez',
      resource: 'customers',
      name: 'At-risk accounts',
      isDefault: false,
      filters: [{ field: 'health', operator: 'eq', value: 'at_risk' }],
      sort: [{ field: 'creditUtilizationBps', direction: 'desc' }],
      columns: ['displayName', 'segment', 'health', 'grossReceivables', 'accountOwner'],
    },
    {
      persona: 'noah-bennett',
      resource: 'customers',
      name: 'My accounts',
      isDefault: true,
      filters: [
        {
          field: 'accountOwnerId',
          operator: 'eq',
          value: tenant.personaUserIds.get('noah-bennett'),
        },
      ],
      sort: [{ field: 'displayName', direction: 'asc' }],
      columns: ['displayName', 'status', 'health', 'ordersLast12Months', 'primaryContact'],
    },
    {
      persona: 'noah-bennett',
      resource: 'orders',
      name: 'My open orders',
      isDefault: true,
      filters: [
        { field: 'ownerId', operator: 'eq', value: tenant.personaUserIds.get('noah-bennett') },
        { field: 'status', operator: 'in', value: ['confirmed', 'on_hold', 'pending_approval'] },
      ],
      sort: [{ field: 'orderDate', direction: 'desc' }],
      columns: [
        'orderNumber',
        'customer',
        'status',
        'allocationStatus',
        'fulfillmentStatus',
        'total',
      ],
    },
    {
      persona: 'priya-shah',
      resource: 'invoices',
      name: 'Overdue > 60 days',
      isDefault: true,
      filters: [
        { field: 'collectionState', operator: 'eq', value: 'overdue' },
        { field: 'daysOverdue', operator: 'gte', value: 60 },
      ],
      sort: [{ field: 'outstanding', direction: 'desc' }],
      columns: ['invoiceNumber', 'customer', 'dueDate', 'daysOverdue', 'outstanding'],
    },
    {
      persona: 'priya-shah',
      resource: 'invoices',
      name: 'Disputed',
      isDefault: false,
      filters: [{ field: 'collectionState', operator: 'eq', value: 'disputed' }],
      sort: [{ field: 'issueDate', direction: 'desc' }],
      columns: ['invoiceNumber', 'customer', 'disputeReason', 'outstanding'],
    },
    {
      persona: 'marcus-lee',
      resource: 'purchase_orders',
      name: 'Delayed POs',
      isDefault: true,
      filters: [{ field: 'exceptionFlags', operator: 'contains', value: 'delayed' }],
      sort: [{ field: 'expectedDate', direction: 'asc' }],
      columns: ['purchaseOrderNumber', 'supplier', 'expectedDate', 'status', 'total'],
    },
    {
      persona: 'jordan-wells',
      resource: 'inventory',
      name: 'CHI-01 below reorder point',
      isDefault: true,
      filters: [
        { field: 'warehouseId', operator: 'eq', value: tenant.warehouseIdsByCode.get('CHI-01') },
        { field: 'belowReorderPoint', operator: 'eq', value: true },
      ],
      sort: [{ field: 'available', direction: 'asc' }],
      columns: ['sku', 'name', 'onHand', 'reserved', 'available', 'inbound'],
    },
    {
      persona: 'aisha-grant',
      resource: 'tickets',
      name: 'My queue',
      isDefault: true,
      filters: [
        { field: 'assigneeId', operator: 'eq', value: tenant.personaUserIds.get('aisha-grant') },
        {
          field: 'status',
          operator: 'in',
          value: ['new', 'open', 'escalated', 'pending_internal'],
        },
      ],
      sort: [{ field: 'resolutionDueAt', direction: 'asc' }],
      columns: ['ticketNumber', 'subject', 'customer', 'priority', 'status', 'resolutionSla'],
    },
    {
      persona: 'aisha-grant',
      resource: 'tickets',
      name: 'SLA at risk',
      isDefault: false,
      filters: [{ field: 'resolutionSla', operator: 'in', value: ['at_risk', 'breached'] }],
      sort: [{ field: 'priority', direction: 'desc' }],
      columns: ['ticketNumber', 'subject', 'priority', 'firstResponseSla', 'resolutionSla'],
    },
    {
      persona: 'owen-price',
      resource: 'audit',
      name: 'Finance mutations — last 7 days',
      isDefault: true,
      filters: [
        { field: 'entityType', operator: 'in', value: ['invoice', 'payment', 'credit_memo'] },
      ],
      sort: [{ field: 'occurredAt', direction: 'desc' }],
      columns: ['occurredAt', 'actor', 'action', 'entityType', 'entityId'],
    },
    {
      persona: 'evan-brooks',
      resource: 'customers',
      name: 'Strategic accounts',
      isDefault: true,
      filters: [{ field: 'segment', operator: 'eq', value: 'strategic' }],
      sort: [{ field: 'lifetimeRevenue', direction: 'desc' }],
      columns: ['displayName', 'health', 'lifetimeRevenue', 'ordersLast12Months', 'accountOwner'],
    },
  ];
  for (const [index, definition] of definitions.entries()) {
    const userId = tenant.personaUserIds.get(definition.persona) as string;
    const createdAt = addMs(now, -random.int(5, 300) * 24 * 3_600_000);
    const view: SavedView = {
      id: formatId('savedView', index + 1),
      organizationId: ORGANIZATION_ID,
      userId,
      resource: definition.resource,
      name: definition.name,
      isDefault: definition.isDefault,
      state: {
        filters: definition.filters,
        sort: definition.sort,
        visibleColumns: definition.columns,
        columnOrder: definition.columns,
        density: random.chance(0.4) ? 'compact' : 'comfortable',
        pageSize: random.pick([25, 50, 50, 100]),
      },
      metadata: metadataAt(createdAt, userId, createdAt, userId, 1),
    };
    dataset.savedViews.set(view.id, view);
  }
}

function seedImportJob(context: SeedContext, tenant: TenantSeedResult): void {
  const { dataset, now } = context;
  const admin = tenant.personaUserIds.get('maya-chen') as string;
  const createdAt = addMs(now, -3 * 24 * 3_600_000);
  const job: ImportJob = {
    id: formatId('importJob', 1),
    organizationId: ORGANIZATION_ID,
    type: 'customers',
    fileName: 'tradeshow-leads-2026-08.csv',
    status: 'completed_with_errors',
    createdBy: admin,
    columns: ['Company', 'Contact Email', 'Phone', 'State', 'Segment', 'Rep', 'Terms'],
    mapping: {
      Company: 'Company Name',
      'Contact Email': 'Primary Email',
      Phone: 'Phone',
      Segment: 'Segment',
      Rep: 'Account Owner',
      Terms: 'Payment Terms',
    },
    sampleRows: [
      [
        'Larkspur Bottling Co.',
        'purchasing@larkspurbottling.example',
        '(312) 555-0142',
        'IL',
        'SMB',
        'Noah Bennett',
        'NET 30',
      ],
      [
        'Crestview Composites',
        'ap@crestviewcomposites.example',
        '',
        'TX',
        'Mid-Market',
        'Unknown Rep',
        'NET 45',
      ],
      ['', 'info@example.com', '(404) 555-0199', 'GA', 'SMB', 'Noah Bennett', 'NET 30'],
    ],
    issues: [
      {
        row: 3,
        field: 'Company Name',
        severity: 'error',
        code: 'REQUIRED',
        message: 'Company Name is required.',
      },
      {
        row: 2,
        field: 'Account Owner',
        severity: 'warning',
        code: 'UNRESOLVED_OWNER',
        message: 'Account owner "Unknown Rep" not found; defaulted to importer.',
      },
      {
        row: 17,
        field: 'Payment Terms',
        severity: 'warning',
        code: 'UNKNOWN_TERMS',
        message: 'Payment terms "NET 90" are not supported; defaulted to NET_30.',
      },
      {
        row: 41,
        field: 'Primary Email',
        severity: 'error',
        code: 'INVALID_EMAIL',
        message: 'Value is not a valid email address.',
      },
    ],
    result: {
      totalRows: 240,
      validRows: 228,
      warningRows: 9,
      errorRows: 3,
      importedRows: 237,
      skippedRows: 3,
    },
    metadata: metadataAt(createdAt, admin, addMs(createdAt, 240_000), admin, 5),
  };
  dataset.importJobs.set(job.id, job);
}
