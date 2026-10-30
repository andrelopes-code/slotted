import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlChart } from '@slotted/angular/chart';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderHeading,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardAction,
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
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { MovementListItem } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  formatDateTime,
  formatQuantity,
  MOVEMENT_LABEL,
} from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import {
  CYCLE_COUNTS_ROUTE,
  MOVEMENTS_ROUTE,
  positionLink,
  signed,
  STOCK_ROUTE,
  TRANSFER_STATUS_LABEL,
  TRANSFER_STATUS_TONE,
  TRANSFERS_ROUTE,
} from '../../core/inventory/inventory.model';
import { MOVEMENT_DAYS, OverviewStore } from '../../core/inventory/overview.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';

type FigureKey = 'belowSafety' | 'belowReorder' | 'nothingAvailable' | 'backordered';

/** The figures, each a count of positions and a door into the list with its pills (OV-01). */
const FIGURES: readonly {
  key: FigureKey;
  label: string;
  exception: string;
  /** One line on a card: a loading card reserves one line for it. */
  comparison: string;
  /** The row's second line on a phone, which has the width for it. */
  description: string;
  tone: 'danger' | 'warning';
}[] = [
  {
    key: 'belowSafety',
    label: 'Below safety stock',
    exception: 'below_safety',
    comparison: 'positions at risk',
    description: 'positions under the stock kept against surprises',
    tone: 'danger',
  },
  {
    key: 'nothingAvailable',
    label: 'Nothing available',
    exception: 'nothing_available',
    comparison: 'positions empty today',
    description: 'positions no order can be promised from',
    tone: 'danger',
  },
  {
    key: 'backordered',
    label: 'Short on orders',
    exception: 'backordered',
    comparison: 'positions short',
    description: 'positions with demand no reservation covers',
    tone: 'warning',
  },
  {
    key: 'belowReorder',
    label: 'Below reorder point',
    exception: 'below_reorder',
    comparison: 'positions to replenish',
    description: 'positions due for replenishment',
    tone: 'warning',
  },
];

/**
 * The inventory overview (§34.4): how many positions need a decision and
 * where, which ones first, what is moving between warehouses and what the
 * ledger did in the last fortnight.
 *
 * §11 asks the module to go beyond tables and names four workspaces. What the
 * data sustains is drawn and the rest is not: the backend holds a capacity per
 * warehouse and per location but no occupancy, so there is no capacity map;
 * it holds no category-level aggregate, so the "heatmap" is the exceptions by
 * warehouse, compared as bars; allocation pressure is the positions short on
 * orders; the movement timeline is the ledger counted day by day. Every
 * figure counts positions or movements, never quantities summed across units
 * (RP-08), and every figure opens the list that holds what it counts (OV-01).
 *
 * The four figures are exceptions, each a door into the stock list; the
 * transfers still moving are counted in their own section's door. On a phone
 * the order is what a reader acts on first: the figures as a list of doors, the positions to act on, the transfers in flight, then the two
 * charts and the ledger's last rows (OV-02).
 */
@Component({
  selector: 'app-overview-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlChart,
    SlGrid,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderHeading,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlStack,
    SlStatCard,
    SlStatCardAction,
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
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .board {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'figures' 'exceptions' 'transfers' 'days' 'warehouses' 'recent';
      gap: var(--slotted-space-6);
    }
    .figures {
      grid-area: figures;
    }
    .exceptions {
      grid-area: exceptions;
    }
    .transfers {
      grid-area: transfers;
    }
    .days {
      grid-area: days;
    }
    .warehouses {
      grid-area: warehouses;
    }
    .recent {
      grid-area: recent;
    }
    /* literal: the expanded size class (EXPANDED_FROM in @slotted/core/measure), where two columns fit */
    @container (width >= 1024px) {
      .board {
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        grid-template-areas:
          'figures figures'
          'exceptions warehouses'
          'transfers days'
          'recent recent';
      }
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
    .short {
      color: var(--slotted-tone-danger-text);
    }
    .down {
      color: var(--slotted-tone-danger-text);
    }
    .up {
      color: var(--slotted-tone-success-text);
    }
  `,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>Inventory</h1>
              <p slPageHeaderSubheading>{{ scopeWords() }}</p>
            </div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="Inventory actions" overflow="menu">
                <div slToolbarItem [slToolbarItemCounterpart]="stockItem">
                  <a slButtonLink variant="outline" tone="secondary" [routerLink]="stockRoute"
                    >All stock</a
                  >
                </div>
                @if (canTransfer()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="transferItem">
                    <a slButtonLink variant="ghost" tone="secondary" [routerLink]="newTransfer"
                      >New transfer</a
                    >
                  </div>
                }
                @if (canCount()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="countItem">
                    <a slButtonLink variant="ghost" tone="secondary" [routerLink]="newCount"
                      >Plan a count</a
                    >
                  </div>
                }
                <sl-toolbar-overflow />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="board">
          <div class="figures" slStack [gap]="3">
            @if (phone()) {
              <!--
                On a phone the figures are a list of doors (OV-02): five cards two by two
                fill the first screen before a single position is named, and each card's
                door wraps under its label. A row is the door, a touch target tall.
              -->
              <ul
                slList
                variant="ruled"
                aria-label="Positions that need a decision"
                data-testid="figures"
              >
                @for (door of doors(); track door.key) {
                  <li slListItem>
                    <a slListItemContent [routerLink]="door.route" [queryParams]="door.params">
                      <span slListItemBody>
                        <span slListItemLabel>{{ door.label }}</span>
                        <span slListItemDescription>{{ door.description }}</span>
                      </span>
                      <span slListItemEnd>
                        @if (store.figures().value === null) {
                          <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                        } @else {
                          {{ figureValue(door.key) }}
                        }
                      </span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <div slGrid [columns]="4" minItemWidth="xs" [gap]="4" data-testid="figures">
                @for (door of doors(); track door.key) {
                  <div slStatCard size="sm" [loading]="store.figures().value === null">
                    <div slStatCardHeader>
                      <span slStatCardLabel>{{ door.label }}</span>
                      <span slStatCardAction>
                        <a
                          slLink
                          [routerLink]="door.route"
                          [queryParams]="door.params"
                          [attr.aria-label]="'Open the ' + door.label.toLowerCase()"
                          >Open</a
                        >
                      </span>
                    </div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ figureValue(door.key) }}</span>
                      <p slStatCardComparison>{{ door.comparison }}</p>
                    </div>
                  </div>
                }
              </div>
            }
            @if (store.figures().failed) {
              <div slInlineMessage tone="danger">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">The figures did not arrive.</span>
                  <button
                    slButton
                    size="sm"
                    variant="outline"
                    tone="secondary"
                    type="button"
                    (click)="retry()"
                  >
                    Try again
                  </button>
                </span>
              </div>
            }
            <span slText size="sm" tone="muted">
              Each figure counts positions — one SKU in one warehouse — because the SKUs are counted
              in five different units and a total of them would be a number of nothing.
            </span>
          </div>

          <section slSection class="exceptions">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Act on these first</h2></div>
              <div slSectionActions>
                <a
                  slButtonLink
                  variant="ghost"
                  tone="secondary"
                  size="sm"
                  [routerLink]="stockRoute"
                  [queryParams]="{ exception: 'below_safety' }"
                  >{{ exceptionsLink() }}</a
                >
              </div>
            </div>
            <div slSectionBody>
              <div
                slTable
                variant="framed"
                [columns]="phone() ? 3 : 5"
                [layout]="phone() ? 'fixed' : 'auto'"
                data-testid="exceptions"
              >
                <div slTableContent>
                  <caption slTableCaption>
                    Below safety stock, least available first
                  </caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>SKU</th>
                      @if (!phone()) {
                        <th slTableColumnHeader>Warehouse</th>
                      }
                      <th slTableColumnHeader align="end" numeric>Available</th>
                      @if (!phone()) {
                        <th slTableColumnHeader align="end" numeric>Safety stock</th>
                        <th slTableColumnHeader align="end" numeric>Inbound</th>
                      }
                      <th slTableColumnHeader align="end" numeric>Short</th>
                    </tr>
                  </thead>
                  @if (store.exceptions().value; as exceptions) {
                    @if (exceptions.rows.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>Every position is above its safety stock</h3>
                                <p slResultStateDescription>
                                  Nothing here needs replenishing before the next order.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody
                        slTableBody
                        [attr.aria-busy]="store.exceptions().pending ? 'true' : null"
                      >
                        @for (row of exceptions.rows; track row.skuId + row.warehouseId) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <a
                                slLink
                                class="cell-text"
                                variant="neutral"
                                underline="hover"
                                [routerLink]="position(row.skuId, row.warehouseId).path"
                                [queryParams]="position(row.skuId, row.warehouseId).queryParams"
                                [title]="
                                  row.skuCode + ' · ' + row.skuName + ' in ' + row.warehouseCode
                                "
                              >
                                {{ row.skuCode }}{{ phone() ? ' · ' + row.warehouseCode : '' }}
                              </a>
                            </th>
                            @if (!phone()) {
                              <td slTableCell>{{ row.warehouseCode }}</td>
                            }
                            <td slTableCell align="end" numeric>
                              <span [class.short]="nothing(row.available)"
                                >{{ q(row.available) }} {{ row.unitOfMeasure }}</span
                              >
                            </td>
                            @if (!phone()) {
                              <td slTableCell align="end" numeric>{{ q(row.safetyStock) }}</td>
                              <td slTableCell align="end" numeric>{{ q(row.inbound) }}</td>
                            }
                            <td slTableCell align="end" numeric>{{ q(row.backordered) }}</td>
                          </tr>
                        }
                      </tbody>
                    }
                  } @else if (store.exceptions().failed) {
                    <tbody slTableBody>
                      <tr slTableRow>
                        <td slTableEmpty>
                          <div slResultState status="error" reach="section">
                            <div slResultStateContent>
                              <h3 slResultStateTitle>The positions did not arrive</h3>
                              <p slResultStateDescription>
                                <button slButton size="sm" type="button" (click)="retry()">
                                  Try again
                                </button>
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  } @else {
                    <tbody slTableBody slSkeletonRegion [messages]="{ label: 'Reading the positions' }">
                      @for (row of placeholderRows; track row) {
                        <tr slTableRow>
                          <th slTableRowHeader>
                            <span slSkeleton shape="text" inlineSize="70%"></span>
                          </th>
                          @if (!phone()) {
                            <td slTableCell>
                              <span slSkeleton shape="text" inlineSize="3rem"></span>
                            </td>
                          }
                          <td slTableCell align="end">
                            <span slSkeleton shape="text" inlineSize="3rem"></span>
                          </td>
                          @if (!phone()) {
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2rem"></span>
                            </td>
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="2rem"></span>
                            </td>
                          }
                          <td slTableCell align="end">
                            <span slSkeleton shape="text" inlineSize="2rem"></span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  }
                </div>
              </div>
              <span slText size="sm" tone="muted"
                >Short is the open order demand no reservation covers, in the SKU's own unit.</span
              >
            </div>
          </section>

          <section slSection class="warehouses">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Where the exceptions are</h2></div>
            </div>
            <div slSectionBody>
              @if (warehouseChart()) {
                <figure
                  slChart
                  data-testid="warehouse-chart"
                  title="Exceptions by warehouse"
                  description="Positions in each warehouse, by the exception they are in"
                  [size]="phone() ? 'sm' : 'md'"
                  locale="en-US"
                  toolbar="hover"
                  [data]="warehouseData()"
                  [series]="warehouseSeries"
                  [x]="{ field: 'code' }"
                  [y]="{ label: 'Positions' }"
                  [loading]="store.byWarehouse().value === null && !store.byWarehouse().failed"
                  [error]="store.byWarehouse().failed"
                  (retry)="retry()"
                ></figure>
              } @else {
                <span slText size="sm" tone="muted">{{ singleWarehouseWords() }}</span>
              }
            </div>
          </section>

          <section slSection class="transfers">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Transfers in flight</h2></div>
              <div slSectionActions>
                <a
                  slButtonLink
                  variant="ghost"
                  tone="secondary"
                  size="sm"
                  [routerLink]="transfersRoute"
                  [queryParams]="{ status: 'in_flight' }"
                  >{{ inFlightLink() }}</a
                >
              </div>
            </div>
            <div slSectionBody>
              <div
                slTable
                variant="framed"
                [columns]="3"
                [layout]="phone() ? 'fixed' : 'auto'"
                data-testid="transfers"
              >
                <div slTableContent>
                  <caption slTableCaption>
                    Ready, shipped or part received
                  </caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>Transfer</th>
                      <th slTableColumnHeader>Route</th>
                      <th slTableColumnHeader>Status</th>
                    </tr>
                  </thead>
                  @if (store.transfers().value; as transfers) {
                    @if (transfers.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No stock is moving between warehouses</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (transfer of transfers; track transfer.id) {
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
                              {{ transfer.sourceWarehouseCode }} →
                              {{ transfer.destinationWarehouseCode }}
                            </td>
                            <td slTableCell>
                              <span
                                slBadge
                                variant="soft"
                                size="sm"
                                [tone]="transferTone(transfer.status)"
                                >{{ transferWord(transfer.status) }}</span
                              >
                            </td>
                          </tr>
                        }
                      </tbody>
                    }
                  } @else {
                    <tbody slTableBody slSkeletonRegion [messages]="{ label: 'Reading the transfers' }">
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slSkeleton shape="text" inlineSize="70%"></span>
                        </th>
                        <td slTableCell><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                        <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                      </tr>
                    </tbody>
                  }
                </div>
              </div>
            </div>
          </section>

          <section slSection class="days">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>The ledger, day by day</h2></div>
            </div>
            <div slSectionBody>
              <figure
                slChart
                data-testid="movement-chart"
                [title]="'Movements in the last ' + days + ' days'"
                description="Movements that brought stock in and took it out, counted per day"
                [size]="phone() ? 'sm' : 'md'"
                locale="en-US"
                toolbar="hover"
                [data]="dayData()"
                [series]="daySeries"
                [x]="{ field: 'label' }"
                [y]="{ label: 'Movements' }"
                [loading]="store.movementDays().value === null && !store.movementDays().failed"
                [error]="store.movementDays().failed"
                (retry)="retry()"
              ></figure>
            </div>
          </section>

          <section slSection class="recent">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Latest movements</h2></div>
              <div slSectionActions>
                <a
                  slButtonLink
                  variant="ghost"
                  tone="secondary"
                  size="sm"
                  [routerLink]="movementsRoute"
                  >The whole ledger</a
                >
              </div>
            </div>
            <div slSectionBody>
              <div
                slTable
                variant="framed"
                [columns]="phone() ? 3 : 5"
                [layout]="phone() ? 'fixed' : 'auto'"
                data-testid="recent"
              >
                <div slTableContent>
                  <caption slTableCaption>
                    The last movements the ledger holds
                  </caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>When</th>
                      <th slTableColumnHeader>SKU</th>
                      @if (!phone()) {
                        <th slTableColumnHeader>What</th>
                        <th slTableColumnHeader>Where</th>
                      }
                      <th slTableColumnHeader align="end" numeric>On hand</th>
                    </tr>
                  </thead>
                  @if (store.recent().value; as recent) {
                    <tbody slTableBody>
                      @for (movement of recent; track movement.id) {
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
                            <td slTableCell>{{ kind(movement) }}</td>
                            <td slTableCell>{{ movement.warehouseCode }}</td>
                          }
                          <td slTableCell align="end" numeric>
                            <span
                              [class.down]="movement.onHandDelta.startsWith('-')"
                              [class.up]="
                                !movement.onHandDelta.startsWith('-') &&
                                movement.onHandDelta !== '0'
                              "
                              >{{ delta(movement.onHandDelta) }}</span
                            >
                          </td>
                        </tr>
                      }
                    </tbody>
                  } @else {
                    <tbody slTableBody slSkeletonRegion [messages]="{ label: 'Reading the movements' }">
                      @for (row of placeholderRows; track row) {
                        <tr slTableRow>
                          <th slTableRowHeader>
                            <span slSkeleton shape="text" inlineSize="70%"></span>
                          </th>
                          <td slTableCell>
                            <span slSkeleton shape="text" inlineSize="5rem"></span>
                          </td>
                          @if (!phone()) {
                            <td slTableCell>
                              <span slSkeleton shape="text" inlineSize="4rem"></span>
                            </td>
                            <td slTableCell>
                              <span slSkeleton shape="text" inlineSize="3rem"></span>
                            </td>
                          }
                          <td slTableCell align="end">
                            <span slSkeleton shape="text" inlineSize="2rem"></span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  }
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ng-template #stockItem><a slMenuItem [routerLink]="stockRoute">All stock</a></ng-template>
      <ng-template #transferItem
        ><a slMenuItem [routerLink]="newTransfer">New transfer</a></ng-template
      >
      <ng-template #countItem><a slMenuItem [routerLink]="newCount">Plan a count</a></ng-template>
    </div>
  `,
})
export class OverviewPage {
  readonly store = inject(OverviewStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);

  readonly stockRoute = STOCK_ROUTE;
  readonly transfersRoute = TRANSFERS_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly newTransfer = `${TRANSFERS_ROUTE}/new`;
  readonly newCount = `${CYCLE_COUNTS_ROUTE}/new`;
  /** Every figure with the list it opens: the positions with its pill, or the transfers still moving. */
  readonly doors = computed(() =>
    FIGURES.map((figure) => ({
      ...figure,
      route: STOCK_ROUTE,
      params: { exception: figure.exception } as Record<string, string>,
    })),
  );

  readonly days = MOVEMENT_DAYS;
  /** The regions' first pages are eight rows each: the wait reserves eight (loading-states §2). */
  readonly placeholderRows = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly phone = phoneSignal();

  readonly warehouseSeries = [
    { id: 'belowSafety', kind: 'bar', field: 'belowSafety', label: 'Below safety stock' },
    { id: 'belowReorder', kind: 'bar', field: 'belowReorder', label: 'Below reorder point' },
    { id: 'backordered', kind: 'bar', field: 'backordered', label: 'Short on orders' },
  ] as const;

  readonly daySeries = [
    { id: 'in', kind: 'bar', field: 'in', label: 'Brought stock in' },
    { id: 'out', kind: 'bar', field: 'out', label: 'Took stock out' },
  ] as const;

  readonly canTransfer = computed(() => {
    void this.session.session();
    return this.session.can('inventory.transfer');
  });
  readonly canCount = computed(() => {
    void this.session.session();
    return this.session.can('inventory.cycle_count');
  });

  readonly warehouseChart = computed(() => this.warehouses.inScope().length > 1);
  readonly warehouseData = computed(() =>
    (this.store.byWarehouse().value ?? []).map((row) => ({ ...row })),
  );
  readonly dayData = computed(() =>
    (this.store.movementDays().value ?? []).map((row) => ({
      ...row,
      label: formatDate(`${row.day}T12:00:00Z`).replace(/, \d{4}$/, ''),
    })),
  );

  readonly scopeWords = computed(() => {
    const single = this.store.single();
    if (single) return `${single.code} ${single.name}, the warehouse your role is scoped to`;
    return `${this.warehouses.inScope().length} warehouses · as of ${this.store.today() ? formatDate(`${this.store.today()}T12:00:00Z`) : '…'}`;
  });

  readonly singleWarehouseWords = computed(() => {
    const byWarehouse = this.store.byWarehouse().value?.[0];
    if (!byWarehouse) return '';
    return `Your scope is one warehouse, so there is nothing to compare: ${byWarehouse.code} holds ${byWarehouse.belowSafety} positions below safety stock, ${byWarehouse.belowReorder} below reorder point and ${byWarehouse.backordered} short on orders.`;
  });

  readonly inFlightLink = computed(() => {
    const total = this.store.figures().value?.transfersInFlight;
    return total === undefined ? 'All in flight' : `All ${total} in flight`;
  });

  readonly exceptionsLink = computed(() => {
    const total = this.store.exceptions().value?.total;
    return total === undefined
      ? 'All below safety stock'
      : `All ${total.toLocaleString('en-US')} below safety stock`;
  });

  constructor() {
    // A persona, a scenario or a day moved: every region reads again from nothing.
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) this.store.forget();
        tenant = key;
        void this.store.open();
      });
    });
  }

  retry(): void {
    void this.store.open();
  }

  figureValue(key: FigureKey): string {
    const figures = this.store.figures().value;
    return figures === null ? '—' : figures[key].toLocaleString('en-US');
  }

  position(skuId: string, warehouseId: string) {
    return positionLink(skuId, warehouseId);
  }

  q(value: string): string {
    return formatQuantity(value);
  }

  nothing(value: string): boolean {
    return Number(value) <= 0;
  }

  delta(value: string): string {
    return signed(value, formatQuantity);
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  kind(movement: MovementListItem): string {
    return MOVEMENT_LABEL[movement.type] ?? 'Movement';
  }

  transferWord(status: keyof typeof TRANSFER_STATUS_LABEL): string {
    return TRANSFER_STATUS_LABEL[status];
  }

  transferTone(status: keyof typeof TRANSFER_STATUS_TONE) {
    return TRANSFER_STATUS_TONE[status];
  }
}
