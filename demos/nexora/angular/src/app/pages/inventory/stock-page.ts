import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButtonLink } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
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
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { InventoryListItem } from '@slotted/demo-nexora-backend';

import { doorFilter as reportDoor, fieldsWithDoor, type Door } from '../../core/backend/door';
import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { formatQuantity } from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import {
  MOVEMENTS_ROUTE,
  OVERVIEW_ROUTE,
  positionLink,
} from '../../core/inventory/inventory.model';
import { PositionsStore } from '../../core/inventory/positions.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import {
  doorFilter,
  STOCK_DOOR_FIELDS,
  STOCK_HIDDEN_BY_DEFAULT,
  stockColumns,
  stockFilterFields,
} from './stock-columns';

/**
 * The stock positions, one SKU in one warehouse per row: the list an operator
 * asks "what is below its reorder point in CHI-01" of. It is a destination of
 * its own rather than the overview's body — the overview summarizes and
 * leads, and every one of its figures opens this list with the figure's
 * pills applied (OV-01).
 *
 * The value column exists only for a reader holding `cost.view`: the resource
 * fills `onHandValue` for every reader, so it is left out of the model rather
 * than hidden in it (PM-01), and the list says so once (PM-02).
 */
@Component({
  selector: 'app-stock-page',
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
    SlInlineMessage,
    SlInlineMessageIcon,
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
    /* A value the page draws in a cell states its cut, its title and its maximum (LP-04). */
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cell-quantity {
      display: block;
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    .short {
      color: var(--slotted-tone-danger-text);
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Stock</h1></div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="Other ways into the inventory" overflow="menu">
                <div slToolbarItem [slToolbarItemCounterpart]="overviewItem">
                  <a slButtonLink variant="outline" tone="secondary" [routerLink]="overviewRoute">
                    Overview
                  </a>
                </div>
                <div slToolbarItem [slToolbarItemCounterpart]="ledgerItem">
                  <a slButtonLink variant="ghost" tone="secondary" [routerLink]="movementsRoute">
                    Movements
                  </a>
                </div>
                <sl-toolbar-overflow />
              </div>
            </div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>{{ scope() }}</p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Stock filters"
            shortcut="/"
            [fields]="fields()"
            [value]="store.filter()"
            (valueChangeRequest)="setFilter($event.value)"
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
              label="Stock"
              [view]="view"
              [columns]="columns()"
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
          @if (!canSeeCost()) {
            <div slInlineMessage tone="secondary" data-testid="cost-note">
              <span slInlineMessageIcon></span>
              Stock value is not on this list: it needs cost.view, which a sales manager, a buyer or
              an auditor holds.
            </div>
          }
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Stock positions"
            rowKey="key"
            variant="framed"
            activatable
            [rows]="rows()"
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
            <ng-template slDataGridCell="skuCode" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="link(row).path"
                [queryParams]="link(row).queryParams"
                [title]="row.skuCode + ' · ' + row.skuName + ' in ' + row.warehouseCode"
              >
                {{ row.skuCode }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="available" let-row="row">
              <span
                class="cell-quantity"
                [class.short]="nothing(row)"
                [title]="availableTitle(row)"
              >
                {{ quantity(row.available) }}
              </span>
            </ng-template>
            <ng-template slDataGridCell="health" let-row="row">
              @if (row.belowSafetyStock) {
                <span slBadge variant="soft" tone="danger" size="sm">Below safety</span>
              } @else if (row.belowReorderPoint) {
                <span slBadge variant="soft" tone="warning" size="sm">Below reorder point</span>
              }
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Stock pages"
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
      <ng-template #overviewItem>
        <a slMenuItem [routerLink]="overviewRoute">Overview</a>
      </ng-template>
      <ng-template #ledgerItem>
        <a slMenuItem [routerLink]="movementsRoute">Movements</a>
      </ng-template>
    </div>
  `,
})
export class StockPage {
  readonly store = inject(PositionsStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageSizes = LIST_PAGE_SIZES;
  readonly overviewRoute = OVERVIEW_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly phone = phoneSignal();

  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });

  /** A position has no id of its own: the SKU and the warehouse name it. */
  readonly rows = computed(() =>
    this.store.rows().map((row) => ({ ...row, key: `${row.skuId}~${row.warehouseId}` })),
  );

  readonly columns = computed(() => stockColumns((permission) => this.session.can(permission)));
  /** A report's door, whose ids the bar shows by the words the door carries. */
  private readonly door = signal<Door | null>(null);
  private readonly ownFields = computed(() =>
    stockFilterFields((permission) => this.session.can(permission), this.warehouses.inScope()),
  );
  readonly fields = computed(() => fieldsWithDoor(this.ownFields(), STOCK_DOOR_FIELDS, this.door()));

  readonly scope = computed(() => {
    const scope = this.warehouses.inScope();
    const where =
      scope.length === 1
        ? `${scope[0]!.code} ${scope[0]!.name}, the warehouse your role is scoped to`
        : `${scope.length} warehouses`;
    return `Every SKU held in ${where}, one row per warehouse. Quantities are in each SKU's own unit, so the list is read row by row and never added up.`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} positions', countOnly: '{count} positions' };

  readonly pagerMessages = {
    range: 'Positions {start}–{end} of {count}',
    pageSize: 'Positions per page',
  };

  readonly view = listView({
    page: 'stock',
    columns: stockColumns(() => true),
    defaultColumnState: { hidden: [...STOCK_HIDDEN_BY_DEFAULT] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    let opened = false;
    this.route.queryParamMap.subscribe((params) => {
      const own = doorFilter(params.get('exception'), params.get('warehouse'));
      // A report's door names its condition field by field (OV-01).
      const report = own === null ? reportDoor(params, [...this.ownFields(), ...STOCK_DOOR_FIELDS]) : null;
      this.door.set(report);
      const door = own ?? report?.filter ?? null;
      // A door names its pills; a plain visit may start from the reader's saved view.
      if (door !== null) {
        void this.warehouses.open();
        void this.store.load({ ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }), filter: door });
        void this.store.loadGrandTotal();
      } else if (!opened) void this.store.open(this.view.openingQuery);
      opened = true;
    });
    void this.warehouses.open();
  }

  link(row: InventoryListItem): { path: string; queryParams: Record<string, string> } {
    return positionLink(row.skuId, row.warehouseId);
  }

  quantity(value: string): string {
    return formatQuantity(value);
  }

  nothing(row: InventoryListItem): boolean {
    return Number(row.available) <= 0;
  }

  availableTitle(row: InventoryListItem): string {
    const unit = row.unitOfMeasure;
    return `${row.available} ${unit} available · ${row.onHand} ${unit} on hand · ${row.reserved} ${unit} reserved · ${row.inbound} ${unit} inbound`;
  }

  setFilter(value: FilterGroup | null): void {
    void this.store.setFilter(value);
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }

  open(key: string): void {
    const [skuId, warehouseId] = key.split('~');
    const link = positionLink(skuId!, warehouseId);
    void this.router.navigate([link.path], { queryParams: link.queryParams });
  }
}
