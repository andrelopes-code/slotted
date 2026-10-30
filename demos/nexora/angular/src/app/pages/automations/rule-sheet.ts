import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { injectLocale } from '@slotted/angular/i18n';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import type {
  ConditionNode,
  WorkflowAction,
  WorkflowCatalog,
  WorkflowInsight,
  WorkflowRunListItem,
} from '@slotted/demo-nexora-backend';

import {
  actionWords,
  fieldWords,
  operatorWords,
  RUN_ERROR_WORDS,
  triggerWords,
  valueWords,
} from '../../core/automation/workflow.model';

type Group = Extract<ConditionNode, { type: 'group' }>;
type Condition = Extract<ConditionNode, { type: 'condition' }>;
type Outcome = WorkflowRunListItem['actionResults'][number];
type State = 'passed' | 'ended' | 'failed' | 'stopped' | null;

/** One line of the condition tree as it is read: its depth, the join that leads it, and what it holds. */
interface Line {
  depth: number;
  join: 'and' | 'or' | null;
  group: Group | null;
  condition: Condition | null;
}

/**
 * A workflow read as the rule it is: four lines down a rail — When, If, Then,
 * Otherwise — with what each did in a column at the end. The conditions are
 * set the way a query is: the join leads each later line in a column of its
 * own, a nested group steps in under the line that opens it, and a guide
 * marks every level. Read with an insight, the end column carries fourteen
 * days; read with a run, it is the run's trace and the rail is lit as far as
 * the run went. The same sheet is the editor's preview (BD-01, BD-06).
 */
@Component({
  selector: 'app-rule-sheet',
  imports: [SlSkeletonText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
      --_label: 5rem;
      --_step: 2.75rem;
    }
    ol {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .sheet {
      display: grid;
      grid-template-columns: [label] var(--_label) [rail] var(--slotted-space-8) [body] minmax(0, 1fr) [metric] auto;
      column-gap: var(--slotted-space-6);
    }
    .row {
      position: relative;
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
      align-items: start;
      padding-block: var(--slotted-space-7);
      font-size: var(--slotted-font-size-md);
      line-height: var(--slotted-line-height-md);
    }
    /* A hairline between steps, from the body to the end: the rail runs through. */
    .row + .row::after {
      content: '';
      position: absolute;
      grid-column: body / -1;
      inset: 0 0 auto;
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    .label {
      text-align: end;
      color: var(--slotted-text-muted);
      font-weight: var(--slotted-font-weight-medium);
    }
    .rail {
      position: relative;
      align-self: stretch;
      --_y: 0.5lh;
    }
    .rail::before {
      content: '';
      position: absolute;
      inset-inline-start: 50%;
      inset-block: calc(var(--slotted-space-7) * -1 - 1px);
      border-inline-start: var(--slotted-border-width-medium) solid var(--_line, var(--slotted-border-subtle));
    }
    .row:first-child .rail::before {
      inset-block-start: var(--_y);
    }
    .row:last-child .rail::before {
      inset-block-end: calc(100% - var(--_y));
    }
    .rail::after {
      content: '';
      position: absolute;
      inset-inline-start: 50%;
      inset-block-start: var(--_y);
      inline-size: var(--slotted-space-5);
      block-size: var(--slotted-space-5);
      transform: translate(-50%, -50%);
      border: var(--slotted-border-width-medium) solid var(--_dot, var(--slotted-border-strong));
      border-radius: var(--slotted-radius-full);
      background: var(--_fill, var(--slotted-surface-raised));
    }
    [data-state='passed'] {
      --_line: var(--slotted-tone-success-solid);
      --_dot: var(--slotted-tone-success-solid);
      --_fill: var(--slotted-tone-success-solid);
    }
    [data-state='failed'] {
      --_dot: var(--slotted-tone-danger-solid);
      --_fill: var(--slotted-tone-danger-solid);
    }
    [data-state='ended'] {
      --_dot: var(--slotted-text);
      --_fill: var(--slotted-text);
    }
    [data-state='stopped'] > :not(.rail) {
      opacity: 0.5;
    }
    .body {
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }
    p {
      margin: 0;
    }
    .lead {
      font-weight: var(--slotted-font-weight-semibold);
    }
    .sub,
    .metric {
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
    }
    .metric {
      text-align: end;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .metric b {
      color: var(--slotted-text);
      font-size: var(--slotted-font-size-md);
      font-weight: var(--slotted-font-weight-semibold);
    }
    [data-tone='danger'] {
      color: var(--slotted-tone-danger-text);
    }
    .line {
      display: flex;
      padding-inline-start: calc(var(--d) * var(--_step));
      background: repeating-linear-gradient(to right, var(--slotted-border-strong) 0 1px, transparent 1px var(--_step)) var(--slotted-space-4) 0 / calc(var(--d) * var(--_step)) 100% no-repeat;
    }
    .kw {
      flex: none;
      inline-size: var(--_step);
      color: var(--slotted-text-muted);
      font-family: var(--slotted-font-family-mono);
      font-size: var(--slotted-font-size-sm);
    }
    .op {
      color: var(--slotted-text-muted);
    }
    .val {
      font-weight: var(--slotted-font-weight-semibold);
    }
    .gate {
      color: var(--slotted-tone-accent-text);
      font-weight: var(--slotted-font-weight-semibold);
    }
    .gate[data-op='or'] {
      color: var(--slotted-tone-warning-text);
    }
    .acts {
      grid-column: body / -1;
      display: grid;
      grid-template-columns: subgrid;
      row-gap: var(--slotted-space-6);
    }
    .act {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
    }
    .num {
      color: var(--slotted-text-muted);
      font-family: var(--slotted-font-family-mono);
    }
    /* Narrow, the label stands over its step and the end column under it. */
    @container (width < 36rem) {
      .sheet {
        --_step: 2rem;
        grid-template-columns: [rail] var(--slotted-space-8) [body] minmax(0, 1fr);
      }
      .label {
        grid-area: 1 / body;
        text-align: start;
        font-size: var(--slotted-font-size-sm);
      }
      .rail {
        grid-area: 1 / rail / 4;
      }
      .body,
      .acts {
        grid-area: 2 / body;
      }
      .acts,
      .act {
        grid-template-columns: minmax(0, 1fr);
      }
      .metric {
        grid-row: 3;
        text-align: start;
        white-space: normal;
      }
      .act .metric,
      .act .body {
        grid-area: auto;
      }
    }
  `,
  template: `
    @if (loading()) {
      <!-- The sheet's own anatomy while the workflow is read: the four labels and the rail, the words reserved. -->
      <ol class="sheet" aria-hidden="true">
        @for (step of steps; track step.label) {
          <li class="row">
            <span class="label">{{ step.label }}</span>
            <span class="rail"></span>
            <span class="body" slSkeletonText [lines]="step.lines" [lastLineSize]="step.last"></span>
          </li>
        }
      </ol>
    } @else {
    <ol class="sheet" data-testid="workflow-map" [attr.aria-label]="run() ? 'What the run did, step by step' : 'What the workflow does, step by step'">
      <li class="row" data-testid="map-trigger" [attr.data-state]="run() ? 'passed' : null">
        <span class="label">When</span>
        <span class="rail" aria-hidden="true"></span>
        <div class="body">
          <p class="lead">{{ triggerTitle() }}</p>
          <p class="sub">{{ triggerNote() }}</p>
        </div>
        @if (volume(); as data) {
          <p class="metric"><b>{{ count(data.events) }}</b> {{ data.events === 1 ? 'event' : 'events' }} in 14 days</p>
        }
      </li>

      <li class="row" data-testid="map-decision" [attr.data-state]="decisionState()">
        <span class="label">If</span>
        <span class="rail" aria-hidden="true"></span>
        <div class="body">
          @for (line of lines(); track $index) {
            <p class="line" [style.--d]="line.depth">
              <span class="kw">{{ line.join ?? '' }} </span>
              <span>
                @if (line.group; as group) {
                  <span class="gate" [attr.data-op]="group.operator">{{ group.operator === 'and' ? 'all' : 'any' }} of:</span>
                  @if (group.children.length === 0) {
                    <span class="op"> no condition yet</span>
                  }
                } @else if (line.condition; as condition) {
                  {{ field(condition) }}<span class="op"> {{ operator(condition) }} </span>
                  <span class="val">{{ value(condition) }}</span>
                }
              </span>
            </p>
          } @empty {
            <p class="line" style="--d: 0"><span class="op">No condition yet</span></p>
          }
        </div>
        @if (run(); as trace) {
          <p class="metric" [attr.data-tone]="trace.errorCode === 'WORKFLOW_RECURSION_LIMIT' ? 'danger' : null">{{ decisionWords() }}</p>
        } @else if (volume(); as data) {
          <p class="metric"><b>{{ count(data.matched) }}</b> of {{ count(data.events) }} events matched<br />{{ percent() }}</p>
        }
      </li>

      <li class="row" data-testid="map-actions" [attr.data-state]="actionsState()">
        <span class="label">Then</span>
        <span class="rail" aria-hidden="true"></span>
        <ol class="acts" aria-label="In order">
          @for (action of actionList(); track $index; let index = $index) {
            <li class="act" [attr.data-testid]="'map-action-' + index" [attr.data-tone]="actionTone(index)">
              <div class="body">
                <p><span class="num">{{ index + 1 }} </span> {{ words(action) }}</p>
                @if (result(index); as outcome) {
                  <p class="sub" [attr.data-tone]="outcome.status === 'failed' ? 'danger' : null">{{ outcomeWords(outcome) }}</p>
                  @if (outcome.errorCode) {
                    <p class="sub">{{ errorWords(outcome.errorCode) }}</p>
                  }
                }
              </div>
              @if (result(index); as outcome) {
                <p class="metric" [attr.data-tone]="outcome.status === 'failed' ? 'danger' : null">{{ resultWord(outcome) }}</p>
              } @else if (actionInsight(index); as stats) {
                <p class="metric" [attr.data-tone]="stats.failed > 0 ? 'danger' : null">{{ statsWords(stats) }}</p>
              }
            </li>
          } @empty {
            @if (removed().length === 0) {
              <li class="act"><p class="body sub">No action yet</p></li>
            }
          }
          @for (outcome of removed(); track outcome.actionIndex) {
            <li class="act" [attr.data-tone]="toneOf(outcome)">
              <div class="body">
                <p><span class="num">{{ outcome.actionIndex + 1 }} </span> An action since removed from the workflow</p>
                <p class="sub">{{ outcomeWords(outcome) }}</p>
              </div>
              <p class="metric">{{ resultWord(outcome) }}</p>
            </li>
          }
        </ol>
      </li>

      <li class="row" data-testid="map-sink" [attr.data-state]="sinkState()">
        <span class="label">Otherwise</span>
        <span class="rail" aria-hidden="true"></span>
        <div class="body">
          <p>Nothing changes</p>
          <p class="sub">The event leaves a skipped run in the history.</p>
        </div>
        @if (run()) {
          <p class="metric">{{ sinkState() === 'ended' ? 'This run ended here' : 'Not taken' }}</p>
        } @else if (volume(); as data) {
          <p class="metric"><b>{{ count(data.events - data.matched) }}</b> events skipped</p>
        }
      </li>
    </ol>
    }
  `,
})
export class RuleSheet {
  private readonly locale = injectLocale();

  readonly trigger = input<{ type: string; config?: Record<string, unknown> }>({ type: 'none' });
  readonly conditions = input<Group>({ type: 'group', operator: 'and', children: [] });
  readonly actionList = input<readonly WorkflowAction[]>([], { alias: 'actions' });
  readonly catalog = input<WorkflowCatalog | null>(null);
  readonly people = input<Readonly<Record<string, string>>>({});
  /** Fourteen days of what it did: the end column carries them. */
  readonly insight = input<WorkflowInsight | null>(null);
  /** One run: the sheet is its trace. */
  readonly run = input<WorkflowRunListItem | null>(null);
  /** The workflow is being read. */
  readonly loading = input(false);

  readonly steps = [
    { label: 'When', lines: 2, last: '45%' },
    { label: 'If', lines: 4, last: '55%' },
    { label: 'Then', lines: 2, last: '70%' },
    { label: 'Otherwise', lines: 2, last: '40%' },
  ];

  readonly definition = computed(() => this.catalog()?.triggers.find((trigger) => trigger.type === this.trigger().type));
  /** The insight, when there is anything in it to read. */
  readonly volume = computed(() => {
    const data = this.insight();
    return data && data.events > 0 && !this.run() ? data : null;
  });

  /** "When an order is confirmed" reads beside the label "When" as "An order is confirmed". */
  readonly triggerTitle = computed(() => {
    const words = triggerWords(this.definition(), this.trigger().config).replace(/^When\s+/, '');
    return words.charAt(0).toUpperCase() + words.slice(1);
  });
  readonly triggerNote = computed(() => {
    const run = this.run();
    if (run) return run.affectedLabel ? `This run: ${run.affectedLabel}` : 'This run: on its schedule';
    const affects = this.definition()?.affects;
    if (!affects) return 'Each run reads the tenant as a whole';
    const noun = affects === 'sales_order' ? 'order' : affects === 'support_ticket' ? 'ticket' : affects === 'sku' ? 'SKU at its warehouse' : affects;
    return `Each run is about the ${noun}`;
  });

  readonly lines = computed(() => {
    const lines: Line[] = [];
    const walk = (group: Group, depth: number) =>
      group.children.forEach((child, index) => {
        const join = index === 0 ? null : group.operator;
        if (child.type === 'group') {
          lines.push({ depth, join, group: child, condition: null });
          walk(child, depth + 1);
        } else {
          lines.push({ depth, join, group: null, condition: child });
        }
      });
    walk(this.conditions(), 0);
    return lines;
  });

  readonly percent = computed(() => {
    const data = this.volume();
    if (!data) return '';
    return new Intl.NumberFormat(this.locale(), { style: 'percent', maximumFractionDigits: 1 }).format(data.matched / data.events);
  });

  /** Whether the run got past the decision: its conditions matched and no chain limit stopped it. */
  readonly reached = computed(() => {
    const run = this.run();
    return run === null || (run.conditionsMet && run.errorCode !== 'WORKFLOW_RECURSION_LIMIT');
  });
  readonly decisionState = computed<State>(() => {
    const run = this.run();
    if (!run) return null;
    if (run.errorCode === 'WORKFLOW_RECURSION_LIMIT') return 'failed';
    return run.conditionsMet ? 'passed' : 'ended';
  });
  readonly decisionWords = computed(() => {
    const run = this.run();
    if (!run) return '';
    if (run.errorCode === 'WORKFLOW_RECURSION_LIMIT') return `Stopped: ${RUN_ERROR_WORDS.WORKFLOW_RECURSION_LIMIT.toLowerCase()}`;
    return run.conditionsMet ? 'Matched' : 'Did not match';
  });
  readonly actionsState = computed<State>(() => {
    const run = this.run();
    if (!run) return null;
    if (!this.reached()) return 'stopped';
    return run.actionResults.some((entry) => entry.status === 'failed') ? 'failed' : 'passed';
  });
  readonly sinkState = computed<State>(() => {
    const run = this.run();
    if (!run) return null;
    return !run.conditionsMet && run.errorCode !== 'WORKFLOW_RECURSION_LIMIT' ? 'ended' : 'stopped';
  });

  /** A run's results past the definition's end: actions the run did and the workflow has since lost. */
  readonly removed = computed(() => {
    const run = this.run();
    if (!run || !this.reached()) return [];
    return run.actionResults.filter((entry) => entry.actionIndex >= this.actionList().length);
  });

  private fieldOf(condition: Condition) {
    return this.definition()?.fields.find((field) => field.path === condition.field);
  }

  field(condition: Condition): string {
    return fieldWords(this.fieldOf(condition), condition.field || 'A field not chosen yet');
  }

  operator(condition: Condition): string {
    return operatorWords(condition.operator, this.fieldOf(condition));
  }

  value(condition: Condition): string {
    return valueWords(this.fieldOf(condition), condition.value, this.locale());
  }

  words(action: WorkflowAction): string {
    return actionWords(action, this.catalog(), this.people());
  }

  result(index: number): Outcome | null {
    const run = this.run();
    return run && this.reached() ? (run.actionResults.find((entry) => entry.actionIndex === index) ?? null) : null;
  }

  toneOf(outcome: Outcome): string {
    return outcome.status === 'succeeded' ? 'success' : outcome.status === 'failed' ? 'danger' : 'secondary';
  }

  actionTone(index: number): string | null {
    const outcome = this.result(index);
    return outcome ? this.toneOf(outcome) : null;
  }

  resultWord(outcome: Outcome): string {
    return outcome.status === 'succeeded' ? 'Done' : outcome.status === 'failed' ? 'Failed' : 'Not done';
  }

  outcomeWords(outcome: Outcome): string {
    const label = this.resultWord(outcome);
    return outcome.message ? `${label}: ${outcome.message}` : label;
  }

  errorWords(code: keyof typeof RUN_ERROR_WORDS): string {
    return RUN_ERROR_WORDS[code];
  }

  actionInsight(index: number): { succeeded: number; failed: number; skipped: number } | null {
    if (!this.volume()) return null;
    const entry = this.insight()?.actions.find((action) => action.actionIndex === index);
    if (!entry || entry.succeeded + entry.failed + entry.skipped === 0) return null;
    return entry;
  }

  statsWords(stats: { succeeded: number; failed: number; skipped: number }): string {
    const parts = [`${this.count(stats.succeeded)} done`];
    if (stats.failed > 0) parts.push(`${this.count(stats.failed)} failed`);
    if (stats.skipped > 0) parts.push(`${this.count(stats.skipped)} with nothing to do`);
    return parts.join(' · ');
  }

  count(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }
}
