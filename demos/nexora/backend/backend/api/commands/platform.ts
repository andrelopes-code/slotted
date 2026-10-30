import {
  validationFailed,
  workflowIssues,
  type ConditionNode,
  type ImportJob,
  type Notification,
  type SavedView,
  type Task,
  type Workflow,
  type WorkflowAction,
  type WorkflowCheck,
  type WorkflowIssue,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import {
  buildWorkflowCatalog,
  getWorkflow,
  workflowListItem,
  type WorkflowListItem,
} from '../resources/platform';
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

export interface WorkflowInput {
  name: string;
  description?: string;
  trigger: Workflow['trigger'];
  conditions: ConditionNode;
  actions: WorkflowAction[];
  /** The person the workflow answers to; the author when absent. A holder of workflows.view. */
  ownerId?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: Task['priority'];
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export function createPlatformCommands(runtime: ApiRuntime) {
  /**
   * Sections 69.2 and 69.3 — every issue of the definition, at the level the
   * command needs (`workflowIssues`), and the owner's: a person who can read
   * what they own. The conditions' issues travel under `conditions` with
   * `INVALID_CONDITIONS`; the client marks their nodes before the request.
   */
  const refuseIssues = (
    definition: Omit<WorkflowInput, 'ownerId'>,
    ownerId: string,
    check: WorkflowCheck,
    message: string,
  ): void => {
    const catalog = buildWorkflowCatalog(runtime);
    const issues: WorkflowIssue[] = workflowIssues(definition, catalog, check);
    if (!catalog.owners.some((owner) => owner.id === ownerId))
      issues.push({
        field: 'ownerId',
        code: 'INVALID_VALUE',
        message: 'The owner must be an active person who holds workflows.view',
      });
    if (issues.length > 0)
      throw validationFailed(
        issues.map(({ field, code, message: text }) => ({ field, code, message: text })),
        message,
      );
  };

  const workflows = {
    create: (input: WorkflowInput, options?: MutationOptions): Promise<WorkflowListItem> =>
      runtime.command('POST /workflows', options, input, (tx) => {
        const actor = tx.require('workflows.create');
        const ownerId = input.ownerId ?? actor.id;
        refuseIssues(input, ownerId, 'structure', 'The workflow cannot be saved as it stands');
        const id = runtime.store.nextId('workflow');
        const workflow: Workflow = {
          id,
          organizationId: runtime.store.dataset.organization.id,
          name: input.name.trim(),
          status: 'draft',
          trigger: input.trigger,
          conditions: input.conditions,
          actions: input.actions,
          ownerId,
          runCount: 0,
          metadata: metadata(tx, id),
          ...(trimmed(input.description)
            ? { description: trimmed(input.description) as string }
            : {}),
        };
        tx.create('workflows', workflow);
        tx.audit('workflow.created', 'workflow', id, { nextVersion: 1 });
        return workflowListItem(runtime, workflow);
      }),

    /**
     * Section 69 — an edit is checked as a save, and as a run while the
     * workflow is active: what it does next happens without anyone before it.
     * A workflow in error is paused by the edit; it runs again once activated.
     */
    update: (
      id: string,
      input: Partial<WorkflowInput>,
      options?: MutationOptions,
    ): Promise<WorkflowListItem> =>
      runtime.command('PATCH /workflows/:id', options, { id, input }, (tx) => {
        tx.require('workflows.edit');
        const workflow = open(tx, 'workflows', id, 'Workflow', options);
        if (workflow.status === 'archived')
          throw transition('Workflow', workflow.status, 'be edited');
        const next = {
          name: input.name ?? workflow.name,
          trigger: input.trigger ?? workflow.trigger,
          conditions: input.conditions ?? workflow.conditions,
          actions: input.actions ?? workflow.actions,
        };
        const ownerId = input.ownerId ?? workflow.ownerId;
        refuseIssues(
          next,
          ownerId,
          workflow.status === 'active' ? 'run' : 'structure',
          workflow.status === 'active'
            ? 'An active workflow keeps running: the edit must leave it able to run'
            : 'The workflow cannot be saved as it stands',
        );
        const changed: string[] = [];
        if (input.name !== undefined && input.name.trim() !== workflow.name) {
          workflow.name = input.name.trim();
          changed.push('name');
        }
        if (input.description !== undefined) {
          const description = trimmed(input.description);
          if (description) workflow.description = description;
          else delete workflow.description;
          changed.push('description');
        }
        if (input.trigger) {
          workflow.trigger = input.trigger;
          changed.push('trigger');
        }
        if (input.conditions) {
          workflow.conditions = input.conditions;
          changed.push('conditions');
        }
        if (input.actions) {
          workflow.actions = input.actions;
          changed.push('actions');
        }
        if (ownerId !== workflow.ownerId) {
          workflow.ownerId = ownerId;
          changed.push('ownerId');
        }
        if (workflow.status === 'error') {
          workflow.status = 'paused';
          changed.push('status');
        }
        finalize(tx, 'workflows', workflow, 'workflow.updated', 'workflow', changed);
        return workflowListItem(runtime, workflow);
      }),

    /** Activation runs the whole check: what would stop a run is refused now, not met at the first event. */
    activate: (id: string, options?: MutationOptions): Promise<WorkflowListItem> =>
      runtime.command('POST /workflows/:id/activate', options, { id }, (tx) => {
        tx.require('workflows.activate');
        const workflow = open(tx, 'workflows', id, 'Workflow', options);
        if (workflow.status === 'archived' || workflow.status === 'active')
          throw transition('Workflow', workflow.status, 'be activated');
        refuseIssues(workflow, workflow.ownerId, 'run', 'The workflow cannot run as it stands');
        workflow.status = 'active';
        finalize(tx, 'workflows', workflow, 'workflow.activated', 'workflow', ['status']);
        return workflowListItem(runtime, workflow);
      }),

    pause: (id: string, options?: MutationOptions): Promise<WorkflowListItem> =>
      runtime.command('POST /workflows/:id/pause', options, { id }, (tx) => {
        tx.require('workflows.activate');
        const workflow = open(tx, 'workflows', id, 'Workflow', options);
        if (workflow.status !== 'active' && workflow.status !== 'error')
          throw transition('Workflow', workflow.status, 'be paused');
        workflow.status = 'paused';
        finalize(tx, 'workflows', workflow, 'workflow.paused', 'workflow', ['status']);
        return workflowListItem(runtime, workflow);
      }),

    archive: (id: string, options?: MutationOptions): Promise<WorkflowListItem> =>
      runtime.command('POST /workflows/:id/archive', options, { id }, (tx) => {
        tx.require('workflows.archive');
        const workflow = open(tx, 'workflows', id, 'Workflow', options);
        if (workflow.status === 'archived')
          throw transition('Workflow', workflow.status, 'be archived again');
        workflow.status = 'archived';
        workflow.metadata.archivedAt = tx.occurredAt;
        finalize(tx, 'workflows', workflow, 'workflow.archived', 'workflow', ['status']);
        return workflowListItem(runtime, workflow);
      }),
  };

  /**
   * Section 70.4 — a task, written by a person or by a workflow's action. The
   * assignee is told unless they wrote it; the notification opens the record
   * the task is about, or the task when it is about none.
   */
  const createTask = (tx: Transaction, input: TaskInput): Task => {
    new Validator().required('title', input.title).throwIfAny();
    const task: Task = {
      id: runtime.store.nextId('task'),
      organizationId: runtime.store.dataset.organization.id,
      title: input.title.trim(),
      assigneeId: input.assigneeId ?? tx.actor.id,
      createdBy: tx.actor.id,
      priority: input.priority ?? 'normal',
      status: 'open',
      createdAt: tx.occurredAt,
      ...(trimmed(input.description) ? { description: trimmed(input.description) as string } : {}),
      ...(input.dueDate ? { dueDate: input.dueDate } : {}),
      ...(input.relatedEntityType && input.relatedEntityId
        ? { relatedEntityType: input.relatedEntityType, relatedEntityId: input.relatedEntityId }
        : {}),
    };
    tx.create('tasks', task);
    if (task.assigneeId !== tx.actor.id)
      tx.notify(
        task.assigneeId,
        'action_required',
        `New task: ${task.title}`,
        task.description ?? '',
        task.relatedEntityType && task.relatedEntityId
          ? { type: task.relatedEntityType, id: task.relatedEntityId }
          : { type: 'task', id: task.id },
      );
    return task;
  };

  const notifications = {
    markRead: (id: string): Promise<Notification> =>
      runtime.command('POST /notifications/:id/read', undefined, { id }, (tx) => {
        const notification = load(runtime, 'notifications', id, 'Notification');
        if (notification.userId !== tx.actor.id)
          throw domainError(
            'FORBIDDEN',
            'Notifications can only be updated by their recipient',
            403,
          );
        tx.touch('notifications', notification);
        if (!notification.readAt) notification.readAt = tx.occurredAt;
        tx.dirty('notifications', notification);
        return notification;
      }),
    markAllRead: (): Promise<number> =>
      runtime.command('POST /notifications/read-all', undefined, {}, (tx) => {
        let count = 0;
        for (const notification of runtime.indexes.notificationsByUser.get(tx.actor.id)) {
          if (notification.readAt || notification.archivedAt) continue;
          tx.touch('notifications', notification).readAt = tx.occurredAt;
          tx.dirty('notifications', notification);
          count += 1;
        }
        return count;
      }),
    archive: (id: string): Promise<Notification> =>
      runtime.command('POST /notifications/:id/archive', undefined, { id }, (tx) => {
        const notification = load(runtime, 'notifications', id, 'Notification');
        if (notification.userId !== tx.actor.id)
          throw domainError(
            'FORBIDDEN',
            'Notifications can only be updated by their recipient',
            403,
          );
        tx.touch('notifications', notification);
        notification.archivedAt = tx.occurredAt;
        if (!notification.readAt) notification.readAt = tx.occurredAt;
        tx.dirty('notifications', notification);
        return notification;
      }),
  };

  const tasks = {
    create: (input: TaskInput): Promise<Task> =>
      runtime.command('POST /tasks', undefined, input, (tx) => createTask(tx, input)),
    complete: (id: string): Promise<Task> =>
      runtime.command('POST /tasks/:id/complete', undefined, { id }, (tx) => {
        const task = load(runtime, 'tasks', id, 'Task');
        if (task.status !== 'open') throw transition('Task', task.status, 'be completed');
        tx.touch('tasks', task);
        task.status = 'completed';
        task.completedAt = tx.occurredAt;
        tx.dirty('tasks', task);
        return task;
      }),
    cancel: (id: string): Promise<Task> =>
      runtime.command('POST /tasks/:id/cancel', undefined, { id }, (tx) => {
        const task = load(runtime, 'tasks', id, 'Task');
        if (task.status !== 'open') throw transition('Task', task.status, 'be cancelled');
        tx.touch('tasks', task);
        task.status = 'cancelled';
        tx.dirty('tasks', task);
        return task;
      }),
  };

  const savedViews = {
    create: (input: {
      resource: SavedView['resource'];
      name: string;
      isDefault?: boolean;
      state: SavedView['state'];
    }): Promise<SavedView> =>
      runtime.command('POST /saved-views', undefined, input, (tx) => {
        runtime.require('saved_views.manage_own');
        new Validator().required('name', input.name).throwIfAny();
        const id = runtime.store.nextId('savedView');
        if (input.isDefault) {
          for (const other of runtime.indexes.savedViewsByUser.get(tx.actor.id))
            if (other.resource === input.resource && other.isDefault)
              tx.touch('savedViews', other).isDefault = false;
        }
        const view: SavedView = {
          id,
          organizationId: runtime.store.dataset.organization.id,
          userId: tx.actor.id,
          resource: input.resource,
          name: input.name.trim(),
          isDefault: Boolean(input.isDefault),
          state: input.state,
          metadata: metadata(tx, id),
        };
        tx.create('savedViews', view);
        return view;
      }),
    update: (
      id: string,
      input: { name?: string; isDefault?: boolean; state?: SavedView['state'] },
      options?: MutationOptions,
    ): Promise<SavedView> =>
      runtime.command('PATCH /saved-views/:id', options, { id, input }, (tx) => {
        const view = load(runtime, 'savedViews', id, 'Saved view');
        if (view.userId !== tx.actor.id)
          throw domainError('FORBIDDEN', 'Saved views can only be edited by their owner', 403);
        open(tx, 'savedViews', id, 'Saved view', options);
        const changed: string[] = [];
        if (trimmed(input.name)) {
          view.name = trimmed(input.name) as string;
          changed.push('name');
        }
        if (input.state) {
          view.state = input.state;
          changed.push('state');
        }
        if (input.isDefault !== undefined) {
          if (input.isDefault)
            for (const other of runtime.indexes.savedViewsByUser.get(tx.actor.id))
              if (other.id !== id && other.resource === view.resource && other.isDefault)
                tx.touch('savedViews', other).isDefault = false;
          view.isDefault = input.isDefault;
          changed.push('isDefault');
        }
        finalize(tx, 'savedViews', view, 'saved_view.updated', 'saved_view', changed);
        return view;
      }),
    delete: (id: string): Promise<void> =>
      runtime.command('DELETE /saved-views/:id', undefined, { id }, (tx) => {
        const view = load(runtime, 'savedViews', id, 'Saved view');
        if (view.userId !== tx.actor.id)
          throw domainError('FORBIDDEN', 'Saved views can only be deleted by their owner', 403);
        tx.remove('savedViews', id);
      }),
  };

  const imports = {
    /** Section 71.3 — customer CSV import: transactional per row. */
    customers: (input: {
      fileName: string;
      columns: string[];
      rows: string[][];
      mapping: Record<string, string>;
    }): Promise<ImportJob> =>
      runtime.command(
        'POST /imports/customers',
        undefined,
        { fileName: input.fileName, rows: input.rows.length },
        (tx) => {
          runtime.require('imports.run');
          const id = runtime.store.nextId('importJob');
          const job: ImportJob = {
            id,
            organizationId: runtime.store.dataset.organization.id,
            type: 'customers',
            fileName: input.fileName,
            status: 'validating',
            createdBy: tx.actor.id,
            columns: input.columns,
            mapping: input.mapping,
            sampleRows: input.rows.slice(0, 5),
            issues: [],
            metadata: metadata(tx, id),
          };
          tx.create('importJobs', job);
          const columnIndex = (target: string): number => {
            const source = Object.entries(input.mapping).find(
              ([, mapped]) => mapped === target,
            )?.[0];
            return source ? input.columns.indexOf(source) : -1;
          };
          const nameIndex = columnIndex('Company Name');
          const emailIndex = columnIndex('Primary Email');
          const segmentIndex = columnIndex('Segment');
          const termsIndex = columnIndex('Payment Terms');
          if (nameIndex < 0) {
            job.status = 'failed';
            job.issues.push({
              row: 0,
              field: 'Company Name',
              severity: 'error',
              code: 'REQUIRED',
              message: 'Company Name must be mapped',
            });
            tx.dirty('importJobs', job);
            return job;
          }
          let imported = 0;
          let warnings = 0;
          let errors = 0;
          const existingNames = new Set(
            [...runtime.store.dataset.customers.values()].map((customer) =>
              customer.displayName.toLowerCase(),
            ),
          );
          for (const [position, row] of input.rows.entries()) {
            const rowNumber = position + 1;
            const name = (row[nameIndex] ?? '').trim();
            if (!name) {
              job.issues.push({
                row: rowNumber,
                field: 'Company Name',
                severity: 'error',
                code: 'REQUIRED',
                message: 'Company Name is required.',
              });
              errors += 1;
              continue;
            }
            if (existingNames.has(name.toLowerCase())) {
              job.issues.push({
                row: rowNumber,
                field: 'Company Name',
                severity: 'error',
                code: 'DUPLICATE',
                message: `${name} already exists.`,
              });
              errors += 1;
              continue;
            }
            const email = emailIndex >= 0 ? (row[emailIndex] ?? '').trim() : '';
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              job.issues.push({
                row: rowNumber,
                field: 'Primary Email',
                severity: 'error',
                code: 'INVALID_EMAIL',
                message: 'Value is not a valid email address.',
              });
              errors += 1;
              continue;
            }
            let rowWarning = false;
            const rawSegment =
              segmentIndex >= 0
                ? (row[segmentIndex] ?? '').trim().toLowerCase().replace(/[- ]/g, '_')
                : '';
            const segment =
              (['smb', 'mid_market', 'enterprise', 'strategic'] as const).find(
                (candidate) => candidate === rawSegment,
              ) ?? 'smb';
            if (rawSegment && segment !== rawSegment) {
              job.issues.push({
                row: rowNumber,
                field: 'Segment',
                severity: 'warning',
                code: 'UNKNOWN_SEGMENT',
                message: `Segment "${row[segmentIndex]}" not recognized; defaulted to SMB.`,
              });
              rowWarning = true;
            }
            const rawTerms =
              termsIndex >= 0
                ? (row[termsIndex] ?? '').trim().toUpperCase().replace(/\s+/g, '_')
                : '';
            const terms =
              (['DUE_ON_RECEIPT', 'NET_15', 'NET_30', 'NET_45', 'NET_60'] as const).find(
                (candidate) => candidate === rawTerms,
              ) ?? 'NET_30';
            if (rawTerms && terms !== rawTerms) {
              job.issues.push({
                row: rowNumber,
                field: 'Payment Terms',
                severity: 'warning',
                code: 'UNKNOWN_TERMS',
                message: `Payment terms "${row[termsIndex]}" are not supported; defaulted to NET_30.`,
              });
              rowWarning = true;
            }
            const customerId = runtime.store.nextId('customer');
            tx.create('customers', {
              id: customerId,
              organizationId: runtime.store.dataset.organization.id,
              accountNumber: runtime.store.nextBusinessNumber('customer'),
              regionCode: 'US',
              legalName: name,
              displayName: name,
              status: 'prospect',
              segment,
              industry: 'Unknown',
              accountOwnerId: tx.actor.id,
              salesTeamId:
                [...runtime.store.dataset.teams.values()].find((team) => team.type === 'sales')
                  ?.id ?? '',
              paymentTermsCode: terms,
              creditLimit: { currency: 'USD', minor: 0 },
              priceListId:
                [...runtime.store.dataset.priceLists.values()].find(
                  (list) => list.name === 'Standard',
                )?.id ?? '',
              taxProfile: { type: 'taxable' },
              preferredCurrency: 'USD',
              customerSince: runtime.store.today,
              health: 'healthy',
              tags: ['imported'],
              metadata: metadata(tx, customerId),
            });
            existingNames.add(name.toLowerCase());
            imported += 1;
            if (rowWarning) warnings += 1;
          }
          job.result = {
            totalRows: input.rows.length,
            validRows: input.rows.length - errors,
            warningRows: warnings,
            errorRows: errors,
            importedRows: imported,
            skippedRows: errors,
          };
          job.status = errors > 0 ? 'completed_with_errors' : 'completed';
          job.metadata.version = 2;
          tx.dirty('importJobs', job);
          tx.audit('import.completed', 'import_job', id, { nextVersion: 2 });
          return job;
        },
      ),
  };

  return { workflows, notifications, tasks, savedViews, imports, services: { createTask } };
}

export type PlatformCommands = ReturnType<typeof createPlatformCommands>;
export { getWorkflow };
