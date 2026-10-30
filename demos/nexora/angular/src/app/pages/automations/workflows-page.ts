import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridEmptyTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
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
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { WorkflowStatus } from '@slotted/demo-nexora-backend';
import { map } from 'rxjs';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { WorkflowCatalogStore } from '../../core/automation/workflow-catalog.store';
import {
  NEW_WORKFLOW_ROUTE,
  READERS,
  STATUS_LABEL,
  STATUS_TONE,
  WORKFLOWS_ROUTE,
  WRITERS,
} from '../../core/automation/workflow.model';
import { WorkflowsStore } from '../../core/automation/workflows.store';
import { phoneSignal } from '../../core/layout/phone';
import { ClockService } from '../../core/session/clock.service';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { OutcomeMarks } from './outcome-marks';
import { statusFilter, workflowColumns, workflowFilterFields, workflowViews } from './workflow-columns';

/**
 * The workflows (§15): state, trigger, owner, runs, last run and the failures
 * of the last week, with a view per state as the bar's own pills. A workflow a
 * run stopped is what needs attention: the header counts them and opens the
 * list on them (OV-01), and its row carries its failures beside its state.
 */
@Component({
  selector: 'app-workflows-page',
  imports: [
    OutcomeMarks,
    ListViewTools,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridEmptyTemplate,
    SlDataGridFooter,
    SlFilterBar,
    SlFilterBarEnd,
    SlLink,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
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
    SlSkeleton,
    SlTag,
    SlTagBody,
    SlText,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
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
    /* LP-12: below the compact size class the page scrolls, and the grid takes its rows' height. */
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
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Workflows</h1></div>
            @if (canCreate()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Workflow actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink data-testid="new-workflow" [routerLink]="newRoute">New workflow</a>
                  </div>
                  <sl-toolbar-overflow />
                </div>
              </div>
            }
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription data-testid="workflows-description">
              Rules that act on an event with no one in front of them: a trigger, the conditions it must meet, and what it then does.
              <!-- The door's sentence stands in every state, so its line is the same before and after the counts. -->
              @if (store.counts() === null) {
                <span slSkeleton shape="text" inlineSize="16rem"></span>
              } @else if (stopped(); as count) {
                <a slLink data-testid="error-door" [routerLink]="[]" [queryParams]="{ status: 'error' }" (click)="showView('error')">
                  {{ count }} {{ count === 1 ? 'workflow was' : 'workflows were' }} stopped by a failed run
                </a>
              } @else {
                No workflow was stopped by a failed run.
              }
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Workflow filters"
            shortcut="/"
            [fields]="fields()"
            [presets]="coarse() ? undefined : views()"
            [preset]="preset()"
            (presetChangeRequest)="preset.set($event.value)"
            [value]="store.filter()"
            (valueChangeRequest)="setFilter($event.value)"
            [query]="store.search()"
            (queryChangeRequest)="store.setSearch($event.value)"
            [messages]="countMessages"
            [count]="store.total() ?? undefined"
            [total]="store.total() === store.grandTotal() ? undefined : (store.grandTotal() ?? undefined)"
            [loading]="store.loading()"
          >
            <app-list-view-tools
              slFilterBarEnd
              #tools
              label="Workflow"
              [view]="view"
              [columns]="columns()"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Workflows"
            rowKey="id"
            variant="framed"
            activatable
            [rows]="store.rows()"
            [columns]="columns()"
            [totalCount]="store.total() ?? 0"
            [loading]="store.loading()"
            [error]="store.error()"
            [query]="store.query()"
            (queryChangeRequest)="store.load($event.value)"
            [columnState]="view.columnState()"
            (columnStateChangeRequest)="tools.arrange($event)"
            [density]="view.density()"
            manageable
            (manageColumns)="tools.manage()"
            [showRange]="false"
            (retry)="store.reload()"
            (activate)="open($event.key)"
          >
            <ng-template slDataGridCell="name" let-row="row">
              <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="[route, row.id]" [title]="row.name">
                {{ row.name }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slTag size="sm" [tone]="tone(row.status)"><span slTagBody>{{ word(row.status) }}</span></span>
            </ng-template>
            <ng-template slDataGridCell="recentOutcomes" let-row="row">
              <app-outcome-marks [outcomes]="row.recentOutcomes" />
            </ng-template>
            <ng-template slDataGridCell="recentFailures" let-row="row">
              <span slText size="sm" numeric="tabular" [tone]="row.recentFailures > 0 ? 'danger' : 'muted'">{{ row.recentFailures }}</span>
            </ng-template>
            <ng-template slDataGridEmpty let-status>
              @if (status === 'error') {
                <div slResultState status="error" reach="section">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>The workflows did not arrive</h2>
                    <p slResultStateDescription>Nothing was changed. Try again in a moment.</p>
                  </div>
                  <div slResultStateActions>
                    <button slButton size="sm" type="button" (click)="store.reload()">Try again</button>
                  </div>
                </div>
              } @else if (status === 'no-results') {
                <div slResultState status="no-results" reach="section">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>No workflow matches these filters</h2>
                    <p slResultStateDescription>Choose another view, or remove a filter to see more workflows.</p>
                  </div>
                  <div slResultStateActions>
                    <button slButton size="sm" variant="outline" tone="secondary" type="button" (click)="clearFilters()">Clear filters</button>
                  </div>
                </div>
              } @else {
                <div slResultState status="empty" reach="section" data-testid="workflows-empty">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>No workflow yet</h2>
                    <p slResultStateDescription>{{ emptyWords() }}</p>
                  </div>
                  @if (canCreate()) {
                    <div slResultStateActions>
                      <a slButtonLink size="sm" [routerLink]="newRoute">New workflow</a>
                    </div>
                  }
                </div>
              }
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Workflow pages"
              [messages]="pagerMessages"
              [count]="store.total() ?? 0"
              [page]="store.page().index + 1"
              [pageSize]="store.page().size"
              [pageSizeOptions]="pageSizes"
              [loading]="store.loading()"
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
      <ng-template #newItem>
        <a slMenuItem [routerLink]="newRoute">New workflow</a>
      </ng-template>
    </div>
  `,
})
export class WorkflowsPage {
  readonly store = inject(WorkflowsStore);
  private readonly catalog = inject(WorkflowCatalogStore);
  private readonly session = inject(SessionStore);
  private readonly clock = inject(ClockService);
  private readonly router = inject(Router);
  private readonly route$ = inject(ActivatedRoute);

  readonly route = WORKFLOWS_ROUTE;
  readonly newRoute = NEW_WORKFLOW_ROUTE;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();
  /**
   * Where the primary input is touch the list tools keep sort, saved views and
   * columns on one line (LP-11): the views by state leave the bar's end, and a
   * state is the pinned Status pill's choice — the same tree the view sets.
   */
  readonly coarse = phoneSignal('(pointer: coarse)');
  /** The view the bar names; the bar marks it changed once a pill is edited. */
  readonly preset = signal<string | null>(null);

  /** The views are states, not saved views: the select is named for what it holds. */
  readonly countMessages = {
    count: '{count} of {total, plural, one {# workflow} other {# workflows}}',
    countOnly: '{count, plural, one {# workflow} other {# workflows}}',
    preset: 'Workflows by state',
    presetNone: 'Every state',
  };
  readonly pagerMessages = { range: 'Workflows {start}–{end} of {count}', pageSize: 'Workflows per page' };

  readonly canCreate = computed(() => {
    void this.session.session();
    return this.session.can('workflows.create');
  });

  /** Dates relative to the demo clock, so they move when the clock does. */
  readonly columns = computed(() => {
    void this.session.session();
    return workflowColumns((instant) => this.clock.relative(instant));
  });
  readonly fields = computed(() => workflowFilterFields(this.catalog.catalog()?.owners ?? []));
  readonly views = computed(() => workflowViews(this.store.counts()));
  readonly stopped = computed(() => this.store.counts()?.error ?? 0);

  readonly emptyWords = computed(() =>
    this.canCreate()
      ? 'A workflow acts on an order, an invoice, the stock, a ticket or a customer when its event happens, or on a schedule.'
      : `Workflows are written by ${WRITERS}, and read by ${READERS}.`,
  );

  readonly view = listView({
    page: 'workflows',
    columns: workflowColumns(() => ''),
    defaultColumnState: { hidden: ['updatedAt'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  private readonly statusParam = toSignal(this.route$.queryParamMap.pipe(map((params) => params.get('status'))), {
    initialValue: this.route$.snapshot.queryParamMap.get('status'),
  });

  constructor() {
    void this.catalog.ensure();
    if (this.store.counts() === null) void this.store.loadCounts();
    // A door (`?status=`) opens its view: the bar's pills become the view's tree.
    effect(() => {
      const status = this.statusParam() as WorkflowStatus | null;
      untracked(() => {
        if (status !== null && status in STATUS_LABEL) this.showView(status);
        else if (this.store.total() === null) void this.store.open(this.view.openingQuery);
        else this.preset.set(this.matchingView(this.store.filter()));
      });
    });
    // A persona, a scenario or a day moved: the list and its counts read again from nothing.
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) {
          this.preset.set(null);
          void this.store.open(null);
          void this.store.loadCounts();
        }
        tenant = key;
      });
    });
  }

  showView(status: WorkflowStatus): void {
    this.preset.set(status);
    void this.store.load({ ...emptyQuery({ index: 0, size: this.store.page().size }), filter: statusFilter(status) });
    void this.store.loadGrandTotal();
  }

  setFilter(filter: FilterGroup | null): void {
    this.preset.set(this.matchingView(filter));
    void this.store.setFilter(filter);
  }

  private matchingView(filter: FilterGroup | null): string | null {
    if (filter === null) return null;
    const tree = JSON.stringify(filter);
    return this.views().find((view) => JSON.stringify(view.value) === tree)?.key ?? null;
  }

  clearFilters(): void {
    this.preset.set(null);
    void this.store.load({ ...this.store.query(), filter: null, search: '', page: { index: 0, size: this.store.page().size } });
  }

  word(status: WorkflowStatus): string {
    return STATUS_LABEL[status];
  }

  tone(status: WorkflowStatus) {
    return STATUS_TONE[status];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${WORKFLOWS_ROUTE}/${id}`);
  }
}
