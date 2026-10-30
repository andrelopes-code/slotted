import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { WorkflowRunStatus } from '@slotted/demo-nexora-backend';

import { RUN_STATUS_LABEL } from '../../core/automation/workflow.model';

const TONE: Record<WorkflowRunStatus, string> = {
  succeeded: 'success',
  partially_failed: 'warning',
  failed: 'danger',
  skipped: 'secondary',
  queued: 'secondary',
  running: 'secondary',
};

/** Failures first: the order the words read the counts in. */
const ORDER: readonly WorkflowRunStatus[] = ['failed', 'partially_failed', 'succeeded', 'skipped', 'queued', 'running'];

/**
 * A workflow's last runs as a row of marks, oldest first, in one table cell:
 * a run that matched and did its work is a full mark, a skipped one a short
 * one, a failure the danger tone. The row reads as one image whose name says
 * the counts in words, so the tone is never the only carrier (CP-05). A
 * sparkline would draw a trend of one number; the marks keep each run.
 */
@Component({
  selector: 'app-outcome-marks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'words()', '[attr.title]': 'words()', '[class.none]': 'outcomes().length === 0' },
  styles: `
    :host {
      display: inline-flex;
      align-items: end;
      gap: calc(var(--slotted-space-1) / 2);
      block-size: var(--slotted-space-5);
      vertical-align: middle;
    }
    /* With no mark the words stand on the cell's own line, as the other cells' text does. */
    :host(.none) {
      block-size: auto;
    }
    span {
      inline-size: var(--slotted-space-1);
      block-size: 100%;
      border-radius: var(--slotted-radius-full);
      background: var(--tone, var(--slotted-tone-secondary-solid));
    }
    span[data-tone='success'] {
      --tone: var(--slotted-tone-success-solid);
    }
    span[data-tone='warning'] {
      --tone: var(--slotted-tone-warning-solid);
    }
    span[data-tone='danger'] {
      --tone: var(--slotted-tone-danger-solid);
    }
    span[data-tone='secondary'] {
      --tone: var(--slotted-border-strong);
      block-size: 50%;
    }
    em {
      font-style: normal;
      font-size: var(--slotted-font-size-sm);
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    @for (outcome of outcomes(); track $index) {
      <span [attr.data-tone]="tone(outcome)"></span>
    } @empty {
      <em>No run yet</em>
    }
  `,
})
export class OutcomeMarks {
  readonly outcomes = input.required<readonly WorkflowRunStatus[]>();

  readonly words = computed(() => {
    const outcomes = this.outcomes();
    if (outcomes.length === 0) return 'No run yet';
    const parts = ORDER.map((status) => ({ status, count: outcomes.filter((outcome) => outcome === status).length }))
      .filter((entry) => entry.count > 0)
      .map((entry) => `${entry.count} ${RUN_STATUS_LABEL[entry.status].toLowerCase()}`);
    const last = RUN_STATUS_LABEL[outcomes[outcomes.length - 1]!].toLowerCase();
    return `Last ${outcomes.length === 1 ? 'run' : `${outcomes.length} runs`}: ${parts.join(', ')}; the newest ${last}`;
  });

  tone(outcome: WorkflowRunStatus): string {
    return TONE[outcome];
  }
}
