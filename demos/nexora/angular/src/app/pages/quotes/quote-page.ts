import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
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
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
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
  SlTableHead,
  SlTableLoader,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';
import { SlToastService } from '@slotted/angular/toast';
import {
  SlToolbar,
  SlToolbarItem,
  SlToolbarOverflow,
  SlToolbarSeparator,
} from '@slotted/angular/toolbar';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import type { Money } from '@slotted/demo-nexora-backend';

import { phoneSignal } from '../../core/layout/phone';
import { QuotesStore } from '../../core/sales/quotes.store';
import { SessionStore } from '../../core/session/session.store';
import { ApprovalPanel } from '../orders/approval-panel';
import {
  formatDate,
  formatMoney,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_TONE,
} from '../orders/order-labels';
import { ReasonDialog } from '../orders/reason-dialog';

/**
 * One quote (§58): its lines and totals, how long the customer still has, the
 * approval it may be waiting on, and the one command that turns it into an
 * order.
 */
@Component({
  selector: 'app-quote-page',
  imports: [
    NgIcon,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlIconButton,
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
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
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
    SlTableHead,
    SlTableLoader,
    SlTableRow,
    SlTableRowHeader,
    SlTag,
    SlTagBody,
    SlText,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlToolbarSeparator,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
    ApprovalPanel,
    ReasonDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .body {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
  `,
  template: `
    @if (store.recordError(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack routerLink="/sales/quotes">Quotes</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Quote</h1></div>
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
                    ? 'This quote does not exist'
                    : 'The quote could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ error.message }}</p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="store.loadRecord()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" routerLink="/sales/quotes">
                Back to quotes
              </a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.recordLoading() && store.detail() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack routerLink="/sales/quotes">Quotes</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ quote()?.quoteNumber ?? 'Quote' }}</h1>
                @if (quote(); as q) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()">
                      <span slTagBody>{{ statusWord() }}</span>
                    </span>
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every quote carries its status and its subheading: their boxes are kept, a small tag and a line. -->
                  <span slPageHeaderMarks>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="4rem"></span></span
                    ></span>
                  </span>
                  <p slPageHeaderSubheading>
                    <span slSkeleton shape="text" inlineSize="60%"></span>
                  </p>
                }
              </div>
              @if (quote(); as q) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Quote actions" overflow="menu">
                    @if (q.status === 'draft' && session.can('quotes.edit')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="submitItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          [loading]="store.busy() === 'submit'"
                          [messages]="{ loading: 'Submitting' }"
                          (click)="submit()"
                        >
                          Submit for approval
                        </button>
                      </div>
                    }
                    @if (canSend() && session.can('quotes.send')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="sendItem">
                        <button
                          slButton
                          type="button"
                          [loading]="store.busy() === 'send'"
                          [messages]="{ loading: 'Sending' }"
                          (click)="send()"
                        >
                          Send to the customer
                        </button>
                      </div>
                    }
                    @if (canAccept() && session.can('quotes.convert')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="acceptItem">
                        <button
                          slButton
                          type="button"
                          [loading]="store.busy() === 'accept'"
                          [messages]="{ loading: 'Marking accepted' }"
                          (click)="accept()"
                        >
                          Customer accepted
                        </button>
                      </div>
                      <div slToolbarItem [slToolbarItemCounterpart]="rejectItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          (click)="rejectOpen.set(true)"
                        >
                          Customer rejected
                        </button>
                      </div>
                    }
                    @if (q.status === 'accepted' && session.can('quotes.convert')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="convertItem">
                        <button
                          slButton
                          tone="accent"
                          type="button"
                          [loading]="store.busy() === 'convert'"
                          [messages]="{ loading: 'Making the order' }"
                          (click)="convert()"
                        >
                          Turn into an order
                        </button>
                      </div>
                    }
                    <!-- Approvers and the clock move this quote while the page is open (AF-07): the read keeps the values and marks the page busy. -->
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
                          [loading]="store.recordLoading()"
                          [messages]="{ loading: 'Refreshing' }"
                          (click)="store.loadRecord()"
                        >
                          <ng-icon name="lucideRefreshCw" />
                        </button>
                        <ng-template slTooltipLayer
                          ><div slTooltipContent>Refresh</div></ng-template
                        >
                      </ng-container>
                    </div>
                    @if (canCancel() && session.can('quotes.edit')) {
                      <div slToolbarSeparator></div>
                      <div slToolbarItem [slToolbarItemCounterpart]="cancelItem">
                        <button
                          slButton
                          variant="ghost"
                          tone="danger"
                          type="button"
                          [loading]="store.busy() === 'cancel'"
                          [messages]="{ loading: 'Cancelling' }"
                          (click)="cancel()"
                        >
                          Cancel quote
                        </button>
                      </div>
                    }
                    <sl-toolbar-overflow />
                  </div>
                </div>
              }
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="failure.kind === 'transport' ? 'danger' : 'warning'">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (quote(); as q) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Quote total</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(q.total) }}</span>
                    <p slStatCardComparison>{{ lineWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Margin</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ marginPercent() }}<span slStatCardUnit>%</span></span>
                    <p slStatCardComparison>{{ marginWords() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Validity</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ expiryFigure() }}</span>
                    <p slStatCardComparison>{{ expiryWords() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Discount</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(q.discountTotal) }}</span>
                    <p slStatCardComparison>off the list prices</p>
                  </div>
                </div>
              </div>
            } @else {
              <!--
                The four figures are what the answer always brings; the
                approval and the converted-order message belong to some quotes
                and not others, so they stand under the lines and the page
                grows downward when they arrive.
              -->
              <div slSkeletonRegion [messages]="{ label: 'Reading the quote' }" [loading]="true">
                <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                  @for (label of figureLabels; track label) {
                    <div slStatCard size="sm" loading>
                      <div slStatCardHeader>
                        <span slStatCardLabel>{{ label }}</span>
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

            <div
              slTable
              variant="framed"
              [columns]="phone() ? 2 : 5"
              [layout]="phone() ? 'fixed' : 'auto'"
            >
              <div slTableContent>
                <caption slTableCaption>
                  Lines
                </caption>
                <thead slTableHead>
                  <tr slTableRow>
                    <th slTableColumnHeader>Item</th>
                    @if (!phone()) {
                      <th slTableColumnHeader>Quantity</th>
                      <th slTableColumnHeader>Unit price</th>
                      <th slTableColumnHeader>Discount</th>
                    }
                    <th slTableColumnHeader>Line total</th>
                  </tr>
                </thead>
                @if (!store.detail()) {
                  <tbody slTableLoader [skeletonRows]="3"></tbody>
                } @else {
                  <tbody slTableBody>
                    @for (line of store.detail()!.lines; track line.id) {
                      <tr slTableRow>
                        <th slTableRowHeader>
                          <span slStack [gap]="1">
                            <span slText size="sm" weight="medium">{{ line.skuName }}</span>
                            <span slText size="sm" tone="muted">
                              {{ line.skuCode }} · line {{ line.lineNumber }}
                            </span>
                          </span>
                        </th>
                        @if (!phone()) {
                          <td slTableCell>{{ line.quantity }}</td>
                          <td slTableCell>{{ money(line.unitPrice) }}</td>
                          <td slTableCell>{{ discount(line.discountBps) }}</td>
                        }
                        <td slTableCell>{{ money(line.totalAmount) }}</td>
                      </tr>
                    }
                  </tbody>
                }
              </div>
            </div>
            <!-- Known only once the quote is read, so it stands under the lines rather than above them: what is measured does not move. -->
            @if (quote(); as q) {
              @if (store.detail()?.convertedOrder; as order) {
                <div slInlineMessage tone="success">
                  <span slInlineMessageIcon></span>
                  <span slInline [gap]="2">
                    This quote became
                    <a slLink [routerLink]="'/sales/orders/' + order.id">{{ order.orderNumber }}</a>
                    · {{ money(order.total) }}
                  </span>
                </div>
              }

              @if (store.detail()?.approval; as approval) {
                <section slSection>
                  <div slSectionHeader>
                    <div slSectionTitle><h2 slSectionHeading>Approval</h2></div>
                  </div>
                  <div slSectionBody>
                    <app-approval-panel [approval]="approval" [subject]="q.quoteNumber" />
                  </div>
                </section>
              }
            }
          </div>
        </div>

        <ng-template #submitItem>
          <button slMenuItem type="button" (click)="submit()">Submit for approval</button>
        </ng-template>
        <ng-template #sendItem>
          <button slMenuItem type="button" (click)="send()">Send to the customer</button>
        </ng-template>
        <ng-template #acceptItem>
          <button slMenuItem type="button" (click)="accept()">Customer accepted</button>
        </ng-template>
        <ng-template #rejectItem>
          <button slMenuItem type="button" (click)="rejectOpen.set(true)">Customer rejected</button>
        </ng-template>
        <ng-template #convertItem>
          <button slMenuItem type="button" (click)="convert()">Turn into an order</button>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (click)="store.loadRecord()">Refresh</button>
        </ng-template>
        <ng-template #cancelItem>
          <button slMenuItem type="button" (click)="cancel()">Cancel quote</button>
        </ng-template>

        <app-reason-dialog
          [(open)]="rejectOpen"
          title="The customer rejected this quote"
          description="The quote is closed with the reason, and stays on the account's history."
          label="What did they say?"
          placeholder="They went with the incumbent supplier on price."
          confirmLabel="Record the rejection"
          [busy]="store.busy() === 'reject'"
          (confirm)="reject($event)"
        />
      </div>
    }
  `,
})
export class QuotePage {
  readonly store = inject(QuotesStore);
  readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly quote = this.store.quote;
  readonly phone = phoneSignal();
  readonly rejectOpen = signal(false);
  /** The names of the four figures: chrome, and known before the answer is. */
  readonly figureLabels = ['Quote total', 'Margin', 'Validity', 'Discount'];

  readonly statusWord = computed(() => {
    const quote = this.quote();
    return quote === null ? '' : (QUOTE_STATUS_LABEL[quote.status] ?? quote.status);
  });

  readonly statusTone = computed<'secondary' | 'accent' | 'warning' | 'success' | 'danger'>(() => {
    const quote = this.quote();
    return quote === null ? 'secondary' : (QUOTE_STATUS_TONE[quote.status] ?? 'secondary');
  });

  readonly subheading = computed(() => {
    const quote = this.quote();
    if (quote === null) return '';
    const contact = this.store.detail()?.contact?.displayName;
    return `${quote.customerName}${contact ? ` (${contact})` : ''} · ${quote.ownerName} · written ${formatDate(quote.createdBusinessDate)}`;
  });

  readonly marginPercent = computed(() => Math.round((this.quote()?.grossMarginBps ?? 0) / 100));

  /**
   * The subtotal the margin is taken on, or the approval line it fell under
   * (§58: under 20% a Sales Manager approves, under 15% a Finance Manager as
   * well): the card's tone is the trend's (stat-card), so a crossing is words (RP-02).
   */
  readonly marginWords = computed(() => {
    const quote = this.quote();
    if (quote === null) return '';
    const margin = quote.grossMarginBps;
    if (margin < 1_500) return 'under 15%: Finance';
    if (margin < 2_000) return 'under 20%: Sales';
    // One line on a phone's card: the margin is measured on the goods, freight and tax left out.
    return 'on the goods alone';
  });

  readonly lineWord = computed(() => {
    const lines = this.store.detail()?.lines.length ?? 0;
    return lines === 1 ? '1 line' : `${lines} lines`;
  });

  readonly expiryFigure = computed(() => {
    const quote = this.quote();
    if (quote === null) return '';
    if (quote.status === 'converted') return 'Closed';
    const days = quote.daysToExpiry;
    return days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days} days`;
  });

  readonly expiryWords = computed(() => {
    const quote = this.quote();
    if (quote === null) return '';
    return quote.daysToExpiry < 0
      ? `Expired on ${formatDate(quote.expirationDate)}`
      : `Good until ${formatDate(quote.expirationDate)}`;
  });

  readonly canSend = computed(() => {
    const status = this.quote()?.status;
    return status === 'draft' || status === 'approved';
  });

  readonly canAccept = computed(() => {
    const status = this.quote()?.status;
    return status === 'sent' || status === 'viewed';
  });

  readonly canCancel = computed(() => {
    const status = this.quote()?.status;
    return status !== undefined && status !== 'converted' && status !== 'cancelled';
  });

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      void this.store.openRecord(id);
    });
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  discount(bps: number): string {
    return bps === 0 ? '—' : `${(bps / 100).toFixed(1)}%`;
  }

  advice(kind: string): string {
    return kind === 'conflict'
      ? 'The page has been read again: what you see is what Nexora holds now.'
      : kind === 'transport'
        ? 'Nothing was changed. Try the same action again in a moment.'
        : kind === 'permission'
          ? 'Ask the quote’s owner or a sales manager to do this one.'
          : 'Nothing was changed.';
  }

  async submit(): Promise<void> {
    if (await this.store.submit()) this.toasts.show({ title: 'Quote submitted', tone: 'success' });
  }

  async send(): Promise<void> {
    if (await this.store.send())
      this.toasts.show({ title: 'Quote sent to the customer', tone: 'success' });
  }

  async accept(): Promise<void> {
    if (await this.store.accept())
      this.toasts.show({ title: 'Marked as accepted', tone: 'success' });
  }

  async reject(reason: string): Promise<void> {
    if (await this.store.reject(reason)) {
      this.rejectOpen.set(false);
      this.toasts.show({ title: 'Rejection recorded', tone: 'warning' });
    }
  }

  async cancel(): Promise<void> {
    if (await this.store.cancel()) this.toasts.show({ title: 'Quote cancelled', tone: 'warning' });
  }

  /** The order the quote became is where the reader goes next. */
  async convert(): Promise<void> {
    const orderId = await this.store.convert();
    if (orderId === null) return;
    this.toasts.show({ title: 'The quote is now an order', tone: 'success' });
    void this.router.navigateByUrl(`/sales/orders/${orderId}`);
  }
}
