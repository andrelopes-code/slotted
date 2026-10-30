import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
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
import { SlText } from '@slotted/angular/typography';
import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize, type GridColumn } from '@slotted/core/grid';
import type { QuoteListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { OPEN_QUOTES_QUERY, QuotesStore } from '../../core/sales/quotes.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { formatMoney, QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from '../orders/order-labels';
import { doorOnlyField, regionField, segmentField } from '../../core/backend/door';
import { listDoor } from '../list-view/list-door';

const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * The quote number has no priority and stays at every width; the rest move
 * into the rows' pop-in from the highest priority down (LP-01).
 */
const COLUMNS: readonly GridColumn<QuoteListItem>[] = [
  { id: 'quoteNumber', label: 'Quote', kind: 'text', rowHeader: true, width: 140 },
  { id: 'customerName', label: 'Customer', kind: 'text', width: 210, priority: 2 },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    options: options(QUOTE_STATUS_LABEL),
    width: 150,
    priority: 1,
    description: 'Where the quote stands between its draft and the order it becomes.',
  },
  {
    id: 'expirationDate',
    label: 'Expires',
    kind: 'date',
    width: 170,
    priority: 3,
    description: 'The days left until the customer can no longer accept the quote as written.',
  },
  { id: 'total', label: 'Total', kind: 'number', align: 'end', width: 130, priority: 4 },
  {
    id: 'grossMarginBps',
    label: 'Margin',
    kind: 'number',
    align: 'end',
    width: 128,
    priority: 5,
    description: 'Gross margin as a share of the quote total, after discounts.',
  },
  { id: 'lineCount', label: 'Lines', kind: 'number', align: 'end', width: 90, priority: 7 },
  { id: 'ownerName', label: 'Owner', kind: 'text', width: 170, priority: 6 },
  {
    id: 'createdBusinessDate',
    label: 'Written',
    kind: 'date',
    width: 140,
    priority: 8,
    description: 'The business date the quote was first written.',
  },
];

const HIDDEN_COLUMN_IDS = ['lineCount', 'ownerName', 'createdBusinessDate'];

export const QUOTE_FILTER_FIELDS: readonly FilterBarField[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'set',
    options: options(QUOTE_STATUS_LABEL),
    pinned: true,
    operators: ['anyOf'],
  },
  { key: 'customerName', label: 'Customer', kind: 'text', operators: ['contains'] },
  { key: 'ownerName', label: 'Owner', kind: 'text', operators: ['contains'] },
  { key: 'daysToExpiry', label: 'Days to expiry', kind: 'number', pinned: true },
  { key: 'expirationDate', label: 'Expires', kind: 'date' },
  { key: 'total', label: 'Total', kind: 'number' },
  { key: 'grossMarginBps', label: 'Margin %', kind: 'number' },
  { key: 'createdBusinessDate', label: 'Written', kind: 'date' },
  regionField('Customer') as FilterBarField,
  segmentField('Customer') as FilterBarField,
];

/** What a report's door may name that the bar has no list of: offered while the door names it. */
export const QUOTE_DOOR_FIELDS: readonly FilterBarField[] = [doorOnlyField('ownerId', 'Owned by') as FilterBarField];

/**
 * The quotes of the tenant. What a sales operator reads here is which ones
 * are about to expire and which ones are waiting on the customer, so the
 * expiry is a sentence rather than a date alone.
 */
@Component({
  selector: 'app-quotes-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButtonLink,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridFooter,
    SlFilterBar,
    SlFilterBarEnd,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
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
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    ListViewTools,
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Quotes</h1></div>
            @if (session.can('quotes.create')) {
              <!-- In the compact class the toolbar keeps the action on the title row, or folds it into its menu. -->
              <div slPageHeaderActions>
                <div slToolbar aria-label="Quote actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink routerLink="/sales/quotes/new">New quote</a>
                  </div>
                  <sl-toolbar-overflow />
                </div>
              </div>
            }
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Quote filters"
            shortcut="/"
            [fields]="door.fields()"
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
              label="Quote"
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
            aria-label="Quotes"
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
            <ng-template slDataGridCell="quoteNumber" let-row="row">
              <a
                slLink
                class="cut"
                variant="neutral"
                underline="hover"
                [routerLink]="store.routeFor(row.id)"
                [title]="row.quoteNumber"
              >
                {{ row.quoteNumber }}
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
              <span slBadge variant="soft" size="sm" [tone]="statusTone(row)">
                {{ status(row) }}
              </span>
            </ng-template>
            <!-- A date the reader has to subtract from today is a date they read twice. -->
            <ng-template slDataGridCell="expirationDate" let-row="row">
              <span slInline [gap]="2" wrap="nowrap">
                <span slText size="sm" [tone]="expiryTone(row)">{{ expiry(row) }}</span>
              </span>
            </ng-template>
            <ng-template slDataGridCell="total" let-row="row">{{ money(row) }}</ng-template>
            <ng-template slDataGridCell="grossMarginBps" let-row="row">
              {{ margin(row) }}
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Quote pages"
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
      <ng-template #newItem>
        <a slMenuItem routerLink="/sales/quotes/new">New quote</a>
      </ng-template>
    </div>
  `,
})
export class QuotesPage {
  readonly store = inject(QuotesStore);
  readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly columns = COLUMNS;
  readonly pageSizes = LIST_PAGE_SIZES;
  /** The compact size class: the pager leaves its page size at the default. */
  readonly phone = phoneSignal();

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} quotes', countOnly: '{count} quotes' };
  readonly pagerMessages = {
    range: '{count, plural, =0 {No quotes} other {Quotes {start}–{end} of {count}}}',
    pageSize: 'Quotes per page',
  };

  /** The reader's arrangement and density, kept in the browser; the query is the store's. */
  readonly view = listView({
    page: 'quotes',
    columns: COLUMNS,
    defaultColumnState: { hidden: [...HIDDEN_COLUMN_IDS] },
    query: this.store.query,
    defaultQuery: OPEN_QUOTES_QUERY,
    applyQuery: (query) => void this.store.load(query),
  });

  /** A report's door opens the list on its condition and period, as the bar's pills (OV-01). */
  readonly door = listDoor({
    fields: () => QUOTE_FILTER_FIELDS,
    doorOnly: QUOTE_DOOR_FIELDS,
    open: (filter, first) => {
      if (filter !== null) {
        void this.store.load({ ...emptyQuery({ index: 0, size: this.store.page().size }), filter });
        void this.store.loadGrandTotal();
      } else if (first) void this.store.open(this.view.openingQuery);
    },
  });

  status(row: QuoteListItem): string {
    return QUOTE_STATUS_LABEL[row.status] ?? row.status;
  }

  statusTone(row: QuoteListItem): 'secondary' | 'accent' | 'warning' | 'success' | 'danger' {
    return QUOTE_STATUS_TONE[row.status] ?? 'secondary';
  }

  money(row: QuoteListItem): string {
    return formatMoney(row.total);
  }

  margin(row: QuoteListItem): string {
    return `${Math.round(row.grossMarginBps / 100)}%`;
  }

  /** The expiry as the operator reads it: days, not a date to subtract. */
  expiry(row: QuoteListItem): string {
    const days = row.daysToExpiry;
    if (row.status === 'converted' || row.status === 'rejected' || row.status === 'cancelled')
      return '—';
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `${days} days left`;
  }

  expiryTone(row: QuoteListItem): 'default' | 'muted' | 'danger' | 'warning' {
    if (row.status === 'converted' || row.status === 'rejected' || row.status === 'cancelled')
      return 'muted';
    if (row.daysToExpiry < 0) return 'danger';
    if (row.daysToExpiry <= 7) return 'warning';
    return 'default';
  }

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
