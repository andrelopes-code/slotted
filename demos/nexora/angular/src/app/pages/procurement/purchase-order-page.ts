import { Location, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import { SlDatePicker } from '@slotted/angular/date-picker';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
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
  SlSectionBody,
  SlSectionDescription,
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
  SlTableSummary,
} from '@slotted/angular/table';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';
import { toISODate, type PlainDate } from '@slotted/core/date';

import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
} from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { milli, positionLink } from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';
import {
  formatDays,
  HOLDERS,
  PAYMENT_TERMS_LABEL,
  percentFromBps,
  PO_EXCEPTION_LABEL,
  PO_STATUS_LABEL,
  PO_STATUS_TONE,
  PURCHASE_ORDERS_ROUTE,
  RECEIVABLE,
  RECEIVING_ROUTE,
  SUPPLIER_TIER_LABEL,
  SUPPLIERS_ROUTE,
} from '../../core/procurement/procurement.model';
import { PurchaseOrderEditStore } from '../../core/procurement/purchase-order-edit.store';
import {
  PurchaseOrderStore,
  type PurchaseOrderLineRow,
} from '../../core/procurement/purchase-order.store';
import { ReceiptDraftStore, receiptKey } from '../../core/procurement/receipt-draft.store';
import { SessionStore } from '../../core/session/session.store';
import { leaveForm } from '../inventory/leave-form';
import { ApprovalPanel } from '../orders/approval-panel';
import { ReasonDialog } from '../orders/reason-dialog';
import { RecordProgress } from '../record-progress/record-progress';
import { ConflictPanel } from './conflict-panel';
import { PoLines } from './po-lines';
import { purchaseOrderSentence, purchaseOrderSteps } from './procurement-progress';
import { chosenDate } from '../../core/chosen-date';
import type { CalendarValue } from '@slotted/angular/calendar';

type View = 'lines' | 'receipts' | 'details';

const plainDate = (iso: string): PlainDate | null => {
  const [year, month, day] = iso.split('-').map(Number);
  return year && month && day ? { year, month, day } : null;
};

/**
 * One purchase order (§65): where it stands and what that step waits on
 * (RP-06), its approval, its lines with what is still to come, its receipts,
 * and the commands the reader's permissions allow in its state. A command
 * the backend would refuse in this state is not drawn (RP-09): an order that
 * has received anything is closed short, never cancelled, and a step waiting
 * on another role names the role and offers no control.
 *
 * The receipt and the edit are written in the lines' own tab (FM-07), each a
 * query parameter the back gesture closes (FM-12). The prices and the totals
 * are costs, drawn for a holder of `cost.view` only (PM-01, PC-01).
 */
@Component({
  selector: 'app-purchase-order-page',
  imports: [
    NgIcon,
    ApprovalPanel,
    NgTemplateOutlet,
    ConflictPanel,
    PoLines,
    ReasonDialog,
    RecordProgress,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlIconButton,
    SlCurrencyField,
    SlCurrencyFieldInput,
    SlDatePicker,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
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
    SlSectionBody,
    SlSectionDescription,
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
    SlTableSummary,
    SlTabs,
    SlTag,
    SlTagBody,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlTextarea,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
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
    /* The steps' shape while the order is read: four cells, as the loaded element draws them. */
    .steps-shape {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--slotted-space-2);
    }
    .step-shape {
      display: grid;
      gap: var(--slotted-space-2);
      align-content: start;
    }
    /* literal: the step's bar is a rule three pixels thick, as the loaded element draws it */
    .step-bar {
      block-size: 3px;
      border-radius: var(--slotted-radius-full);
      background: var(--slotted-border-subtle);
    }
    /* The step's label over its detail, as the loaded element reserves it. */
    .step-words-shape {
      display: block;
      min-block-size: calc(
        var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm) +
          var(--slotted-space-1)
      );
    }
    .sentence-shape {
      display: block;
      min-block-size: calc(
        var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm)
      );
    }
    .receipt-line {
      display: grid;
      gap: var(--slotted-space-3);
      padding-block: var(--slotted-space-4);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    .reasons {
      display: grid;
      gap: var(--slotted-space-1);
      margin: 0;
      padding-inline-start: var(--slotted-space-5);
    }
  `,
  template: `
    @if (store.error()) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="listRoute">Purchase orders</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Purchase order</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div slResultState [status]="missingStatus()" reach="section" data-testid="po-missing">
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ missingTitle() }}</h2>
              <p slResultStateDescription>{{ missingWords() }}</p>
            </div>
            <div slResultStateActions>
              @if (missingStatus() === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute"
                >Back to purchase orders</a
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
              <a slPageHeaderBack [routerLink]="listRoute">Purchase orders</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ po()?.purchaseOrderNumber ?? 'Purchase order' }}</h1>
                @if (po(); as p) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()"
                      ><span slTagBody>{{ statusWord() }}</span></span
                    >
                    @for (flag of p.exceptionFlags; track flag) {
                      <span slTag size="sm" tone="warning"
                        ><span slTagBody>{{ exception(flag) }}</span></span
                      >
                    }
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every order carries its status: the mark's place is kept as the box of one small tag. -->
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="6rem"></span></span></span
                  ></span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (po()) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Purchase order actions" overflow="menu">
                    @if (headerCommands().includes('receive')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="receiveItem">
                        <a
                          slButtonLink
                          data-testid="receive"
                          [routerLink]="[]"
                          [queryParams]="{ receive: 1 }"
                          >Receive</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('submit')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="submitItem">
                        <button
                          slButton
                          type="button"
                          data-testid="submit"
                          [loading]="store.busy() === 'submit'"
                          [messages]="{ loading: 'Submitting' }"
                          (click)="submit()"
                        >
                          {{ submitLabel() }}
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('send')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="sendItem">
                        <button
                          slButton
                          type="button"
                          data-testid="send"
                          [loading]="store.busy() === 'send'"
                          [messages]="{ loading: 'Sending' }"
                          (click)="send()"
                        >
                          Send to supplier
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('acknowledge')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="acknowledgeItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="acknowledge"
                          (click)="acknowledgeOpen.set(true)"
                        >
                          Record acknowledgement
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('edit')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="editItem">
                        <a
                          slButtonLink
                          variant="outline"
                          tone="secondary"
                          data-testid="edit"
                          [routerLink]="[]"
                          [queryParams]="{ edit: 1 }"
                          >Edit</a
                        >
                      </div>
                    }
                    <!-- Approvers move this order while the page is open (AF-07): the read keeps the values and marks the page busy. -->
                    <div slToolbarItem [slToolbarItemCounterpart]="refreshItem">
                      <ng-container slTooltip openOn="hover" side="bottom">
                        <button
                          slIconButton
                          slTooltipTrigger
                          variant="ghost"
                          tone="secondary"
                          type="button"
                          aria-label="Refresh"
                          data-testid="refresh"
                          [loading]="store.loading()"
                          [messages]="{ loading: 'Refreshing' }"
                          (click)="store.load()"
                        >
                          <ng-icon name="lucideRefreshCw" />
                        </button>
                        <ng-template slTooltipLayer
                          ><div slTooltipContent>Refresh</div></ng-template
                        >
                      </ng-container>
                    </div>
                    @if (headerCommands().includes('close')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="closeItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="close-short"
                          (click)="closeOpen.set(true)"
                        >
                          Close short
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('cancel')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="cancelItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="cancel-po"
                          (click)="cancelOpen.set(true)"
                        >
                          Cancel order
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
              <div slTabList aria-label="Purchase order sections">
                <div slTab value="lines">Lines{{ po() ? ' ' + rows().length : '' }}</div>
                <div slTab value="receipts">
                  Receipts{{ po() ? ' ' + store.receipts().length : '' }}
                </div>
                <div slTab value="details">Details</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="po-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }
            @if (receipt.written(); as written) {
              <div
                slInlineMessage
                [tone]="written.complete ? 'success' : 'warning'"
                data-testid="received"
              >
                <span slInlineMessageIcon></span>
                <span slInline [gap]="2" wrap="wrap">
                  <span slText size="sm">{{ writtenWords(written) }}</span>
                  @if (store.canReadReceipts()) {
                    <a slLink [routerLink]="[receivingRoute, written.id]"
                      >Open {{ written.number }}</a
                    >
                  }
                </span>
              </div>
            }

            @if (po(); as p) {
              <div
                slGrid
                [columns]="phone() ? 2 : 4"
                minItemWidth="xs"
                [gap]="4"
                data-testid="po-figures"
              >
                @if (store.canSeeCost()) {
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Total</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue data-testid="po-total">{{ money(p.total) }}</span>
                      <p slStatCardComparison>freight {{ money(p.freight) }}</p>
                    </div>
                  </div>
                }
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Lines</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ rows().length }}</span>
                    <p slStatCardComparison>{{ openLines() }} still to come</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Received</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ share(p.receivedShareBps) }}</span>
                    <p slStatCardComparison>of the order so far</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Expected</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ date(p.expectedDate) }}</span>
                    <p slStatCardComparison>{{ expectedWords() }}</p>
                  </div>
                </div>
                @if (!store.canSeeCost()) {
                  <div slStatCard size="sm">
                    <div slStatCardHeader><span slStatCardLabel>Receipts</span></div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ store.receipts().length }}</span>
                      <p slStatCardComparison>on this order</p>
                    </div>
                  </div>
                }
              </div>
              @if (!store.canSeeCost()) {
                <span slText size="sm" tone="muted" data-testid="cost-withheld">{{
                  costWithheld
                }}</span>
              }

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                </div>
                <div slSectionBody>
                  <div slStack [gap]="4">
                    <app-record-progress
                      [steps]="steps()"
                      [sentence]="sentence()"
                      [sentenceLines]="sentenceLines()"
                      [stepLines]="stepLines()"
                      [stopped]="p.status === 'cancelled' ? 'danger' : null"
                    />
                  </div>
                </div>
              </section>
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the purchase order' }" [loading]="true">
                <div slStack [gap]="6">
                  <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
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
                  @if (!store.canSeeCost()) {
                    <!-- The permission is known before the answer, so its sentence is drawn rather than reserved. -->
                    <span slText size="sm" tone="muted">{{ costWithheld }}</span>
                  }
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                    </div>
                    <div slSectionBody>
                      <div slStack [gap]="3">
                        <!-- Each step's anatomy: its bar, its label and one line of detail. -->
                        <div class="steps-shape">
                          @for (step of [1, 2, 3, 4]; track step) {
                            <span class="step-shape">
                              <span class="step-bar"></span>
                              <span class="step-words-shape" [style.--_lines]="stepLines()">
                                <span slSkeletonText [lines]="2" lastLineSize="60%"></span>
                              </span>
                            </span>
                          }
                        </div>
                        <!-- The sentence's box, the lines the loaded sentence also keeps. -->
                        <span class="sentence-shape" [style.--_lines]="sentenceLines()">
                          <span slSkeletonText [lines]="1" lastLineSize="80%"></span>
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            }

            @switch (view()) {
              @case ('lines') {
                @if (editing()) {
                  <ng-container *ngTemplateOutlet="editForm" />
                } @else if (receiving()) {
                  <ng-container *ngTemplateOutlet="receiptForm" />
                } @else {
                  <ng-container *ngTemplateOutlet="linesTable" />
                }
              }
              @case ('receipts') {
                <ng-container *ngTemplateOutlet="receiptsTable" />
              }
              @case ('details') {
                <ng-container *ngTemplateOutlet="details" />
              }
            }
            <!--
              The approval is known only once the order is read, so it stands under the section it
              is read beside rather than above it, where it would move the lines when it lands.
            -->
            @if (store.approvalRequest(); as approval) {
              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Approval</h2></div>
                </div>
                <div slSectionBody>
                  <app-approval-panel
                    [approval]="approval"
                    [busy]="store.busy() === 'decision'"
                    [amountShown]="store.canSeeCost()"
                    (decide)="decide($event)"
                  />
                </div>
              </section>
            }
            <!--
              Who holds what this reader does not, under the section it is about: it depends on
              the order's state, so it cannot be reserved while the order is read, and a sentence
              above the lines would move them when it lands (loading-states §3).
            -->
            @if (permissionNote(); as note) {
              <span slText size="sm" tone="muted" data-testid="po-permission">{{ note }}</span>
            }
          </div>
        </div>

        <ng-template #linesTable>
          <div
            slTable
            variant="framed"
            [columns]="lineColumns()"
            [layout]="phone() ? 'fixed' : 'auto'"
            data-testid="po-lines-table"
          >
            <div slTableContent>
              <caption slTableCaption>
                What this order buys, in each SKU’s own unit
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>SKU</th>
                  <th slTableColumnHeader align="end" numeric>Ordered</th>
                  @if (!phone()) {
                    <th slTableColumnHeader align="end" numeric>Accepted</th>
                    <th slTableColumnHeader align="end" numeric>Damaged</th>
                    <th slTableColumnHeader align="end" numeric>Rejected</th>
                  }
                  <th slTableColumnHeader align="end" numeric>To come</th>
                  @if (store.canSeeCost() && !phone()) {
                    <th slTableColumnHeader align="end" numeric>Unit cost</th>
                    <th slTableColumnHeader align="end" numeric>Line total</th>
                  }
                </tr>
              </thead>
              <tbody slTableBody>
                @if (po() === null) {
                  <!-- An order holds one line or many: the wait reserves the smaller and the rows grow downward. -->
                  @for (row of [1]; track row) {
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
                  @for (row of rows(); track row.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        <a
                          slLink
                          class="cell-text"
                          variant="neutral"
                          underline="hover"
                          [routerLink]="position(row).path"
                          [queryParams]="position(row).queryParams"
                          [title]="row.skuCode + ' · ' + row.skuName"
                        >
                          {{ row.skuCode }}
                        </a>
                      </th>
                      <td slTableCell align="end" numeric>
                        {{ amount(row.orderedQuantity, row) }}
                      </td>
                      @if (!phone()) {
                        <td slTableCell align="end" numeric>
                          {{ amount(row.receivedAcceptedQuantity, row) }}
                        </td>
                        <td slTableCell align="end" numeric>
                          {{ amount(row.receivedDamagedQuantity, row) }}
                        </td>
                        <td slTableCell align="end" numeric>
                          {{ amount(row.rejectedQuantity, row) }}
                        </td>
                      }
                      <td slTableCell align="end" numeric>{{ amount(row.openQuantity, row) }}</td>
                      @if (store.canSeeCost() && !phone()) {
                        <td slTableCell align="end" numeric>{{ money(row.unitCost) }}</td>
                        <td slTableCell align="end" numeric>{{ money(row.lineTotal) }}</td>
                      }
                    </tr>
                  }
                }
              </tbody>
              @if (po(); as p) {
                @if (store.canSeeCost() && !phone()) {
                  <tfoot slTableSummary>
                    <tr slTableRow>
                      <th slTableRowHeader>
                        Subtotal, {{ rows().length }} {{ rows().length === 1 ? 'line' : 'lines' }}
                      </th>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell align="end" numeric data-testid="lines-subtotal">
                        {{ money(p.subtotal) }}
                      </td>
                    </tr>
                  </tfoot>
                }
              }
            </div>
          </div>
          @if (po()) {
            <span slText size="sm" tone="muted">{{ linesNote() }}</span>
          }
        </ng-template>

        <ng-template #receiptsTable>
          <div
            slTable
            variant="framed"
            [columns]="phone() ? 2 : 4"
            [layout]="phone() ? 'fixed' : 'auto'"
            data-testid="po-receipts"
          >
            <div slTableContent>
              <caption slTableCaption>
                Goods received against this order
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Receipt</th>
                  <th slTableColumnHeader>Received</th>
                  @if (!phone()) {
                    <th slTableColumnHeader>By</th>
                    <th slTableColumnHeader align="end" numeric>Lines</th>
                  }
                </tr>
              </thead>
              <tbody slTableBody>
                @if (po() === null) {
                  <tr slTableRow>
                    <th slTableRowHeader><span slSkeleton shape="text" inlineSize="60%"></span></th>
                    <td slTableCell><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                    @if (!phone()) {
                      <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                      <td slTableCell align="end">
                        <span slSkeleton shape="text" inlineSize="1.5rem"></span>
                      </td>
                    }
                  </tr>
                } @else if (store.receipts().length === 0) {
                  <tr slTableRow>
                    <td slTableEmpty>
                      <div slResultState status="empty" reach="section">
                        <div slResultStateContent>
                          <h3 slResultStateTitle>Nothing received yet</h3>
                          <p slResultStateDescription>{{ noReceiptWords() }}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (r of store.receipts(); track r.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        @if (store.canReadReceipts()) {
                          <a
                            slLink
                            class="cell-text"
                            variant="neutral"
                            underline="hover"
                            [routerLink]="[receivingRoute, r.id]"
                            >{{ r.receiptNumber }}</a
                          >
                        } @else {
                          <span class="cell-text">{{ r.receiptNumber }}</span>
                        }
                      </th>
                      <td slTableCell>{{ dateTime(r.receivedAt) }}</td>
                      @if (!phone()) {
                        <td slTableCell>
                          <span class="cell-text" [title]="r.receivedByName">{{
                            r.receivedByName
                          }}</span>
                        </td>
                        <td slTableCell align="end" numeric>{{ r.lineCount }}</td>
                      }
                    </tr>
                  }
                }
              </tbody>
            </div>
          </div>
        </ng-template>

        <ng-template #details>
          @if (po(); as p) {
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle><h2 slSectionHeading>Terms</h2></div>
              </div>
              <div slSectionBody>
                <div slDescriptionList layout="row" data-testid="po-terms">
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Supplier</dt>
                    <dd slDescriptionListDescription>
                      @if (store.canSeeSuppliers()) {
                        <a slLink [routerLink]="[suppliersRoute, p.supplierId]">{{
                          p.supplierName
                        }}</a>
                      } @else {
                        {{ p.supplierName }}
                      }
                      @if (store.supplier(); as s) {
                        · {{ tier(s.relationshipTier) }}
                      }
                    </dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Deliver to</dt>
                    <dd slDescriptionListDescription>
                      {{ p.warehouseCode }} · {{ warehouseName(p.destinationWarehouseId) }}
                    </dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Buyer</dt>
                    <dd slDescriptionListDescription>{{ p.buyerName }}</dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Created</dt>
                    <dd slDescriptionListDescription>{{ date(p.createdBusinessDate) }}</dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Currency</dt>
                    <dd slDescriptionListDescription>{{ currencyWords() }}</dd>
                  </div>
                  @if (store.supplier(); as s) {
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Payment terms</dt>
                      <dd slDescriptionListDescription>{{ terms(s.paymentTermsCode) }}</dd>
                    </div>
                  }
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Notes</dt>
                    <dd slDescriptionListDescription data-testid="po-notes">
                      {{ p.notes || 'None' }}
                    </dd>
                  </div>
                </div>
              </div>
            </section>
          }
        </ng-template>

        <ng-template #receiptForm>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>Receive at {{ po()?.warehouseCode }}</h2>
                <p slSectionDescription>
                  Each line in three places: accepted into stock, damaged into stock and its damaged
                  bucket at once, or rejected back to the supplier, never in stock.
                </p>
              </div>
            </div>
            <div slSectionBody>
              <form
                slForm
                data-testid="receive-form"
                [messages]="{ summaryTitle: 'Nothing was received' }"
                [errors]="receipt.errors()"
                (errorsChange)="receipt.errors.set($event.value)"
                [loading]="store.busy() === 'receive'"
                (formSubmit)="receive($event)"
              >
                <div slStack [gap]="5">
                  @if (po()?.notes; as note) {
                    <span slText size="sm" data-testid="receipt-order-note"
                      >The order’s note: {{ note }}</span
                    >
                  }
                  @if (receiptError('lines'); as message) {
                    <div slInlineMessage tone="danger">
                      <span slInlineMessageIcon></span>
                      {{ message }}
                    </div>
                  }
                  <div slStack [gap]="0">
                    @for (row of receivableRows(); track row.id) {
                      <div class="receipt-line" [attr.data-testid]="'receipt-line-' + row.skuCode">
                        <span slStack [gap]="1">
                          <span
                            class="cell-text"
                            slText
                            size="sm"
                            weight="medium"
                            [title]="row.skuName"
                            >{{ row.skuCode }} · {{ row.skuName }}</span
                          >
                          <span slText size="sm" tone="muted">{{ lineStatus(row) }}</span>
                        </span>
                        <div slGrid [columns]="phone() ? 3 : 5" minItemWidth="xs" [gap]="3">
                          @for (field of receiptFields; track field.key) {
                            <div slField [invalid]="!!receiptError(key(row, field.key))">
                              <label slFieldLabel>{{ field.label }}</label>
                              <div slNumberField size="sm">
                                <input
                                  slNumberFieldInput
                                  [min]="0"
                                  [format]="{ maximumFractionDigits: row.precision }"
                                  [attr.aria-label]="field.label + ' of ' + row.skuCode"
                                  [value]="receipt.entry(row.id)[field.key]"
                                  (valueChange)="
                                    receipt.patch(row.id, patchOf(field.key, $event.value))
                                  "
                                />
                                <span slNumberFieldEnd>{{ row.unit }}</span>
                              </div>
                              @if (receiptError(key(row, field.key)); as message) {
                                <p slFieldError>{{ message }}</p>
                              } @else if (
                                field.key === 'accepted' && toleranceWords(row);
                                as words
                              ) {
                                <span
                                  slFieldDescription
                                  [attr.data-testid]="'tolerance-' + row.skuCode"
                                  >{{ words }}</span
                                >
                              }
                            </div>
                          }
                          @if (!phone()) {
                            <div slField>
                              <label slFieldLabel>Bin</label>
                              <sl-select
                                size="sm"
                                placeholder="No bin named"
                                [value]="receipt.entry(row.id).locationId"
                                (valueChangeRequest)="
                                  receipt.patch(row.id, { locationId: $any($event.value) ?? null })
                                "
                              >
                                @for (location of receipt.locations(); track location.id) {
                                  <sl-select-item [value]="location.id">{{
                                    location.code
                                  }}</sl-select-item>
                                }
                              </sl-select>
                            </div>
                            <div slField>
                              <label slFieldLabel>Line note</label>
                              <div slTextField size="sm">
                                <input
                                  slTextFieldInput
                                  [value]="receipt.entry(row.id).note"
                                  (valueChange)="receipt.patch(row.id, { note: $event.value })"
                                />
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  @if (receipt.overTolerance().length > 0 && receipt.canExceed()) {
                    <div slField required [invalid]="!!receiptError('overReceiptReason')">
                      <label slFieldLabel>Why more than 5% over the order</label>
                      <textarea
                        slTextarea
                        name="overReceiptReason"
                        data-testid="over-reason"
                        [rows]="2"
                        [value]="receipt.overReceiptReason()"
                        (valueChange)="receipt.setReason($event.value)"
                      ></textarea>
                      @if (receiptError('overReceiptReason'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription>{{ overWords() }}</span>
                      }
                    </div>
                  }
                  <div slField>
                    <label slFieldLabel>Receipt note</label>
                    <textarea
                      slTextarea
                      name="notes"
                      [rows]="2"
                      [value]="receipt.notes()"
                      (valueChange)="receipt.notes.set($event.value)"
                      placeholder="Two cartons crushed on the pallet; photos with the carrier."
                    ></textarea>
                  </div>

                  <div slInlineMessage tone="secondary" data-testid="receipt-outcome">
                    <span slInlineMessageIcon></span>
                    <span slStack [gap]="1">
                      @for (sentence of outcomeWords(); track sentence) {
                        <span slText size="sm">{{ sentence }}</span>
                      }
                    </span>
                  </div>
                </div>

                <div slFormActions>
                  <a
                    slButtonLink
                    variant="ghost"
                    tone="secondary"
                    [routerLink]="[]"
                    [queryParams]="{}"
                    >Cancel</a
                  >
                  <button
                    slButton
                    type="submit"
                    data-testid="receive-submit"
                    [loading]="store.busy() === 'receive'"
                    [messages]="{ loading: 'Receiving' }"
                  >
                    Receive
                  </button>
                </div>
              </form>
            </div>
          </section>
        </ng-template>

        <ng-template #editForm>
          @if (edit.draft(); as draft) {
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Edit the order</h2>
                  <p slSectionDescription>{{ editWords() }}</p>
                </div>
              </div>
              <div slSectionBody>
                <form
                  slForm
                  data-testid="edit-form"
                  [messages]="{ summaryTitle: 'The order was not saved' }"
                  [errors]="edit.errors()"
                  (errorsChange)="edit.errors.set($event.value)"
                  [loading]="store.busy() === 'save'"
                  (formSubmit)="save($event)"
                >
                  @if (edit.conflict(); as fields) {
                    <app-conflict-panel
                      subject="purchase order"
                      [fields]="fields"
                      [busy]="store.busy() === 'save'"
                      (mine)="applyMine()"
                      (theirs)="edit.takeTheirs()"
                    />
                  }
                  @if (edit.withdrawsApproval()) {
                    <div slInlineMessage tone="warning" data-testid="withdraws-approval">
                      <span slInlineMessageIcon></span>
                      Saving changes the lines or the freight of an approved order: its approval is
                      withdrawn and it returns to draft, to be submitted again.
                    </div>
                  }
                  <div slStack [gap]="5">
                    <div slGrid [columns]="phone() ? 1 : 3" [gap]="4" minItemWidth="sm">
                      <div slField required>
                        <label slFieldLabel>Deliver to</label>
                        <sl-select
                          name="destinationWarehouseId"
                          [value]="draft.destinationWarehouseId"
                          (valueChangeRequest)="
                            edit.patch({
                              destinationWarehouseId:
                                $any($event.value) ?? draft.destinationWarehouseId,
                            })
                          "
                        >
                          @for (row of edit.destinations(); track row.id) {
                            <sl-select-item [value]="row.id"
                              >{{ row.code }} — {{ row.name }}</sl-select-item
                            >
                          }
                        </sl-select>
                      </div>
                      <div slField>
                        <label slFieldLabel>Expected</label>
                        <div
                          slDatePicker
                          name="expectedDate"
                          [value]="dateOf(draft.expectedDate)"
                          (valueChange)="edit.patch({ expectedDate: isoOf($event.value) })"
                        ></div>
                      </div>
                      @if (store.canSeeCost()) {
                        <div slField [invalid]="!!editError('freightMinor')">
                          <label slFieldLabel>Freight</label>
                          <div slCurrencyField>
                            <input
                              slCurrencyFieldInput
                              name="freightMinor"
                              [currency]="po()!.currency"
                              [min]="0"
                              [value]="draft.freight"
                              (valueChange)="edit.patch({ freight: $event.value ?? 0 })"
                            />
                          </div>
                          @if (editError('freightMinor'); as message) {
                            <p slFieldError>{{ message }}</p>
                          }
                        </div>
                      }
                    </div>
                    <app-po-lines
                      caption="Lines of the order"
                      [lines]="draft.lines"
                      [currency]="po()!.currency"
                      [errors]="edit.errors()"
                      [phone]="phone()"
                      [showCost]="store.canSeeCost()"
                      [options]="edit.lineOptions()"
                      [query]="edit.lineQuery()"
                      (queryChange)="edit.lineQuery.set($event)"
                      (add)="edit.addSku($event)"
                      (quantityChange)="edit.patchLine($event.skuId, { quantity: $event.value })"
                      (unitCostChange)="edit.patchLine($event.skuId, { unitCost: $event.value })"
                      (remove)="edit.remove($event)"
                    />
                    <div slField>
                      <label slFieldLabel>Notes</label>
                      <textarea
                        slTextarea
                        name="notes"
                        [rows]="2"
                        [value]="draft.notes"
                        (valueChange)="edit.patch({ notes: $event.value })"
                      ></textarea>
                    </div>
                  </div>
                  <div slFormActions>
                    <a
                      slButtonLink
                      variant="ghost"
                      tone="secondary"
                      [routerLink]="[]"
                      [queryParams]="{}"
                      (click)="edit.cancel()"
                      >Cancel</a
                    >
                    <button
                      slButton
                      type="submit"
                      data-testid="save-po"
                      [loading]="store.busy() === 'save'"
                      [messages]="{ loading: 'Saving' }"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </section>
          }
        </ng-template>

        <ng-template #receiveItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ receive: 1 }">Receive</a>
        </ng-template>
        <ng-template #submitItem>
          <button slMenuItem type="button" (click)="submit()">{{ submitLabel() }}</button>
        </ng-template>
        <ng-template #sendItem>
          <button slMenuItem type="button" (click)="send()">Send to supplier</button>
        </ng-template>
        <ng-template #acknowledgeItem>
          <button slMenuItem type="button" (click)="acknowledgeOpen.set(true)">
            Record acknowledgement
          </button>
        </ng-template>
        <ng-template #editItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ edit: 1 }">Edit</a>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (click)="store.load()">Refresh</button>
        </ng-template>
        <ng-template #closeItem>
          <button slMenuItem type="button" (click)="closeOpen.set(true)">Close short</button>
        </ng-template>
        <ng-template #cancelItem>
          <button slMenuItem type="button" (click)="cancelOpen.set(true)">Cancel order</button>
        </ng-template>

        <app-reason-dialog
          [(open)]="cancelOpen"
          title="Cancel this purchase order"
          description="Nothing has entered the stock, so no stock moves and nothing is expected any more. A cancelled order cannot be opened again; a new one is written instead."
          label="Why it is cancelled"
          note="Kept on the order's notes."
          confirmLabel="Cancel the order"
          [busy]="store.busy() === 'cancel'"
          (confirm)="cancel($event)"
        />
        <app-reason-dialog
          [(open)]="closeOpen"
          title="Close this order short"
          [description]="closeWords()"
          label="Why the rest will not come"
          note="Kept on the order's notes."
          confirmLabel="Close short"
          [busy]="store.busy() === 'close'"
          (confirm)="closeShort($event)"
        />
        <app-reason-dialog
          [(open)]="rejectOpen"
          title="Reject this purchase order"
          description="The order returns to draft with your reason in its notes; the buyer changes it or leaves it."
          label="Why it is rejected"
          confirmLabel="Reject"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('reject', $event)"
        />
        <app-reason-dialog
          [(open)]="changesOpen"
          title="Ask for changes"
          description="The order returns to draft with what to change in its notes."
          label="What to change"
          tone="warning"
          confirmLabel="Ask for changes"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('changes', $event)"
        />
        <sl-dialog size="sm" [(open)]="acknowledgeOpen" [loading]="store.busy() === 'acknowledge'">
          <header slDialogHeader>
            <h2 slDialogTitle>Record the supplier’s acknowledgement</h2>
            <p slDialogDescription>
              {{ po()?.supplierName }} confirmed the order. Where they committed to another date, it
              replaces the expected date.
            </p>
            <button slDialogClose></button>
          </header>
          <div slDialogBody>
            <div slField>
              <label slFieldLabel>Date they committed to</label>
              <div
                slDatePicker
                name="expectedDate"
                [value]="dateOf(acknowledgedDate())"
                (valueChange)="acknowledgedDate.set(isoOf($event.value))"
              ></div>
              <span slFieldDescription>{{ acknowledgeWords() }}</span>
            </div>
          </div>
          <footer slDialogFooter>
            <button
              slButton
              variant="ghost"
              tone="secondary"
              type="button"
              (click)="acknowledgeOpen.set(false)"
            >
              Keep it as it is
            </button>
            <button
              slButton
              type="button"
              data-testid="acknowledge-confirm"
              [loading]="store.busy() === 'acknowledge'"
              [messages]="{ loading: 'Recording' }"
              (click)="acknowledge()"
            >
              Record acknowledgement
            </button>
          </footer>
        </sl-dialog>
      </div>
    }
  `,
})
export class PurchaseOrderPage {
  readonly store = inject(PurchaseOrderStore);
  readonly receipt = inject(ReceiptDraftStore);
  readonly edit = inject(PurchaseOrderEditStore);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = PURCHASE_ORDERS_ROUTE;
  readonly receivingRoute = RECEIVING_ROUTE;
  readonly suppliersRoute = SUPPLIERS_ROUTE;
  readonly phone = phoneSignal();
  readonly cancelOpen = signal(false);
  readonly closeOpen = signal(false);
  readonly rejectOpen = signal(false);
  readonly changesOpen = signal(false);
  readonly acknowledgeOpen = signal(false);
  readonly acknowledgedDate = signal('');
  readonly chosenView = signal<View>('lines');

  readonly po = this.store.po;
  readonly rows = this.store.rows;
  readonly receiptFields = [
    { key: 'accepted' as const, label: 'Accepted' },
    { key: 'damaged' as const, label: 'Damaged' },
    { key: 'rejected' as const, label: 'Rejected' },
  ];
  readonly costWithheld = `Prices and totals are shown to holders of cost.view — ${HOLDERS['cost.view']}.`;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** The receipt form is a query parameter, so the back gesture closes it and stays on the order. */
  readonly receiving = computed(
    () => this.queryParams().get('receive') === '1' && this.store.commands().includes('receive'),
  );
  readonly editing = computed(
    () => this.queryParams().get('edit') === '1' && this.store.commands().includes('edit'),
  );

  /** A form written in the lines' tab holds the tab open. */
  readonly view = computed<View>(() =>
    this.receiving() || this.editing() ? 'lines' : this.chosenView(),
  );

  /** The header holds the commands; the one a form stands for leaves while the form is open. */
  readonly headerCommands = computed(() =>
    this.store
      .commands()
      .filter(
        (command) =>
          !(command === 'receive' && this.receiving()) && !(command === 'edit' && this.editing()),
      ),
  );

  readonly steps = computed(() => {
    const po = this.po();
    return po === null ? [] : purchaseOrderSteps(po, this.store.approvalRequest());
  });

  readonly sentence = computed(() => {
    const po = this.po();
    if (po === null) return '';
    return purchaseOrderSentence(
      po,
      this.store.approvalRequest(),
      this.store.submitPreview(),
      this.store.supplier()?.status === 'active',
    );
  });

  /** The sentence's lines, reserved while the order is read and kept once it has loaded. */
  readonly sentenceLines = computed(() => (this.phone() ? 5 : 2));
  /** A step's label and detail: a quarter of a phone wraps the detail to two lines. */
  readonly stepLines = computed(() => (this.phone() ? 3 : 2));

  /** The submit says what it does: an approval is asked for, or the order is approved at once (FM-11). */
  readonly submitLabel = computed(() =>
    this.store.submitPreview()?.required ? 'Submit for approval' : 'Submit',
  );

  readonly statusWord = computed(() => {
    const status = this.po()?.status;
    return status ? PO_STATUS_LABEL[status] : '';
  });
  readonly statusTone = computed(() => {
    const status = this.po()?.status;
    return status ? PO_STATUS_TONE[status] : 'secondary';
  });

  readonly subheading = computed(() => {
    const po = this.po();
    if (po === null) return '';
    return `${po.supplierName} · ${po.buyerName} · to ${po.warehouseCode}`;
  });

  readonly figureLabels = computed(() =>
    this.store.canSeeCost()
      ? ['Total', 'Lines', 'Received', 'Expected']
      : ['Lines', 'Received', 'Expected', 'Receipts'],
  );

  readonly lineColumns = computed(() => (this.phone() ? 3 : this.store.canSeeCost() ? 8 : 6));
  readonly placeholderCells = computed(() => Array.from({ length: this.lineColumns() - 1 }));

  readonly openLines = computed(
    () => this.rows().filter((row) => milli(row.openQuantity) > 0).length,
  );
  readonly receivableRows = computed(() =>
    this.rows().filter((row) => milli(row.openQuantity) > 0),
  );

  readonly expectedWords = computed(() => {
    const po = this.po();
    if (po === null) return '';
    if (po.daysLate > 0) return `${formatDays(po.daysLate)} late`;
    if (RECEIVABLE.includes(po.status)) return 'not yet due';
    return po.status === 'received' || po.status === 'closed' ? 'no longer awaited' : 'once sent';
  });

  readonly linesNote = computed(() => {
    const rejected = this.rows().some((row) => milli(row.rejectedQuantity) > 0);
    return `To come is what was ordered less everything that came through the door, accepted, damaged or rejected.${
      rejected ? ' Rejected units went back to the supplier and never entered the stock.' : ''
    }`;
  });

  /** What the state allows and the reader does not hold, said once with who does (RP-09, PM-02). */
  readonly permissionNote = computed(() => {
    void this.session.session();
    const po = this.po();
    if (po === null) return '';
    const can = (permission: string) => this.session.can(permission);
    const notes: string[] = [];
    if (po.status === 'draft' && !can('purchase_orders.submit'))
      notes.push(
        `It is submitted by holders of purchase_orders.submit — ${HOLDERS['purchase_orders.submit']}.`,
      );
    if (po.status === 'approved' && !can('purchase_orders.send'))
      notes.push(
        `It is sent by holders of purchase_orders.send — ${HOLDERS['purchase_orders.send']}.`,
      );
    if (RECEIVABLE.includes(po.status) && !this.store.canReceive())
      notes.push(
        can('receipts.create')
          ? `It is received at ${po.warehouseCode}, which is not one of your warehouses.`
          : `It is received at ${po.warehouseCode} by holders of receipts.create there — ${HOLDERS['receipts.create']}.`,
      );
    const open = po.status !== 'received' && po.status !== 'closed' && po.status !== 'cancelled';
    if (open && !this.store.hasReceived() && !can('purchase_orders.cancel'))
      notes.push(
        `It is cancelled by holders of purchase_orders.cancel — ${HOLDERS['purchase_orders.cancel']}.`,
      );
    if (
      this.store.hasReceived() &&
      RECEIVABLE.includes(po.status) &&
      !can('purchase_orders.approve')
    )
      notes.push(
        `What will not come is closed short by holders of purchase_orders.approve — ${HOLDERS['purchase_orders.approve']}.`,
      );
    return notes.join(' ');
  });

  readonly closeWords = computed(() => {
    const po = this.po();
    const open = this.openLines();
    return `Each line keeps what came through the door: ${open} ${open === 1 ? 'line stops' : 'lines stop'} waiting for the rest, and ${po?.warehouseCode ?? 'the warehouse'} no longer counts it as inbound. The order closes and cannot be received again.`;
  });

  readonly editWords = computed(() =>
    this.po()?.status === 'approved'
      ? 'The order is approved. A change of date, destination or notes keeps the approval; a change of its lines or freight withdraws it.'
      : 'A draft is edited freely. Only the fields you change are written.',
  );

  readonly acknowledgeWords = computed(() => {
    const po = this.po();
    return po
      ? `Left empty, the order stays expected on ${formatDate(po.expectedDate)}. A date already past marks it delayed.`
      : '';
  });

  readonly outcomeWords = computed(() => {
    const po = this.po();
    const outcome = this.receipt.outcome();
    const lines = (n: number) => `${n} ${n === 1 ? 'line' : 'lines'}`;
    const where = po?.warehouseCode ?? 'the warehouse';
    const words: string[] = [];
    words.push(
      outcome.intoStock > 0
        ? `${lines(outcome.intoStock)} ${outcome.intoStock === 1 ? 'enters' : 'enter'} ${where}'s stock.`
        : `Nothing enters ${where}'s stock.`,
    );
    if (outcome.damaged > 0)
      words.push(
        `On ${lines(outcome.damaged)} the damaged units enter the stock and move to its damaged bucket at once: counted, never sold.`,
      );
    if (outcome.rejected > 0)
      words.push(
        `On ${lines(outcome.rejected)} the rejected units go back to ${po?.supplierName ?? 'the supplier'} and never enter the stock.`,
      );
    words.push(
      outcome.complete
        ? 'Every line reaches 95% of its order, so the order closes as received and nothing more is expected.'
        : `The order stays partly received: ${lines(outcome.open)} still wait for the rest.`,
    );
    words.push(
      `Owners of confirmed orders waiting on these SKUs at ${where} are told the stock arrived; nothing is allocated to them.`,
    );
    return words;
  });

  readonly missingStatus = computed<'not-found' | 'error' | 'forbidden'>(() => {
    // A warehouse role reads only the orders bound for its warehouses; the read refuses the rest.
    const code = this.store.error()?.code;
    return code === 'FORBIDDEN' ? 'forbidden' : code === 'NOT_FOUND' ? 'not-found' : 'error';
  });
  readonly missingTitle = computed(() => {
    const status = this.missingStatus();
    return status === 'forbidden'
      ? 'This purchase order is bound for another warehouse'
      : status === 'not-found'
        ? 'This purchase order does not exist'
        : 'The purchase order could not be loaded';
  });
  readonly missingWords = computed(() =>
    this.missingStatus() === 'forbidden'
      ? 'It is delivered to a warehouse your role is not scoped to, so it is not yours to read or receive.'
      : (this.store.error()?.message ?? ''),
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.chosenView.set('lines');
      void this.store.open(id);
    });
    // The receipt opens on what each line still owes; what was typed is kept (FM-05).
    effect(() => {
      if (!this.receiving() || this.rows().length === 0) return;
      untracked(() => void this.receipt.start());
    });
    effect(() => {
      if (!this.editing() || this.po() === null) return;
      untracked(() => void this.edit.start());
    });
    effect(() => {
      const po = this.po();
      if (po) untracked(() => this.acknowledgedDate.set(''));
    });
  }

  setView(value: string | undefined): void {
    if (value === 'lines' || value === 'receipts' || value === 'details')
      this.chosenView.set(value);
  }

  exception(flag: 'delayed' | 'disputed'): string {
    return PO_EXCEPTION_LABEL[flag];
  }

  days(n: number): string {
    return formatDays(n);
  }

  money(value: { currency: 'USD' | 'EUR' | 'GBP' | 'BRL'; minor: number }): string {
    return formatMoney(value);
  }

  share(bps: number): string {
    return percentFromBps(bps);
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  tier(value: 'standard' | 'preferred' | 'conditional'): string {
    return SUPPLIER_TIER_LABEL[value];
  }

  terms(code: keyof typeof PAYMENT_TERMS_LABEL): string {
    return PAYMENT_TERMS_LABEL[code];
  }

  warehouseName(id: string): string {
    return this.warehouses.name(id);
  }

  currencyWords(): string {
    const po = this.po();
    if (po === null) return '';
    return po.currency === 'USD'
      ? 'USD'
      : `${po.currency}, at ${Number(po.fxRateToUsd ?? '1').toFixed(4)} US$ each for the approval`;
  }

  noReceiptWords(): string {
    const po = this.po();
    if (po === null) return '';
    return RECEIVABLE.includes(po.status)
      ? `Receipts are written at ${po.warehouseCode} as the goods arrive.`
      : 'An order is received once it has been sent.';
  }

  position(row: PurchaseOrderLineRow) {
    return positionLink(row.skuId, this.po()?.destinationWarehouseId);
  }

  amount(value: string, row: PurchaseOrderLineRow): string {
    return `${formatQuantity(value)} ${row.unit}`;
  }

  lineStatus(row: PurchaseOrderLineRow): string {
    const q = (value: string) => `${formatQuantity(value)} ${row.unit}`;
    return `Ordered ${q(row.orderedQuantity)} · through the door ${q(row.receivedTotal)} · to come ${q(row.openQuantity)}`;
  }

  key(row: PurchaseOrderLineRow, field: 'accepted' | 'damaged' | 'rejected'): string {
    return receiptKey(row.id, field);
  }

  patchOf(field: 'accepted' | 'damaged' | 'rejected', value: number | null | undefined) {
    return { [field]: value ?? null };
  }

  receiptError(name: string): string | null {
    return this.receipt.errors()[name]?.[0] ?? null;
  }

  editError(name: string): string | null {
    return this.edit.errors()[name]?.[0] ?? null;
  }

  /** The tolerance, said at the line it is about as the reader types (FM-11). */
  toleranceWords(row: PurchaseOrderLineRow): string | null {
    if (this.receipt.overTolerance().some((over) => over.id === row.id))
      return 'More than 5% over the order: received only with the reason below.';
    if (this.receipt.overOrder().some((over) => over.id === row.id))
      return 'Over the order, within the 5% it may run over.';
    return null;
  }

  overWords(): string {
    const lines = this.receipt
      .overTolerance()
      .map((row) => row.skuCode)
      .join(', ');
    return `${lines} ${this.receipt.overTolerance().length === 1 ? 'goes' : 'go'} more than 5% over the order. Your role may receive it with a reason, which the receipt keeps.`;
  }

  writtenWords(written: { number: string; complete: boolean; openLines: number }): string {
    return written.complete
      ? `${written.number} received. The order is received in full.`
      : `${written.number} received in part: ${written.openLines} ${written.openLines === 1 ? 'line still waits' : 'lines still wait'} for the rest, and the order stays open.`;
  }

  dateOf(iso: string): PlainDate | null {
    return iso ? plainDate(iso) : null;
  }

  iso(value: PlainDate): string {
    return toISODate(value);
  }

  isoOf(value: CalendarValue): string {
    const date = chosenDate(value);
    return date ? this.iso(date) : '';
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  async submit(): Promise<void> {
    if (!(await this.store.submit())) return;
    const po = this.po();
    this.toasts.show(
      po?.status === 'pending_approval'
        ? { title: 'Submitted for approval', description: this.sentence(), tone: 'success' }
        : {
            title: 'Submitted and approved',
            description: 'It can be sent to the supplier now.',
            tone: 'success',
          },
    );
  }

  async send(): Promise<void> {
    if (await this.store.send())
      this.toasts.show({
        title: `Sent to ${this.po()?.supplierName ?? 'the supplier'}`,
        tone: 'success',
      });
  }

  async acknowledge(): Promise<void> {
    const ok = await this.store.acknowledge(this.acknowledgedDate());
    this.acknowledgeOpen.set(false);
    if (ok) this.toasts.show({ title: 'Acknowledgement recorded', tone: 'success' });
  }

  async cancel(reason: string): Promise<void> {
    const ok = await this.store.cancel(reason);
    this.cancelOpen.set(false);
    if (ok) this.toasts.show({ title: 'Purchase order cancelled', tone: 'success' });
  }

  async closeShort(reason: string): Promise<void> {
    const ok = await this.store.closeShort(reason);
    this.closeOpen.set(false);
    if (ok)
      this.toasts.show({
        title: 'Closed short',
        description: 'What had not arrived is no longer expected.',
        tone: 'success',
      });
  }

  decide(decision: 'approve' | 'reject' | 'changes'): void {
    if (decision === 'reject') this.rejectOpen.set(true);
    else if (decision === 'changes') this.changesOpen.set(true);
    else void this.decided('approve', '');
  }

  async decided(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<void> {
    const ok = await this.store.decide(decision, reason);
    this.rejectOpen.set(false);
    this.changesOpen.set(false);
    if (ok)
      this.toasts.show({
        title:
          decision === 'approve'
            ? 'Approved'
            : decision === 'reject'
              ? 'Rejected'
              : 'Changes asked for',
        tone: 'success',
      });
  }

  receive(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeReceipt());
  }

  private async writeReceipt(): Promise<void> {
    if (!(await this.receipt.receive())) return;
    leaveForm(this.router, this.route, this.location, {});
  }

  save(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeEdit());
  }

  async applyMine(): Promise<void> {
    if (await this.edit.applyMine()) this.saved();
  }

  private async writeEdit(): Promise<void> {
    if (await this.edit.save()) this.saved();
  }

  private saved(): void {
    this.toasts.show({ title: 'Purchase order saved', tone: 'success' });
    leaveForm(this.router, this.route, this.location, {});
  }
}
