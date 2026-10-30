import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { injectLocale } from '@slotted/angular/i18n';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderBack,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlTooltip, SlTooltipContent, SlTooltipLayer, SlTooltipTrigger } from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';
import { WORKFLOW_LIMITS, workflowIssues, type WorkflowRunListItem } from '@slotted/demo-nexora-backend';
import { map } from 'rxjs';

import { entityRoute } from '../../core/activity/entity-route';
import { definitionOf, WorkflowStore } from '../../core/automation/workflow.store';
import {
  AFFECTED_LABEL,
  durationWords,
  READERS,
  RUN_ERROR_WORDS,
  RUN_STATUS_LABEL,
  RUN_STATUS_TONE,
  runReason,
  runsRoute,
  STATUS_LABEL,
  STATUS_MEANING,
  STATUS_TONE,
  TRIGGER_LABEL,
  WORKFLOWS_ROUTE,
  WRITERS,
} from '../../core/automation/workflow.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import { ClockService } from '../../core/session/clock.service';
import { SessionStore } from '../../core/session/session.store';
import { ConfirmDialog } from '../inventory/confirm-dialog';
import { leaveForm } from '../inventory/leave-form';
import { ConflictPanel } from '../procurement/conflict-panel';
import { WorkflowDesigner } from './workflow-designer';
import { RunStrip } from './run-strip';
import { RuleSheet } from './rule-sheet';
import { RunFunnel } from './run-funnel';

type Confirming = 'activate' | 'archive' | 'save' | null;

/**
 * One workflow (§15): where it stands and what that means for the next event
 * (RP-06) — a workflow a run stopped says the failure that stopped it and
 * that an edit pauses it — its figures, its definition read as a sentence,
 * and its recent runs. A holder of `workflows.edit` writes the definition in
 * the section it is read in (FM-07), behind a query parameter the back
 * gesture closes (FM-12); a workflow that runs is told it runs before the
 * save. A reader without the permission reads the sentence and is told who
 * writes workflows (PM-02).
 */
@Component({
  selector: 'app-workflow-page',
  imports: [
    ConfirmDialog,
    ConflictPanel,
    NgIcon,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlForm,
    SlFormActions,
    SlIconButton,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderBack,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTag,
    SlTagBody,
    SlText,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
    RuleSheet,
    RunFunnel,
    RunStrip,
    WorkflowDesigner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .body {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
      container-type: inline-size;
    }
    .editing {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .preview {
      display: none;
    }
    /* With room for both, the edit's map stands beside the form and stays in view while it scrolls. */
    @container (width >= 64rem) {
      .editing {
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      }
      /* Stuck under the page's chrome, never behind it: the page publishes the stuck header's height. */
      .preview {
        display: grid;
        gap: var(--slotted-space-5);
        align-content: start;
        align-self: start;
        position: sticky;
        inset-block-start: calc(var(--slotted-page-sticky-top, 0px) + var(--slotted-space-6));
        max-block-size: calc(100dvh - var(--slotted-page-sticky-top, 0px) - 2 * var(--slotted-space-12));
        overflow: auto;
        overscroll-behavior: contain;
      }
    }
    .panel {
      display: grid;
      gap: var(--slotted-space-9);
      padding: var(--slotted-space-8) var(--slotted-space-9);
      border: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
      border-radius: var(--slotted-radius-lg);
      background: var(--slotted-surface-raised);
    }
    .vitals {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--slotted-space-6) var(--slotted-space-10);
      padding-block-end: var(--slotted-space-8);
      border-block-end: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    @container (width < 36rem) {
      .panel {
        padding: var(--slotted-space-7) var(--slotted-space-6);
      }
    }
    .quiet {
      margin: 0;
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
    }
    .beacon {
      display: flex;
      align-items: center;
      gap: var(--slotted-space-5);
      margin: 0;
      max-inline-size: 40ch;
      font-size: var(--slotted-font-size-sm);
      line-height: var(--slotted-line-height-sm);
    }
    .dot {
      flex: none;
      inline-size: var(--slotted-space-4);
      block-size: var(--slotted-space-4);
      border-radius: var(--slotted-radius-full);
      background: var(--slotted-border-strong);
      --_halo: var(--slotted-surface-sunken);
      box-shadow: 0 0 0 var(--slotted-space-2) var(--_halo);
    }
    [data-status='active'] .dot {
      background: var(--slotted-tone-success-solid);
      --_halo: var(--slotted-tone-success-surface);
      animation: beat var(--slotted-duration-loop-slow) var(--slotted-easing-standard) infinite;
    }
    [data-status='error'] .dot {
      background: var(--slotted-tone-danger-solid);
      --_halo: var(--slotted-tone-danger-surface);
    }
    @keyframes beat {
      50% {
        box-shadow: 0 0 0 var(--slotted-space-4) var(--_halo);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot {
        animation: none !important;
      }
    }
    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: var(--slotted-space-5) var(--slotted-space-10);
      margin: 0;
    }
    .facts dt {
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
    }
    .facts dd {
      margin: 0;
      font-size: var(--slotted-font-size-lg);
      line-height: var(--slotted-line-height-lg);
      font-weight: var(--slotted-font-weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    .facts small {
      margin-inline-start: var(--slotted-space-3);
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
      font-weight: var(--slotted-font-weight-regular);
    }
    .facts dd[data-tone='danger'] {
      color: var(--slotted-tone-danger-text);
    }
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* The page header cuts a heading at two lines, and below the compact size class a workflow's
       name takes both: the heading reserves them while it loads, so nothing under it moves. */
    @media (width < 600px) {
      [slPageHeaderHeading] {
        min-block-size: 2lh;
      }
    }
    /* On a finger a link in a table row is a touch target's height; the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav><a slPageHeaderBack [routerLink]="listRoute">Workflows</a></div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Workflow</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div slResultState [status]="error.code === 'NOT_FOUND' ? 'not-found' : 'error'" reach="section" data-testid="workflow-missing">
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ error.code === 'NOT_FOUND' ? 'This workflow does not exist' : 'The workflow could not be loaded' }}</h2>
              <p slResultStateDescription>
                {{ error.code === 'NOT_FOUND' ? 'It may have been written in another tenant, or the address is mistyped.' : 'Nothing was changed. Try again in a moment.' }}
              </p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute">Back to workflows</a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.workflow() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav><a slPageHeaderBack [routerLink]="listRoute">Workflows</a></div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                @if (workflow(); as w) {
                  <h1 slPageHeaderHeading data-testid="workflow-name">{{ w.name }}</h1>
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()" data-testid="workflow-status"><span slTagBody>{{ statusWord() }}</span></span>
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <h1 slPageHeaderHeading><span slSkeleton shape="text" inlineSize="60%"></span></h1>
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"><span slTagBody><span slSkeleton shape="text" inlineSize="3.5rem"></span></span></span
                  ></span>
                  <p slPageHeaderSubheading><span slSkeleton shape="text" inlineSize="50%"></span></p>
                }
              </div>
              @if (workflow()) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Workflow actions" overflow="menu">
                    @if (store.commands().includes('activate')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="activateItem">
                        <button
                          slButton
                          type="button"
                          data-testid="activate"
                          [loading]="store.busy() === 'activate'"
                          [messages]="{ loading: 'Activating' }"
                          (click)="confirming.set('activate')"
                        >
                          Activate
                        </button>
                      </div>
                    }
                    @if (store.commands().includes('pause')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="pauseItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="pause"
                          [loading]="store.busy() === 'pause'"
                          [messages]="{ loading: 'Pausing' }"
                          (click)="pause()"
                        >
                          Pause
                        </button>
                      </div>
                    }
                    <div slToolbarItem [slToolbarItemCounterpart]="historyItem">
                      <a slButtonLink variant="outline" tone="secondary" data-testid="history" [routerLink]="historyRoute()">Run history</a>
                    </div>
                    @if (store.commands().includes('archive')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="archiveItem">
                        <button slButton variant="outline" tone="danger" type="button" data-testid="archive" (click)="confirming.set('archive')">
                          Archive
                        </button>
                      </div>
                    }
                    <!-- The engine moves a workflow while the page is open (AF-07): the read keeps the values. -->
                    <div slToolbarItem [slToolbarItemCounterpart]="refreshItem">
                      <ng-container slTooltip openOn="hover" side="bottom">
                        <button
                          slIconButton
                          slTooltipTrigger
                          variant="ghost"
                          tone="secondary"
                          type="button"
                          aria-label="Refresh"
                          data-testid="refresh"
                          [loading]="store.loading()"
                          [messages]="{ loading: 'Refreshing' }"
                          (click)="store.load()"
                        >
                          <ng-icon name="lucideRefreshCw" />
                        </button>
                        <ng-template slTooltipLayer><div slTooltipContent>Refresh</div></ng-template>
                      </ng-container>
                    </div>
                    <sl-toolbar-overflow />
                  </div>
                </div>
              }
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              @if (!editing() || failure.kind !== 'validation') {
                <div slInlineMessage [tone]="tone(failure.kind)" data-testid="workflow-failure">
                  <span slInlineMessageIcon></span>
                  <span slStack [gap]="1">
                    <span slText size="sm">{{ failure.message }}</span>
                    @for (message of refusedMessages(); track message) {
                      <span slText size="sm">{{ message }}</span>
                    }
                    <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                  </span>
                </div>
              }
            }

            @if (workflow(); as w) {
              <!-- What the state waits on, above the flow (RP-06); the state itself is the header's tag and the canvas's beacon. -->
              @if ((w.status === 'error' && w.lastFailure) || (runBlockers().length > 0 && w.status !== 'active' && w.status !== 'archived') || writersNote()) {
                <div slStack [gap]="3" data-testid="where-it-stands">
                @if (w.status === 'error' && w.lastFailure; as failure) {
                  <div slInlineMessage tone="danger" data-testid="error-cause">
                    <span slInlineMessageIcon></span>
                    <span slStack [gap]="1">
                      <span slText size="sm">{{ errorCause() }}</span>
                      <span slText size="sm">
                        <a slLink [routerLink]="historyRoute()" [queryParams]="{ run: failure.runId }">Open the run that failed</a>
                      </span>
                    </span>
                  </div>
                }
                @if (runBlockers().length > 0 && w.status !== 'active' && w.status !== 'archived') {
                  <div slInlineMessage tone="warning" data-testid="run-blockers">
                    <span slInlineMessageIcon></span>
                    <span slStack [gap]="1">
                      <span slText size="sm">Before it can be activated:</span>
                      @for (message of runBlockers(); track message) {
                        <span slText size="sm">{{ message }}</span>
                      }
                    </span>
                  </div>
                }
                @if (writersNote(); as note) {
                  <span slText size="sm" tone="muted" data-testid="writers-note">{{ note }}</span>
                }
                </div>
              }

              <section slSection data-testid="activity">
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>How it runs</h2></div>
                </div>
                <div slSectionBody>
                  <div class="panel">
                    <div class="vitals" data-testid="vitals">
                      <p class="beacon" [attr.data-status]="w.status">
                        <span class="dot" aria-hidden="true"></span>
                        <span data-testid="status-meaning">{{ meaning() }}</span>
                      </p>
                      <dl class="facts">
                        <div>
                          <dt>Last run</dt>
                          <dd [title]="w.lastRunAt ? clock.formatDate(w.lastRunAt, dateTime) : ''">
                            {{ w.lastRunAt ? narrow(w.lastRunAt) : 'Never' }}
                            @if (w.lastRunAt) {
                              <small>{{ lastRunWords() }}</small>
                            }
                          </dd>
                        </div>
                        <div>
                          <dt>Runs</dt>
                          <dd data-testid="run-count">{{ count(w.runCount) }}</dd>
                        </div>
                        <div>
                          <dt>Failed, 7 days</dt>
                          <dd [attr.data-tone]="w.recentFailures > 0 ? 'danger' : null">{{ w.recentFailures }}</dd>
                        </div>
                      </dl>
                    </div>
                    @if (store.detail()?.insight; as insight) {
                      @if (insight.events > 0) {
                        <app-run-funnel [insight]="insight" />
                      } @else {
                        <p class="quiet">No event of its trigger in the last 14 days.</p>
                      }
                    }
                  </div>
                </div>
              </section>

              <section slSection data-testid="definition">
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>What it does</h2>
                    @if (editing() && w.status === 'active') {
                      <p slSectionDescription data-testid="active-warning">
                        This workflow is active: what you save is what it does on the next event, with no one in front of it.
                      </p>
                    }
                  </div>
                  @if (store.canEdit() && !editing()) {
                    <div slSectionActions>
                      <a slButtonLink size="sm" variant="outline" tone="secondary" data-testid="edit" [routerLink]="[]" [queryParams]="{ edit: 1 }">
                        Edit
                      </a>
                    </div>
                  }
                </div>
                <div slSectionBody>
                  @if (editing()) {
                    <form
                      slForm
                      data-testid="definition-form"
                      [messages]="{ summaryTitle: 'The workflow was not saved' }"
                      [errors]="formErrors()"
                      [loading]="store.busy() === 'save'"
                      (formSubmit)="requestSave($event)"
                    >
                      @if (store.conflict(); as fields) {
                        <app-conflict-panel
                          subject="workflow"
                          [fields]="fields"
                          [busy]="store.busy() === 'save'"
                          (mine)="keepMine()"
                          (theirs)="store.startOver()"
                        />
                      }
                      <div class="editing">
                        <app-workflow-designer
                          [draft]="store.draft"
                          [catalog]="store.catalog.catalog()"
                          [errors]="formErrors()"
                          [showIssues]="store.draft.attempted()"
                          [about]="true"
                        />
                        <!-- What the edit will do, drawn as it is written, beside the form where there is room. -->
                        <aside class="preview" aria-label="What the edited workflow will do" data-testid="preview">
                          <span slText size="sm" weight="medium">As it will run</span>
                          <app-rule-sheet
                            [trigger]="previewTrigger()"
                            [conditions]="$any(store.draft.definition().conditions)"
                            [actions]="store.draft.definition().actions"
                            [catalog]="store.catalog.catalog()"
                            [people]="store.detail()?.people ?? {}"
                          />
                        </aside>
                      </div>
                      <div slFormActions>
                        <button slButton variant="ghost" tone="secondary" type="button" data-testid="cancel-edit" (click)="cancelEdit()">
                          Cancel
                        </button>
                        <button
                          slButton
                          type="submit"
                          data-testid="save"
                          [loading]="store.busy() === 'save'"
                          [messages]="{ loading: 'Saving' }"
                        >
                          {{ w.status === 'error' ? 'Save and pause' : 'Save' }}
                        </button>
                      </div>
                    </form>
                  } @else {
                    <div class="panel">
                      <app-rule-sheet
                        [trigger]="w.trigger"
                        [conditions]="$any(w.conditions)"
                        [actions]="w.actions"
                        [catalog]="store.catalog.catalog()"
                        [people]="store.detail()?.people ?? {}"
                        [insight]="store.detail()?.insight ?? null"
                      />
                    </div>
                  }
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Details</h2></div>
                </div>
                <div slSectionBody>
                  <div slDescriptionList variant="ruled" [columns]="phone() ? 1 : 2" data-testid="details">
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Owner</dt>
                      <dd slDescriptionListDescription>{{ w.ownerName }} — told when a run stops it</dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Trigger</dt>
                      <dd slDescriptionListDescription>{{ triggerName() }}</dd>
                    </div>
                    <div slDescriptionListItem [span]="phone() ? 1 : 2">
                      <dt slDescriptionListTerm>Description</dt>
                      <dd slDescriptionListDescription [empty]="!w.description" placeholder="None">{{ w.description }}</dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Written</dt>
                      <dd slDescriptionListDescription>{{ person(w.metadata.createdBy) }} · {{ clock.formatDate(w.metadata.createdAt) }}</dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Last changed</dt>
                      <dd slDescriptionListDescription>{{ person(w.metadata.updatedBy) }} · {{ clock.relative(w.metadata.updatedAt) }}</dd>
                    </div>
                  </div>
                </div>
              </section>

              <section slSection data-testid="recent-runs">
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Recent runs</h2>
                    <p slSectionDescription>{{ recentWords() }}</p>
                  </div>
                  @if ((store.detail()?.runTotal ?? 0) > 0) {
                    <div slSectionActions>
                      <a slButtonLink size="sm" variant="ghost" tone="secondary" [routerLink]="historyRoute()">Run history</a>
                    </div>
                  }
                </div>
                <div slSectionBody>
                  @if (store.detail()?.insight; as insight) {
                    @if (insight.events > 0) {
                      <app-run-strip [days]="insight.days" (pick)="openDay($event)" />
                    }
                  }
                  @if (runs().length === 0) {
                    <span slText size="sm" tone="muted" data-testid="no-runs">{{ noRunWords() }}</span>
                  } @else {
                    <div slTable variant="framed" [columns]="phone() ? 2 : 4" [layout]="phone() ? 'fixed' : 'auto'">
                      <div slTableContent>
                        <caption slTableCaption>{{ runs().length === 1 ? 'The run' : 'The ' + runs().length + ' newest runs' }}</caption>
                        <thead slTableHead>
                          <tr slTableRow>
                            <th slTableColumnHeader>Started</th>
                            <th slTableColumnHeader>Status</th>
                            @if (!phone()) {
                              <th slTableColumnHeader>About</th>
                              <th slTableColumnHeader>What happened</th>
                            }
                          </tr>
                        </thead>
                        <tbody slTableBody>
                          @for (run of runs(); track run.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a slLink class="cell-text" [routerLink]="historyRoute()" [queryParams]="{ run: run.id }" [title]="clock.formatDate(run.startedAt, dateTime)">
                                  {{ clock.relative(run.startedAt) }}
                                </a>
                              </th>
                              <td slTableCell>
                                <span slTag size="sm" [tone]="runTone(run)"><span slTagBody>{{ runWord(run) }}</span></span>
                              </td>
                              @if (!phone()) {
                                <td slTableCell>
                                  @if (affectedRoute(run); as route) {
                                    <a slLink class="cell-text" [routerLink]="route" [title]="affected(run)">{{ affected(run) }}</a>
                                  } @else {
                                    <span class="cell-text" [title]="affected(run)">{{ affected(run) }}</span>
                                  }
                                </td>
                                <td slTableCell>
                                  <span class="cell-text" [title]="reason(run)">{{ reason(run) }}</span>
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </div>
                    </div>
                  }
                </div>
              </section>
            } @else {
              <!-- The two panels' anatomy while the workflow is read: their labels are chrome, their values reserved. -->
              <div slSkeletonRegion [messages]="{ label: 'Reading the workflow' }" [loading]="true">
                <div slStack [gap]="6">
                  <section slSection data-testid="activity">
                    <div slSectionHeader><div slSectionTitle><h2 slSectionHeading>How it runs</h2></div></div>
                    <div slSectionBody>
                      <div class="panel">
                        <div class="vitals">
                          <p class="beacon">
                            <span class="dot" aria-hidden="true"></span>
                            <span slSkeleton shape="text" inlineSize="18rem"></span>
                          </p>
                          <dl class="facts">
                            @for (figure of figureLabels; track figure) {
                              <div>
                                <dt>{{ figure }}</dt>
                                <dd><span slSkeleton shape="text" inlineSize="4rem"></span></dd>
                              </div>
                            }
                          </dl>
                        </div>
                        <span slSkeleton shape="block" inlineSize="100%" blockSize="13rem"></span>
                      </div>
                    </div>
                  </section>
                  <section slSection data-testid="definition">
                    <div slSectionHeader><div slSectionTitle><h2 slSectionHeading>What it does</h2></div></div>
                    <div slSectionBody>
                      <div class="panel"><app-rule-sheet [loading]="true" /></div>
                    </div>
                  </section>
                </div>
              </div>
            }
          </div>
        </div>

        <ng-template #activateItem>
          <button slMenuItem type="button" (select)="confirming.set('activate')">Activate</button>
        </ng-template>
        <ng-template #pauseItem>
          <button slMenuItem type="button" (select)="pause()">Pause</button>
        </ng-template>
        <ng-template #historyItem>
          <a slMenuItem [routerLink]="historyRoute()">Run history</a>
        </ng-template>
        <ng-template #archiveItem>
          <button slMenuItem type="button" tone="danger" (select)="confirming.set('archive')">Archive</button>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (select)="store.load()">Refresh</button>
        </ng-template>

        <app-confirm-dialog
          [open]="confirming() === 'activate'"
          (openChange)="closeConfirm($event)"
          title="Activate this workflow"
          [description]="activateWords()"
          confirmLabel="Activate"
          keepLabel="Not now"
          tone="accent"
          [busy]="store.busy() === 'activate'"
          (confirm)="activate()"
        />
        <app-confirm-dialog
          [open]="confirming() === 'archive'"
          (openChange)="closeConfirm($event)"
          title="Archive this workflow"
          description="An archived workflow never runs again, and it cannot be restored: a new one is written instead. Its runs stay in its history."
          confirmLabel="Archive"
          keepLabel="Keep it"
          [busy]="store.busy() === 'archive'"
          (confirm)="archive()"
        />
        <app-confirm-dialog
          [open]="confirming() === 'save'"
          (openChange)="closeConfirm($event)"
          title="Change an active workflow"
          [description]="saveWords()"
          confirmLabel="Save"
          keepLabel="Keep editing"
          tone="accent"
          [busy]="store.busy() === 'save'"
          (confirm)="save()"
        />
      </div>
    }
  `,
})
export class WorkflowPage {
  readonly store = inject(WorkflowStore);
  readonly clock = inject(ClockService);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);
  private readonly locale = injectLocale();

  readonly listRoute = WORKFLOWS_ROUTE;
  readonly phone = phoneSignal();
  readonly limits = WORKFLOW_LIMITS;
  readonly figureLabels = ['Last run', 'Runs', 'Failed, 7 days'];
  readonly dateTime: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
  readonly confirming = signal<Confirming>(null);

  readonly workflow = this.store.workflow;

  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  /** The editor is a query parameter, so the back gesture closes it and stays on the workflow (FM-12). */
  readonly editing = computed(() => this.queryParams().get('edit') === '1' && this.store.canEdit());

  readonly historyRoute = computed(() => runsRoute(this.id() ?? ''));
  readonly statusWord = computed(() => (this.workflow() ? STATUS_LABEL[this.workflow()!.status] : ''));
  readonly statusTone = computed(() => (this.workflow() ? STATUS_TONE[this.workflow()!.status] : 'secondary'));
  readonly triggerName = computed(() => {
    const workflow = this.workflow();
    return workflow ? TRIGGER_LABEL[workflow.trigger.type] : '';
  });
  readonly subheading = computed(() => {
    const workflow = this.workflow();
    if (!workflow) return '';
    return `${this.triggerName()} · ${workflow.ownerName} · ${workflow.id}`;
  });
  readonly meaning = computed(() => {
    const workflow = this.workflow();
    return workflow ? STATUS_MEANING[workflow.status] : '';
  });

  /** The run that put the workflow in error, said once: what failed, on which record. */
  readonly errorCause = computed(() => {
    const failure = this.workflow()?.lastFailure;
    if (!failure) return '';
    const code = failure.errorCode ? RUN_ERROR_WORDS[failure.errorCode] : 'A run failed';
    const action = failure.actionIndex !== undefined ? ` Action ${failure.actionIndex + 1}` : '';
    return `${code}, ${this.clock.relative(failure.startedAt)}.${action}${failure.message ? `: ${failure.message}.` : ''} Editing the workflow pauses it; it runs again once activated.`;
  });

  /** What activation would refuse, read from the stored definition with the backend's own check. */
  readonly runBlockers = computed(() => {
    const workflow = this.workflow();
    const catalog = this.store.catalog.catalog();
    if (!workflow || !catalog) return [];
    const definition = definitionOf(workflow);
    return workflowIssues(
      { name: definition.name, trigger: definition.trigger, conditions: definition.conditions, actions: definition.actions },
      catalog,
      'run',
    ).map((issue) => issue.message);
  });

  readonly writersNote = computed(() => {
    void this.session.session();
    if (this.session.can('workflows.edit')) return '';
    return `Workflows are written, activated and archived by ${WRITERS}; ${READERS} read them.`;
  });

  readonly runs = computed(() => this.store.detail()?.runs ?? []);
  readonly recentWords = computed(() => {
    const total = this.store.detail()?.runTotal ?? 0;
    if (total === 0) return 'Every event of its trigger leaves a run here, including the ones its conditions skip.';
    return total === 1 ? 'Its one run.' : `The newest of ${this.count(total)} runs.`;
  });
  readonly noRunWords = computed(() => {
    const status = this.workflow()?.status;
    return status === 'active' ? 'It has not run yet: its first run comes with the next event of its trigger.' : 'It has never run.';
  });
  readonly lastRunWords = computed(() => {
    const run = this.runs()[0];
    return run ? RUN_STATUS_LABEL[run.status].toLowerCase() : 'no run yet';
  });

  readonly activateWords = computed(() => {
    const workflow = this.workflow();
    if (!workflow) return '';
    return `From now on it runs on every event of “${TRIGGER_LABEL[workflow.trigger.type]}”, with no one in front of it, and does what it says under What it does.`;
  });
  readonly saveWords = computed(
    () => 'The workflow keeps running: the next event of its trigger runs the definition you save, not the one it has now.',
  );

  /** One map for the form's summary and every field (FM-03): the platform's check, then the backend's answer. */
  readonly formErrors = computed(() => {
    const draft = this.store.draft;
    const status = this.workflow()?.status;
    const issues = status === 'active' ? draft.runIssues() : draft.saveIssues();
    const own: Record<string, readonly string[]> = draft.attempted() ? { ...issues.fields } : {};
    if (draft.attempted() && issues.nodes.size > 0) own['conditions'] = [...new Set([...issues.nodes.values()].flat())];
    return { ...own, ...this.store.refused() };
  });

  readonly refusedMessages = computed(() => Object.values(this.store.refused()).flat());

  constructor() {
    let opened: string | null = null;
    effect(() => {
      const id = this.id();
      if (id === null || id === opened) return;
      opened = id;
      untracked(() => void this.store.open(id));
    });
    // The editor opens on the stored definition, once the workflow is read.
    effect(() => {
      if (!this.editing() || this.workflow() === null) return;
      untracked(() => this.store.startEdit());
    });
    // A persona, a scenario or a day moved: the workflow reads again.
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) void this.store.open(this.id() ?? '');
        tenant = key;
      });
    });
  }

  /** "4 min ago": a figure's value stays one line in a phone's half-width card. */
  narrow(instant: string): string {
    const diff = Date.parse(instant) - Date.parse(this.clock.now());
    const format = new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto', style: 'narrow' });
    const minutes = Math.round(diff / 60_000);
    if (Math.abs(minutes) < 60) return format.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return format.format(hours, 'hour');
    return format.format(Math.round(hours / 24), 'day');
  }

  /** The draft's trigger as the map reads it: nothing chosen yet reads as an unknown event. */
  readonly previewTrigger = computed(() => {
    const trigger = this.store.draft.definition().trigger;
    return { type: trigger.type || 'none', config: trigger.config };
  });

  /** A day of the strip opens the history on that day. */
  openDay(date: string | null): void {
    void this.router.navigate([this.historyRoute()], { queryParams: date ? { day: date } : {} });
  }

  count(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }

  person(id: string): string {
    if (id === 'usr_system_automation') return 'Workflow Automation';
    return this.store.detail()?.people[id] ?? this.store.catalog.catalog()?.people.find((person) => person.id === id)?.name ?? 'Someone no longer active';
  }

  runWord(run: WorkflowRunListItem): string {
    return RUN_STATUS_LABEL[run.status];
  }

  runTone(run: WorkflowRunListItem) {
    return RUN_STATUS_TONE[run.status];
  }

  reason(run: WorkflowRunListItem): string {
    return `${runReason(run)} · ${durationWords(run.durationMs, this.locale())}`;
  }

  affected(run: WorkflowRunListItem): string {
    if (!run.affectedEntityType) return 'The tenant, on its schedule';
    return `${AFFECTED_LABEL[run.affectedEntityType] ?? run.affectedEntityType} ${run.affectedLabel ?? ''}`.trim();
  }

  affectedRoute(run: WorkflowRunListItem): string | null {
    return entityRoute(run.affectedEntityType, run.affectedEntityId);
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  closeConfirm(open: boolean): void {
    if (!open) this.confirming.set(null);
  }

  async activate(): Promise<void> {
    const ok = await this.store.activate();
    this.confirming.set(null);
    if (ok) this.toasts.show({ title: 'Workflow activated', description: 'It runs on the next event of its trigger.', tone: 'success' });
  }

  async pause(): Promise<void> {
    if (await this.store.pause()) this.toasts.show({ title: 'Workflow paused', description: 'It does not run until it is activated again.', tone: 'success' });
  }

  async archive(): Promise<void> {
    const ok = await this.store.archive();
    this.confirming.set(null);
    if (ok) this.toasts.show({ title: 'Workflow archived', tone: 'success' });
  }

  /** A workflow that runs is asked about before the save; a stopped one saves at once. */
  requestSave(event: { pending: (work: Promise<void>) => void }): void {
    if (this.workflow()?.status === 'active') {
      const issues = this.store.draft.runIssues();
      this.store.draft.attempted.set(true);
      if (issues.all.length === 0) this.confirming.set('save');
      return;
    }
    event.pending(this.save());
  }

  async save(): Promise<void> {
    const status = this.workflow()?.status;
    const ok = await this.store.save();
    this.confirming.set(null);
    if (!ok) return;
    this.toasts.show({
      title: status === 'error' ? 'Saved and paused' : 'Workflow saved',
      description: status === 'error' ? 'Activate it to run it again.' : undefined,
      tone: 'success',
    });
    leaveForm(this.router, this.route, this.location, {});
  }

  async keepMine(): Promise<void> {
    if (this.workflow()?.status === 'active') {
      this.store.conflict.set(null);
      this.confirming.set('save');
      return;
    }
    if (await this.store.keepMine()) leaveForm(this.router, this.route, this.location, {});
  }

  cancelEdit(): void {
    this.store.discardEdit();
    leaveForm(this.router, this.route, this.location, {});
  }
}
