import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  SlPageHeaderBack,
  SlPageHeaderBreadcrumbs,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderSubheading,
  SlPageHeaderTabs,
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
import { SlSkeleton, SlSkeletonRegion, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardUnit,
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
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';
import type { Money } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
  MOVEMENT_LABEL,
  movementSourceLabel,
  PRODUCTS_ROUTE,
  REORDER_MODE_LABEL,
  SKU_STATUS_LABEL,
  SKU_STATUS_TONE,
  SKUS_ROUTE,
  TAX_CLASS_LABEL,
  UNIT_LABEL,
} from '../../core/catalog/catalog.model';
import { SkuStore, type StockRow } from '../../core/catalog/sku.store';
import { MOVEMENTS_ROUTE, positionLink } from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { StockTable } from './stock-table';

type View = 'stock' | 'prices' | 'supply' | 'movements';

/**
 * One SKU: how much exists and where, how much is held against orders, what is
 * on its way, what it sells for in each list, who it is bought from and in what
 * time, and what moved the stock lately.
 *
 * Two of those answers depend on the reader rather than on the record.
 * `getSku` writes `standardCost` down to `US$0.00` without `cost.view` and
 * returns `priceEntries` empty without `pricing.view`. A screen that drew those
 * as values would show a representative a cost of nothing and a margin of a
 * hundred percent, so the card, the column and the whole Prices section leave
 * instead, and the page says which permission holds them (PM-01, PM-02).
 */
@Component({
  selector: 'app-sku-page',
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
    SlPageHeaderBack,
    SlPageHeaderBreadcrumbs,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTabs,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlSkeletonText,
    SlStack,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardUnit,
    SlStatCardValue,
    SlTab,
    SlTabList,
    SlTabs,
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
    StockTable,
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
    .down {
      color: var(--slotted-tone-danger-text);
    }
    .up {
      color: var(--slotted-tone-success-text);
    }
  `,
  template: `
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <!-- The way back: below 600 pixels it is what stands of the nav row, where a filing path of names wraps. -->
              <a slPageHeaderBack [routerLink]="skusRoute">SKUs</a>
              <nav
                slBreadcrumb
                slPageHeaderBreadcrumbs
                [maxItems]="phone() ? 3 : 8"
                aria-label="Where this SKU is filed"
              >
                <ol slBreadcrumbList>
                  <li slBreadcrumbItem>
                    <a slBreadcrumbLink [routerLink]="skusRoute">All SKUs</a>
                  </li>
                  <li slBreadcrumbItem><span slBreadcrumbPage>SKU</span></li>
                </ol>
              </nav>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>SKU</h1></div>
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
                    ? 'This SKU does not exist'
                    : 'The SKU could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ error.message }}</p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="reload()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="skusRoute">
                Back to SKUs
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
              <!-- The way back: below 600 pixels it is what stands of the nav row, where a filing path of names wraps. -->
              <a slPageHeaderBack [routerLink]="skusRoute">SKUs</a>
              <nav
                slBreadcrumb
                slPageHeaderBreadcrumbs
                [maxItems]="phone() ? 3 : 8"
                aria-label="Where this SKU is filed"
              >
                <ol slBreadcrumbList>
                  <li slBreadcrumbItem>
                    <a slBreadcrumbLink [routerLink]="skusRoute">All SKUs</a>
                  </li>
                  @for (step of store.categoryPath(); track step.id) {
                    <li slBreadcrumbItem>
                      <a
                        slBreadcrumbLink
                        [routerLink]="skusRoute"
                        [queryParams]="{ category: step.id }"
                      >
                        {{ step.name }}
                      </a>
                    </li>
                  }
                  @if (store.product(); as p) {
                    <li slBreadcrumbItem>
                      <a slBreadcrumbLink [routerLink]="productRoute()">{{ p.name }}</a>
                    </li>
                  }
                  <li slBreadcrumbItem>
                    <span slBreadcrumbPage>{{ sku()?.sku ?? 'SKU' }}</span>
                  </li>
                </ol>
              </nav>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ sku()?.sku ?? 'SKU' }}</h1>
                @if (sku(); as item) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()">
                      <span slTagBody>{{ statusWord() }}</span>
                    </span>
                    <span slTag size="sm" [tone]="stockTone()">
                      <span slTagBody>{{ stockWord() }}</span>
                    </span>
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every SKU carries its status and its stock: the two marks keep a small tag's box each. -->
                  <span slPageHeaderMarks>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="3rem"></span></span
                    ></span>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="5rem"></span></span
                    ></span>
                  </span>
                  <!-- The line under the heading always arrives; the wait keeps its box. -->
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="22rem"></span>
                  </p>
                }
              </div>
              <!--
                The way to the product is in the breadcrumb at every width; the
                action repeats it where there is room and leaves below the
                header's narrow step rather than taking a row of its own.
              -->
              @if (store.product() && !phone()) {
                <div slPageHeaderActions>
                  <a slButtonLink variant="outline" tone="secondary" [routerLink]="productRoute()">
                    Open the product
                  </a>
                </div>
              }
            </div>
          </div>
          <div slPageHeaderTabs>
            <div slTabs [value]="view()" (valueChange)="setView($event.value)">
              <div slTabList aria-label="SKU sections">
                <div slTab value="stock">Stock {{ count(store.stock().length) }}</div>
                @if (store.canSeePricing()) {
                  <div slTab value="prices">Prices {{ count(store.priceEntries().length) }}</div>
                }
                <div slTab value="supply">Supply {{ count(store.suppliers().length) }}</div>
                <div slTab value="movements">Movements {{ count(store.movements().length) }}</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (sku(); as item) {
              <div slGrid [columns]="phone() ? 2 : cardColumns()" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Available</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>
                      {{ quantity(item.available)
                      }}<span slStatCardUnit>{{ item.unitOfMeasure }}</span>
                    </span>
                    <p slStatCardComparison>{{ onHandWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Reserved</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>
                      {{ quantity(item.reserved)
                      }}<span slStatCardUnit>{{ item.unitOfMeasure }}</span>
                    </span>
                    <p slStatCardComparison>{{ reservedWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Inbound</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>
                      {{ quantity(item.inbound)
                      }}<span slStatCardUnit>{{ item.unitOfMeasure }}</span>
                    </span>
                    <p slStatCardComparison>{{ inboundWord() }}</p>
                  </div>
                </div>
                @if (store.canSeePricing()) {
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>List price</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ listPrice() }}</span>
                      <p slStatCardComparison>{{ listWord() }}</p>
                    </div>
                  </div>
                }
                @if (store.canSeeCost() && store.canSeePricing()) {
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Margin</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue
                        >{{ marginPercent() }}<span slStatCardUnit>%</span></span
                      >
                      <p slStatCardComparison>{{ costWord() }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!--
                The wait reserves what every answer brings: the figures the
                reader's permissions allow, in the boxes they will occupy. The
                messages some SKUs carry stand under the tabs' content, so
                nothing measured moves when they arrive.
              -->
              <div slSkeletonRegion [messages]="{ label: 'Reading the SKU' }" [loading]="true">
                <div slGrid [columns]="phone() ? 2 : cardColumns()" minItemWidth="xs" [gap]="4">
                  @for (figure of figureLabels(); track figure) {
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
              </div>
            }

            @switch (view()) {
              @case ('stock') {
                <app-stock-table
                  [rows]="store.stock()"
                  [unit]="unitWord()"
                  [pending]="store.detail() === null"
                  [phone]="phone()"
                  [link]="canReadInventory() ? stockLink : null"
                />
                @if (store.detail() !== null && store.stock().length > 0) {
                  <span slText size="sm" tone="muted">{{ stockNote() }}</span>
                }
              }
              @case ('prices') {
                <div slTable variant="framed" [columns]="phone() ? 2 : 4">
                  <div slTableContent>
                    <caption slTableCaption>
                      Price lists this SKU is in
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Price list</th>
                        <th slTableColumnHeader align="end" numeric>Unit price</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Region</th>
                          <th slTableColumnHeader>Valid from</th>
                        }
                      </tr>
                    </thead>
                    @if (store.detail() === null) {
                      <tbody slTableBody>
                        @for (row of placeholderRows; track row) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="60%"></span>
                            </th>
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="4rem"></span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="2rem"></span>
                              </td>
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="5rem"></span>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    } @else if (store.priceEntries().length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No price list carries this SKU</h3>
                                <p slResultStateDescription>
                                  It cannot be quoted or ordered until a list prices it.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (entry of store.priceEntries(); track entry.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>{{ entry.priceListName }}</th>
                            <td slTableCell align="end" numeric>{{ money(entry.unitPrice) }}</td>
                            @if (!phone()) {
                              <td slTableCell>{{ entry.unitPrice.currency }}</td>
                              <td slTableCell>{{ date(entry.validFrom) }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
                @if (store.detail() !== null && store.priceEntries().length > 0) {
                  <span slText size="sm" tone="muted">{{ priceNote() }}</span>
                }
              }
              @case ('supply') {
                <div slTable variant="framed" [columns]="phone() ? 2 : supplyColumns()">
                  <div slTableContent>
                    <caption slTableCaption>
                      Who this SKU is bought from
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Supplier</th>
                        <th slTableColumnHeader align="end" numeric>Lead time</th>
                        @if (!phone()) {
                          @if (store.canSeeCost()) {
                            <th slTableColumnHeader align="end" numeric>Unit cost</th>
                          }
                          <th slTableColumnHeader align="end" numeric>Minimum order</th>
                          <th slTableColumnHeader>Their code</th>
                        }
                      </tr>
                    </thead>
                    @if (store.detail() === null) {
                      <tbody slTableBody>
                        @for (row of placeholderRows; track row) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="60%"></span>
                            </th>
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="3rem"></span>
                            </td>
                            @if (!phone()) {
                              @if (store.canSeeCost()) {
                                <td slTableCell align="end">
                                  <span slSkeleton shape="text" inlineSize="4rem"></span>
                                </td>
                              }
                              <td slTableCell align="end">
                                <span slSkeleton shape="text" inlineSize="2rem"></span>
                              </td>
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="5rem"></span>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    } @else if (store.suppliers().length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No supplier is mapped to this SKU</h3>
                                <p slResultStateDescription>
                                  A purchase order cannot be raised for it until one is.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (mapping of store.suppliers(); track mapping.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slStack [gap]="1">
                                <span class="cell-text" [title]="mapping.supplierName">
                                  {{ mapping.supplierName }}
                                </span>
                                <span slInline [gap]="2">
                                  @if (mapping.isPreferred) {
                                    <span slBadge variant="soft" tone="accent" size="sm">
                                      Preferred
                                    </span>
                                  }
                                  @if (mapping.supplierStatus !== 'active') {
                                    <span slBadge variant="soft" tone="warning" size="sm">
                                      {{ supplierState(mapping.supplierStatus) }}
                                    </span>
                                  }
                                </span>
                              </span>
                            </th>
                            <td slTableCell align="end" numeric>
                              {{ days(mapping.leadTimeDays) }}
                            </td>
                            @if (!phone()) {
                              @if (store.canSeeCost()) {
                                <td slTableCell align="end" numeric>
                                  {{ money(mapping.unitCost) }}
                                </td>
                              }
                              <td slTableCell align="end" numeric>
                                {{ quantity(mapping.minimumOrderQuantity) }}
                              </td>
                              <td slTableCell>{{ mapping.supplierSku }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
                @if (store.detail() !== null) {
                  <span slText size="sm" tone="muted">{{ supplyNote() }}</span>
                }
              }
              @case ('movements') {
                <!--
                  A table rather than a timeline: every row carries a signed
                  quantity, and the question a reader brings here is how much
                  moved, which is read down a column and not along a thread.
                -->
                <div slTable variant="framed" [columns]="phone() ? 2 : 5">
                  <div slTableContent>
                    <caption slTableCaption>
                      What moved this stock lately
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>When</th>
                        <th slTableColumnHeader align="end" numeric>Change</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>What</th>
                          <th slTableColumnHeader>Where</th>
                          <th slTableColumnHeader>From</th>
                        }
                      </tr>
                    </thead>
                    @if (store.detail() === null) {
                      <tbody slTableBody>
                        @for (row of placeholderRows; track row) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="70%"></span>
                            </th>
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="4rem"></span>
                              </td>
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="3rem"></span>
                              </td>
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="6rem"></span>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    } @else if (store.movements().length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>Nothing has moved this stock</h3>
                                <p slResultStateDescription>
                                  No receipt, shipment or count has touched it in the window the
                                  demo holds.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (movement of store.movements(); track movement.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>{{ dateTime(movement.occurredAt) }}</th>
                            <td slTableCell align="end" numeric>
                              <span
                                [class.down]="down(movement.onHandDelta)"
                                [class.up]="up(movement.onHandDelta)"
                              >
                                {{ delta(movement.onHandDelta) }}
                              </span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell>{{ movementWord(movement.type) }}</td>
                              <td slTableCell>{{ place(movement.warehouseId) }}</td>
                              <td slTableCell>
                                <span class="cell-text" [title]="movement.sourceEntityId">
                                  {{ sourceWord(movement.sourceEntityType) }}
                                </span>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
                @if (store.detail() !== null && store.movements().length > 0) {
                  <span slText size="sm" tone="muted">
                    The twenty-five most recent movements, newest first.
                    @if (canReadInventory()) {
                      <a slLink [routerLink]="movementsRoute" [queryParams]="{ sku: sku()?.id }"
                        >Every movement in the ledger</a
                      >
                    }
                  </span>
                }
              }
            }
            <!-- What some SKUs carry and others do not: under the section, so the figures and the table do not move. -->
            @if (sku(); as item) {
              @if (item.status === 'discontinued') {
                <div slInlineMessage tone="warning">
                  <span slInlineMessageIcon></span>
                  <span slStack [gap]="1">
                    <span slText size="sm">This SKU is discontinued.</span>
                    <span slText size="sm" tone="muted">
                      Nothing new is bought or sold under it. The orders that already hold it keep
                      it, and what is left in the warehouses below still ships against them.
                    </span>
                  </span>
                </div>
              } @else if (item.status === 'restricted') {
                <div slInlineMessage tone="warning">
                  <span slInlineMessageIcon></span>
                  This SKU is restricted: it is sold under conditions the catalogue does not carry.
                </div>
              }

              @if (shortWithInbound()) {
                <div slInlineMessage tone="accent">
                  <span slInlineMessageIcon></span>
                  <span slStack [gap]="1">
                    <span slText size="sm">{{ inboundLine() }}</span>
                    <span slText size="sm" tone="muted">
                      Nexora reports the inbound quantity by warehouse and not the purchase order
                      behind it, so the date it lands is on that order and not here.
                    </span>
                  </span>
                </div>
              }

              @if (store.reorderSuggestions().length > 0) {
                <div slInlineMessage tone="warning">
                  <span slInlineMessageIcon></span>
                  {{ reorderLine() }}
                </div>
              }

              @if (permissionNote(); as note) {
                <div slInlineMessage tone="secondary">
                  <span slInlineMessageIcon></span>
                  {{ note }}
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class SkuPage {
  readonly store = inject(SkuStore);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionStore);

  readonly movementsRoute = MOVEMENTS_ROUTE;
  /** The stock and the ledger are the inventory's to open, for a reader holding `inventory.view`. */
  readonly canReadInventory = computed(() => {
    void this.session.session();
    return this.session.can('inventory.view');
  });
  /** A warehouse's row opens the inventory's stock of this SKU, on that warehouse. */
  readonly stockLink = (row: StockRow) => positionLink(row.skuId, row.warehouseId);

  readonly skusRoute = SKUS_ROUTE;
  readonly phone = phoneSignal();
  readonly sku = this.store.sku;
  readonly view = signal<View>('stock');
  readonly placeholderRows = [1, 2, 3];

  readonly figureLabels = computed(() => [
    'Available',
    'Reserved',
    'Inbound',
    ...(this.store.canSeePricing() ? ['List price'] : []),
    ...(this.store.canSeeCost() && this.store.canSeePricing() ? ['Margin'] : []),
  ]);

  /** The figures fill one row; the union the family takes is the literal set, not a number. */
  readonly cardColumns = computed<3 | 4 | 5>(() => {
    const count = this.figureLabels().length;
    return count >= 5 ? 5 : count === 4 ? 4 : 3;
  });
  readonly supplyColumns = computed(() => (this.store.canSeeCost() ? 5 : 4));

  readonly statusWord = computed(() => {
    const item = this.sku();
    return item === null ? '' : (SKU_STATUS_LABEL[item.status] ?? item.status);
  });

  readonly statusTone = computed<'secondary' | 'success' | 'warning'>(() => {
    const item = this.sku();
    return item === null ? 'secondary' : (SKU_STATUS_TONE[item.status] ?? 'secondary');
  });

  /** The health of the stock, as one mark beside the state the catalogue holds (RP-01). */
  readonly stockWord = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    if (Number(item.available) <= 0) return 'Nothing available';
    if (item.belowReorderPoint) return 'Below reorder point';
    return 'In stock';
  });

  readonly stockTone = computed<'secondary' | 'success' | 'warning' | 'danger'>(() => {
    const item = this.sku();
    if (item === null) return 'secondary';
    if (Number(item.available) <= 0) return 'danger';
    return item.belowReorderPoint ? 'warning' : 'success';
  });

  readonly subheading = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    const unit = UNIT_LABEL[item.unitOfMeasure] ?? item.unitOfMeasure;
    return [
      item.productName,
      item.categoryName,
      `counted in ${unit}`,
      TAX_CLASS_LABEL[item.taxClass] ?? item.taxClass,
    ]
      .filter((part) => part.length > 0)
      .join(' · ');
  });

  /**
   * What is on hand, and the line the reorder point draws once it is crossed:
   * the card's tone is the trend's (stat-card), so a crossing is said in words (RP-02).
   */
  readonly onHandWord = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    if (Number(item.available) <= 0) return 'nothing to promise';
    if (item.belowReorderPoint) return 'below reorder point';
    // One line of the narrowest card: the warehouses are the Stock tab's.
    return `of ${formatQuantity(item.onHand)} on hand`;
  });

  readonly reservedWord = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    return Number(item.reserved) === 0 ? 'none held for orders' : 'held for open orders';
  });

  readonly inboundWord = computed(() => {
    const places = this.store.placesWithInbound();
    if (places.length === 0) return 'nothing is on its way';
    return places.length === 1
      ? `on its way into ${places[0]!.warehouseCode}`
      : `into ${places.length} warehouses`;
  });

  readonly listPrice = computed(() => {
    const price = this.sku()?.listPrice;
    return price ? formatMoney(price) : '—';
  });

  readonly listWord = computed(() =>
    this.sku()?.listPrice ? 'on the Standard list' : 'no Standard price',
  );

  readonly marginPercent = computed(() => {
    const item = this.sku();
    const price = item?.listPrice?.minor ?? 0;
    const cost = item?.standardCost.minor ?? 0;
    if (price <= 0) return 0;
    return Math.round(((price - cost) / price) * 100);
  });

  readonly costWord = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    // The cost's amount is the Details tab's; the line says what the margin is measured on.
    return 'on its standard cost';
  });

  readonly unitWord = computed(() => this.sku()?.unitOfMeasure ?? '');

  /** §82.7: nothing on the shelf and something on its way is one sentence, not two numbers. */
  readonly shortWithInbound = computed(() => {
    const item = this.sku();
    return item !== null && Number(item.available) <= 0 && Number(item.inbound) > 0;
  });

  readonly inboundLine = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    const places = this.store.placesWithInbound();
    const total = `${formatQuantity(item.inbound)} ${item.unitOfMeasure}`;
    if (places.length === 1)
      return `Nothing is available today, and ${total} are on their way into ${places[0]!.warehouseCode}.`;
    const where = places.map((row) => `${formatQuantity(row.inbound)} into ${row.warehouseCode}`);
    return `Nothing is available today, and ${total} are on their way: ${where.join(', ')}.`;
  });

  readonly reorderLine = computed(() => {
    const suggestions = this.store.reorderSuggestions();
    const item = this.sku();
    if (item === null || suggestions.length === 0) return '';
    const mode = REORDER_MODE_LABEL[item.reorderPolicy.mode] ?? item.reorderPolicy.mode;
    const parts = suggestions.map(
      (position) =>
        `${formatQuantity(position.suggestedQuantity)} ${item.unitOfMeasure} into ${this.place(position.warehouseId)}`,
    );
    return `Its ${mode.toLowerCase()} policy suggests reordering ${parts.join(', ')}.`;
  });

  readonly stockNote = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    return `Available is what is on hand minus what is reserved, warehouse by warehouse; the totals are the figures above. Everything is counted in ${item.unitOfMeasure}.`;
  });

  readonly priceNote = computed(() => {
    const entries = this.store.priceEntries();
    const currencies = [...new Set(entries.map((entry) => entry.unitPrice.currency))];
    return currencies.length > 1
      ? `Each list prices in its own currency: ${currencies.join(', ')}. The figure above is the Standard list.`
      : 'The figure above is the Standard list.';
  });

  readonly supplyNote = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    return `The catalogue holds ${item.leadTimeDays} days as this SKU's own lead time; each supplier below quotes its own.`;
  });

  /**
   * What the page is not showing, and who sees it. One sentence: two notices
   * for two permissions would say the same thing twice to the reader who holds
   * neither (PM-02).
   */
  readonly permissionNote = computed(() => {
    const pricing = this.store.canSeePricing();
    const cost = this.store.canSeeCost();
    if (pricing && cost) return '';
    if (!pricing && !cost)
      return 'What this SKU sells for and what it costs are not on this page: they need pricing.view and cost.view, which your role holds neither of. A sales manager or an auditor sees both.';
    if (!pricing)
      return 'What this SKU sells for is not on this page: prices need pricing.view, which your role does not hold. A sales manager or an auditor sees them.';
    return 'What this SKU costs is not on this page: costs need cost.view, which your role does not hold. A sales manager, a buyer or an auditor sees them.';
  });

  readonly productRoute = computed(() => {
    const product = this.store.product();
    return product === null ? PRODUCTS_ROUTE : `${PRODUCTS_ROUTE}/${product.id}`;
  });

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.view.set('stock');
      void this.store.open(id);
    });
  }

  setView(view: string | undefined): void {
    this.view.set((view ?? 'stock') as View);
  }

  /**
   * The count a tab carries (RP-03), and nothing below the narrow step: four
   * labels with four counts are 7 pixels wider than a 390-pixel viewport, and
   * the count is the first thing the content itself states.
   */
  count(value: number | undefined): string {
    if (this.phone() || this.store.detail() === null || value === undefined) return '';
    return `(${value})`;
  }

  reload(): void {
    void this.store.load();
  }

  quantity(value: string): string {
    return formatQuantity(value);
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  days(value: number): string {
    return value === 1 ? '1 day' : `${value} days`;
  }

  delta(value: string): string {
    const amount = Number(value);
    return `${amount > 0 ? '+' : ''}${formatQuantity(value)}`;
  }

  down(value: string): boolean {
    return Number(value) < 0;
  }

  up(value: string): boolean {
    return Number(value) > 0;
  }

  place(warehouseId: string): string {
    return (
      this.store.stock().find((row) => row.warehouseId === warehouseId)?.warehouseCode ??
      warehouseId
    );
  }

  movementWord(type: string): string {
    return MOVEMENT_LABEL[type] ?? type;
  }

  sourceWord(type: string): string {
    return movementSourceLabel(type);
  }

  supplierState(status: string): string {
    return status === 'on_hold' ? 'On hold' : 'Inactive';
  }
}
