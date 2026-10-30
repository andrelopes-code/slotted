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
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderNav,
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

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { CreditMemosStore } from '../../core/finance/credit-memos.store';
import {
  CREDIT_MEMO_LIFECYCLE_LABEL,
  CREDIT_MEMO_LIFECYCLE_TONE,
  CREDIT_MEMOS_ROUTE,
  INVOICES_ROUTE,
  NEW_CREDIT_MEMO_ROUTE,
  type CreditMemoListItem,
} from '../../core/finance/finance.model';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listDoor } from '../list-view/list-door';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { creditMemoColumns, creditMemoFilterFields } from './credit-memo-columns';
import { FINANCE_DOOR_FIELDS } from './finance-columns';

/**
 * Credit memos (§66.11). They have no destination in the navigation: a memo
 * changes what an invoice owes, so it lives under Invoices, with the way back
 * to that list in the header, and every invoice that issued or took one links
 * here. The list is a desk's; a memo is opened, applied and refunded from its
 * record.
 */
@Component({
  selector: 'app-credit-memos-page',
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
    SlPageHeaderBack,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderNav,
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
    /* On a finger the number's link is the row's touch target height (--slotted-target-comfortable); the ellipsis stays. */
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
            <a slPageHeaderBack [routerLink]="invoicesRoute">Invoices</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Credit memos</h1></div>
            @if (canCreate()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Credit memo actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink data-testid="new-credit-memo" [routerLink]="newRoute"
                      >New credit memo</a
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
            <p slPageHeaderDescription data-testid="credit-memos-description">
              A credit memo changes what an invoice owes, so credit memos live under Invoices: each
              is applied to an open invoice of its customer, kept as credit, or refunded.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Credit memo filters"
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
              label="Credit memo"
              [view]="view"
              [columns]="columns"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Credit memos"
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
            <ng-template slDataGridCell="creditMemoNumber" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[route, row.id]"
                [title]="row.creditMemoNumber"
              >
                {{ row.creditMemoNumber }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="lifecycle" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="tone(row)">{{ word(row) }}</span>
            </ng-template>
            <ng-template slDataGridCell="customerName" let-row="row">
              <span class="cell-text" [title]="row.customerName">{{ row.customerName }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Credit memo pages"
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
        <a slMenuItem [routerLink]="newRoute">New credit memo</a>
      </ng-template>
    </div>
  `,
})
export class CreditMemosPage {
  readonly store = inject(CreditMemosStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly route = CREDIT_MEMOS_ROUTE;
  readonly newRoute = NEW_CREDIT_MEMO_ROUTE;
  readonly invoicesRoute = INVOICES_ROUTE;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();
  readonly columns = creditMemoColumns();

  readonly canCreate = computed(() => {
    void this.session.session();
    return this.session.can('credit_memos.create');
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} credit memos', countOnly: '{count} credit memos' };

  readonly pagerMessages = {
    range: 'Credit memos {start}–{end} of {count}',
    pageSize: 'Credit memos per page',
  };

  readonly view = listView({
    page: 'credit-memos',
    columns: this.columns,
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  /** A report's door opens the list on its condition and period, as the bar's pills (OV-01). */
  readonly door = listDoor({
    fields: creditMemoFilterFields,
    doorOnly: FINANCE_DOOR_FIELDS,
    open: (filter, first) => {
      if (filter !== null) {
        void this.store.load({ ...emptyQuery({ index: 0, size: this.store.page().size }), filter });
        void this.store.loadGrandTotal();
      } else if (first) void this.store.open(this.view.openingQuery);
    },
  });

  word(row: CreditMemoListItem): string {
    return CREDIT_MEMO_LIFECYCLE_LABEL[row.lifecycle];
  }

  tone(row: CreditMemoListItem) {
    return CREDIT_MEMO_LIFECYCLE_TONE[row.lifecycle];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${CREDIT_MEMOS_ROUTE}/${id}`);
  }
}
