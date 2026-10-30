import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
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
  SlPageHeaderBreadcrumbs,
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
import { SlText } from '@slotted/angular/typography';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { SkuListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { CategoriesStore } from '../../core/catalog/categories.store';
import {
  CATEGORIES_ROUTE,
  formatQuantity,
  PRODUCTS_ROUTE,
  SKU_STATUS_LABEL,
  SKU_STATUS_TONE,
} from '../../core/catalog/catalog.model';
import { SkusStore } from '../../core/catalog/skus.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import { SKU_HIDDEN_BY_DEFAULT, skuColumns, skuFilterFields } from './sku-columns';

/**
 * The stockable items, which is what an operator asking "what is below its
 * reorder point" is looking for: `GET /skus` filters by thirteen fields a
 * product does not have, and none of them would fit the product list's bar.
 *
 * The price and the cost columns exist only where the reader may be shown
 * them. Hiding them would not do: a hidden column comes back through the
 * grid's own control, and what would come back is a cost the backend has
 * already written down to zero (PM-01).
 */
@Component({
  selector: 'app-skus-page',
  imports: [
    ListViewTools,
    RouterLink,
    SlBadge,
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
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
    SlPageHeaderBreadcrumbs,
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
    SlText,
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
    /* A cell template replaces the family's value span, and with it the column's truncate rule (LP-04). */
    /*
     * A value the page draws inside a cell states its own maximum. The
     * families that draw a name — link, text — size their box to their
     * content, and a value that never wraps makes that content one unbreakable
     * run, so the box never narrows with its column and the value is drawn
     * over the next one. The grid bounds the cell's direct child and reaches
     * no further (LP-04).
     */
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* A quantity column is read down its last digit, template or not. */
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
          <div slPageHeaderNav>
            <nav
              slBreadcrumb
              slPageHeaderBreadcrumbs
              [maxItems]="phone() ? 3 : 8"
              aria-label="Where this list stands"
            >
              <ol slBreadcrumbList>
                <li slBreadcrumbItem>
                  @if (trail().length === 0) {
                    <span slBreadcrumbPage>All SKUs</span>
                  } @else {
                    <a slBreadcrumbLink routerLink="/catalog/skus">All SKUs</a>
                  }
                </li>
                @for (step of trail(); track step.id; let last = $last) {
                  <li slBreadcrumbItem>
                    @if (last) {
                      <span slBreadcrumbPage>{{ step.name }}</span>
                    } @else {
                      <a
                        slBreadcrumbLink
                        routerLink="/catalog/skus"
                        [queryParams]="{ category: step.id }"
                      >
                        {{ step.name }}
                      </a>
                    }
                  </li>
                }
              </ol>
            </nav>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>{{ heading() }}</h1>
            </div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="Other ways into the catalogue" overflow="menu">
                <div slToolbarItem [slToolbarItemCounterpart]="productsItem">
                  <a
                    slButtonLink
                    variant="outline"
                    tone="secondary"
                    [routerLink]="productsRoute"
                    [queryParams]="productParams()"
                  >
                    Products
                  </a>
                </div>
                <div slToolbarItem [slToolbarItemCounterpart]="categoriesItem">
                  <a slButtonLink variant="ghost" tone="secondary" [routerLink]="categoriesRoute">
                    Categories
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
            aria-label="SKU filters"
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
              label="SKU"
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
          @if (!canSeePricing()) {
            <div slInlineMessage tone="secondary">
              <span slInlineMessageIcon></span>
              Prices are not on this list: they need pricing.view, which your role does not hold.
            </div>
          }
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="SKUs"
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
            <ng-template slDataGridCell="sku" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="store.routeFor(row.id)"
                [title]="row.sku + ' · ' + row.name"
              >
                {{ row.sku }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="statusTone(row)">{{ statusLabel(row) }}</span>
            </ng-template>
            <ng-template slDataGridCell="available" let-row="row">
              <span class="cell-quantity" [class.short]="short(row)" [title]="availableTitle(row)">
                {{ quantity(row.available) }}
              </span>
            </ng-template>
            <ng-template slDataGridCell="belowReorderPoint" let-row="row">
              @if (row.belowReorderPoint) {
                <span slBadge variant="soft" tone="warning" size="sm">Below point</span>
              } @else {
                <span slText size="sm" tone="muted">—</span>
              }
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="SKU pages"
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
      <ng-template #productsItem>
        <a slMenuItem [routerLink]="productsRoute" [queryParams]="productParams()">Products</a>
      </ng-template>
      <ng-template #categoriesItem>
        <a slMenuItem [routerLink]="categoriesRoute">Categories</a>
      </ng-template>
    </div>
  `,
})
export class SkusPage {
  readonly store = inject(SkusStore);
  readonly session = inject(SessionStore);
  readonly categories = inject(CategoriesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageSizes = LIST_PAGE_SIZES;
  readonly categoriesRoute = CATEGORIES_ROUTE;
  readonly productsRoute = PRODUCTS_ROUTE;
  readonly phone = phoneSignal();

  readonly canSeePricing = computed(() => {
    void this.session.session();
    return this.session.can('pricing.view');
  });
  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });

  /** The model is read from the permissions, so an absent value has no column and no pill. */
  readonly columns = computed(() => skuColumns((permission) => this.session.can(permission)));
  readonly fields = computed(() => skuFilterFields((permission) => this.session.can(permission)));

  readonly trail = computed(() => this.store.category()?.trail ?? []);
  readonly heading = computed(() => this.store.category()?.name ?? 'SKUs');
  readonly productParams = computed(() => {
    const id = this.store.categoryId();
    return id === null ? {} : { category: id };
  });

  readonly scope = computed(() => {
    const node = this.store.category();
    const place = node === null ? 'the catalogue' : node.name;
    const under = this.store.categoriesUnder();
    const covers =
      node === null || under === 0
        ? ''
        : ` and the ${under} ${under === 1 ? 'category' : 'categories'} under it`;
    return `Every stockable item in ${place}${covers}: what a warehouse counts, what an order line buys and what a price list prices. A product groups them.`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} SKUs', countOnly: '{count} SKUs' };

  readonly pagerMessages = {
    range: 'SKUs {start}–{end} of {count}',
    pageSize: 'SKUs per page',
  };

  /**
   * The reader's arrangement and density, kept in the browser; the query is
   * the store's. The view is read against every column the list can draw: a
   * reader who gains pricing.view finds the price where they left it.
   */
  readonly view = listView({
    page: 'skus',
    columns: skuColumns(() => true),
    defaultColumnState: { hidden: [...SKU_HIDDEN_BY_DEFAULT] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    let opened: string | null | undefined;
    this.route.queryParamMap.subscribe((params) => {
      const category = params.get('category');
      if (opened !== undefined && category === opened) return;
      /* The visit's first read may start from the reader's saved view; a later place does not. */
      const initial = opened === undefined ? this.view.openingQuery : null;
      opened = category;
      void this.store.openIn(category, initial);
    });
  }

  statusLabel(row: SkuListItem): string {
    return SKU_STATUS_LABEL[row.status] ?? row.status;
  }

  statusTone(row: SkuListItem): 'secondary' | 'success' | 'warning' {
    return SKU_STATUS_TONE[row.status] ?? 'secondary';
  }

  quantity(value: string): string {
    return formatQuantity(value);
  }

  /** Nothing a warehouse can promise today: the fact a stock list is read for. */
  short(row: SkuListItem): boolean {
    return Number(row.available) <= 0;
  }

  availableTitle(row: SkuListItem): string {
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

  open(id: string): void {
    void this.router.navigateByUrl(this.store.routeFor(id));
  }
}
