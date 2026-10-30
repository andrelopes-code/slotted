import { Injectable, signal } from '@angular/core';
import type {
  ListQuery,
  ListResponse,
  NexoraApi,
  WorkflowRunListItem,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/**
 * One workflow's execution history (§15 "Execution History"): its runs,
 * newest first. The workflow is the list's place, never one of the bar's
 * pills (BR-01); a run is opened from its row.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowRunsStore extends ListStore<WorkflowRunListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The runs could not be loaded';

  readonly workflowId = signal<string | null>(null);

  /** The list stands in one workflow: a different one empties it and reads from nothing. */
  place(workflowId: string): void {
    if (this.workflowId() === workflowId) return;
    this.workflowId.set(workflowId);
    this.forget();
  }

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<WorkflowRunListItem>> {
    const id = this.workflowId();
    if (id === null)
      return Promise.resolve({
        data: [],
        page: { number: 1, size: query.pageSize ?? 25, totalItems: 0, totalPages: 0 },
      });
    return api.workflows.runs(id, query);
  }
}
