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
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { SupplierListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { phoneSignal } from '../../core/layout/phone';
import {
  HOLDERS,
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_STATUS_TONE,
  SUPPLIERS_ROUTE,
} from '../../core/procurement/procurement.model';
import { SuppliersStore } from '../../core/procurement/suppliers.store';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { supplierColumns, supplierFilterFields } from './procurement-columns';

/**
 * The suppliers (§12, §65.1) with the figures a buyer compares them by. A
 * supplier is created by a holder of `suppliers.manage` on its own route
 * (FM-01); a reader without `cost.view` is not given the spend, and the page
 * says so once (PM-02).
 */
@Component({
  selector: 'app-suppliers-page',
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Suppliers</h1></div>
            @if (canCreate()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Supplier actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink data-testid="new-supplier" [routerLink]="newRoute"
                      >New supplier</a
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
            <p slPageHeaderDescription data-testid="suppliers-description">{{ description() }}</p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Supplier filters"
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
              label="Supplier"
              [view]="view"
              [columns]="columns()"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Suppliers"
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
            <ng-template slDataGridCell="displayName" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[suppliersRoute, row.id]"
                [title]="row.displayName"
              >
                {{ row.displayName }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="tone(row)">{{ word(row) }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Supplier pages"
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
        <a slMenuItem [routerLink]="newRoute">New supplier</a>
      </ng-template>
    </div>
  `,
})
export class SuppliersPage {
  readonly store = inject(SuppliersStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly suppliersRoute = SUPPLIERS_ROUTE;
  readonly newRoute = `${SUPPLIERS_ROUTE}/new`;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();

  private readonly can = (permission: string): boolean => {
    void this.session.session();
    return this.session.can(permission);
  };

  readonly canCreate = computed(() => this.can('suppliers.manage'));
  readonly columns = computed(() => supplierColumns(this.can));
  readonly fields = computed(() => supplierFilterFields(this.can));

  readonly description = computed(() => {
    const base =
      'Who Nexora buys from, and how each has delivered: the share of lines on time, the quality of what arrived and the days an order takes.';
    return this.can('cost.view')
      ? base
      : `${base} What is spent with each supplier is shown to holders of cost.view — ${HOLDERS['cost.view']}.`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} suppliers', countOnly: '{count} suppliers' };

  readonly pagerMessages = {
    range: 'Suppliers {start}–{end} of {count}',
    pageSize: 'Suppliers per page',
  };

  readonly view = listView({
    page: 'suppliers',
    columns: supplierColumns(() => true),
    defaultColumnState: { hidden: ['supplierNumber', 'updatedAt', 'region'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    void this.store.open(this.view.openingQuery);
  }

  word(row: SupplierListItem): string {
    return SUPPLIER_STATUS_LABEL[row.status];
  }

  tone(row: SupplierListItem) {
    return SUPPLIER_STATUS_TONE[row.status];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${SUPPLIERS_ROUTE}/${id}`);
  }
}
