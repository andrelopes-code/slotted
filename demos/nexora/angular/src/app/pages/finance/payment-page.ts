import { Location } from '@angular/common';
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
import type { Money, PaymentMethod } from '@slotted/demo-nexora-backend';

import { formatDate, formatDateTime, formatMoney } from '../../core/catalog/catalog.model';
import {
  BANK_STATUS_LABEL,
  financeAdvice,
  FINANCE_HOLDERS,
  INVOICES_ROUTE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENTS_ROUTE,
  RECONCILIATION_ROUTE,
} from '../../core/finance/finance.model';
import { PaymentStore } from '../../core/finance/payment.store';
import { methodsFor } from '../../core/finance/record-payment.store';
import { toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { leaveForm } from '../inventory/leave-form';
import { ReasonDialog } from '../orders/reason-dialog';
import { AllocationLines } from './allocation-lines';

type View = 'allocations' | 'refunds' | 'details';

/**
 * One payment (§66.7–§66.10): what it brought, the invoices it went to, what
 * stays unapplied as the customer's credit, and the three commands a posted
 * payment allows — allocate what is left, refund it, or reverse the payment.
 * A command the state or the role does not allow is not drawn; the sentence
 * under the record says who holds it (RP-09, PM-02). The allocation and the
 * refund are written in their own tab, each a query parameter the back
 * gesture closes (FM-07, FM-12); the reversal says what it undoes before it
 * is confirmed.
 */
@Component({
  selector: 'app-payment-page',
  imports: [
    AllocationLines,
    ReasonDialog,
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
    /* The sentence's lines, reserved while the payment is read and kept once it has loaded, in the typography family's small text. */
    .sentence {
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
              <a slPageHeaderBack [routerLink]="listRoute">Payments</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Payment</h1></div>
            </div>
          </div>
        </header>
        <div slPageBody>
          <div
            slResultState
            [status]="missing() ? 'not-found' : 'error'"
            reach="section"
            data-testid="payment-missing"
          >
            <div slResultStateContent>
              <h2 slResultStateTitle>
                {{ missing() ? 'This payment does not exist' : 'The payment could not be loaded' }}
              </h2>
              <p slResultStateDescription>{{ store.error()?.message }}</p>
            </div>
            <div slResultStateActions>
              @if (!missing()) {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute"
                >Back to payments</a
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
              <a slPageHeaderBack [routerLink]="listRoute">Payments</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ payment()?.paymentNumber ?? 'Payment' }}</h1>
                @if (payment(); as p) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()"
                      ><span slTagBody>{{ statusWord() }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every payment carries its status: the skeleton covers a tag of the same form, so the row keeps its height. -->
                  <span slPageHeaderMarks
                    ><span slTag size="sm" tone="secondary"
                      ><span slTagBody
                        ><span slSkeleton shape="text" inlineSize="3rem"></span></span></span
                  ></span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (headerCommands().length > 0) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Payment actions" overflow="menu">
                    @if (headerCommands().includes('allocate')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="allocateItem">
                        <a
                          slButtonLink
                          data-testid="allocate"
                          [routerLink]="[]"
                          [queryParams]="{ allocate: 1 }"
                          >Allocate</a
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
                    @if (headerCommands().includes('reverse')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="reverseItem">
                        <button
                          slButton
                          variant="outline"
                          tone="danger"
                          type="button"
                          data-testid="reverse"
                          (click)="reverseOpen.set(true)"
                        >
                          Reverse
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
              <div slTabList aria-label="Payment sections">
                <div slTab value="allocations">
                  Allocations{{ payment() ? ' ' + allocations().length : '' }}
                </div>
                <div slTab value="refunds">
                  Refunds{{ payment() ? ' ' + store.refunds().length : '' }}
                </div>
                <div slTab value="details">Details</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="payment-failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (payment(); as p) {
              <div
                slGrid
                [columns]="phone() ? 2 : 4"
                minItemWidth="xs"
                [gap]="4"
                data-testid="payment-figures"
              >
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Amount</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="payment-amount">{{ money(p.amount) }}</span>
                    <p slStatCardComparison>{{ method(p.method) }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Allocated</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="payment-allocated">{{
                      money(p.allocatedAmount)
                    }}</span>
                    <p slStatCardComparison>
                      to {{ activeCount() }} {{ activeCount() === 1 ? 'invoice' : 'invoices' }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Unapplied</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue data-testid="payment-unapplied">{{
                      money(p.unappliedAmount)
                    }}</span>
                    <p slStatCardComparison>
                      {{ p.unappliedAmount.minor > 0 ? 'the customer’s credit' : 'nothing left' }}
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Received</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ date(p.receivedDate) }}</span>
                    <p slStatCardComparison>{{ p.reference || 'no reference' }}</p>
                  </div>
                </div>
              </div>
              <span
                slText
                size="sm"
                tone="muted"
                class="sentence"
                [style.--_lines]="sentenceLines()"
                data-testid="payment-sentence"
                >{{ sentence() }}</span
              >
            } @else {
              <div slSkeletonRegion [messages]="{ label: 'Reading the payment' }" [loading]="true">
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
                            <span slSkeletonText [lines]="1" lastLineSize="60%"></span>
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                  <span class="sentence" [style.--_lines]="sentenceLines()">
                    <span slSkeletonText [lines]="1" lastLineSize="80%"></span>
                  </span>
                </div>
              </div>
            }

            @switch (view()) {
              @case ('allocations') {
                @if (allocating()) {
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle>
                        <h2 slSectionHeading>Allocate {{ money(payment()!.unappliedAmount) }}</h2>
                        <p slSectionDescription>
                          To the customer’s open invoices in {{ payment()!.amount.currency }}. Each
                          invoice takes at most what it owes; together they take at most what the
                          payment left unapplied.
                        </p>
                      </div>
                    </div>
                    <div slSectionBody>
                      <form
                        slForm
                        data-testid="allocate-form"
                        [messages]="{ summaryTitle: 'Nothing was allocated' }"
                        [errors]="store.allocationErrors()"
                        [loading]="store.busy() === 'allocate'"
                        (formSubmit)="allocate($event)"
                      >
                        <app-allocation-lines
                          [lines]="store.lines() ?? []"
                          [pending]="store.lines() === null"
                          [errors]="store.allocationErrors()"
                          [currency]="payment()!.amount.currency"
                          [available]="payment()!.unappliedAmount.minor"
                          [otherCurrency]="store.otherCurrency()"
                          [phone]="phone()"
                          (lineChange)="store.setLine($event.invoiceId, $event.amount)"
                          (fill)="store.fillOldestFirst()"
                        />
                        <div slFormActions>
                          <a
                            slButtonLink
                            variant="ghost"
                            tone="secondary"
                            [routerLink]="[]"
                            [queryParams]="{}"
                            (click)="store.cancelAllocation()"
                            >Cancel</a
                          >
                          <button
                            slButton
                            type="submit"
                            data-testid="allocate-submit"
                            [loading]="store.busy() === 'allocate'"
                            [messages]="{ loading: 'Allocating' }"
                          >
                            Allocate
                          </button>
                        </div>
                      </form>
                    </div>
                  </section>
                } @else {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 2 : 4"
                    [layout]="phone() ? 'fixed' : 'auto'"
                    data-testid="payment-allocations"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        The invoices this payment went to
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>Invoice</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>Allocated</th>
                            <th slTableColumnHeader>State</th>
                          }
                          <th slTableColumnHeader align="end" numeric>Amount</th>
                        </tr>
                      </thead>
                      <tbody slTableBody>
                        @if (payment() === null) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="60%"></span>
                            </th>
                            @if (!phone()) {
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="6rem"></span>
                              </td>
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="4rem"></span>
                              </td>
                            }
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="4rem"></span>
                            </td>
                          </tr>
                        } @else if (allocations().length === 0) {
                          <tr slTableRow>
                            <td slTableEmpty>
                              <div slResultState status="empty" reach="section">
                                <div slResultStateContent>
                                  <h3 slResultStateTitle>Allocated to no invoice</h3>
                                  <p slResultStateDescription>{{ noAllocationWords() }}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        } @else {
                          @for (a of allocations(); track a.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a
                                  slLink
                                  class="cell-text"
                                  variant="neutral"
                                  underline="hover"
                                  [routerLink]="[invoicesRoute, a.invoiceId]"
                                  >{{ a.invoiceNumber ?? a.invoiceId }}</a
                                >
                              </th>
                              @if (!phone()) {
                                <td slTableCell>{{ dateTime(a.createdAt) }}</td>
                                <td slTableCell>
                                  {{
                                    a.status === 'active'
                                      ? 'Applied'
                                      : 'Reversed ' + (a.reversedAt ? date(a.reversedAt) : '')
                                  }}
                                </td>
                              }
                              <td slTableCell align="end" numeric>
                                {{
                                  a.status === 'reversed' && phone() ? 'reversed' : money(a.amount)
                                }}
                              </td>
                            </tr>
                          }
                        }
                      </tbody>
                      @if (payment(); as p) {
                        @if (allocations().length > 0) {
                          <tfoot slTableSummary>
                            <tr slTableRow>
                              <th slTableRowHeader>
                                Applied, {{ activeCount() }} of {{ allocations().length }}
                              </th>
                              @if (!phone()) {
                                <td slTableCell></td>
                                <td slTableCell></td>
                              }
                              <td slTableCell align="end" numeric data-testid="allocations-total">
                                {{ money(p.allocatedAmount) }}
                              </td>
                            </tr>
                          </tfoot>
                        }
                      }
                    </div>
                  </div>
                }
              }
              @case ('refunds') {
                @if (refunding()) {
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle>
                        <h2 slSectionHeading>Refund from this payment</h2>
                        <p slSectionDescription>
                          Money goes back to {{ payment()!.customerName }} out of what the payment
                          left unapplied, {{ money(payment()!.unappliedAmount) }}. The refund is
                          posted at once.
                        </p>
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
                        <div slGrid [columns]="phone() ? 1 : 2" [gap]="4" minItemWidth="sm">
                          <div slField required [invalid]="!!refundError('amountMinor')">
                            <label slFieldLabel>Amount</label>
                            <div slCurrencyField>
                              <input
                                slCurrencyFieldInput
                                name="amountMinor"
                                [currency]="payment()!.amount.currency"
                                [min]="0"
                                [value]="store.refundDraft().amount"
                                (valueChange)="store.patchRefund({ amount: $event.value ?? null })"
                              />
                            </div>
                            @if (refundError('amountMinor'); as message) {
                              <p slFieldError>{{ message }}</p>
                            } @else {
                              <span slFieldDescription
                                >At most {{ money(payment()!.unappliedAmount) }}, what no invoice
                                took.</span
                              >
                            }
                          </div>
                          <div slField required>
                            <label slFieldLabel>Paid back by</label>
                            <sl-select
                              name="method"
                              [value]="store.refundDraft().method"
                              (valueChangeRequest)="
                                store.patchRefund({
                                  method: $any($event.value) ?? store.refundDraft().method,
                                })
                              "
                            >
                              @for (m of refundMethods(); track m) {
                                <sl-select-item [value]="m">{{ method(m) }}</sl-select-item>
                              }
                            </sl-select>
                          </div>
                        </div>
                        <div slField required [invalid]="!!refundError('reason')">
                          <label slFieldLabel>Why it goes back</label>
                          <textarea
                            slTextarea
                            name="reason"
                            [rows]="2"
                            [value]="store.refundDraft().reason"
                            (valueChange)="store.patchRefund({ reason: $event.value })"
                            placeholder="Overpaid INV-2026-02891 by a duplicate transfer."
                          ></textarea>
                          @if (refundError('reason'); as message) {
                            <p slFieldError>{{ message }}</p>
                          } @else {
                            <span slFieldDescription
                              >Kept on the refund and on the customer’s activity.</span
                            >
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
                            data-testid="refund-submit"
                            [loading]="store.busy() === 'refund'"
                            [messages]="{ loading: 'Refunding' }"
                          >
                            Refund
                          </button>
                        </div>
                      </form>
                    </div>
                  </section>
                } @else {
                  <div
                    slTable
                    variant="framed"
                    [columns]="phone() ? 2 : 4"
                    [layout]="phone() ? 'fixed' : 'auto'"
                    data-testid="payment-refunds"
                  >
                    <div slTableContent>
                      <caption slTableCaption>
                        Money paid back out of this payment
                      </caption>
                      <thead slTableHead>
                        <tr slTableRow>
                          <th slTableColumnHeader>Refund</th>
                          @if (!phone()) {
                            <th slTableColumnHeader>Posted</th>
                            <th slTableColumnHeader>Why</th>
                          }
                          <th slTableColumnHeader align="end" numeric>Amount</th>
                        </tr>
                      </thead>
                      <tbody slTableBody>
                        @if (payment() === null) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slSkeleton shape="text" inlineSize="60%"></span>
                            </th>
                            @if (!phone()) {
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="5rem"></span>
                              </td>
                              <td slTableCell>
                                <span slSkeleton shape="text" inlineSize="8rem"></span>
                              </td>
                            }
                            <td slTableCell align="end">
                              <span slSkeleton shape="text" inlineSize="4rem"></span>
                            </td>
                          </tr>
                        } @else if (store.refunds().length === 0) {
                          <tr slTableRow>
                            <td slTableEmpty>
                              <div slResultState status="empty" reach="section">
                                <div slResultStateContent>
                                  <h3 slResultStateTitle>Nothing refunded</h3>
                                  <p slResultStateDescription>{{ noRefundWords() }}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        } @else {
                          @for (r of store.refunds(); track r.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <span class="cell-text">{{ r.refundNumber }}</span>
                              </th>
                              @if (!phone()) {
                                <td slTableCell>{{ r.postedAt ? dateTime(r.postedAt) : '' }}</td>
                                <td slTableCell>
                                  <span class="cell-text" [title]="r.reason">{{ r.reason }}</span>
                                </td>
                              }
                              <td slTableCell align="end" numeric>{{ money(r.amount) }}</td>
                            </tr>
                          }
                        }
                      </tbody>
                    </div>
                  </div>
                }
              }
              @case ('details') {
                @if (payment(); as p) {
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>Payment</h2></div>
                    </div>
                    <div slSectionBody>
                      <div slDescriptionList layout="row" data-testid="payment-details">
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Customer</dt>
                          <dd slDescriptionListDescription>
                            <a slLink [routerLink]="['/crm/customers', p.customerId]">{{
                              p.customerName
                            }}</a>
                          </dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Method</dt>
                          <dd slDescriptionListDescription>{{ method(p.method) }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Reference</dt>
                          <dd slDescriptionListDescription>{{ p.reference || 'None' }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Currency</dt>
                          <dd slDescriptionListDescription>{{ currencyWords() }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Bank</dt>
                          <dd slDescriptionListDescription data-testid="payment-bank">
                            @if (store.detail()?.bankTransaction; as bank) {
                              @if (canReconcile()) {
                                <a slLink [routerLink]="[reconciliationRoute, bank.id]">{{
                                  bank.description
                                }}</a>
                              } @else {
                                {{ bank.description }}
                              }
                              · {{ date(bank.postedDate) }} · {{ bankWord(bank.status) }}
                            } @else {
                              Not matched to a bank transaction yet
                            }
                          </dd>
                        </div>
                        @if (p.status === 'reversed') {
                          <div slDescriptionListItem>
                            <dt slDescriptionListTerm>Reversed</dt>
                            <dd slDescriptionListDescription>
                              {{ p.reversedAt ? dateTime(p.reversedAt) : '' }} ·
                              {{ p.reversalReason }}
                            </dd>
                          </div>
                        }
                      </div>
                    </div>
                  </section>
                }
              }
            }

            @if (permissionNote(); as note) {
              <span slText size="sm" tone="muted" data-testid="payment-permission">{{ note }}</span>
            }
          </div>
        </div>

        <ng-template #allocateItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ allocate: 1 }">Allocate</a>
        </ng-template>
        <ng-template #refundItem>
          <a slMenuItem [routerLink]="[]" [queryParams]="{ refund: 1 }">Refund</a>
        </ng-template>
        <ng-template #reverseItem>
          <button slMenuItem type="button" (click)="reverseOpen.set(true)">Reverse</button>
        </ng-template>

        <app-reason-dialog
          [(open)]="reverseOpen"
          title="Reverse this payment"
          [description]="reverseWords()"
          label="Why it is reversed"
          note="Kept on the payment, which stays on record as reversed."
          confirmLabel="Reverse the payment"
          [busy]="store.busy() === 'reverse'"
          (confirm)="reverse($event)"
        />
      </div>
    }
  `,
})
export class PaymentPage {
  readonly store = inject(PaymentStore);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = PAYMENTS_ROUTE;
  readonly invoicesRoute = INVOICES_ROUTE;
  readonly reconciliationRoute = RECONCILIATION_ROUTE;
  readonly phone = phoneSignal();
  readonly reverseOpen = signal(false);
  readonly chosenView = signal<View>('allocations');
  readonly figureLabels = ['Amount', 'Allocated', 'Unapplied', 'Received'];
  /** The sentence's lines: two at the desk, five on a phone, where it wraps the most. */
  readonly sentenceLines = computed(() => (this.phone() ? 5 : 2));

  readonly payment = this.store.payment;
  readonly allocations = computed(() => this.store.detail()?.allocations ?? []);
  readonly activeCount = computed(
    () => this.allocations().filter((a) => a.status === 'active').length,
  );

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly allocating = computed(
    () => this.queryParams().get('allocate') === '1' && this.store.canAllocate(),
  );
  readonly refunding = computed(
    () => this.queryParams().get('refund') === '1' && this.store.canRefund(),
  );
  readonly view = computed<View>(() =>
    this.allocating() ? 'allocations' : this.refunding() ? 'refunds' : this.chosenView(),
  );

  private can(permission: string): boolean {
    void this.session.session();
    return this.session.can(permission);
  }

  readonly canReconcile = computed(() => this.can('reconciliation.view'));

  /** The commands the state allows and the reader holds; the one a form stands for leaves while it is open. */
  readonly headerCommands = computed(() => {
    const commands: ('allocate' | 'refund' | 'reverse')[] = [];
    if (this.store.canAllocate() && !this.allocating()) commands.push('allocate');
    if (this.store.canRefund() && !this.refunding()) commands.push('refund');
    if (this.store.canReverse()) commands.push('reverse');
    return commands;
  });

  readonly refundMethods = computed(() => methodsFor(this.payment()?.amount.currency ?? 'USD'));
  readonly refundErrors = computed(() => ({
    ...this.store.refundErrors(),
    ...this.store.refundLimitErrors(),
  }));

  readonly missing = computed(() => this.store.error()?.code === 'NOT_FOUND');
  readonly statusWord = computed(() => {
    const status = this.payment()?.status;
    return status ? PAYMENT_STATUS_LABEL[status] : '';
  });
  readonly statusTone = computed(() => {
    const status = this.payment()?.status;
    return status ? PAYMENT_STATUS_TONE[status] : 'secondary';
  });
  readonly subheading = computed(() => {
    const p = this.payment();
    return p
      ? `${p.customerName} · ${PAYMENT_METHOD_LABEL[p.method]} · ${formatDate(p.receivedDate)}`
      : '';
  });

  /** What the payment is now, and what it waits on, in one sentence (RP-06). */
  readonly sentence = computed(() => {
    const p = this.payment();
    if (p === null) return '';
    if (p.status === 'reversed')
      return `Reversed: its allocations were taken back and each invoice owes again what this payment had paid. ${p.reversalReason ? `Reason: ${p.reversalReason}.` : ''}`;
    if (p.status !== 'posted')
      return `${PAYMENT_STATUS_LABEL[p.status]}: a payment is allocated once it is posted.`;
    const bank = this.store.detail()?.bankTransaction
      ? ' It is matched to its bank deposit.'
      : ' It is not matched to a bank deposit yet.';
    if (
      p.unappliedAmount.minor > 0 &&
      this.store.openInvoices() === 0 &&
      this.can('payments.record')
    )
      return `Posted. ${formatMoney(p.unappliedAmount)} is unapplied, and the customer owes nothing in ${p.amount.currency} for it to go to: it stays their credit until an invoice is opened or it is refunded.${bank}`;
    return p.unappliedAmount.minor > 0
      ? `Posted. ${formatMoney(p.unappliedAmount)} is unapplied: the customer’s credit, until it is allocated to an invoice or refunded.${bank}`
      : `Posted and allocated in full.${bank}`;
  });

  /** What a reversal undoes, said before the confirm: each invoice and what it owes again, and the deposit. */
  readonly reverseWords = computed(() => {
    const p = this.payment();
    if (p === null) return '';
    const active = this.allocations().filter((a) => a.status === 'active');
    const invoices =
      active.length === 0
        ? 'It is allocated to no invoice, so no balance moves.'
        : `Its ${active.length === 1 ? 'allocation is' : `${active.length} allocations are`} taken back: ${active
            .map((a) => `${a.invoiceNumber ?? a.invoiceId} owes ${formatMoney(a.amount)} more`)
            .join(', ')}.`;
    const bank = this.store.detail()?.bankTransaction
      ? ' The bank deposit it is matched to returns to the reconciliation as unmatched.'
      : '';
    return `The payment is marked reversed and stays on record. ${invoices}${bank} This cannot be undone; a payment received again is recorded again.`;
  });

  /** What the state allows and the reader does not hold, said once with who does (RP-09, PM-02). */
  readonly permissionNote = computed(() => {
    const p = this.payment();
    if (p === null || p.status !== 'posted') return '';
    const notes: string[] = [];
    if (p.unappliedAmount.minor > 0 && !this.can('payments.record'))
      notes.push(
        `What is unapplied is allocated by holders of payments.record — ${FINANCE_HOLDERS['payments.record']}.`,
      );
    if (!this.can('payments.reverse'))
      notes.push(
        `A payment is reversed by holders of payments.reverse — ${FINANCE_HOLDERS['payments.reverse']}.`,
      );
    return notes.join(' ');
  });

  readonly noAllocationWords = computed(() => {
    const p = this.payment();
    if (p === null) return '';
    return p.status === 'posted'
      ? `The whole ${formatMoney(p.amount)} is the customer’s credit until it is allocated.`
      : 'A payment that is not posted takes no invoice.';
  });

  readonly noRefundWords = computed(() =>
    this.store.canRefund()
      ? 'What the payment left unapplied can be paid back from here.'
      : 'Nothing has been paid back from this payment.',
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.chosenView.set('allocations');
      void this.store.open(id);
    });
    effect(() => {
      if (!this.allocating()) return;
      untracked(() => void this.store.startAllocation());
    });
    effect(() => {
      if (!this.refunding()) return;
      untracked(() => this.store.startRefund());
    });
  }

  setView(value: string | undefined): void {
    if (value === 'allocations' || value === 'refunds' || value === 'details')
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

  method(value: PaymentMethod): string {
    return PAYMENT_METHOD_LABEL[value];
  }

  bankWord(status: keyof typeof BANK_STATUS_LABEL): string {
    return BANK_STATUS_LABEL[status];
  }

  currencyWords(): string {
    const p = this.payment();
    if (p === null) return '';
    return p.amount.currency === 'USD'
      ? 'USD'
      : `${p.amount.currency}, at ${Number(p.fxRateToUsd ?? '1').toFixed(4)} US$ each`;
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

  allocate(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeAllocation());
  }

  private async writeAllocation(): Promise<void> {
    const before = this.payment()?.unappliedAmount;
    if (!(await this.store.allocate())) return;
    const after = this.payment()?.unappliedAmount;
    this.toasts.show({
      title: 'Allocated',
      description:
        after && after.minor > 0
          ? `${formatMoney(after)} stays unapplied as the customer’s credit.`
          : before
            ? `${formatMoney(before)} went to the invoices; nothing stays unapplied.`
            : '',
      tone: 'success',
    });
    leaveForm(this.router, this.route, this.location, {});
  }

  refund(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.writeRefund());
  }

  private async writeRefund(): Promise<void> {
    if (!(await this.store.refund())) return;
    this.toasts.show({ title: 'Refund posted', tone: 'success' });
    leaveForm(this.router, this.route, this.location, {});
  }

  async reverse(reason: string): Promise<void> {
    const ok = await this.store.reverse(reason);
    this.reverseOpen.set(false);
    if (ok)
      this.toasts.show({
        title: 'Payment reversed',
        description: 'Its invoices owe again what it had paid.',
        tone: 'success',
      });
  }
}
