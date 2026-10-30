import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderBack,
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
  SlSectionActions,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
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
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { AdjustmentReasonCode } from '@slotted/demo-nexora-backend';

import {
  formatDateTime,
  formatMoney,
  formatQuantity,
  MOVEMENT_LABEL,
  movementSourceLabel,
  SKU_STATUS_LABEL,
  SKU_STATUS_TONE,
  SKUS_ROUTE,
  UNIT_LABEL,
} from '../../core/catalog/catalog.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import {
  ADJUSTMENT_REASONS,
  fromMilli,
  milli,
  MOVEMENTS_ROUTE,
  movementSourceLink,
  positionLink,
  signed,
  STOCK_ROUTE,
  TRANSFERS_ROUTE,
} from '../../core/inventory/inventory.model';
import { PositionStore, type PositionRow } from '../../core/inventory/position.store';
import { phoneSignal } from '../../core/layout/phone';
import { PURCHASE_ORDERS_ROUTE } from '../../core/procurement/procurement.model';
import { SessionStore } from '../../core/session/session.store';
import { StockTable } from '../catalog/stock-table';
import { leaveForm } from './leave-form';

/**
 * One SKU's stock (`GET /inventory/:skuId`), standing on one of its
 * warehouses: the figures of the whole SKU, the decomposition by warehouse,
 * the chosen position's buckets and its ledger with the balance each movement
 * left behind (LG-02).
 *
 * The adjustment is a fact of the chosen position written where it is read
 * (FM-07): the position's section becomes the form, the figures and the table
 * above stay. The form is a query parameter, so the platform's back gesture
 * closes it without leaving the SKU.
 */

@Component({
  selector: 'app-position-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlForm,
    SlFormActions,
    SlGrid,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlMenuItem,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderBack,
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
    SlSectionActions,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSegment,
    SlSegmentedControl,
    SlSelect,
    SlSelectItem,
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
    SlTextarea,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
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
    .adjust {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: var(--slotted-space-5);
      max-inline-size: 48rem;
    }
    .adjust .wide {
      grid-column: 1 / -1;
    }
    /* literal: the form stacks where its two columns would each be narrower than a field's label */
    @container (width < 560px) {
      .adjust {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  template: `
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="stockRoute">Stock</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Stock of a SKU</h1></div>
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
                    : 'The stock could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ error.message }}</p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="stockRoute"
                >Back to stock</a
              >
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.positions() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="stockRoute">Stock</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>
                  @if (sku(); as item) {
                    {{ item.sku }}
                  } @else {
                    <!-- A SKU's code is thirteen characters in every catalogue entry, about six and a half ems of the heading: the placeholder keeps that width, so the marks wrap where the loaded ones will. -->
                    <span slSkeleton shape="text" inlineSize="6.5em"></span>
                  }
                </h1>
                @if (sku(); as item) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()">
                      <span slTagBody>{{ statusWord() }}</span>
                    </span>
                    @if (selected(); as row) {
                      <span slTag size="sm" [tone]="healthTone(row)">
                        <span slTagBody>{{ healthWord(row) }}</span>
                      </span>
                    }
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- The state's mark and the chosen warehouse's health: a small tag each. -->
                  <span slPageHeaderMarks>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="3rem"></span></span
                    ></span>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="5rem"></span></span
                    ></span>
                  </span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              <div slPageHeaderActions>
                <div slToolbar aria-label="This SKU elsewhere" overflow="menu">
                  <div slToolbarItem [slToolbarItemCounterpart]="catalogueItem">
                    <a
                      slButtonLink
                      variant="outline"
                      tone="secondary"
                      [routerLink]="catalogueRoute()"
                    >
                      Open in the catalogue
                    </a>
                  </div>
                  @if (orderParams(); as params) {
                    <div slToolbarItem [slToolbarItemCounterpart]="orderItem">
                      <a
                        slButtonLink
                        data-testid="create-po"
                        [routerLink]="orderNew"
                        [queryParams]="params"
                      >
                        Create purchase order
                      </a>
                    </div>
                  }
                  @if (canTransfer()) {
                    <div slToolbarItem [slToolbarItemCounterpart]="transferItem">
                      <a
                        slButtonLink
                        variant="ghost"
                        tone="secondary"
                        [routerLink]="transferNew"
                        [queryParams]="transferParams()"
                      >
                        Transfer from here
                      </a>
                    </div>
                  }
                  <sl-toolbar-overflow />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (sku(); as item) {
              <div slGrid [columns]="phone() ? 2 : figureColumns()" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Available</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue
                      >{{ quantity(sums().available)
                      }}<span slStatCardUnit>{{ unit() }}</span></span
                    >
                    <p slStatCardComparison>{{ placesWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>On hand</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue
                      >{{ quantity(sums().onHand) }}<span slStatCardUnit>{{ unit() }}</span></span
                    >
                    <p slStatCardComparison>{{ damagedWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Reserved</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue
                      >{{ quantity(sums().reserved) }}<span slStatCardUnit>{{ unit() }}</span></span
                    >
                    <p slStatCardComparison>{{ backorderWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Inbound</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue
                      >{{ quantity(sums().inbound) }}<span slStatCardUnit>{{ unit() }}</span></span
                    >
                    <p slStatCardComparison>bought or transferred</p>
                  </div>
                </div>
                @if (store.unitCostMinor() !== null) {
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Value</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ value() }}</span>
                      <p slStatCardComparison>at {{ unitCost() }} a unit</p>
                    </div>
                  </div>
                }
              </div>
              @if (!store.canSeeCost()) {
                <span slText size="sm" tone="muted" data-testid="cost-note">
                  What this stock is worth is not on this page: it needs cost.view, which a sales
                  manager, a buyer or an auditor holds.
                </span>
              }
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the stock' }" [loading]="true">
                <div slGrid [columns]="phone() ? 2 : figureColumns()" minItemWidth="xs" [gap]="4">
                  @for (figure of figureLabels(); track figure) {
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

            <app-stock-table
              [rows]="store.rows()"
              [unit]="unit()"
              [pending]="store.positions() === null"
              [phone]="phone()"
              [link]="rowLink"
              [chosen]="selected()?.warehouseId ?? null"
              caption="This SKU by warehouse"
            />

            @if (selected(); as row) {
              <section slSection data-testid="position-section">
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>{{ row.warehouseCode }} · {{ row.warehouseName }}</h2>
                    <p slSectionDescription>{{ positionWords(row) }}</p>
                  </div>
                  @if (store.canAdjust() && !adjusting()) {
                    <div slSectionActions>
                      <a
                        slButtonLink
                        size="sm"
                        variant="outline"
                        tone="secondary"
                        data-testid="adjust"
                        [routerLink]="[]"
                        [queryParams]="{ warehouse: row.warehouseId, adjust: 1 }"
                      >
                        Adjust stock
                      </a>
                    </div>
                  }
                </div>
                <div slSectionBody>
                  <div slStack [gap]="4">
                    @if (store.written(); as movement) {
                      <div slInlineMessage tone="success" data-testid="adjusted">
                        <span slInlineMessageIcon></span>
                        <span slStack [gap]="1">
                          <span slText size="sm">{{
                            writtenWords(movement.onHandDelta, movement.damagedDelta)
                          }}</span>
                          <a slLink [routerLink]="[movementsRoute, movement.id]"
                            >Open the movement in the ledger</a
                          >
                        </span>
                      </div>
                    }
                    @if (adjusting() && store.canAdjust()) {
                      <form
                        slForm
                        data-testid="adjust-form"
                        [messages]="{ summaryTitle: 'The stock was not adjusted' }"
                        [errors]="store.errors()"
                        (errorsChange)="store.errors.set($event.value)"
                        [loading]="store.saving()"
                        (formSubmit)="submit($event)"
                      >
                        @if (store.failure(); as failure) {
                          @if (failure.kind !== 'validation') {
                            <div
                              slInlineMessage
                              [tone]="tone(failure.kind)"
                              data-testid="adjust-failure"
                            >
                              <span slInlineMessageIcon></span>
                              <span slStack [gap]="1">
                                <span slText size="sm">{{ failure.message }}</span>
                                <span slText size="sm" tone="muted">{{
                                  advice(failure.kind)
                                }}</span>
                              </span>
                            </div>
                          }
                        }
                        <div class="adjust">
                          <div slField class="wide">
                            <label slFieldLabel>Direction</label>
                            <div
                              slSegmentedControl
                              aria-label="Direction of the adjustment"
                              [value]="draft().direction"
                              (valueChange)="setDirection($event.value)"
                            >
                              <label slSegment value="remove">Take stock out</label>
                              <label slSegment value="add">Add stock</label>
                            </div>
                          </div>
                          <div slField required [invalid]="!!error('quantityDelta')">
                            <label slFieldLabel>Quantity</label>
                            <div slNumberField>
                              <input
                                slNumberFieldInput
                                name="quantityDelta"
                                data-testid="quantity"
                                [min]="0"
                                [format]="{ maximumFractionDigits: store.precision() }"
                                [value]="draft().quantity"
                                (valueChange)="store.patch({ quantity: $event.value ?? null })"
                              />
                              <span slNumberFieldEnd>{{ unit() }}</span>
                            </div>
                            @if (error('quantityDelta'); as message) {
                              <p slFieldError>{{ message }}</p>
                            } @else {
                              <span slFieldDescription>{{ quantityHint(row) }}</span>
                            }
                          </div>
                          <div slField required [invalid]="!!error('reason')">
                            <label slFieldLabel>Reason</label>
                            <sl-select
                              name="reason"
                              data-testid="reason"
                              placeholder="Choose a reason"
                              [value]="draft().reason"
                              (valueChangeRequest)="setReason($event.value)"
                            >
                              @for (reason of reasons; track reason.value) {
                                <sl-select-item [value]="reason.value">{{
                                  reason.label
                                }}</sl-select-item>
                              }
                            </sl-select>
                            @if (error('reason'); as message) {
                              <p slFieldError>{{ message }}</p>
                            } @else {
                              <span slFieldDescription>{{ reasonHint() }}</span>
                            }
                          </div>
                          <div slField [invalid]="!!error('locationId')">
                            <label slFieldLabel>Location</label>
                            <sl-select
                              name="locationId"
                              placeholder="The warehouse as a whole"
                              clearable
                              [value]="draft().locationId"
                              (valueChangeRequest)="
                                store.patch({ locationId: $any($event.value) ?? null })
                              "
                            >
                              @for (location of store.locations(); track location.id) {
                                <sl-select-item
                                  [value]="location.id"
                                  [disabled]="location.status === 'blocked'"
                                >
                                  {{ location.code
                                  }}{{ location.status === 'blocked' ? ' — blocked' : '' }}
                                </sl-select-item>
                              }
                            </sl-select>
                            @if (error('locationId'); as message) {
                              <p slFieldError>{{ message }}</p>
                            } @else {
                              <span slFieldDescription
                                >Optional. A blocked location takes nothing.</span
                              >
                            }
                          </div>
                          <div
                            slField
                            class="wide"
                            [required]="store.noteRequired()"
                            [invalid]="!!error('note')"
                          >
                            <label slFieldLabel>Note</label>
                            <textarea
                              slTextarea
                              name="note"
                              data-testid="note"
                              [rows]="3"
                              [value]="draft().note"
                              (valueChange)="store.patch({ note: $event.value })"
                              placeholder="Pallet 4 crushed by a forklift during put-away."
                            ></textarea>
                            @if (error('note'); as message) {
                              <p slFieldError>{{ message }}</p>
                            } @else {
                              <span slFieldDescription data-testid="note-hint">{{
                                noteHint()
                              }}</span>
                            }
                          </div>
                          @if (previewWords(row); as words) {
                            <div
                              slInlineMessage
                              class="wide"
                              [tone]="store.isDamage() ? 'warning' : 'secondary'"
                              data-testid="preview"
                            >
                              <span slInlineMessageIcon></span>
                              {{ words }}
                            </div>
                          }
                        </div>
                        <div slFormActions>
                          <a
                            slButtonLink
                            variant="ghost"
                            tone="secondary"
                            [routerLink]="[]"
                            [queryParams]="{ warehouse: row.warehouseId }"
                          >
                            Cancel
                          </a>
                          <button
                            slButton
                            type="submit"
                            data-testid="adjust-submit"
                            [loading]="store.saving()"
                            [messages]="{ loading: 'Adjusting the stock' }"
                          >
                            {{ submitWord() }}
                          </button>
                        </div>
                      </form>
                    } @else {
                      <div slDescriptionList layout="row" [columns]="phone() ? 1 : 3">
                        @for (bucket of buckets(row); track bucket.term) {
                          <div slDescriptionListItem>
                            <dt slDescriptionListTerm>{{ bucket.term }}</dt>
                            <dd slDescriptionListDescription>{{ bucket.value }}</dd>
                          </div>
                        }
                      </div>
                      @if (!store.canAdjust() && !canAdjustAnywhere()) {
                        <span slText size="sm" tone="muted" data-testid="adjust-note">
                          Adjustments are written by holders of inventory.adjust: an administrator
                          or a warehouse manager.
                        </span>
                      }
                    }
                  </div>
                </div>
              </section>

              <div
                slTable
                variant="framed"
                [columns]="phone() ? 3 : 6"
                [layout]="phone() ? 'fixed' : 'auto'"
              >
                <div slTableContent>
                  <caption slTableCaption>
                    What moved this stock in
                    {{
                      row.warehouseCode
                    }}
                    lately
                  </caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>When</th>
                      <th slTableColumnHeader align="end" numeric>Change</th>
                      @if (!phone()) {
                        <th slTableColumnHeader>What</th>
                        <th slTableColumnHeader>From</th>
                        <th slTableColumnHeader align="end" numeric>Damaged</th>
                      }
                      <th slTableColumnHeader align="end" numeric>On hand after</th>
                    </tr>
                  </thead>
                  @if (store.positions() === null) {
                    <tbody slTableBody>
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slSkeleton shape="text" inlineSize="70%"></span>
                        </th>
                        <td slTableCell align="end">
                          <span slSkeleton shape="text" inlineSize="2rem"></span>
                        </td>
                        @if (!phone()) {
                          <td slTableCell>
                            <span slSkeleton shape="text" inlineSize="5rem"></span>
                          </td>
                          <td slTableCell>
                            <span slSkeleton shape="text" inlineSize="6rem"></span>
                          </td>
                          <td slTableCell align="end">
                            <span slSkeleton shape="text" inlineSize="1.5rem"></span>
                          </td>
                        }
                        <td slTableCell align="end">
                          <span slSkeleton shape="text" inlineSize="2rem"></span>
                        </td>
                      </tr>
                    </tbody>
                  } @else if (store.ledger().length === 0) {
                    <tbody slTableBody>
                      <tr slTableRow>
                        <td slTableEmpty>
                          <div slResultState status="empty" reach="section">
                            <div slResultStateContent>
                              <h3 slResultStateTitle>Nothing has moved this stock here lately</h3>
                              <p slResultStateDescription>
                                The hundred newest movements of this SKU are all in other
                                warehouses.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  } @else {
                    <tbody slTableBody>
                      @for (movement of store.ledger(); track movement.id) {
                        <tr
                          slTableRow
                          [attr.data-written]="movement.id === store.written()?.id ? '' : null"
                        >
                          <th slTableRowHeader>
                            <a
                              slLink
                              variant="neutral"
                              underline="hover"
                              class="cell-text"
                              [routerLink]="[movementsRoute, movement.id]"
                            >
                              {{ dateTime(movement.occurredAt) }}
                            </a>
                          </th>
                          <td slTableCell align="end" numeric>
                            <span
                              [class.down]="negative(movement.onHandDelta)"
                              [class.up]="positive(movement.onHandDelta)"
                            >
                              {{ delta(movement.onHandDelta) }}
                            </span>
                          </td>
                          @if (!phone()) {
                            <td slTableCell>{{ movementWord(movement.type) }}</td>
                            <td slTableCell>
                              @if (
                                sourceLink(movement.sourceEntityType, movement.sourceEntityId);
                                as to
                              ) {
                                <a
                                  slLink
                                  class="cell-text"
                                  [routerLink]="to.path"
                                  [queryParams]="to.queryParams ?? {}"
                                >
                                  {{ sourceWord(movement.sourceEntityType) }}
                                </a>
                              } @else {
                                <span class="cell-text">{{
                                  sourceWord(movement.sourceEntityType)
                                }}</span>
                              }
                            </td>
                            <td slTableCell align="end" numeric>
                              {{ delta(movement.damagedDelta) }}
                            </td>
                          }
                          <td slTableCell align="end" numeric>
                            {{ quantity(movement.balanceAfter) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  }
                </div>
              </div>
              <span slText size="sm" tone="muted">
                The balance after each movement is walked back from today's on hand, so it holds
                only here, where the ledger is one SKU in one warehouse.
                <a slLink [routerLink]="movementsRoute" [queryParams]="{ sku: store.skuId() }"
                  >Every movement of this SKU</a
                >
              </span>
            }
          </div>
        </div>
      </div>
      <ng-template #catalogueItem>
        <a slMenuItem [routerLink]="catalogueRoute()">Open in the catalogue</a>
      </ng-template>
      <ng-template #orderItem>
        <a slMenuItem [routerLink]="orderNew" [queryParams]="orderParams()"
          >Create purchase order</a
        >
      </ng-template>
      <ng-template #transferItem>
        <a slMenuItem [routerLink]="transferNew" [queryParams]="transferParams()"
          >Transfer from here</a
        >
      </ng-template>
    }
  `,
})
export class PositionPage {
  readonly store = inject(PositionStore);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);

  readonly stockRoute = STOCK_ROUTE;
  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly transferNew = `${TRANSFERS_ROUTE}/new`;
  readonly reasons = ADJUSTMENT_REASONS;
  readonly phone = phoneSignal();

  readonly sku = this.store.sku;
  readonly selected = this.store.selected;
  readonly draft = this.store.draft;
  readonly unit = this.store.unit;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  /** The form is a query parameter, so the back gesture closes it and stays on the SKU. */
  readonly adjusting = computed(() => this.queryParams().get('adjust') === '1');

  readonly rowLink = (row: PositionRow | { warehouseId: string }) =>
    positionLink(this.store.skuId() ?? '', row.warehouseId);

  readonly canAdjustAnywhere = computed(() => {
    void this.session.session();
    return this.session.can('inventory.adjust');
  });

  readonly canTransfer = computed(() => {
    void this.session.session();
    return this.session.can('inventory.transfer') && this.selected() !== null;
  });

  readonly orderNew = `${PURCHASE_ORDERS_ROUTE}/new`;

  /**
   * Journey B (§20): a position below its reorder point leads to the purchase
   * order that replenishes it — its SKU, its warehouse, the suggested quantity
   * and the SKU's preferred supplier. Null where there is nothing to reorder or
   * the reader does not write purchase orders.
   */
  readonly orderParams = computed<Record<string, string> | null>(() => {
    void this.session.session();
    const row = this.selected();
    const sku = this.sku();
    if (
      row === null ||
      sku === null ||
      !row.belowReorderPoint ||
      !this.session.can('purchase_orders.create')
    )
      return null;
    return {
      sku: sku.id,
      warehouse: row.warehouseId,
      ...(row.reorderSuggested && milli(row.suggestedQuantity) > 0
        ? { quantity: row.suggestedQuantity }
        : {}),
      ...(sku.preferredSupplierId ? { supplier: sku.preferredSupplierId } : {}),
    };
  });

  readonly transferParams = computed(() => ({
    from: this.selected()?.warehouseId ?? '',
    sku: this.store.skuId() ?? '',
  }));

  readonly catalogueRoute = computed(() => `${SKUS_ROUTE}/${this.store.skuId() ?? ''}`);

  readonly figureLabels = computed(() => [
    'Available',
    'On hand',
    'Reserved',
    'Inbound',
    ...(this.store.canSeeCost() ? ['Value'] : []),
  ]);
  readonly figureColumns = computed<4 | 5>(() => (this.figureLabels().length === 5 ? 5 : 4));

  /** The warehouses' positions add up to the figures; one SKU is one unit, so the sum means something. */
  readonly sums = computed(() => {
    const rows = this.store.rows();
    const sum = (
      field: 'available' | 'onHand' | 'reserved' | 'inbound' | 'damaged' | 'backordered',
    ) => fromMilli(rows.reduce((total, row) => total + milli(row[field]), 0));
    return {
      available: sum('available'),
      onHand: sum('onHand'),
      reserved: sum('reserved'),
      inbound: sum('inbound'),
      damaged: sum('damaged'),
      backordered: sum('backordered'),
      valueMinor: rows.reduce((total, row) => total + row.onHandValue.minor, 0),
    };
  });

  readonly statusWord = computed(() => {
    const status = this.sku()?.status;
    return status ? SKU_STATUS_LABEL[status] : '';
  });
  readonly statusTone = computed(() => {
    const status = this.sku()?.status;
    return status ? SKU_STATUS_TONE[status] : 'secondary';
  });

  readonly subheading = computed(() => {
    const item = this.sku();
    if (item === null) return '';
    const unit = UNIT_LABEL[item.unitOfMeasure] ?? item.unitOfMeasure;
    return [item.name, item.categoryName, `counted in ${unit}`].filter((part) => part).join(' · ');
  });

  /**
   * Where the stock is, or the line it crossed: nothing to promise, or the
   * warehouses below their reorder point. The card's tone is the trend's
   * (stat-card), so a crossing is words (RP-02).
   */
  readonly placesWord = computed(() => {
    const places = this.store.rows().length;
    const below = this.store.rows().filter((row) => row.belowReorderPoint).length;
    if (milli(this.sums().available) <= 0) return 'nothing to promise';
    if (below > 0) return `below reorder in ${below} of ${places}`;
    return `in ${places} ${places === 1 ? 'warehouse' : 'warehouses'}`;
  });
  readonly damagedWord = computed(() =>
    milli(this.sums().damaged) > 0
      ? `${formatQuantity(this.sums().damaged)} ${this.unit()} damaged`
      : 'none of it damaged',
  );
  readonly backorderWord = computed(() =>
    milli(this.sums().backordered) > 0
      ? `${formatQuantity(this.sums().backordered)} ${this.unit()} not covered`
      : 'every order covered',
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      void this.store.open(id, this.route.snapshot.queryParamMap.get('warehouse'));
    });
    this.route.queryParamMap.subscribe((params) => {
      this.store.choose(params.get('warehouse'));
      if (params.get('adjust') === '1') void this.store.loadLocations();
    });
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  tone(kind: Parameters<typeof toneFor>[0]): 'danger' | 'warning' {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]): string {
    return adviceFor(kind);
  }

  healthWord(row: PositionRow): string {
    if (milli(row.available) <= 0) return 'Nothing available';
    if (row.belowSafetyStock) return 'Below safety stock';
    if (row.belowReorderPoint) return 'Below reorder point';
    return 'In stock';
  }

  healthTone(row: PositionRow): 'success' | 'warning' | 'danger' {
    if (milli(row.available) <= 0 || row.belowSafetyStock) return 'danger';
    return row.belowReorderPoint ? 'warning' : 'success';
  }

  positionWords(row: PositionRow): string {
    const inbound =
      milli(row.inbound) > 0 ? `; ${formatQuantity(row.inbound)} ${this.unit()} on the way` : '';
    return `${formatQuantity(row.available)} ${this.unit()} can be promised today${inbound}.`;
  }

  buckets(row: PositionRow): { term: string; value: string }[] {
    const unit = this.unit();
    const q = (value: string) => `${formatQuantity(value)} ${unit}`;
    return [
      { term: 'On hand', value: q(row.onHand) },
      { term: 'Damaged', value: q(row.damaged) },
      { term: 'Quarantine', value: q(row.quarantine) },
      { term: 'Sellable', value: q(row.sellableOnHand) },
      { term: 'Reserved', value: q(row.reserved) },
      { term: 'Available', value: q(row.available) },
      { term: 'Backordered', value: q(row.backordered) },
      { term: 'Inbound', value: q(row.inbound) },
      { term: 'Reorder point', value: q(row.reorderPoint) },
      { term: 'Safety stock', value: q(row.safetyStock) },
      {
        term: 'Suggested reorder',
        value: row.reorderSuggested ? q(row.suggestedQuantity) : 'None',
      },
    ];
  }

  setDirection(value: string | undefined): void {
    if (value === 'add' || value === 'remove') this.store.patch({ direction: value });
  }

  setReason(value: unknown): void {
    this.store.patch({ reason: (value as AdjustmentReasonCode | null) ?? null });
  }

  quantityHint(row: PositionRow): string {
    return this.draft().direction === 'remove'
      ? `At most ${formatQuantity(row.sellableOnHand)} ${this.unit()}: the sellable stock here.`
      : `Counted in ${this.store.precision() === 0 ? 'whole ' : ''}${this.unit()}.`;
  }

  reasonHint(): string {
    const reason = this.reasons.find((entry) => entry.value === this.draft().reason);
    return reason?.description ?? 'Kept on the movement for everyone who reads the ledger.';
  }

  /** §60.7's threshold, said before the submit (FM-11). */
  noteHint(): string {
    const value = this.store.valueMinor();
    if (this.store.noteRequired())
      return value !== null
        ? `Required: this adjustment is worth ${formatMoney({ currency: 'USD', minor: value })} at standard cost.`
        : 'Required: the adjustment moves 10 units or more.';
    return value !== null
      ? 'Required from 10 units or US$1,000 at standard cost.'
      : 'Required from 10 units, or when Nexora finds the value reaches US$1,000 at standard cost.';
  }

  previewWords(row: PositionRow): string | null {
    const preview = this.store.preview();
    const delta = this.store.deltaMilli();
    if (preview === null || delta === null) return null;
    const unit = this.unit();
    const q = (value: string) => `${formatQuantity(value)} ${unit}`;
    if (this.store.isDamage())
      return `The ${q(fromMilli(Math.abs(delta)))} move to the damaged bucket: on hand stays at ${q(row.onHand)}, damaged goes to ${q(preview.damaged)} and available to ${q(preview.available)}.`;
    return `On hand at ${row.warehouseCode} goes from ${q(row.onHand)} to ${q(preview.onHand)}, and available to ${q(preview.available)}.`;
  }

  submitWord(): string {
    const delta = this.store.deltaMilli();
    if (delta === null || delta === 0) return 'Adjust stock';
    return `Adjust by ${signed(fromMilli(delta), formatQuantity)} ${this.unit()}`;
  }

  writtenWords(onHandDelta: string, damagedDelta: string): string {
    const row = this.selected();
    const where = row?.warehouseCode ?? '';
    if (milli(onHandDelta) === 0)
      return `Recorded: ${formatQuantity(damagedDelta)} ${this.unit()} moved to damaged at ${where}. The movement is the first row of the ledger below.`;
    return `Recorded: on hand at ${where} moved by ${signed(onHandDelta, formatQuantity)} ${this.unit()}. The movement is the first row of the ledger below.`;
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const row = this.selected();
    if (!(await this.store.adjust()) || row === null) return;
    this.toasts.show({
      title: `${this.sku()?.sku ?? 'SKU'} adjusted at ${row.warehouseCode}`,
      tone: 'success',
    });
    // The form leaves the history the way it came: back to the position, not forward.
    leaveForm(this.router, this.route, this.location, { warehouse: row.warehouseId });
  }

  value(): string {
    return formatMoney({ currency: 'USD', minor: this.sums().valueMinor });
  }

  unitCost(): string {
    return formatMoney({ currency: 'USD', minor: this.store.unitCostMinor() ?? 0 });
  }

  quantity(value: string): string {
    return formatQuantity(value);
  }

  delta(value: string): string {
    return signed(value, formatQuantity);
  }

  negative(value: string): boolean {
    return milli(value) < 0;
  }

  positive(value: string): boolean {
    return milli(value) > 0;
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  movementWord(type: string): string {
    return MOVEMENT_LABEL[type] ?? 'Movement';
  }

  sourceWord(type: string): string {
    return movementSourceLabel(type);
  }

  sourceLink(type: string, id: string) {
    void this.session.session();
    return movementSourceLink(type, id, (permission) => this.session.can(permission));
  }
}
