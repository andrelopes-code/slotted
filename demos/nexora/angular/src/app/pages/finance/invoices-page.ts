import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlSkeleton } from '@slotted/angular/skeleton';
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
import {
  emptyQuery,
  withPageIndex,
  withPageSize,
  type GridQuery,
  type SortKey,
} from '@slotted/core/grid';
import type { InvoiceListItem } from '@slotted/demo-nexora-backend';

import { doorFilter, fieldsWithDoor, type Door } from '../../core/backend/door';
import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { NEXORA_BACKEND } from '../../core/backend/nexora-backend.provider';
import { TransportHealth } from '../../core/backend/transport-health';
import {
  CREDIT_MEMOS_ROUTE,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  INVOICES_ROUTE,
  invoiceDoorFilter,
} from '../../core/finance/finance.model';
import { InvoicesStore } from '../../core/finance/invoices.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { FINANCE_DOOR_FIELDS, invoiceColumns, invoiceFilterFields } from './finance-columns';

/** The order a door's rows are read in: what is most late, most owed or soonest due first. */
function doorSort(params: { get(name: string): string | null }): SortKey[] {
  if (params.get('collection') === 'overdue')
    return [{ column: 'daysOverdue', direction: 'descending' }];
  if (params.get('due') === 'soon') return [{ column: 'dueDate', direction: 'ascending' }];
  return [{ column: 'outstanding', direction: 'descending' }];
}

/**
 * Invoices (§13, §66). The list reads every invoice the reader's role may read
 * — a representative and a support agent read them all, as they read every
 * order (§55.5) — with the composite status of §66.2 beside the axes it is
 * made of. The overview's figures open it with their condition as the bar's own
 * pills (OV-01), and the page says how many are overdue, with the same door.
 */
@Component({
  selector: 'app-invoices-page',
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
    SlSkeleton,
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
      /* The door's line is a touch target tall in both states, so the count lands without moving the list. */
      .door-line {
        display: flex;
        align-items: center;
        min-block-size: var(--slotted-target-comfortable);
      }
      .door-line a {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Invoices</h1></div>
            @if (canReadCredits()) {
              <div slPageHeaderActions>
                <div slToolbar aria-label="Invoice actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="creditsItem">
                    <a
                      slButtonLink
                      variant="outline"
                      tone="secondary"
                      data-testid="credit-memos"
                      [routerLink]="creditMemosRoute"
                      >Credit memos</a
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
            <p slPageHeaderDescription data-testid="invoices-description">
              Every customer’s invoices, each in the currency it is written in; amounts are compared
              in US dollars.
            </p>
            <!-- The door has a line of its own in both states, so nothing moves when its count lands. -->
            <p slPageHeaderDescription class="door-line" data-testid="overdue-line">
              @if (overdue() === null) {
                <span slSkeleton shape="text" inlineSize="9rem"></span>
              } @else if (overdue() === -1) {
                The overdue count did not arrive; the list below is complete.
              } @else if (overdue() === 0) {
                No invoice is overdue.
              } @else {
                <a
                  slLink
                  data-testid="overdue-door"
                  [routerLink]="[]"
                  [queryParams]="{ collection: 'overdue' }"
                >
                  {{ overdue()!.toLocaleString('en-US') }}
                  {{ overdue() === 1 ? 'is' : 'are' }} overdue
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
            aria-label="Invoice filters"
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
              label="Invoice"
              [view]="view"
              [columns]="columns()"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Invoices"
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
            <ng-template slDataGridCell="invoiceNumber" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[route, row.id]"
                [title]="row.invoiceNumber ?? 'Draft invoice'"
              >
                {{ row.invoiceNumber ?? 'Draft' }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="displayStatus" let-row="row">
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
            <ng-template slDataGridCell="orderNumber" let-row="row">
              @if (row.sourceOrderId && row.orderNumber) {
                <a
                  slLink
                  class="cell-text"
                  variant="neutral"
                  underline="hover"
                  [routerLink]="['/sales/orders', row.sourceOrderId]"
                  [title]="row.orderNumber"
                >
                  {{ row.orderNumber }}
                </a>
              }
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Invoice pages"
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
      <ng-template #creditsItem>
        <a slMenuItem [routerLink]="creditMemosRoute">Credit memos</a>
      </ng-template>
    </div>
  `,
})
export class InvoicesPage {
  readonly store = inject(InvoicesStore);
  private readonly session = inject(SessionStore);
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly router = inject(Router);
  private readonly route$ = inject(ActivatedRoute);

  readonly route = INVOICES_ROUTE;
  readonly creditMemosRoute = CREDIT_MEMOS_ROUTE;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();
  /** A report's door, whose ids the bar shows by the words the door carries. */
  private readonly door = signal<Door | null>(null);
  readonly fields = computed(() => fieldsWithDoor(invoiceFilterFields(), FINANCE_DOOR_FIELDS, this.door()));
  /** Overdue invoices in the tenant, for the door in the description; null before the answer, -1 when none came. */
  readonly overdue = signal<number | null>(null);

  private readonly can = (permission: string): boolean => {
    void this.session.session();
    return this.session.can(permission);
  };
  private readonly today = computed(() => this.session.session()?.demo.today ?? '');

  readonly canReadCredits = computed(() => this.can('credit_memos.view'));
  readonly columns = computed(() => invoiceColumns(this.can, this.today()));

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} invoices', countOnly: '{count} invoices' };

  readonly pagerMessages = {
    range: 'Invoices {start}–{end} of {count}',
    pageSize: 'Invoices per page',
  };

  readonly view = listView({
    page: 'invoices',
    columns: invoiceColumns(() => true, ''),
    defaultColumnState: { hidden: ['updatedAt', 'currency', 'paymentTermsCode', 'issueDate'] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    let first = true;
    // A door opens the list on its condition, as the bar's own pills (OV-01); the same door
    // followed from this page's own description reads the list again.
    const subscription = this.route$.queryParamMap.subscribe((params) => {
      const opened = this.openDoor(params);
      if (first && !opened) void this.store.open(this.view.openingQuery);
      first = false;
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    void this.countOverdue();
  }

  /** Loads the door the address names, if it names one; says whether it did. */
  private openDoor(params: { get(name: string): string | null }): boolean {
    const own = invoiceDoorFilter(params, this.today());
    // A report's door names its condition and its period field by field (OV-01).
    const door = own === null ? doorFilter(params, [...invoiceFilterFields(), ...FINANCE_DOOR_FIELDS]) : null;
    this.door.set(door);
    const filter = own ?? door?.filter ?? null;
    if (filter === null) return false;
    const query: GridQuery = {
      ...emptyQuery({ index: 0, size: this.store.page().size }),
      filter,
      sort: own === null ? [] : doorSort(params),
    };
    void this.store.load(query);
    void this.store.loadGrandTotal();
    return true;
  }

  private async countOverdue(): Promise<void> {
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () =>
        api.finance.invoices.list({
          pageSize: LIST_PAGE_SIZE,
          filter: { collectionState: { in: ['overdue'] } },
        }),
      null,
    );
    // -1: the count did not arrive (a 503), which the line says rather than waiting on it.
    this.overdue.set(answer ? answer.page.totalItems : -1);
  }

  word(row: InvoiceListItem): string {
    return INVOICE_STATUS_LABEL[row.displayStatus];
  }

  tone(row: InvoiceListItem) {
    return INVOICE_STATUS_TONE[row.displayStatus];
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(id: string): void {
    void this.router.navigateByUrl(`${INVOICES_ROUTE}/${id}`);
  }
}
