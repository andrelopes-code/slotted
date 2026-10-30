import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlGrid } from '@slotted/angular/grid';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderBack,
  SlPageHeaderHeading,
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
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';

import { formatDateTime, formatMoney, formatQuantity } from '../../core/catalog/catalog.model';
import { milli, MOVEMENTS_ROUTE, positionLink } from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';
import { GoodsReceiptStore } from '../../core/procurement/goods-receipt.store';
import {
  HOLDERS,
  PURCHASE_ORDERS_ROUTE,
  RECEIVING_ROUTE,
  type GoodsReceiptDetail,
} from '../../core/procurement/procurement.model';

type ReceiptLine = GoodsReceiptDetail['lines'][number];

/**
 * One goods receipt (§65.7), at the receiving destination's `:id`: no
 * endpoint lists receipts, so a receipt is reached from its order, from the
 * movements it wrote and from the notice after it was written. It says where
 * each line went — accepted and damaged into the stock, damaged on to its
 * bucket, rejected back to the supplier — and leads to the movements it wrote
 * (LG-01). The unit cost is a cost (PM-01, PC-01).
 */
@Component({
  selector: 'app-goods-receipt-page',
  imports: [
    RouterLink,
    SlMenuItem,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlButton,
    SlButtonLink,
    SlGrid,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderBack,
    SlPageHeaderHeading,
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
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* A link standing alone under the lines is a touch target's height on a finger (--slotted-target-comfortable). */
    @media (pointer: coarse) {
      .door {
        display: inline-block;
        line-height: var(--slotted-target-comfortable);
      }
    }
    .body {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* On a finger a record's link in a table row is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    @if (store.error()) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="receivingRoute">Receiving</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Goods receipt</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="missingStatus()"
            reach="section"
            data-testid="receipt-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ missingTitle() }}</h2>
              <p slResultStateDescription>{{ missingWords() }}</p>
            </div>
            <div slResultStateActions>
              @if (missingStatus() === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="receivingRoute"
                >Back to receiving</a
              >
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.detail() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="receivingRoute">Receiving</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ receipt()?.receiptNumber ?? 'Goods receipt' }}</h1>
                @if (receipt(); as r) {
                  <p slPageHeaderSubheading>
                    {{ r.supplierName }} · {{ r.warehouseCode }} · {{ when(r.receivedAt) }}
                  </p>
                } @else {
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (receipt(); as r) {
                <!-- A toolbar that folds keeps the action on the title's line on a phone (LA-03), where a loose one took a row of its own. -->
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Receipt actions" overflow="menu">
                    <div slToolbarItem [slToolbarItemCounterpart]="orderItem">
                      <a
                        slButtonLink
                        variant="outline"
                        tone="secondary"
                        data-testid="receipt-order"
                        [routerLink]="[ordersRoute, r.purchaseOrderId]"
                      >
                        {{ r.purchaseOrderNumber }}
                      </a>
                    </div>
                    <sl-toolbar-overflow />
                  </div>
                </div>
                <ng-template #orderItem>
                  <a slMenuItem [routerLink]="[ordersRoute, r.purchaseOrderId]"
                    >Open {{ r.purchaseOrderNumber }}</a
                  >
                </ng-template>
              }
            </div>
          </div>
        </header>
        <div slPageBody>
          <div class="body">
            @if (receipt(); as r) {
              <div slGrid [columns]="phone() ? 2 : 3" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Into stock</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ counts().intoStock }}</span>
                    <p slStatCardComparison>
                      of {{ lines(rows().length) }} entered {{ r.warehouseCode }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Lines damaged</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ counts().damaged }}</span>
                    <p slStatCardComparison>with damaged units</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Lines rejected</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ counts().rejected }}</span>
                    <p slStatCardComparison>with units sent back</p>
                  </div>
                </div>
              </div>
              @if (r.notes) {
                <span slText size="sm">Note: {{ r.notes }}</span>
              }
              @if (r.overReceiptReason) {
                <span slText size="sm" data-testid="over-reason"
                  >Received past the 5% tolerance: {{ r.overReceiptReason }}</span
                >
              }
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the receipt' }" [loading]="true">
                <div slGrid [columns]="phone() ? 2 : 3" minItemWidth="xs" [gap]="4">
                  @for (figure of ['Into stock', 'Lines damaged', 'Lines rejected']; track figure) {
                    <div slStatCard size="sm" loading>
                      <div slStatCardHeader>
                        <span slStatCardLabel>{{ figure }}</span>
                      </div>
                      <div slStatCardFigure>
                        <span slStatCardValue>—</span>
                        <p slStatCardComparison>
                          <span slSkeletonText [lines]="1" lastLineSize="70%"></span>
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <div slStack [gap]="3">
              <div
                slTable
                variant="framed"
                [columns]="columns()"
                [layout]="phone() ? 'fixed' : 'auto'"
                data-testid="receipt-lines"
              >
                <div slTableContent>
                  <caption slTableCaption>
                    What arrived, line by line, in each SKU’s own unit
                  </caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>SKU</th>
                      <th slTableColumnHeader align="end" numeric>Accepted</th>
                      <th slTableColumnHeader align="end" numeric>Damaged</th>
                      <th slTableColumnHeader align="end" numeric>Rejected</th>
                      @if (!phone()) {
                        <th slTableColumnHeader>Bin and note</th>
                        @if (store.canSeeCost()) {
                          <th slTableColumnHeader align="end" numeric>Unit cost</th>
                        }
                      }
                    </tr>
                  </thead>
                  <tbody slTableBody>
                    @if (receipt() === null) {
                      @for (row of [1, 2]; track row) {
                        <tr slTableRow>
                          <th slTableRowHeader>
                            <span slSkeleton shape="text" inlineSize="70%"></span>
                          </th>
                          @for (cell of placeholderCells(); track $index) {
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                            </td>
                          }
                        </tr>
                      }
                    } @else {
                      @for (line of rows(); track line.id) {
                        <tr slTableRow>
                          <th slTableRowHeader>
                            <a
                              slLink
                              class="cell-text"
                              variant="neutral"
                              underline="hover"
                              [routerLink]="position(line).path"
                              [queryParams]="position(line).queryParams"
                              [title]="line.skuCode + ' · ' + line.skuName"
                            >
                              {{ line.skuCode }}
                            </a>
                          </th>
                          <td slTableCell align="end" numeric>
                            {{ amount(line.acceptedQuantity, line) }}
                          </td>
                          <td slTableCell align="end" numeric>
                            {{ amount(line.damagedQuantity, line) }}
                          </td>
                          <td slTableCell align="end" numeric>
                            {{ amount(line.rejectedQuantity, line) }}
                          </td>
                          @if (!phone()) {
                            <td slTableCell>
                              <span class="cell-text" [title]="binNote(line)">{{
                                binNote(line)
                              }}</span>
                            </td>
                            @if (store.canSeeCost()) {
                              <td slTableCell align="end" numeric>{{ money(line.unitCost) }}</td>
                            }
                          }
                        </tr>
                      }
                    }
                  </tbody>
                </div>
              </div>
              @if (receipt(); as r) {
                <span slText size="sm" tone="muted">{{ note() }}</span>
                <a
                  slLink
                  class="door"
                  data-testid="receipt-movements"
                  [routerLink]="movementsRoute"
                  [queryParams]="{ source: r.id }"
                  >What this receipt moved in the stock ledger</a
                >
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class GoodsReceiptPage {
  readonly store = inject(GoodsReceiptStore);
  private readonly route = inject(ActivatedRoute);

  readonly receivingRoute = RECEIVING_ROUTE;
  readonly ordersRoute = PURCHASE_ORDERS_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly phone = phoneSignal();

  readonly receipt = this.store.receipt;
  readonly rows = computed(() => this.store.detail()?.lines ?? []);

  readonly columns = computed(() => (this.phone() ? 4 : this.store.canSeeCost() ? 6 : 5));
  readonly placeholderCells = computed(() => Array.from({ length: this.columns() - 1 }));

  readonly counts = computed(() => {
    const rows = this.rows();
    return {
      intoStock: rows.filter(
        (line) => milli(line.acceptedQuantity) + milli(line.damagedQuantity) > 0,
      ).length,
      damaged: rows.filter((line) => milli(line.damagedQuantity) > 0).length,
      rejected: rows.filter((line) => milli(line.rejectedQuantity) > 0).length,
    };
  });

  readonly note = computed(() => {
    const cost = this.store.canSeeCost()
      ? ''
      : ` The unit cost is shown to holders of cost.view — ${HOLDERS['cost.view']}.`;
    return `Accepted and damaged units entered the stock as one receipt movement per line; the damaged ones then moved to the damaged bucket. Rejected units never entered it.${cost}`;
  });

  readonly missingStatus = computed<'not-found' | 'error' | 'forbidden'>(() => {
    const code = this.store.error()?.code;
    return code === 'FORBIDDEN' ? 'forbidden' : code === 'NOT_FOUND' ? 'not-found' : 'error';
  });
  readonly missingTitle = computed(() => {
    const status = this.missingStatus();
    return status === 'forbidden'
      ? 'This receipt was taken at another warehouse'
      : status === 'not-found'
        ? 'This receipt does not exist'
        : 'The receipt could not be loaded';
  });
  readonly missingWords = computed(() =>
    this.missingStatus() === 'forbidden'
      ? 'It was received at a warehouse your role is not scoped to, so it is not yours to read.'
      : (this.store.error()?.message ?? ''),
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      void this.store.open(id);
    });
  }

  lines(count: number): string {
    return `${count} ${count === 1 ? 'line' : 'lines'}`;
  }

  unit(line: ReceiptLine): string {
    return this.store.skus().get(line.skuId)?.unit ?? '';
  }

  amount(value: string, line: ReceiptLine): string {
    return `${formatQuantity(value)} ${this.unit(line)}`.trim();
  }

  binNote(line: ReceiptLine): string {
    const bin = line.locationId ? (this.store.bins().get(line.locationId) ?? '') : '';
    return [bin, line.note ?? ''].filter(Boolean).join(' · ') || '—';
  }

  money(value: { currency: 'USD' | 'EUR' | 'GBP' | 'BRL'; minor: number }): string {
    return formatMoney(value);
  }

  when(iso: string): string {
    return formatDateTime(iso);
  }

  position(line: ReceiptLine) {
    return positionLink(line.skuId, this.receipt()?.warehouseId);
  }
}
