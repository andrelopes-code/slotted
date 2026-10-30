import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import {
  conditionMeasure,
  type NexoraApi,
  type WorkflowDetail,
  type WorkflowListItem,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { classify, fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import { WorkflowCatalogStore } from './workflow-catalog.store';
import { WorkflowDraft, type WorkflowDefinition } from './workflow-draft';
import { STATUS_LABEL, actionWords, triggerWords } from './workflow.model';
import { WorkflowsStore } from './workflows.store';

export type WorkflowCommand = 'activate' | 'pause' | 'archive' | 'save';

/** The module's words for what a workflow command can meet (§69, §78.2). */
export const WORKFLOW_WORDS: Record<string, string> = {
  STALE_VERSION: 'Someone else changed this workflow while the page was open.',
  INVALID_STATE_TRANSITION: 'The workflow is no longer in a state that allows this.',
  FORBIDDEN: 'Your role does not change workflows: an administrator does.',
  VALIDATION_FAILED: 'Nexora refused the workflow as it stands.',
};

/** A field of the definition someone else moved while the editor was open (FM-08). */
export interface WorkflowConflictField {
  readonly label: string;
  readonly theirs: string;
  readonly mine: string | null;
}

export function definitionOf(workflow: WorkflowListItem): WorkflowDefinition {
  return {
    name: workflow.name,
    description: workflow.description ?? '',
    ownerId: workflow.ownerId,
    trigger: { type: workflow.trigger.type, config: { ...(workflow.trigger.config ?? {}) } },
    conditions: structuredClone(workflow.conditions),
    actions: structuredClone(workflow.actions),
  };
}

/**
 * One workflow (§15): its definition, its state and the commands that state
 * allows, its recent runs; and the definition's editor, which holds what the
 * reader wrote through a refusal, a 503 and a conflict. Every command carries
 * the version the page read, held as a number (ER-03); a refusal is classed
 * before it is shown (ER-01), and a conflict reads the workflow again (ER-02).
 */
@Injectable({ providedIn: 'root' })
export class WorkflowStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly list = inject(WorkflowsStore);
  readonly catalog = inject(WorkflowCatalogStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<WorkflowDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<WorkflowCommand | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);
  /** The backend's refusal of a save or an activation, keyed by its field names (FM-02, FM-03). */
  readonly refused = signal<FormErrors>({});
  /** What another writer, or the engine, moved under the open editor (FM-08). */
  readonly conflict = signal<readonly WorkflowConflictField[] | null>(null);

  readonly draft = new WorkflowDraft(this.catalog.catalog);
  /** The workflow the editor's draft was opened on: a draft is kept only for the same workflow. */
  private draftOf: string | null = null;

  private sequence = 0;
  private version = 0;

  readonly workflow = computed(() => this.detail()?.workflow ?? null);

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  readonly canEdit = computed(() => this.can('workflows.edit') && this.workflow()?.status !== 'archived');

  /** The commands this state allows and this reader holds (RP-09), in the order they are read. */
  readonly commands = computed<readonly ('activate' | 'pause' | 'archive')[]>(() => {
    const workflow = this.workflow();
    if (workflow === null) return [];
    const commands: ('activate' | 'pause' | 'archive')[] = [];
    if (this.can('workflows.activate')) {
      if (workflow.status === 'draft' || workflow.status === 'paused' || workflow.status === 'error')
        commands.push('activate');
      if (workflow.status === 'active' || workflow.status === 'error') commands.push('pause');
    }
    if (this.can('workflows.archive') && workflow.status !== 'archived') commands.push('archive');
    return commands;
  });

  /** §69.2's measures of the stored tree, for the figures and the builder's counts. */
  readonly measure = computed(() => {
    const workflow = this.workflow();
    return workflow ? conditionMeasure(workflow.conditions) : null;
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.error.set(null);
      this.failure.set(null);
      this.refused.set({});
      this.conflict.set(null);
    }
    await Promise.all([this.catalog.ensure(), this.load()]);
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.workflows.get(id);
      if (ticket !== this.sequence) return;
      this.version = detail.workflow.metadata.version;
      this.detail.set(detail);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The workflow could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The editor opens on the stored definition, unless it already holds the reader's own for this workflow. */
  startEdit(): void {
    const workflow = this.workflow();
    if (workflow === null) return;
    if (this.draftOf === workflow.id && this.draft.dirty()) return;
    this.draftOf = workflow.id;
    this.draft.load(definitionOf(workflow));
    this.refused.set({});
    this.conflict.set(null);
  }

  /** Leaving the editor without saving forgets what it held. */
  discardEdit(): void {
    this.draftOf = null;
    this.refused.set({});
    this.conflict.set(null);
    const workflow = this.workflow();
    if (workflow) this.draft.load(definitionOf(workflow));
  }

  activate(): Promise<boolean> {
    return this.run('activate', (api, id, version) => api.workflows.activate(id, { ifMatch: version }));
  }

  pause(): Promise<boolean> {
    return this.run('pause', (api, id, version) => api.workflows.pause(id, { ifMatch: version }));
  }

  archive(): Promise<boolean> {
    return this.run('archive', (api, id, version) => api.workflows.archive(id, { ifMatch: version }));
  }

  /**
   * Saves what the reader changed (FM-09), checked first as the backend
   * checks it: a structure for a stopped workflow, a definition that can run
   * for an active one. Answers false and keeps the draft on any refusal.
   */
  async save(): Promise<boolean> {
    const workflow = this.workflow();
    if (workflow === null) return false;
    this.draft.attempted.set(true);
    const issues = workflow.status === 'active' ? this.draft.runIssues() : this.draft.saveIssues();
    if (issues.all.length > 0) return false;
    const changes = this.draft.changes();
    if (Object.keys(changes).length === 0) {
      this.discardEdit();
      return true;
    }
    const ok = await this.run('save', (api, id, version) => api.workflows.update(id, changes, { ifMatch: version }));
    if (ok) this.discardEdit();
    return ok;
  }

  /** "Keep what I wrote": the reader's own changes, written over the version now stored (FM-08). */
  async keepMine(): Promise<boolean> {
    this.conflict.set(null);
    return this.save();
  }

  /** "Start from the workflow": the editor reopens on what is stored now. */
  startOver(): void {
    this.draftOf = null;
    this.startEdit();
  }

  private async run(
    kind: WorkflowCommand,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const workflow = this.workflow();
    if (workflow === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    this.refused.set({});
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, workflow.id, this.version));
      await this.load();
      if (this.list.total() !== null) void Promise.all([this.list.reload(), this.list.loadCounts()]);
      return true;
    } catch (error) {
      const failure = classify(error, WORKFLOW_WORDS, 'The workflow was not changed.');
      this.failure.set(failure);
      if (failure.kind === 'validation') this.refused.set(fieldErrors(error));
      if (failure.code === 'STALE_VERSION' || failure.code === 'INVALID_STATE_TRANSITION') {
        const before = this.workflow();
        await this.load();
        const after = this.workflow();
        if (kind === 'save' && before && after) this.conflict.set(this.movedFields(after));
      }
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  /** The definition's fields the stored workflow now holds differently from what the editor opened on. */
  private movedFields(now: WorkflowListItem): WorkflowConflictField[] {
    const catalog = this.catalog.catalog();
    const people = this.detail()?.people ?? {};
    const stored = definitionOf(now);
    const opened = this.draft.opened();
    const mine = this.draft.definition();
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const fields: WorkflowConflictField[] = [];
    const add = (label: string, key: keyof WorkflowDefinition, words: (definition: WorkflowDefinition) => string) => {
      if (same(stored[key], opened[key])) return;
      fields.push({ label, theirs: words(stored), mine: same(mine[key], opened[key]) ? null : words(mine) });
    };
    const trigger = (definition: WorkflowDefinition) =>
      triggerWords(this.catalog.trigger(definition.trigger.type), definition.trigger.config);
    const tree = (definition: WorkflowDefinition) => {
      const measure = conditionMeasure(definition.conditions);
      return `${measure.conditions} ${measure.conditions === 1 ? 'condition' : 'conditions'} in ${measure.depth} ${measure.depth === 1 ? 'level' : 'levels'}`;
    };
    add('Name', 'name', (definition) => definition.name);
    add('Description', 'description', (definition) => definition.description || 'none');
    add('Owner', 'ownerId', (definition) => people[definition.ownerId] ?? catalog?.owners.find((owner) => owner.id === definition.ownerId)?.name ?? definition.ownerId);
    add('Trigger', 'trigger', trigger);
    add('Conditions', 'conditions', tree);
    add('Actions', 'actions', (definition) =>
      definition.actions.map((action) => actionWords(action, catalog, people)).join('; ') || 'none',
    );
    if (now.status !== this.detail()?.workflow.status || fields.length === 0)
      fields.push({ label: 'Status', theirs: STATUS_LABEL[now.status], mine: null });
    return fields;
  }
}
