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
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
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
import { SlTimeline, SlTimelineItem, SlTimelineList } from '@slotted/angular/timeline';
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
import type { Money } from '@slotted/demo-nexora-backend';

import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
} from '../../core/catalog/catalog.model';
import {
  agingWords,
  COLLECTION_LABEL,
  CREDIT_MEMOS_ROUTE,
  FINANCE_HOLDERS,
  financeAdvice,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  INVOICES_ROUTE,
  LIFECYCLE_LABEL,
  NEW_CREDIT_MEMO_ROUTE,
  NEW_PAYMENT_ROUTE,
  PAYMENT_METHOD_LABEL,
  PAYMENTS_ROUTE,
  SETTLEMENT_LABEL,
} from '../../core/finance/finance.model';
import { InvoiceContactStore } from '../../core/finance/invoice-contact.store';
import { InvoiceCreditStore } from '../../core/finance/invoice-credit.store';
import { InvoiceEditStore } from '../../core/finance/invoice-edit.store';
import {
  CONTACT_CHANNELS,
  InvoiceStore,
  type ContactChannel,
} from '../../core/finance/invoice.store';
import { toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { PAYMENT_TERMS_LABEL } from '../../core/procurement/procurement.model';
import { leaveForm } from '../inventory/leave-form';
import { ApprovalPanel } from '../orders/approval-panel';
import { ReasonDialog } from '../orders/reason-dialog';
import { ConflictPanel } from '../procurement/conflict-panel';
import { RecordProgress } from '../record-progress/record-progress';
import { invoiceSentence, invoiceSteps, invoiceStop } from './invoice-progress';
import { chosenDate } from '../../core/chosen-date';
import type { CalendarValue } from '@slotted/angular/calendar';

type View = 'lines' | 'payments' | 'collection' | 'details';

const plainDate = (iso: string): PlainDate | null => {
  const [year, month, day] = iso.split('-').map(Number);
  return year && month && day ? { year, month, day } : null;
};

/** One row of the Payments & credits tab: a payment's allocation or a credit memo's application. */
interface Settlement {
  readonly id: string;
  readonly kind: 'payment' | 'credit';
  readonly documentId: string;
  readonly number: string;
  readonly how: string;
  readonly date: string;
  readonly amount: Money;
  readonly active: boolean;
}

/**
 * One invoice (§66): where it stands on its three axes and what that waits on
 * (RP-06), its lines added back up to its total (RP-07), what paid or credited
 * it, the contact attempts made to collect it, and the commands the reader's
 * permissions allow in its state (RP-09). A void is not drawn once a payment
 * or a credit is applied (§66.5); a write-off says, before any control, the
 * authority the balance needs in US dollars (FM-11, FM-13), and above
 * US$5,000 it asks for an approval another Finance Manager decides (§67.4).
 *
 * The edit, the contact attempt and the credit are written in their own tab
 * (FM-07), each a query parameter the back gesture closes (FM-12).
 */
@Component({
  selector: 'app-invoice-page',
  imports: [
    NgIcon,
    ApprovalPanel,
    ConflictPanel,
    NgTemplateOutlet,
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
    SlTimeline,
    SlTimelineItem,
    SlTimelineList,
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
    /* The steps' shape while the invoice is read: four cells, as the loaded element draws them. */
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
    .step-words-shape {
      display: block;
      /* Exactly the lines the loaded step reserves: two skeleton lines and their gap would overshoot it. */
      overflow: hidden;
      block-size: calc(
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
    .reversed {
      text-decoration: line-through;
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    @if (store.error()) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="listRoute">Invoices</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Invoice</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="missingStatus()"
            reach="section"
            data-testid="invoice-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ missingTitle() }}</h2>
              <p slResultStateDescription>{{ missingWords() }}</p>
            </div>
            <div slResultStateActions>
              @if (missingStatus() === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute"
                >Back to invoices</a
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
              <a slPageHeaderBack [routerLink]="listRoute">Invoices</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ title() }}</h1>
                @if (invoice(); as i) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()" data-testid="invoice-status"
                      ><span slTagBody>{{ statusWord() }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!--
                    Every invoice carries its status: the mark's own box is kept — a small tag's height,
                    which a bare text line is not on a coarse pointer — with the words left to the answer.
                  -->
                  <span slPageHeaderMarks>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="3.5rem"></span></span
                    ></span>
                  </span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (invoice()) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Invoice actions" overflow="menu">
                    @if (headerCommands().includes('payment')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="paymentItem">
                        <a
                          slButtonLink
                          data-testid="record-payment"
                          [routerLink]="paymentRoute"
                          [queryParams]="paymentParams()"
                          >Record payment</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('open')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="openItem">
                        <button
                          slButton
                          type="button"
                          data-testid="open-invoice"
                          [loading]="store.busy() === 'open'"
                          [messages]="{ loading: 'Opening' }"
                          (click)="openInvoice()"
                        >
                          Open invoice
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('contact')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="contactItem">
                        <a
                          slButtonLink
                          variant="outline"
                          tone="secondary"
                          data-testid="record-contact"
                          [routerLink]="[]"
                          [queryParams]="{ contact: 1 }"
                          >Record contact attempt</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('credit')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="creditItem">
                        <a
                          slButtonLink
                          variant="outline"
                          tone="secondary"
                          data-testid="apply-credit"
                          [routerLink]="[]"
                          [queryParams]="{ credit: 1 }"
                          >Apply credit</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('send')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="sendItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="send-invoice"
                          [loading]="store.busy() === 'send'"
                          [messages]="{ loading: 'Sending' }"
                          (click)="send()"
                        >
                          {{ sendLabel() }}
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('edit')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="editItem">
                        <a
                          slButtonLink
                          variant="outline"
                          tone="secondary"
                          data-testid="edit-draft"
                          [routerLink]="[]"
                          [queryParams]="{ edit: 1 }"
                          >Edit draft</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('creditMemo')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="creditMemoItem">
                        <a
                          slButtonLink
                          variant="ghost"
                          tone="secondary"
                          data-testid="issue-credit-memo"
                          [routerLink]="newCreditMemoRoute"
                          [queryParams]="creditMemoParams()"
                          >Issue credit memo</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('dispute')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="disputeItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="dispute"
                          (click)="disputeOpen.set(true)"
                        >
                          Mark disputed
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('resolve')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="resolveItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          data-testid="resolve"
                          [loading]="store.busy() === 'resolve'"
                          [messages]="{ loading: 'Resolving' }"
                          (click)="resolve()"
                        >
                          Resolve dispute
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('writeOff')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="writeOffItem">
                        <button
                          slButton
                          variant="outline"
                          [tone]="writeOffAsks() ? 'secondary' : 'danger'"
                          type="button"
                          data-testid="write-off"
                          (click)="writeOffOpen.set(true)"
                        >
                          {{ writeOffLabel() }}
                        </button>
                      </div>
                    }
                    <!-- Approvers and the clock move this invoice while the page is open (AF-07): the read keeps the values and marks the page busy. -->
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
                    @if (headerCommands().includes('void')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="voidItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="void"
                          (click)="voidOpen.set(true)"
                        >
                          Void
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
              <div slTabList aria-label="Invoice sections">
                <div slTab value="lines">
                  Lines{{ detail() ? ' ' + detail()!.lines.length : '' }}
                </div>
                <div slTab value="payments">
                  Payments{{ detail() ? ' ' + settlements().length : '' }}
                </div>
                <div slTab value="collection">
                  Collection{{ detail() ? ' ' + store.attempts().length : '' }}
                </div>
                <div slTab value="details">Details</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="invoice-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (invoice(); as i) {
              <div
                slGrid
                [columns]="phone() ? 2 : 4"
                minItemWidth="xs"
                [gap]="4"
                data-testid="invoice-figures"
              >
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Total</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="invoice-total">{{ money(i.total) }}</span>
                    <p slStatCardComparison>{{ totalWords() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Outstanding</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="invoice-outstanding">{{
                      money(i.outstanding)
                    }}</span>
                    <p slStatCardComparison>{{ settlementWords() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Paid and credited</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(i.paidAmount) }}</span>
                    <p slStatCardComparison>{{ paidWords() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Due</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ date(i.dueDate) }}</span>
                    <p slStatCardComparison data-testid="invoice-aging">{{ dueWords() }}</p>
                  </div>
                </div>
              </div>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                </div>
                <div slSectionBody>
                  <app-record-progress
                    [steps]="steps()"
                    [sentence]="sentence()"
                    [sentenceLines]="sentenceLines()"
                    [stepLines]="stepLines()"
                    [stopped]="stop()"
                  />
                </div>
              </section>
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the invoice' }" [loading]="true">
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
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                    </div>
                    <div slSectionBody>
                      <div slStack [gap]="3">
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
                <ng-container *ngTemplateOutlet="linesTable" />
              }
              @case ('payments') {
                @if (crediting()) {
                  <ng-container *ngTemplateOutlet="creditForm" />
                } @else {
                  <ng-container *ngTemplateOutlet="settlementsTable" />
                }
              }
              @case ('collection') {
                @if (contacting()) {
                  <ng-container *ngTemplateOutlet="contactForm" />
                } @else {
                  <ng-container *ngTemplateOutlet="collection" />
                }
              }
              @case ('details') {
                @if (editing()) {
                  <ng-container *ngTemplateOutlet="editForm" />
                } @else {
                  <ng-container *ngTemplateOutlet="details" />
                }
              }
            }

            <!--
              A write-off's approval is known only once the invoice is read, so it stands under the
              section it is read beside rather than above it, where it would move the tab when it lands.
            -->
            @if (store.approval(); as approval) {
              <section slSection data-testid="write-off-approval">
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Write-off approval</h2></div>
                </div>
                <div slSectionBody>
                  <app-approval-panel
                    [approval]="approval"
                    [busy]="store.busy() === 'decision'"
                    (decide)="decide($event)"
                  />
                </div>
              </section>
            }
            @if (permissionNote(); as note) {
              <span slText size="sm" tone="muted" data-testid="invoice-permission">{{ note }}</span>
            }
          </div>
        </div>

        <ng-template #linesTable>
          <div
            slTable
            variant="framed"
            [columns]="phone() ? 2 : 6"
            [layout]="phone() ? 'fixed' : 'auto'"
            data-testid="invoice-lines"
          >
            <div slTableContent>
              <caption slTableCaption>
                What this invoice charges, line by line, in
                {{
                  currencyCode()
                }}
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Line</th>
                  @if (!phone()) {
                    <th slTableColumnHeader align="end" numeric>Quantity</th>
                    <th slTableColumnHeader align="end" numeric>Unit price</th>
                    <th slTableColumnHeader align="end" numeric>Net</th>
                    <th slTableColumnHeader align="end" numeric>Tax</th>
                  }
                  <th slTableColumnHeader align="end" numeric>Total</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @if (detail() === null) {
                  <tr slTableRow>
                    <th slTableRowHeader><span slSkeleton shape="text" inlineSize="70%"></span></th>
                    @if (!phone()) {
                      @for (cell of [1, 2, 3, 4]; track cell) {
                        <td slTableCell align="end">
                          <span slSkeleton shape="text" inlineSize="3rem"></span>
                        </td>
                      }
                    }
                    <td slTableCell align="end">
                      <span slSkeleton shape="text" inlineSize="3.5rem"></span>
                    </td>
                  </tr>
                } @else if (detail()!.lines.length === 0) {
                  <tr slTableRow>
                    <td slTableEmpty>
                      <div slResultState status="empty" reach="section">
                        <div slResultStateContent>
                          <h3 slResultStateTitle>No lines</h3>
                          <p slResultStateDescription>
                            An adjustment with nothing charged line by line; its total is what it
                            states.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (line of detail()!.lines; track line.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        <span class="cell-text" [title]="lineTitle(line)"
                          >{{ line.skuCode ? line.skuCode + ' · ' : ''
                          }}{{ line.description }}</span
                        >
                      </th>
                      @if (!phone()) {
                        <td slTableCell align="end" numeric>{{ quantity(line.quantity) }}</td>
                        <td slTableCell align="end" numeric>{{ money(line.unitPrice) }}</td>
                        <td slTableCell align="end" numeric>{{ money(line.netAmount) }}</td>
                        <td slTableCell align="end" numeric>{{ money(line.taxAmount) }}</td>
                      }
                      <td slTableCell align="end" numeric>{{ money(line.totalAmount) }}</td>
                    </tr>
                  }
                }
              </tbody>
              @if (invoice(); as i) {
                <tfoot slTableSummary data-testid="invoice-summary">
                  @if (!phone()) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        {{ detail()!.lines.length }}
                        {{ detail()!.lines.length === 1 ? 'line' : 'lines' }}
                      </th>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell align="end" numeric>{{ money(i.subtotal) }}</td>
                      <td slTableCell align="end" numeric>{{ money(i.taxTotal) }}</td>
                      <td slTableCell align="end" numeric>{{ money(lineTotal()) }}</td>
                    </tr>
                  } @else {
                    <tr slTableRow>
                      <th slTableRowHeader>Subtotal and tax</th>
                      <td slTableCell align="end" numeric>{{ money(lineTotal()) }}</td>
                    </tr>
                  }
                  <tr slTableRow>
                    <th slTableRowHeader>Freight</th>
                    @if (!phone()) {
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                    }
                    <td slTableCell align="end" numeric>{{ money(i.freight) }}</td>
                  </tr>
                  <tr slTableRow>
                    <th slTableRowHeader>Total</th>
                    @if (!phone()) {
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                      <td slTableCell></td>
                    }
                    <td slTableCell align="end" numeric data-testid="lines-total">
                      {{ money(i.total) }}
                    </td>
                  </tr>
                </tfoot>
              }
            </div>
          </div>
        </ng-template>

        <ng-template #settlementsTable>
          <div
            slTable
            variant="framed"
            [columns]="phone() ? 2 : 4"
            [layout]="phone() ? 'fixed' : 'auto'"
            data-testid="invoice-settlements"
          >
            <div slTableContent>
              <caption slTableCaption>
                Payments allocated and credits applied to this invoice
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Document</th>
                  @if (!phone()) {
                    <th slTableColumnHeader>How</th>
                    <th slTableColumnHeader>Date</th>
                  }
                  <th slTableColumnHeader align="end" numeric>Amount</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @if (detail() === null) {
                  <tr slTableRow>
                    <th slTableRowHeader><span slSkeleton shape="text" inlineSize="60%"></span></th>
                    @if (!phone()) {
                      <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                      <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                    }
                    <td slTableCell align="end">
                      <span slSkeleton shape="text" inlineSize="3.5rem"></span>
                    </td>
                  </tr>
                } @else if (settlements().length === 0) {
                  <tr slTableRow>
                    <td slTableEmpty>
                      <div slResultState status="empty" reach="section">
                        <div slResultStateContent>
                          <h3 slResultStateTitle>Nothing paid or credited yet</h3>
                          <p slResultStateDescription>{{ noSettlementWords() }}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (row of settlements(); track row.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        @if (documentLink(row); as link) {
                          <a
                            slLink
                            class="cell-text"
                            variant="neutral"
                            underline="hover"
                            [routerLink]="link"
                            [title]="row.number"
                            >{{ row.number }}</a
                          >
                        } @else {
                          <span class="cell-text">{{ row.number }}</span>
                        }
                      </th>
                      @if (!phone()) {
                        <td slTableCell>{{ row.how }}{{ row.active ? '' : ' · reversed' }}</td>
                        <td slTableCell>{{ date(row.date) }}</td>
                      }
                      <td slTableCell align="end" numeric>
                        <span [class.reversed]="!row.active">{{ money(row.amount) }}</span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
              @if (invoice(); as i) {
                @if (settlements().length > 0) {
                  <tfoot slTableSummary>
                    <tr slTableRow>
                      <th slTableRowHeader>Paid and credited</th>
                      @if (!phone()) {
                        <td slTableCell></td>
                        <td slTableCell></td>
                      }
                      <td slTableCell align="end" numeric data-testid="settled-total">
                        {{ money(i.paidAmount) }}
                      </td>
                    </tr>
                  </tfoot>
                }
              }
            </div>
          </div>
          @if (hasReversed()) {
            <span slText size="sm" tone="muted"
              >A reversed payment is struck through: it no longer counts toward what is paid.</span
            >
          }
        </ng-template>

        <ng-template #collection>
          <section slSection data-testid="invoice-collection">
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>Contact attempts</h2>
                <p slSectionDescription>
                  Each attempt is a note on {{ invoice()?.customerName ?? 'the customer' }}, so
                  Customer 360 reads it too.
                </p>
              </div>
            </div>
            <div slSectionBody>
              @if (detail() === null) {
                <span slSkeletonText [lines]="2" lastLineSize="60%"></span>
              } @else if (store.attempts().length === 0) {
                <div slResultState status="empty" reach="section">
                  <div slResultStateContent>
                    <h3 slResultStateTitle>No contact attempt recorded</h3>
                    <p slResultStateDescription>{{ noAttemptWords() }}</p>
                  </div>
                </div>
              } @else {
                <div slTimeline size="sm" label="Contact attempts on this invoice">
                  <ol slTimelineList>
                    @for (attempt of store.attempts(); track attempt.id) {
                      <li
                        slTimelineItem
                        [title]="attemptTitle(attempt)"
                        [description]="dateTime(attempt.at)"
                      >
                        <span slText size="sm">{{ attempt.said }}</span>
                      </li>
                    }
                  </ol>
                </div>
              }
            </div>
          </section>
        </ng-template>

        <ng-template #details>
          @if (invoice(); as i) {
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle><h2 slSectionHeading>Terms</h2></div>
              </div>
              <div slSectionBody>
                <div slDescriptionList layout="row" data-testid="invoice-terms">
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Customer</dt>
                    <dd slDescriptionListDescription>
                      <a slLink [routerLink]="['/crm/customers', i.customerId]">{{
                        i.customerName
                      }}</a>
                    </dd>
                  </div>
                  @if (i.sourceOrderId) {
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Order</dt>
                      <dd slDescriptionListDescription>
                        <a slLink [routerLink]="['/sales/orders', i.sourceOrderId]">{{
                          i.orderNumber ?? i.sourceOrderId
                        }}</a>
                      </dd>
                    </div>
                  }
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Billing contact</dt>
                    <dd slDescriptionListDescription>{{ contactWords() }}</dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Bill to</dt>
                    <dd slDescriptionListDescription>
                      <span slStack [gap]="0">
                        @for (line of addressLines(); track $index) {
                          <span slText size="sm">{{ line }}</span>
                        }
                      </span>
                    </dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Customer PO</dt>
                    <dd slDescriptionListDescription>{{ i.customerPoNumber || 'None' }}</dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Payment terms</dt>
                    <dd slDescriptionListDescription>{{ terms(i.paymentTermsCode) }}</dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Issued</dt>
                    <dd slDescriptionListDescription>{{ date(i.issueDate) }}</dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>State</dt>
                    <dd slDescriptionListDescription data-testid="invoice-axes">
                      {{ axesWords() }}
                    </dd>
                  </div>
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>Currency</dt>
                    <dd slDescriptionListDescription>{{ currencyWords() }}</dd>
                  </div>
                  @if (i.disputeReason) {
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Dispute</dt>
                      <dd slDescriptionListDescription>{{ i.disputeReason }}</dd>
                    </div>
                  }
                </div>
              </div>
            </section>
          }
        </ng-template>

        <ng-template #editForm>
          @if (edit.draft(); as draft) {
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Edit the draft</h2>
                  <p slSectionDescription>
                    A draft is edited freely until it is opened. Only the fields you change are
                    written.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <form
                  slForm
                  data-testid="edit-form"
                  [messages]="{ summaryTitle: 'The draft was not saved' }"
                  [errors]="editErrors()"
                  (errorsChange)="edit.errors.set($event.value)"
                  [loading]="store.busy() === 'save'"
                  (formSubmit)="save($event)"
                >
                  @if (edit.conflict(); as fields) {
                    <app-conflict-panel
                      subject="invoice"
                      [fields]="fields"
                      [busy]="store.busy() === 'save'"
                      (mine)="applyMine()"
                      (theirs)="edit.takeTheirs()"
                    />
                  }
                  <div slGrid [columns]="phone() ? 1 : 2" [gap]="4" minItemWidth="sm">
                    <div slField>
                      <label slFieldLabel>Billing contact</label>
                      <sl-select
                        name="billingContactId"
                        placeholder="No contact named"
                        [value]="draft.billingContactId || null"
                        (valueChangeRequest)="
                          edit.patch({ billingContactId: $any($event.value) ?? '' })
                        "
                      >
                        @for (contact of edit.contacts(); track contact.id) {
                          <sl-select-item [value]="contact.id">{{
                            contact.displayName
                          }}</sl-select-item>
                        }
                      </sl-select>
                    </div>
                    <div slField>
                      <label slFieldLabel>Customer PO</label>
                      <div slTextField>
                        <input
                          slTextFieldInput
                          name="customerPoNumber"
                          [value]="draft.customerPoNumber"
                          (valueChange)="edit.patch({ customerPoNumber: $event.value })"
                        />
                      </div>
                    </div>
                    <div slField required [invalid]="!!editError('dueDate')">
                      <label slFieldLabel>Due</label>
                      <div
                        slDatePicker
                        name="dueDate"
                        [min]="dateOf(invoice()!.issueDate) ?? undefined"
                        [value]="dateOf(draft.dueDate)"
                        (valueChange)="edit.patch({ dueDate: isoOf($event.value) })"
                      ></div>
                      @if (editError('dueDate'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription
                          >Not before the issue date, {{ date(invoice()!.issueDate) }}.</span
                        >
                      }
                    </div>
                    <div slField [invalid]="!!editError('freightMinor')">
                      <label slFieldLabel>Freight</label>
                      <div slCurrencyField>
                        <input
                          slCurrencyFieldInput
                          name="freightMinor"
                          [currency]="currencyCode()"
                          [min]="0"
                          [value]="draft.freight"
                          (valueChange)="edit.patch({ freight: $event.value ?? 0 })"
                        />
                      </div>
                      @if (editError('freightMinor'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription
                          >Changes the total; the lines stay as shipped.</span
                        >
                      }
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
                      data-testid="save-draft"
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

        <ng-template #contactForm>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>Record a contact attempt</h2>
                <p slSectionDescription>
                  Kept as a note on {{ invoice()?.customerName }}, which everyone who reads the
                  account sees, beginning with this invoice's number.
                </p>
              </div>
            </div>
            <div slSectionBody>
              <form
                slForm
                data-testid="contact-form"
                [messages]="{ summaryTitle: 'The attempt was not recorded' }"
                [errors]="contact.errors()"
                (errorsChange)="contact.errors.set($event.value)"
                [loading]="store.busy() === 'contact'"
                (formSubmit)="recordContact($event)"
              >
                <div slGrid [columns]="phone() ? 1 : 2" [gap]="4" minItemWidth="sm">
                  <div slField required>
                    <label slFieldLabel>How</label>
                    <sl-select
                      name="channel"
                      [value]="contact.channel()"
                      (valueChangeRequest)="setChannel($event.value)"
                    >
                      @for (channel of channels; track channel) {
                        <sl-select-item [value]="channel">{{ channel }}</sl-select-item>
                      }
                    </sl-select>
                  </div>
                  <div slField [invalid]="!!contactError('promised')">
                    <label slFieldLabel>Payment promised by</label>
                    <div
                      slDatePicker
                      name="promised"
                      [value]="dateOf(contact.promised())"
                      (valueChange)="contact.promised.set(isoOf($event.value))"
                    ></div>
                    @if (contactError('promised'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription>Left empty when nothing was promised.</span>
                    }
                  </div>
                </div>
                <div slField required [invalid]="!!contactError('body')">
                  <label slFieldLabel>What was said or agreed</label>
                  <textarea
                    slTextarea
                    name="body"
                    data-testid="contact-said"
                    [rows]="3"
                    [value]="contact.said()"
                    (valueChange)="contact.said.set($event.value)"
                    placeholder="Spoke to accounts payable; the payment run is on Friday."
                  ></textarea>
                  @if (contactError('body'); as message) {
                    <p slFieldError>{{ message }}</p>
                  }
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
                    data-testid="contact-submit"
                    [loading]="store.busy() === 'contact'"
                    [messages]="{ loading: 'Recording' }"
                  >
                    Record attempt
                  </button>
                </div>
              </form>
            </div>
          </section>
        </ng-template>

        <ng-template #creditForm>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>Apply credit</h2>
                <p slSectionDescription>
                  From one of {{ invoice()?.customerName }}'s open credit memos in
                  {{ currencyCode() }}. What is applied leaves the memo and lowers what the invoice
                  owes.
                </p>
              </div>
            </div>
            <div slSectionBody>
              <form
                slForm
                data-testid="credit-form"
                [messages]="{ summaryTitle: 'No credit was applied' }"
                [errors]="credit.errors()"
                (errorsChange)="credit.setErrors($event.value)"
                [loading]="store.busy() === 'credit'"
                (formSubmit)="applyCredit($event)"
              >
                <div slGrid [columns]="phone() ? 1 : 2" [gap]="4" minItemWidth="sm">
                  <div slField required>
                    <label slFieldLabel>Credit memo</label>
                    <sl-select
                      name="creditMemoId"
                      [value]="credit.memoId()"
                      (valueChangeRequest)="credit.choose($any($event.value) ?? null)"
                    >
                      @for (memo of credit.memos(); track memo.id) {
                        <sl-select-item [value]="memo.id"
                          >{{ memo.creditMemoNumber }} ·
                          {{ money(memo.unappliedAmount) }} left</sl-select-item
                        >
                      }
                    </sl-select>
                  </div>
                  <div slField required [invalid]="!!creditError()">
                    <label slFieldLabel>Amount</label>
                    <div slCurrencyField>
                      <input
                        slCurrencyFieldInput
                        name="amountMinor"
                        data-testid="credit-amount"
                        [currency]="currencyCode()"
                        [min]="0"
                        [value]="credit.amount()"
                        (valueChange)="credit.amount.set($event.value ?? null)"
                      />
                    </div>
                    @if (creditError(); as message) {
                      <p slFieldError data-testid="credit-error">{{ message }}</p>
                    } @else {
                      <span slFieldDescription>{{ credit.limitWords() }}</span>
                    }
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
                    data-testid="credit-submit"
                    [loading]="store.busy() === 'credit'"
                    [messages]="{ loading: 'Applying' }"
                  >
                    Apply credit
                  </button>
                </div>
              </form>
            </div>
          </section>
        </ng-template>

        <ng-template #paymentItem>
          <a slMenuItem [routerLink]="paymentRoute" [queryParams]="paymentParams()"
            >Record payment</a
          >
        </ng-template>
        <ng-template #openItem>
          <button slMenuItem type="button" (click)="openInvoice()">Open invoice</button>
        </ng-template>
        <ng-template #contactItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ contact: 1 }">Record contact attempt</a>
        </ng-template>
        <ng-template #creditItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ credit: 1 }">Apply credit</a>
        </ng-template>
        <ng-template #sendItem>
          <button slMenuItem type="button" (click)="send()">{{ sendLabel() }}</button>
        </ng-template>
        <ng-template #editItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ edit: 1 }">Edit draft</a>
        </ng-template>
        <ng-template #creditMemoItem>
          <a slMenuItem [routerLink]="newCreditMemoRoute" [queryParams]="creditMemoParams()"
            >Issue credit memo</a
          >
        </ng-template>
        <ng-template #disputeItem>
          <button slMenuItem type="button" (click)="disputeOpen.set(true)">Mark disputed</button>
        </ng-template>
        <ng-template #resolveItem>
          <button slMenuItem type="button" (click)="resolve()">Resolve dispute</button>
        </ng-template>
        <ng-template #writeOffItem>
          <button slMenuItem type="button" (click)="writeOffOpen.set(true)">
            {{ writeOffLabel() }}
          </button>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (click)="store.load()">Refresh</button>
        </ng-template>
        <ng-template #voidItem>
          <button slMenuItem type="button" (click)="voidOpen.set(true)">Void</button>
        </ng-template>

        <app-reason-dialog
          [(open)]="disputeOpen"
          title="Mark this invoice disputed"
          description="It stays owed and keeps aging: a dispute does not pause the due date. The reason stays on the invoice until the dispute is resolved."
          label="What the customer disputes"
          note="Kept on the invoice and in the customer's activity."
          tone="warning"
          confirmLabel="Mark disputed"
          [busy]="store.busy() === 'dispute'"
          (confirm)="dispute($event)"
        />
        <app-reason-dialog
          [(open)]="voidOpen"
          title="Void this invoice"
          [description]="voidWords()"
          label="Why it is voided"
          note="Kept in the invoice's audit trail."
          confirmLabel="Void invoice"
          [busy]="store.busy() === 'void'"
          (confirm)="voidInvoice($event)"
        />
        <app-reason-dialog
          [(open)]="writeOffOpen"
          [title]="writeOffLabel()"
          [description]="writeOffWords()"
          label="Why the balance will not be collected"
          [note]="
            writeOffAsks()
              ? 'The approver reads it before deciding.'
              : 'Kept on the invoice and in the customer’s activity.'
          "
          [tone]="writeOffAsks() ? 'accent' : 'danger'"
          [confirmLabel]="writeOffAsks() ? 'Request approval' : 'Write off'"
          [busy]="store.busy() === 'writeOff'"
          (confirm)="writeOff($event)"
        />
        <app-reason-dialog
          [(open)]="rejectOpen"
          title="Reject this write-off"
          description="The invoice stays open and owed; the requester reads your reason."
          label="Why it is rejected"
          confirmLabel="Reject"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('reject', $event)"
        />
        <app-reason-dialog
          [(open)]="changesOpen"
          title="Ask for changes"
          description="The request goes back to the requester with what to change; the invoice stays open and owed."
          label="What to change"
          tone="warning"
          confirmLabel="Ask for changes"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('changes', $event)"
        />
      </div>
    }
  `,
})
export class InvoicePage {
  readonly store = inject(InvoiceStore);
  readonly edit = inject(InvoiceEditStore);
  readonly contact = inject(InvoiceContactStore);
  readonly credit = inject(InvoiceCreditStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);
  private readonly session = inject(SessionStore);

  readonly listRoute = INVOICES_ROUTE;
  readonly paymentRoute = NEW_PAYMENT_ROUTE;
  readonly newCreditMemoRoute = NEW_CREDIT_MEMO_ROUTE;
  readonly phone = phoneSignal();
  readonly channels = CONTACT_CHANNELS;
  readonly figureLabels = ['Total', 'Outstanding', 'Paid and credited', 'Due'];

  readonly disputeOpen = signal(false);
  readonly voidOpen = signal(false);
  readonly writeOffOpen = signal(false);
  readonly rejectOpen = signal(false);
  readonly changesOpen = signal(false);
  readonly chosenView = signal<View>('lines');

  readonly detail = this.store.detail;
  readonly invoice = this.store.invoice;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Each form is a query parameter, so the back gesture closes it and stays on the invoice (FM-12). */
  readonly editing = computed(
    () => this.queryParams().get('edit') === '1' && this.store.commands().includes('edit'),
  );
  readonly contacting = computed(
    () => this.queryParams().get('contact') === '1' && this.store.commands().includes('contact'),
  );
  readonly crediting = computed(
    () => this.queryParams().get('credit') === '1' && this.store.commands().includes('credit'),
  );

  /** A form written in a tab holds the tab open. */
  readonly view = computed<View>(() =>
    this.editing()
      ? 'details'
      : this.contacting()
        ? 'collection'
        : this.crediting()
          ? 'payments'
          : this.chosenView(),
  );

  /**
   * The header holds the commands. The two that add to a tab stand there only
   * while their tab is open (RP-05), and a command leaves while its form is open.
   */
  readonly headerCommands = computed(() =>
    this.store.commands().filter((command) => {
      if (command === 'contact') return this.view() === 'collection' && !this.contacting();
      if (command === 'credit') return this.view() === 'payments' && !this.crediting();
      if (command === 'edit') return !this.editing();
      return true;
    }),
  );

  readonly title = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return 'Invoice';
    return invoice.invoiceNumber ?? 'Draft invoice';
  });

  readonly statusWord = computed(() => {
    const invoice = this.invoice();
    return invoice ? INVOICE_STATUS_LABEL[invoice.displayStatus] : '';
  });
  readonly statusTone = computed(() => {
    const invoice = this.invoice();
    return invoice ? INVOICE_STATUS_TONE[invoice.displayStatus] : 'secondary';
  });

  readonly subheading = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return '';
    return [
      invoice.customerName,
      invoice.orderNumber,
      PAYMENT_TERMS_LABEL[invoice.paymentTermsCode],
    ]
      .filter(Boolean)
      .join(' · ');
  });

  readonly steps = computed(() => {
    const invoice = this.invoice();
    return invoice === null ? [] : invoiceSteps(invoice, this.store.today());
  });

  readonly stop = computed(() => {
    const invoice = this.invoice();
    return invoice === null ? null : invoiceStop(invoice);
  });

  /**
   * The sentence, and after it the authority a write-off of the current
   * balance needs, for a reader who may write off: said before the control is
   * pressed, in US dollars whatever the invoice is written in (FM-11, FM-13).
   */
  readonly sentence = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return '';
    const base = invoiceSentence(invoice, this.store.today(), this.store.approval());
    const rule = this.store.writeOff();
    if (rule === null || !this.canWriteOff() || this.store.pendingApproval()) return base;
    return `${base} ${rule.words}`;
  });

  /** The sentence's lines, reserved while the invoice is read and kept once it has loaded. */
  readonly sentenceLines = computed(() => (this.phone() ? 6 : 3));
  readonly stepLines = computed(() => (this.phone() ? 3 : 2));

  readonly canWriteOff = computed(
    () => this.store.writeOff() !== null && this.can('invoices.write_off'),
  );

  readonly writeOffAsks = computed(() => this.store.writeOff()?.asksApproval ?? false);
  readonly writeOffLabel = computed(() =>
    this.writeOffAsks() ? 'Request write-off approval' : 'Write off',
  );

  readonly writeOffWords = computed(() => {
    const invoice = this.invoice();
    const rule = this.store.writeOff();
    if (invoice === null || rule === null) return '';
    const effect = `The whole remaining balance, ${formatMoney(invoice.outstanding)}, is written off and leaves ${invoice.customerName}'s receivables; it stays in invoiced revenue. A partial write-off is not offered.`;
    return rule.asksApproval
      ? `${rule.words} Your request goes to the finance controller: the invoice stays open and owed until they decide, and their approval writes it off. ${effect}`
      : `${rule.words} ${effect}`;
  });

  readonly voidWords = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return '';
    return `Voiding takes ${formatMoney(invoice.outstanding)} out of ${invoice.customerName}'s receivables and returns its shipped lines to the order, to be invoiced again. The invoice is kept, marked voided, and cannot be opened again.`;
  });

  /** One line on the card at every width, so the loading card's one-line comparison is its height (the ledger's stat-card row). */
  readonly totalWords = computed(() => {
    const lines = this.detail()?.lines.length ?? 0;
    const freight = (this.invoice()?.freight.minor ?? 0) > 0 ? ' + freight' : '';
    return `${lines} ${lines === 1 ? 'line' : 'lines'}${freight}`;
  });

  readonly sendLabel = computed(() => (this.invoice()?.sentAt ? 'Send again' : 'Send to customer'));

  readonly settlementWords = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return '';
    if (invoice.lifecycle === 'written_off')
      return `${formatMoney(invoice.writtenOffAmount)} written off`;
    if (invoice.lifecycle === 'voided') return 'voided, nothing owed';
    if (invoice.lifecycle === 'draft') return 'owed once opened';
    return `${SETTLEMENT_LABEL[invoice.settlement].toLowerCase()} · ${COLLECTION_LABEL[invoice.collectionState].toLowerCase()}`;
  });

  readonly paidWords = computed(() => {
    const detail = this.detail();
    if (detail === null) return '';
    const payments = detail.allocations.filter((row) => row.status === 'active').length;
    const credits = detail.creditApplications.filter((row) => row.status === 'active').length;
    return `${payments} ${payments === 1 ? 'payment' : 'payments'} · ${credits} ${credits === 1 ? 'credit' : 'credits'}`;
  });

  readonly dueWords = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return '';
    const aging = agingWords(invoice, this.store.today());
    if (aging) return aging;
    return PAYMENT_TERMS_LABEL[invoice.paymentTermsCode];
  });

  readonly settlements = computed<readonly Settlement[]>(() => {
    const detail = this.detail();
    if (detail === null) return [];
    const payments: Settlement[] = detail.allocations.map((row) => ({
      id: row.id,
      kind: 'payment',
      documentId: row.paymentId,
      number: row.paymentNumber,
      how: PAYMENT_METHOD_LABEL[row.method as keyof typeof PAYMENT_METHOD_LABEL] ?? 'Payment',
      date: row.receivedDate,
      amount: row.amount,
      active: row.status === 'active',
    }));
    const credits: Settlement[] = detail.creditApplications.map((row) => ({
      id: row.id,
      kind: 'credit',
      documentId: row.creditMemoId,
      number: row.creditMemoNumber,
      how: 'Credit memo',
      date: row.createdAt.slice(0, 10),
      amount: row.amount,
      active: row.status === 'active',
    }));
    return [...payments, ...credits].sort((a, b) => a.date.localeCompare(b.date));
  });

  readonly hasReversed = computed(() => this.settlements().some((row) => !row.active));

  readonly lineTotal = computed<Money>(() => {
    const invoice = this.invoice();
    return invoice
      ? { currency: invoice.currency, minor: invoice.subtotal.minor + invoice.taxTotal.minor }
      : { currency: 'USD', minor: 0 };
  });

  readonly currencyCode = computed(() => this.invoice()?.currency ?? 'USD');

  readonly paymentParams = computed(() => {
    const invoice = this.invoice();
    return invoice ? { customer: invoice.customerId, invoice: invoice.id } : {};
  });
  readonly creditMemoParams = this.paymentParams;

  /** What the state allows and the reader does not hold, said once with who does (RP-09, PM-02). */
  readonly permissionNote = computed(() => {
    const invoice = this.invoice();
    if (invoice === null) return '';
    const notes: string[] = [];
    const owes = invoice.lifecycle === 'open' && invoice.outstanding.minor > 0;
    if (invoice.lifecycle === 'draft' && !this.can('invoices.open'))
      notes.push(`It is opened by holders of invoices.open — ${FINANCE_HOLDERS['invoices.open']}.`);
    if (owes && !this.can('payments.record'))
      notes.push(
        `Payments against it are recorded by holders of payments.record — ${FINANCE_HOLDERS['payments.record']}.`,
      );
    if (owes && invoice.invoiceNumber && !this.store.canWriteNote())
      notes.push(
        this.can('notes.create')
          ? 'Contact attempts on this account are recorded by its own representative, the sales manager or finance: your notes are for the accounts you own.'
          : `Contact attempts are recorded by holders of notes.create — ${FINANCE_HOLDERS['notes.create']}.`,
      );
    if (owes && !this.can('invoices.write_off'))
      notes.push(
        `Its balance is written off by holders of invoices.write_off — ${FINANCE_HOLDERS['invoices.write_off']}.`,
      );
    if (invoice.lifecycle === 'open' && this.store.hasAllocations() && this.can('invoices.void'))
      notes.push(
        'It cannot be voided while a payment or a credit is applied to it: reverse the payment, or write the balance off.',
      );
    return notes.join(' ');
  });

  readonly missingStatus = computed<'not-found' | 'error'>(() =>
    this.store.error()?.code === 'NOT_FOUND' ? 'not-found' : 'error',
  );
  readonly missingTitle = computed(() =>
    this.missingStatus() === 'not-found'
      ? 'This invoice does not exist'
      : 'The invoice could not be loaded',
  );
  readonly missingWords = computed(() =>
    this.missingStatus() === 'not-found'
      ? 'Nothing in Nexora carries this address. It may have been mistyped.'
      : 'Nothing was changed. Try again in a moment.',
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.chosenView.set('lines');
      this.edit.cancel();
      this.contact.reset();
      this.credit.reset();
      void this.store.open(id);
    });
    effect(() => {
      if (!this.editing() || this.invoice() === null) return;
      untracked(() => this.edit.start());
    });
    effect(() => {
      if (!this.crediting() || this.store.openCredits().length === 0) return;
      untracked(() => this.credit.start());
    });
  }

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  setView(value: string | undefined): void {
    if (value === 'lines' || value === 'payments' || value === 'collection' || value === 'details')
      this.chosenView.set(value);
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

  quantity(value: string): string {
    return formatQuantity(value);
  }

  terms(code: keyof typeof PAYMENT_TERMS_LABEL): string {
    return PAYMENT_TERMS_LABEL[code];
  }

  lineTitle(line: { skuCode?: string; description: string }): string {
    return line.skuCode ? `${line.skuCode} · ${line.description}` : line.description;
  }

  documentLink(row: Settlement): readonly string[] | null {
    if (row.kind === 'payment')
      return this.store.canSeePayments() ? [PAYMENTS_ROUTE, row.documentId] : null;
    return this.store.canSeeCreditMemos() ? [CREDIT_MEMOS_ROUTE, row.documentId] : null;
  }

  attemptTitle(attempt: { channel: string; authorName: string | null }): string {
    return attempt.authorName ? `${attempt.channel} · ${attempt.authorName}` : attempt.channel;
  }

  contactWords(): string {
    const invoice = this.invoice();
    const id = invoice?.billingContactId;
    if (!id) return 'None named';
    const contact = this.store.customer()?.contacts.find((row) => row.id === id);
    if (!contact) return 'A contact of the account';
    return [contact.displayName, contact.email].filter(Boolean).join(' · ');
  }

  addressLines(): string[] {
    const address = this.invoice()?.billingAddress;
    if (!address) return [];
    return [
      address.name,
      address.line1,
      address.line2,
      `${address.city}, ${address.region} ${address.postalCode}`,
      address.countryCode,
    ].filter((line): line is string => Boolean(line));
  }

  axesWords(): string {
    const invoice = this.invoice();
    if (invoice === null) return '';
    return `${LIFECYCLE_LABEL[invoice.lifecycle]} · ${SETTLEMENT_LABEL[invoice.settlement]} · ${COLLECTION_LABEL[invoice.collectionState]}`;
  }

  currencyWords(): string {
    const invoice = this.invoice();
    if (invoice === null) return '';
    if (invoice.currency === 'USD') return 'USD';
    const rate = Number(invoice.fxRateToUsd ?? '0');
    return rate > 0
      ? `${invoice.currency}, at ${rate.toFixed(4)} US$ each${invoice.lifecycle === 'draft' ? ' until it is opened' : ', fixed when it was opened'}`
      : invoice.currency;
  }

  noSettlementWords(): string {
    const invoice = this.invoice();
    if (invoice === null) return '';
    if (invoice.lifecycle === 'draft') return 'A draft receives nothing until it is opened.';
    if (invoice.lifecycle !== 'open') return 'Nothing was applied before it closed.';
    return 'A payment allocated to it, or a credit memo applied to it, is listed here.';
  }

  noAttemptWords(): string {
    const invoice = this.invoice();
    if (invoice === null) return '';
    if (invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0)
      return 'Nothing is owed on it to collect.';
    return this.store.commands().includes('contact')
      ? 'Record contact attempt, above, keeps what was said and when.'
      : `Contact attempts are recorded by holders of notes.create — ${FINANCE_HOLDERS['notes.create']}.`;
  }

  editError(name: string): string | null {
    return this.editErrors()[name]?.[0] ?? null;
  }

  readonly editErrors = computed(() => {
    const errors = { ...this.edit.errors() } as Record<string, readonly string[]>;
    const due = this.edit.dueDateError();
    if (due) errors['dueDate'] = [due];
    return errors;
  });

  contactError(name: string): string | null {
    return this.contact.errors()[name]?.[0] ?? null;
  }

  creditError(): string | null {
    return this.credit.errors()['amountMinor']?.[0] ?? null;
  }

  setChannel(value: unknown): void {
    if (typeof value === 'string' && (CONTACT_CHANNELS as readonly string[]).includes(value))
      this.contact.channel.set(value as ContactChannel);
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

  advice(kind: Parameters<typeof financeAdvice>[0]) {
    return financeAdvice(kind);
  }

  async openInvoice(): Promise<void> {
    if (await this.store.openInvoice())
      this.toasts.show({
        title: `Opened as ${this.invoice()?.invoiceNumber ?? 'an invoice'}`,
        description: 'It now counts in the customer’s receivables.',
        tone: 'success',
      });
  }

  async send(): Promise<void> {
    if (await this.store.send())
      this.toasts.show({
        title: `Sent to ${this.invoice()?.customerName ?? 'the customer'}`,
        tone: 'success',
      });
  }

  async resolve(): Promise<void> {
    if (await this.store.resolveDispute())
      this.toasts.show({
        title: 'Dispute resolved',
        description: 'The invoice is back in collection.',
        tone: 'success',
      });
  }

  async dispute(reason: string): Promise<void> {
    const ok = await this.store.dispute(reason);
    this.disputeOpen.set(false);
    if (ok) this.toasts.show({ title: 'Marked disputed', tone: 'success' });
  }

  async voidInvoice(reason: string): Promise<void> {
    const ok = await this.store.void(reason);
    this.voidOpen.set(false);
    if (ok) this.toasts.show({ title: 'Invoice voided', tone: 'success' });
  }

  async writeOff(reason: string): Promise<void> {
    const asks = this.writeOffAsks();
    const ok = await this.store.requestWriteOff(reason);
    this.writeOffOpen.set(false);
    if (ok)
      this.toasts.show(
        asks
          ? {
              title: 'Write-off approval requested',
              description: 'The finance controller decides it.',
              tone: 'success',
            }
          : { title: 'Balance written off', tone: 'success' },
      );
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
            ? 'Approved: the balance is written off'
            : decision === 'reject'
              ? 'Write-off rejected'
              : 'Changes asked for',
        tone: 'success',
      });
  }

  save(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeEdit());
  }

  async applyMine(): Promise<void> {
    if (await this.edit.applyMine()) this.leave('Draft saved');
  }

  private async writeEdit(): Promise<void> {
    if (await this.edit.save()) this.leave('Draft saved');
  }

  recordContact(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(
      this.contact.save().then((ok) => {
        if (ok) this.leave('Contact attempt recorded', 'collection');
      }),
    );
  }

  applyCredit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(
      this.credit.apply().then((ok) => {
        if (ok) this.leave('Credit applied', 'payments');
      }),
    );
  }

  /** A form saved leaves the history as it came, and the reader stays on the tab it was written in. */
  private leave(title: string, view?: View): void {
    if (view) this.chosenView.set(view);
    this.toasts.show({ title, tone: 'success' });
    leaveForm(this.router, this.route, this.location, {});
  }
}
