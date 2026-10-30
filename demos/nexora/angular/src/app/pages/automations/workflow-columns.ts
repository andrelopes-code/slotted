import type { FilterBarField, FilterBarPreset } from '@slotted/angular/filter-bar';
import type { FilterGroup } from '@slotted/core/filter';
import type { GridColumn } from '@slotted/core/grid';
import type { WorkflowListItem, WorkflowPerson, WorkflowStatus } from '@slotted/demo-nexora-backend';

import { options } from '../../core/catalog/catalog.model';
import { STATUS_LABEL, TRIGGER_LABEL } from '../../core/automation/workflow.model';
import { WORKFLOW_STATUSES } from '../../core/automation/workflows.store';

/**
 * The workflow list's columns (§15): the name leads, and on a phone the state
 * and the failures of the last seven days follow it (LP-01), which is what a
 * reader opens the list for. Every column reads a field `workflowResource`
 * sorts and filters by, so the bar never offers a filter the backend ignores.
 */
export function workflowColumns(relative: (instant: string) => string): readonly GridColumn<WorkflowListItem>[] {
  return [
    { id: 'name', label: 'Workflow', rowHeader: true, width: 300, hideable: false },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: options(STATUS_LABEL),
      width: 112,
      priority: 1,
    },
    {
      id: 'recentOutcomes',
      label: 'Last runs',
      width: 156,
      priority: 3,
      sortable: false,
      filterable: false,
      description: 'Its newest runs, oldest first: a full mark did its work, a short one was skipped, red failed.',
    },
    {
      id: 'recentFailures',
      label: 'Failures',
      kind: 'number',
      align: 'end',
      width: 132,
      priority: 2,
      description: 'Runs of the last seven days that failed or partly failed.',
    },
    {
      id: 'triggerType',
      label: 'Trigger',
      kind: 'set',
      options: options(TRIGGER_LABEL),
      width: 188,
      priority: 4,
      accessor: (row) => row.trigger.type,
      format: (value) => TRIGGER_LABEL[value as keyof typeof TRIGGER_LABEL] ?? String(value),
    },
    {
      id: 'lastRunAt',
      label: 'Last run',
      kind: 'date',
      width: 128,
      priority: 5,
      accessor: (row) => row.lastRunAt ?? '',
      format: (value) => (value ? relative(String(value)) : 'Never'),
    },
    {
      id: 'runCount',
      label: 'Runs',
      kind: 'number',
      align: 'end',
      width: 88,
      priority: 6,
      description: 'Every run it kept, the ones its conditions skipped included.',
    },
    { id: 'ownerName', label: 'Owner', width: 180, priority: 7, filterable: false },
    {
      id: 'updatedAt',
      label: 'Changed',
      kind: 'date',
      width: 140,
      priority: 8,
      filterable: false,
      accessor: (row) => row.metadata.updatedAt,
      format: (value) => relative(String(value)),
    },
  ];
}

/** The fields `workflowResource` filters by. */
export function workflowFilterFields(owners: readonly WorkflowPerson[]): readonly FilterBarField[] {
  return [
    { key: 'status', label: 'Status', kind: 'set', options: options(STATUS_LABEL), pinned: true, operators: ['anyOf'] },
    { key: 'triggerType', label: 'Trigger', kind: 'set', options: options(TRIGGER_LABEL), pinned: true, operators: ['anyOf'] },
    {
      key: 'ownerId',
      label: 'Owner',
      kind: 'set',
      options: owners.map((owner) => ({ value: owner.id, label: owner.name })),
      operators: ['anyOf'],
    },
    {
      key: 'recentFailures',
      label: 'Failures, 7 days',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'equals'],
    },
    { key: 'runCount', label: 'Runs', kind: 'number', operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'equals'] },
  ];
}

export const statusFilter = (status: WorkflowStatus): FilterGroup => ({
  join: 'and',
  rules: [{ field: 'status', filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: [status] }] } }],
});

/** The views a reader works from: a tree of the bar's own pills each, named with its count (CV-03). */
export const VIEW_LABEL: Record<WorkflowStatus, string> = {
  active: 'Active',
  error: 'In error',
  draft: 'Drafts',
  paused: 'Paused',
  archived: 'Archived',
};

export function workflowViews(counts: Readonly<Record<WorkflowStatus, number>> | null): readonly FilterBarPreset[] {
  return WORKFLOW_STATUSES.map((status) => ({
    key: status,
    label: counts ? `${VIEW_LABEL[status]} · ${counts[status]}` : VIEW_LABEL[status],
    value: statusFilter(status),
  }));
}
