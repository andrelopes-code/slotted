import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
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
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, type GridColumn, type GridQuery } from '@slotted/core/grid';

import {
  CONTACT_ACCOUNT_PAGE_SIZES,
  ContactsStore,
  type ContactRow,
} from '../../core/crm/contacts.store';
import { phoneSignal } from '../../core/layout/phone';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';

/**
 * The name has no priority and stays at every width; the rest move into the
 * rows' pop-in from the highest priority down (LP-01).
 */
const COLUMNS: readonly GridColumn<ContactRow>[] = [
  { id: 'displayName', label: 'Contact', kind: 'text', rowHeader: true, width: 200 },
  { id: 'customerName', label: 'Account', kind: 'text', width: 200, priority: 1 },
  { id: 'title', label: 'Role', kind: 'text', width: 170, priority: 4 },
  { id: 'email', label: 'E-mail', kind: 'text', width: 250, priority: 3 },
  {
    id: 'phone',
    label: 'Phone',
    kind: 'text',
    width: 150,
    priority: 5,
    description: 'The office phone, or the mobile when the contact has no office phone.',
  },
  { id: 'status', label: 'Status', kind: 'set', width: 110, priority: 2 },
];

const FIELDS: readonly FilterBarField[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'set',
    pinned: true,
    operators: ['anyOf'],
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    key: 'preferredContactMethod',
    label: 'Reach by',
    kind: 'set',
    pinned: true,
    operators: ['anyOf'],
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
      { value: 'mobile', label: 'Mobile' },
    ],
  },
  {
    key: 'isPrimary',
    label: 'Primary',
    kind: 'set',
    pinned: true,
    operators: ['anyOf'],
    options: [
      { value: 'yes', label: 'Primary contact' },
      { value: 'no', label: 'Everyone else' },
    ],
  },
  { key: 'customerName', label: 'Account', kind: 'text', operators: ['contains'] },
];

/**
 * The tenant's contacts, as far as the backend can answer for them: the
 * accounts of one page, and the people on those accounts. The screen states
 * what its search covers rather than pretending to search the tenant.
 */
@Component({
  selector: 'app-contacts-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButton,
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
    SlStatusIndicator,
    ListViewTools,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * The grid takes what the bar and the two messages leave and scrolls its
     * own rows: a grid as tall as its content would scroll the page under the
     * pointer and its own scroller over it (LP-12).
     */
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
    /*
     * A value the page draws inside a cell states its own maximum. The
     * families that draw a name — link, text — size their box to their
     * content, and a value that never wraps makes that content one unbreakable
     * run, so the box never narrows with its column and the value is drawn
     * over the next one. The grid bounds the cell's direct child and reaches
     * no further (LP-04).
     */
    .contact-name {
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
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Contacts</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The people on the accounts of this page, read account by account. Open an account to
              add a contact or change one.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Contact filters"
            shortcut="/"
            [fields]="fields"
            [value]="store.filter()"
            (valueChangeRequest)="store.setFilter($event.value)"
            [query]="store.search()"
            (queryChangeRequest)="store.setSearch($event.value)"
            [messages]="countMessages"
            [count]="store.rows().length"
            [total]="store.rows().length === store.loaded().length ? undefined : store.loaded().length"
            [loading]="store.loading()"
          >
            <app-list-view-tools
              slFilterBarEnd
              #tools
              label="Contact"
              [view]="view"
              [columns]="columns"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          <!-- The screen says what its search covers: the backend answers for contacts one account at a time. -->
          <div slInlineMessage tone="secondary">
            <span slInlineMessageIcon></span>
            {{ scope() }}
          </div>
          @if (store.partial()) {
            <div slInlineMessage tone="warning">
              <span slInlineMessageIcon></span>
              <span slInline [gap]="3">
                {{ missing() }}
                <button
                  slButton
                  size="sm"
                  variant="outline"
                  tone="secondary"
                  type="button"
                  [loading]="store.loading()"
                  [messages]="{ loading: 'Reading the accounts again' }"
                  (click)="store.reload()"
                >
                  Try again
                </button>
              </span>
            </div>
          }
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Contacts"
            rowKey="id"
            mode="client"
            variant="framed"
            activatable
            [rows]="store.rows()"
            [columns]="columns"
            [(query)]="gridQuery"
            [loading]="store.loading()"
            [error]="store.error()"
            [columnState]="view.columnState()"
            (columnStateChangeRequest)="tools.arrange($event)"
            [density]="view.density()"
            manageable
            (manageColumns)="tools.manage()"
            [showRange]="false"
            (retry)="store.reload()"
            (activate)="openAccount($event.key)"
          >
            <ng-template slDataGridCell="displayName" let-row="row">
              <span slInline [gap]="2">
                <span class="contact-name" [title]="row.displayName">{{ row.displayName }}</span>
                @if (row.isPrimary) {
                  <span slBadge tone="accent" variant="soft" size="sm">Primary</span>
                }
              </span>
            </ng-template>
            <ng-template slDataGridCell="customerName" let-row="row">
              <a
                slLink
                class="contact-name"
                variant="neutral"
                underline="hover"
                [routerLink]="'/crm/customers/' + row.customerId"
                [title]="row.customerName + ' · ' + row.accountNumber"
              >
                {{ row.customerName }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="email" let-row="row">
              @if (row.email) {
                <a slLink class="contact-name" [href]="'mailto:' + row.email">{{ row.email }}</a>
              } @else {
                —
              }
            </ng-template>
            <ng-template slDataGridCell="phone" let-row="row">
              {{ row.phone ?? row.mobile ?? '—' }}
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span
                slStatusIndicator
                size="sm"
                [status]="row.status === 'active' ? 'success' : 'neutral'"
              >
                {{ row.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Account pages"
              [messages]="pagerMessages"
              [count]="store.accountTotal() ?? 0"
              [page]="store.page().index + 1"
              [pageSize]="store.page().size"
              [pageSizeOptions]="pageSizes"
              [loading]="store.loading()"
              (pageChange)="store.goTo($event.value - 1)"
              (pageSizeChange)="store.resize($event.value)"
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
export class ContactsPage implements OnInit {
  readonly store = inject(ContactsStore);
  private readonly router = inject(Router);

  readonly columns = COLUMNS;
  readonly fields = FIELDS;
  readonly pageSizes = CONTACT_ACCOUNT_PAGE_SIZES;
  /** The pager turns accounts, not contacts, and says so in its own words. */
  readonly pagerMessages = {
    range: 'Accounts {start}–{end} of {count}',
    pageSize: 'Accounts per page',
  };
  /** The compact size class: the pager leaves its page size at the default. */
  readonly phone = phoneSignal();
  /**
   * The grid's own query: it sorts and filters the rows in the browser. The
   * view reads its order, and a saved view or the Sort menu writes it back.
   */
  readonly gridQuery = signal<GridQuery>(emptyQuery());

  /**
   * Six columns do not fit the frame at 1280: the phone number is the one the
   * account is one click away from, so it starts hidden and the reader brings
   * it back through the column manager. The rows are filtered here, in the
   * browser, so a view's query is the bar's tree and search and the grid's
   * order.
   */
  readonly view = listView({
    page: 'contacts',
    columns: COLUMNS,
    defaultColumnState: { hidden: ['phone'] },
    query: computed(() => ({
      ...emptyQuery(),
      sort: this.gridQuery().sort,
      filter: this.store.filter(),
      search: this.store.search(),
    })),
    defaultQuery: emptyQuery(),
    applyQuery: (query) => {
      this.store.setFilter(query.filter);
      this.store.setSearch(query.search);
      this.gridQuery.update((current) => ({ ...current, sort: query.sort }));
    },
  });

  /** Every number on this screen says what it counts: contacts here, accounts in the pager. */
  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} contacts', countOnly: '{count} contacts' };

  /** The sentence that states the reach of this page, with the numbers of the page itself. */
  readonly scope = computed(() => {
    const accounts = this.store.accountsRead();
    const total = this.store.accountTotal();
    if (total === null) return 'Reading the accounts of this page…';
    const contacts = this.store.loaded().length;
    return `These ${contacts} people work at the ${accounts} accounts on this page. Nexora reads contacts one account at a time, so the search and the filters above read these ${contacts}; the pager turns to the next ${accounts} of ${total.toLocaleString('en-US')} accounts.`;
  });

  readonly missing = computed(() => {
    const failed = this.store.accountsFailed();
    return failed === 1
      ? '1 account did not answer, so its contacts are missing from this page.'
      : `${failed} accounts did not answer, so their contacts are missing from this page.`;
  });

  ngOnInit(): void {
    /* A first visit that opens on the reader's saved view filters the rows it reads. */
    const opening = this.view.openingQuery;
    if (opening && this.store.loaded().length === 0) {
      this.store.setFilter(opening.filter);
      this.store.setSearch(opening.search);
      this.gridQuery.update((current) => ({ ...current, sort: opening.sort }));
    }
    void this.store.open();
  }

  openAccount(key: string): void {
    const row = this.store.rows().find((contact) => contact.id === key);
    if (row) void this.router.navigateByUrl(`/crm/customers/${row.customerId}`);
  }

  setFilter(value: FilterGroup | null): void {
    this.store.setFilter(value);
  }
}
