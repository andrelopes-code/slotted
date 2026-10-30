import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
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
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlMenuItem } from '@slotted/angular/menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
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
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
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
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { PurchaseOrderListItem, SupplierStatus } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  formatMoney,
  formatQuantity,
  options,
  SKUS_ROUTE,
} from '../../core/catalog/catalog.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import {
  formatDays,
  formatScore,
  hasQualityRecord,
  HOLDERS,
  PAYMENT_TERMS_LABEL,
  percentFromBps,
  PO_STATUS_LABEL,
  PO_STATUS_TONE,
  PURCHASE_ORDERS_ROUTE,
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_STATUS_TONE,
  SUPPLIER_TIER_LABEL,
  SUPPLIER_TIER_TONE,
  SUPPLIERS_ROUTE,
} from '../../core/procurement/procurement.model';
import { SupplierStore, type SupplierDraft } from '../../core/procurement/supplier.store';
import { SessionStore } from '../../core/session/session.store';
import { ConfirmDialog } from '../inventory/confirm-dialog';
import { ConflictPanel } from './conflict-panel';

type View = 'skus' | 'orders' | 'details';

/**
 * One supplier (§12, §65.1–§65.2). Its scorecard is four figures a buyer
 * compares suppliers by, each read against the median of the suppliers of its
 * own category, and each saying what it counts (RP-10): §12's "supplier
 * comparison" is answered on the record rather than by a chart of four
 * hundred bars. The spend is money paid to the supplier, drawn for a holder of
 * `cost.view` only (PM-01, PC-01).
 *
 * A holder of `suppliers.manage` edits the facts where they are read (FM-07)
 * and moves the status; an inactivation the backend would refuse because of
 * open orders is not offered, and the page says why (RP-09).
 */
@Component({
  selector: 'app-supplier-page',
  imports: [
    ConfirmDialog,
    ConflictPanel,
    RouterLink,
    SlBadge,
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
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlMenuItem,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
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
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
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
    SlTab,
    SlTabList,
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
    SlTabs,
    SlTag,
    SlTagBody,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
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
    /* The note's lines, reserved while the supplier is read and kept once it has loaded. */
    .note-box {
      display: block;
      min-block-size: calc(
        var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm)
      );
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
              <a slPageHeaderBack [routerLink]="listRoute">Suppliers</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Supplier</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="notFound() ? 'not-found' : 'error'"
            reach="section"
            data-testid="supplier-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>
                {{
                  notFound() ? 'This supplier does not exist' : 'The supplier could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ store.error()?.message }}</p>
            </div>
            <div slResultStateActions>
              @if (!notFound()) {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute"
                >Back to suppliers</a
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
              <a slPageHeaderBack [routerLink]="listRoute">Suppliers</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ supplier()?.displayName ?? 'Supplier' }}</h1>
                @if (supplier(); as s) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone(s.status)"
                      ><span slTagBody>{{ statusWord(s.status) }}</span></span
                    >
                    <span slTag size="sm" [tone]="tierTone()"
                      ><span slTagBody>{{ tierWord() }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every supplier carries its status and its tier: their place is kept. -->
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="4rem"></span></span></span
                  ></span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (actions().length > 0) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Supplier actions" overflow="menu">
                    @if (actions().includes('order')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="orderItem">
                        <a
                          slButtonLink
                          data-testid="order-from"
                          [routerLink]="newOrderRoute"
                          [queryParams]="{ supplier: supplier()!.id }"
                          >New purchase order</a
                        >
                      </div>
                    }
                    @if (actions().includes('activate')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="activateItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="activate"
                          (click)="ask('active')"
                        >
                          Reactivate
                        </button>
                      </div>
                    }
                    @if (actions().includes('hold')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="holdItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="hold"
                          (click)="ask('on_hold')"
                        >
                          Put on hold
                        </button>
                      </div>
                    }
                    @if (actions().includes('inactivate')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="inactivateItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="inactivate"
                          (click)="ask('inactive')"
                        >
                          Make inactive
                        </button>
                      </div>
                    }
                    <sl-toolbar-overflow />
                  </div>
                </div>
              }
            </div>
          </div>
          <div slPageHeaderTabs>
            <div slTabs [value]="view()" (valueChange)="setView($event.value)">
              <div slTabList aria-label="Supplier sections">
                <div slTab value="skus">
                  SKUs{{ supplier() ? ' ' + store.detail()!.mappings.length : '' }}
                </div>
                @if (store.canSeeOrders()) {
                  <div slTab value="orders">
                    Recent orders{{
                      supplier() ? ' ' + store.detail()!.recentPurchaseOrders.length : ''
                    }}
                  </div>
                }
                <div slTab value="details">Details</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="supplier-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (supplier(); as s) {
              <div slStack [gap]="3">
                <div
                  slGrid
                  [columns]="phone() ? 2 : store.canSeeCost() ? 5 : 4"
                  minItemWidth="xs"
                  [gap]="4"
                  data-testid="scorecard"
                >
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>On time</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{
                        store.hasRecord() ? percent(s.performance.onTimeDeliveryBps) : '—'
                      }}</span>
                      <p slStatCardComparison>{{ onTimeComparison() }}</p>
                    </div>
                  </div>
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Quality</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue
                        >{{ hasQuality() ? score(s.performance.qualityScore) : '—'
                        }}<span slStatCardUnit>of 100</span></span
                      >
                      <p slStatCardComparison>{{ qualityComparison() }}</p>
                    </div>
                  </div>
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Lead time</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue
                        >{{ store.hasRecord() ? s.performance.averageLeadTimeDays : '—'
                        }}<span slStatCardUnit>days</span></span
                      >
                      <p slStatCardComparison>{{ leadComparison() }}</p>
                    </div>
                  </div>
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Open orders</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ s.performance.openPurchaseOrderCount }}</span>
                      <p slStatCardComparison>sent and still to arrive</p>
                    </div>
                  </div>
                  @if (store.canSeeCost()) {
                    <div slStatCard size="sm">
                      <div slStatCardHeader><span slStatCardLabel>Spend, 12 months</span></div>
                      <div slStatCardFigure>
                        <span slStatCardValue data-testid="spend">{{
                          money(s.performance.annualSpendUsd)
                        }}</span>
                        <p slStatCardComparison>last 365 days</p>
                      </div>
                    </div>
                  }
                </div>
                <span
                  slText
                  size="sm"
                  tone="muted"
                  class="note-box"
                  data-testid="scorecard-note"
                  [style.--_lines]="noteLines()"
                  >{{ scorecardNote() }}</span
                >
              </div>
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the supplier' }" [loading]="true">
                <div slStack [gap]="3">
                  <div
                    slGrid
                    [columns]="phone() ? 2 : store.canSeeCost() ? 5 : 4"
                    minItemWidth="xs"
                    [gap]="4"
                  >
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
                  <!-- The note under the scorecard: two lines at the desk, four on a phone. -->
                  <span slText size="sm" class="note-box" [style.--_lines]="noteLines()"
                    ><span slSkeletonText [lines]="1" lastLineSize="50%"></span
                  ></span>
                </div>
              </div>
            }

            @switch (view()) {
              @case ('skus') {
                <div
                  slTable
                  variant="framed"
                  [columns]="skuColumns()"
                  [layout]="phone() ? 'fixed' : 'auto'"
                  data-testid="supplier-skus"
                >
                  <div slTableContent>
                    <caption slTableCaption>
                      What this supplier sells us, on its own terms
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>SKU</th>
                        <th slTableColumnHeader align="end" numeric>Lead time</th>
                        @if (!phone()) {
                          @if (store.canSeeCost()) {
                            <th slTableColumnHeader align="end" numeric>Unit cost</th>
                          }
                          <th slTableColumnHeader align="end" numeric>Minimum</th>
                          <th slTableColumnHeader>Their code</th>
                        }
                      </tr>
                    </thead>
                    <tbody slTableBody>
                      @if (supplier() === null) {
                        @for (row of [1, 2, 3, 4]; track row) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="70%"></span>
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
                      } @else if (store.detail()!.mappings.length === 0) {
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No SKU is mapped to this supplier</h3>
                                <p slResultStateDescription>
                                  An order to it is priced at each SKU’s standard cost until one is.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      } @else {
                        @for (mapping of store.detail()!.mappings; track mapping.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slInline [gap]="2">
                                <a
                                  slLink
                                  class="cell-text"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="[skusRoute, mapping.skuId]"
                                  [title]="mapping.skuCode + ' · ' + mapping.skuName"
                                >
                                  {{ mapping.skuCode }}
                                </a>
                                @if (mapping.isPreferred && !phone()) {
                                  <span slBadge variant="soft" tone="accent" size="sm"
                                    >Preferred</span
                                  >
                                }
                                @if (mapping.status !== 'active') {
                                  <span slBadge variant="soft" tone="secondary" size="sm"
                                    >Inactive</span
                                  >
                                }
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
                                {{ minimum(mapping.skuId, mapping.minimumOrderQuantity) }}
                              </td>
                              <td slTableCell>
                                <span class="cell-text" [title]="mapping.supplierSku">{{
                                  mapping.supplierSku
                                }}</span>
                              </td>
                            }
                          </tr>
                        }
                      }
                    </tbody>
                  </div>
                </div>
                @if (supplier()) {
                  <span slText size="sm" tone="muted"
                    >Preferred marks the supplier the catalogue orders each SKU from first. The unit
                    cost is the supplier’s price list; what was paid is on each order.</span
                  >
                }
              }
              @case ('orders') {
                <div
                  slTable
                  variant="framed"
                  [columns]="orderColumns()"
                  [layout]="phone() ? 'fixed' : 'auto'"
                  data-testid="supplier-orders"
                >
                  <div slTableContent>
                    <caption slTableCaption>
                      The ten most recent purchase orders
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Purchase order</th>
                        <th slTableColumnHeader>Status</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Expected</th>
                          <th slTableColumnHeader>Deliver to</th>
                          @if (store.canSeeCost()) {
                            <th slTableColumnHeader align="end" numeric>Total</th>
                          }
                        }
                      </tr>
                    </thead>
                    <tbody slTableBody>
                      @if (supplier() === null) {
                        <tr slTableRow>
                          <th slTableRowHeader>
                            <span slSkeleton shape="text" inlineSize="70%"></span>
                          </th>
                          <td slTableCell>
                            <span slSkeleton shape="text" inlineSize="4rem"></span>
                          </td>
                        </tr>
                      } @else if (store.detail()!.recentPurchaseOrders.length === 0) {
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No purchase order yet</h3>
                                <p slResultStateDescription>
                                  Orders written to this supplier are listed here, the most recent
                                  first.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      } @else {
                        @for (po of store.detail()!.recentPurchaseOrders; track po.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <a
                                slLink
                                class="cell-text"
                                variant="neutral"
                                underline="hover"
                                [routerLink]="[ordersRoute, po.id]"
                                >{{ po.purchaseOrderNumber }}</a
                              >
                            </th>
                            <td slTableCell>
                              <span slBadge variant="soft" size="sm" [tone]="poTone(po)">{{
                                poWord(po)
                              }}</span>
                            </td>
                            @if (!phone()) {
                              <td slTableCell>{{ date(po.expectedDate) }}</td>
                              <td slTableCell>{{ po.warehouseCode }}</td>
                              @if (store.canSeeCost()) {
                                <td slTableCell align="end" numeric>{{ money(po.total) }}</td>
                              }
                            }
                          </tr>
                        }
                      }
                    </tbody>
                  </div>
                </div>
              }
              @case ('details') {
                <section slSection>
                  <div slSectionHeader>
                    <div slSectionTitle><h2 slSectionHeading>Supplier</h2></div>
                    @if (store.canManage() && supplier() && store.draft() === null) {
                      <div slSectionActions>
                        <button
                          slButton
                          size="sm"
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="edit-supplier"
                          (click)="store.startEdit()"
                        >
                          Edit
                        </button>
                      </div>
                    }
                  </div>
                  <div slSectionBody>
                    @if (store.draft(); as draft) {
                      <form
                        slForm
                        data-testid="supplier-form"
                        [messages]="{ summaryTitle: 'The supplier was not saved' }"
                        [errors]="store.errors()"
                        (errorsChange)="store.errors.set($event.value)"
                        [loading]="store.busy() === 'save'"
                        (formSubmit)="save($event)"
                      >
                        @if (store.conflict(); as fields) {
                          <app-conflict-panel
                            subject="supplier"
                            [fields]="fields"
                            [busy]="store.busy() === 'save'"
                            (mine)="applyMine()"
                            (theirs)="store.takeTheirs()"
                          />
                        }
                        <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                          @for (field of textFields; track field.key) {
                            <div slField [required]="field.required" [invalid]="!!error(field.key)">
                              <label slFieldLabel>{{ field.label }}</label>
                              <div slTextField>
                                <input
                                  slTextFieldInput
                                  [name]="field.key"
                                  [value]="draft[field.key]"
                                  (valueChange)="patch(field.key, $event.value)"
                                />
                              </div>
                              @if (error(field.key); as message) {
                                <p slFieldError>{{ message }}</p>
                              } @else if (field.hint) {
                                <span slFieldDescription>{{ field.hint }}</span>
                              }
                            </div>
                          }
                          <div slField>
                            <label slFieldLabel>Payment terms</label>
                            <sl-select
                              name="paymentTermsCode"
                              [value]="draft.paymentTermsCode"
                              (valueChangeRequest)="
                                store.patch({
                                  paymentTermsCode: $any($event.value) ?? draft.paymentTermsCode,
                                })
                              "
                            >
                              @for (option of termOptions; track option.value) {
                                <sl-select-item [value]="option.value">{{
                                  option.label
                                }}</sl-select-item>
                              }
                            </sl-select>
                          </div>
                          <div slField>
                            <label slFieldLabel>Relationship</label>
                            <sl-select
                              name="relationshipTier"
                              [value]="draft.relationshipTier"
                              (valueChangeRequest)="
                                store.patch({
                                  relationshipTier: $any($event.value) ?? draft.relationshipTier,
                                })
                              "
                            >
                              @for (option of tierOptions; track option.value) {
                                <sl-select-item [value]="option.value">{{
                                  option.label
                                }}</sl-select-item>
                              }
                            </sl-select>
                            <span slFieldDescription
                              >A conditional supplier’s every order waits on a Procurement
                              Manager.</span
                            >
                          </div>
                        </div>
                        <div slFormActions>
                          <button
                            slButton
                            variant="ghost"
                            tone="secondary"
                            type="button"
                            (click)="store.cancelEdit()"
                          >
                            Cancel
                          </button>
                          <button
                            slButton
                            type="submit"
                            data-testid="save-supplier"
                            [loading]="store.busy() === 'save'"
                            [messages]="{ loading: 'Saving' }"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    } @else if (supplier(); as s) {
                      <div slDescriptionList layout="row" data-testid="supplier-facts">
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Legal name</dt>
                          <dd slDescriptionListDescription>{{ s.legalName }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Category</dt>
                          <dd slDescriptionListDescription>{{ s.category }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Contact</dt>
                          <dd slDescriptionListDescription>{{ contact() }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Payment terms</dt>
                          <dd slDescriptionListDescription>{{ terms() }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Currency</dt>
                          <dd slDescriptionListDescription>
                            {{ s.supportedCurrencies.join(', ') }} · orders in
                            {{ s.supportedCurrencies[0] }}
                          </dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Shipping terms</dt>
                          <dd slDescriptionListDescription>
                            {{ s.preferredShippingTerms || 'None stated' }}
                          </dd>
                        </div>
                        @if (s.tags.length > 0) {
                          <div slDescriptionListItem>
                            <dt slDescriptionListTerm>Tags</dt>
                            <dd slDescriptionListDescription>
                              <span slInline [gap]="1" wrap="wrap">
                                @for (tag of s.tags; track tag) {
                                  <span slBadge variant="soft" tone="secondary" size="sm">{{
                                    tag
                                  }}</span>
                                }
                              </span>
                            </dd>
                          </div>
                        }
                      </div>
                    } @else {
                      <span slSkeletonText [lines]="3" lastLineSize="50%"></span>
                    }
                  </div>
                </section>
                @if (statusNote(); as note) {
                  <span slText size="sm" tone="muted" data-testid="status-note">{{ note }}</span>
                }
              }
            }
          </div>
        </div>

        <ng-template #orderItem>
          <a slMenuItem [routerLink]="newOrderRoute" [queryParams]="{ supplier: supplier()?.id }"
            >New purchase order</a
          >
        </ng-template>
        <ng-template #activateItem>
          <button slMenuItem type="button" (click)="ask('active')">Reactivate</button>
        </ng-template>
        <ng-template #holdItem>
          <button slMenuItem type="button" (click)="ask('on_hold')">Put on hold</button>
        </ng-template>
        <ng-template #inactivateItem>
          <button slMenuItem type="button" (click)="ask('inactive')">Make inactive</button>
        </ng-template>

        <app-confirm-dialog
          [open]="asking() !== null"
          (openChange)="$event ? null : asking.set(null)"
          [title]="confirmTitle()"
          [description]="confirmWords()"
          [confirmLabel]="confirmLabel()"
          keepLabel="Keep it as it is"
          [tone]="asking() === 'inactive' ? 'danger' : 'accent'"
          [busy]="store.busy() === 'status'"
          (confirm)="setStatus()"
        />
      </div>
    }
  `,
})
export class SupplierPage {
  readonly store = inject(SupplierStore);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = SUPPLIERS_ROUTE;
  readonly ordersRoute = PURCHASE_ORDERS_ROUTE;
  readonly newOrderRoute = `${PURCHASE_ORDERS_ROUTE}/new`;
  readonly skusRoute = SKUS_ROUTE;
  readonly phone = phoneSignal();
  readonly chosenView = signal<View>('skus');
  readonly asking = signal<SupplierStatus | null>(null);

  readonly supplier = this.store.supplier;

  readonly termOptions = options(PAYMENT_TERMS_LABEL);
  readonly tierOptions = options(SUPPLIER_TIER_LABEL);
  readonly textFields: readonly {
    key: Exclude<keyof SupplierDraft, 'paymentTermsCode' | 'relationshipTier'>;
    label: string;
    required: boolean;
    hint?: string;
  }[] = [
    { key: 'displayName', label: 'Name', required: true },
    { key: 'legalName', label: 'Legal name', required: false },
    {
      key: 'category',
      label: 'Category',
      required: true,
      hint: 'The category the supplier list filters and compares by.',
    },
    { key: 'primaryContactName', label: 'Contact', required: false },
    { key: 'primaryContactEmail', label: 'Contact email', required: false },
    {
      key: 'preferredShippingTerms',
      label: 'Shipping terms',
      required: false,
      hint: 'FOB origin, DAP destination…',
    },
  ];

  readonly view = computed<View>(() => {
    const chosen = this.chosenView();
    return chosen === 'orders' && !this.store.canSeeOrders() ? 'skus' : chosen;
  });

  /** The scorecard note: two lines at the desk, five on a phone. */
  readonly noteLines = computed(() => (this.phone() ? 5 : 2));

  readonly notFound = computed(() => this.store.error()?.code === 'NOT_FOUND');

  readonly figureLabels = computed(() => [
    'On time',
    'Quality',
    'Lead time',
    'Open orders',
    ...(this.store.canSeeCost() ? ['Spend, 12 months'] : []),
  ]);

  readonly skuColumns = computed(() => (this.phone() ? 2 : this.store.canSeeCost() ? 5 : 4));
  readonly orderColumns = computed(() => (this.phone() ? 2 : this.store.canSeeCost() ? 5 : 4));

  readonly subheading = computed(() => {
    const s = this.supplier();
    if (s === null) return '';
    const place = [s.city, s.region].filter(Boolean).join(', ');
    return [s.supplierNumber, s.category, place].filter(Boolean).join(' · ');
  });

  readonly tierWord = computed(() => {
    const s = this.supplier();
    return s ? SUPPLIER_TIER_LABEL[s.relationshipTier] : '';
  });
  readonly tierTone = computed(() => {
    const s = this.supplier();
    return s ? SUPPLIER_TIER_TONE[s.relationshipTier] : 'secondary';
  });

  /**
   * A figure below its category's median by a margin the buyer would act on —
   * ten points on time, two of quality — says so in its comparison line: the
   * card's tone is the trend's (stat-card), so the crossing is words (RP-10).
   */
  private readonly onTimeBehind = computed(() => {
    const s = this.supplier();
    const peer = this.store.peers().value?.onTimeBps ?? null;
    return (
      s !== null &&
      this.store.hasRecord() &&
      peer !== null &&
      s.performance.onTimeDeliveryBps < peer - 1_000
    );
  });
  private readonly qualityBehind = computed(() => {
    const s = this.supplier();
    const peer = this.store.peers().value?.quality ?? null;
    return (
      s !== null &&
      peer !== null &&
      hasQualityRecord(s.performance) &&
      s.performance.qualityScore < peer - 2
    );
  });

  private peerWords(value: string | null, behind = false): string {
    const peers = this.store.peers();
    // Short enough for one line in a fifth of the desk, so the cards keep their height (loading-states §3).
    if (peers.failed) return 'median did not arrive';
    if (peers.value === null || value === null) return 'reading the median';
    return behind ? `under median ${value}` : `category median ${value}`;
  }

  readonly onTimeComparison = computed(() => {
    if (!this.store.hasRecord()) return 'no line received in full yet';
    const peer = this.store.peers().value?.onTimeBps ?? null;
    return this.peerWords(
      peer === null ? null : percentFromBps(Math.round(peer)),
      this.onTimeBehind(),
    );
  });
  readonly hasQuality = computed(() => {
    const s = this.supplier();
    return s !== null && hasQualityRecord(s.performance);
  });

  readonly qualityComparison = computed(() => {
    if (!this.hasQuality()) return 'nothing received yet';
    const peer = this.store.peers().value?.quality ?? null;
    return this.peerWords(peer === null ? null : formatScore(peer), this.qualityBehind());
  });
  readonly leadComparison = computed(() => {
    if (!this.store.hasRecord()) return 'no line received in full yet';
    const peer = this.store.peers().value?.leadTimeDays ?? null;
    return this.peerWords(peer === null ? null : formatDays(Math.round(peer)));
  });

  /** What each figure counts and what it is compared with, once under the figures (RP-10). */
  readonly scorecardNote = computed(() => {
    const s = this.supplier();
    const peers = this.store.peers().value;
    if (s === null) return '';
    const who = peers
      ? `the ${peers.count} suppliers of ${peers.category}, ${peers.withRecord} of which have received a line in full`
      : `the suppliers of ${s.category}`;
    const cost = this.store.canSeeCost()
      ? ''
      : ` What is spent with the supplier is shown to holders of cost.view — ${HOLDERS['cost.view']}.`;
    return `On time counts the lines received in full by their expected date; quality is 100 less the damaged and rejected share of all it delivered; lead time is the days from the order to the first receipt of a line. Each is compared with the median of ${who}, and one more than ten points under it on time, or two under it on quality, reads under it.${cost}`;
  });

  /** The status moves a holder of `suppliers.manage` may make; an inactivation with open orders is not one of them. */
  readonly actions = computed<readonly ('order' | 'activate' | 'hold' | 'inactivate')[]>(() => {
    const s = this.supplier();
    if (s === null) return [];
    const actions: ('order' | 'activate' | 'hold' | 'inactivate')[] = [];
    if (s.status === 'active' && this.store.canSeeOrders() && this.canCreateOrders())
      actions.push('order');
    if (this.store.canManage()) {
      if (s.status !== 'active') actions.push('activate');
      if (s.status === 'active') actions.push('hold');
      if (s.status !== 'inactive' && this.store.blockingOrders() === 0) actions.push('inactivate');
    }
    return actions;
  });

  readonly statusNote = computed(() => {
    const s = this.supplier();
    const blocking = this.store.blockingOrders();
    if (s === null) return '';
    if (!this.store.canManage())
      return `Suppliers are edited, held and made inactive by holders of suppliers.manage — ${HOLDERS['suppliers.manage']}.`;
    if (s.status !== 'inactive' && blocking !== null && blocking > 0)
      return `${s.displayName} cannot be made inactive while ${blocking} ${blocking === 1 ? 'purchase order is' : 'purchase orders are'} waiting on approval, approved or still to arrive; putting it on hold stops new orders now.`;
    return '';
  });

  readonly confirmTitle = computed(() => {
    const target = this.asking();
    return target === 'on_hold'
      ? 'Put this supplier on hold'
      : target === 'inactive'
        ? 'Make this supplier inactive'
        : 'Reactivate this supplier';
  });
  readonly confirmLabel = computed(() => {
    const target = this.asking();
    return target === 'on_hold'
      ? 'Put on hold'
      : target === 'inactive'
        ? 'Make inactive'
        : 'Reactivate';
  });
  readonly confirmWords = computed(() => {
    const target = this.asking();
    if (target === 'on_hold')
      return 'No new purchase order can be written or submitted to it. Orders already sent still arrive and are received.';
    if (target === 'inactive')
      return 'It leaves the suppliers orders are written to. Its history stays readable.';
    return 'It can receive new purchase orders again.';
  });

  private canCreateOrders(): boolean {
    void this.session.session();
    return this.session.can('purchase_orders.create');
  }

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.chosenView.set('skus');
      void this.store.open(id);
    });
  }

  setView(value: string | undefined): void {
    if (value === 'skus' || value === 'orders' || value === 'details') this.chosenView.set(value);
  }

  statusWord(status: SupplierStatus): string {
    return SUPPLIER_STATUS_LABEL[status];
  }

  statusTone(status: SupplierStatus) {
    return SUPPLIER_STATUS_TONE[status];
  }

  poWord(po: PurchaseOrderListItem): string {
    return PO_STATUS_LABEL[po.status];
  }

  poTone(po: PurchaseOrderListItem) {
    return PO_STATUS_TONE[po.status];
  }

  percent(bps: number): string {
    return percentFromBps(bps);
  }

  score(value: number): string {
    return formatScore(value);
  }

  days(n: number): string {
    return formatDays(n);
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  money(value: { currency: 'USD' | 'EUR' | 'GBP' | 'BRL'; minor: number }): string {
    return formatMoney(value);
  }

  minimum(skuId: string, value: string): string {
    const unit = this.store.skus().get(skuId)?.unit ?? '';
    return `${formatQuantity(value)} ${unit}`.trim();
  }

  contact(): string {
    const s = this.supplier();
    if (s === null) return '';
    return (
      [s.primaryContactName, s.primaryContactEmail].filter(Boolean).join(' · ') || 'None named'
    );
  }

  terms(): string {
    const s = this.supplier();
    return s ? PAYMENT_TERMS_LABEL[s.paymentTermsCode] : '';
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  patch(key: keyof SupplierDraft, value: string): void {
    this.store.patch({ [key]: value } as Partial<SupplierDraft>);
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  ask(status: SupplierStatus): void {
    this.asking.set(status);
  }

  async setStatus(): Promise<void> {
    const target = this.asking();
    if (target === null) return;
    const ok = await this.store.setStatus(target);
    this.asking.set(null);
    if (ok)
      this.toasts.show({
        title: `${this.supplier()?.displayName ?? 'Supplier'} is ${SUPPLIER_STATUS_LABEL[target].toLowerCase()}`,
        tone: 'success',
      });
  }

  save(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  async applyMine(): Promise<void> {
    if (await this.store.applyMine())
      this.toasts.show({ title: 'Supplier saved', tone: 'success' });
  }

  private async write(): Promise<void> {
    if (await this.store.save()) this.toasts.show({ title: 'Supplier saved', tone: 'success' });
  }
}
