import type {
  ConditionNode,
  ConditionOperator,
  WorkflowAction,
  WorkflowCatalog,
  WorkflowDetail,
  WorkflowField,
  WorkflowListItem,
  WorkflowRunErrorCode,
  WorkflowRunListItem,
  WorkflowRunStatus,
  WorkflowStatus,
  WorkflowTriggerDefinition,
  WorkflowTriggerType,
} from '@slotted/demo-nexora-backend';

export type {
  ConditionNode,
  WorkflowAction,
  WorkflowCatalog,
  WorkflowDetail,
  WorkflowListItem,
  WorkflowRunListItem,
};

/** The module's one destination (Appendix A); a workflow is its `:id`, the history `:id/runs`. */
export const WORKFLOWS_ROUTE = '/automations/workflows';
/** The create form, on its own route under the list it returns to (FM-01). */
export const NEW_WORKFLOW_ROUTE = '/automations/workflows/new';

export const workflowRoute = (id: string): string => `${WORKFLOWS_ROUTE}/${id}`;
export const runsRoute = (id: string): string => `${WORKFLOWS_ROUTE}/${id}/runs`;

/** Who reads and who writes workflows (§55.5), named where a reader lacks one of them (PM-02). */
export const READERS =
  'administrators, executives, auditors and the sales, finance, procurement and support managers';
export const WRITERS = 'an administrator';

export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  active: 'Active',
  error: 'Error',
  draft: 'Draft',
  paused: 'Paused',
  archived: 'Archived',
};

export const STATUS_TONE: Record<WorkflowStatus, 'success' | 'danger' | 'secondary' | 'warning'> =
  {
    active: 'success',
    error: 'danger',
    draft: 'secondary',
    paused: 'warning',
    archived: 'secondary',
  };

/** What each state means for the next event, said beside the commands it allows (RP-06, RP-09). */
export const STATUS_MEANING: Record<WorkflowStatus, string> = {
  active: 'It runs on every event of its trigger, unattended.',
  error: 'A failed run stopped it until it is activated.',
  draft: 'It has never run; it runs once activated.',
  paused: 'It does not run until it is activated again.',
  archived: 'It never runs again, and cannot be restored.',
};

export const RUN_STATUS_LABEL: Record<WorkflowRunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  partially_failed: 'Partly failed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const RUN_STATUS_TONE: Record<
  WorkflowRunStatus,
  'success' | 'danger' | 'warning' | 'secondary' | 'accent'
> = {
  queued: 'secondary',
  running: 'accent',
  succeeded: 'success',
  partially_failed: 'warning',
  failed: 'danger',
  skipped: 'secondary',
};

export const ACTION_RESULT_LABEL: Record<'succeeded' | 'failed' | 'skipped', string> = {
  succeeded: 'Done',
  failed: 'Failed',
  skipped: 'Not done',
};

/** Every code a run is written with (`WORKFLOW_RUN_ERROR_CODES`), said to the reader. */
export const RUN_ERROR_WORDS: Record<WorkflowRunErrorCode, string> = {
  ACTION_TARGET_NOT_FOUND: 'The person or record the action names could not be found',
  ACTION_REFUSED: 'The record refused the change in its current state',
  ACTION_NOT_PERMITTED: 'The automation does not hold the permission the change needs',
  ACTION_INVALID: 'The action lacks part of its configuration',
  WORKFLOW_RECURSION_LIMIT:
    'Stopped: it would have been the sixth workflow set off by one chain of events',
};

export const JOIN_WORDS: Record<'and' | 'or', string> = { and: 'All of', or: 'Any of' };

/** An operator in the words a sentence reads it with, by the field it compares. */
export function operatorWords(operator: ConditionOperator, field: WorkflowField | undefined): string {
  const tags = field?.type === 'tags';
  switch (operator) {
    case 'eq':
      return 'is';
    case 'neq':
      return 'is not';
    case 'gt':
      return 'is more than';
    case 'gte':
      return 'is at least';
    case 'lt':
      return 'is less than';
    case 'lte':
      return 'is at most';
    case 'contains':
      return tags ? 'includes' : 'contains';
    case 'not_contains':
      return tags ? 'does not include' : 'does not contain';
    case 'in':
      return 'is any of';
    case 'not_in':
      return 'is none of';
    case 'is_empty':
      return tags ? 'has none' : 'is empty';
    case 'is_not_empty':
      return tags ? 'has some' : 'is not empty';
  }
}

/** The unit a field's value is entered in, said beside its control. */
export function unitWords(field: WorkflowField): string | null {
  switch (field.type) {
    case 'money':
      return 'US$';
    case 'bps':
      return '%';
    default:
      return null;
  }
}

/** A condition's value as the reader reads it: money in dollars, basis points as a percentage. */
export function valueWords(field: WorkflowField | undefined, value: unknown, locale = 'en-US'): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((entry) => valueWords(field, entry, locale)).join(', ');
  if (!field) return String(value);
  switch (field.type) {
    case 'money':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(Number(value) / 100);
    case 'bps':
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value) / 100)}%`;
    case 'number':
    case 'quantity':
      return new Intl.NumberFormat(locale).format(Number(value));
    case 'boolean':
      return value ? 'yes' : 'no';
    case 'enum':
    case 'tags':
      return field.options?.find((option) => option.value === value)?.label ?? String(value);
    case 'text':
      return `“${String(value)}”`;
  }
}

/** A field's name in a sentence: the record it belongs to, then its label. */
export function fieldWords(field: WorkflowField | undefined, path: string): string {
  return field ? `${field.group} ${field.label.charAt(0).toLowerCase()}${field.label.slice(1)}` : path;
}

export function conditionWords(
  node: Extract<ConditionNode, { type: 'condition' }>,
  trigger: WorkflowTriggerDefinition | undefined,
  locale = 'en-US',
): string {
  const field = trigger?.fields.find((candidate) => candidate.path === node.field);
  const operator = operatorWords(node.operator, field);
  const value = valueWords(field, node.value, locale);
  return [fieldWords(field, node.field || 'A field not chosen yet'), operator, value]
    .filter((part) => part.length > 0)
    .join(' ');
}

/** "When an order is confirmed", and the hour and day of a schedule. */
export function triggerWords(
  trigger: WorkflowTriggerDefinition | undefined,
  config: Record<string, unknown> | undefined,
): string {
  if (!trigger) return 'When an unknown event happens';
  if (trigger.schedule) {
    const hour = typeof config?.['hour'] === 'number' ? config['hour'] : null;
    const at = hour === null ? 'at an hour not chosen yet' : `at ${String(hour).padStart(2, '0')}:00`;
    if (trigger.schedule === 'daily') return `Every day ${at}, Central time`;
    const weekday = typeof config?.['weekday'] === 'string' ? config['weekday'] : null;
    const day = weekday ? `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}` : 'a day not chosen yet';
    return `Every ${day} ${at}, Central time`;
  }
  return `When ${trigger.label.charAt(0).toLowerCase()}${trigger.label.slice(1)}`;
}

/** A person an action names: by name, by relation, or as the stored value when it names no one. */
export function personWords(
  value: unknown,
  catalog: Pick<WorkflowCatalog, 'relativePeople' | 'people'> | null,
  people: Readonly<Record<string, string>>,
): string {
  const key = typeof value === 'string' ? value : '';
  if (!key) return 'no one yet';
  const relative = catalog?.relativePeople[key];
  if (relative) return relative.label.charAt(0).toLowerCase() + relative.label.slice(1);
  return people[key] ?? catalog?.people.find((person) => person.id === key)?.name ?? `“${key}”`;
}

/** An action as one line of the sentence: "Send a notification to Sofia Ramirez: “…”". */
export function actionWords(
  action: WorkflowAction,
  catalog: Pick<WorkflowCatalog, 'relativePeople' | 'people'> | null,
  people: Readonly<Record<string, string>>,
): string {
  const config = action.config ?? {};
  const text = (key: string): string =>
    typeof config[key] === 'string' && (config[key] as string).trim() ? `“${(config[key] as string).trim()}”` : '';
  switch (action.type) {
    case 'send_notification':
      return `Notify ${personWords(config['recipient'], catalog, people)}${text('title') ? `: ${text('title')}` : ''}`;
    case 'create_task': {
      const due = typeof config['dueInDays'] === 'number' ? `, due in ${config['dueInDays']} days` : '';
      const priority = typeof config['priority'] === 'string' && config['priority'] !== 'normal' ? `, ${config['priority']} priority` : '';
      return `Create a task for ${personWords(config['assignee'], catalog, people)}${text('title') ? `: ${text('title')}` : ''}${priority}${due}`;
    }
    case 'assign_user':
      return `Assign it to ${personWords(config['assignee'], catalog, people)}`;
    case 'request_approval':
      return `Send the order back for a ${String(config['role'] ?? 'manager').replace(/_/g, ' ')}'s approval`;
    case 'add_tag':
      return `Tag the ${String(config['record'] ?? 'record')} ${text('tag')}`.trim();
    case 'remove_tag':
      return `Remove the tag ${text('tag')} from the ${String(config['record'] ?? 'record')}`.trim();
    case 'place_customer_on_hold':
      return `Place the customer on hold${text('reason') ? `: ${text('reason')}` : ''}`;
    case 'place_order_on_hold':
      return `Place the order on hold${text('reason') ? `: ${text('reason')}` : ''}`;
    case 'create_purchase_order_draft':
      return 'Draft a purchase order from the preferred supplier for the quantity that tops the stock up';
  }
}

/** A duration read as a person reads it: "180 ms", "1.2 s", "2 min". */
export function durationWords(ms: number | undefined, locale = 'en-US'): string {
  if (ms === undefined) return 'Not completed';
  if (ms < 1_000) return `${new Intl.NumberFormat(locale).format(ms)} ms`;
  if (ms < 60_000)
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(ms / 1_000)} s`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(ms / 60_000)} min`;
}

export const TRIGGER_TYPES: readonly WorkflowTriggerType[] = [
  'order.created',
  'order.confirmed',
  'order.value_changed',
  'invoice.overdue',
  'inventory.below_reorder_point',
  'ticket.escalated',
  'customer.status_changed',
  'schedule.daily',
  'schedule.weekly',
];

/** The trigger names a list column and a pill read, without the catalog. */
export const TRIGGER_LABEL: Record<WorkflowTriggerType, string> = {
  'order.created': 'Order created',
  'order.confirmed': 'Order confirmed',
  'order.value_changed': 'Order value changed',
  'invoice.overdue': 'Invoice overdue',
  'inventory.below_reorder_point': 'Stock below reorder point',
  'ticket.escalated': 'Ticket escalated',
  'customer.status_changed': 'Customer status changed',
  'schedule.daily': 'Daily',
  'schedule.weekly': 'Weekly',
};

/** The records a run affects, named in the history; a type with no screen is said, not linked. */
export const AFFECTED_LABEL: Record<string, string> = {
  sales_order: 'Order',
  customer: 'Customer',
  invoice: 'Invoice',
  support_ticket: 'Ticket',
  sku: 'SKU',
};

/** What a run did, or why it did not: the line its row and its record read. */
export function runReason(run: WorkflowRunListItem): string {
  const failed = run.actionResults.find((result) => result.status === 'failed');
  if (run.status === 'failed' || run.status === 'partially_failed') {
    const code = run.errorCode ?? failed?.errorCode;
    return code ? RUN_ERROR_WORDS[code] : (failed?.message ?? 'An action failed');
  }
  if (run.status === 'skipped')
    return run.conditionsMet
      ? `Nothing to do: ${run.actionResults[0]?.message ?? 'every action was already in place'}`
      : 'The conditions did not match';
  const done = run.actionResults.filter((result) => result.status === 'succeeded');
  const first = done[0]?.message ?? 'Every action ran';
  return done.length > 1 ? `${first}, and ${done.length - 1} more` : first;
}

/** How the run was set off: a person's command, the clock, or another workflow's action. */
export function runCause(run: WorkflowRunListItem): string {
  const occurrences =
    run.occurrences !== undefined && run.occurrences > 1 ? `, standing for ${run.occurrences} occurrences the clock passed` : '';
  if (run.triggerType.startsWith('schedule.')) return `On its schedule${occurrences}`;
  if (run.parentRunId) return `Set off by another workflow's action, link ${run.chainDepth} of its chain`;
  if (run.causedBy === 'usr_system') return 'Set off by the clock';
  return `Set off by ${run.causedByName}`;
}
