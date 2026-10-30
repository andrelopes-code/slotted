import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  SlActionBar,
  SlActionBarAction,
  SlActionBarActions,
  SlActionBarOverflow,
  SlActionBarSeparator,
  SlActionBarStatus,
} from '@slotted/angular/action-bar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody, SlPageFooter } from '@slotted/angular/page';
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
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { CustomerListItem } from '@slotted/demo-nexora-backend';

import { CUSTOMER_PAGE_SIZE, CUSTOMER_PAGE_SIZES } from '../../core/crm/customers-query';
import { CustomersStore, type BulkOutcome } from '../../core/crm/customers.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import {
  CUSTOMER_COLUMNS,
  CUSTOMER_FILTER_FIELDS,
  HEALTH_LABEL,
  HEALTH_STATUS,
  STATUS_LABEL,
  STATUS_TONE,
} from './customer-columns';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { HoldDialog } from './hold-dialog';

@Component({
  selector: 'app-customers-page',
  imports: [
    RouterLink,
    SlActionBar,
    SlActionBarAction,
    SlActionBarActions,
    SlActionBarOverflow,
    SlActionBarSeparator,
    SlActionBarStatus,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridFooter,
    SlFilterBar,
    SlFilterBarEnd,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageFooter,
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
    SlStatusIndicator,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    HoldDialog,
    ListViewTools,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* The bar and the grid share the body's column; the grid takes what the bar leaves. */
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
     * A cell template replaces the family's value span, and with it the
     * column's truncate rule; the name is the link, so the link truncates
     * and the whole name stays in its title.
     */
    .customer-name {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .selection-count {
      display: inline-flex;
      align-items: center;
      gap: var(--slotted-space-3);
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Customers</h1></div>
            @if (session.can('customers.create')) {
              <!-- In the compact class the toolbar keeps the action on the title row, or folds it into its menu. -->
              <div slPageHeaderActions>
                <div slToolbar aria-label="Customer actions" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="newItem">
                    <a slButtonLink routerLink="/crm/customers/new">New customer</a>
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
            aria-label="Customer filters"
            shortcut="/"
            [fields]="fields"
            [value]="store.filter()"
            (valueChangeRequest)="filterRequest($event)"
            [query]="store.search()"
            (queryChangeRequest)="store.setSearch($event.value)"
            [count]="store.total() ?? undefined"
            [total]="store.grandTotal() ?? undefined"
            [loading]="store.loading()"
          >
            <!--
              The bar's end holds what acts on the view (LP-02): the reader's
              saved views, the columns and the density. One control answers
              "view" on this screen, as on every list.
            -->
            <app-list-view-tools
              slFilterBarEnd
              #tools
              label="Customer"
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
            aria-label="Customers"
            rowKey="id"
            variant="framed"
            selectionMode="multiple"
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
            [value]="store.selected()"
            (valueChangeRequest)="select($event.value)"
            [showRange]="false"
            (retry)="store.reload()"
            (activate)="open($event.key)"
          >
            <ng-template slDataGridCell="displayName" let-row="row">
              <a
                slLink
                class="customer-name"
                variant="neutral"
                underline="hover"
                [routerLink]="store.routeFor(row.id)"
                [title]="row.displayName"
              >
                {{ row.displayName }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="statusTone(row)">{{ statusLabel(row) }}</span>
            </ng-template>
            <ng-template slDataGridCell="health" let-row="row">
              <span slStatusIndicator size="sm" [status]="healthStatus(row)">
                {{ healthLabel(row) }}
              </span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Customer pages"
              [count]="store.total() ?? 0"
              [page]="store.page().index + 1"
              [pageSize]="store.page().size"
              [pageSizeOptions]="pageSizes"
              [loading]="store.loading()"
              (pageChange)="goTo($event.value)"
              (pageSizeChange)="resize($event.value)"
            >
              <!-- A phone's footer is the range and the two triggers; the page size stays at the default. -->
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
      <!-- The bar a selection brings, on the ground the page footer already paints. -->
      <footer
        slPageFooter
        aria-label="Actions on the selection"
        [open]="store.selected().length > 0"
      >
        <div slActionBar variant="plain" aria-label="Selection">
          <div slActionBarStatus>
            <span class="selection-count">
              <strong>{{ selectionLabel() }}</strong>
              <button
                slButton
                size="sm"
                variant="ghost"
                tone="secondary"
                type="button"
                (click)="store.selected.set([])"
              >
                Clear
              </button>
            </span>
          </div>
          <div slActionBarActions>
            <!-- A file is a desk's task: the phone's bar offers the mutations alone. -->
            @if (session.can('customers.export') && !phone()) {
              <div slActionBarAction [slActionBarActionCounterpart]="exportItem">
                <button
                  slButton
                  variant="ghost"
                  tone="secondary"
                  type="button"
                  (click)="grid.exportCsv({ rows: 'selected', filename: 'customers.csv' })"
                >
                  Export CSV
                </button>
              </div>
            }
            @if (session.can('customers.credit_edit')) {
              @if (session.can('customers.export') && !phone()) {
                <div slActionBarSeparator></div>
              }
              <div slActionBarAction="high" [slActionBarActionCounterpart]="releaseItem">
                <button
                  slButton
                  variant="outline"
                  type="button"
                  [loading]="store.bulkBusy()"
                  [messages]="{ loading: 'Releasing hold' }"
                  (click)="releaseHold()"
                >
                  Release hold
                </button>
              </div>
              <div slActionBarAction>
                <button
                  slButton
                  tone="danger"
                  type="button"
                  [loading]="store.bulkBusy()"
                  [messages]="{ loading: 'Placing on hold' }"
                  (click)="holdDialogOpen.set(true)"
                >
                  Place on hold
                </button>
              </div>
            }
            <sl-action-bar-overflow />
          </div>
        </div>
      </footer>
      <ng-template #newItem>
        <a slMenuItem routerLink="/crm/customers/new">New customer</a>
      </ng-template>
      <ng-template #exportItem>
        <button
          slMenuItem
          type="button"
          (click)="grid.exportCsv({ rows: 'selected', filename: 'customers.csv' })"
        >
          Export CSV
        </button>
      </ng-template>
      <ng-template #releaseItem>
        <button slMenuItem type="button" (click)="releaseHold()">Release hold</button>
      </ng-template>
      <app-hold-dialog
        [(open)]="holdDialogOpen"
        [count]="store.selected().length"
        [busy]="store.bulkBusy()"
        (confirm)="hold($event)"
      />
    </div>
  `,
})
export class CustomersPage implements OnInit {
  readonly store = inject(CustomersStore);
  readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly columns = CUSTOMER_COLUMNS;
  readonly fields = CUSTOMER_FILTER_FIELDS;
  readonly pageSizes = CUSTOMER_PAGE_SIZES;
  readonly holdDialogOpen = signal(false);
  readonly selectionLabel = computed(() => {
    const count = this.store.selected().length;
    return count === 1 ? '1 customer selected' : `${count} customers selected`;
  });

  /** The compact size class: the pager and the selection bar offer less. */
  readonly phone = phoneSignal();

  /**
   * The reader's arrangement and density, kept in the browser; the query is
   * the store's. A frame narrower than the columns moves them into the rows'
   * pop-in by priority.
   */
  readonly view = listView({
    page: 'customers',
    columns: CUSTOMER_COLUMNS,
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: CUSTOMER_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  ngOnInit(): void {
    void this.store.open(this.view.openingQuery);
  }

  statusLabel(row: CustomerListItem): string {
    return STATUS_LABEL[row.status];
  }

  statusTone(row: CustomerListItem): 'secondary' | 'accent' | 'warning' | 'success' {
    return STATUS_TONE[row.status];
  }

  healthLabel(row: CustomerListItem): string {
    return HEALTH_LABEL[row.health];
  }

  healthStatus(row: CustomerListItem): 'success' | 'warning' | 'danger' {
    return HEALTH_STATUS[row.health];
  }

  filterRequest(request: { value: FilterGroup | null }): void {
    void this.store.setFilter(request.value);
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  select(value: string | readonly string[] | null): void {
    this.store.selected.set(value === null ? [] : typeof value === 'string' ? [value] : value);
  }

  open(id: string): void {
    void this.router.navigateByUrl(this.store.routeFor(id));
  }

  async hold(reason: string): Promise<void> {
    const outcome = await this.store.hold(reason);
    this.holdDialogOpen.set(false);
    this.report(outcome, 'placed on hold');
  }

  async releaseHold(): Promise<void> {
    this.report(await this.store.releaseHold(), 'released from hold');
  }

  /** One sentence for what was done; one per customer the backend refused, with its reason. */
  private report(outcome: BulkOutcome, verb: string): void {
    const done = outcome.done.length;
    if (done > 0) {
      this.toasts.show({
        title: done === 1 ? `1 customer ${verb}` : `${done} customers ${verb}`,
        tone: outcome.failed.length > 0 ? 'warning' : 'success',
        ...(outcome.failed.length > 0
          ? { description: `${outcome.failed.length} could not be: they stay selected.` }
          : {}),
      });
    }
    for (const failure of outcome.failed.slice(0, 3)) {
      this.toasts.show({ title: failure.name, description: failure.message, tone: 'danger' });
    }
  }
}
