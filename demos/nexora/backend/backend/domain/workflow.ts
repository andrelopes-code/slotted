import type { EntityMetadata } from './common';

export type WorkflowTriggerType =
  | 'order.created'
  | 'order.confirmed'
  | 'order.value_changed'
  | 'invoice.overdue'
  | 'inventory.below_reorder_point'
  | 'ticket.escalated'
  | 'customer.status_changed'
  | 'schedule.daily'
  | 'schedule.weekly';

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export type ConditionNode =
  | { type: 'group'; operator: 'and' | 'or'; children: ConditionNode[] }
  | { type: 'condition'; field: string; operator: ConditionOperator; value: unknown };

export type WorkflowActionType =
  | 'assign_user'
  | 'create_task'
  | 'send_notification'
  | 'request_approval'
  | 'add_tag'
  | 'remove_tag'
  | 'place_customer_on_hold'
  | 'place_order_on_hold'
  | 'create_purchase_order_draft';

export interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, unknown>;
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger: { type: WorkflowTriggerType; config?: Record<string, unknown> };
  conditions: ConditionNode;
  actions: WorkflowAction[];
  /** The person the workflow answers to: told when it stops on a failure (section 15 "owner"). */
  ownerId: string;
  lastRunAt?: string;
  runCount: number;
  metadata: EntityMetadata;
}

export type WorkflowRunStatus =
  'queued' | 'running' | 'succeeded' | 'partially_failed' | 'failed' | 'skipped';

/**
 * The codes a run and its actions are written with: one vocabulary, read by
 * the client and said to the reader in words. An action that a domain service
 * refuses keeps the service's message beside the code.
 */
export const WORKFLOW_RUN_ERROR_CODES = [
  /** The person or record the action names is missing, inactive, or not one the event's records have. */
  'ACTION_TARGET_NOT_FOUND',
  /** The record's state refused the command the action invokes. */
  'ACTION_REFUSED',
  /** The automation actor does not hold the permission the command requires. */
  'ACTION_NOT_PERMITTED',
  /** The action's configuration is incomplete or names a value the command does not accept. */
  'ACTION_INVALID',
  /** Section 69.4: the run would have been the sixth of one chain of events. */
  'WORKFLOW_RECURSION_LIMIT',
] as const;

export type WorkflowRunErrorCode = (typeof WORKFLOW_RUN_ERROR_CODES)[number];

export interface WorkflowActionResult {
  actionIndex: number;
  status: 'succeeded' | 'failed' | 'skipped';
  errorCode?: WorkflowRunErrorCode;
  /** What the action did, or why it did nothing or failed. */
  message?: string;
}

export interface WorkflowRun {
  id: string;
  organizationId: string;
  workflowId: string;
  triggerEventId: string;
  status: WorkflowRunStatus;
  startedAt: string;
  completedAt?: string;
  affectedEntityType?: string;
  affectedEntityId?: string;
  /** How the history names the affected record, as it was named when the run happened. */
  affectedLabel?: string;
  actionResults: WorkflowActionResult[];
  errorCode?: WorkflowRunErrorCode;
  /** The trigger the event was, as the workflow's trigger was when it ran. */
  triggerType: WorkflowTriggerType;
  /** False when the condition tree did not match the event: no action ran. */
  conditionsMet: boolean;
  /** The person whose command produced the event; the system actor for a clock or a schedule. */
  causedBy: string;
  /** Section 69.4: 1 for an event a person's command produced, one more per workflow in the chain. */
  chainDepth: number;
  /** The run whose action produced the event, for a chained run. */
  parentRunId?: string;
  /** Section 69.5: the scheduled occurrences one collapsed run stands for. */
  occurrences?: number;
}

export const WORKFLOW_LIMITS = {
  /** Section 69.2: group levels, the root group being the first. */
  maxConditionDepth: 5,
  /** Section 69.2: conditions (leaves) per workflow. */
  maxConditions: 50,
  /** Section 69.4: workflows one chain of events may run. */
  maxChainDepth: 5,
  maxNameLength: 120,
  maxTitleLength: 120,
  maxBodyLength: 500,
  maxTagLength: 40,
} as const;

// ---------------------------------------------------------------------------
// The subject of each trigger (section 69.1): the fields a condition can read

export type WorkflowFieldType =
  'money' | 'bps' | 'number' | 'quantity' | 'text' | 'enum' | 'tags' | 'boolean';

export interface WorkflowFieldOption {
  value: string;
  label: string;
}

export interface WorkflowField {
  /** The dot path `evaluateConditions` reads on the subject. */
  path: string;
  label: string;
  /** The record the field belongs to, as a reader names it. */
  group: string;
  /**
   * `money`: integer minor units of US dollars, the reporting currency (section 72.1);
   * `bps`: basis points, read as a percentage; `quantity`: a decimal count in the unit of measure.
   */
  type: WorkflowFieldType;
  options?: readonly WorkflowFieldOption[];
  /** Options the catalog read fills from the tenant's own records. */
  optionsFrom?: 'warehouses' | 'categories' | 'ticketCategories';
  /** The value may be absent: the field also answers is_empty and is_not_empty. */
  optional?: boolean;
}

/** The records a trigger's subject holds; each is a top-level key of the subject. */
export type WorkflowRecord =
  | 'order'
  | 'customer'
  | 'invoice'
  | 'ticket'
  | 'sku'
  | 'inventory'
  | 'warehouse'
  | 'schedule'
  | 'metrics';

/** The entity types a run names as the record it affected; the client opens each at its address. */
export type WorkflowAffectedType =
  'sales_order' | 'customer' | 'invoice' | 'support_ticket' | 'sku';

export interface WorkflowTriggerDefinition {
  type: WorkflowTriggerType;
  /** The event, as a sentence's opening: "When an order is confirmed". */
  label: string;
  records: readonly WorkflowRecord[];
  /** The record a run is about; a schedule's run is about no record. */
  affects: WorkflowAffectedType | null;
  fields: readonly WorkflowField[];
  /** A scheduled trigger's configuration: the hour, and the weekday of a weekly one. */
  schedule?: 'daily' | 'weekly';
}

const opts = (entries: Record<string, string>): WorkflowFieldOption[] =>
  Object.entries(entries).map(([value, label]) => ({ value, label }));

export const CUSTOMER_STATUS_OPTIONS = opts({
  prospect: 'Prospect',
  active: 'Active',
  on_hold: 'On hold',
  inactive: 'Inactive',
  closed: 'Closed',
});

const CUSTOMER_FIELDS: readonly WorkflowField[] = [
  {
    path: 'customer.segment',
    label: 'Segment',
    group: 'Customer',
    type: 'enum',
    options: opts({
      strategic: 'Strategic',
      enterprise: 'Enterprise',
      mid_market: 'Mid-market',
      smb: 'Small business',
    }),
  },
  {
    path: 'customer.status',
    label: 'Status',
    group: 'Customer',
    type: 'enum',
    options: CUSTOMER_STATUS_OPTIONS,
  },
  {
    path: 'customer.health',
    label: 'Health',
    group: 'Customer',
    type: 'enum',
    options: opts({ healthy: 'Healthy', watch: 'Watch', at_risk: 'At risk' }),
  },
  {
    path: 'customer.regionCode',
    label: 'Region',
    group: 'Customer',
    type: 'enum',
    options: opts({ US: 'United States', BR: 'Brazil' }),
  },
  { path: 'customer.creditUtilizationBps', label: 'Credit used', group: 'Customer', type: 'bps' },
  {
    path: 'customer.overdueReceivablesUsd',
    label: 'Overdue receivables',
    group: 'Customer',
    type: 'money',
  },
  { path: 'customer.tags', label: 'Tags', group: 'Customer', type: 'tags' },
];

const CURRENCY_OPTIONS = opts({
  USD: 'US dollar',
  BRL: 'Brazilian real',
  EUR: 'Euro',
  GBP: 'Pound sterling',
});

const ORDER_FIELDS: readonly WorkflowField[] = [
  { path: 'order.totalUsd', label: 'Total', group: 'Order', type: 'money' },
  { path: 'order.grossMarginBps', label: 'Gross margin', group: 'Order', type: 'bps' },
  {
    path: 'order.status',
    label: 'Status',
    group: 'Order',
    type: 'enum',
    options: opts({
      draft: 'Draft',
      pending_approval: 'Pending approval',
      confirmed: 'Confirmed',
      on_hold: 'On hold',
      cancelled: 'Cancelled',
      closed: 'Closed',
    }),
  },
  {
    path: 'order.approvalStatus',
    label: 'Approval',
    group: 'Order',
    type: 'enum',
    options: opts({
      not_required: 'Not required',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    }),
  },
  {
    path: 'order.riskFlags',
    label: 'Risk flags',
    group: 'Order',
    type: 'tags',
    options: opts({
      credit_limit_exceeded: 'Credit limit exceeded',
      low_margin: 'Low margin',
      high_discount: 'High discount',
      inventory_shortage: 'Inventory shortage',
      requested_date_at_risk: 'Requested date at risk',
      customer_on_hold: 'Customer on hold',
      overdue_receivables: 'Overdue receivables',
    }),
  },
  { path: 'order.lineCount', label: 'Lines', group: 'Order', type: 'number' },
  {
    path: 'order.customerPoNumber',
    label: 'Customer PO number',
    group: 'Order',
    type: 'text',
    optional: true,
  },
  {
    path: 'order.currency',
    label: 'Currency',
    group: 'Order',
    type: 'enum',
    options: CURRENCY_OPTIONS,
  },
];

const TICKET_FIELDS: readonly WorkflowField[] = [
  {
    path: 'ticket.priority',
    label: 'Priority',
    group: 'Ticket',
    type: 'enum',
    options: opts({ urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' }),
  },
  {
    path: 'ticket.channel',
    label: 'Channel',
    group: 'Ticket',
    type: 'enum',
    options: opts({
      email: 'Email',
      phone: 'Phone',
      portal: 'Portal',
      chat: 'Chat',
      internal: 'Internal',
    }),
  },
  {
    path: 'ticket.category',
    label: 'Category',
    group: 'Ticket',
    type: 'enum',
    optionsFrom: 'ticketCategories',
  },
  { path: 'ticket.tags', label: 'Tags', group: 'Ticket', type: 'tags' },
  ...(['firstResponseSla', 'resolutionSla'] as const).map((key): WorkflowField => ({
    path: `ticket.${key}`,
    label: key === 'firstResponseSla' ? 'First-response SLA' : 'Resolution SLA',
    group: 'Ticket',
    type: 'enum',
    options: opts({
      running: 'Running',
      at_risk: 'At risk',
      breached: 'Breached',
      met: 'Met',
      paused: 'Paused',
      not_applicable: 'Not applicable',
    }),
  })),
];

const INVOICE_FIELDS: readonly WorkflowField[] = [
  { path: 'invoice.outstandingUsd', label: 'Outstanding', group: 'Invoice', type: 'money' },
  { path: 'invoice.totalUsd', label: 'Total', group: 'Invoice', type: 'money' },
  { path: 'invoice.daysOverdue', label: 'Days overdue', group: 'Invoice', type: 'number' },
  {
    path: 'invoice.currency',
    label: 'Currency',
    group: 'Invoice',
    type: 'enum',
    options: CURRENCY_OPTIONS,
  },
];

const INVENTORY_FIELDS: readonly WorkflowField[] = [
  {
    path: 'sku.status',
    label: 'Status',
    group: 'SKU',
    type: 'enum',
    options: opts({ active: 'Active', restricted: 'Restricted', discontinued: 'Discontinued' }),
  },
  {
    path: 'sku.categoryId',
    label: 'Category',
    group: 'SKU',
    type: 'enum',
    optionsFrom: 'categories',
  },
  { path: 'sku.leadTimeDays', label: 'Lead time in days', group: 'SKU', type: 'number' },
  { path: 'inventory.available', label: 'Available', group: 'Stock', type: 'quantity' },
  { path: 'inventory.onHand', label: 'On hand', group: 'Stock', type: 'quantity' },
  { path: 'inventory.inbound', label: 'Inbound', group: 'Stock', type: 'quantity' },
  { path: 'inventory.reorderPoint', label: 'Reorder point', group: 'Stock', type: 'quantity' },
  {
    path: 'inventory.suggestedQuantity',
    label: 'Suggested reorder quantity',
    group: 'Stock',
    type: 'quantity',
  },
  {
    path: 'warehouse.code',
    label: 'Warehouse',
    group: 'Stock',
    type: 'enum',
    optionsFrom: 'warehouses',
  },
];

export const WEEKDAY_OPTIONS = opts({
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
});

/** `weekday` of a weekly schedule → `weekdayOf` (0 = Sunday). */
export const WEEKDAY_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const SCHEDULE_FIELDS: readonly WorkflowField[] = [
  {
    path: 'schedule.weekday',
    label: 'Weekday',
    group: 'Schedule',
    type: 'enum',
    options: WEEKDAY_OPTIONS,
  },
  {
    path: 'metrics.overdueInvoices',
    label: 'Overdue invoices',
    group: 'Tenant now',
    type: 'number',
  },
  {
    path: 'metrics.delayedPurchaseOrders',
    label: 'Delayed purchase orders',
    group: 'Tenant now',
    type: 'number',
  },
  {
    path: 'metrics.quotesExpiringSoon',
    label: 'Sent quotes expiring within 3 days',
    group: 'Tenant now',
    type: 'number',
  },
  {
    path: 'metrics.escalatedTickets',
    label: 'Escalated tickets',
    group: 'Tenant now',
    type: 'number',
  },
  {
    path: 'metrics.positionsBelowReorderPoint',
    label: 'Stock positions below reorder point',
    group: 'Tenant now',
    type: 'number',
  },
  {
    path: 'metrics.pendingApprovals',
    label: 'Approvals waiting',
    group: 'Tenant now',
    type: 'number',
  },
];

/** Section 69.1 — every trigger with the subject its runs read. */
export const WORKFLOW_TRIGGERS: readonly WorkflowTriggerDefinition[] = [
  {
    type: 'order.created',
    label: 'An order is created',
    records: ['order', 'customer'],
    affects: 'sales_order',
    fields: [...ORDER_FIELDS, ...CUSTOMER_FIELDS],
  },
  {
    type: 'order.confirmed',
    label: 'An order is confirmed',
    records: ['order', 'customer'],
    affects: 'sales_order',
    fields: [...ORDER_FIELDS, ...CUSTOMER_FIELDS],
  },
  {
    type: 'order.value_changed',
    label: "An order's value changes",
    records: ['order', 'customer'],
    affects: 'sales_order',
    fields: [
      ...ORDER_FIELDS,
      {
        path: 'order.previousTotalUsd',
        label: 'Total before the change',
        group: 'Order',
        type: 'money',
      },
      ...CUSTOMER_FIELDS,
    ],
  },
  {
    type: 'invoice.overdue',
    label: 'An invoice becomes overdue',
    records: ['invoice', 'customer'],
    affects: 'invoice',
    fields: [...INVOICE_FIELDS, ...CUSTOMER_FIELDS],
  },
  {
    type: 'inventory.below_reorder_point',
    label: 'Stock falls below its reorder point',
    records: ['sku', 'inventory', 'warehouse'],
    affects: 'sku',
    fields: INVENTORY_FIELDS,
  },
  {
    type: 'ticket.escalated',
    label: 'A ticket is escalated',
    records: ['ticket', 'customer'],
    affects: 'support_ticket',
    fields: [...TICKET_FIELDS, ...CUSTOMER_FIELDS],
  },
  {
    type: 'customer.status_changed',
    label: "A customer's status changes",
    records: ['customer'],
    affects: 'customer',
    fields: [
      ...CUSTOMER_FIELDS,
      {
        path: 'customer.previousStatus',
        label: 'Status before the change',
        group: 'Customer',
        type: 'enum',
        options: CUSTOMER_STATUS_OPTIONS,
      },
    ],
  },
  {
    type: 'schedule.daily',
    label: 'Every day',
    records: ['schedule', 'metrics'],
    affects: null,
    fields: SCHEDULE_FIELDS,
    schedule: 'daily',
  },
  {
    type: 'schedule.weekly',
    label: 'Every week',
    records: ['schedule', 'metrics'],
    affects: null,
    fields: SCHEDULE_FIELDS.filter((field) => field.path !== 'schedule.weekday'),
    schedule: 'weekly',
  },
];

export function triggerDefinition(
  type: WorkflowTriggerType | string,
  triggers: readonly WorkflowTriggerDefinition[] = WORKFLOW_TRIGGERS,
): WorkflowTriggerDefinition | undefined {
  return triggers.find((trigger) => trigger.type === type);
}

/** Section 69.2 — the operators a field of each type answers; a combination outside them is never offered. */
export const WORKFLOW_OPERATORS: Record<WorkflowFieldType, readonly ConditionOperator[]> = {
  money: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  bps: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  quantity: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  text: ['eq', 'neq', 'contains', 'not_contains'],
  enum: ['eq', 'neq', 'in', 'not_in'],
  tags: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  boolean: ['eq'],
};

export const VALUELESS_OPERATORS: readonly ConditionOperator[] = ['is_empty', 'is_not_empty'];
export const LIST_OPERATORS: readonly ConditionOperator[] = ['in', 'not_in'];

/** The operators one field answers: its type's, and the emptiness pair where the value may be absent. */
export function operatorsFor(field: WorkflowField): readonly ConditionOperator[] {
  const base = WORKFLOW_OPERATORS[field.type];
  if (!field.optional) return base;
  return [...base, ...VALUELESS_OPERATORS.filter((operator) => !base.includes(operator))];
}

// ---------------------------------------------------------------------------
// Actions (section 69.3)

/** People an action names by their relation to the event's records rather than by name. */
export const WORKFLOW_RELATIVE_PEOPLE: Record<
  string,
  { label: string; record: WorkflowRecord | null }
> = {
  account_owner: { label: "The customer's account owner", record: 'customer' },
  order_owner: { label: "The order's owner", record: 'order' },
  ticket_assignee: { label: "The ticket's assignee", record: 'ticket' },
  workflow_owner: { label: "The workflow's owner", record: null },
};

export type WorkflowActionField =
  | {
      key: string;
      kind: 'person';
      label: string;
      required: boolean;
      /** False where only a named person will do: an assignment names whom it assigns. */
      relative: boolean;
    }
  | { key: string; kind: 'text'; label: string; required: boolean; maxLength: number }
  | {
      key: string;
      kind: 'choice';
      label: string;
      required: boolean;
      options: readonly WorkflowFieldOption[];
      /** The default a new action starts with. */
      initial?: string;
    }
  | { key: string; kind: 'number'; label: string; required: boolean; min: number; max: number }
  | { key: string; kind: 'record'; label: string; required: boolean };

export interface WorkflowActionDefinition {
  type: WorkflowActionType;
  /** The action, as a sentence's verb phrase: "notify", "create a task for". */
  label: string;
  fields: readonly WorkflowActionField[];
  /** The triggers whose records the action can act on. */
  triggers: readonly WorkflowTriggerType[];
}

const EVERY_TRIGGER = WORKFLOW_TRIGGERS.map((trigger) => trigger.type);
const WITH_CUSTOMER = WORKFLOW_TRIGGERS.filter((trigger) =>
  trigger.records.includes('customer'),
).map((trigger) => trigger.type);

export const APPROVAL_ROLE_OPTIONS = opts({
  sales_manager: 'Sales manager',
  finance_manager: 'Finance manager',
});

export const WORKFLOW_ACTIONS: readonly WorkflowActionDefinition[] = [
  {
    type: 'send_notification',
    label: 'Send a notification',
    fields: [
      { key: 'recipient', kind: 'person', label: 'Recipient', required: true, relative: true },
      {
        key: 'title',
        kind: 'text',
        label: 'Title',
        required: true,
        maxLength: WORKFLOW_LIMITS.maxTitleLength,
      },
      {
        key: 'body',
        kind: 'text',
        label: 'Message',
        required: false,
        maxLength: WORKFLOW_LIMITS.maxBodyLength,
      },
    ],
    triggers: EVERY_TRIGGER,
  },
  {
    type: 'create_task',
    label: 'Create a task',
    fields: [
      { key: 'assignee', kind: 'person', label: 'Assignee', required: true, relative: true },
      {
        key: 'title',
        kind: 'text',
        label: 'Title',
        required: true,
        maxLength: WORKFLOW_LIMITS.maxTitleLength,
      },
      {
        key: 'priority',
        kind: 'choice',
        label: 'Priority',
        required: false,
        options: opts({ low: 'Low', normal: 'Normal', high: 'High' }),
        initial: 'normal',
      },
      { key: 'dueInDays', kind: 'number', label: 'Due in days', required: false, min: 0, max: 30 },
    ],
    triggers: EVERY_TRIGGER,
  },
  {
    type: 'assign_user',
    label: 'Assign',
    fields: [
      { key: 'assignee', kind: 'person', label: 'Assignee', required: true, relative: false },
    ],
    triggers: ['ticket.escalated', 'customer.status_changed'],
  },
  {
    type: 'request_approval',
    label: 'Request an approval',
    fields: [
      {
        key: 'role',
        kind: 'choice',
        label: 'Approver',
        required: true,
        options: APPROVAL_ROLE_OPTIONS,
        initial: 'sales_manager',
      },
    ],
    triggers: ['order.confirmed', 'order.value_changed'],
  },
  {
    type: 'add_tag',
    label: 'Add a tag',
    fields: [
      { key: 'record', kind: 'record', label: 'Record', required: true },
      {
        key: 'tag',
        kind: 'text',
        label: 'Tag',
        required: true,
        maxLength: WORKFLOW_LIMITS.maxTagLength,
      },
    ],
    triggers: WITH_CUSTOMER,
  },
  {
    type: 'remove_tag',
    label: 'Remove a tag',
    fields: [
      { key: 'record', kind: 'record', label: 'Record', required: true },
      {
        key: 'tag',
        kind: 'text',
        label: 'Tag',
        required: true,
        maxLength: WORKFLOW_LIMITS.maxTagLength,
      },
    ],
    triggers: WITH_CUSTOMER,
  },
  {
    type: 'place_customer_on_hold',
    label: 'Place the customer on hold',
    fields: [
      {
        key: 'reason',
        kind: 'text',
        label: 'Reason',
        required: true,
        maxLength: WORKFLOW_LIMITS.maxBodyLength,
      },
    ],
    triggers: WITH_CUSTOMER,
  },
  {
    type: 'place_order_on_hold',
    label: 'Place the order on hold',
    fields: [
      {
        key: 'reason',
        kind: 'text',
        label: 'Reason',
        required: true,
        maxLength: WORKFLOW_LIMITS.maxBodyLength,
      },
    ],
    triggers: ['order.confirmed', 'order.value_changed'],
  },
  {
    type: 'create_purchase_order_draft',
    label: 'Draft a purchase order',
    fields: [],
    triggers: ['inventory.below_reorder_point'],
  },
];

export function actionDefinition(
  type: WorkflowActionType | string,
): WorkflowActionDefinition | undefined {
  return WORKFLOW_ACTIONS.find((action) => action.type === type);
}

/** The records a tag action can be written on for a trigger: the ticket first where there is one. */
export function taggableRecords(trigger: WorkflowTriggerDefinition): ('ticket' | 'customer')[] {
  return (['ticket', 'customer'] as const).filter((record) => trigger.records.includes(record));
}

/** The relative people a trigger's records have. */
export function relativePeopleFor(trigger: WorkflowTriggerDefinition): string[] {
  return Object.entries(WORKFLOW_RELATIVE_PEOPLE)
    .filter(([, person]) => person.record === null || trigger.records.includes(person.record))
    .map(([key]) => key);
}

// ---------------------------------------------------------------------------
// The catalog a client reads, and the validation both sides run

export interface WorkflowPerson {
  id: string;
  name: string;
  title: string;
}

export interface WorkflowCatalog {
  /** The triggers, each field's `optionsFrom` filled from the tenant. */
  triggers: WorkflowTriggerDefinition[];
  actions: readonly WorkflowActionDefinition[];
  relativePeople: typeof WORKFLOW_RELATIVE_PEOPLE;
  limits: typeof WORKFLOW_LIMITS;
  /** Active people an action can name, and owners: the active users, system actors aside. */
  people: WorkflowPerson[];
  /** The people who may own a workflow: holders of `workflows.view`. */
  owners: WorkflowPerson[];
}

export interface WorkflowDefinitionInput {
  name?: string;
  description?: string;
  trigger?: { type?: string; config?: Record<string, unknown> };
  conditions?: ConditionNode;
  actions?: WorkflowAction[];
}

export interface WorkflowIssue {
  /** The backend's field name: `name`, `trigger.config.hour`, `conditions`, `actions.1.config.title`. */
  field: string;
  code: string;
  message: string;
  /** For a condition issue: the indices from the root group to the node. */
  path?: readonly number[];
}

/**
 * - `structure`: what a saved definition must be — every create and update.
 * - `run`: what a definition must also be to run without failing for want of
 *   a value — activation, and any edit of an active workflow.
 */
export type WorkflowCheck = 'structure' | 'run';

const RUN_ONLY_CODES = new Set(['REQUIRED_TO_RUN', 'TARGET_UNAVAILABLE']);

function numeric(type: WorkflowFieldType): boolean {
  return type === 'money' || type === 'bps' || type === 'number' || type === 'quantity';
}

/** Where a node stands, said to a reader: "condition 2 of the group under the first group". */
export function conditionPlace(path: readonly number[]): string {
  if (path.length === 0) return 'the top group';
  return path.map((index) => index + 1).join('.');
}

/**
 * Section 69.2 — every issue of a condition tree against a trigger's subject,
 * each with the path of its node: an empty group, a group past the depth, the
 * conditions past the count, a condition with no field, a field the subject
 * does not have, an operator the field does not answer, a value the operator
 * cannot read.
 */
export function conditionIssues(
  root: ConditionNode | undefined,
  trigger: WorkflowTriggerDefinition | undefined,
): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  if (!root || root.type !== 'group') {
    issues.push({
      field: 'conditions',
      code: 'INVALID_CONDITIONS',
      message: 'The conditions must start with a group',
      path: [],
    });
    return issues;
  }
  let count = 0;
  const walk = (node: ConditionNode, path: number[], level: number): void => {
    if (node.type === 'group') {
      if (level > WORKFLOW_LIMITS.maxConditionDepth)
        issues.push({
          field: 'conditions',
          code: 'INVALID_CONDITIONS',
          message: `Group ${conditionPlace(path)} is nested ${level} levels deep; at most ${WORKFLOW_LIMITS.maxConditionDepth} are allowed`,
          path,
        });
      if (node.operator !== 'and' && node.operator !== 'or')
        issues.push({
          field: 'conditions',
          code: 'INVALID_CONDITIONS',
          message: `Group ${conditionPlace(path)} must join its conditions with all or any`,
          path,
        });
      if (node.children.length === 0)
        issues.push({
          field: 'conditions',
          code: 'INVALID_CONDITIONS',
          message:
            path.length === 0
              ? 'Add at least one condition'
              : `Group ${conditionPlace(path)} is empty; add a condition or remove it`,
          path,
        });
      node.children.forEach((child, index) => walk(child, [...path, index], level + 1));
      return;
    }
    count += 1;
    const place = `Condition ${conditionPlace(path)}`;
    const push = (message: string): void => {
      issues.push({ field: 'conditions', code: 'INVALID_CONDITIONS', message, path });
    };
    if (!node.field) {
      push(`${place} needs a field`);
      return;
    }
    const field = trigger?.fields.find((candidate) => candidate.path === node.field);
    if (!field) {
      push(
        `${place} reads ${node.field}, which ${trigger ? `“${trigger.label.toLowerCase()}” does not carry` : 'no trigger carries'}`,
      );
      return;
    }
    if (!operatorsFor(field).includes(node.operator)) {
      push(`${place}: ${field.label} cannot be compared with ${node.operator}`);
      return;
    }
    const value = node.value;
    if (VALUELESS_OPERATORS.includes(node.operator)) {
      if (value !== null && value !== undefined) push(`${place} takes no value`);
      return;
    }
    const known = field.options?.map((option) => option.value);
    if (LIST_OPERATORS.includes(node.operator)) {
      if (!Array.isArray(value) || value.length === 0) {
        push(`${place} needs at least one value`);
        return;
      }
      if (known && value.some((entry) => !known.includes(String(entry))))
        push(`${place} names a value ${field.label} does not have`);
      return;
    }
    if (numeric(field.type)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) push(`${place} needs a number`);
      else if ((field.type === 'money' || field.type === 'bps') && !Number.isInteger(value))
        push(
          `${place} needs a whole number of ${field.type === 'money' ? 'cents' : 'basis points'}`,
        );
      return;
    }
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') push(`${place} needs yes or no`);
      return;
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      push(`${place} needs a value`);
      return;
    }
    if (known && !known.includes(value))
      push(`${place} names a value ${field.label} does not have`);
  };
  walk(root, [], 1);
  if (count > WORKFLOW_LIMITS.maxConditions)
    issues.push({
      field: 'conditions',
      code: 'INVALID_CONDITIONS',
      message: `${count} conditions; a workflow holds at most ${WORKFLOW_LIMITS.maxConditions}`,
      path: [],
    });
  return issues;
}

/** Conditions (leaves) in a tree, and the deepest group level, for the builder's remaining count. */
export function conditionMeasure(root: ConditionNode): { conditions: number; depth: number } {
  let conditions = 0;
  let depth = 0;
  const walk = (node: ConditionNode, level: number): void => {
    if (node.type === 'group') {
      depth = Math.max(depth, level);
      for (const child of node.children) walk(child, level + 1);
    } else conditions += 1;
  };
  walk(root, 1);
  return { conditions, depth };
}

/**
 * Every issue of a definition at a level of `WorkflowCheck`. The backend runs
 * it on every write and the client before the request, from the same catalog.
 */
export function workflowIssues(
  input: WorkflowDefinitionInput,
  catalog: Pick<WorkflowCatalog, 'triggers' | 'people'>,
  check: WorkflowCheck,
): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  const name = input.name?.trim() ?? '';
  if (name.length === 0)
    issues.push({ field: 'name', code: 'REQUIRED', message: 'Name the workflow' });
  else if (name.length > WORKFLOW_LIMITS.maxNameLength)
    issues.push({
      field: 'name',
      code: 'TOO_LONG',
      message: `A name holds at most ${WORKFLOW_LIMITS.maxNameLength} characters`,
    });
  const trigger = input.trigger?.type
    ? triggerDefinition(input.trigger.type, catalog.triggers)
    : undefined;
  if (!input.trigger?.type)
    issues.push({
      field: 'trigger.type',
      code: 'REQUIRED',
      message: 'Choose the event that starts the workflow',
    });
  else if (!trigger)
    issues.push({
      field: 'trigger.type',
      code: 'INVALID_VALUE',
      message: `${input.trigger.type} is not a trigger of section 69.1`,
    });
  if (trigger?.schedule) {
    const config = input.trigger?.config ?? {};
    const hour = config['hour'];
    if (hour === undefined || hour === null)
      issues.push({
        field: 'trigger.config.hour',
        code: 'REQUIRED_TO_RUN',
        message: 'Choose the hour it runs',
      });
    else if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23)
      issues.push({
        field: 'trigger.config.hour',
        code: 'INVALID_VALUE',
        message: 'The hour is a whole number from 0 to 23',
      });
    if (trigger.schedule === 'weekly') {
      const weekday = config['weekday'];
      if (weekday === undefined || weekday === null)
        issues.push({
          field: 'trigger.config.weekday',
          code: 'REQUIRED_TO_RUN',
          message: 'Choose the day it runs',
        });
      else if (typeof weekday !== 'string' || !(weekday in WEEKDAY_NUMBER))
        issues.push({
          field: 'trigger.config.weekday',
          code: 'INVALID_VALUE',
          message: 'The day is a weekday name',
        });
    }
  }
  issues.push(...conditionIssues(input.conditions, trigger));
  const actions = input.actions ?? [];
  if (actions.length === 0)
    issues.push({ field: 'actions', code: 'REQUIRED', message: 'Add at least one action' });
  const people = new Set(catalog.people.map((person) => person.id));
  for (const [index, action] of actions.entries()) {
    const prefix = `actions.${index}`;
    const definition = actionDefinition(action.type);
    if (!definition) {
      issues.push({
        field: `${prefix}.type`,
        code: 'INVALID_VALUE',
        message: `${action.type} is not an action of section 69.3`,
      });
      continue;
    }
    if (trigger && !definition.triggers.includes(trigger.type)) {
      issues.push({
        field: `${prefix}.type`,
        code: 'NOT_AVAILABLE',
        message: `${definition.label} has no record to act on when ${trigger.label.toLowerCase()}`,
      });
      continue;
    }
    const config = action.config ?? {};
    for (const field of definition.fields) {
      const key = `${prefix}.config.${field.key}`;
      const value = config[field.key];
      const blank =
        value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
      if (blank) {
        if (field.required)
          issues.push({
            field: key,
            code: 'REQUIRED_TO_RUN',
            message: `${field.label} is needed before the workflow can run`,
          });
        continue;
      }
      switch (field.kind) {
        case 'text':
          if (typeof value !== 'string')
            issues.push({ field: key, code: 'INVALID_VALUE', message: `${field.label} is text` });
          else if (value.trim().length > field.maxLength)
            issues.push({
              field: key,
              code: 'TOO_LONG',
              message: `${field.label} holds at most ${field.maxLength} characters`,
            });
          break;
        case 'choice':
          if (!field.options.some((option) => option.value === value))
            issues.push({
              field: key,
              code: 'INVALID_VALUE',
              message: `${field.label} must be one of ${field.options.map((option) => option.label).join(', ')}`,
            });
          break;
        case 'number':
          if (
            typeof value !== 'number' ||
            !Number.isInteger(value) ||
            value < field.min ||
            value > field.max
          )
            issues.push({
              field: key,
              code: 'INVALID_VALUE',
              message: `${field.label} is a whole number from ${field.min} to ${field.max}`,
            });
          break;
        case 'record':
          if (!trigger || !taggableRecords(trigger).includes(value as 'ticket' | 'customer'))
            issues.push({
              field: key,
              code: 'TARGET_UNAVAILABLE',
              message: `${String(value)} is not a record ${trigger ? `“${trigger.label.toLowerCase()}”` : 'the trigger'} carries`,
            });
          break;
        case 'person': {
          const id = String(value);
          const relative = WORKFLOW_RELATIVE_PEOPLE[id];
          if (relative) {
            if (!field.relative)
              issues.push({
                field: key,
                code: 'INVALID_VALUE',
                message: `${field.label} names a person, not a relation`,
              });
            else if (
              trigger &&
              relative.record !== null &&
              !trigger.records.includes(relative.record)
            )
              issues.push({
                field: key,
                code: 'TARGET_UNAVAILABLE',
                message: `${relative.label} is no one when ${trigger.label.toLowerCase()}`,
              });
          } else if (id.startsWith('usr_') && people.has(id)) {
            // A named, active person.
          } else if (id.startsWith('usr_'))
            issues.push({
              field: key,
              code: 'TARGET_UNAVAILABLE',
              message: `${field.label} names someone who is not an active user`,
            });
          else
            issues.push({
              field: key,
              code: 'TARGET_UNAVAILABLE',
              message: `${field.label} “${id}” is no one ${trigger ? `when ${trigger.label.toLowerCase()}` : 'this trigger names'}`,
            });
          break;
        }
      }
    }
  }
  return check === 'run' ? issues : issues.filter((issue) => !RUN_ONLY_CODES.has(issue.code));
}

// ---------------------------------------------------------------------------
// Evaluation

function read(subject: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined,
      subject,
    );
}

const absent = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/** Section 69.2 — evaluates a condition tree against a trigger's subject (dot paths). */
export function evaluateConditions(node: ConditionNode, subject: Record<string, unknown>): boolean {
  if (node.type === 'group') {
    return node.operator === 'and'
      ? node.children.every((child) => evaluateConditions(child, subject))
      : node.children.some((child) => evaluateConditions(child, subject));
  }
  const value = read(subject, node.field);
  const expected = node.value;
  const number = (input: unknown): number =>
    typeof input === 'object' && input !== null && 'minor' in input
      ? Number((input as { minor: number }).minor)
      : Number(input);
  const same = (a: unknown, b: unknown): boolean =>
    a === b ||
    (typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase()) ||
    (typeof a !== 'string' && typeof b !== 'string' && number(a) === number(b));
  const includes = (haystack: unknown, needle: unknown): boolean =>
    Array.isArray(haystack)
      ? haystack.some((entry) => same(entry, needle))
      : String(haystack ?? '')
          .toLowerCase()
          .includes(String(needle ?? '').toLowerCase());
  switch (node.operator) {
    case 'eq':
      return !absent(value) && same(value, expected);
    case 'neq':
      return absent(value) || !same(value, expected);
    case 'gt':
      return !absent(value) && number(value) > number(expected);
    case 'gte':
      return !absent(value) && number(value) >= number(expected);
    case 'lt':
      return !absent(value) && number(value) < number(expected);
    case 'lte':
      return !absent(value) && number(value) <= number(expected);
    case 'contains':
      return includes(value, expected);
    case 'not_contains':
      return !includes(value, expected);
    case 'in':
      return Array.isArray(expected) && expected.some((entry) => same(value, entry));
    case 'not_in':
      return Array.isArray(expected) && !expected.some((entry) => same(value, entry));
    case 'is_empty':
      return absent(value);
    case 'is_not_empty':
      return !absent(value);
  }
}
