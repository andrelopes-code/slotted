import {
  PERSONAS,
  STAND_IN_PERSONAS,
  notFound,
  type ActivityEvent,
  type ApprovalRequest,
  type AuditEvent,
  type CurrencyCode,
  type ImportJob,
  type Notification,
  type Region,
  type Role,
  type SavedView,
  type Task,
  type Team,
  type User,
  type Workflow,
  type WorkflowCatalog,
  type WorkflowField,
  type WorkflowPerson,
  type WorkflowRun,
  type WorkflowRunErrorCode,
  type WorkflowRunStatus,
  addDays,
  businessDateOf,
  WORKFLOW_ACTIONS,
  WORKFLOW_LIMITS,
  WORKFLOW_RELATIVE_PEOPLE,
  WORKFLOW_TRIGGERS,
} from '../../domain';
import { TICKET_CATEGORIES } from '../../data/vocabulary';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

// ---------------------------------------------------------------------------
// Session and identity

export interface SessionInfo {
  user: User;
  roles: Pick<Role, 'id' | 'name'>[];
  permissions: string[];
  warehouseIds: string[] | 'all';
  teams: Pick<Team, 'id' | 'code' | 'name' | 'type'>[];
  organization: {
    id: string;
    displayName: string;
    legalName: string;
    timezone: string;
    primaryCurrency: CurrencyCode;
    supportedCurrencies: CurrencyCode[];
    /** Operating regions with currency, locale and timezone; formatting is the client's concern. */
    regions: Region[];
  };
  demo: {
    seedVersion: string;
    scenarioId: string;
    demoClock: string;
    today: string;
    schemaVersion: number;
  };
  personas: {
    key: string;
    userId: string;
    name: string;
    role: string;
    context: string;
    active: boolean;
  }[];
  unreadNotifications: number;
  pendingApprovals: number;
}

export function sessionInfo(runtime: ApiRuntime): SessionInfo {
  const { store, indexes } = runtime;
  const user = runtime.actor;
  const roles = indexes.roleAssignmentsByUser
    .get(user.id)
    .map((assignment) => store.dataset.roles.get(assignment.roleId))
    .filter((role) => role !== undefined)
    .map((role) => ({ id: role.id, name: role.name }));
  const teams = store.dataset.teamMemberships
    .filter((membership) => membership.userId === user.id)
    .map((membership) => store.dataset.teams.get(membership.teamId))
    .filter((team) => team !== undefined)
    .map((team) => ({ id: team.id, code: team.code, name: team.name, type: team.type }));
  let pendingApprovals = 0;
  for (const request of store.dataset.approvalRequests.values()) {
    if (request.status !== 'pending') continue;
    if (
      request.steps.some(
        (step) =>
          step.status === 'pending' &&
          (step.assignedUserId === user.id ||
            runtime.authorization.hasRole(user.id, step.requiredRole)),
      )
    )
      pendingApprovals += 1;
  }
  return {
    user,
    roles,
    permissions: [...runtime.authorization.effectivePermissions(user.id).keys()].sort(),
    warehouseIds: runtime.authorization.warehouseIdsFor(user.id),
    teams,
    organization: {
      id: store.dataset.organization.id,
      displayName: store.dataset.organization.displayName,
      legalName: store.dataset.organization.legalName,
      timezone: store.dataset.organization.timezone,
      primaryCurrency: store.dataset.organization.primaryCurrency,
      supportedCurrencies: store.dataset.organization.supportedCurrencies,
      regions: store.dataset.organization.regions,
    },
    demo: {
      seedVersion: store.metadata.seedVersion,
      scenarioId: store.metadata.scenarioId,
      demoClock: store.metadata.demoClock,
      today: store.today,
      schemaVersion: store.metadata.schemaVersion,
    },
    personas: PERSONAS.map((persona) => {
      const userId = store.seed.personaUserIds.get(persona.key) as string;
      return {
        key: persona.key,
        userId,
        name: `${persona.firstName} ${persona.lastName}`,
        role: persona.role,
        context: persona.context,
        active: userId === user.id,
      };
    }).concat(
      STAND_IN_PERSONAS.flatMap((standIn) => {
        const userId = store.seed.personaUserIds.get(standIn.key);
        const standInUser = userId ? store.dataset.users.get(userId) : undefined;
        return standInUser
          ? [
              {
                key: standIn.key,
                userId: standInUser.id,
                name: standInUser.displayName,
                role: standIn.role,
                context: standIn.context,
                active: standInUser.id === user.id,
              },
            ]
          : [];
      }),
    ),
    unreadNotifications: indexes.notificationsByUser
      .get(user.id)
      .filter((notification) => !notification.readAt && !notification.archivedAt).length,
    pendingApprovals,
  };
}

export interface UserListItem extends User {
  roleNames: string[];
  teamNames: string[];
  managerName?: string;
}

export const userResource: ResourceDefinition<UserListItem> = {
  fields: fields<UserListItem>({
    id: ['string', (item) => item.id],
    displayName: ['string', (item) => item.displayName],
    email: ['string', (item) => item.email],
    status: ['enum', (item) => item.status],
    department: ['string', (item) => item.department],
    title: ['string', (item) => item.title],
    roleNames: ['array', (item) => item.roleNames],
    teamNames: ['array', (item) => item.teamNames],
    lastActiveAt: ['datetime', (item) => item.lastActiveAt],
    createdAt: ['datetime', (item) => item.metadata.createdAt],
  }),
  search: (item) => [item.displayName, item.email, item.title, item.department],
  defaultSort: 'displayName',
};

export function listUsers(runtime: ApiRuntime, query: ListQuery): ListResponse<UserListItem> {
  runtime.require('users.view');
  const { store, indexes } = runtime;
  const teamsByUser = new Map<string, string[]>();
  for (const membership of store.dataset.teamMemberships) {
    const bucket = teamsByUser.get(membership.userId) ?? [];
    bucket.push(store.dataset.teams.get(membership.teamId)?.name ?? membership.teamId);
    teamsByUser.set(membership.userId, bucket);
  }
  const items: UserListItem[] = [];
  for (const user of store.dataset.users.values()) {
    if (user.id.startsWith('usr_system')) continue;
    const manager = user.managerId ? store.dataset.users.get(user.managerId) : undefined;
    items.push({
      ...user,
      roleNames: indexes.roleAssignmentsByUser
        .get(user.id)
        .map((assignment) => store.dataset.roles.get(assignment.roleId)?.name ?? assignment.roleId),
      teamNames: teamsByUser.get(user.id) ?? [],
      ...(manager ? { managerName: manager.displayName } : {}),
    });
  }
  return runListQuery(items, userResource, query);
}

export function listTeams(
  runtime: ApiRuntime,
): (Team & { memberCount: number; leadName?: string })[] {
  runtime.require('teams.view');
  const { store } = runtime;
  return [...store.dataset.teams.values()].map((team) => {
    const members = store.dataset.teamMemberships.filter(
      (membership) => membership.teamId === team.id,
    );
    const lead = members.find((membership) => membership.isLead);
    const leadName = lead ? store.dataset.users.get(lead.userId)?.displayName : undefined;
    return { ...team, memberCount: members.length, ...(leadName ? { leadName } : {}) };
  });
}

export function listRoles(runtime: ApiRuntime): (Role & { userCount: number })[] {
  runtime.require('roles.view');
  const counts = new Map<string, number>();
  for (const assignment of runtime.store.dataset.roleAssignments.values())
    counts.set(assignment.roleId, (counts.get(assignment.roleId) ?? 0) + 1);
  return [...runtime.store.dataset.roles.values()].map((role) => ({
    ...role,
    userCount: counts.get(role.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Approvals

export interface ApprovalListItem extends ApprovalRequest {
  requestedByName: string;
  targetLabel: string;
  customerName?: string;
  /** True when the signed-in user can decide the current step. */
  actionable: boolean;
  currentStep?: ApprovalRequest['steps'][number];
}

export function approvalListItem(runtime: ApiRuntime, request: ApprovalRequest): ApprovalListItem {
  const { store } = runtime;
  const user = runtime.actor;
  const lowestPending = request.steps
    .filter((step) => step.status === 'pending')
    .sort((a, b) => a.sequence - b.sequence)[0];
  let customerName: string | undefined;
  let targetLabel: string;
  if (request.targetType === 'sales_order') {
    const order = store.dataset.salesOrders.get(request.targetId);
    customerName = order ? store.dataset.customers.get(order.customerId)?.displayName : undefined;
    targetLabel = `Sales order ${request.targetNumber}`;
  } else if (request.targetType === 'quote') {
    const quote = store.dataset.quotes.get(request.targetId);
    customerName = quote ? store.dataset.customers.get(quote.customerId)?.displayName : undefined;
    targetLabel = `Quote ${request.targetNumber}`;
  } else if (request.targetType === 'purchase_order') {
    const po = store.dataset.purchaseOrders.get(request.targetId);
    customerName = po ? store.dataset.suppliers.get(po.supplierId)?.displayName : undefined;
    targetLabel = `Purchase order ${request.targetNumber}`;
  } else if (request.targetType === 'invoice_write_off') {
    targetLabel = `Write-off ${request.targetNumber}`;
  } else {
    targetLabel = `Cycle count ${request.targetNumber}`;
  }
  const actionable =
    request.status === 'pending' &&
    lowestPending !== undefined &&
    request.requestedBy !== user.id &&
    (lowestPending.assignedUserId === user.id ||
      runtime.authorization.hasRole(user.id, lowestPending.requiredRole));
  return {
    ...request,
    requestedByName:
      store.dataset.users.get(request.requestedBy)?.displayName ?? request.requestedBy,
    targetLabel,
    actionable,
    ...(customerName ? { customerName } : {}),
    ...(lowestPending ? { currentStep: lowestPending } : {}),
  };
}

export const approvalResource: ResourceDefinition<ApprovalListItem> = {
  fields: fields<ApprovalListItem>({
    id: ['string', (item) => item.id],
    targetType: ['enum', (item) => item.targetType],
    targetId: ['string', (item) => item.targetId],
    targetNumber: ['string', (item) => item.targetNumber],
    status: ['enum', (item) => item.status],
    requestedBy: ['string', (item) => item.requestedBy],
    requestedByName: ['string', (item) => item.requestedByName],
    requestedAt: ['datetime', (item) => item.requestedAt],
    amount: ['money', (item) => item.amount],
    actionable: ['boolean', (item) => item.actionable],
    customerName: ['string', (item) => item.customerName],
    requiredRole: ['string', (item) => item.currentStep?.requiredRole],
  }),
  search: (item) => [item.targetNumber, item.requestedByName, item.customerName, ...item.reasons],
  defaultSort: '-requestedAt',
};

export function listApprovals(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<ApprovalListItem> {
  const items: ApprovalListItem[] = [];
  const canSeeSales = runtime.can('orders.view');
  const canSeePurchasing = runtime.can('purchase_orders.view');
  const canSeeFinance = runtime.can('invoices.view');
  for (const request of runtime.store.dataset.approvalRequests.values()) {
    if ((request.targetType === 'sales_order' || request.targetType === 'quote') && !canSeeSales)
      continue;
    if (request.targetType === 'purchase_order' && !canSeePurchasing) continue;
    if (request.targetType === 'invoice_write_off' && !canSeeFinance) continue;
    items.push(approvalListItem(runtime, request));
  }
  return runListQuery(items, approvalResource, query);
}

export function getApproval(runtime: ApiRuntime, id: string): ApprovalListItem {
  const request = runtime.store.dataset.approvalRequests.get(id);
  if (!request) throw notFound('Approval request', id);
  return approvalListItem(runtime, request);
}

// ---------------------------------------------------------------------------
// Workflows

/** Runs a workflow's row draws as marks, newest last. */
export const WORKFLOW_RECENT_OUTCOMES = 12;

/** Failures counted on a workflow's row: the runs of the last seven days of the demo clock. */
export const WORKFLOW_RECENT_DAYS = 7;

export interface WorkflowListItem extends Workflow {
  ownerName: string;
  /** The outcomes of the newest runs, oldest first: at most `WORKFLOW_RECENT_OUTCOMES`. */
  recentOutcomes: WorkflowRunStatus[];
  /** Failed and partially failed runs of the last `WORKFLOW_RECENT_DAYS` days. */
  recentFailures: number;
  /** The latest failed or partially failed run: what put a workflow in error, said once. */
  lastFailure?: {
    runId: string;
    startedAt: string;
    status: 'failed' | 'partially_failed';
    errorCode?: WorkflowRunErrorCode;
    actionIndex?: number;
    message?: string;
  };
}

export const workflowResource: ResourceDefinition<WorkflowListItem> = {
  fields: fields<WorkflowListItem>({
    id: ['string', (item) => item.id],
    name: ['string', (item) => item.name],
    status: ['enum', (item) => item.status],
    triggerType: ['enum', (item) => item.trigger.type],
    ownerId: ['string', (item) => item.ownerId],
    ownerName: ['string', (item) => item.ownerName],
    runCount: ['number', (item) => item.runCount],
    lastRunAt: ['datetime', (item) => item.lastRunAt],
    recentFailures: ['number', (item) => item.recentFailures],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.name, item.description, item.ownerName],
  defaultSort: 'name',
};

export function workflowListItem(runtime: ApiRuntime, workflow: Workflow): WorkflowListItem {
  const since = Date.parse(runtime.store.now) - WORKFLOW_RECENT_DAYS * 86_400_000;
  let recentFailures = 0;
  let latest: WorkflowRun | undefined;
  for (const run of runtime.indexes.runsByWorkflow.get(workflow.id)) {
    if (run.status !== 'failed' && run.status !== 'partially_failed') continue;
    if (Date.parse(run.startedAt) >= since) recentFailures += 1;
    if (!latest || compareRuns(run, latest) < 0) latest = run;
  }
  const failed = latest?.actionResults.find((result) => result.status === 'failed');
  const message = failed?.message ?? latest?.actionResults[0]?.message;
  const recentOutcomes = runtime.indexes.runsByWorkflow
    .get(workflow.id)
    .slice()
    .sort(compareRuns)
    .slice(0, WORKFLOW_RECENT_OUTCOMES)
    .reverse()
    .map((run) => run.status);
  return {
    ...workflow,
    recentOutcomes,
    ownerName: runtime.store.dataset.users.get(workflow.ownerId)?.displayName ?? workflow.ownerId,
    recentFailures,
    ...(latest
      ? {
          lastFailure: {
            runId: latest.id,
            startedAt: latest.startedAt,
            status: latest.status as 'failed' | 'partially_failed',
            ...(latest.errorCode ? { errorCode: latest.errorCode } : {}),
            ...(failed ? { actionIndex: failed.actionIndex } : {}),
            ...(message ? { message } : {}),
          },
        }
      : {}),
  };
}

/** Newest first; runs of one instant by their id, the later written first. */
function compareRuns(a: WorkflowRun, b: WorkflowRun): number {
  return b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id);
}

export function listWorkflows(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<WorkflowListItem> {
  runtime.require('workflows.view');
  const items: WorkflowListItem[] = [];
  for (const workflow of runtime.store.dataset.workflows.values())
    items.push(workflowListItem(runtime, workflow));
  return runListQuery(items, workflowResource, query);
}

/** The runs a workflow's page lists before the history: the newest. */
export const WORKFLOW_RECENT_RUNS = 5;

export interface WorkflowDetail {
  workflow: WorkflowListItem;
  /** The newest `WORKFLOW_RECENT_RUNS` runs; the history pages through the rest. */
  runs: WorkflowRunListItem[];
  runTotal: number;
  /** The display name of every person the definition names, the owner included. */
  people: Record<string, string>;
  insight: WorkflowInsight;
}

/** Days the insight of a workflow reads back from the demo clock's today. */
export const WORKFLOW_INSIGHT_DAYS = 14;

/**
 * What a workflow did over the last `WORKFLOW_INSIGHT_DAYS` business days:
 * its runs per day by outcome, how many of the events its conditions
 * matched, and each action's outcomes — the numbers its map draws.
 */
export interface WorkflowInsight {
  days: {
    date: string;
    succeeded: number;
    partially_failed: number;
    failed: number;
    skipped: number;
  }[];
  events: number;
  matched: number;
  actions: { actionIndex: number; succeeded: number; failed: number; skipped: number }[];
}

export function workflowInsight(runtime: ApiRuntime, workflow: Workflow): WorkflowInsight {
  const today = runtime.store.today;
  const days = Array.from({ length: WORKFLOW_INSIGHT_DAYS }, (_, index) => ({
    date: addDays(today, index - WORKFLOW_INSIGHT_DAYS + 1),
    succeeded: 0,
    partially_failed: 0,
    failed: 0,
    skipped: 0,
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  const actions = workflow.actions.map((_, actionIndex) => ({
    actionIndex,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  }));
  let events = 0;
  let matched = 0;
  for (const run of runtime.indexes.runsByWorkflow.get(workflow.id)) {
    const day = byDate.get(businessDateOf(run.startedAt));
    if (!day) continue;
    events += 1;
    if (run.conditionsMet) matched += 1;
    if (
      run.status === 'succeeded' ||
      run.status === 'partially_failed' ||
      run.status === 'failed' ||
      run.status === 'skipped'
    )
      day[run.status] += 1;
    if (!run.conditionsMet) continue;
    for (const result of run.actionResults) {
      const entry = actions[result.actionIndex];
      if (entry) entry[result.status] += 1;
    }
  }
  return { days, events, matched, actions };
}

export function getWorkflow(runtime: ApiRuntime, id: string): WorkflowDetail {
  runtime.require('workflows.view');
  const workflow = runtime.store.dataset.workflows.get(id);
  if (!workflow) throw notFound('Workflow', id);
  const runs = runtime.indexes.runsByWorkflow.get(id).slice().sort(compareRuns);
  const people: Record<string, string> = {};
  const name = (userId: string): void => {
    const user = runtime.store.dataset.users.get(userId);
    if (user) people[userId] = user.displayName;
  };
  name(workflow.ownerId);
  for (const action of workflow.actions)
    for (const value of Object.values(action.config ?? {}))
      if (typeof value === 'string' && value.startsWith('usr_')) name(value);
  return {
    workflow: workflowListItem(runtime, workflow),
    runs: runs.slice(0, WORKFLOW_RECENT_RUNS).map((run) => workflowRunListItem(runtime, run)),
    runTotal: runs.length,
    people,
    insight: workflowInsight(runtime, workflow),
  };
}

export interface WorkflowRunListItem extends WorkflowRun {
  causedByName: string;
  /** `completedAt − startedAt` in milliseconds; absent while a run has not completed. */
  durationMs?: number;
}

export function workflowRunListItem(runtime: ApiRuntime, run: WorkflowRun): WorkflowRunListItem {
  return {
    ...run,
    causedByName: runtime.store.dataset.users.get(run.causedBy)?.displayName ?? run.causedBy,
    ...(run.completedAt
      ? { durationMs: Date.parse(run.completedAt) - Date.parse(run.startedAt) }
      : {}),
  };
}

export const workflowRunResource: ResourceDefinition<WorkflowRunListItem> = {
  fields: fields<WorkflowRunListItem>({
    id: ['string', (run) => run.id],
    status: ['enum', (run) => run.status],
    startedAt: ['datetime', (run) => run.startedAt],
    // The business day a run started on, as the insight's days count it.
    startedOn: ['date', (run) => businessDateOf(run.startedAt)],
    affectedEntityType: ['enum', (run) => run.affectedEntityType],
    durationMs: ['number', (run) => run.durationMs],
    conditionsMet: ['boolean', (run) => run.conditionsMet],
  }),
  search: (run) => [run.affectedLabel, run.causedByName],
  defaultSort: '-startedAt,-id',
};

export function listWorkflowRuns(
  runtime: ApiRuntime,
  workflowId: string,
  query: ListQuery,
): ListResponse<WorkflowRunListItem> {
  runtime.require('workflows.view');
  if (!runtime.store.dataset.workflows.has(workflowId)) throw notFound('Workflow', workflowId);
  return runListQuery(
    runtime.indexes.runsByWorkflow.get(workflowId).map((run) => workflowRunListItem(runtime, run)),
    workflowRunResource,
    query,
  );
}

const capitalized = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');

/**
 * Sections 69.1–69.3 — what an editor offers and the validation reads: every
 * trigger with its subject's fields (the tenant's warehouses, categories and
 * ticket categories filled in), every action, the limits, the active people an
 * action can name, and the people who may own a workflow.
 */
export function buildWorkflowCatalog(runtime: ApiRuntime): WorkflowCatalog {
  const { dataset } = runtime.store;
  const fill = (field: WorkflowField): WorkflowField => {
    switch (field.optionsFrom) {
      case 'warehouses':
        return {
          ...field,
          options: [...dataset.warehouses.values()]
            .filter((warehouse) => warehouse.status !== 'closed')
            .map((warehouse) => ({
              value: warehouse.code,
              label: `${warehouse.code} · ${warehouse.name}`,
            })),
        };
      case 'categories':
        return {
          ...field,
          options: [...dataset.categories.values()]
            .filter((category) => category.status === 'active')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => ({ value: category.id, label: category.name })),
        };
      case 'ticketCategories':
        return {
          ...field,
          options: TICKET_CATEGORIES.map((category) => ({
            value: category,
            label: capitalized(category),
          })),
        };
      default:
        return field;
    }
  };
  const people: WorkflowPerson[] = [...dataset.users.values()]
    .filter((user) => user.status === 'active' && !user.id.startsWith('usr_system'))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((user) => ({ id: user.id, name: user.displayName, title: user.title ?? '' }));
  return {
    triggers: WORKFLOW_TRIGGERS.map((trigger) => ({
      ...trigger,
      fields: trigger.fields.map(fill),
    })),
    actions: WORKFLOW_ACTIONS,
    relativePeople: WORKFLOW_RELATIVE_PEOPLE,
    limits: WORKFLOW_LIMITS,
    people,
    owners: people.filter((person) => {
      const user = dataset.users.get(person.id);
      return user !== undefined && runtime.authorization.can(user, 'workflows.view');
    }),
  };
}

export function workflowCatalog(runtime: ApiRuntime): WorkflowCatalog {
  runtime.require('workflows.view');
  return buildWorkflowCatalog(runtime);
}

// ---------------------------------------------------------------------------
// Notifications, tasks, saved views, imports

export function listNotifications(
  runtime: ApiRuntime,
  query: ListQuery & { includeArchived?: boolean } = {},
): ListResponse<Notification> {
  const user = runtime.actor;
  const definition: ResourceDefinition<Notification> = {
    fields: fields<Notification>({
      id: ['string', (item) => item.id],
      type: ['enum', (item) => item.type],
      read: ['boolean', (item) => item.readAt !== undefined],
      entityType: ['string', (item) => item.entityType],
      createdAt: ['datetime', (item) => item.createdAt],
    }),
    search: (item) => [item.title, item.body],
    defaultSort: '-createdAt',
  };
  const items = runtime.indexes.notificationsByUser
    .get(user.id)
    .filter((notification) => query.includeArchived || !notification.archivedAt);
  return runListQuery(items, definition, query);
}

export interface TaskListItem extends Task {
  assigneeName: string;
  createdByName: string;
  overdue: boolean;
}

export function listTasks(
  runtime: ApiRuntime,
  query: ListQuery & { mine?: boolean } = {},
): ListResponse<TaskListItem> {
  const user = runtime.actor;
  const today = runtime.store.today;
  const definition: ResourceDefinition<TaskListItem> = {
    fields: fields<TaskListItem>({
      id: ['string', (item) => item.id],
      title: ['string', (item) => item.title],
      status: ['enum', (item) => item.status],
      priority: ['enum', (item) => item.priority],
      assigneeId: ['string', (item) => item.assigneeId],
      dueDate: ['date', (item) => item.dueDate],
      overdue: ['boolean', (item) => item.overdue],
      relatedEntityType: ['string', (item) => item.relatedEntityType],
      createdAt: ['datetime', (item) => item.createdAt],
    }),
    search: (item) => [item.title, item.description, item.assigneeName],
    defaultSort: 'dueDate,-priority',
  };
  const source =
    query.mine === false
      ? [...runtime.store.dataset.tasks.values()]
      : runtime.indexes.tasksByAssignee.get(user.id);
  const items = source.map((task) => ({
    ...task,
    assigneeName: runtime.store.dataset.users.get(task.assigneeId)?.displayName ?? task.assigneeId,
    createdByName: runtime.store.dataset.users.get(task.createdBy)?.displayName ?? task.createdBy,
    overdue: task.status === 'open' && task.dueDate !== undefined && task.dueDate < today,
  }));
  return runListQuery(items, definition, query);
}

export function listSavedViews(runtime: ApiRuntime, resource?: SavedView['resource']): SavedView[] {
  const user = runtime.actor;
  return runtime.indexes.savedViewsByUser
    .get(user.id)
    .filter((view) => !resource || view.resource === resource);
}

export function getImportJob(runtime: ApiRuntime, id: string): ImportJob {
  runtime.require('imports.run');
  const job = runtime.store.dataset.importJobs.get(id);
  if (!job) throw notFound('Import job', id);
  return job;
}

// ---------------------------------------------------------------------------
// Activity and audit

export interface ActivityFeedQuery {
  customerId?: string;
  orderId?: string;
  subjectType?: string;
  subjectId?: string;
  limit?: number;
  before?: string;
}

/**
 * Activity feed (section 70.1): stored events from runtime mutations plus
 * events derived from seeded record timestamps, merged newest first.
 */
export function listActivity(
  runtime: ApiRuntime,
  query: ActivityFeedQuery = {},
): { data: (ActivityEvent & { actorName: string })[]; hasMore: boolean } {
  const { store, indexes } = runtime;
  const limit = Math.min(200, query.limit ?? 50);
  const events: ActivityEvent[] = [];
  const push = (event: ActivityEvent): void => {
    if (query.customerId && event.customerId !== query.customerId) return;
    if (query.orderId && event.orderId !== query.orderId) return;
    if (query.subjectType && event.subjectType !== query.subjectType) return;
    if (query.subjectId && event.subjectId !== query.subjectId) return;
    if (query.before && event.occurredAt >= query.before) return;
    events.push(event);
  };
  for (const event of store.dataset.activityEvents.values()) push(event);

  const derive = (
    id: string,
    type: string,
    actorId: string,
    occurredAt: string,
    subjectType: string,
    subjectId: string,
    subjectLabel: string,
    summary: string,
    customerId?: string,
    orderId?: string,
  ): void => {
    push({
      id,
      organizationId: store.dataset.organization.id,
      type,
      actorId,
      occurredAt,
      subjectType,
      subjectId,
      subjectLabel,
      summary,
      ...(customerId ? { customerId } : {}),
      ...(orderId ? { orderId } : {}),
    });
  };
  const orders = query.orderId
    ? [store.dataset.salesOrders.get(query.orderId)].filter((order) => order !== undefined)
    : query.customerId
      ? indexes.ordersByCustomer.get(query.customerId)
      : [...store.dataset.salesOrders.values()];
  const scoped =
    query.customerId !== undefined || query.orderId !== undefined || query.subjectId !== undefined;
  const orderSource = scoped ? orders : orders.slice(-3_000);
  for (const order of orderSource) {
    const customer = store.dataset.customers.get(order.customerId)?.displayName ?? order.customerId;
    derive(
      `${order.id}:created`,
      'order.created',
      order.metadata.createdBy,
      order.metadata.createdAt,
      'sales_order',
      order.id,
      order.orderNumber,
      `Order ${order.orderNumber} created for ${customer}`,
      order.customerId,
      order.id,
    );
    if (order.confirmedAt)
      derive(
        `${order.id}:confirmed`,
        'order.confirmed',
        order.ownerId,
        order.confirmedAt,
        'sales_order',
        order.id,
        order.orderNumber,
        `Order ${order.orderNumber} confirmed (${(order.total.minor / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`,
        order.customerId,
        order.id,
      );
    if (order.cancelledAt)
      derive(
        `${order.id}:cancelled`,
        'order.cancelled',
        order.metadata.updatedBy,
        order.cancelledAt,
        'sales_order',
        order.id,
        order.orderNumber,
        `Order ${order.orderNumber} cancelled — ${order.cancellationReason ?? 'no reason recorded'}`,
        order.customerId,
        order.id,
      );
    if (order.closedAt)
      derive(
        `${order.id}:closed`,
        'order.closed',
        'usr_system',
        order.closedAt,
        'sales_order',
        order.id,
        order.orderNumber,
        `Order ${order.orderNumber} closed`,
        order.customerId,
        order.id,
      );
    for (const shipment of indexes.shipmentsByOrder.get(order.id)) {
      if (shipment.shippedAt)
        derive(
          `${shipment.id}:shipped`,
          'shipment.shipped',
          shipment.metadata.updatedBy,
          shipment.shippedAt,
          'shipment',
          shipment.id,
          shipment.shipmentNumber,
          `Shipment ${shipment.shipmentNumber} shipped via ${shipment.carrier}`,
          order.customerId,
          order.id,
        );
      if (shipment.deliveredAt)
        derive(
          `${shipment.id}:delivered`,
          'shipment.delivered',
          'usr_system',
          shipment.deliveredAt,
          'shipment',
          shipment.id,
          shipment.shipmentNumber,
          `Shipment ${shipment.shipmentNumber} delivered`,
          order.customerId,
          order.id,
        );
      if (shipment.status === 'exception')
        derive(
          `${shipment.id}:exception`,
          'shipment.exception',
          'usr_system',
          shipment.metadata.updatedAt,
          'shipment',
          shipment.id,
          shipment.shipmentNumber,
          `Shipment ${shipment.shipmentNumber}: ${shipment.exceptionMessage ?? 'carrier exception'}`,
          order.customerId,
          order.id,
        );
    }
    for (const invoice of indexes.invoicesByOrder.get(order.id)) {
      if (invoice.openedAt)
        derive(
          `${invoice.id}:opened`,
          'invoice.opened',
          invoice.metadata.createdBy,
          invoice.openedAt,
          'invoice',
          invoice.id,
          invoice.invoiceNumber ?? invoice.id,
          `Invoice ${invoice.invoiceNumber ?? ''} opened for ${(invoice.total.minor / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
          order.customerId,
          order.id,
        );
      for (const allocation of indexes.allocationsByInvoice.get(invoice.id)) {
        const payment = store.dataset.payments.get(allocation.paymentId);
        if (payment && allocation.status === 'active')
          derive(
            `${allocation.id}:paid`,
            'payment.recorded',
            payment.recordedBy,
            allocation.createdAt,
            'payment',
            payment.id,
            payment.paymentNumber,
            `Payment ${payment.paymentNumber} of ${(allocation.amount.minor / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} applied to ${invoice.invoiceNumber ?? 'invoice'}`,
            order.customerId,
            order.id,
          );
      }
    }
    for (const ret of indexes.returnsByOrder.get(order.id))
      derive(
        `${ret.id}:requested`,
        'return.requested',
        ret.metadata.createdBy,
        ret.requestedAt,
        'return',
        ret.id,
        ret.returnNumber,
        `Return ${ret.returnNumber} requested`,
        order.customerId,
        order.id,
      );
  }
  const tickets = query.customerId
    ? indexes.ticketsByCustomer.get(query.customerId)
    : query.orderId
      ? indexes.ticketsByOrder.get(query.orderId)
      : [...store.dataset.tickets.values()].slice(-1_000);
  for (const ticket of tickets) {
    derive(
      `${ticket.id}:created`,
      'ticket.created',
      ticket.metadata.createdBy,
      ticket.metadata.createdAt,
      'support_ticket',
      ticket.id,
      ticket.ticketNumber,
      `Ticket ${ticket.ticketNumber} opened: ${ticket.subject}`,
      ticket.customerId,
      ticket.relatedOrderId,
    );
    if (ticket.status === 'escalated')
      derive(
        `${ticket.id}:escalated`,
        'ticket.escalated',
        ticket.assigneeId ?? 'usr_system',
        ticket.metadata.updatedAt,
        'support_ticket',
        ticket.id,
        ticket.ticketNumber,
        `Ticket ${ticket.ticketNumber} escalated — ${ticket.escalationReason ?? ''}`,
        ticket.customerId,
        ticket.relatedOrderId,
      );
    if (ticket.resolvedAt)
      derive(
        `${ticket.id}:resolved`,
        'ticket.resolved',
        ticket.assigneeId ?? 'usr_system',
        ticket.resolvedAt,
        'support_ticket',
        ticket.id,
        ticket.ticketNumber,
        `Ticket ${ticket.ticketNumber} resolved`,
        ticket.customerId,
        ticket.relatedOrderId,
      );
  }
  if (query.customerId) {
    for (const note of indexes.notesByCustomer.get(query.customerId)) {
      if (note.visibility === 'private' && note.authorId !== runtime.actor.id) continue;
      derive(
        `${note.id}:note`,
        'customer.note_added',
        note.authorId,
        note.metadata.createdAt,
        'customer_note',
        note.id,
        'Note',
        note.body.length > 140 ? `${note.body.slice(0, 137)}…` : note.body,
        query.customerId,
      );
    }
  }
  events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
  const page = events.slice(0, limit);
  return {
    data: page.map((event) => ({
      ...event,
      actorName: store.dataset.users.get(event.actorId)?.displayName ?? event.actorId,
    })),
    hasMore: events.length > limit,
  };
}

export interface AuditListItem extends AuditEvent {
  actorName: string;
}

export const auditResource: ResourceDefinition<AuditListItem> = {
  fields: fields<AuditListItem>({
    id: ['string', (item) => item.id],
    occurredAt: ['datetime', (item) => item.occurredAt],
    actorId: ['string', (item) => item.actorId],
    actorName: ['string', (item) => item.actorName],
    action: ['string', (item) => item.action],
    entityType: ['enum', (item) => item.entityType],
    entityId: ['string', (item) => item.entityId],
    correlationId: ['string', (item) => item.correlationId],
  }),
  search: (item) => [item.action, item.entityId, item.actorName, item.correlationId],
  defaultSort: '-occurredAt',
};

export function listAudit(runtime: ApiRuntime, query: ListQuery): ListResponse<AuditListItem> {
  runtime.require('audit.view');
  const items: AuditListItem[] = [];
  for (const event of runtime.store.dataset.auditEvents.values())
    items.push({
      ...event,
      actorName: runtime.store.dataset.users.get(event.actorId)?.displayName ?? event.actorId,
    });
  return runListQuery(items, auditResource, query);
}

// ---------------------------------------------------------------------------
// Global search (section 71.2)

export interface SearchHit {
  type:
    | 'customer'
    | 'contact'
    | 'sku'
    | 'product'
    | 'order'
    | 'quote'
    | 'invoice'
    | 'supplier'
    | 'purchase_order'
    | 'ticket';
  id: string;
  title: string;
  subtitle: string;
  number?: string;
  status?: string;
}

export interface SearchResponse {
  query: string;
  groups: { type: SearchHit['type']; total: number; hits: SearchHit[] }[];
}

export function globalSearch(runtime: ApiRuntime, rawQuery: string): SearchResponse {
  const needle = rawQuery.trim().toLowerCase();
  const groups: SearchResponse['groups'] = [];
  if (needle.length < 2) return { query: rawQuery, groups };
  const { store } = runtime;
  const matcher = (...values: (string | undefined)[]): boolean =>
    values.some((value) => value !== undefined && value.toLowerCase().includes(needle));
  const collect = (
    type: SearchHit['type'],
    permission: string,
    source: () => Iterable<SearchHit | undefined>,
  ): void => {
    if (!runtime.can(permission)) return;
    const hits: SearchHit[] = [];
    let total = 0;
    for (const hit of source()) {
      if (!hit) continue;
      total += 1;
      if (hits.length < 8) hits.push(hit);
    }
    if (total > 0) groups.push({ type, total, hits });
  };
  collect('customer', 'customers.view', function* () {
    for (const customer of store.dataset.customers.values())
      if (matcher(customer.displayName, customer.legalName, customer.accountNumber))
        yield {
          type: 'customer',
          id: customer.id,
          title: customer.displayName,
          subtitle: `${customer.accountNumber} · ${customer.segment}`,
          number: customer.accountNumber,
          status: customer.status,
        };
  });
  collect('contact', 'contacts.view', function* () {
    for (const contact of store.dataset.contacts.values())
      if (matcher(contact.displayName, contact.email))
        yield {
          type: 'contact',
          id: contact.id,
          title: contact.displayName,
          subtitle: store.dataset.customers.get(contact.customerId)?.displayName ?? '',
          status: contact.status,
        };
  });
  collect('sku', 'catalog.view', function* () {
    for (const sku of store.dataset.skus.values())
      if (matcher(sku.sku, sku.name, sku.manufacturerPartNumber))
        yield {
          type: 'sku',
          id: sku.id,
          title: sku.name,
          subtitle: sku.sku,
          number: sku.sku,
          status: sku.status,
        };
  });
  collect('order', 'orders.view', function* () {
    for (const order of store.dataset.salesOrders.values())
      if (matcher(order.orderNumber, order.customerPoNumber))
        yield {
          type: 'order',
          id: order.id,
          title: order.orderNumber,
          subtitle: store.dataset.customers.get(order.customerId)?.displayName ?? '',
          number: order.orderNumber,
          status: order.status,
        };
  });
  collect('quote', 'quotes.view', function* () {
    for (const quote of store.dataset.quotes.values())
      if (matcher(quote.quoteNumber))
        yield {
          type: 'quote',
          id: quote.id,
          title: quote.quoteNumber,
          subtitle: store.dataset.customers.get(quote.customerId)?.displayName ?? '',
          number: quote.quoteNumber,
          status: quote.status,
        };
  });
  collect('invoice', 'invoices.view', function* () {
    for (const invoice of store.dataset.invoices.values())
      if (matcher(invoice.invoiceNumber, invoice.customerPoNumber))
        yield {
          type: 'invoice',
          id: invoice.id,
          title: invoice.invoiceNumber ?? invoice.id,
          subtitle: store.dataset.customers.get(invoice.customerId)?.displayName ?? '',
          status: invoice.lifecycle,
          ...(invoice.invoiceNumber ? { number: invoice.invoiceNumber } : {}),
        };
  });
  collect('supplier', 'suppliers.view', function* () {
    for (const supplier of store.dataset.suppliers.values())
      if (matcher(supplier.displayName, supplier.supplierNumber))
        yield {
          type: 'supplier',
          id: supplier.id,
          title: supplier.displayName,
          subtitle: supplier.category,
          number: supplier.supplierNumber,
          status: supplier.status,
        };
  });
  collect('purchase_order', 'purchase_orders.view', function* () {
    for (const po of store.dataset.purchaseOrders.values())
      if (
        matcher(po.purchaseOrderNumber) &&
        runtime.can('purchase_orders.view', { warehouseId: po.destinationWarehouseId })
      )
        yield {
          type: 'purchase_order',
          id: po.id,
          title: po.purchaseOrderNumber,
          subtitle: store.dataset.suppliers.get(po.supplierId)?.displayName ?? '',
          number: po.purchaseOrderNumber,
          status: po.status,
        };
  });
  collect('ticket', 'support.view', function* () {
    for (const ticket of store.dataset.tickets.values())
      if (matcher(ticket.ticketNumber, ticket.subject))
        yield {
          type: 'ticket',
          id: ticket.id,
          title: ticket.subject,
          subtitle: `${ticket.ticketNumber} · ${store.dataset.customers.get(ticket.customerId)?.displayName ?? ''}`,
          number: ticket.ticketNumber,
          status: ticket.status,
        };
  });
  return { query: rawQuery, groups };
}
