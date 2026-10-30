import { Injectable, signal } from '@angular/core';
import type {
  ListQuery,
  ListResponse,
  NexoraApi,
  WorkflowListItem,
  WorkflowStatus,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  'active',
  'error',
  'draft',
  'paused',
  'archived',
];

/**
 * The workflows (§15): every one the tenant holds, with the count of each
 * status beside the list, which the bar's views read and the header's door to
 * the stopped ones reads.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowsStore extends ListStore<WorkflowListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The workflows could not be loaded';

  /** Workflows per status; null before the answer. */
  readonly counts = signal<Readonly<Record<WorkflowStatus, number>> | null>(null);

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<WorkflowListItem>> {
    return api.workflows.list(query);
  }

  async loadCounts(): Promise<void> {
    const api = await this.backend.ready();
    const answers = await this.health.read(
      () =>
        Promise.all(
          WORKFLOW_STATUSES.map((status) =>
            api.workflows.list({ pageSize: 25, filter: { status: { eq: status } } }),
          ),
        ),
      null,
    );
    if (answers === null) return;
    this.counts.set(
      Object.fromEntries(
        WORKFLOW_STATUSES.map((status, index) => [status, answers[index]?.page.totalItems ?? 0]),
      ) as Record<WorkflowStatus, number>,
    );
  }

  protected override forget(): void {
    super.forget();
    this.counts.set(null);
  }
}
