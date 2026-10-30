import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridEmptyTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerTitle,
} from '@slotted/angular/drawer';
import { SlFilterBar, type FilterBarField, type FilterBarPreset } from '@slotted/angular/filter-bar';
import { injectLocale } from '@slotted/angular/i18n';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderNav,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlTooltip, SlTooltipContent, SlTooltipLayer, SlTooltipTrigger } from '@slotted/angular/tooltip';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize, type GridColumn } from '@slotted/core/grid';
import type { WorkflowRunListItem, WorkflowRunStatus } from '@slotted/demo-nexora-backend';
import { map } from 'rxjs';

import { entityRoute } from '../../core/activity/entity-route';
import { NEXORA_BACKEND } from '../../core/backend/nexora-backend.provider';
import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { TransportHealth } from '../../core/backend/transport-health';
import { options } from '../../core/catalog/catalog.model';
import { WorkflowRunsStore } from '../../core/automation/workflow-runs.store';
import { WorkflowStore } from '../../core/automation/workflow.store';
import {
  AFFECTED_LABEL,
  durationWords,
  RUN_STATUS_LABEL,
  RUN_STATUS_TONE,
  runCause,
  runReason,
  TRIGGER_LABEL,
  workflowRoute,
} from '../../core/automation/workflow.model';
import { phoneSignal } from '../../core/layout/phone';
import { ClockService } from '../../core/session/clock.service';
import { SessionStore } from '../../core/session/session.store';
import { leaveForm } from '../inventory/leave-form';
import { RunResults } from './run-results';
import { RunStrip } from './run-strip';

const statusTree = (statuses: readonly WorkflowRunStatus[]): FilterGroup => ({
  join: 'and',
  rules: [{ field: 'status', filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: [...statuses] }] } }],
});

const VIEWS: readonly FilterBarPreset[] = [
  { key: 'failed', label: 'Failed', value: statusTree(['failed', 'partially_failed']) },
  { key: 'succeeded', label: 'Succeeded', value: statusTree(['succeeded']) },
  { key: 'skipped', label: 'Skipped', value: statusTree(['skipped']) },
];

const FIELDS: readonly FilterBarField[] = [
  { key: 'status', label: 'Status', kind: 'set', options: options(RUN_STATUS_LABEL), pinned: true, operators: ['anyOf'] },
  {
    key: 'affectedEntityType',
    label: 'About',
    kind: 'set',
    options: options(AFFECTED_LABEL),
    operators: ['anyOf'],
  },
  { key: 'conditionsMet', label: 'Conditions met', kind: 'boolean', operators: ['is'] },
  { key: 'startedOn', label: 'Started on', kind: 'date', operators: ['is', 'after', 'before', 'between'] },
];

/** The filter with its day replaced: a rule on one business date, or none. */
const onDay = (filter: FilterGroup | null, day: string | null): FilterGroup | null => {
  const rules = (filter?.rules ?? []).filter((rule) => !('field' in rule && rule.field === 'startedOn'));
  if (day !== null)
    rules.push({ field: 'startedOn', filter: { kind: 'date', join: 'and', conditions: [{ operator: 'is', value: day }] } });
  return rules.length === 0 ? null : { join: filter?.join ?? 'and', rules };
};

/** The one day the filter holds, when its only rule on the start is "is" that day. */
const dayOf = (filter: FilterGroup | null): string | null => {
  const rules = (filter?.rules ?? []).filter((rule) => 'field' in rule && rule.field === 'startedOn');
  if (rules.length !== 1) return null;
  const rule = rules[0] as { filter: { conditions: readonly { operator: string; value?: unknown }[] } };
  const conditions = rule.filter.conditions;
  return conditions.length === 1 && conditions[0].operator === 'is' && typeof conditions[0].value === 'string'
    ? conditions[0].value
    : null;
};

/**
 * The Execution History of §15: one workflow's runs — state in words, start,
 * duration, the record each was about at its own address, and why it did
 * what it did. A run opens action by action in a drawer that is the address's
 * `run` parameter, so the back gesture closes it; on a phone the drawer is a
 * sheet from the bottom. The history's placeholders are the grid's own rows.
 */
@Component({
  selector: 'app-workflow-runs-page',
  imports: [
    NgIcon,
    RouterLink,
    RunResults,
    RunStrip,
    SlButton,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridEmptyTemplate,
    SlDataGridFooter,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerTitle,
    SlFilterBar,
    SlIconButton,
    SlLink,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderBack,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPagination,
    SlPaginationNext,
    SlPaginationPageSize,
    SlPaginationPrevious,
    SlPaginationStatus,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeletonText,
    SlTag,
    SlTagBody,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .listing {
      display: flex;
      flex-direction: column;
      gap: var(--slotted-space-4);
      min-block-size: 0;
      block-size: 100%;
    }
    sl-data-grid {
      flex: 1 1 0;
      min-block-size: 0;
    }
    @media (width < 600px) {
      sl-data-grid {
        flex-basis: auto;
      }
    }
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* On a finger a link in a row is a touch target's height; the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack data-testid="back-to-workflow" [routerLink]="workflowLink()">{{ workflowName() }}</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>Run history</h1>
              <p slPageHeaderSubheading>{{ subheading() }}</p>
            </div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="History actions" overflow="menu">
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
                      [loading]="runs.loading()"
                      [messages]="{ loading: 'Refreshing' }"
                      (click)="refresh()"
                    >
                      <ng-icon name="lucideRefreshCw" />
                    </button>
                    <ng-template slTooltipLayer><div slTooltipContent>Refresh</div></ng-template>
                  </ng-container>
                </div>
                <sl-toolbar-overflow />
              </div>
            </div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              Every event of its trigger leaves one run, the ones its conditions skip included. Times follow the demo clock.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          @if (workflow.detail()?.insight; as insight) {
            @if (insight.events > 0) {
              <app-run-strip [days]="insight.days" [selected]="day()" (pick)="pickDay($event)" />
            }
          }
          <div
            slFilterBar
            aria-label="Run filters"
            [fields]="fields"
            [presets]="views"
            [preset]="preset()"
            (presetChangeRequest)="preset.set($event.value)"
            [value]="runs.filter()"
            (valueChangeRequest)="setFilter($event.value)"
            [query]="runs.search()"
            (queryChangeRequest)="runs.setSearch($event.value)"
            [messages]="countMessages"
            [count]="runs.total() ?? undefined"
            [total]="runs.total() === runs.grandTotal() ? undefined : (runs.grandTotal() ?? undefined)"
            [loading]="runs.loading()"
          ></div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Runs"
            rowKey="id"
            variant="framed"
            activatable
            data-testid="runs"
            [rows]="runs.rows()"
            [columns]="columns()"
            [totalCount]="runs.total() ?? 0"
            [loading]="runs.loading()"
            [error]="runs.error()"
            [query]="runs.query()"
            (queryChangeRequest)="runs.load($event.value)"
            [showRange]="false"
            (retry)="runs.reload()"
            (activate)="openRun($event.key)"
          >
            <ng-template slDataGridCell="startedAt" let-row="row">
              <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="[]" [queryParams]="{ run: row.id }" [title]="exact(row.startedAt)">
                {{ clock.relative(row.startedAt) }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slTag size="sm" [tone]="tone(row)"><span slTagBody>{{ word(row) }}</span></span>
            </ng-template>
            <ng-template slDataGridCell="affectedLabel" let-row="row">
              @if (affectedRoute(row); as route) {
                <a slLink class="cell-text" [routerLink]="route" [title]="affected(row)">{{ affected(row) }}</a>
              } @else {
                <span class="cell-text" [title]="affected(row)">{{ affected(row) }}</span>
              }
            </ng-template>
            <ng-template slDataGridEmpty let-status>
              @if (status === 'error') {
                <div slResultState status="error" reach="section">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>The runs did not arrive</h2>
                    <p slResultStateDescription>Nothing was changed. Try again in a moment.</p>
                  </div>
                  <div slResultStateActions><button slButton size="sm" type="button" (click)="runs.reload()">Try again</button></div>
                </div>
              } @else if (status === 'no-results') {
                <div slResultState status="no-results" reach="section">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>No run matches these filters</h2>
                    <p slResultStateDescription>Choose another view, or remove a filter to see more runs.</p>
                  </div>
                  <div slResultStateActions>
                    <button slButton size="sm" variant="outline" tone="secondary" type="button" (click)="clearFilters()">Clear filters</button>
                  </div>
                </div>
              } @else {
                <div slResultState status="empty" reach="section" data-testid="runs-empty">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>No run yet</h2>
                    <p slResultStateDescription>{{ emptyWords() }}</p>
                  </div>
                </div>
              }
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Run pages"
              [messages]="pagerMessages"
              [count]="runs.total() ?? 0"
              [page]="runs.page().index + 1"
              [pageSize]="runs.page().size"
              [pageSizeOptions]="pageSizes"
              [loading]="runs.loading()"
              (pageChange)="goTo($event.value)"
              (pageSizeChange)="resize($event.value)"
            >
              @if (!phone()) {
                <sl-pagination-page-size></sl-pagination-page-size>
              }
              <p slPaginationStatus></p>
              <button slPaginationPrevious type="button"></button>
              <button slPaginationNext type="button"></button>
            </nav>
          </sl-data-grid>
        </div>
      </div>
      <ng-template #refreshItem>
        <button slMenuItem type="button" (select)="refresh()">Refresh</button>
      </ng-template>

      <sl-drawer
        [open]="runId() !== null"
        (openChangeRequest)="drawerChange($event.value, $event.reason)"
        [side]="phone() ? 'bottom' : 'end'"
        [size]="phone() ? 'content' : 'md'"
        back="none"
        data-testid="run-drawer"
      >
        <header slDrawerHeader>
          <h2 slDrawerTitle>{{ openRunTitle() }}</h2>
          <p slDrawerDescription>{{ openRunCause() }}</p>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          @if (openRunItem(); as run) {
            <app-run-results
              [run]="run"
              [trigger]="workflow.workflow()?.trigger ?? { type: 'none' }"
              [conditions]="$any(workflow.workflow()?.conditions ?? { type: 'group', operator: 'and', children: [] })"
              [actions]="workflow.workflow()?.actions ?? []"
              [catalog]="workflow.catalog.catalog()"
              [people]="workflow.detail()?.people ?? {}"
              [relative]="relativeFn"
              [exact]="exactFn"
            />
          } @else if (runMissing()) {
            <span>This run is not in this workflow's history.</span>
          } @else {
            <span slSkeletonText [lines]="6" lastLineSize="60%"></span>
          }
        </div>
      </sl-drawer>
    </div>
  `,
})
export class WorkflowRunsPage {
  readonly runs = inject(WorkflowRunsStore);
  readonly workflow = inject(WorkflowStore);
  readonly clock = inject(ClockService);
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly locale = injectLocale();

  readonly phone = phoneSignal();
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly fields = FIELDS;
  readonly views = VIEWS;
  readonly preset = signal<string | null>(null);
  readonly countMessages = {
    count: '{count} of {total, plural, one {# run} other {# runs}}',
    countOnly: '{count, plural, one {# run} other {# runs}}',
    preset: 'Runs by outcome',
    presetNone: 'Every outcome',
  };
  readonly pagerMessages = { range: 'Runs {start}–{end} of {count}', pageSize: 'Runs per page' };

  readonly relativeFn = (instant: string) => this.clock.relative(instant);
  readonly exactFn = (instant: string) => this.exact(instant);

  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });
  readonly runId = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('run'))), {
    initialValue: this.route.snapshot.queryParamMap.get('run'),
  });

  /** A run opened from a link and not on the page on screen is read on its own. */
  private readonly fetched = signal<WorkflowRunListItem | null>(null);
  readonly runMissing = signal(false);

  readonly workflowLink = computed(() => workflowRoute(this.id() ?? ''));
  readonly workflowName = computed(() => this.workflow.workflow()?.name ?? 'Workflow');
  readonly subheading = computed(() => {
    const workflow = this.workflow.workflow();
    return workflow ? `${workflow.name} · ${TRIGGER_LABEL[workflow.trigger.type]}` : 'Reading the workflow';
  });
  readonly emptyWords = computed(() => {
    const workflow = this.workflow.workflow();
    if (!workflow) return 'Every event of the trigger leaves a run here.';
    return workflow.status === 'active'
      ? `It runs on the next event of “${TRIGGER_LABEL[workflow.trigger.type]}”, and the run lands here.`
      : 'It has never run. It runs once it is activated, on the next event of its trigger.';
  });

  readonly columns = computed<readonly GridColumn<WorkflowRunListItem>[]>(() => {
    void this.session.session();
    const locale = this.locale();
    return [
      { id: 'startedAt', label: 'Started', kind: 'date', rowHeader: true, width: 150, hideable: false },
      { id: 'status', label: 'Status', kind: 'set', options: options(RUN_STATUS_LABEL), width: 132, priority: 1 },
      { id: 'affectedLabel', label: 'About', width: 220, priority: 2, sortable: false, filterable: false },
      {
        id: 'reason',
        label: 'What happened',
        width: 360,
        priority: 3,
        sortable: false,
        filterable: false,
        accessor: (row) => runReason(row),
      },
      {
        id: 'durationMs',
        label: 'Took',
        kind: 'number',
        align: 'end',
        width: 96,
        priority: 4,
        format: (_value, row) => durationWords(row.durationMs, locale),
      },
      {
        id: 'causedBy',
        label: 'Why it ran',
        width: 220,
        priority: 5,
        sortable: false,
        filterable: false,
        accessor: (row) => runCause(row),
      },
    ];
  });

  /** The day the strip shows as chosen: the filter's, while it is one day and nothing else on the start. */
  readonly day = computed(() => dayOf(this.runs.filter()));

  readonly openRunItem = computed(() => {
    const id = this.runId();
    if (id === null) return null;
    return this.runs.rows().find((run) => run.id === id) ?? (this.fetched()?.id === id ? this.fetched() : null);
  });
  readonly openRunTitle = computed(() => {
    const run = this.openRunItem();
    return run ? `Run of ${this.exact(run.startedAt)}` : 'Run';
  });
  /** The drawer names the workflow; the run's state and cause are said once, in its body (CP-06). */
  readonly openRunCause = computed(() => this.workflow.workflow()?.name ?? '');

  constructor() {
    let opened: string | null = null;
    effect(() => {
      const id = this.id();
      if (id === null || id === opened) return;
      opened = id;
      untracked(() => {
        this.runs.place(id);
        this.preset.set(null);
        void this.workflow.open(id);
        // A day named by the address — the record's strip links here with one — opens the history on it.
        const day = this.route.snapshot.queryParamMap.get('day');
        void this.runs.open({ ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }), filter: day ? onDay(null, day) : null });
      });
    });
    effect(() => {
      const runId = this.runId();
      const id = this.id();
      if (runId === null || id === null) return;
      untracked(() => {
        if (this.runs.rows().some((run) => run.id === runId) || this.fetched()?.id === runId) return;
        void this.fetch(id, runId);
      });
    });
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) this.refresh();
        tenant = key;
      });
    });
  }

  private async fetch(workflowId: string, runId: string): Promise<void> {
    this.runMissing.set(false);
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () => api.workflows.runs(workflowId, { pageSize: 25, filter: { id: { eq: runId } } }),
      null,
    );
    if (answer === null) return;
    const run = answer.data[0] ?? null;
    this.fetched.set(run);
    this.runMissing.set(run === null);
  }

  refresh(): void {
    void this.workflow.load();
    void this.runs.reload();
  }

  exact(instant: string): string {
    return this.clock.formatDate(instant, { dateStyle: 'medium', timeStyle: 'short' });
  }

  word(run: WorkflowRunListItem): string {
    return RUN_STATUS_LABEL[run.status];
  }

  tone(run: WorkflowRunListItem) {
    return RUN_STATUS_TONE[run.status];
  }

  affected(run: WorkflowRunListItem): string {
    if (!run.affectedEntityType) return 'The tenant, on its schedule';
    return `${AFFECTED_LABEL[run.affectedEntityType] ?? run.affectedEntityType} ${run.affectedLabel ?? ''}`.trim();
  }

  affectedRoute(run: WorkflowRunListItem): string | null {
    return entityRoute(run.affectedEntityType, run.affectedEntityId);
  }

  setFilter(filter: FilterGroup | null): void {
    const tree = filter === null ? null : JSON.stringify(filter);
    this.preset.set(this.views.find((view) => JSON.stringify(view.value) === tree)?.key ?? null);
    this.keepDay(dayOf(filter));
    void this.runs.setFilter(filter);
  }

  /** A day of the strip narrows the history to it, beside the filter's other rules; the same day again lets it go. */
  pickDay(day: string | null): void {
    this.setFilter(onDay(this.runs.filter(), day === this.day() ? null : day));
  }

  clearFilters(): void {
    this.preset.set(null);
    this.keepDay(null);
    void this.runs.load({ ...this.runs.query(), filter: null, search: '', page: { index: 0, size: this.runs.page().size } });
  }

  /** The address keeps the day the history is narrowed to, so a reload and a shared link open on it. */
  private keepDay(day: string | null): void {
    if (this.route.snapshot.queryParamMap.get('day') === day) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { day },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  goTo(page: number): void {
    void this.runs.load(withPageIndex(this.runs.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.runs.load(withPageSize(this.runs.query(), size).query);
  }

  openRun(id: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { run: id }, queryParamsHandling: 'merge' });
  }

  /** Closing the drawer leaves the history as it came: the entry that opened it is popped (FM-12). */
  drawerChange(open: boolean, reason: string): void {
    // The address opens and closes the drawer; only the reader's own close leaves it.
    if (reason === 'programmatic') return;
    if (!open && this.runId() !== null) leaveForm(this.router, this.route, this.location, {});
  }
}
