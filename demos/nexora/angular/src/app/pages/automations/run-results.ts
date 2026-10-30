import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectLocale } from '@slotted/angular/i18n';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import type { ConditionNode, WorkflowAction, WorkflowCatalog, WorkflowRunListItem } from '@slotted/demo-nexora-backend';

import { entityRoute } from '../../core/activity/entity-route';
import {
  AFFECTED_LABEL,
  durationWords,
  RUN_ERROR_WORDS,
  RUN_STATUS_LABEL,
  RUN_STATUS_TONE,
  runCause,
} from '../../core/automation/workflow.model';
import { RuleSheet } from './rule-sheet';

/**
 * One run, action by action (§15 "Execution History"): its state in words, when
 * it started and how long it took, the record it was about at its own address,
 * what set it off, and its trace on the workflow's map: the step it stopped
 * at, each action with what it did or the message of its failure. The steps
 * are read against the definition as it stands now; an action since removed
 * says so.
 */
@Component({
  selector: 'app-run-results',
  imports: [
    RouterLink,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlStack,
    SlTag,
    SlTagBody,
    SlText,
    RuleSheet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = run();
    <div slStack [gap]="5" data-testid="run-results">
      @if (item.status === 'failed' || item.status === 'partially_failed') {
        <div slInlineMessage [tone]="item.status === 'failed' ? 'danger' : 'warning'" data-testid="run-failure">
          <span slInlineMessageIcon></span>
          {{ failureWords() }}
        </div>
      }
      <div slDescriptionList variant="ruled" [columns]="1">
        <div slDescriptionListItem>
          <dt slDescriptionListTerm>Status</dt>
          <dd slDescriptionListDescription>
            <span slTag size="sm" [tone]="tone()"><span slTagBody>{{ status() }}</span></span>
          </dd>
        </div>
        <div slDescriptionListItem>
          <dt slDescriptionListTerm>Started</dt>
          <dd slDescriptionListDescription>{{ started() }}</dd>
        </div>
        <div slDescriptionListItem>
          <dt slDescriptionListTerm>Took</dt>
          <dd slDescriptionListDescription>{{ duration() }}</dd>
        </div>
        <div slDescriptionListItem>
          <dt slDescriptionListTerm>About</dt>
          <dd slDescriptionListDescription data-testid="run-affected">
            @if (affectedRoute(); as route) {
              <a slLink [routerLink]="route.path" [queryParams]="route.query">{{ affectedWords() }}</a>
            } @else {
              {{ affectedWords() }}
            }
          </dd>
        </div>
        <div slDescriptionListItem>
          <dt slDescriptionListTerm>Why it ran</dt>
          <dd slDescriptionListDescription>{{ cause() }}</dd>
        </div>
      </div>
      <div slStack [gap]="3">
        <span slText weight="medium">Step by step</span>
        <app-rule-sheet
          data-testid="run-actions"
          [trigger]="trigger()"
          [conditions]="$any(conditions())"
          [actions]="actions()"
          [catalog]="catalog()"
          [people]="people()"
          [run]="item"
        />
      </div>
    </div>
  `,
})
export class RunResults {
  private readonly locale = injectLocale();

  readonly run = input.required<WorkflowRunListItem>();
  readonly trigger = input<{ type: string; config?: Record<string, unknown> }>({ type: 'none' });
  readonly conditions = input<ConditionNode>({ type: 'group', operator: 'and', children: [] });
  readonly actions = input<readonly WorkflowAction[]>([]);
  readonly catalog = input<WorkflowCatalog | null>(null);
  readonly people = input<Readonly<Record<string, string>>>({});
  /** "3 hours ago" by the demo clock, and the exact instant. */
  readonly relative = input.required<(instant: string) => string>();
  readonly exact = input.required<(instant: string) => string>();

  readonly status = computed(() => RUN_STATUS_LABEL[this.run().status]);
  readonly tone = computed(() => RUN_STATUS_TONE[this.run().status]);
  readonly started = computed(() => `${this.relative()(this.run().startedAt)} · ${this.exact()(this.run().startedAt)}`);
  readonly duration = computed(() => durationWords(this.run().durationMs, this.locale()));
  readonly cause = computed(() => runCause(this.run()));

  readonly affectedWords = computed(() => {
    const run = this.run();
    if (!run.affectedEntityType) return 'No one record: a scheduled run reads the tenant as a whole';
    const kind = AFFECTED_LABEL[run.affectedEntityType] ?? run.affectedEntityType;
    const label = run.affectedLabel ?? run.affectedEntityId ?? '';
    return entityRoute(run.affectedEntityType, run.affectedEntityId) === null
      ? `${kind} ${label}, which has no screen of its own`
      : `${kind} ${label}`;
  });

  readonly affectedRoute = computed(() => {
    const run = this.run();
    const route = entityRoute(run.affectedEntityType, run.affectedEntityId);
    if (route === null) return null;
    const [path, query] = route.split('?');
    return {
      path: path as string,
      query: query ? Object.fromEntries(new URLSearchParams(query)) : {},
    };
  });

  readonly failureWords = computed(() => {
    const run = this.run();
    const failed = run.actionResults.find((result) => result.status === 'failed');
    const code = run.errorCode ?? failed?.errorCode;
    const words = code ? RUN_ERROR_WORDS[code] : 'An action failed';
    if (code === 'WORKFLOW_RECURSION_LIMIT') return `${words}. No action ran.`;
    const which = failed ? ` — action ${failed.actionIndex + 1}: ${failed.message ?? ''}` : '';
    return run.status === 'failed'
      ? `${words}${which}. The run failed and stopped the workflow.`
      : `${words}${which}. The other actions ran.`;
  });
}
