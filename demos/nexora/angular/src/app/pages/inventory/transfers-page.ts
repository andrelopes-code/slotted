import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import type { TransferListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { formatDate, formatDateTime, options } from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import {
  TRANSFER_STATUS_LABEL,
  TRANSFER_STATUS_TONE,
  TRANSFERS_IN_FLIGHT,
  TRANSFERS_ROUTE,
} from '../../core/inventory/inventory.model';
import { TransfersStore } from '../../core/inventory/transfers.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { listDoor } from '../list-view/list-door';

/**
 * The columns are named by the fields `transferResource` sorts and filters
 * by: a warehouse column is the warehouse's id, drawn as its code, so a press
 * on its header sorts by a field the backend has.
 */
function transferColumns(codeOf: (id: string) => string): readonly GridColumn<TransferListItem>[] {
  return [
    { id: 'transferNumber', label: 'Transfer', rowHeader: true, width: 140, hideable: false },
    {
      id: 'status',
      label: 'Status',
      kind: 'set',
      options: options(TRANSFER_STATUS_LABEL),
      width: 150,
      priority: 1,
    },
    {
      id: 'sourceWarehouseId',
      label: 'From',
      width: 110,
      priority: 2,
      filterable: false,
      format: (value) => codeOf(String(value)),
    },
    {
      id: 'destinationWarehouseId',
      label: 'To',
      width: 110,
      priority: 3,
      filterable: false,
      format: (value) => codeOf(String(value)),
    },
    { id: 'lineCount', label: 'Lines', kind: 'number', align: 'end', width: 90, priority: 5 },
    {
      id: 'requestedDate',
      label: 'Requested',
      kind: 'date',
      width: 130,
      priority: 4,
      filterable: false,
      format: (value) => formatDate(String(value)),
    },
    {
      id: 'requestedByName',
      label: 'By',
      width: 160,
      priority: 6,
      sortable: false,
      filterable: false,
    },
    {
      id: 'shippedAt',
      label: 'Shipped',
      width: 170,
      priority: 7,
      sortable: false,
      filterable: false,
      format: (value) => (value ? formatDateTime(String(value)) : ''),
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      kind: 'date',
      width: 170,
      priority: 8,
      filterable: false,
      accessor: (row) => row.metadata.updatedAt,
      format: (value) => formatDateTime(String(value)),
    },
  ];
}

/** The fields `transferResource` filters by, each warehouse a choice of `all`. */
export function transferFilterFields(all: readonly { value: string; label: string }[]): readonly FilterBarField[] {
  return [
    {
      key: 'status',
      label: 'Status',
      kind: 'set',
      options: options(TRANSFER_STATUS_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'sourceWarehouseId',
      label: 'From',
      kind: 'set',
      options: all,
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'destinationWarehouseId',
      label: 'To',
      kind: 'set',
      options: all,
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'requestedDate',
      label: 'Requested',
      kind: 'date',
      operators: ['after', 'before', 'is', 'between'],
      section: 'Transfer',
    },
    {
      key: 'lineCount',
      label: 'Lines',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual'],
      section: 'Transfer',
    },
  ];
}

/**
 * Stock moving between warehouses (§61). The list is scoped by the backend to
 * the transfers that leave or reach the reader's warehouses; creating one is
 * offered only to a reader who holds `inventory.transfer` (FM-01).
 */
@Component({
  selector: 'app-transfers-page',
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Transfers</h1></div>
            @if (canCreate()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Transfer actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink data-testid="new-transfer" [routerLink]="newRoute"
                      >New transfer</a
                    >
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
            aria-label="Transfer filters"
            shortcut="/"
            [fields]="door.fields()"
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
              label="Transfer"
              [view]="view"
              [columns]="columns()"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Transfers"
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
            <ng-template slDataGridCell="transferNumber" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[transfersRoute, row.id]"
                [title]="row.transferNumber"
              >
                {{ row.transferNumber }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="tone(row)">{{ word(row) }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Transfer pages"
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
        <a slMenuItem [routerLink]="newRoute">New transfer</a>
      </ng-template>
    </div>
  `,
})
export class TransfersPage {
  readonly store = inject(TransfersStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly transfersRoute = TRANSFERS_ROUTE;
  readonly newRoute = `${TRANSFERS_ROUTE}/new`;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();

  readonly canCreate = computed(() => {
    void this.session.session();
    return this.session.can('inventory.transfer');
  });

  readonly columns = computed(() => transferColumns((id) => this.warehouses.code(id)));

  /** The fields `transferResource` filters by. */
  readonly fields = computed<readonly FilterBarField[]>(() =>
    transferFilterFields(this.warehouses.rows().map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` }))),
  );

  readonly description = computed(() => {
    const scope = this.warehouses.inScope();
    const where =
      scope.length === 1 ? `that leave or reach ${scope[0]!.code}` : 'between the warehouses';
    return `Stock moving ${where}. A transfer is written as a draft, marked ready, shipped from its source and received at its destination line by line.`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} transfers', countOnly: '{count} transfers' };

  readonly pagerMessages = {
    range: 'Transfers {start}–{end} of {count}',
    pageSize: 'Transfers per page',
  };

  readonly view = listView({
    page: 'transfers',
    columns: transferColumns((id) => id),
    defaultColumnState: { hidden: ['updatedAt'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  /** A report's door opens the list on its condition and period, as the bar's pills (OV-01). */
  readonly door = listDoor({
    fields: () => (this.route.snapshot.queryParamMap.get('status') === 'in_flight' ? [] : this.fields()),
    open: (filter, first) => {
      if (filter !== null) {
        void this.store.load({ ...emptyQuery({ index: 0, size: this.store.page().size }), filter });
        void this.store.loadGrandTotal();
      } else if (first) this.openOwn();
    },
  });

  constructor() {
    void this.warehouses.open();
  }

  private openOwn(): void {
    // The overview's figure opens the list on the transfers still moving, as the bar's own pill (OV-01).
    if (this.route.snapshot.queryParamMap.get('status') === 'in_flight') {
      void this.store.load({
        ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
        filter: {
          join: 'and',
          rules: [
            {
              field: 'status',
              filter: {
                kind: 'set',
                join: 'and',
                conditions: [{ operator: 'anyOf', value: [...TRANSFERS_IN_FLIGHT] }],
              },
            },
          ],
        },
      });
      void this.store.loadGrandTotal();
    } else void this.store.open(this.view.openingQuery);
  }

  word(row: TransferListItem): string {
    return TRANSFER_STATUS_LABEL[row.status];
  }

  tone(row: TransferListItem) {
    return TRANSFER_STATUS_TONE[row.status];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${TRANSFERS_ROUTE}/${id}`);
  }
}
