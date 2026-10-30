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
import { SlMenuItem } from '@slotted/angular/menu';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize } from '@slotted/core/grid';
import type { ProductListItem } from '@slotted/demo-nexora-backend';

import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import { CategoriesStore } from '../../core/catalog/categories.store';
import {
  CATEGORIES_ROUTE,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  SKUS_ROUTE,
} from '../../core/catalog/catalog.model';
import { ProductsStore } from '../../core/catalog/products.store';
import { phoneSignal } from '../../core/layout/phone';
import {
  PRODUCT_COLUMNS,
  PRODUCT_FILTER_FIELDS,
  PRODUCT_HIDDEN_BY_DEFAULT,
} from './product-columns';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';

/**
 * The products of the catalogue, or of one place in it. A product is the
 * header of a family; what a warehouse counts and an order buys is the SKU,
 * which is its own list at `/catalog/skus` with the thirteen stock filters
 * `GET /skus` offers and a product has none of (BR-04).
 */
@Component({
  selector: 'app-products-page',
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
                    <span slBreadcrumbPage>All products</span>
                  } @else {
                    <a slBreadcrumbLink routerLink="/catalog/products">All products</a>
                  }
                </li>
                @for (step of trail(); track step.id; let last = $last) {
                  <li slBreadcrumbItem>
                    @if (last) {
                      <span slBreadcrumbPage>{{ step.name }}</span>
                    } @else {
                      <a
                        slBreadcrumbLink
                        routerLink="/catalog/products"
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
                <div slToolbarItem [slToolbarItemCounterpart]="skusItem">
                  <a
                    slButtonLink
                    variant="outline"
                    tone="secondary"
                    [routerLink]="skusRoute"
                    [queryParams]="skuParams()"
                  >
                    SKUs
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
            aria-label="Product filters"
            shortcut="/"
            [fields]="fields"
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
              label="Product"
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
            aria-label="Products"
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
            <ng-template slDataGridCell="name" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="store.routeFor(row.id)"
                [title]="row.name"
              >
                {{ row.name }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="status" let-row="row">
              <span slBadge variant="soft" size="sm" [tone]="statusTone(row)">{{ statusLabel(row) }}</span>
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Product pages"
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
      <ng-template #skusItem>
        <a slMenuItem [routerLink]="skusRoute" [queryParams]="skuParams()">SKUs</a>
      </ng-template>
      <ng-template #categoriesItem>
        <a slMenuItem [routerLink]="categoriesRoute">Categories</a>
      </ng-template>
    </div>
  `,
})
export class ProductsPage {
  readonly store = inject(ProductsStore);
  readonly categories = inject(CategoriesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly columns = PRODUCT_COLUMNS;
  readonly fields = PRODUCT_FILTER_FIELDS;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly categoriesRoute = CATEGORIES_ROUTE;
  readonly skusRoute = SKUS_ROUTE;
  readonly phone = phoneSignal();

  /** The path from the catalogue's root to the place the list stands in. */
  readonly trail = computed(() => this.store.category()?.trail ?? []);
  readonly heading = computed(() => this.store.category()?.name ?? 'Products');
  /** The other grain of the same concept keeps the place the reader is in (BR-04). */
  readonly skuParams = computed(() => {
    const id = this.store.categoryId();
    return id === null ? {} : { category: id };
  });

  /** What the list covers, and how the place's count relates to the catalogue's. */
  readonly scope = computed(() => {
    const node = this.store.category();
    const tenant = this.categories.productCount();
    if (node === null)
      return 'Every product in the catalogue. A product is the header of a family; what a warehouse counts and an order buys is its SKU.';
    const under = this.store.categoriesUnder();
    const held = node.treeCount.toLocaleString('en-US');
    const place =
      under === 0
        ? `${node.name}, which has no subcategory`
        : `${node.name} and the ${under} ${under === 1 ? 'category' : 'categories'} under it`;
    const all = tenant > 0 ? `, of ${tenant.toLocaleString('en-US')} in the catalogue` : '';
    const filed =
      node.ownCount > 0 && under > 0
        ? ` ${node.ownCount.toLocaleString('en-US')} of them are filed on ${node.name} itself.`
        : '';
    return `${held} products are filed in ${place}${all}.${filed}`;
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} products', countOnly: '{count} products' };

  readonly pagerMessages = {
    range: 'Products {start}–{end} of {count}',
    pageSize: 'Products per page',
  };

  /** The reader's arrangement and density, kept in the browser; the query is the store's. */
  readonly view = listView({
    page: 'products',
    columns: PRODUCT_COLUMNS,
    defaultColumnState: { hidden: [...PRODUCT_HIDDEN_BY_DEFAULT] },
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

  statusLabel(row: ProductListItem): string {
    return PRODUCT_STATUS_LABEL[row.status] ?? row.status;
  }

  statusTone(row: ProductListItem): 'secondary' | 'success' | 'warning' {
    return PRODUCT_STATUS_TONE[row.status] ?? 'secondary';
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
