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
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
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
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { InvoiceListItem, Money, PaymentMethod } from '@slotted/demo-nexora-backend';

import { formatDate, formatDateTime, formatMoney } from '../../core/catalog/catalog.model';
import { CreditMemoStore, refundMethods } from '../../core/finance/credit-memo.store';
import {
  CREDIT_MEMO_LIFECYCLE_LABEL,
  CREDIT_MEMO_LIFECYCLE_TONE,
  CREDIT_MEMO_REASON_LABEL,
  CREDIT_MEMOS_ROUTE,
  FINANCE_HOLDERS,
  financeAdvice,
  INVOICES_ROUTE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from '../../core/finance/finance.model';
import { toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { ConfirmDialog } from '../inventory/confirm-dialog';
import { leaveForm } from '../inventory/leave-form';
import { RecordProgress, type ProgressStep } from '../record-progress/record-progress';

type View = 'applications' | 'refunds' | 'details';

/**
 * One credit memo (§66.11) and the refunds taken from it (§66.12): where it
 * stands (RP-06), what it was applied to and refunded as, and the commands its
 * state allows the reader (RP-09). The application and the refund are forms
 * written in their own tabs (FM-07), each a query parameter the back gesture
 * closes (FM-12), and each states the backend's limit as the reader types
 * (FM-11). A memo lives under Invoices: its way back is the credit memos list.
 */
@Component({
  selector: 'app-credit-memo-page',
  imports: [
    ConfirmDialog,
    NgTemplateOutlet,
    RecordProgress,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCurrencyField,
    SlCurrencyFieldInput,
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
    SlTextarea,
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
    /* On a finger a record's link in a table row is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
    /* The steps' shape while the memo is read: three cells, as the loaded element draws them. */
    .steps-shape {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
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
  `,
  template: `
    @if (store.error()) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="listRoute">Credit memos</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Credit memo</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="missingStatus()"
            reach="section"
            data-testid="credit-memo-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>{{ missingTitle() }}</h2>
              <p slResultStateDescription>{{ store.error()?.message }}</p>
            </div>
            <div slResultStateActions>
              @if (missingStatus() === 'error') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute"
                >Back to credit memos</a
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
              <a slPageHeaderBack [routerLink]="listRoute">Credit memos</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ memo()?.creditMemoNumber ?? 'Credit memo' }}</h1>
                @if (memo(); as m) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()"
                      ><span slTagBody>{{ statusWord() }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every memo carries its state: the mark's own box is kept, so the title row keeps its height. -->
                  <span slPageHeaderMarks>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="3rem"></span></span
                    ></span>
                  </span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (headerCommands().length > 0) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Credit memo actions" overflow="menu">
                    @if (headerCommands().includes('open')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="openItem">
                        <button
                          slButton
                          type="button"
                          data-testid="open-memo"
                          [loading]="store.busy() === 'open'"
                          [messages]="{ loading: 'Opening' }"
                          (click)="openMemo()"
                        >
                          Open the memo
                        </button>
                      </div>
                    }
                    @if (headerCommands().includes('apply')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="applyItem">
                        <a
                          slButtonLink
                          data-testid="apply"
                          [routerLink]="[]"
                          [queryParams]="{ apply: 1 }"
                          >Apply to an invoice</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('refund')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="refundItem">
                        <a
                          slButtonLink
                          variant="outline"
                          tone="secondary"
                          data-testid="refund"
                          [routerLink]="[]"
                          [queryParams]="{ refund: 1 }"
                          >Refund</a
                        >
                      </div>
                    }
                    @if (headerCommands().includes('void')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="voidItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="void-memo"
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
              <div slTabList aria-label="Credit memo sections">
                <div slTab value="applications">
                  Applied{{ memo() ? ' ' + store.activeApplications().length : '' }}
                </div>
                <div slTab value="refunds">
                  Refunds{{ memo() ? ' ' + store.postedRefunds().length : '' }}
                </div>
                <div slTab value="details">Details</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="credit-memo-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (memo(); as m) {
              <div
                slGrid
                [columns]="phone() ? 2 : 4"
                minItemWidth="xs"
                [gap]="4"
                data-testid="credit-memo-figures"
              >
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Total</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="memo-total">{{ money(m.total) }}</span>
                    <p slStatCardComparison>tax {{ money(m.taxTotal) }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Applied</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="memo-applied">{{
                      minor(store.appliedMinor())
                    }}</span>
                    <p slStatCardComparison>
                      {{ count(store.activeApplications().length, 'invoice') }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Refunded</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="memo-refunded">{{
                      minor(store.refundedMinor())
                    }}</span>
                    <p slStatCardComparison>{{ count(store.postedRefunds().length, 'refund') }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Unapplied</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="memo-unapplied">{{
                      money(m.unappliedAmount)
                    }}</span>
                    <p slStatCardComparison>{{ unappliedWords() }}</p>
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
                    [stopped]="m.lifecycle === 'voided' ? 'danger' : null"
                  />
                </div>
              </section>
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the credit memo' }" [loading]="true">
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
                          @for (step of [1, 2, 3]; track step) {
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
              @case ('applications') {
                @if (applying()) {
                  <ng-container *ngTemplateOutlet="applyForm" />
                } @else {
                  <ng-container *ngTemplateOutlet="applicationsTable" />
                }
              }
              @case ('refunds') {
                @if (refunding()) {
                  <ng-container *ngTemplateOutlet="refundForm" />
                } @else {
                  <ng-container *ngTemplateOutlet="refundsTable" />
                }
              }
              @case ('details') {
                <ng-container *ngTemplateOutlet="details" />
              }
            }
            @if (permissionNote(); as note) {
              <span slText size="sm" tone="muted" data-testid="credit-memo-permission">{{
                note
              }}</span>
            }
          </div>
        </div>

        <ng-template #applicationsTable>
          <div
            slTable
            variant="framed"
            [columns]="3"
            [layout]="phone() ? 'fixed' : 'auto'"
            data-testid="memo-applications"
          >
            <div slTableContent>
              <caption slTableCaption>
                Invoices this credit was applied to
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Invoice</th>
                  <th slTableColumnHeader>Applied on</th>
                  <th slTableColumnHeader align="end" numeric>Amount</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @if (memo() === null) {
                  <tr slTableRow>
                    <th slTableRowHeader><span slSkeleton shape="text" inlineSize="60%"></span></th>
                    <td slTableCell><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                    <td slTableCell align="end">
                      <span slSkeleton shape="text" inlineSize="4rem"></span>
                    </td>
                  </tr>
                } @else if (store.activeApplications().length === 0) {
                  <tr slTableRow>
                    <td slTableEmpty>
                      <div slResultState status="empty" reach="section">
                        <div slResultStateContent>
                          <h3 slResultStateTitle>Not applied to an invoice</h3>
                          <p slResultStateDescription>{{ noApplicationWords() }}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (application of store.activeApplications(); track application.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        <a
                          slLink
                          class="cell-text"
                          variant="neutral"
                          underline="hover"
                          [routerLink]="[invoicesRoute, application.invoiceId]"
                        >
                          {{ application.invoiceNumber ?? application.invoiceId }}
                        </a>
                      </th>
                      <td slTableCell>{{ dateTime(application.createdAt) }}</td>
                      <td slTableCell align="end" numeric>{{ money(application.amount) }}</td>
                    </tr>
                  }
                }
              </tbody>
              @if (memo(); as m) {
                @if (store.activeApplications().length > 0) {
                  <tfoot slTableSummary>
                    <tr slTableRow>
                      <th slTableRowHeader>
                        Applied, {{ count(store.activeApplications().length, 'invoice') }}
                      </th>
                      <td slTableCell></td>
                      <td slTableCell align="end" numeric data-testid="applications-total">
                        {{ minor(store.appliedMinor()) }}
                      </td>
                    </tr>
                  </tfoot>
                }
              }
            </div>
          </div>
        </ng-template>

        <ng-template #refundsTable>
          <div
            slTable
            variant="framed"
            [columns]="phone() ? 2 : 4"
            [layout]="phone() ? 'fixed' : 'auto'"
            data-testid="memo-refunds"
          >
            <div slTableContent>
              <caption slTableCaption>
                Refunds paid out of this credit
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Refund</th>
                  @if (!phone()) {
                    <th slTableColumnHeader>Method</th>
                    <th slTableColumnHeader>Reason</th>
                  }
                  <th slTableColumnHeader align="end" numeric>Amount</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @if (memo() === null) {
                  <tr slTableRow>
                    <th slTableRowHeader><span slSkeleton shape="text" inlineSize="60%"></span></th>
                    @if (!phone()) {
                      <td slTableCell><span slSkeleton shape="text" inlineSize="4rem"></span></td>
                      <td slTableCell><span slSkeleton shape="text" inlineSize="8rem"></span></td>
                    }
                    <td slTableCell align="end">
                      <span slSkeleton shape="text" inlineSize="4rem"></span>
                    </td>
                  </tr>
                } @else if (store.postedRefunds().length === 0) {
                  <tr slTableRow>
                    <td slTableEmpty>
                      <div slResultState status="empty" reach="section">
                        <div slResultStateContent>
                          <h3 slResultStateTitle>Nothing refunded</h3>
                          <p slResultStateDescription>
                            A refund pays the customer back from the credit the memo still holds.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (refund of store.postedRefunds(); track refund.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        <span
                          class="cell-text"
                          [title]="
                            refund.refundNumber +
                            (refund.postedAt ? ' · ' + dateTime(refund.postedAt) : '')
                          "
                          >{{ refund.refundNumber }}</span
                        >
                      </th>
                      @if (!phone()) {
                        <td slTableCell>
                          {{ method(refund.method) }} · {{ refundStatus(refund.status) }}
                        </td>
                        <td slTableCell>
                          <span class="cell-text" [title]="refund.reason">{{ refund.reason }}</span>
                        </td>
                      }
                      <td slTableCell align="end" numeric>{{ money(refund.amount) }}</td>
                    </tr>
                  }
                }
              </tbody>
              @if (store.postedRefunds().length > 0) {
                <tfoot slTableSummary>
                  <tr slTableRow>
                    <th slTableRowHeader>
                      Refunded, {{ count(store.postedRefunds().length, 'refund') }}
                    </th>
                    @if (!phone()) {
                      <td slTableCell></td>
                      <td slTableCell></td>
                    }
                    <td slTableCell align="end" numeric data-testid="refunds-total">
                      {{ minor(store.refundedMinor()) }}
                    </td>
                  </tr>
                </tfoot>
              }
            </div>
          </div>
        </ng-template>

        <ng-template #details>
          @if (memo(); as m) {
            <div slStack [gap]="6">
              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>The memo</h2></div>
                </div>
                <div slSectionBody>
                  <div slDescriptionList layout="row" data-testid="credit-memo-terms">
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Customer</dt>
                      <dd slDescriptionListDescription>
                        <a slLink [routerLink]="['/crm/customers', m.customerId]">{{
                          m.customerName
                        }}</a>
                      </dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Reason</dt>
                      <dd slDescriptionListDescription>{{ reason() }}</dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Issued</dt>
                      <dd slDescriptionListDescription>{{ date(m.issueDate) }}</dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Currency</dt>
                      <dd slDescriptionListDescription>{{ m.currency }}</dd>
                    </div>
                    <div slDescriptionListItem>
                      <dt slDescriptionListTerm>Corrects</dt>
                      <dd slDescriptionListDescription>
                        @if (m.sourceInvoiceId) {
                          <a slLink [routerLink]="[invoicesRoute, m.sourceInvoiceId]">{{
                            m.sourceInvoiceNumber ?? m.sourceInvoiceId
                          }}</a>
                        } @else if (m.sourceReturnNumber) {
                          Return {{ m.sourceReturnNumber }}
                        } @else {
                          No invoice named
                        }
                      </dd>
                    </div>
                  </div>
                </div>
              </section>
              <div
                slTable
                variant="framed"
                [columns]="3"
                [layout]="phone() ? 'fixed' : 'auto'"
                data-testid="credit-memo-lines"
              >
                <div slTableContent>
                  <caption slTableCaption>
                    What the credit is for
                  </caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>Line</th>
                      <th slTableColumnHeader align="end" numeric>Tax</th>
                      <th slTableColumnHeader align="end" numeric>Amount</th>
                    </tr>
                  </thead>
                  <tbody slTableBody>
                    @for (line of store.detail()?.lines ?? []; track line.id) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span class="cell-text" [title]="line.description">{{
                            line.description
                          }}</span>
                        </th>
                        <td slTableCell align="end" numeric>{{ money(line.taxAmount) }}</td>
                        <td slTableCell align="end" numeric>{{ money(line.amount) }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot slTableSummary>
                    <tr slTableRow>
                      <th slTableRowHeader>Total, amount and tax</th>
                      <td slTableCell align="end" numeric>{{ money(m.taxTotal) }}</td>
                      <td slTableCell align="end" numeric data-testid="lines-total">
                        {{ money(m.total) }}
                      </td>
                    </tr>
                  </tfoot>
                </div>
              </div>
            </div>
          }
        </ng-template>

        <ng-template #applyForm>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>Apply the credit</h2>
                <p slSectionDescription>{{ applyDescription() }}</p>
              </div>
            </div>
            <div slSectionBody>
              <form
                slForm
                data-testid="apply-form"
                [messages]="{ summaryTitle: 'The credit was not applied' }"
                [errors]="applyErrors()"
                (errorsChange)="store.applyErrors.set($event.value)"
                [loading]="store.busy() === 'apply'"
                (formSubmit)="apply($event)"
              >
                <div slStack [gap]="5">
                  @if (store.invoices(); as invoices) {
                    @if (invoices.length === 0) {
                      <div slInlineMessage tone="secondary" data-testid="no-invoice">
                        <span slInlineMessageIcon></span>
                        {{ memo()?.customerName }} has no open invoice in
                        {{ memo()?.currency }} that still owes: the credit stays as credit, or is
                        refunded.
                      </div>
                    } @else {
                      <div slGrid [columns]="phone() ? 1 : 2" [gap]="5" minItemWidth="sm">
                        <div slField required [invalid]="!!applyError('invoiceId')">
                          <label slFieldLabel>Invoice</label>
                          <sl-select
                            name="invoiceId"
                            data-testid="apply-invoice"
                            placeholder="Choose the invoice"
                            [value]="store.applyInvoiceId()"
                            (valueChangeRequest)="store.chooseInvoice($any($event.value) ?? null)"
                          >
                            @for (invoice of invoices; track invoice.id) {
                              <sl-select-item [value]="invoice.id">{{
                                invoiceLabel(invoice)
                              }}</sl-select-item>
                            }
                          </sl-select>
                          @if (applyError('invoiceId'); as message) {
                            <p slFieldError>{{ message }}</p>
                          } @else {
                            <span slFieldDescription
                              >Open invoices of {{ memo()?.customerName }} in
                              {{ memo()?.currency }} that still owe.</span
                            >
                          }
                        </div>
                        <div slField required [invalid]="!!applyError('amountMinor')">
                          <label slFieldLabel>Amount ({{ memo()?.currency }})</label>
                          <div slCurrencyField>
                            <input
                              slCurrencyFieldInput
                              name="amountMinor"
                              data-testid="apply-amount"
                              [currency]="memo()!.currency"
                              [min]="0"
                              [value]="store.applyAmount()"
                              (valueChange)="store.applyAmount.set($event.value ?? null)"
                            />
                          </div>
                          @if (applyError('amountMinor'); as message) {
                            <p slFieldError data-testid="apply-amount-error">{{ message }}</p>
                          } @else {
                            <span slFieldDescription>{{ applyLimitWords() }}</span>
                          }
                        </div>
                      </div>
                      <span slText size="sm" tone="muted" data-testid="apply-outcome">{{
                        applyOutcome()
                      }}</span>
                    }
                  } @else {
                    <div
                      slSkeletonRegion
                      [messages]="{ label: 'Reading the customer’s open invoices' }"
                      [loading]="true"
                    >
                      <div slGrid [columns]="phone() ? 1 : 2" [gap]="5" minItemWidth="sm">
                        <span slSkeletonText [lines]="2" lastLineSize="60%"></span>
                        <span slSkeletonText [lines]="2" lastLineSize="40%"></span>
                      </div>
                    </div>
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
                  @if ((store.invoices()?.length ?? 0) > 0) {
                    <button
                      slButton
                      type="submit"
                      data-testid="apply-submit"
                      [loading]="store.busy() === 'apply'"
                      [messages]="{ loading: 'Applying' }"
                    >
                      Apply credit
                    </button>
                  }
                </div>
              </form>
            </div>
          </section>
        </ng-template>

        <ng-template #refundForm>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>Refund the credit</h2>
                <p slSectionDescription>{{ refundDescription() }}</p>
              </div>
            </div>
            <div slSectionBody>
              <form
                slForm
                data-testid="refund-form"
                [messages]="{ summaryTitle: 'Nothing was refunded' }"
                [errors]="refundErrors()"
                (errorsChange)="store.refundErrors.set($event.value)"
                [loading]="store.busy() === 'refund'"
                (formSubmit)="refund($event)"
              >
                <div slStack [gap]="5">
                  <div slGrid [columns]="phone() ? 1 : 2" [gap]="5" minItemWidth="sm">
                    <div slField required [invalid]="!!refundError('amountMinor')">
                      <label slFieldLabel>Amount ({{ memo()?.currency }})</label>
                      <div slCurrencyField>
                        <input
                          slCurrencyFieldInput
                          name="amountMinor"
                          data-testid="refund-amount"
                          [currency]="memo()!.currency"
                          [min]="0"
                          [value]="store.refundAmount()"
                          (valueChange)="store.refundAmount.set($event.value ?? null)"
                        />
                      </div>
                      @if (refundError('amountMinor'); as message) {
                        <p slFieldError data-testid="refund-amount-error">{{ message }}</p>
                      } @else {
                        <span slFieldDescription
                          >At most {{ money(memo()!.unappliedAmount) }}, the credit the memo still
                          holds.</span
                        >
                      }
                    </div>
                    <div slField required [invalid]="!!refundError('method')">
                      <label slFieldLabel>Paid back by</label>
                      <sl-select
                        name="method"
                        data-testid="refund-method"
                        [value]="store.refundMethod()"
                        (valueChangeRequest)="store.refundMethod.set($any($event.value) ?? null)"
                      >
                        @for (method of methods(); track method) {
                          <sl-select-item [value]="method">{{ methodWord(method) }}</sl-select-item>
                        }
                      </sl-select>
                      @if (refundError('method'); as message) {
                        <p slFieldError>{{ message }}</p>
                      }
                    </div>
                  </div>
                  <div slField required [invalid]="!!refundError('reason')">
                    <label slFieldLabel>Why it is refunded</label>
                    <textarea
                      slTextarea
                      name="reason"
                      data-testid="refund-reason"
                      [rows]="2"
                      [value]="store.refundReason()"
                      (valueChange)="store.refundReason.set($event.value)"
                      placeholder="The customer has no invoice left to apply it to."
                    ></textarea>
                    @if (refundError('reason'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription
                        >Kept on the refund and on the customer’s activity.</span
                      >
                    }
                  </div>
                  <span slText size="sm" tone="muted" data-testid="refund-outcome">{{
                    refundOutcome()
                  }}</span>
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
                    data-testid="refund-submit"
                    [loading]="store.busy() === 'refund'"
                    [messages]="{ loading: 'Refunding' }"
                  >
                    Post the refund
                  </button>
                </div>
              </form>
            </div>
          </section>
        </ng-template>

        <ng-template #openItem>
          <button slMenuItem type="button" (click)="openMemo()">Open the memo</button>
        </ng-template>
        <ng-template #applyItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ apply: 1 }">Apply to an invoice</a>
        </ng-template>
        <ng-template #refundItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ refund: 1 }">Refund</a>
        </ng-template>
        <ng-template #voidItem>
          <button slMenuItem type="button" (click)="voidOpen.set(true)">Void</button>
        </ng-template>

        <app-confirm-dialog
          [(open)]="voidOpen"
          title="Void this credit memo"
          [description]="voidWords()"
          confirmLabel="Void the memo"
          keepLabel="Keep it"
          [busy]="store.busy() === 'void'"
          (confirm)="voidMemo()"
        />
      </div>
    }
  `,
})
export class CreditMemoPage {
  readonly store = inject(CreditMemoStore);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = CREDIT_MEMOS_ROUTE;
  readonly invoicesRoute = INVOICES_ROUTE;
  readonly phone = phoneSignal();
  readonly voidOpen = signal(false);
  readonly chosenView = signal<View>('applications');
  readonly figureLabels = ['Total', 'Applied', 'Refunded', 'Unapplied'];

  readonly memo = this.store.memo;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Each form is a query parameter, so the back gesture closes it and stays on the memo (FM-12). */
  readonly applying = computed(
    () => this.queryParams().get('apply') === '1' && this.store.commands().includes('apply'),
  );
  readonly refunding = computed(
    () => this.queryParams().get('refund') === '1' && this.store.commands().includes('refund'),
  );

  /** A form written in a tab holds that tab open. */
  readonly view = computed<View>(() =>
    this.applying() ? 'applications' : this.refunding() ? 'refunds' : this.chosenView(),
  );

  /** The command a form stands for leaves the header while the form is open. */
  readonly headerCommands = computed(() =>
    this.store
      .commands()
      .filter(
        (command) =>
          !(command === 'apply' && this.applying()) && !(command === 'refund' && this.refunding()),
      ),
  );

  /** The limits the backend applies, applied as the reader types, beside the backend's own answer (FM-11, FM-03). */
  readonly applyErrors = computed(() => ({
    ...this.store.applyErrors(),
    ...this.store.applyTyped(),
  }));
  readonly refundErrors = computed(() => ({
    ...this.store.refundErrors(),
    ...this.store.refundTyped(),
  }));

  readonly statusWord = computed(() => {
    const memo = this.memo();
    return memo ? CREDIT_MEMO_LIFECYCLE_LABEL[memo.lifecycle] : '';
  });
  readonly statusTone = computed(() => {
    const memo = this.memo();
    return memo ? CREDIT_MEMO_LIFECYCLE_TONE[memo.lifecycle] : 'secondary';
  });

  readonly subheading = computed(() => {
    const memo = this.memo();
    if (memo === null) return '';
    return `${memo.customerName} · ${CREDIT_MEMO_REASON_LABEL[memo.reason]} · issued ${formatDate(memo.issueDate)}`;
  });

  readonly reason = computed(() => {
    const memo = this.memo();
    return memo ? CREDIT_MEMO_REASON_LABEL[memo.reason] : '';
  });

  readonly sentenceLines = computed(() => (this.phone() ? 4 : 2));
  readonly stepLines = computed(() => (this.phone() ? 3 : 2));

  /** §66.11's cycle: drafted, opened, used — applied or refunded until nothing is left; a void stops it. */
  readonly steps = computed<readonly ProgressStep[]>(() => {
    const memo = this.memo();
    if (memo === null) return [];
    const voided = memo.lifecycle === 'voided';
    const opened = memo.lifecycle === 'open' || memo.lifecycle === 'fully_applied';
    const used = this.store.appliedMinor() + this.store.refundedMinor();
    const openedEver = opened || used > 0;
    const usedDetail =
      memo.lifecycle === 'fully_applied'
        ? 'Nothing left'
        : used > 0
          ? `${formatMoney({ currency: memo.currency, minor: used })} used`
          : undefined;
    return [
      {
        key: 'drafted',
        label: 'Drafted',
        state: voided && !openedEver ? 'stopped' : 'done',
        detail: voided && !openedEver ? 'Voided' : formatDate(memo.issueDate),
      },
      {
        key: 'opened',
        label: 'Opened',
        state: voided && openedEver ? 'stopped' : opened ? 'done' : voided ? 'todo' : 'current',
        ...(voided && openedEver
          ? { detail: 'Voided' }
          : opened
            ? { detail: 'Credit usable' }
            : {}),
      },
      {
        key: 'used',
        label: 'Applied or refunded',
        state:
          memo.lifecycle === 'fully_applied'
            ? 'done'
            : memo.lifecycle === 'open'
              ? 'current'
              : 'todo',
        ...(usedDetail ? { detail: usedDetail } : {}),
      },
    ];
  });

  /** What the memo waits on and what happens next (RP-06). */
  readonly sentence = computed(() => {
    const memo = this.memo();
    if (memo === null) return '';
    const total = formatMoney(memo.total);
    switch (memo.lifecycle) {
      case 'draft':
        return `A draft: it changes no invoice. Opening it makes its ${total} of credit usable — applied to an open invoice of ${memo.customerName} in ${memo.currency}, or refunded.`;
      case 'open':
        return memo.appliedAmount.minor === 0
          ? `Open: ${total} of credit waits to be applied to an open invoice of ${memo.customerName} in ${memo.currency}, or refunded.`
          : `Open: ${formatMoney(memo.unappliedAmount)} of the ${total} is still to use; what is applied has lowered what the invoices owe.`;
      case 'fully_applied':
        return `Fully used: the ${total} was applied to invoices or refunded, and the memo holds nothing more.`;
      default:
        return 'Voided before any of it was used: no invoice changed, and the memo cannot be opened again.';
    }
  });

  readonly unappliedWords = computed(() => {
    const memo = this.memo();
    if (memo === null) return '';
    if (memo.lifecycle === 'draft') return 'usable once opened';
    if (memo.lifecycle === 'voided') return 'withdrawn';
    return memo.unappliedAmount.minor > 0 ? 'still to use' : 'nothing left';
  });

  /** What the state allows and the reader does not hold, said once with who does (RP-09, PM-02). */
  readonly permissionNote = computed(() => {
    void this.session.session();
    const memo = this.memo();
    if (memo === null) return '';
    const can = (permission: string) => this.session.can(permission);
    const notes: string[] = [];
    const credit = memo.lifecycle === 'open' && memo.unappliedAmount.minor > 0;
    if ((memo.lifecycle === 'draft' || credit) && !can('credit_memos.open'))
      notes.push(
        `It is opened, applied and voided by holders of credit_memos.open — ${FINANCE_HOLDERS['credit_memos.open']}.`,
      );
    if (credit && !can('refunds.create'))
      notes.push(
        `It is refunded by holders of refunds.create — ${FINANCE_HOLDERS['refunds.create']}.`,
      );
    return notes.join(' ');
  });

  readonly noApplicationWords = computed(() => {
    const memo = this.memo();
    if (memo === null) return '';
    if (memo.lifecycle === 'draft') return 'A draft is applied once it is opened.';
    if (memo.lifecycle === 'voided') return 'A voided memo is applied to nothing.';
    return `Its credit goes to an open invoice of ${memo.customerName} in ${memo.currency}.`;
  });

  readonly applyDescription = computed(() => {
    const memo = this.memo();
    return memo
      ? `Lowers what the invoice owes by the amount applied. An application is never more than the ${formatMoney(memo.unappliedAmount)} the memo holds nor more than the invoice owes.`
      : '';
  });

  readonly applyLimitWords = computed(() => {
    const limit = this.store.applyLimitMinor();
    const memo = this.memo();
    if (limit === null || memo === null)
      return 'Choose the invoice: the form then says the most it can take.';
    return `At most ${formatMoney({ currency: memo.currency, minor: limit })}: the smaller of the credit left and what the invoice owes.`;
  });

  readonly applyOutcome = computed(() => {
    const memo = this.memo();
    const invoice = this.store.chosenInvoice();
    const amount = Math.round((this.store.applyAmount() ?? 0) * 100);
    const limit = this.store.applyLimitMinor();
    if (memo === null || invoice === null || limit === null || amount <= 0 || amount > limit)
      return '';
    const owes = invoice.outstanding.minor - amount;
    const keeps = memo.unappliedAmount.minor - amount;
    const cur = (minor: number) => formatMoney({ currency: memo.currency, minor });
    return `${invoice.invoiceNumber ?? 'The invoice'} will owe ${cur(owes)}${owes === 0 ? ' and be paid' : ''}; the memo will hold ${cur(keeps)}${keeps === 0 ? ' and be fully applied' : ''}.`;
  });

  readonly refundDescription = computed(() => {
    const memo = this.memo();
    return memo
      ? `Pays ${memo.customerName} back out of the credit the memo still holds, ${formatMoney(memo.unappliedAmount)}. The refund posts at once: Nexora connects to no payment processor.`
      : '';
  });

  readonly refundOutcome = computed(() => {
    const memo = this.memo();
    const amount = Math.round((this.store.refundAmount() ?? 0) * 100);
    if (memo === null || amount <= 0 || amount > memo.unappliedAmount.minor) return '';
    const keeps = memo.unappliedAmount.minor - amount;
    return `The memo will hold ${formatMoney({ currency: memo.currency, minor: keeps })}${keeps === 0 ? ' and be fully used' : ''}; no invoice changes.`;
  });

  readonly voidWords = computed(() => {
    const memo = this.memo();
    if (memo === null) return '';
    return memo.lifecycle === 'draft'
      ? `The draft's ${formatMoney(memo.total)} of credit is withdrawn before it was ever usable. The memo stays on record as voided and cannot be opened again.`
      : `The ${formatMoney(memo.total)} of credit is withdrawn: nothing was applied or refunded from it, so no invoice changes. The memo stays on record as voided and cannot be opened again.`;
  });

  readonly methods = computed(() => refundMethods(this.memo()?.currency ?? 'USD'));

  readonly missingStatus = computed<'not-found' | 'error'>(() =>
    this.store.error()?.code === 'NOT_FOUND' ? 'not-found' : 'error',
  );
  readonly missingTitle = computed(() =>
    this.missingStatus() === 'not-found'
      ? 'This credit memo does not exist'
      : 'The credit memo could not be loaded',
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.chosenView.set('applications');
      void this.store.open(id);
    });
    // The apply form reads the customer's open invoices when it opens; the refund starts on the whole credit.
    effect(() => {
      if (!this.applying()) return;
      untracked(() => {
        if (this.store.invoices() === null) void this.store.loadInvoices();
      });
    });
    effect(() => {
      if (!this.refunding()) return;
      untracked(() => this.store.startRefund());
    });
  }

  setView(value: string | undefined): void {
    if (value === 'applications' || value === 'refunds' || value === 'details')
      this.chosenView.set(value);
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  minor(value: number): string {
    return formatMoney({ currency: this.memo()?.currency ?? 'USD', minor: value });
  }

  count(n: number, word: string): string {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  method(value: PaymentMethod): string {
    return PAYMENT_METHOD_LABEL[value];
  }

  methodWord(value: PaymentMethod): string {
    return PAYMENT_METHOD_LABEL[value];
  }

  refundStatus(value: keyof typeof PAYMENT_STATUS_LABEL): string {
    return PAYMENT_STATUS_LABEL[value];
  }

  invoiceLabel(invoice: InvoiceListItem): string {
    return `${invoice.invoiceNumber ?? 'Draft'} · due ${formatDate(invoice.dueDate)} · owes ${formatMoney(invoice.outstanding)}`;
  }

  applyError(name: string): string | null {
    return this.applyErrors()[name]?.[0] ?? null;
  }

  refundError(name: string): string | null {
    return this.refundErrors()[name]?.[0] ?? null;
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof financeAdvice>[0]) {
    return financeAdvice(kind);
  }

  async openMemo(): Promise<void> {
    if (await this.store.openMemo())
      this.toasts.show({
        title: `${this.memo()?.creditMemoNumber ?? 'Credit memo'} opened`,
        description: 'Its credit can be applied or refunded now.',
        tone: 'success',
      });
  }

  async voidMemo(): Promise<void> {
    const ok = await this.store.voidMemo();
    this.voidOpen.set(false);
    if (ok) this.toasts.show({ title: 'Credit memo voided', tone: 'success' });
  }

  apply(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeApplication());
  }

  refund(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeRefund());
  }

  private async writeApplication(): Promise<void> {
    if (!(await this.store.apply())) return;
    this.toasts.show({ title: 'Credit applied', tone: 'success' });
    leaveForm(this.router, this.route, this.location, {});
  }

  private async writeRefund(): Promise<void> {
    if (!(await this.store.refund())) return;
    this.toasts.show({ title: 'Refund posted', tone: 'success' });
    leaveForm(this.router, this.route, this.location, {});
  }
}
