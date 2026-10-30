import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
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
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import type { FilterBarField } from '@slotted/angular/filter-bar';
import { emptyQuery, withPageIndex, withPageSize, type GridColumn } from '@slotted/core/grid';
import type { CycleCountListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { formatDate, formatDateTime, options } from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import { CycleCountsStore } from '../../core/inventory/cycle-counts.store';
import {
  CYCLE_COUNT_STATUS_LABEL,
  CYCLE_COUNT_STATUS_TONE,
  CYCLE_COUNTS_ROUTE,
} from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';

/**
 * The columns are named by the fields `cycleCountResource` sorts and filters
 * by: the warehouse column is the warehouse's id, drawn as its code.
 */
function countColumns(codeOf: (id: string) => string): readonly GridColumn<CycleCountListItem>[] {
  return [
    { id: 'cycleCountNumber', label: 'Count', rowHeader: true, width: 140, hideable: false },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: options(CYCLE_COUNT_STATUS_LABEL),
      width: 140,
      priority: 1,
    },
    {
      id: 'warehouseId',
      label: 'Warehouse',
      width: 120,
      priority: 2,
      filterable: false,
      format: (value) => codeOf(String(value)),
    },
    {
      id: 'plannedDate',
      label: 'Planned',
      kind: 'date',
      width: 130,
      priority: 3,
      filterable: false,
      format: (value) => formatDate(String(value)),
    },
    { id: 'lineCount', label: 'Lines', kind: 'number', align: 'end', width: 90, priority: 5 },
    {
      id: 'varianceLineCount',
      label: 'With variance',
      kind: 'number',
      align: 'end',
      width: 150,
      priority: 4,
      description: 'Lines whose count differed from what Nexora held when the count started.',
    },
    {
      id: 'submittedAt',
      label: 'Submitted',
      width: 170,
      priority: 6,
      sortable: false,
      filterable: false,
      format: (value) => (value ? formatDateTime(String(value)) : ''),
    },
  ];
}

/**
 * Periodic counts of a warehouse's stock (§62). The navigation had no
 * destination for them while the backend holds the whole cycle; this list
 * is it. It is scoped by the backend to the reader's warehouses, and planning
 * a count is offered to a reader who holds `inventory.cycle_count` (FM-01) —
 * a warehouse operator counts.
 */
@Component({
  selector: 'app-cycle-counts-page',
  imports: [
    ListViewTools,
    RouterLink,
    SlBadge,
    SlButtonLink,
    SlDataGrid,
    SlDataGridCellTemplate,
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
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Cycle counts</h1></div>
            @if (canCreate()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Count actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink data-testid="new-count" [routerLink]="newRoute">Plan a count</a>
                  </div>
                  <sl-toolbar-overflow />
                </div>
              </div>
            }
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>{{ description() }}</p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Count filters"
            shortcut="/"
            [fields]="fields()"
            [value]="store.filter()"
            (valueChangeRequest)="store.setFilter($event.value)"
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
              label="Count"
              [view]="view"
              [columns]="columns()"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Cycle counts"
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
            <ng-template slDataGridCell="cycleCountNumber" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[countsRoute, row.id]"
                [title]="row.cycleCountNumber"
              >
                {{ row.cycleCountNumber }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="tone(row)">{{ word(row) }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Count pages"
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
        <a slMenuItem [routerLink]="newRoute">Plan a count</a>
      </ng-template>
    </div>
  `,
})
export class CycleCountsPage {
  readonly store = inject(CycleCountsStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly router = inject(Router);

  readonly countsRoute = CYCLE_COUNTS_ROUTE;
  readonly newRoute = `${CYCLE_COUNTS_ROUTE}/new`;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();

  readonly canCreate = computed(() => {
    void this.session.session();
    return this.session.can('inventory.cycle_count');
  });

  readonly columns = computed(() => countColumns((id) => this.warehouses.code(id)));

  /** The fields `cycleCountResource` filters by; the warehouse where the scope holds several. */
  readonly fields = computed<readonly FilterBarField[]>(() => {
    const scope = this.warehouses.inScope();
    return [
      {
        key: 'status',
        label: 'Status',
        kind: 'set',
        options: options(CYCLE_COUNT_STATUS_LABEL),
        pinned: true,
        operators: ['anyOf'],
      },
      ...(scope.length > 1
        ? [
            {
              key: 'warehouseId',
              label: 'Warehouse',
              kind: 'set' as const,
              options: scope.map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
              pinned: true,
              operators: ['anyOf'],
            },
          ]
        : []),
      {
        key: 'plannedDate',
        label: 'Planned',
        kind: 'date',
        operators: ['after', 'before', 'is'],
        section: 'Count',
      },
      {
        key: 'varianceLineCount',
        label: 'Lines with variance',
        kind: 'number',
        operators: ['greaterThan', 'equals'],
        section: 'Count',
      },
    ];
  });

  readonly description = computed(() => {
    const scope = this.warehouses.inScope();
    const where = scope.length === 1 ? `${scope[0]!.code}'s` : "your warehouses'";
    return `Counts of ${where} stock. Starting a count takes a snapshot; the counted quantities change nothing until the count is submitted, and a variance worth US$2,500 or more at standard cost waits on a warehouse manager.`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} counts', countOnly: '{count} counts' };

  readonly pagerMessages = {
    range: 'Counts {start}–{end} of {count}',
    pageSize: 'Counts per page',
  };

  readonly view = listView({
    page: 'cycle-counts',
    columns: countColumns((id) => id),
    defaultColumnState: { hidden: ['submittedAt'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    void this.warehouses.open();
    void this.store.open(this.view.openingQuery);
  }

  word(row: CycleCountListItem): string {
    return CYCLE_COUNT_STATUS_LABEL[row.status];
  }

  tone(row: CycleCountListItem) {
    return CYCLE_COUNT_STATUS_TONE[row.status];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${CYCLE_COUNTS_ROUTE}/${id}`);
  }
}
