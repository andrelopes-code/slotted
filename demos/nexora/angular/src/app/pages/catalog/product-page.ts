import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderBreadcrumbs,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSkeleton, SlSkeletonRegion, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableEmpty,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';
import type { SkuListItem } from '@slotted/demo-nexora-backend';

import {
  formatMoney,
  formatQuantity,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  PRODUCT_TAG_LABEL,
  PRODUCTS_ROUTE,
  SKU_STATUS_LABEL,
  SKU_STATUS_TONE,
  SKUS_ROUTE,
} from '../../core/catalog/catalog.model';
import { ProductStore } from '../../core/catalog/product.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';

/**
 * One product: what the family is, where it is filed, and the SKUs under it.
 *
 * The figures count records rather than summing quantities (RP-08): two SKUs
 * of one product need not be counted in one unit, and "62" over a mixture of
 * each and metres is a number of nothing.
 */
@Component({
  selector: 'app-product-page',
  imports: [
    RouterLink,
    SlBadge,
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlButton,
    SlButtonLink,
    SlGrid,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderBreadcrumbs,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlSkeletonText,
    SlStack,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardValue,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableEmpty,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTag,
    SlTagBody,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* One column that cannot grow past the frame, so a wide table scrolls itself (CP-03). */
    .body {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .short {
      color: var(--slotted-tone-danger-text);
    }
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
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <nav
                slBreadcrumb
                slPageHeaderBreadcrumbs
                [maxItems]="phone() ? 3 : 8"
                aria-label="Where this product is filed"
              >
                <ol slBreadcrumbList>
                  <li slBreadcrumbItem>
                    <a slBreadcrumbLink [routerLink]="productsRoute">All products</a>
                  </li>
                  <li slBreadcrumbItem><span slBreadcrumbPage>Product</span></li>
                </ol>
              </nav>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Product</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="error.code === 'NOT_FOUND' ? 'not-found' : 'error'"
            reach="section"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>
                {{
                  error.code === 'NOT_FOUND'
                    ? 'This product does not exist'
                    : 'The product could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ error.message }}</p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="reload()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="productsRoute">
                Back to products
              </a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.detail() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <nav
                slBreadcrumb
                slPageHeaderBreadcrumbs
                [maxItems]="phone() ? 3 : 8"
                aria-label="Where this product is filed"
              >
                <ol slBreadcrumbList>
                  <li slBreadcrumbItem>
                    <a slBreadcrumbLink [routerLink]="productsRoute">All products</a>
                  </li>
                  @for (step of store.categoryPath(); track step.id) {
                    <li slBreadcrumbItem>
                      <a
                        slBreadcrumbLink
                        [routerLink]="productsRoute"
                        [queryParams]="{ category: step.id }"
                      >
                        {{ step.name }}
                      </a>
                    </li>
                  }
                  <li slBreadcrumbItem>
                    <span slBreadcrumbPage>{{ product()?.name ?? 'Product' }}</span>
                  </li>
                </ol>
              </nav>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ product()?.name ?? 'Product' }}</h1>
                @if (product(); as p) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()">
                      <span slTagBody>{{ statusWord() }}</span>
                    </span>
                    @if (store.belowReorderCount() > 0) {
                      <span slTag size="sm" tone="warning">
                        <span slTagBody>{{ reorderMark() }}</span>
                      </span>
                    }
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every record carries its status: the mark keeps a small tag's box, on its own line on a phone as when loaded. -->
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="4rem"></span></span></span
                  ></span>
                  <!-- The line under the heading always arrives; the wait keeps its box. -->
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="20rem"></span>
                  </p>
                }
              </div>
              <!-- The category is in the breadcrumb at every width (LA-03). -->
              @if (!phone()) {
                <div slPageHeaderActions>
                  <a
                    slButtonLink
                    variant="outline"
                    tone="secondary"
                    [routerLink]="productsRoute"
                    [queryParams]="categoryParams()"
                  >
                    {{ siblingsLabel() }}
                  </a>
                </div>
              }
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (product()) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Active SKUs</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.activeCount() }}</span>
                    <p slStatCardComparison>of {{ store.skus().length }} under this product</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Nothing available</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.outOfStockCount() }}</span>
                    <p slStatCardComparison>SKUs a warehouse cannot promise today</p>
                  </div>
                </div>
                <div
                  slStatCard
                  size="sm"
                  [tone]="store.belowReorderCount() > 0 ? 'warning' : 'neutral'"
                >
                  <div slStatCardHeader><span slStatCardLabel>Below reorder point</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.belowReorderCount() }}</span>
                    <p slStatCardComparison>SKUs a buyer should look at</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Inbound</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.inboundCount() }}</span>
                    <p slStatCardComparison>SKUs with stock on its way</p>
                  </div>
                </div>
              </div>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>What it is</h2></div>
                </div>
                <div slSectionBody>
                  <div slStack [gap]="4">
                    <p slText>{{ product()!.description }}</p>
                    @if (product()!.tags.length > 0) {
                      <span slInline [gap]="2" wrap="wrap">
                        @for (tag of product()!.tags; track tag) {
                          <span slBadge variant="soft" tone="secondary" size="sm">
                            {{ tagWord(tag) }}
                          </span>
                        }
                      </span>
                    }
                    <span slText size="sm" tone="muted">{{ madeBy() }}</span>
                  </div>
                </div>
              </section>
            } @else {
              <!--
                The wait reserves the four figures and the section that always
                arrives, in the boxes they will occupy.
              -->
              <div slSkeletonRegion [messages]="{ label: 'Reading the product' }" [loading]="true">
                <div slStack [gap]="6">
                  <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                    @for (figure of figureLabels; track figure) {
                      <div slStatCard size="sm" loading>
                        <div slStatCardHeader>
                          <span slStatCardLabel>{{ figure }}</span>
                        </div>
                        <div slStatCardFigure>
                          <span slStatCardValue>—</span>
                          <!-- Every loaded card carries a comparison line; the wait reserves it. -->
                          <p slStatCardComparison>
                            <span slSkeletonText [lines]="1" lastLineSize="70%"></span>
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>What it is</h2></div>
                    </div>
                    <div slSectionBody>
                      <div slStack [gap]="4">
                        <p slSkeletonText [lines]="2"></p>
                        <span slSkeleton shape="text" inlineSize="14rem"></span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            }

            @if (!canSeePricing()) {
              <div slInlineMessage tone="secondary">
                <span slInlineMessageIcon></span>
                The list price is not on this table: it needs pricing.view, which your role does not
                hold.
              </div>
            }

            <div
              slTable
              variant="framed"
              [columns]="phone() ? 2 : columnCount()"
              [layout]="phone() ? 'fixed' : 'auto'"
            >
              <div slTableContent>
                <caption slTableCaption>
                  SKUs
                </caption>
                <thead slTableHead>
                  <tr slTableRow>
                    <th slTableColumnHeader>SKU</th>
                    <th slTableColumnHeader align="end" numeric>Available</th>
                    @if (!phone()) {
                      <th slTableColumnHeader align="end" numeric>Reserved</th>
                      <th slTableColumnHeader align="end" numeric>Inbound</th>
                      <th slTableColumnHeader>Unit</th>
                      <th slTableColumnHeader>Status</th>
                      @if (canSeePricing()) {
                        <th slTableColumnHeader align="end" numeric>List price</th>
                      }
                    }
                  </tr>
                </thead>
                @if (store.detail() === null) {
                  <tbody slTableBody>
                    @for (row of placeholderRows; track row) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slStack [gap]="1">
                            <span slSkeleton shape="text" inlineSize="60%"></span>
                            <span slSkeleton shape="text" inlineSize="80%"></span>
                          </span>
                        </th>
                        <td slTableCell align="end">
                          <span slSkeleton shape="text" inlineSize="3rem"></span>
                        </td>
                        @if (!phone()) {
                          <td slTableCell align="end">
                            <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                          </td>
                          <td slTableCell align="end">
                            <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                          </td>
                          <td slTableCell>
                            <span slSkeleton shape="text" inlineSize="2rem"></span>
                          </td>
                          <td slTableCell>
                            <span slSkeleton shape="text" inlineSize="4rem"></span>
                          </td>
                          @if (canSeePricing()) {
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="4rem"></span>
                            </td>
                          }
                        }
                      </tr>
                    }
                  </tbody>
                } @else if (store.skus().length === 0) {
                  <tbody slTableBody>
                    <tr slTableRow>
                      <td slTableEmpty>
                        <div slResultState status="empty" reach="section">
                          <div slResultStateContent>
                            <h3 slResultStateTitle>This product has no SKU</h3>
                            <p slResultStateDescription>
                              Nothing under it can be ordered or counted until one exists.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                } @else {
                  <tbody slTableBody>
                    @for (sku of store.skus(); track sku.id) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slStack [gap]="1">
                            <a
                              slLink
                              class="cell-text"
                              variant="neutral"
                              underline="hover"
                              [routerLink]="skuRoute(sku.id)"
                              [title]="sku.sku"
                            >
                              {{ sku.sku }}
                            </a>
                            <span
                              class="cell-text"
                              slText
                              size="sm"
                              tone="muted"
                              [title]="sku.name"
                            >
                              {{ sku.name }}
                            </span>
                            @if (sku.belowReorderPoint) {
                              <span slText size="sm" tone="muted">Below its reorder point</span>
                            }
                          </span>
                        </th>
                        <td slTableCell align="end" numeric>
                          <span [class.short]="short(sku)">{{ quantity(sku.available) }}</span>
                        </td>
                        @if (!phone()) {
                          <td slTableCell align="end" numeric>{{ quantity(sku.reserved) }}</td>
                          <td slTableCell align="end" numeric>{{ quantity(sku.inbound) }}</td>
                          <td slTableCell>{{ sku.unitOfMeasure }}</td>
                          <td slTableCell>
                            <span slBadge variant="soft" size="sm" [tone]="skuTone(sku)">
                              {{ skuStatus(sku) }}
                            </span>
                          </td>
                          @if (canSeePricing()) {
                            <td slTableCell align="end" numeric>{{ price(sku) }}</td>
                          }
                        }
                      </tr>
                    }
                  </tbody>
                }
              </div>
            </div>
            <span slText size="sm" tone="muted">{{ unitNote() }}</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProductPage {
  readonly store = inject(ProductStore);
  readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);

  readonly productsRoute = PRODUCTS_ROUTE;
  readonly phone = phoneSignal();
  readonly product = this.store.product;
  readonly figureLabels = ['Active SKUs', 'Nothing available', 'Below reorder point', 'Inbound'];
  /** One row: a product holds as few as one SKU, and a reservation never shrinks. */
  readonly placeholderRows = [1];

  readonly canSeePricing = computed(() => {
    void this.session.session();
    return this.session.can('pricing.view');
  });

  readonly columnCount = computed(() => (this.canSeePricing() ? 6 : 5));

  readonly statusWord = computed(() => {
    const product = this.product();
    return product === null ? '' : (PRODUCT_STATUS_LABEL[product.status] ?? product.status);
  });

  readonly statusTone = computed<'secondary' | 'success' | 'warning'>(() => {
    const product = this.product();
    return product === null ? 'secondary' : (PRODUCT_STATUS_TONE[product.status] ?? 'secondary');
  });

  readonly reorderMark = computed(() => {
    const count = this.store.belowReorderCount();
    return count === 1 ? '1 SKU to reorder' : `${count} SKUs to reorder`;
  });

  readonly subheading = computed(() => {
    const product = this.product();
    if (product === null) return '';
    const skus = this.store.skus().length;
    return [
      product.brand ?? 'No brand',
      product.categoryName,
      skus === 1 ? '1 SKU' : `${skus} SKUs`,
    ].join(' · ');
  });

  readonly madeBy = computed(() => {
    const product = this.product();
    if (product === null) return '';
    const maker = product.manufacturer ?? product.brand;
    return maker ? `Made by ${maker}.` : 'No manufacturer is recorded for this product.';
  });

  readonly categoryParams = computed(() => {
    const product = this.product();
    return product === null ? {} : { category: product.categoryId };
  });

  readonly siblingsLabel = computed(() => {
    const product = this.product();
    return product === null ? 'Category' : `More in ${product.categoryName}`;
  });

  /** A product whose SKUs are counted in more than one unit cannot have its stock summed (RP-08). */
  readonly unitNote = computed(() => {
    const units = this.store.units();
    if (units.length === 0) return '';
    return units.length === 1
      ? `Every quantity on this table is counted in ${units[0]}.`
      : `These SKUs are counted in ${units.join(', ')}, so their quantities are read one row at a time and never added.`;
  });

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      void this.store.open(id);
    });
  }

  reload(): void {
    void this.store.load();
  }

  skuRoute(id: string): string {
    return `${SKUS_ROUTE}/${id}`;
  }

  /** Nothing a warehouse can promise today, which is what the column is read for. */
  short(sku: SkuListItem): boolean {
    return Number(sku.available) <= 0;
  }

  skuStatus(sku: SkuListItem): string {
    return SKU_STATUS_LABEL[sku.status] ?? sku.status;
  }

  skuTone(sku: SkuListItem): 'secondary' | 'success' | 'warning' {
    return SKU_STATUS_TONE[sku.status] ?? 'secondary';
  }

  quantity(value: string): string {
    return formatQuantity(value);
  }

  price(sku: SkuListItem): string {
    return sku.listPrice ? formatMoney(sku.listPrice) : '—';
  }

  tagWord(tag: string): string {
    return PRODUCT_TAG_LABEL[tag] ?? tag;
  }
}
