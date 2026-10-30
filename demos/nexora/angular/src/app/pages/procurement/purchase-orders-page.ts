import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
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
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize, type GridQuery } from '@slotted/core/grid';
import type { PurchaseOrderListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { NEXORA_BACKEND } from '../../core/backend/nexora-backend.provider';
import { TransportHealth } from '../../core/backend/transport-health';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import { phoneSignal } from '../../core/layout/phone';
import {
  HOLDERS,
  PO_EXCEPTION_LABEL,
  PO_STATUS_LABEL,
  PO_STATUS_TONE,
  PURCHASE_ORDERS_ROUTE,
  RECEIVABLE,
} from '../../core/procurement/procurement.model';
import { PurchaseOrdersStore } from '../../core/procurement/purchase-orders.store';
import { SessionStore } from '../../core/session/session.store';
import { listDoor } from '../list-view/list-door';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { PURCHASE_ORDER_DOOR_FIELDS, purchaseOrderColumns, purchaseOrderFilterFields } from './procurement-columns';

/** The orders still to arrive and past their expected date, as the bar's own pills (OV-01). */
export function lateFilter(): FilterGroup {
  return {
    join: 'and',
    rules: [
      {
        field: 'status',
        filter: {
          kind: 'set',
          join: 'and',
          conditions: [{ operator: 'anyOf', value: [...RECEIVABLE] }],
        },
      },
      {
        field: 'daysLate',
        filter: {
          kind: 'number',
          join: 'and',
          conditions: [{ operator: 'greaterThanOrEqual', value: 1 }],
        },
      },
    ],
  };
}

/**
 * Purchase orders (§12, §65.3). A reader scoped to warehouses reads the orders
 * bound for them (the store's place); a reader without `cost.view` is not
 * given the totals, and the page says so once (PM-01, PM-02). The page opens
 * on how many orders still to arrive are past their date, which is what a
 * supplier recall or a delayed lot changes first.
 */
@Component({
  selector: 'app-purchase-orders-page',
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
    SlInline,
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Purchase orders</h1></div>
            @if (canCreate()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Purchase order actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink data-testid="new-purchase-order" [routerLink]="newRoute"
                      >New purchase order</a
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
            <p slPageHeaderDescription data-testid="po-description">
              {{ description() }}
              @if (late(); as count) {
                <a
                  slLink
                  data-testid="late-door"
                  [routerLink]="[]"
                  [queryParams]="{ late: 1 }"
                  (click)="showLate()"
                >
                  {{ count }} still to arrive {{ count === 1 ? 'is' : 'are' }} past the expected
                  date
                </a>
              }
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Purchase order filters"
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
              label="Purchase order"
              [view]="view"
              [columns]="columns()"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Purchase orders"
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
                  <span slBadge variant="soft" size="sm" tone="warning">{{ exception(flag) }}</span>
                }
              </span>
            </ng-template>
            <ng-template slDataGridCell="supplierName" let-row="row">
              <span class="cell-text" [title]="row.supplierName">{{ row.supplierName }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Purchase order pages"
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
        <a slMenuItem [routerLink]="newRoute">New purchase order</a>
      </ng-template>
    </div>
  `,
})
export class PurchaseOrdersPage {
  readonly store = inject(PurchaseOrdersStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly router = inject(Router);
  private readonly route$ = inject(ActivatedRoute);

  readonly route = PURCHASE_ORDERS_ROUTE;
  readonly newRoute = `${PURCHASE_ORDERS_ROUTE}/new`;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();
  /** Orders still to arrive and past their date, in the reader's place; null before the answer. */
  readonly late = signal<number | null>(null);

  private readonly can = (permission: string): boolean => {
    void this.session.session();
    return this.session.can(permission);
  };

  readonly canCreate = computed(() => this.can('purchase_orders.create'));
  readonly columns = computed(() => purchaseOrderColumns(this.can));


  readonly description = computed(() => {
    const scope = this.warehouses.inScope();
    const place =
      this.warehouses.scoped() && scope.length > 0
        ? `Purchase orders bound for ${scope.map((row) => row.code).join(' and ')}.`
        : 'Purchase orders to every warehouse.';
    const cost = this.can('cost.view')
      ? ''
      : ` Totals are shown to holders of cost.view — ${HOLDERS['cost.view']}.`;
    return `${place}${cost}`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} purchase orders', countOnly: '{count} purchase orders' };

  readonly pagerMessages = {
    range: 'Purchase orders {start}–{end} of {count}',
    pageSize: 'Purchase orders per page',
  };

  readonly view = listView({
    page: 'purchase-orders',
    columns: purchaseOrderColumns(() => true),
    defaultColumnState: { hidden: ['updatedAt', 'lineCount', 'createdBusinessDate'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  /** A report's door opens the list on its condition and period, as the bar's pills (OV-01). */
  readonly door = listDoor({
    fields: () => purchaseOrderFilterFields(this.warehouses.inScope()),
    doorOnly: PURCHASE_ORDER_DOOR_FIELDS,
    open: (filter, first) => {
      if (filter !== null) {
        void this.store.load({ ...emptyQuery({ index: 0, size: this.store.page().size }), filter });
        void this.store.loadGrandTotal();
      } else if (first) {
        // The page's own door counts late orders and opens the list on them (OV-01).
        if (this.route$.snapshot.queryParamMap.get('late') === '1') this.showLate();
        else void this.store.open(this.view.openingQuery);
      }
    },
  });

  constructor() {
    void this.warehouses.open();
    void this.countLate();
  }

  showLate(): void {
    const query: GridQuery = {
      ...emptyQuery({ index: 0, size: this.store.page().size }),
      filter: lateFilter(),
      sort: [{ column: 'daysLate', direction: 'descending' }],
    };
    void this.store.load(query);
    void this.store.loadGrandTotal();
  }

  private async countLate(): Promise<void> {
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () =>
        api.purchaseOrders.list({
          pageSize: LIST_PAGE_SIZE,
          filter: { status: { in: [...RECEIVABLE] }, daysLate: { gte: 1 } },
        }),
      null,
    );
    if (answer) this.late.set(answer.page.totalItems);
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
    void this.router.navigateByUrl(`${PURCHASE_ORDERS_ROUTE}/${id}`);
  }
}
