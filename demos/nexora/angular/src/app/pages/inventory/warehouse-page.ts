import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlGrid } from '@slotted/angular/grid';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderBack,
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
import type { MovementListItem } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  formatDateTime,
  formatQuantity,
  MOVEMENT_LABEL,
  movementSourceLabel,
} from '../../core/catalog/catalog.model';
import {
  CYCLE_COUNT_STATUS_LABEL,
  CYCLE_COUNT_STATUS_TONE,
  CYCLE_COUNTS_ROUTE,
  LOCATION_TYPE_LABEL,
  MOVEMENTS_ROUTE,
  positionLink,
  signed,
  STOCK_ROUTE,
  TRANSFER_STATUS_LABEL,
  TRANSFER_STATUS_TONE,
  TRANSFERS_ROUTE,
  WAREHOUSE_STATUS_LABEL,
  WAREHOUSE_STATUS_TONE,
  WAREHOUSES_ROUTE,
} from '../../core/inventory/inventory.model';
import { WarehouseStore } from '../../core/inventory/warehouse.store';
import { phoneSignal } from '../../core/layout/phone';

type View = 'stock' | 'locations' | 'movements' | 'counts' | 'transfers';

/**
 * One warehouse: the place, its figures, and what happens in it as the
 * header's tabs, each a table with its count (RP-03) that leads to the list
 * holding all of it. The locations are §60.8's: the bins, and the four special
 * places — receiving, staging, quarantine and damaged.
 */
@Component({
  selector: 'app-warehouse-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlGrid,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderBack,
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
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
    .down {
      color: var(--slotted-tone-danger-text);
    }
    .up {
      color: var(--slotted-tone-success-text);
    }
  `,
  template: `
    @if (missing(); as reason) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="warehousesRoute">Warehouses</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Warehouse</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div slResultState [status]="reason" reach="section" data-testid="warehouse-missing">
            <div slResultStateContent>
              <h2 slResultStateTitle>
                {{
                  reason === 'forbidden'
                    ? 'This warehouse is outside your scope'
                    : reason === 'not-found'
                      ? 'This warehouse does not exist'
                      : 'The warehouse could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>
                {{
                  reason === 'forbidden'
                    ? 'Your role reads the stock of the warehouses it is scoped to, and this is not one of them.'
                    : store.error()?.message
                }}
              </p>
            </div>
            <div slResultStateActions>
              @if (reason === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="warehousesRoute"
                >Back to warehouses</a
              >
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.record() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="warehousesRoute">Warehouses</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ warehouse()?.code ?? 'Warehouse' }}</h1>
                @if (warehouse(); as w) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()"
                      ><span slTagBody>{{ statusWord() }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>
                    {{ w.name }} · {{ w.managerName }} · {{ w.address.city }},
                    {{ w.address.region }}
                  </p>
                } @else {
                  <!-- Every record carries its status: the mark keeps a small tag's box, on its own line on a phone as when loaded. -->
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="4rem"></span></span></span
                  ></span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="50%"></span>
                  </p>
                }
              </div>
            </div>
          </div>
          <div slPageHeaderTabs>
            <div slTabs [value]="view()" (valueChange)="setView($event.value)">
              <div slTabList aria-label="Warehouse sections">
                <div slTab value="stock">
                  Below reorder {{ count(record()?.belowReorder?.total) }}
                </div>
                <div slTab value="locations">
                  Locations {{ count(record()?.locations?.length) }}
                </div>
                <div slTab value="movements">Movements {{ count(record()?.movements?.total) }}</div>
                <div slTab value="counts">Counts {{ count(record()?.counts?.total) }}</div>
                <div slTab value="transfers">Transfers {{ count(record()?.transfers?.total) }}</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (record(); as r) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Positions</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ number(r.positions) }}</span>
                    <p slStatCardComparison>SKUs held here</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Below reorder point</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ number(r.belowReorder.total) }}</span>
                    <p slStatCardComparison>positions to replenish</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Nothing available</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ number(r.nothingAvailable) }}</span>
                    <p slStatCardComparison>positions an order cannot be promised from</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Locations</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ r.locations.length }}</span>
                    <p slStatCardComparison>{{ blockedWord() }}</p>
                  </div>
                </div>
              </div>

              @switch (view()) {
                @case ('stock') {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 5"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        Positions below their reorder point, least available first
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>SKU</th>
                          <th slTableColumnHeader align="end" numeric>Available</th>
                          @if (!phone()) {
                            <th slTableColumnHeader align="end" numeric>Reorder point</th>
                            <th slTableColumnHeader align="end" numeric>Inbound</th>
                          }
                          <th slTableColumnHeader align="end" numeric>Backordered</th>
                        </tr>
                      </thead>
                      @if (r.belowReorder.rows.length === 0) {
                        <tbody slTableBody>
                          <tr slTableRow>
                            <td slTableEmpty>
                              <div slResultState status="empty" reach="section">
                                <div slResultStateContent>
                                  <h3 slResultStateTitle>
                                    Nothing here is below its reorder point
                                  </h3>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      } @else {
                        <tbody slTableBody>
                          @for (row of r.belowReorder.rows; track row.skuId) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a
                                  slLink
                                  class="cell-text"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="position(row.skuId).path"
                                  [queryParams]="position(row.skuId).queryParams"
                                  [title]="row.skuCode + ' · ' + row.skuName"
                                >
                                  {{ row.skuCode }}
                                </a>
                              </th>
                              <td slTableCell align="end" numeric>
                                {{ q(row.available) }} {{ row.unitOfMeasure }}
                              </td>
                              @if (!phone()) {
                                <td slTableCell align="end" numeric>{{ q(row.reorderPoint) }}</td>
                                <td slTableCell align="end" numeric>{{ q(row.inbound) }}</td>
                              }
                              <td slTableCell align="end" numeric>{{ q(row.backordered) }}</td>
                            </tr>
                          }
                        </tbody>
                      }
                    </div>
                  </div>
                  <a
                    slButtonLink
                    variant="ghost"
                    tone="secondary"
                    size="sm"
                    [routerLink]="stockRoute"
                    [queryParams]="{ warehouse: id(), exception: 'below_reorder' }"
                  >
                    All {{ number(r.belowReorder.total) }} positions below reorder point in
                    {{ warehouse()?.code }}
                  </a>
                }
                @case ('locations') {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 5"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        Locations, by zone
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>Location</th>
                          <th slTableColumnHeader>Kind</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>Zone</th>
                            <th slTableColumnHeader align="end" numeric>Capacity</th>
                          }
                          <th slTableColumnHeader>Status</th>
                        </tr>
                      </thead>
                      <tbody slTableBody>
                        @for (location of r.locations; track location.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span class="cell-text">{{ location.code }}</span>
                            </th>
                            <td slTableCell>{{ kind(location.type) }}</td>
                            @if (!phone()) {
                              <td slTableCell>{{ location.zone }}</td>
                              <td slTableCell align="end" numeric>
                                {{
                                  location.capacityCubicMeters
                                    ? location.capacityCubicMeters + ' m³'
                                    : ''
                                }}
                              </td>
                            }
                            <td slTableCell>
                              @if (location.status === 'blocked') {
                                <span slBadge variant="soft" tone="danger" size="sm">Blocked</span>
                              } @else {
                                <span slText size="sm" tone="muted">Active</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </div>
                  </div>
                  <span slText size="sm" tone="muted"
                    >A blocked location takes no new reservation, put-away or adjustment.</span
                  >
                }
                @case ('movements') {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 5"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        The latest movements in
                        {{
                          warehouse()?.code
                        }}
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>When</th>
                          <th slTableColumnHeader>SKU</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>What</th>
                            <th slTableColumnHeader>From</th>
                          }
                          <th slTableColumnHeader align="end" numeric>On hand</th>
                        </tr>
                      </thead>
                      <tbody slTableBody>
                        @for (movement of r.movements.rows; track movement.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <a
                                slLink
                                class="cell-text"
                                variant="neutral"
                                underline="hover"
                                [routerLink]="[movementsRoute, movement.id]"
                                >{{ dateTime(movement.occurredAt) }}</a
                              >
                            </th>
                            <td slTableCell>
                              <span class="cell-text" [title]="movement.skuName">{{
                                movement.skuCode
                              }}</span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell>{{ movementWord(movement) }}</td>
                              <td slTableCell>{{ sourceWord(movement) }}</td>
                            }
                            <td slTableCell align="end" numeric>
                              <span
                                [class.down]="movement.onHandDelta.startsWith('-')"
                                [class.up]="
                                  !movement.onHandDelta.startsWith('-') &&
                                  movement.onHandDelta !== '0'
                                "
                              >
                                {{ delta(movement.onHandDelta) }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </div>
                  </div>
                  <a
                    slButtonLink
                    variant="ghost"
                    tone="secondary"
                    size="sm"
                    [routerLink]="movementsRoute"
                    [queryParams]="{ warehouse: id() }"
                  >
                    All {{ number(r.movements.total) }} movements in {{ warehouse()?.code }}
                  </a>
                }
                @case ('counts') {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 4"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        Cycle counts of
                        {{
                          warehouse()?.code
                        }}
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>Count</th>
                          <th slTableColumnHeader>Status</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>Planned</th>
                          }
                          <th slTableColumnHeader align="end" numeric>With variance</th>
                        </tr>
                      </thead>
                      @if (r.counts.rows.length === 0) {
                        <tbody slTableBody>
                          <tr slTableRow>
                            <td slTableEmpty>
                              <div slResultState status="empty" reach="section">
                                <div slResultStateContent>
                                  <h3 slResultStateTitle>No count has been planned here</h3>
                                  <p slResultStateDescription>
                                    A count is planned from the cycle counts list.
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      } @else {
                        <tbody slTableBody>
                          @for (count of r.counts.rows; track count.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a
                                  slLink
                                  class="cell-text"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="[countsRoute, count.id]"
                                  >{{ count.cycleCountNumber }}</a
                                >
                              </th>
                              <td slTableCell>
                                <span
                                  slBadge
                                  variant="soft"
                                  size="sm"
                                  [tone]="countTone(count.status)"
                                  >{{ countWord(count.status) }}</span
                                >
                              </td>
                              @if (!phone()) {
                                <td slTableCell>{{ date(count.plannedDate) }}</td>
                              }
                              <td slTableCell align="end" numeric>
                                {{ count.varianceLineCount }} of {{ count.lineCount }}
                              </td>
                            </tr>
                          }
                        </tbody>
                      }
                    </div>
                  </div>
                }
                @case ('transfers') {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 3 : 4"
                    [layout]="phone() ? 'fixed' : 'auto'"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        Transfers that leave or reach
                        {{
                          warehouse()?.code
                        }}
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>Transfer</th>
                          <th slTableColumnHeader>Status</th>
                          <th slTableColumnHeader>Route</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>Requested</th>
                          }
                        </tr>
                      </thead>
                      @if (r.transfers.rows.length === 0) {
                        <tbody slTableBody>
                          <tr slTableRow>
                            <td slTableEmpty>
                              <div slResultState status="empty" reach="section">
                                <div slResultStateContent>
                                  <h3 slResultStateTitle>
                                    No transfer leaves or reaches this warehouse
                                  </h3>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      } @else {
                        <tbody slTableBody>
                          @for (transfer of r.transfers.rows; track transfer.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a
                                  slLink
                                  class="cell-text"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="[transfersRoute, transfer.id]"
                                  >{{ transfer.transferNumber }}</a
                                >
                              </th>
                              <td slTableCell>
                                <span
                                  slBadge
                                  variant="soft"
                                  size="sm"
                                  [tone]="transferTone(transfer.status)"
                                  >{{ transferWord(transfer.status) }}</span
                                >
                              </td>
                              <td slTableCell>
                                {{ transfer.sourceWarehouseCode }} →
                                {{ transfer.destinationWarehouseCode }}
                              </td>
                              @if (!phone()) {
                                <td slTableCell>{{ date(transfer.requestedDate) }}</td>
                              }
                            </tr>
                          }
                        </tbody>
                      }
                    </div>
                  </div>
                }
              }
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the warehouse' }" [loading]="true">
                <div slStack [gap]="6">
                  <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                    @for (figure of figureLabels; track figure) {
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
                  <span slSkeletonText [lines]="4"></span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class WarehousePage {
  readonly store = inject(WarehouseStore);
  private readonly route = inject(ActivatedRoute);

  readonly warehousesRoute = WAREHOUSES_ROUTE;
  readonly stockRoute = STOCK_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly countsRoute = CYCLE_COUNTS_ROUTE;
  readonly transfersRoute = TRANSFERS_ROUTE;
  readonly phone = phoneSignal();
  readonly figureLabels = ['Positions', 'Below reorder point', 'Nothing available', 'Locations'];
  readonly view = signal<View>('stock');

  readonly warehouse = this.store.warehouse;
  readonly record = this.store.record;
  readonly id = this.store.id;

  readonly missing = computed<'forbidden' | 'not-found' | 'error' | null>(() => {
    if (this.store.outOfScope()) return 'forbidden';
    const error = this.store.error();
    if (error === null) return null;
    if (error.code === 'NOT_FOUND') return 'not-found';
    return error.code === 'FORBIDDEN' ? 'forbidden' : 'error';
  });

  readonly statusWord = computed(() => {
    const status = this.warehouse()?.status;
    return status ? WAREHOUSE_STATUS_LABEL[status] : '';
  });
  readonly statusTone = computed(() => {
    const status = this.warehouse()?.status;
    return status ? WAREHOUSE_STATUS_TONE[status] : 'secondary';
  });

  readonly blockedWord = computed(() => {
    const blocked =
      this.record()?.locations.filter((location) => location.status === 'blocked').length ?? 0;
    return blocked === 0 ? 'none blocked' : `${blocked} blocked`;
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

  setView(value: string | undefined): void {
    this.view.set((value ?? 'stock') as View);
  }

  /** A tab's count once the record has loaded; none on a phone, where five labels would not fit. */
  count(value: number | undefined): string {
    if (this.phone() || value === undefined) return '';
    return `(${value.toLocaleString('en-US')})`;
  }

  position(skuId: string) {
    return positionLink(skuId, this.id() ?? undefined);
  }

  q(value: string): string {
    return formatQuantity(value);
  }

  number(value: number): string {
    return value.toLocaleString('en-US');
  }

  kind(type: keyof typeof LOCATION_TYPE_LABEL): string {
    return LOCATION_TYPE_LABEL[type];
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  delta(value: string): string {
    return signed(value, formatQuantity);
  }

  movementWord(movement: MovementListItem): string {
    return MOVEMENT_LABEL[movement.type] ?? 'Movement';
  }

  sourceWord(movement: MovementListItem): string {
    return movementSourceLabel(movement.sourceEntityType);
  }

  countWord(status: keyof typeof CYCLE_COUNT_STATUS_LABEL): string {
    return CYCLE_COUNT_STATUS_LABEL[status];
  }

  countTone(status: keyof typeof CYCLE_COUNT_STATUS_TONE) {
    return CYCLE_COUNT_STATUS_TONE[status];
  }

  transferWord(status: keyof typeof TRANSFER_STATUS_LABEL): string {
    return TRANSFER_STATUS_LABEL[status];
  }

  transferTone(status: keyof typeof TRANSFER_STATUS_TONE) {
    return TRANSFER_STATUS_TONE[status];
  }
}
