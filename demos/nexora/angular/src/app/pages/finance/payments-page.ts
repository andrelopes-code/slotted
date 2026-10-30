import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
import { emptyQuery, withPageIndex, withPageSize, type GridQuery } from '@slotted/core/grid';

import { formatMoney } from '../../core/catalog/catalog.model';
import { doorFilter, fieldsWithDoor, type Door } from '../../core/backend/door';
import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import {
  FINANCE_HOLDERS,
  NEW_PAYMENT_ROUTE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENTS_ROUTE,
  type PaymentListItem,
} from '../../core/finance/finance.model';
import { PaymentsStore } from '../../core/finance/payments.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { FINANCE_DOOR_FIELDS, paymentColumns, paymentDoorFilter, paymentFilterFields } from './finance-columns';

/**
 * Payments received (§66.7). A payment is posted, allocated to invoices of its
 * customer in its currency, and what no invoice takes stays unapplied as the
 * customer's credit — the column the page tints, since it is work still owed.
 * The overview's cash figure opens the list on this month's posted payments
 * (OV-01).
 */
@Component({
  selector: 'app-payments-page',
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
    /* On a finger a record's link in a row is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
    .unapplied {
      color: var(--slotted-tone-warning-text);
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Payments</h1></div>
            @if (canRecord()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Payment actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="recordItem">
                    <a slButtonLink data-testid="record-payment" [routerLink]="newRoute"
                      >Record payment</a
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
            <p slPageHeaderDescription data-testid="payments-description">{{ description() }}</p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Payment filters"
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
              label="Payment"
              [view]="view"
              [columns]="columns"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Payments"
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
            <ng-template slDataGridCell="paymentNumber" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[route, row.id]"
                [title]="row.paymentNumber"
              >
                {{ row.paymentNumber }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="tone(row)">{{ word(row) }}</span>
            </ng-template>
            <ng-template slDataGridCell="customerName" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="['/crm/customers', row.customerId]"
                [title]="row.customerName"
              >
                {{ row.customerName }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="unappliedAmount" let-row="row">
              @if (row.unappliedAmount.minor > 0) {
                <span
                  class="cell-text unapplied"
                  [title]="money(row.unappliedAmount) + ' unapplied'"
                  >{{ money(row.unappliedAmount) }}</span
                >
              }
            </ng-template>
            <ng-template slDataGridCell="invoiceNumbers" let-row="row">
              <span class="cell-text" [title]="row.invoiceNumbers.join(', ')">{{
                row.invoiceNumbers.join(', ')
              }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Payment pages"
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
      <ng-template #recordItem>
        <a slMenuItem [routerLink]="newRoute">Record payment</a>
      </ng-template>
    </div>
  `,
})
export class PaymentsPage {
  readonly store = inject(PaymentsStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route$ = inject(ActivatedRoute);

  readonly route = PAYMENTS_ROUTE;
  readonly newRoute = NEW_PAYMENT_ROUTE;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();
  /** A report's door, whose ids the bar shows by the words the door carries. */
  private readonly door = signal<Door | null>(null);
  readonly fields = computed(() => fieldsWithDoor(paymentFilterFields(), FINANCE_DOOR_FIELDS, this.door()));
  readonly columns = paymentColumns();

  private readonly today = computed(() => this.session.session()?.demo.today ?? '');

  readonly canRecord = computed(() => {
    void this.session.session();
    return this.session.can('payments.record');
  });

  /** What the list holds, and who records a payment where the reader does not (PM-02). */
  readonly description = computed(() => {
    const base =
      'Payments received from customers, each in its own currency; amounts are compared in US dollars. What no invoice has taken stays unapplied as the customer’s credit.';
    return this.canRecord()
      ? base
      : `${base} Payments are recorded by holders of payments.record — ${FINANCE_HOLDERS['payments.record']}.`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} payments', countOnly: '{count} payments' };

  readonly pagerMessages = {
    range: 'Payments {start}–{end} of {count}',
    pageSize: 'Payments per page',
  };

  readonly view = listView({
    page: 'payments',
    columns: paymentColumns(),
    defaultColumnState: { hidden: ['currency', 'reference'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    let first = true;
    // The overview's cash figure opens the list on what it counted, as the bar's pills (OV-01).
    const subscription = this.route$.queryParamMap.subscribe((params) => {
      const own = paymentDoorFilter(params, this.today());
      // A report's door names its condition and its period field by field (OV-01).
      const door = own === null ? doorFilter(params, [...paymentFilterFields(), ...FINANCE_DOOR_FIELDS]) : null;
      this.door.set(door);
      const filter = own ?? door?.filter ?? null;
      if (filter !== null) {
        const query: GridQuery = {
          ...emptyQuery({ index: 0, size: this.store.page().size }),
          filter,
          sort: [{ column: 'receivedDate', direction: 'descending' }],
        };
        void this.store.load(query);
        void this.store.loadGrandTotal();
      } else if (first) void this.store.open(this.view.openingQuery);
      first = false;
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  word(row: PaymentListItem): string {
    return PAYMENT_STATUS_LABEL[row.status];
  }

  tone(row: PaymentListItem) {
    return PAYMENT_STATUS_TONE[row.status];
  }

  money(value: PaymentListItem['amount']): string {
    return formatMoney(value);
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${PAYMENTS_ROUTE}/${id}`);
  }
}
