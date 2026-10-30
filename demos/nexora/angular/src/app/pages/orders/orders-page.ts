import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
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
import { SlText } from '@slotted/angular/typography';
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { FilterGroup } from '@slotted/core/filter';
import type { OrderListItem } from '@slotted/demo-nexora-backend';

import { doorFilter, fieldsWithDoor, type Door } from '../../core/backend/door';
import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { phoneSignal } from '../../core/layout/phone';
import { OrdersStore } from '../../core/sales/orders.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import {
  APPROVAL_LABEL,
  FULFILLMENT_LABEL,
  formatMoney,
  ORDER_COLUMNS,
  ORDER_DOOR_FIELDS,
  ORDER_FILTER_FIELDS,
  ORDER_HIDDEN_COLUMN_IDS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  RISK_LABEL,
  RISK_TONE,
} from './order-labels';
import { OrderProgress } from './order-progress';

/**
 * Where every order is in its cycle. The row answers one question — what is
 * this order waiting on — so the state, the approval and the risks are read
 * together and the money is read on one edge.
 */
@Component({
  selector: 'app-orders-page',
  imports: [
    RouterLink,
    SlBadge,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridFooter,
    SlFilterBar,
    SlFilterBarEnd,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPagination,
    SlPaginationNext,
    SlPaginationPageSize,
    SlPaginationPrevious,
    SlPaginationStatus,
    SlText,
    ListViewTools,
    OrderProgress,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* The bar and the grid share the body's column; the grid takes what the bar leaves (LP-12). */
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
    /* A cell template replaces the column's own value, and with it its truncation (LP-04). */
    .cut {
      display: block;
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Sales orders</h1></div>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Order filters"
            shortcut="/"
            [fields]="fields()"
            [value]="store.filter()"
            (valueChangeRequest)="filterRequest($event)"
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
              label="Order"
              [view]="view"
              [columns]="columns"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          @if (store.flattened()) {
            <div slInlineMessage tone="warning">
              <span slInlineMessageIcon></span>
              Nexora matches every filter at once: "any of the following" and groups are applied as
              "all of the following".
            </div>
          }
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Sales orders"
            rowKey="id"
            variant="framed"
            activatable
            [rows]="store.rows()"
            [columns]="columns"
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
            <ng-template slDataGridCell="orderNumber" let-row="row">
              <a
                slLink
                class="cut"
                variant="neutral"
                underline="hover"
                [routerLink]="store.routeFor(row.id)"
                [title]="row.orderNumber"
              >
                {{ row.orderNumber }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="customerName" let-row="row">
              <a
                slLink
                class="cut"
                variant="neutral"
                underline="hover"
                [routerLink]="'/crm/customers/' + row.customerId"
                [title]="row.customerName"
              >
                {{ row.customerName }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <app-order-progress [order]="row" [compact]="true" />
            </ng-template>
            <ng-template slDataGridCell="approvalStatus" let-row="row">
              {{ approval(row) }}
            </ng-template>
            <!--
              One line, whatever the count: the first risk is named and the rest
              are counted, with every one of them in the cell's own title (LP-04).
            -->
            <ng-template slDataGridCell="riskFlags" let-row="row">
              @if (row.riskFlags.length === 0) {
                <span slText size="sm" tone="muted">—</span>
              } @else {
                <span slInline [gap]="2" wrap="nowrap" [title]="risks(row)">
                  <span slBadge variant="soft" size="sm" [tone]="riskTone(row.riskFlags[0])">
                    {{ risk(row.riskFlags[0]) }}
                  </span>
                  @if (row.riskFlags.length > 1) {
                    <span slText size="sm" tone="muted">+{{ row.riskFlags.length - 1 }}</span>
                  }
                </span>
              }
            </ng-template>
            <ng-template slDataGridCell="fulfillmentStatus" let-row="row">
              {{ fulfilment(row) }}
            </ng-template>
            <ng-template slDataGridCell="total" let-row="row">
              {{ money(row) }}
            </ng-template>
            <ng-template slDataGridCell="grossMarginBps" let-row="row">
              {{ margin(row) }}
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Order pages"
              [count]="store.total() ?? 0"
              [page]="store.page().index + 1"
              [pageSize]="store.page().size"
              [pageSizeOptions]="pageSizes"
              [messages]="pagerMessages"
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
    </div>
  `,
})
export class OrdersPage implements OnInit {
  readonly store = inject(OrdersStore);
  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns = ORDER_COLUMNS;
  /** The door the address names, whose ids the bar shows by the words the door carries. */
  private readonly door = signal<Door | null>(null);
  readonly fields = computed(() => fieldsWithDoor(ORDER_FILTER_FIELDS, ORDER_DOOR_FIELDS, this.door()));
  readonly pageSizes = LIST_PAGE_SIZES;
  /** The compact size class: the pager leaves its page size at the default. */
  readonly phone = phoneSignal();

  /** Every number on the screen names what it counts (LP-08). */
  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} orders', countOnly: '{count} orders' };
  readonly pagerMessages = {
    range: '{count, plural, =0 {No orders} other {Orders {start}–{end} of {count}}}',
    pageSize: 'Orders per page',
  };

  /** The reader's arrangement and density, kept in the browser; the query is the store's. */
  readonly view = listView({
    page: 'orders',
    columns: ORDER_COLUMNS,
    defaultColumnState: { hidden: [...ORDER_HIDDEN_COLUMN_IDS] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  ngOnInit(): void {
    let first = true;
    // A report's door opens the list on its condition and its period, as the bar's own pills (OV-01).
    const subscription = this.route.queryParamMap.subscribe((params) => {
      const door = doorFilter(params, [...ORDER_FILTER_FIELDS, ...ORDER_DOOR_FIELDS]);
      this.door.set(door);
      if (door !== null) {
        void this.store.load({ ...emptyQuery({ index: 0, size: this.store.page().size }), filter: door.filter });
        void this.store.loadGrandTotal();
      } else if (first) void this.store.open(this.view.openingQuery);
      first = false;
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  approval(row: OrderListItem): string {
    return APPROVAL_LABEL[row.approvalStatus] ?? row.approvalStatus;
  }

  fulfilment(row: OrderListItem): string {
    return FULFILLMENT_LABEL[row.fulfillmentStatus] ?? row.fulfillmentStatus;
  }

  risk(flag: string): string {
    return RISK_LABEL[flag] ?? flag;
  }

  riskTone(flag: string): 'warning' | 'danger' {
    return RISK_TONE[flag] ?? 'warning';
  }

  /** Every risk of the row, for the cell's title. */
  risks(row: OrderListItem): string {
    return row.riskFlags.map((flag) => this.risk(flag)).join(' · ');
  }

  money(row: OrderListItem): string {
    return formatMoney(row.total);
  }

  margin(row: OrderListItem): string {
    return `${Math.round(row.grossMarginBps / 100)}%`;
  }

  status(row: OrderListItem): string {
    return ORDER_STATUS_LABEL[row.status] ?? row.status;
  }

  statusTone(row: OrderListItem): 'secondary' | 'accent' | 'warning' | 'success' | 'danger' {
    return ORDER_STATUS_TONE[row.status] ?? 'secondary';
  }

  /** Choosing a view sends the tree twice; the store applied it on the first. */
  filterRequest(request: { value: FilterGroup | null; reason: string }): void {
    if (request.reason !== 'select') void this.store.setFilter(request.value);
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(this.store.routeFor(id));
  }
}
