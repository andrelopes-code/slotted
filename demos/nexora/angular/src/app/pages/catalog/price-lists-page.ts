import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
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
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionBody,
  SlSectionDescription,
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
import { SlText } from '@slotted/angular/typography';

import {
  formatDate,
  formatMoney,
  SKUS_ROUTE,
} from '../../core/catalog/catalog.model';
import { PriceListsStore, type PriceListRow, type SkuPriceRow } from '../../core/catalog/price-lists.store';
import { phoneSignal } from '../../core/layout/phone';

/**
 * The price lists, and one SKU read across them.
 *
 * `GET /price-lists` answers with each list and how many entries it holds. No
 * resource exposes the entries of a list — the runtime's `priceEntriesByList`
 * index reaches no endpoint — so this screen cannot open a list and show what
 * is in it, and says so rather than implying otherwise. The axis that does
 * exist is the other one: `SkuDetail.priceEntries` gives one SKU's price in
 * every list, which is the question a person on this screen actually brings,
 * and the lookup below is built on it. The Contacts screen set the precedent:
 * state the reach of the page in the page's own numbers.
 */
@Component({
  selector: 'app-price-lists-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlCombobox,
    SlComboboxItem,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlGrid,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
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
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionBody,
    SlSectionDescription,
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
    .lookup {
      max-inline-size: 28rem;
    }
    .missing {
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Price lists</h1></div>
            <div slPageHeaderActions>
              <a slButtonLink variant="outline" tone="secondary" [routerLink]="skusRoute">
                All SKUs
              </a>
            </div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              What each list is, and how many prices it holds. Nexora answers for a price one SKU
              at a time, not one list at a time, so a list cannot be opened and read through — the
              lookup below is how a price is found.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="body">
          @if (store.error(); as message) {
            <div slResultState status="error" reach="section">
              <div slResultStateContent>
                <h2 slResultStateTitle>The price lists could not be loaded</h2>
                <p slResultStateDescription>{{ message }}</p>
              </div>
              <div slResultStateActions>
                <button slButton type="button" (click)="retry()">Try again</button>
              </div>
            </div>
          } @else {
            @if (store.loaded()) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Price lists</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.lists().length }}</span>
                    <p slStatCardComparison>{{ activeWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Prices held</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ number(store.entryTotal()) }}</span>
                    <p slStatCardComparison>entries across every list</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Currencies</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.currencies().length }}</span>
                    <p slStatCardComparison>{{ store.currencies().join(', ') }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Regions</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ store.regions().length }}</span>
                    <p slStatCardComparison>{{ store.regions().join(', ') }}</p>
                  </div>
                </div>
              </div>
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the price lists' }" [loading]="true">
                <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                  @for (figure of figureLabels; track figure) {
                    <div slStatCard size="sm" loading>
                      <div slStatCardHeader><span slStatCardLabel>{{ figure }}</span></div>
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

            <div slTable variant="framed" [columns]="phone() ? 2 : 5">
              <div slTableContent>
                <caption slTableCaption>
                  Price lists
                </caption>
                <thead slTableHead>
                  <tr slTableRow>
                    <th slTableColumnHeader>List</th>
                    <th slTableColumnHeader align="end" numeric>Prices</th>
                    @if (!phone()) {
                      <th slTableColumnHeader>Currency</th>
                      <th slTableColumnHeader>Region</th>
                      <th slTableColumnHeader>Updated</th>
                    }
                  </tr>
                </thead>
                @if (!store.loaded()) {
                  <tbody slTableBody>
                    @for (row of placeholderRows; track row) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slSkeleton shape="text" inlineSize="55%"></span>
                        </th>
                        <td slTableCell align="end">
                          <span slSkeleton shape="text" inlineSize="3rem"></span>
                        </td>
                        @if (!phone()) {
                          <td slTableCell><span slSkeleton shape="text" inlineSize="2rem"></span></td>
                          <td slTableCell><span slSkeleton shape="text" inlineSize="2rem"></span></td>
                          <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                        }
                      </tr>
                    }
                  </tbody>
                } @else if (store.lists().length === 0) {
                  <tbody slTableBody>
                    <tr slTableRow>
                      <td slTableEmpty>
                        <div slResultState status="empty" reach="section">
                          <div slResultStateContent>
                            <h3 slResultStateTitle>This tenant has no price list</h3>
                            <p slResultStateDescription>
                              Nothing can be quoted or ordered until one exists.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                } @else {
                  <tbody slTableBody>
                    @for (list of store.lists(); track list.id) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slInline [gap]="2">
                            <span>{{ list.name }}</span>
                            @if (list.status !== 'active') {
                              <span slBadge variant="soft" tone="secondary" size="sm">
                                Inactive
                              </span>
                            }
                          </span>
                        </th>
                        <td slTableCell align="end" numeric>{{ coverage(list) }}</td>
                        @if (!phone()) {
                          <td slTableCell>{{ list.currency }}</td>
                          <td slTableCell>{{ list.regionCode }}</td>
                          <td slTableCell>{{ date(list.metadata.updatedAt) }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                }
              </div>
            </div>

            <div slInlineMessage tone="secondary">
              <span slInlineMessageIcon></span>
              <span slStack [gap]="1">
                <span slText size="sm">
                  A list cannot be opened: Nexora exposes no endpoint that lists the entries of a
                  price list.
                </span>
                <span slText size="sm" tone="muted">
                  The count above is what the list holds. To read a price, name the SKU below and
                  the page reads it in every list at once.
                </span>
              </span>
            </div>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Price a SKU</h2>
                  <!-- The title is the column holding eyebrow, heading and description (CP-01). -->
                  <p slSectionDescription>
                    One SKU across every list, with the lists that do not price it named.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="5">
                  <div slField class="lookup">
                    <label slFieldLabel>SKU</label>
                    <sl-combobox
                      [items]="items()"
                      [filter]="null"
                      [loading]="store.searching()"
                      [inputValue]="store.query()"
                      (inputValueChangeRequest)="search($event.value)"
                      [value]="store.chosenId()"
                      (valueChangeRequest)="choose($event.value)"
                      placeholder="A code or a name — AST-MOT, servo…"
                      [messages]="{ empty: 'No SKU answers that', loading: 'Looking for SKUs' }"
                      clearable
                    >
                      <!--
                        The options are projected: the items input is the table
                        the family reads a chosen value's label from, and the
                        popup draws what is written inside it (ledger row "a
                        combobox given only its items shows the empty message").
                      -->
                      @for (item of items(); track item.value) {
                        <sl-combobox-item
                          [value]="item.value"
                          [label]="item.label"
                          [description]="item.description"
                        />
                      }
                    </sl-combobox>
                    <p slFieldDescription>
                      Nexora searches the code, the name, the manufacturer part number and the
                      product; two characters start the search.
                    </p>
                  </div>

                  @if (store.lookupError(); as message) {
                    <div slInlineMessage tone="danger">
                      <span slInlineMessageIcon></span>
                      <span slInline [gap]="3">
                        {{ message }}
                        <button
                          slButton
                          size="sm"
                          variant="outline"
                          tone="secondary"
                          type="button"
                          (click)="retryLookup()"
                        >
                          Try again
                        </button>
                      </span>
                    </div>
                  } @else if (store.chosenId() !== null) {
                    <div slTable variant="framed" [columns]="phone() ? 2 : 4">
                      <div slTableContent>
                        <caption slTableCaption>
                          {{ lookupCaption() }}
                        </caption>
                        <thead slTableHead>
                          <tr slTableRow>
                            <th slTableColumnHeader>List</th>
                            <th slTableColumnHeader align="end" numeric>Unit price</th>
                            @if (!phone()) {
                              <th slTableColumnHeader>Region</th>
                              <th slTableColumnHeader>Valid from</th>
                            }
                          </tr>
                        </thead>
                        @if (store.chosen() === null) {
                          <tbody slTableBody>
                            @for (row of placeholderRows; track row) {
                              <tr slTableRow>
                                <th slTableRowHeader>
                                  <span slSkeleton shape="text" inlineSize="55%"></span>
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
                        } @else {
                          <tbody slTableBody>
                            @for (row of store.skuPrices(); track row.listId) {
                              <tr slTableRow>
                                <th slTableRowHeader>{{ row.listName }}</th>
                                <td slTableCell align="end" numeric>
                                  @if (row.unitPrice) {
                                    {{ money(row.unitPrice) }}
                                  } @else {
                                    <span class="missing">not priced</span>
                                  }
                                </td>
                                @if (!phone()) {
                                  <td slTableCell>{{ row.regionCode }}</td>
                                  <td slTableCell>{{ validFrom(row) }}</td>
                                }
                              </tr>
                            }
                          </tbody>
                        }
                      </div>
                    </div>
                    @if (store.chosen(); as detail) {
                      <span slInline [gap]="3" wrap="wrap">
                        <span slText size="sm" tone="muted">{{ lookupNote() }}</span>
                        <a slLink [routerLink]="skuRoute()">Open the SKU</a>
                      </span>
                    }
                  } @else {
                    <div slResultState status="empty" reach="section">
                      <div slResultStateContent>
                        <h3 slResultStateTitle>Name a SKU to see its prices</h3>
                        <p slResultStateDescription>
                          Every list the tenant holds is shown against it, priced or not.
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class PriceListsPage {
  readonly store = inject(PriceListsStore);

  readonly skusRoute = SKUS_ROUTE;
  readonly phone = phoneSignal();
  readonly figureLabels = ['Price lists', 'Prices held', 'Currencies', 'Regions'];
  readonly placeholderRows = [1, 2, 3, 4];

  /** The code names the option; the name of the item stands under it. */
  readonly items = computed(() =>
    this.store.matches().map((sku) => ({
      value: sku.id,
      label: sku.sku,
      description: sku.name,
    })),
  );

  readonly activeWord = computed(() => {
    const active = this.store.activeCount();
    const total = this.store.lists().length;
    return active === total ? 'every one of them active' : `${active} of them active`;
  });

  readonly lookupCaption = computed(() => {
    const detail = this.store.chosen();
    return detail === null ? 'Reading the SKU' : `${detail.sku.sku} — ${detail.sku.name}`;
  });

  readonly lookupNote = computed(() => {
    const priced = this.store.pricedCount();
    const total = this.store.lists().length;
    const detail = this.store.chosen();
    if (detail === null) return '';
    return priced === total
      ? `Every one of the ${total} lists prices this SKU.`
      : `${priced} of the ${total} lists price this SKU; the rest hold no entry for it.`;
  });

  readonly skuRoute = computed(() => `${SKUS_ROUTE}/${this.store.chosenId()}`);

  constructor() {
    void this.store.open();
  }

  number(value: number): string {
    return value.toLocaleString('en-US');
  }

  coverage(list: PriceListRow): string {
    return list.entryCount.toLocaleString('en-US');
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  money(value: { currency: string; minor: number }): string {
    return formatMoney(value as Parameters<typeof formatMoney>[0]);
  }

  validFrom(row: SkuPriceRow): string {
    return row.validFrom === null ? '—' : formatDate(row.validFrom);
  }

  search(text: string): void {
    void this.store.search(text);
  }

  choose(value: string | readonly string[] | null): void {
    void this.store.choose(typeof value === 'string' ? value : null);
  }

  retry(): void {
    void this.store.reload();
  }

  retryLookup(): void {
    void this.store.choose(this.store.chosenId());
  }
}
