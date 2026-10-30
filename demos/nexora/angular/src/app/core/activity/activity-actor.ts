import type { ActivityEvent } from '@slotted/demo-nexora-backend';

import { runsRoute } from '../automation/workflow.model';

/**
 * Who did what an activity entry says: a person by name, or the automation by
 * the workflow whose run did it (§69.3), so an entry a workflow wrote never
 * reads as the work of the person whose command set the workflow off.
 */
export function activityActor(event: ActivityEvent & { actorName: string }): string {
  const workflow = event.metadata?.['workflowName'];
  return typeof workflow === 'string' ? `Workflow “${workflow}”` : event.actorName;
}

/** The run an automation entry was written by, at the history's address; null for a person's entry. */
export function activityRun(event: ActivityEvent): { path: string; run: string } | null {
  const workflowId = event.metadata?.['workflowId'];
  const runId = event.metadata?.['workflowRunId'];
  return typeof workflowId === 'string' && typeof runId === 'string'
    ? { path: runsRoute(workflowId), run: runId }
    : null;
}
