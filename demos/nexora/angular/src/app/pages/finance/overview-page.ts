import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
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
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardAction,
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
  SlTableSummary,
} from '@slotted/angular/table';
import { SlToolbar, SlToolbarItem, SlToolbarOverflow } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { ChartNumberFormat } from '@slotted/core/chart';
import type { Money } from '@slotted/demo-nexora-backend';

import { formatDate, formatMoney } from '../../core/catalog/catalog.model';
import {
  AGING_LABEL,
  addDaysTo,
  INVOICES_ROUTE,
  invoiceDoorParams,
  NEW_PAYMENT_ROUTE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENTS_ROUTE,
  RECONCILIATION_ROUTE,
  type FinanceOverview,
  type InvoiceDoor,
} from '../../core/finance/finance.model';
import {
  FinanceOverviewStore,
  OVERDUE_DANGER_SHARE,
  OVERDUE_WARNING_SHARE,
  OVERVIEW_ROWS,
  overdueShare,
  overdueTone,
} from '../../core/finance/finance-overview.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';

type FigureKey = 'receivables' | 'overdue' | 'disputed' | 'dueSoon' | 'cash' | 'dso' | 'unmatched' | 'unapplied';

/** Where a figure leads: the list it counts, with its condition in the address (OV-01). */
export interface FigureDoor {
  readonly route: string;
  readonly params: Record<string, string>;
  /** The read the list needs; a reader without it is not offered the door. */
  readonly permission: string;
}

/** One figure of the overview, as a card at the desk and as a row on a phone (OV-02). */
export interface Figure {
  readonly key: FigureKey;
  readonly label: string;
  /** The number, or null before the first answer. */
  readonly value: string | null;
  readonly unit?: string;
  /** One line on a card, which reserves one line for it while it loads. */
  readonly comparison: string;
  /** The row's second line on a phone, which has the width for it. */
  readonly description: string;
  readonly tone: 'neutral' | 'warning' | 'danger';
  readonly door: FigureDoor | null;
  /** The width a phone row reserves for the number: an amount, a count or a number of days. */
  readonly shape: string;
}

/**
 * The receivables the list counts as owed: open and with a balance. The
 * overview's own figure counts the same invoices (`openInvoiceCount`); the
 * door names the condition as `owing=1`, which `invoiceDoorFilter` reads.
 */
const OWING_PARAMS: Record<string, string> = { owing: '1' };

const invoices = (door: InvoiceDoor | Record<string, string>): FigureDoor => ({
  route: INVOICES_ROUTE,
  params: 'collection' in door || 'due' in door || 'aging' in door ? invoiceDoorParams(door as InvoiceDoor) : door,
  permission: 'invoices.view',
});

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

const shareWords = (overview: FinanceOverview): string => {
  const share = overdueShare(overview);
  return share === null ? '—' : percent.format(share);
};

/**
 * The line the overdue share crossed, said in the comparison: the card's own
 * `tone` is handed to its trend and paints nothing on a card without one, and
 * a badge in the header's `status` slot takes a second header line at a
 * quarter of the desk, moving every figure under it.
 */
const crossed = (overview: FinanceOverview): string => {
  const tone = overdueTone(overview);
  return tone === 'danger'
    ? `, above ${percent.format(OVERDUE_DANGER_SHARE)}`
    : tone === 'warning'
      ? `, above ${percent.format(OVERDUE_WARNING_SHARE)}`
      : '';
};

/**
 * The eight figures of §13's finance dashboard, in US dollars (§72.1). Each
 * figure that counts invoices, payments or deposits opens their list with its
 * condition (OV-01); DSO is a ratio and unapplied credit is spread over two
 * lists, payments and credit memos, so neither is a door. A door the reader
 * may not open is not drawn.
 */
export function financeFigures(
  overview: FinanceOverview | null,
  today: string,
  can: (permission: string) => boolean,
): readonly Figure[] {
  const o = overview;
  const usd = (value: Money | undefined) => (value ? formatMoney(value) : null);
  const month = today ? formatDate(`${today.slice(0, 8)}01T12:00:00Z`).replace(/, \d{4}$/, '') : '';
  const soon = today ? formatDate(`${addDaysTo(today, 5)}T12:00:00Z`).replace(/, \d{4}$/, '') : '';
  const figures: Figure[] = [
    {
      key: 'receivables',
      shape: '7rem',
      label: 'Receivables',
      value: usd(o?.receivables),
      comparison: o ? plural(o.openInvoiceCount, 'open invoice') : 'open invoices',
      description: 'owed on open invoices',
      tone: 'neutral',
      door: invoices(OWING_PARAMS),
    },
    {
      key: 'overdue',
      shape: '7rem',
      label: 'Overdue',
      value: usd(o?.overdueReceivables),
      comparison: o ? `${shareWords(o)} of receivables${crossed(o)}` : 'of receivables',
      description: o
        ? `${plural(o.overdueInvoiceCount, 'invoice')}, ${shareWords(o)} of receivables${crossed(o)}`
        : 'invoices past due, not disputed',
      tone: o ? overdueTone(o) : 'neutral',
      door: invoices({ collection: 'overdue' }),
    },
    {
      key: 'disputed',
      shape: '6rem',
      label: 'Disputed',
      value: usd(o?.disputedReceivables),
      comparison: o ? plural(o.disputedInvoiceCount, 'invoice') : 'invoices',
      description: 'held by the customer; still aging',
      tone: 'neutral',
      door: invoices({ collection: 'disputed' }),
    },
    {
      key: 'dueSoon',
      shape: '1.5rem',
      label: 'Due within 5 days',
      value: o ? o.invoicesDueWithin5Days.toLocaleString('en-US') : null,
      comparison: soon ? `invoices due by ${soon}` : 'invoices',
      description: soon ? `open invoices due from today to ${soon}` : 'open invoices due in five days',
      tone: 'neutral',
      door: invoices({ due: 'soon' }),
    },
    {
      key: 'cash',
      shape: '7rem',
      label: 'Collected this month',
      value: usd(o?.cashCollectedMonthToDate),
      comparison: o ? `${plural(o.paymentsReceivedMonthToDate, 'payment')} since ${month}` : `payments since ${month}`,
      description: `posted payments received since ${month}`,
      tone: 'neutral',
      door: { route: PAYMENTS_ROUTE, params: { received: 'month' }, permission: 'payments.view' },
    },
    {
      key: 'dso',
      shape: '3.5rem',
      label: 'Days sales outstanding',
      value: o ? (o.dsoDays === null ? '—' : o.dsoDays.toLocaleString('en-US')) : null,
      ...(o?.dsoDays !== null && o !== null ? { unit: o.dsoDays === 1 ? 'day' : 'days' } : {}),
      // §72.7 over a base the window does not hold is no ratio: the figure says which of the two it lacks.
      comparison:
        o?.dsoDays === null
          ? o.dsoUndefined === 'not-kept'
            ? `needs 90 days of invoices`
            : 'nothing invoiced in 90 days'
          : 'on 90 days of invoicing',
      description:
        o?.dsoDays === null
          ? o.dsoUndefined === 'not-kept'
            ? `undefined: invoices are kept from ${formatDate(`${o.keptFrom}T12:00:00Z`)}, fewer than 90 days`
            : 'undefined: nothing was invoiced in the last 90 days'
          : 'receivables against the last 90 days invoiced',
      tone: 'neutral',
      door: null,
    },
    {
      key: 'unmatched',
      shape: '2rem',
      label: 'Deposits to reconcile',
      value: o ? o.unmatchedBankTransactions.toLocaleString('en-US') : null,
      comparison: 'bank transactions',
      description: 'bank deposits with no payment matched yet',
      tone: 'neutral',
      door: { route: RECONCILIATION_ROUTE, params: {}, permission: 'reconciliation.view' },
    },
    {
      key: 'unapplied',
      shape: '4.5rem',
      label: 'Unapplied credit',
      value: usd(o?.unappliedCredit),
      comparison: 'payments and credit memos',
      description: 'not yet applied to an invoice',
      tone: 'neutral',
      door: null,
    },
  ];
  return figures.map((figure) =>
    figure.door && !can(figure.door.permission) ? { ...figure, door: null } : figure,
  );
}

/**
 * The finance overview (§13 "Finance dashboard metrics", §20 Journey C's first
 * step): what is owed and how late, what came in, and where a collector
 * starts. Every amount is in US dollars at each document's own rate (§72.1);
 * the lists behind the doors draw each document in its own currency.
 *
 * §13's aging buckets decompose the receivables figure, so their table ends
 * in the row that adds them back up (RP-07); the buckets and the weeks of cash
 * are drawn as bar charts of one series each (the `dataviz` skill: magnitude
 * over ordered categories, one hue, no legend for one series, the family's
 * table view for the numbers). On a phone the figures are a list of doors,
 * then the invoices to call about, the accounts behind them, the charts and
 * the payments last received (OV-02).
 */
@Component({
  selector: 'app-finance-overview-page',
  imports: [
    NgTemplateOutlet,
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
    SlSkeleton,
    SlStack,
    SlStatCard,
    SlStatCardAction,
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
    SlTableSummary,
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
      grid-template-areas: 'figures' 'invoices' 'customers' 'aging' 'cash' 'recent';
      gap: var(--slotted-space-6);
    }
    .figures {
      grid-area: figures;
    }
    .invoices {
      grid-area: invoices;
    }
    .customers {
      grid-area: customers;
    }
    .aging {
      grid-area: aging;
    }
    .cash {
      grid-area: cash;
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
          'invoices customers'
          'aging cash'
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
    .value-shape {
      display: block;
    }
    /* A row's placeholder under a coarse pointer is as tall as the link it stands in for. */
    @media (pointer: coarse) {
      .row-shape {
        display: block;
        line-height: var(--slotted-target-comfortable);
      }
    }
    .late {
      color: var(--slotted-tone-danger-text);
    }

  `,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>Finance</h1>
              <p slPageHeaderSubheading>{{ subheading() }}</p>
            </div>
            <div slPageHeaderActions>
              <div slToolbar aria-label="Finance actions" overflow="menu">
                @if (canRecord()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="recordItem">
                    <a slButtonLink data-testid="record-payment" [routerLink]="newPayment">Record payment</a>
                  </div>
                }
                @if (canInvoices()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="invoicesItem">
                    <a slButtonLink variant="outline" tone="secondary" [routerLink]="invoicesRoute">All invoices</a>
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
            @if (neverAnswered()) {
              <!-- No answer yet and the last read failed: the figures are not drawn as zeros (§77.10). -->
              <div slResultState status="error" reach="section" data-testid="figures-failed">
                <div slResultStateContent>
                  <h2 slResultStateTitle>The finance figures did not arrive</h2>
                  <p slResultStateDescription>Nexora did not answer the summary. Nothing is shown rather than a zero that is not true.</p>
                </div>
                <div slResultStateActions>
                  <button slButton type="button" data-testid="figures-retry" [loading]="store.overview().pending" [messages]="{ loading: 'Asking again' }" (click)="retry()">
                    Try again
                  </button>
                </div>
              </div>
            } @else if (phone()) {
              <!--
                On a phone the figures are a list of doors (OV-02): eight cards two by two fill
                the first screen before a single invoice is named. A row is the door, a touch
                target tall; a figure that is not a door is a row with no link.
              -->
              <ul slList variant="ruled" aria-label="Receivables and cash" data-testid="figures">
                @for (figure of figures(); track figure.key) {
                  <li slListItem [attr.data-figure]="figure.key">
                    @if (figure.door; as door) {
                      <a slListItemContent [routerLink]="door.route" [queryParams]="door.params">
                        <ng-container *ngTemplateOutlet="row; context: { $implicit: figure }" />
                      </a>
                    } @else {
                      <span slListItemContent>
                        <ng-container *ngTemplateOutlet="row; context: { $implicit: figure }" />
                      </span>
                    }
                  </li>
                }
              </ul>
            } @else {
              <div slGrid [columns]="4" minItemWidth="xs" [gap]="4" data-testid="figures">
                @for (figure of figures(); track figure.key) {
                  <div slStatCard size="sm" [attr.data-figure]="figure.key" [loading]="figure.value === null">
                    <div slStatCardHeader>
                      <span slStatCardLabel>{{ figure.label }}</span>
                      @if (figure.door; as door) {
                        <span slStatCardAction>
                          <a slLink [routerLink]="door.route" [queryParams]="door.params" [attr.aria-label]="'Open ' + figure.label.toLowerCase()">Open</a>
                        </span>
                      }
                    </div>
                    <div slStatCardFigure>
                      <span slStatCardValue>{{ figure.value ?? '—' }}@if (figure.unit) {<span slStatCardUnit>{{ figure.unit }}</span>}</span>
                      <p slStatCardComparison>{{ figure.comparison }}</p>
                    </div>
                  </div>
                }
              </div>
            }
            @if (staleFailure()) {
              <div slInlineMessage tone="warning" data-testid="figures-stale">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">The figures could not be read again; these are the last Nexora gave.</span>
                  <span><button slButton size="sm" variant="outline" tone="secondary" type="button" (click)="retry()">Try again</button></span>
                </span>
              </div>
            }
            <!-- Known before the answer: drawn in both states, so nothing moves when the figures land. -->
            <span slText size="sm" tone="muted" data-testid="figures-rule">{{ ruleWords }}</span>
          </div>

          <section slSection class="invoices">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Call about these first</h2></div>
              @if (canInvoices()) {
                <div slSectionActions>
                  <!-- The count is the overdue figure's; words known before the answer keep the heading's line. -->
                  <a slButtonLink variant="ghost" tone="secondary" size="sm" [routerLink]="invoicesRoute" [queryParams]="overdueParams">All overdue</a>
                </div>
              }
            </div>
            <div slSectionBody>
              <!-- On a phone the table keeps what decides (RP-03): the invoice and what it owes; the caption says the order. -->
              <div slTable variant="framed" [columns]="phone() ? 2 : 4" [layout]="phone() ? 'fixed' : 'auto'" data-testid="overdue-invoices">
                <div slTableContent>
                  <caption slTableCaption>Overdue invoices, longest past due first</caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>Invoice</th>
                      @if (!phone()) {
                        <th slTableColumnHeader>Customer</th>
                      }
                      @if (!phone()) {
                        <th slTableColumnHeader align="end" numeric>Past due</th>
                      }
                      <th slTableColumnHeader align="end" numeric>Outstanding</th>
                    </tr>
                  </thead>
                  @if (store.overdue().value; as overdue) {
                    @if (overdue.rows.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow><td slTableEmpty>
                          <div slResultState status="empty" reach="section">
                            <div slResultStateContent>
                              <h3 slResultStateTitle>Nothing is overdue</h3>
                              <p slResultStateDescription>Every open invoice is within its terms or disputed.</p>
                            </div>
                          </div>
                        </td></tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody [attr.aria-busy]="store.overdue().pending ? 'true' : null">
                        @for (row of overdue.rows; track row.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="[invoicesRoute, row.id]" [title]="(row.invoiceNumber ?? 'Draft') + ' · ' + row.customerName">
                                {{ row.invoiceNumber ?? 'Draft' }}
                              </a>
                            </th>
                            @if (!phone()) {
                              <td slTableCell><span class="cell-text" [title]="row.customerName">{{ row.customerName }}</span></td>
                            }
                            @if (!phone()) {
                              <td slTableCell align="end" numeric><span class="late">{{ days(row.daysOverdue) }}</span></td>
                            }
                            <td slTableCell align="end" numeric>{{ money(row.outstanding) }}</td>
                          </tr>
                        }
                      </tbody>
                    }
                  } @else if (store.overdue().failed) {
                    <tbody slTableBody>
                      <tr slTableRow><td slTableEmpty>
                        <div slResultState status="error" reach="section">
                          <div slResultStateContent>
                            <h3 slResultStateTitle>The overdue invoices did not arrive</h3>
                            <p slResultStateDescription><button slButton size="sm" type="button" (click)="retry()">Try again</button></p>
                          </div>
                        </div>
                      </td></tr>
                    </tbody>
                  } @else {
                    <tbody slTableBody>
                      @for (row of placeholderRows; track row) {
                        <tr slTableRow>
                          <th slTableRowHeader><span class="row-shape"><span slSkeleton shape="text" inlineSize="70%"></span></span></th>
                          @if (!phone()) {
                            <td slTableCell><span slSkeleton shape="text" inlineSize="60%"></span></td>
                          }
                          @if (!phone()) {
                            <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="3rem"></span></td>
                          }
                          <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                        </tr>
                      }
                    </tbody>
                  }
                </div>
              </div>
              <span slText size="sm" tone="muted">{{ phone() ? 'Longest past due first; each balance is in its invoice’s own currency.' : 'Each invoice’s balance is in its own currency.' }}</span>
            </div>
          </section>

          <section slSection class="customers">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Largest overdue balances</h2></div>
            </div>
            <div slSectionBody>
              <div slTable variant="framed" [columns]="2" [layout]="phone() ? 'fixed' : 'auto'" data-testid="overdue-customers">
                <div slTableContent>
                  <caption slTableCaption>Customers by what they owe past due, in US dollars</caption>
                  <thead slTableHead>
                    <tr slTableRow>
                      <th slTableColumnHeader>Customer</th>
                      <th slTableColumnHeader align="end" numeric>Overdue</th>
                    </tr>
                  </thead>
                  @if (store.overview().value; as overview) {
                    @if (overview.topOverdueCustomers.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow><td slTableEmpty>
                          <div slResultState status="empty" reach="section">
                            <div slResultStateContent>
                              <h3 slResultStateTitle>No customer is overdue</h3>
                            </div>
                          </div>
                        </td></tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (row of overview.topOverdueCustomers; track row.customerId) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              @if (canCustomers()) {
                                <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="['/crm/customers', row.customerId]" [title]="row.displayName">{{ row.displayName }}</a>
                              } @else {
                                <span class="cell-text" [title]="row.displayName">{{ row.displayName }}</span>
                              }
                            </th>
                            <td slTableCell align="end" numeric>{{ money(row.overdue) }}</td>
                          </tr>
                        }
                      </tbody>
                    }
                  } @else if (store.overview().failed) {
                    <tbody slTableBody>
                      <tr slTableRow><td slTableEmpty>
                        <div slResultState status="error" reach="section">
                          <div slResultStateContent>
                            <h3 slResultStateTitle>The balances did not arrive</h3>
                            <p slResultStateDescription><button slButton size="sm" type="button" (click)="retry()">Try again</button></p>
                          </div>
                        </div>
                      </td></tr>
                    </tbody>
                  } @else {
                    <tbody slTableBody>
                      @for (row of placeholderRows; track row) {
                        <tr slTableRow>
                          <th slTableRowHeader><span class="row-shape"><span slSkeleton shape="text" inlineSize="65%"></span></span></th>
                          <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                        </tr>
                      }
                    </tbody>
                  }
                </div>
              </div>
            </div>
          </section>

          <section slSection class="aging">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Receivables by age</h2></div>
            </div>
            <div slSectionBody>
              <div slStack [gap]="4">
                <figure
                  slChart
                  data-testid="aging-chart"
                  title="Past due, by how long"
                  description="What open invoices past their due date still owe, disputed ones included, in US dollars; the table below adds the invoices not yet due"
                  [size]="phone() ? 'sm' : 'md'"
                  locale="en-US"
                  toolbar="hover"
                  [legend]="false"
                  [data]="agingData()"
                  [series]="agingSeries"
                  [x]="{ field: 'label' }"
                  [y]="{ label: 'US dollars', format: dollars }"
                  [loading]="store.overview().value === null && !store.overview().failed"
                  [error]="store.overview().value === null && store.overview().failed"
                  (retry)="retry()"
                ></figure>
                <div slTable variant="framed" [columns]="3" [layout]="phone() ? 'fixed' : 'auto'" data-testid="aging-table">
                  <div slTableContent>
                    <caption slTableCaption>Open invoices that owe, by days past due</caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Past due</th>
                        <th slTableColumnHeader align="end" numeric>Invoices</th>
                        <th slTableColumnHeader align="end" numeric>Outstanding</th>
                      </tr>
                    </thead>
                    <tbody slTableBody>
                      @for (bucket of agingRows(); track bucket.bucket) {
                        <tr slTableRow>
                          <th slTableRowHeader>
                            @if (canInvoices()) {
                              <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="invoicesRoute" [queryParams]="bucket.params">{{ bucket.label }}</a>
                            } @else {
                              <span class="cell-text">{{ bucket.label }}</span>
                            }
                          </th>
                          @if (bucket.count === null) {
                            <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="2.5rem"></span></td>
                            <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                          } @else {
                            <td slTableCell align="end" numeric>{{ bucket.count }}</td>
                            <td slTableCell align="end" numeric>{{ bucket.amount }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                    <tfoot slTableSummary>
                      <tr slTableRow>
                        <th slTableRowHeader>Receivables</th>
                        @if (store.overview().value; as overview) {
                          <td slTableCell align="end" numeric data-testid="aging-count">{{ overview.openInvoiceCount.toLocaleString('en-US') }}</td>
                          <td slTableCell align="end" numeric data-testid="aging-total">{{ money(overview.receivables) }}</td>
                        } @else {
                          <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="2.5rem"></span></td>
                          <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                        }
                      </tr>
                    </tfoot>
                  </div>
                </div>
                <span slText size="sm" tone="muted">
                  A disputed invoice keeps aging (§66.5). The five rows add up to the receivables figure.
                </span>
              </div>
            </div>
          </section>

          <section slSection class="cash">
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Cash collected</h2></div>
            </div>
            <div slSectionBody>
              <figure
                slChart
                data-testid="cash-chart"
                title="Cash collected, week by week"
                [description]="cashDescription()"
                [size]="phone() ? 'sm' : 'md'"
                locale="en-US"
                toolbar="hover"
                [legend]="false"
                [data]="cashData()"
                [series]="cashSeries"
                [x]="{ field: 'label' }"
                [y]="{ label: 'US dollars', format: dollars }"
                [loading]="store.overview().value === null && !store.overview().failed"
                [error]="store.overview().value === null && store.overview().failed"
                (retry)="retry()"
              ></figure>
            </div>
          </section>

          @if (canPayments()) {
            <section slSection class="recent">
              <div slSectionHeader>
                <div slSectionTitle><h2 slSectionHeading>Payments last received</h2></div>
                <div slSectionActions>
                  <a slButtonLink variant="ghost" tone="secondary" size="sm" [routerLink]="paymentsRoute">All payments</a>
                </div>
              </div>
              <div slSectionBody>
                <div slTable variant="framed" [columns]="phone() ? 3 : 5" [layout]="phone() ? 'fixed' : 'auto'" data-testid="recent-payments">
                  <div slTableContent>
                    <caption slTableCaption>The payments Nexora holds, newest first</caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Payment</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Customer</th>
                          <th slTableColumnHeader>Status</th>
                        }
                        <th slTableColumnHeader>Received</th>
                        <th slTableColumnHeader align="end" numeric>Amount</th>
                      </tr>
                    </thead>
                    @if (store.recent().value; as recent) {
                      @if (recent.length === 0) {
                        <tbody slTableBody>
                          <tr slTableRow><td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No payment has been received yet</h3>
                              </div>
                            </div>
                          </td></tr>
                        </tbody>
                      } @else {
                        <tbody slTableBody [attr.aria-busy]="store.recent().pending ? 'true' : null">
                          @for (row of recent; track row.id) {
                            <tr slTableRow>
                              <th slTableRowHeader>
                                <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="[paymentsRoute, row.id]" [title]="row.paymentNumber + ' · ' + row.customerName">{{ row.paymentNumber }}</a>
                              </th>
                              @if (!phone()) {
                                <td slTableCell><span class="cell-text" [title]="row.customerName">{{ row.customerName }}</span></td>
                                <td slTableCell><span slBadge variant="soft" size="sm" [tone]="paymentTone(row.status)">{{ paymentWord(row.status) }}</span></td>
                              }
                              <td slTableCell>{{ date(row.receivedDate) }}</td>
                              <td slTableCell align="end" numeric>{{ money(row.amount) }}</td>
                            </tr>
                          }
                        </tbody>
                      }
                    } @else if (store.recent().failed) {
                      <tbody slTableBody>
                        <tr slTableRow><td slTableEmpty>
                          <div slResultState status="error" reach="section">
                            <div slResultStateContent>
                              <h3 slResultStateTitle>The payments did not arrive</h3>
                              <p slResultStateDescription><button slButton size="sm" type="button" (click)="retry()">Try again</button></p>
                            </div>
                          </div>
                        </td></tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (row of placeholderRows; track row) {
                          <tr slTableRow>
                            <th slTableRowHeader><span class="row-shape"><span slSkeleton shape="text" inlineSize="70%"></span></span></th>
                            @if (!phone()) {
                              <td slTableCell><span slSkeleton shape="text" inlineSize="60%"></span></td>
                              <td slTableCell><span slSkeleton shape="text" inlineSize="3.5rem"></span></td>
                            }
                            <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                            <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="4.5rem"></span></td>
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              </div>
            </section>
          }
        </div>
      </div>

      <ng-template #row let-figure>
        <span slListItemBody>
          <span slListItemLabel>{{ figure.label }}</span>
          <span slListItemDescription>{{ figure.description }}</span>
        </span>
        <span slListItemEnd>
          @if (figure.value === null) {
            <!-- A block around the bar takes the line of the number it stands in for, wherever the row puts it. -->
            <span class="value-shape"><span slSkeleton shape="text" [inlineSize]="figure.shape"></span></span>
          } @else {
            {{ figure.value }}{{ figure.unit ? ' ' + figure.unit : '' }}
          }
        </span>
      </ng-template>
      <ng-template #recordItem><a slMenuItem [routerLink]="newPayment">Record payment</a></ng-template>
      <ng-template #invoicesItem><a slMenuItem [routerLink]="invoicesRoute">All invoices</a></ng-template>
    </div>
  `,
})
export class FinanceOverviewPage {
  readonly store = inject(FinanceOverviewStore);
  private readonly session = inject(SessionStore);

  readonly invoicesRoute = INVOICES_ROUTE;
  readonly paymentsRoute = PAYMENTS_ROUTE;
  readonly newPayment = NEW_PAYMENT_ROUTE;
  readonly overdueParams = invoiceDoorParams({ collection: 'overdue' });
  readonly placeholderRows = Array.from({ length: OVERVIEW_ROWS }, (_, index) => index);
  readonly phone = phoneSignal();

  readonly ruleWords = `Amounts are in US dollars at each invoice's own rate. Overdue is a warning from ${percent.format(OVERDUE_WARNING_SHARE)} of receivables and a danger from ${percent.format(OVERDUE_DANGER_SHARE)}.`;

  /** Whole dollars on the axis: the bars compare magnitudes, the table under them holds the cents. */
  readonly dollars: ChartNumberFormat = { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 };

  readonly agingSeries = [{ id: 'amount', kind: 'bar', field: 'amount', label: 'Outstanding' }] as const;
  readonly cashSeries = [{ id: 'amount', kind: 'bar', field: 'amount', label: 'Collected' }] as const;

  private readonly can = (permission: string): boolean => {
    void this.session.session();
    return this.session.can(permission);
  };

  readonly canRecord = computed(() => this.can('payments.record'));
  readonly canInvoices = computed(() => this.can('invoices.view'));
  readonly canPayments = computed(() => this.can('payments.view'));
  readonly canCustomers = computed(() => this.can('customers.view'));

  readonly figures = computed(() =>
    financeFigures(this.store.overview().value, this.store.today(), (permission) => this.can(permission)),
  );

  /** No answer has ever arrived and the last read failed. */
  readonly neverAnswered = computed(() => this.store.overview().value === null && this.store.overview().failed);
  /** An answer is on screen and the read after it failed (AF-02: the figures stay). */
  readonly staleFailure = computed(() => this.store.overview().value !== null && this.store.overview().failed);

  readonly subheading = computed(() => {
    const today = this.store.today();
    return today ? `Receivables and cash · as of ${formatDate(`${today}T12:00:00Z`)}` : 'Receivables and cash';
  });


  /** The five buckets of §72.6 in their order; each one a door with its pills (OV-01). */
  readonly agingRows = computed(() => {
    const overview = this.store.overview().value;
    const buckets = (Object.keys(AGING_LABEL) as (keyof typeof AGING_LABEL)[]).map((bucket) => ({
      bucket,
      label: AGING_LABEL[bucket],
      params: invoiceDoorParams({ aging: bucket }),
      count: null as string | null,
      amount: null as string | null,
    }));
    if (overview === null) return buckets;
    return buckets.map((row) => {
      const entry = overview.aging.find((candidate) => candidate.bucket === row.bucket);
      return {
        ...row,
        count: (entry?.count ?? 0).toLocaleString('en-US'),
        amount: formatMoney(entry?.amount ?? { currency: 'USD', minor: 0 }),
      };
    });
  });

  readonly agingData = computed(() =>
    // The invoices not yet due are most of any book and would flatten the four bars that say how late the rest is.
    (this.store.overview().value?.aging ?? []).filter((entry) => entry.bucket !== 'current').map((entry) => ({
      label: AGING_LABEL[entry.bucket],
      amount: entry.amount.minor / 100,
    })),
  );

  readonly cashDescription = computed(() => {
    const overview = this.store.overview().value;
    const base = 'Posted payments by the week they were received, each week named by its first day, the last eight weeks to today, in US dollars';
    return overview && overview.cashCollectedByWeek.some((week) => !week.kept)
      ? `${base}; payments are kept from ${formatDate(`${overview.keptFrom}T12:00:00Z`)}, and a week before that draws no bar`
      : base;
  });

  readonly cashData = computed(() =>
    // A week before payments are kept draws no bar: its cash is not known, and nought would say it is (§75.4).
    (this.store.overview().value?.cashCollectedByWeek ?? []).map((week) => ({
      // Eight labels share a phone's plot: the short form keeps them from overlapping.
      label: this.phone()
        ? `${Number(week.weekStart.slice(5, 7))}/${Number(week.weekStart.slice(8, 10))}`
        : formatDate(`${week.weekStart}T12:00:00Z`).replace(/, \d{4}$/, ''),
      amount: week.kept ? week.amount.minor / 100 : null,
    })),
  );

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
    void this.store.retry();
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  date(iso: string): string {
    return formatDate(`${iso.slice(0, 10)}T12:00:00Z`);
  }

  days(n: number): string {
    return `${n} ${n === 1 ? 'day' : 'days'}`;
  }

  paymentWord(status: keyof typeof PAYMENT_STATUS_LABEL): string {
    return PAYMENT_STATUS_LABEL[status];
  }

  paymentTone(status: keyof typeof PAYMENT_STATUS_TONE) {
    return PAYMENT_STATUS_TONE[status];
  }
}
