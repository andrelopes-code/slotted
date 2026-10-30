import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlChart } from '@slotted/angular/chart';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderTabs,
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
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';
import { emptyQuery, withPageIndex, withPageSize, type GridQuery } from '@slotted/core/grid';
import type { PurchaseOrderListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import { phoneSignal } from '../../core/layout/phone';
import {
  PO_EXCEPTION_LABEL,
  PO_STATUS_LABEL,
  PO_STATUS_TONE,
  PURCHASE_ORDERS_ROUTE,
} from '../../core/procurement/procurement.model';
import { ReceivingStore } from '../../core/procurement/receiving.store';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { purchaseOrderColumns, purchaseOrderFilterFields } from './procurement-columns';

/**
 * The queue opens on the orders flagged delayed or disputed, then on what
 * should already be here, the earliest expected first: under a supplier recall
 * the flagged orders lead the queue rather than sinking under months of
 * ordinary lateness.
 */
const OPENING: GridQuery = {
  ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
  sort: [
    { column: 'exceptionFlags', direction: 'descending' },
    { column: 'expectedDate', direction: 'ascending' },
  ],
};

/**
 * The receiving queue (§65.7). The backend keeps no list of receipts and no
 * queue, so the destination is the work a receipt is written against: the
 * purchase orders sent, acknowledged or partly received, bound for the
 * reader's warehouses, earliest expected first (LP-09). A row opens the order
 * with its receipt form for a reader who receives at its warehouse, since that
 * is what the queue is for; the receipt itself is read at this destination's
 * `:id`, the one address a goods receipt has.
 *
 * How the work lies across the warehouses is the header's second tab: a
 * comparison that needs two warehouses to compare, so a reader scoped to one
 * reads it as one sentence above the queue instead (OV-03).
 */
@Component({
  selector: 'app-receiving-page',
  imports: [
    ListViewTools,
    RouterLink,
    SlBadge,
    SlChart,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridFooter,
    SlFilterBar,
    SlFilterBarEnd,
    SlInline,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderTabs,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPagination,
    SlPaginationNext,
    SlPaginationPageSize,
    SlPaginationPrevious,
    SlPaginationStatus,
    SlSkeleton,
    SlTab,
    SlTabList,
    SlTabs,
    SlText,
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Receiving</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>{{ description() }}</p>
          </div>
        </div>
        @if (compared()) {
          <div slPageHeaderTabs>
            <div slTabs [value]="shown()" (valueChange)="show($event.value)">
              <div slTabList aria-label="Receiving views">
                <div slTab value="queue">Queue</div>
                <div slTab value="warehouses">By warehouse</div>
              </div>
            </div>
          </div>
        }
      </header>
      <div slPageBody>
        @if (shown() === 'warehouses') {
          <figure
            slChart
            data-testid="inbound-chart"
            title="Waiting to be received, by warehouse"
            description="Purchase orders sent, acknowledged or partly received, split by whether their expected date has passed"
            [size]="phone() ? 'sm' : 'md'"
            locale="en-US"
            toolbar="hover"
            [data]="chartData()"
            [series]="series"
            [x]="{ field: 'code' }"
            [y]="{ label: 'Purchase orders' }"
            [loading]="store.byWarehouse().value === null && !store.byWarehouse().failed"
            [error]="store.byWarehouse().failed"
            (retry)="store.loadByWarehouse()"
          ></figure>
        } @else {
          <div class="listing">
            @if (!compared()) {
              <!-- The warehouse is known from the scope before the counts: only the numbers wait. -->
              <span slText size="sm" tone="muted" data-testid="inbound-sentence">
                @for (row of sentenceRows(); track row.code) {
                  {{ row.code }} waits on
                  @if (row.total === null) {
                    <span slSkeleton shape="text" inlineSize="2rem"></span>
                  } @else {
                    {{ row.total }}
                  }
                  purchase orders,
                  @if (row.late === null) {
                    <span slSkeleton shape="text" inlineSize="1.5rem"></span>
                  } @else {
                    {{ row.late }}
                  }
                  past the expected date.
                }
                @if (store.byWarehouse().failed) {
                  The counts per warehouse did not arrive.
                }
              </span>
            }
            <div
              slFilterBar
              aria-label="Receiving filters"
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
                label="Receiving"
                [view]="view"
                [columns]="columns()"
                [outOfSpace]="grid.outOfSpace()"
              />
            </div>
            <sl-data-grid
              #grid="slDataGrid"
              aria-label="Purchase orders to receive"
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
              <ng-template slDataGridCell="purchaseOrderNumber" let-row="row">
                <a
                  slLink
                  class="cell-text"
                  variant="neutral"
                  underline="hover"
                  [routerLink]="[route, row.id]"
                  [queryParams]="receives(row) ? { receive: 1 } : {}"
                  [title]="row.purchaseOrderNumber"
                >
                  {{ row.purchaseOrderNumber }}
                </a>
              </ng-template>
              <ng-template slDataGridCell="status" let-row="row">
                <span slBadge variant="soft" size="sm" [tone]="tone(row)">{{ word(row) }}</span>
              </ng-template>
              <ng-template slDataGridCell="exceptionFlags" let-row="row">
                <span slInline [gap]="1">
                  @for (flag of row.exceptionFlags; track flag) {
                    <span slBadge variant="soft" size="sm" tone="warning">{{
                      exception(flag)
                    }}</span>
                  }
                </span>
              </ng-template>
              <ng-template slDataGridCell="supplierName" let-row="row">
                <span class="cell-text" [title]="row.supplierName">{{ row.supplierName }}</span>
              </ng-template>
              <nav
                slDataGridFooter
                slPagination
                aria-label="Receiving pages"
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
        }
      </div>
    </div>
  `,
})
export class ReceivingPage {
  readonly store = inject(ReceivingStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly router = inject(Router);

  readonly route = PURCHASE_ORDERS_ROUTE;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();

  readonly series = [
    { id: 'due', kind: 'bar', field: 'due', label: 'Not yet due', stack: 'inbound' },
    {
      id: 'late',
      kind: 'bar',
      field: 'late',
      label: 'Past the expected date',
      tone: 'warning',
      stack: 'inbound',
    },
  ] as const;

  private readonly can = (permission: string): boolean => {
    void this.session.session();
    return this.session.can(permission);
  };

  readonly columns = computed(() => purchaseOrderColumns(this.can, true));
  readonly fields = computed(() => purchaseOrderFilterFields(this.warehouses.inScope(), true));

  /** A comparison needs two warehouses to compare (OV-03); for one, a sentence states its numbers. */
  readonly compared = computed(() => {
    // Read from the session's scope, which is known before the warehouse directory answers.
    const own = this.warehouses.own();
    return own === 'all' || own.length > 1;
  });
  /**
   * The queue is the page and fills it (LP-12); the comparison across the
   * warehouses is the header's second tab (LA-04), so neither takes the
   * other's height.
   */
  private readonly chosen = signal<'queue' | 'warehouses'>('queue');
  readonly shown = computed(() => (this.compared() ? this.chosen() : 'queue'));

  readonly chartData = computed(() =>
    (this.store.byWarehouse().value ?? []).map((row) => ({ ...row })),
  );

  /** One clause per warehouse of the scope; a count is null until its answer. */
  readonly sentenceRows = computed(() => {
    const counted = new Map(
      (this.store.byWarehouse().value ?? []).map((row) => [row.warehouseId, row]),
    );
    // The session carries the reader's warehouses, so the sentence stands before the directory answers.
    return this.session.warehouses().map((place) => {
      const row = counted.get(place.id);
      return {
        code: place.code,
        total: row ? (row.late + row.due).toLocaleString('en-US') : null,
        late: row ? row.late.toLocaleString('en-US') : null,
      };
    });
  });

  readonly description = computed(() => {
    const scope = this.warehouses.inScope();
    const place =
      this.warehouses.scoped() && scope.length > 0
        ? scope.map((row) => row.code).join(' and ')
        : 'every warehouse';
    const receives = this.can('receipts.create')
      ? ' Opening an order opens its receipt: each line is received as accepted, damaged or rejected.'
      : ' Receipts are written by the warehouse that receives the goods; this page shows what they wait on.';
    return `Purchase orders on their way to ${place} — sent, acknowledged or partly received — flagged orders first, then the earliest expected.${receives}`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} purchase orders to receive', countOnly: '{count} purchase orders to receive' };

  readonly pagerMessages = {
    range: 'Purchase orders {start}–{end} of {count}',
    pageSize: 'Purchase orders per page',
  };

  readonly view = listView({
    page: 'receiving',
    columns: purchaseOrderColumns(() => true, true),
    defaultColumnState: {
      hidden: ['updatedAt', 'total', 'buyerName', 'createdBusinessDate'],
      order: [
        'purchaseOrderNumber',
        'daysLate',
        'exceptionFlags',
        'supplierName',
        'expectedDate',
        'warehouseCode',
        'status',
        'receivedShareBps',
        'lineCount',
      ],
    },
    query: this.store.query,
    defaultQuery: OPENING,
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    void this.store.open(this.view.openingQuery ?? OPENING);
    void this.store.loadByWarehouse();
  }

  show(value: string | undefined): void {
    if (value === 'queue' || value === 'warehouses') this.chosen.set(value);
  }

  /** The reader receives at the order's warehouse, so the row opens the receipt. */
  receives(row: PurchaseOrderListItem): boolean {
    return this.can('receipts.create') && this.warehouses.covers(row.destinationWarehouseId);
  }

  word(row: PurchaseOrderListItem): string {
    return PO_STATUS_LABEL[row.status];
  }

  tone(row: PurchaseOrderListItem) {
    return PO_STATUS_TONE[row.status];
  }

  exception(flag: PurchaseOrderListItem['exceptionFlags'][number]): string {
    return PO_EXCEPTION_LABEL[flag];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    const row = this.store.rows().find((candidate) => candidate.id === id);
    void this.router.navigate([PURCHASE_ORDERS_ROUTE, id], {
      queryParams: row && this.receives(row) ? { receive: 1 } : {},
    });
  }
}
