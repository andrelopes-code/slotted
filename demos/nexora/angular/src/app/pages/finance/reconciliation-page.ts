import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlSplitter } from '@slotted/angular/splitter';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDetailPanel,
  SlDetailPanelAside,
  SlDetailPanelBanner,
  SlDetailPanelBody,
  SlDetailPanelMessage,
  SlDetailPanelSection,
} from '@slotted/angular/detail-panel';
import { SlFilterBar, type FilterBarField } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlList, SlListEmpty } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemActions,
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
  SlPagination,
  SlPaginationNext,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlScrollArea } from '@slotted/angular/scroll-area';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlToastService } from '@slotted/angular/toast';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { withPageIndex } from '@slotted/core/grid';
import type { InvoiceListItem, Money } from '@slotted/demo-nexora-backend';
import { map } from 'rxjs';

import { formatDate, formatMoney, options } from '../../core/catalog/catalog.model';
import {
  agingWords,
  BANK_STATUS_LABEL,
  BANK_STATUS_TONE,
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  FINANCE_HOLDERS,
  financeAdvice,
  INVOICES_ROUTE,
  PAYMENTS_ROUTE,
  RECONCILIATION_ROUTE,
  type BankTransactionListItem,
} from '../../core/finance/finance.model';
import {
  BankTransactionsStore,
  invoiceMatchPreview,
  queueQuery,
  ReconciliationStore,
  type CandidateView,
} from '../../core/finance/reconciliation.store';
import { toneFor } from '../../core/inventory/inventory-failure';
import { PaneSplit } from '../../core/layout/pane-split';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { ConfirmDialog } from '../inventory/confirm-dialog';
import { ReasonDialog } from '../orders/reason-dialog';
import { ReconciliationCandidate } from './reconciliation-candidate';

type Pending =
  | {
      readonly kind: 'invoice';
      readonly invoice: Pick<InvoiceListItem, 'id' | 'invoiceNumber' | 'outstanding'>;
    }
  | { readonly kind: 'customer'; readonly customerId: string; readonly customerName: string };

/**
 * The reconciliation workspace (§13, §34.5, §66.13): the deposits still to
 * reconcile at the start, the one open in the middle with what it could match
 * and why each candidate scored what it did, and the open invoices of the
 * customer a candidate names at the end. The open deposit is the address's
 * `:id`, so a selection is a link and the back gesture returns.
 *
 * The middle and the end are one `detail-panel` — the deposit as a record, its
 * candidates as the main column, the customer's invoices as the aside — so
 * the family's own container query decides where the invoices stand: beside
 * the candidates where the panel is wide enough, under them where it is not.
 * A phone reads one region at a time (§39): the queue, then the deposit it
 * opens with the invoices under its candidates.
 */
@Component({
  selector: 'app-reconciliation-page',
  imports: [
    ConfirmDialog,
    ReasonDialog,
    ReconciliationCandidate,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDetailPanel,
    SlDetailPanelAside,
    SlDetailPanelBanner,
    SlDetailPanelBody,
    SlDetailPanelMessage,
    SlDetailPanelSection,
    SlFilterBar,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlList,
    SlListEmpty,
    SlListItem,
    SlListItemActions,
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
    SlPageHeaderBack,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPagination,
    SlPaginationNext,
    SlPaginationPrevious,
    SlPaginationStatus,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlScrollArea,
    SlSelect,
    SlSelectItem,
    SlSkeleton,
    SlSplitter,
    SlStack,
    SlTag,
    SlTagBody,
    SlHeading,
    SlText,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * One row as tall as the body: the queue and the deposit scroll inside it, the page does not (LP-12).
     * The size is contained so the deposit's content, which is taller than any screen, never becomes
     * the body's minimum: the body's flex share is the only height the row is given.
     */
    .reconcile {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
      min-block-size: 0;
    }
    /*
     * literal: the compact size class (COMPACT_BELOW in @slotted/core/measure). Above it the queue
     * stands beside the deposit at the width the splitter holds: from 17rem, up to what leaves the
     * deposit 30rem. The reader widens it to read the descriptions, or narrows it to give the
     * deposit its third column.
     */
    /* Below it the page scrolls and the body grows with its content: a contained size would be nought. */
    @media (width >= 600px) {
      .reconcile {
        display: flex;
        gap: var(--slotted-space-3);
        block-size: 100%;
        contain: size;
      }
      .queue {
        flex: none;
        inline-size: calc(var(--slotted-splitter-value, 0.3) * 100%);
      }
      .detail,
      .placeholder {
        flex: 1 1 0;
      }
    }
    /* LA-01: the page summary takes the start of the line and the pager the end. */
    .queue nav[slPagination] [data-part='status'] {
      margin-inline-end: auto;
    }
    .queue {
      display: flex;
      flex-direction: column;
      gap: var(--slotted-space-3);
      min-block-size: 0;
      min-inline-size: 0;
    }
    .rows {
      flex: 1 1 0;
      min-block-size: 0;
    }
    /* LP-12: below the compact size class the page scrolls, and the rows take their own height. */
    @media (width < 600px) {
      .rows {
        flex-basis: auto;
      }
    }
    .detail {
      min-block-size: 0;
      min-inline-size: 0;
    }
    .figure {
      flex: none;
      text-align: end;
    }
    /* On a finger a document's link is a touch target's height (--slotted-target-comfortable), as on the record pages' tables. */
    @media (pointer: coarse) {
      a[slLink] {
        display: inline-block;
        line-height: var(--slotted-target-comfortable);
      }
    }
    /* The amount over its mark, both on the end edge: where a narrow row puts the end part on a line of its own, they keep that edge. */
    .end {
      display: grid;
      justify-items: end;
      gap: var(--slotted-space-1);
      inline-size: 100%;
    }
    .candidates > * + * {
      padding-block-start: var(--slotted-space-5);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    .placeholder {
      display: grid;
      place-items: center;
      min-block-size: 0;
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      @if (!(phone() && id())) {
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>Reconciliation</h1>
                <p slPageHeaderSubheading>
                  Bank deposits matched to the payments and invoices they settle
                </p>
              </div>
            </div>
          </div>
        </header>
      }
      <div slPageBody>
        <div class="reconcile" #reconcile>
          @if (!phone() || !id()) {
            <div class="queue" data-testid="queue">
              <div
                slFilterBar
                aria-label="Bank transaction filters"
                [fields]="fields"
                [value]="queue.filter()"
                (valueChangeRequest)="queue.setFilter($event.value)"
                [query]="queue.search()"
                (queryChangeRequest)="queue.setSearch($event.value)"
                [messages]="countMessages"
                [count]="queue.total() ?? undefined"
                [total]="queue.total() === queue.grandTotal() ? undefined : (queue.grandTotal() ?? undefined)"
                [loading]="queue.loading()"
              ></div>
              <div slScrollArea class="rows" [messages]="{ label: 'Bank transactions' }">
                <ul
                  slList
                  variant="ruled"
                  aria-label="Bank transactions"
                  [loading]="queue.loading() && queue.rows().length > 0"
                  data-testid="queue-rows"
                >
                  @if (queue.rows().length === 0 && queue.error(); as error) {
                    <li slListEmpty>
                      <div slResultState status="error" reach="section">
                        <div slResultStateContent>
                          <h2 slResultStateTitle>The bank transactions did not arrive</h2>
                          <p slResultStateDescription>
                            Nothing was changed. Try again in a moment.
                          </p>
                        </div>
                        <div slResultStateActions>
                          <button slButton size="sm" type="button" (click)="queue.reload()">
                            Try again
                          </button>
                        </div>
                      </div>
                    </li>
                  } @else if (
                    queue.rows().length === 0 && (queue.loading() || queue.total() === null)
                  ) {
                    <!-- The first page's rows, each the anatomy of a row: the description, the date line, the amount and its mark. -->
                    @for (row of placeholderRows; track row) {
                      <li slListItem>
                        <div slListItemContent>
                          <span slListItemBody>
                            <span slListItemLabel
                              ><span
                                slSkeleton
                                shape="text"
                                [inlineSize]="row % 3 === 0 ? '60%' : '80%'"
                              ></span
                            ></span>
                            <span slListItemDescription
                              ><span slSkeleton shape="text" inlineSize="45%"></span
                            ></span>
                          </span>
                          <span slListItemEnd
                            ><span slSkeleton shape="text" inlineSize="4.5rem"></span
                          ></span>
                        </div>
                      </li>
                    }
                  } @else if (queue.rows().length === 0) {
                    <li slListEmpty data-testid="queue-empty">
                      <div
                        slResultState
                        [status]="narrowed() ? 'no-results' : 'empty'"
                        reach="section"
                      >
                        <div slResultStateContent>
                          <h2 slResultStateTitle>
                            {{
                              narrowed()
                                ? 'No transaction matches these filters'
                                : 'Every deposit is reconciled'
                            }}
                          </h2>
                          <p slResultStateDescription>
                            {{
                              narrowed()
                                ? 'Remove a filter to see more of the bank feed.'
                                : 'The bank feed holds nothing left to match or ignore.'
                            }}
                          </p>
                        </div>
                        @if (narrowed()) {
                          <div slResultStateActions>
                            <button
                              slButton
                              size="sm"
                              variant="outline"
                              tone="secondary"
                              type="button"
                              (click)="clearFilters()"
                            >
                              Clear filters
                            </button>
                          </div>
                        }
                      </div>
                    </li>
                  } @else {
                    @for (row of queue.rows(); track row.id) {
                      <li slListItem truncate [current]="row.id === id()" [attr.data-id]="row.id">
                        <a
                          slListItemContent
                          [routerLink]="[route, row.id]"
                          [replaceUrl]="!phone() && !!id()"
                        >
                          <span slListItemBody>
                            <span slListItemLabel [title]="row.description">{{
                              row.description
                            }}</span>
                            <span slListItemDescription>{{ rowWords(row) }}</span>
                          </span>
                          <span slListItemEnd>
                            <span class="end">
                              <span
                                slText
                                size="sm"
                                weight="medium"
                                numeric="tabular"
                                class="figure"
                                >{{ money(row.amount) }}</span
                              >
                              <span slTag size="sm" [tone]="rowTone(row)"
                                ><span slTagBody>{{ rowMark(row) }}</span></span
                              >
                            </span>
                          </span>
                        </a>
                      </li>
                    }
                  }
                </ul>
              </div>
              <nav
                slPagination
                aria-label="Bank transaction pages"
                [messages]="pagerMessages"
                [count]="queue.total() ?? 0"
                [page]="queue.page().index + 1"
                [pageSize]="queue.page().size"
                [loading]="queue.loading()"
                (pageChange)="goTo($event.value)"
              >
                <p slPaginationStatus></p>
                <button slPaginationPrevious type="button"></button>
                <button slPaginationNext type="button"></button>
              </nav>
            </div>
            @if (!phone()) {
              <div
                slSplitter
                aria-label="Queue width"
                min="17rem"
                max="calc(100% - 30rem)"
                [defaultValue]="split.opening()"
                [(value)]="split.value"
                (resizeEnd)="split.keep($event)"
                (valueChangeRequest)="split.keyed($event)"
                (dblclick)="split.reset()"
              ></div>
            }
          }

          @if (!phone() || id()) {
            @if (id()) {
              <article
                slDetailPanel
                class="detail"
                scroll="self"
                data-testid="deposit"
                [level]="phone() ? '1' : '2'"
                [aside]="
                  store.transaction() === null || (store.open() && store.customers().length > 0)
                    ? 'end'
                    : 'none'
                "
                [status]="panelStatus()"
                [loading]="store.transaction() === null && store.error() === null"
                [recordKey]="id() ?? undefined"
                [messages]="{ aside: asideLabel(), loading: 'Reading the bank transaction' }"
              >
                <!-- Beside the queue the deposit's header stands inside the page's padding: a box of
                     its own. On a phone the deposit is the page, and its header is the page's band. -->
                <header slPageHeader [variant]="phone() ? 'band' : 'floating'">
                  <div slPageHeaderTitleArea>
                    @if (phone()) {
                      <div slPageHeaderNav>
                        <a slPageHeaderBack [routerLink]="route">Reconciliation</a>
                      </div>
                    }
                    <div slPageHeaderTitleRow>
                      <div slPageHeaderTitle>
                        @if (phone()) {
                          <h1 slPageHeaderHeading>{{ heading() }}</h1>
                        } @else {
                          <h2 slPageHeaderHeading>{{ heading() }}</h2>
                        }
                        @if (store.transaction(); as tx) {
                          <span slPageHeaderMarks>
                            <span slTag size="sm" [tone]="statusTone(tx)"
                              ><span slTagBody>{{ statusWord(tx) }}</span></span
                            >
                          </span>
                          <p slPageHeaderSubheading [title]="tx.description">
                            {{ tx.description }}
                          </p>
                        } @else if (store.error() === null) {
                          <span slPageHeaderMarks
                            ><span slTag size="sm" tone="secondary"
                              ><span slTagBody
                                ><span
                                  slSkeleton
                                  shape="text"
                                  inlineSize="4rem"
                                ></span></span></span
                          ></span>
                          <p slPageHeaderSubheading>
                            <span slSkeleton shape="text" inlineSize="60%"></span>
                          </p>
                        }
                      </div>
                      @if (store.canManage() && store.open()) {
                        <div slPageHeaderActions>
                          <div slToolbar aria-label="Bank transaction actions" overflow="menu">
                            <div slToolbarItem [slToolbarItemCounterpart]="ignoreItem">
                              <button
                                slButton
                                variant="outline"
                                tone="secondary"
                                type="button"
                                data-testid="ignore"
                                [disabled]="store.busy() !== null"
                                (click)="ignoreOpen.set(true)"
                              >
                                Ignore
                              </button>
                            </div>
                            <sl-toolbar-overflow />
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </header>
                <div slDetailPanelBody>
                  @if (store.failure(); as failure) {
                    <div slDetailPanelBanner>
                      <div slInlineMessage [tone]="failureTone(failure.kind)" data-testid="failure">
                        <span slInlineMessageIcon></span>
                        <span slStack [gap]="1">
                          <span slText size="sm">{{ failure.message }}</span>
                          <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                        </span>
                      </div>
                    </div>
                  } @else if (store.outcome(); as outcome) {
                    <div slDetailPanelBanner>
                      <div
                        slInlineMessage
                        [tone]="
                          outcome.unapplied.minor > 0 && outcome.created ? 'warning' : 'success'
                        "
                        data-testid="outcome"
                      >
                        <span slInlineMessageIcon></span>
                        <span slInline [gap]="2" wrap="wrap">
                          <span slText size="sm">{{ outcomeWords() }}</span>
                          @if (canReadPayments()) {
                            <a slLink [routerLink]="[paymentsRoute, outcome.paymentId]"
                              >Open {{ outcome.paymentNumber }}</a
                            >
                          }
                        </span>
                      </div>
                    </div>
                  }

                  <ng-template slDetailPanelSection name="deposit" label="The deposit">
                    @if (store.transaction(); as tx) {
                      <div slDescriptionList layout="row" data-testid="deposit-facts">
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Amount</dt>
                          <dd slDescriptionListDescription>
                            <span slText numeric="tabular">{{ money(tx.amount) }}</span>
                          </dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Posted</dt>
                          <dd slDescriptionListDescription>{{ date(tx.postedDate) }}</dd>
                        </div>
                        <div slDescriptionListItem>
                          <dt slDescriptionListTerm>Bank reference</dt>
                          <dd slDescriptionListDescription>
                            {{ tx.reference || 'None on the deposit' }}
                          </dd>
                        </div>
                        @if (tx.status === 'matched') {
                          <div slDescriptionListItem>
                            <dt slDescriptionListTerm>Matched to</dt>
                            <dd slDescriptionListDescription>
                              @if (tx.matchedPaymentId && canReadPayments()) {
                                <a slLink [routerLink]="[paymentsRoute, tx.matchedPaymentId]">{{
                                  tx.matchedPaymentNumber ?? tx.matchedPaymentId
                                }}</a>
                              } @else {
                                {{ tx.matchedPaymentNumber ?? tx.matchedPaymentId }}
                              }
                            </dd>
                          </div>
                        }
                        @if (tx.status === 'ignored') {
                          <div slDescriptionListItem>
                            <dt slDescriptionListTerm>Ignored because</dt>
                            <dd slDescriptionListDescription>
                              {{ tx.ignoreReason || 'No reason was kept' }}
                            </dd>
                          </div>
                        }
                      </div>
                    }
                  </ng-template>

                  <ng-template
                    slDetailPanelSection
                    name="candidates"
                    label="What it could match"
                    [count]="store.open() ? store.candidates().length : undefined"
                  >
                    @if (!store.open()) {
                      <span slText size="sm" tone="muted" data-testid="closed">{{
                        closedWords()
                      }}</span>
                    } @else {
                      <div slStack [gap]="5">
                        @if (store.candidates().length === 0) {
                          <div
                            slResultState
                            status="empty"
                            reach="section"
                            data-testid="no-candidates"
                          >
                            <div slResultStateContent>
                              <h3 slResultStateTitle>
                                Nothing in Nexora scores 40 or more against this deposit
                              </h3>
                              <p slResultStateDescription>{{ noCandidateWords() }}</p>
                            </div>
                          </div>
                        } @else {
                          <div slStack [gap]="5" class="candidates">
                            @for (view of store.candidates(); track view.key) {
                              <app-reconciliation-candidate
                                [view]="view"
                                [deposit]="store.transaction()!.amount"
                                [open]="store.open()"
                                [canManage]="store.canManage()"
                                [canOpen]="canOpen(view)"
                                [busy]="store.busy() === view.key"
                                [locked]="store.busy() !== null && store.busy() !== view.key"
                                (confirm)="confirm($event)"
                              />
                            }
                          </div>
                        }
                        @if (
                          store.canManage() && store.noPayment() && store.customerId();
                          as customerId
                        ) {
                          <span slInline [gap]="3" wrap="wrap" data-testid="create-for-customer">
                            <span slText size="sm" tone="muted">
                              No candidate is a payment already recorded. The deposit can be
                              recorded as a payment from {{ store.customerName() }}, left unapplied.
                            </span>
                            <button
                              slButton
                              size="sm"
                              variant="outline"
                              tone="secondary"
                              type="button"
                              [disabled]="store.busy() !== null"
                              (click)="askCustomer(customerId)"
                            >
                              Record as a payment from {{ store.customerName() }}
                            </button>
                          </span>
                        }
                        @if (!store.canManage()) {
                          <span slText size="sm" tone="muted" data-testid="read-only">{{
                            readOnlyWords
                          }}</span>
                        }
                      </div>
                    }
                  </ng-template>

                  <aside slDetailPanelAside data-testid="invoices">
                    <div slStack [gap]="3">
                      <h3 slHeading size="sm">{{ asideLabel() }}</h3>
                      @if (store.customers().length > 1) {
                        <sl-select
                          size="sm"
                          aria-label="Customer"
                          [value]="store.customerId()"
                          (valueChangeRequest)="store.chooseCustomer($any($event.value))"
                        >
                          @for (customer of store.customers(); track customer.id) {
                            <sl-select-item [value]="customer.id">{{
                              customer.name
                            }}</sl-select-item>
                          }
                        </sl-select>
                      }
                      <ul
                        slList
                        variant="ruled"
                        aria-label="Open invoices"
                        [loading]="store.invoices().pending && store.invoices().value !== null"
                      >
                        @if (store.invoices().value; as invoices) {
                          @if (invoices.length === 0) {
                            <li slListEmpty>
                              <span slText size="sm" tone="muted">{{ noInvoiceWords() }}</span>
                            </li>
                          } @else {
                            @for (invoice of invoices; track invoice.id) {
                              <li slListItem [attr.data-invoice-id]="invoice.id">
                                <div slListItemContent>
                                  <span slListItemBody>
                                    <span slListItemLabel>
                                      <a slLink [routerLink]="[invoicesRoute, invoice.id]">{{
                                        invoice.invoiceNumber ?? invoice.id
                                      }}</a>
                                    </span>
                                    <span slListItemDescription>{{ aging(invoice) }}</span>
                                  </span>
                                  <span slListItemEnd>
                                    <span slText size="sm" numeric="tabular" class="figure">{{
                                      money(invoice.outstanding)
                                    }}</span>
                                  </span>
                                </div>
                                @if (store.canManage() && store.open()) {
                                  <div slListItemActions>
                                    <button
                                      slButton
                                      size="sm"
                                      variant="outline"
                                      tone="secondary"
                                      type="button"
                                      data-testid="match-invoice"
                                      [disabled]="store.busy() !== null"
                                      (click)="askInvoice(invoice)"
                                    >
                                      Match
                                    </button>
                                  </div>
                                }
                              </li>
                            }
                          }
                        } @else if (store.invoices().failed) {
                          <li slListEmpty>
                            <span slInline [gap]="2" wrap="wrap">
                              <span slText size="sm">The invoices did not arrive.</span>
                              <button
                                slButton
                                size="sm"
                                variant="outline"
                                tone="secondary"
                                type="button"
                                (click)="store.loadInvoices()"
                              >
                                Try again
                              </button>
                            </span>
                          </li>
                        } @else {
                          @for (row of [1, 2, 3]; track row) {
                            <li slListItem>
                              <div slListItemContent>
                                <span slListItemBody>
                                  <span slListItemLabel
                                    ><span slSkeleton shape="text" inlineSize="7rem"></span
                                  ></span>
                                  <span slListItemDescription
                                    ><span slSkeleton shape="text" inlineSize="60%"></span
                                  ></span>
                                </span>
                                <span slListItemEnd
                                  ><span slSkeleton shape="text" inlineSize="4rem"></span
                                ></span>
                              </div>
                            </li>
                          }
                        }
                      </ul>
                      @if (store.canManage() && store.open()) {
                        <span slText size="sm" tone="muted">
                          Matching an invoice records the deposit as a payment of the customer,
                          received on the day it was posted, and allocates it to the invoice; what
                          the invoice does not take stays unapplied on the payment.
                        </span>
                      }
                    </div>
                  </aside>

                  <div slDetailPanelMessage>
                    <div
                      slResultState
                      [status]="panelStatus() === 'not-found' ? 'not-found' : 'error'"
                      data-testid="missing"
                    >
                      <div slResultStateContent>
                        <h3 slResultStateTitle>
                          {{
                            panelStatus() === 'not-found'
                              ? 'This bank transaction does not exist'
                              : 'The bank transaction could not be loaded'
                          }}
                        </h3>
                        <p slResultStateDescription>{{ missingWords() }}</p>
                      </div>
                      <div slResultStateActions>
                        @if (panelStatus() === 'error') {
                          <button slButton type="button" (click)="store.load()">Try again</button>
                        }
                        <a slButtonLink variant="ghost" tone="secondary" [routerLink]="route"
                          >Back to the queue</a
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            } @else {
              <div class="placeholder" data-testid="no-selection">
                <div slResultState status="empty" reach="section">
                  <div slResultStateContent>
                    <h2 slResultStateTitle>Open a deposit from the queue</h2>
                    <p slResultStateDescription>
                      The queue lists what the bank received and Nexora has not yet matched, oldest
                      first. A deposit opens here with the payments and invoices it could settle,
                      each with what its score is made of.
                    </p>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <ng-template #ignoreItem>
        <button slMenuItem type="button" (click)="ignoreOpen.set(true)">Ignore</button>
      </ng-template>

      <app-reason-dialog
        [(open)]="ignoreOpen"
        title="Ignore this transaction"
        description="It leaves the queue and is kept as ignored, with your reason; an ignored transaction is never matched afterwards."
        label="Why it is ignored"
        placeholder="Bank fee, not a customer receipt."
        note="Kept on the transaction."
        confirmLabel="Ignore"
        tone="warning"
        [busy]="store.busy() === 'ignore'"
        (confirm)="ignore($event)"
      />
      <app-confirm-dialog
        [open]="pending() !== null"
        (openChange)="$event ? null : pending.set(null)"
        [title]="pendingTitle()"
        [description]="pendingWords()"
        [confirmLabel]="pendingLabel()"
        keepLabel="Keep it as it is"
        tone="accent"
        [busy]="pendingBusy()"
        (confirm)="confirmPending()"
      />
    </div>
  `,
})
export class ReconciliationPage {
  readonly queue = inject(BankTransactionsStore);
  readonly store = inject(ReconciliationStore);
  private readonly session = inject(SessionStore);
  private readonly route$ = inject(ActivatedRoute);
  private readonly toasts = inject(SlToastService);

  readonly route = RECONCILIATION_ROUTE;
  readonly paymentsRoute = PAYMENTS_ROUTE;
  readonly invoicesRoute = INVOICES_ROUTE;
  readonly phone = phoneSignal();
  /** The queue's width, kept in pixels as the window changes; it opens at 24rem. */
  readonly split = new PaneSplit('nexora.reconciliation.queue-width', 24);
  private readonly reconcile = viewChild<ElementRef<HTMLElement>>('reconcile');
  readonly ignoreOpen = signal(false);
  readonly pending = signal<Pending | null>(null);
  /** The queue's first page is 25 rows: the wait reserves them (loading-states §2). */
  readonly placeholderRows = Array.from({ length: 25 }, (_, index) => index);

  readonly id = toSignal(this.route$.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route$.snapshot.paramMap.get('id'),
  });

  readonly readOnlyWords = `Deposits are matched and ignored by holders of reconciliation.manage — ${FINANCE_HOLDERS['reconciliation.manage']}.`;

  readonly fields: readonly FilterBarField[] = [
    {
      key: 'status',
      label: 'Status',
      kind: 'set',
      options: options(BANK_STATUS_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'confidence',
      label: 'Confidence',
      kind: 'set',
      options: options(CONFIDENCE_LABEL),
      pinned: true,
      operators: ['anyOf'],
    },
    {
      key: 'postedDate',
      label: 'Posted',
      kind: 'date',
      operators: ['after', 'before', 'between'],
      section: 'Deposit',
    },
    {
      key: 'amount',
      label: 'Amount (US$)',
      kind: 'number',
      operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
      section: 'Deposit',
    },
    {
      key: 'reference',
      label: 'Bank reference',
      kind: 'text',
      operators: ['contains'],
      section: 'Deposit',
    },
    {
      key: 'description',
      label: 'Description',
      kind: 'text',
      operators: ['contains'],
      section: 'Deposit',
    },
  ];

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} transactions', countOnly: '{count} transactions' };

  readonly pagerMessages = {
    range: 'Transactions {start}–{end} of {count}',
  };

  readonly narrowed = computed(
    () => this.queue.filter() !== null || this.queue.search().trim().length >= 2,
  );

  readonly canReadPayments = computed(() => {
    void this.session.session();
    return this.session.can('payments.view');
  });
  private readonly canReadInvoices = computed(() => {
    void this.session.session();
    return this.session.can('invoices.view');
  });

  readonly panelStatus = computed<'ready' | 'not-found' | 'error'>(() => {
    const error = this.store.error();
    if (error === null) return 'ready';
    return error.code === 'NOT_FOUND' ? 'not-found' : 'error';
  });

  readonly heading = computed(() => {
    const tx = this.store.transaction();
    if (tx) return formatMoney(tx.amount);
    return 'Bank transaction';
  });

  readonly asideLabel = computed(() => {
    const name = this.store.customerName();
    return name ? `Open invoices of ${name}` : 'Open invoices';
  });

  readonly missingWords = computed(() =>
    this.panelStatus() === 'not-found'
      ? 'The bank feed holds no transaction with this identifier. The queue lists every transaction there is.'
      : (this.store.error()?.message ?? ''),
  );

  readonly closedWords = computed(() => {
    const tx = this.store.transaction();
    if (tx?.status === 'matched')
      return `Matched to ${tx.matchedPaymentNumber ?? 'a payment'}: the deposit is reconciled and leaves the queue.`;
    if (tx?.status === 'ignored')
      return 'Ignored: the deposit is not a customer receipt and is never matched.';
    return '';
  });

  readonly noCandidateWords = computed(() => {
    const tx = this.store.transaction();
    if (tx && tx.amount.minor <= 0)
      return 'An outgoing amount is never a customer receipt: it is ignored, with a reason.';
    return 'No posted payment and no open invoice in its currency comes close on amount, reference, name or date. Record the payment on the customer’s invoice first, then return: it will be scored here.';
  });

  readonly noInvoiceWords = computed(() => {
    const tx = this.store.transaction();
    return this.store.customerId() === null
      ? 'No candidate names a customer.'
      : `Nothing open in ${tx?.amount.currency ?? 'the deposit’s currency'} that still owes.`;
  });

  readonly outcomeWords = computed(() => {
    const outcome = this.store.outcome();
    if (outcome === null) return '';
    const allocated =
      outcome.invoiceNumbers.length > 0
        ? ` ${formatMoney(outcome.allocated)} is allocated to ${outcome.invoiceNumbers.join(', ')}`
        : ' Nothing is allocated yet';
    const rest =
      outcome.unapplied.minor > 0
        ? `; ${formatMoney(outcome.unapplied)} stays unapplied on the payment.`
        : '.';
    return outcome.created
      ? `The deposit is recorded as ${outcome.paymentNumber} and reconciled.${allocated}${rest}`
      : `The deposit is matched to ${outcome.paymentNumber} and reconciled.`;
  });

  readonly pendingTitle = computed(() =>
    this.pending()?.kind === 'invoice'
      ? 'Record the deposit and allocate it'
      : 'Record the deposit as a payment',
  );

  readonly pendingLabel = computed(() =>
    this.pending()?.kind === 'invoice' ? 'Create payment and allocate' : 'Record the payment',
  );

  readonly pendingBusy = computed(() => {
    const pending = this.pending();
    const busy = this.store.busy();
    if (pending === null || busy === null) return false;
    return pending.kind === 'invoice'
      ? busy === `invoice:${pending.invoice.id}`
      : busy === `customer:${pending.customerId}`;
  });

  /** What the confirm will write, in lines, before it is sent (FM-14). */
  readonly pendingWords = computed(() => {
    const pending = this.pending();
    const tx = this.store.transaction();
    if (pending === null || tx === null) return '';
    const posted = this.date(tx.postedDate);
    const customer =
      pending.kind === 'invoice'
        ? (this.store.customerName() ?? 'the customer')
        : pending.customerName;
    const created = `A payment of ${formatMoney(tx.amount)} from ${customer}, received ${posted}, is recorded and posted, and the deposit is reconciled with it.`;
    if (pending.kind === 'customer')
      return `${created} Nothing is allocated: it stays unapplied until it is allocated from the payment’s page.`;
    const preview = invoiceMatchPreview(tx.amount, pending.invoice);
    const invoice = pending.invoice.invoiceNumber ?? pending.invoice.id;
    const owes =
      preview.owesAfter.minor === 0
        ? `${invoice} is paid in full`
        : `${invoice} still owes ${formatMoney(preview.owesAfter)}`;
    const rest =
      preview.unapplied.minor > 0
        ? ` ${formatMoney(preview.unapplied)} of the deposit stays unapplied on the payment.`
        : ' Nothing stays unapplied.';
    return `${created} ${formatMoney(preview.allocated)} is allocated to ${invoice}: ${owes}.${rest}`;
  });

  constructor() {
    // Unmoved, the queue opens 24rem wide, the reading measure it had before it could be moved.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const row = this.reconcile()?.nativeElement;
      if (row) this.split.observe(row, destroyRef);
    });
    void this.queue.open(this.queue.total() === null ? queueQuery() : null);
    effect(() => {
      const id = this.id();
      untracked(() => {
        if (id === null) this.store.clear();
        else void this.store.select(id);
      });
    });
    // A persona, a scenario or a day moved: the queue and the deposit read again from nothing.
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) {
          void this.queue.open(queueQuery());
          if (this.id() !== null) void this.store.load();
        }
        tenant = key;
      });
    });
  }

  goTo(page: number): void {
    void this.queue.load(withPageIndex(this.queue.query(), page - 1).query);
  }

  clearFilters(): void {
    void this.queue.load({
      ...this.queue.query(),
      filter: null,
      search: '',
      page: { index: 0, size: this.queue.page().size },
    });
  }

  rowWords(row: BankTransactionListItem): string {
    return [this.date(row.postedDate), row.reference ? `ref ${row.reference}` : null]
      .filter(Boolean)
      .join(' · ');
  }

  /** The row's one mark: the confidence while it waits, the status once it is settled (CP-06). */
  rowMark(row: BankTransactionListItem): string {
    if (row.status === 'matched' || row.status === 'ignored' || !row.bestCandidate)
      return BANK_STATUS_LABEL[row.status];
    return `${CONFIDENCE_LABEL[row.bestCandidate.confidence]} ${row.bestCandidate.score}`;
  }

  rowTone(row: BankTransactionListItem) {
    if (row.status === 'matched' || row.status === 'ignored' || !row.bestCandidate)
      return BANK_STATUS_TONE[row.status];
    return CONFIDENCE_TONE[row.bestCandidate.confidence];
  }

  statusWord(row: BankTransactionListItem): string {
    return BANK_STATUS_LABEL[row.status];
  }

  statusTone(row: BankTransactionListItem) {
    return BANK_STATUS_TONE[row.status];
  }

  canOpen(view: CandidateView): boolean {
    return view.kind === 'payment' ? this.canReadPayments() : this.canReadInvoices();
  }

  aging(invoice: InvoiceListItem): string {
    const today = this.session.session()?.demo.today ?? '';
    return `Due ${this.date(invoice.dueDate)} · ${agingWords(invoice, today)}`;
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  date(iso: string): string {
    return formatDate(`${iso.slice(0, 10)}T12:00:00Z`);
  }

  failureTone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof financeAdvice>[0]): string {
    return financeAdvice(kind);
  }

  confirm(view: CandidateView): void {
    if (view.kind === 'payment') void this.matchPayment(view);
    else
      this.askInvoice({
        id: view.documentId,
        invoiceNumber: view.number,
        outstanding: view.amount,
      });
  }

  askInvoice(invoice: Pick<InvoiceListItem, 'id' | 'invoiceNumber' | 'outstanding'>): void {
    this.pending.set({ kind: 'invoice', invoice });
  }

  askCustomer(customerId: string): void {
    this.pending.set({
      kind: 'customer',
      customerId,
      customerName: this.store.customerName() ?? 'the customer',
    });
  }

  async confirmPending(): Promise<void> {
    const pending = this.pending();
    if (pending === null) return;
    const ok =
      pending.kind === 'invoice'
        ? await this.store.matchInvoice(pending.invoice.id)
        : await this.store.createForCustomer(pending.customerId);
    this.pending.set(null);
    if (ok)
      this.toasts.show({
        title: 'Deposit reconciled',
        description: this.outcomeWords(),
        tone: 'success',
      });
  }

  private async matchPayment(view: CandidateView): Promise<void> {
    if (await this.store.matchPayment(view.documentId))
      this.toasts.show({
        title: 'Deposit reconciled',
        description: this.outcomeWords(),
        tone: 'success',
      });
  }

  async ignore(reason: string): Promise<void> {
    const ok = await this.store.ignore(reason);
    this.ignoreOpen.set(false);
    if (ok) this.toasts.show({ title: 'Transaction ignored', tone: 'success' });
  }
}
