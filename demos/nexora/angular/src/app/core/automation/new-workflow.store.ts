import { inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { classify, fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import { WorkflowCatalogStore } from './workflow-catalog.store';
import { blankDefinition, WorkflowDraft } from './workflow-draft';
import { WORKFLOW_WORDS } from './workflow.store';
import { WorkflowsStore } from './workflows.store';

/**
 * The workflow being written on its own route (FM-01), in the order of
 * Journey G: the trigger, the conditions, the actions, the check, and the
 * activation. The draft lives here, not in the page, so leaving the form and
 * coming back finds it (FM-05); a create that succeeds empties it.
 */
@Injectable({ providedIn: 'root' })
export class NewWorkflowStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly list = inject(WorkflowsStore);
  readonly catalog = inject(WorkflowCatalogStore);

  readonly draft = new WorkflowDraft(this.catalog.catalog);
  readonly saving = signal<'draft' | 'activate' | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);
  readonly refused = signal<FormErrors>({});
  /** The workflow a create made whose activation was then refused: the record says why. */
  readonly createdId = signal<string | null>(null);
  private owner: string | null = null;

  /** Opens the form; a draft already written is kept, and a blank one is owned by the author. */
  async open(): Promise<void> {
    await this.catalog.ensure();
    const me = this.session.user()?.id ?? '';
    if (this.owner !== me) {
      this.owner = me;
      this.draft.load(blankDefinition(me));
    }
  }

  /**
   * Creates the workflow as a draft, and activates it where the reader asked:
   * the check of each step runs first, from the catalog the backend checks
   * with. Answers the new workflow's id, or null with the draft kept.
   */
  async create(activate: boolean): Promise<string | null> {
    if (this.saving() !== null) return null;
    this.draft.attempted.set(true);
    const issues = activate ? this.draft.runIssues() : this.draft.saveIssues();
    if (issues.all.length > 0) return null;
    const definition = this.draft.definition();
    if (!definition.trigger.type) return null;
    this.saving.set(activate ? 'activate' : 'draft');
    this.failure.set(null);
    this.refused.set({});
    try {
      const api = await this.backend.ready();
      const created = await this.health.mutation(() =>
        api.workflows.create({
          name: definition.name,
          ...(definition.description.trim() ? { description: definition.description } : {}),
          trigger: { type: definition.trigger.type as Exclude<typeof definition.trigger.type, ''>, config: definition.trigger.config },
          conditions: definition.conditions,
          actions: definition.actions,
          ownerId: definition.ownerId,
        }),
      );
      // The draft is written: from here a refusal of the activation is the record's to say.
      this.draft.load(blankDefinition(this.owner ?? ''));
      if (this.list.total() !== null) void Promise.all([this.list.reload(), this.list.loadCounts()]);
      if (activate) {
        try {
          await this.health.mutation(() =>
            api.workflows.activate(created.id, { ifMatch: created.metadata.version }),
          );
        } catch (error) {
          this.createdId.set(created.id);
          this.failure.set(classify(error, WORKFLOW_WORDS, 'The workflow was saved as a draft and not activated.'));
        }
      }
      return created.id;
    } catch (error) {
      const failure = classify(error, WORKFLOW_WORDS, 'The workflow was not saved.');
      this.failure.set(failure);
      if (failure.kind === 'validation') this.refused.set(fieldErrors(error));
      return null;
    } finally {
      this.saving.set(null);
    }
  }
}
