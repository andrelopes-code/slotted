import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlBadge } from '@slotted/angular/badge';
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
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableEmpty,
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
import { invoiceDisplayStatus, type Invoice, type Money } from '@slotted/demo-nexora-backend';

import {
  FINANCE_HOLDERS,
  INVOICE_STATUS_LABEL,
  INVOICES_ROUTE,
} from '../../core/finance/finance.model';

import { phoneSignal } from '../../core/layout/phone';
import { INBOX_ROUTE, NEW_TICKET_ROUTE } from '../../core/support/support.model';
import { OrderStore } from '../../core/sales/order.store';
import { SessionStore } from '../../core/session/session.store';
import { ApprovalPanel } from './approval-panel';
import {
  ALLOCATION_LABEL,
  formatDate,
  formatMoney,
  INVOICE_LABEL,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_LABEL,
  RISK_LABEL,
  RISK_TONE,
} from './order-labels';
import { OrderProgress } from './order-progress';
import { ReasonDialog } from './reason-dialog';

type View = 'lines' | 'shipments' | 'invoices' | 'tickets';

/**
 * The sales order workspace (§34.3): where the order is, what blocks it, what
 * it holds and what this persona may do about it.
 */
@Component({
  selector: 'app-order-page',
  imports: [
    NgIcon,
    RouterLink,
    SlBadge,
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
    SlTab,
    SlTabList,
    SlTabs,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableEmpty,
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
    OrderProgress,
    ReasonDialog,
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
    .short {
      color: var(--slotted-tone-danger-text);
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
    /* The five steps of the cycle, in the boxes the progress element gives them. */
    .steps-shape {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
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
    /* Exactly the lines the loaded step reserves: its label over its detail. */
    .step-words-shape {
      display: block;
      overflow: hidden;
      block-size: calc(
        var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm) +
          var(--slotted-space-1)
      );
    }
    /* The sentence's lines, exactly: a skeleton line stands taller than a line of the sentence's text. */
    .sentence-shape {
      display: block;
      overflow: hidden;
      block-size: calc(
        var(--_lines, 0) * var(--slotted-font-size-sm) * var(--slotted-line-height-sm)
      );
    }
  `,
  template: `
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack routerLink="/sales/orders">Sales orders</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Sales order</h1></div>
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
                    ? 'This order does not exist'
                    : 'The order could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ error.message }}</p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="ghost" tone="secondary" routerLink="/sales/orders">
                Back to orders
              </a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.detail() !== null">
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack routerLink="/sales/orders">Sales orders</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ order()?.orderNumber ?? 'Sales order' }}</h1>
                @if (order(); as o) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone()">
                      <span slTagBody>{{ statusWord() }}</span>
                    </span>
                    @if (o.approvalStatus === 'pending') {
                      <span slTag size="sm" tone="warning">
                        <span slTagBody>Approval waiting</span>
                      </span>
                    }
                  </span>
                  <p slPageHeaderSubheading>{{ subheading() }}</p>
                } @else {
                  <!-- Every order carries its status and its subheading: their boxes are kept, a small tag and a line. -->
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
              @if (order(); as o) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Order actions" overflow="menu">
                    @if (o.status === 'draft' && session.can('orders.submit')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="submitItem">
                        <button
                          slButton
                          type="button"
                          [loading]="store.busy() === 'submit'"
                          [messages]="{ loading: 'Submitting' }"
                          (click)="submit()"
                        >
                          Submit
                        </button>
                      </div>
                    }
                    @if (o.status === 'on_hold' && session.can('orders.release_hold')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="releaseItem">
                        <button
                          slButton
                          variant="outline"
                          type="button"
                          [loading]="store.busy() === 'release'"
                          [messages]="{ loading: 'Releasing' }"
                          (click)="release()"
                        >
                          Release hold
                        </button>
                      </div>
                    } @else if (canHold() && session.can('orders.hold')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="holdItem">
                        <button
                          slButton
                          variant="outline"
                          tone="secondary"
                          type="button"
                          (click)="holdOpen.set(true)"
                        >
                          Place on hold
                        </button>
                      </div>
                    }
                    <!-- Approvers, the clock and other allocations move this order while the page is open (AF-07): the read keeps the values and marks the page busy. -->
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
                    @if (canCancel() && session.can('orders.cancel')) {
                      <div slToolbarSeparator></div>
                      @if (hasShipped()) {
                        <div slToolbarItem [slToolbarItemCounterpart]="remainingItem">
                          <button
                            slButton
                            variant="ghost"
                            tone="danger"
                            type="button"
                            (click)="remainingOpen.set(true)"
                          >
                            Cancel what is left
                          </button>
                        </div>
                      } @else {
                        <div slToolbarItem [slToolbarItemCounterpart]="cancelItem">
                          <button
                            slButton
                            variant="ghost"
                            tone="danger"
                            type="button"
                            (click)="cancelOpen.set(true)"
                          >
                            Cancel order
                          </button>
                        </div>
                      }
                    }
                    @if (canInvoice()) {
                      <!-- The action that adds to a tab stands in the toolbar while that tab is open (RP-05). -->
                      <div slToolbarItem [slToolbarItemCounterpart]="invoiceItem">
                        <button
                          slButton
                          type="button"
                          data-testid="create-invoice"
                          [loading]="store.busy() === 'invoice'"
                          [messages]="{ loading: 'Creating the invoice' }"
                          (click)="createInvoice()"
                        >
                          Create invoice
                        </button>
                      </div>
                    }
                    @if (view() === 'tickets' && session.can('support.create')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="ticketItem">
                        <a
                          slButtonLink
                          variant="ghost"
                          data-testid="new-ticket"
                          [routerLink]="newTicketRoute"
                          [queryParams]="{ customer: o.customerId, order: o.id }"
                        >
                          New ticket
                        </a>
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
              <div slTabList aria-label="Order sections">
                <div slTab value="lines">Lines {{ count(detail()?.lines?.length) }}</div>
                <div slTab value="shipments">
                  Shipments {{ count(detail()?.shipments?.length) }}
                </div>
                <div slTab value="invoices">Invoices {{ count(detail()?.invoices?.length) }}</div>
                <div slTab value="tickets">Tickets {{ count(detail()?.tickets?.length) }}</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            <!-- What the last command answered, in the words of the thing that refused it. -->
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="failure.kind === 'transport' ? 'danger' : 'warning'">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }

            @if (order(); as o) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Order total</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(o.total) }}</span>
                    <p slStatCardComparison>{{ lineWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Margin</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>
                      {{ marginPercent() }}<span slStatCardUnit>%</span>
                    </span>
                    <p slStatCardComparison>{{ marginWords() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Reserved</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue
                      >{{ reservedPercent() }}<span slStatCardUnit>%</span></span
                    >
                    <p slStatCardComparison>{{ allocationWord() }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Shipped</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ shippedPercent() }}<span slStatCardUnit>%</span></span>
                    <p slStatCardComparison>{{ invoiceWord() }}</p>
                  </div>
                </div>
              </div>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                </div>
                <div slSectionBody>
                  <app-order-progress
                    [order]="o"
                    [sentenceLines]="sentenceLines()"
                    [stepLines]="stepLines()"
                  />
                </div>
              </section>
            } @else {
              <!--
                The wait reserves what the answer always brings: the four
                figures and the section that says where the order stands, in
                the boxes they will occupy. What some orders carry and others
                do not stands under the tabs' content and is not reserved.
              -->
              <div slSkeletonRegion [messages]="{ label: 'Reading the order' }" [loading]="true">
                <div slStack [gap]="6">
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
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>Where it stands</h2></div>
                    </div>
                    <div slSectionBody>
                      <div slStack [gap]="3">
                        <!-- The progress's anatomy: five steps, each its bar over its label and detail, then the sentence, in the lines the loaded element keeps. -->
                        <div class="steps-shape">
                          @for (step of [1, 2, 3, 4, 5]; track step) {
                            <span class="step-shape">
                              <span class="step-bar"></span>
                              <span class="step-words-shape" [style.--_lines]="stepLines()">
                                <span slSkeletonText [lines]="1" lastLineSize="60%"></span>
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
                <div
                  slTable
                  variant="framed"
                  [columns]="phone() ? 2 : 6"
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
                          <th slTableColumnHeader>Ordered</th>
                          <th slTableColumnHeader>Reserved</th>
                          <th slTableColumnHeader>Shipped</th>
                          <th slTableColumnHeader>Unit price</th>
                        }
                        <th slTableColumnHeader>Line total</th>
                      </tr>
                    </thead>
                    @if (!detail()) {
                      <tbody slTableLoader [skeletonRows]="3"></tbody>
                    } @else if (store.lines().length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>This order holds no lines</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (line of store.lines(); track line.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <span slStack [gap]="1">
                                <span slText size="sm" weight="medium">{{ line.skuName }}</span>
                                <span slText size="sm" tone="muted">
                                  {{ line.skuCode }} · line {{ line.lineNumber }}
                                </span>
                                @if (short(line)) {
                                  <span slText size="sm" class="short">{{ shortWord(line) }}</span>
                                }
                              </span>
                            </th>
                            @if (!phone()) {
                              <td slTableCell>{{ line.orderedQuantity }}</td>
                              <td slTableCell>{{ line.reservedQuantity }}</td>
                              <td slTableCell>{{ line.fulfilledQuantity }}</td>
                              <td slTableCell>{{ money(line.unitPrice) }}</td>
                            }
                            <td slTableCell>{{ money(line.totalAmount) }}</td>
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              }
              @case ('shipments') {
                <div slTable variant="framed" [columns]="phone() ? 2 : 4">
                  <div slTableContent>
                    <caption slTableCaption>
                      Shipments
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Shipment</th>
                        <th slTableColumnHeader>Status</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Lines</th>
                          <th slTableColumnHeader>Carrier</th>
                        }
                      </tr>
                    </thead>
                    @if (!detail()) {
                      <tbody slTableLoader [skeletonRows]="3"></tbody>
                    } @else if (detail()!.shipments.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>Nothing has left the warehouse yet</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (shipment of detail()!.shipments; track shipment.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>{{ shipment.shipmentNumber }}</th>
                            <td slTableCell>{{ words(shipment.status) }}</td>
                            @if (!phone()) {
                              <td slTableCell>{{ shipment.lineCount }}</td>
                              <td slTableCell>{{ shipment.carrier ?? '—' }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              }
              @case ('invoices') {
                <div slTable variant="framed" [columns]="phone() ? 2 : 4">
                  <div slTableContent>
                    <caption slTableCaption>
                      Invoices
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Invoice</th>
                        <th slTableColumnHeader align="end" numeric>Outstanding</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Due</th>
                          <th slTableColumnHeader>State</th>
                        }
                      </tr>
                    </thead>
                    @if (!detail()) {
                      <tbody slTableLoader [skeletonRows]="3"></tbody>
                    } @else if (detail()!.invoices.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>Nothing invoiced yet</h3>
                                @if (store.uninvoicedLines().length === 0) {
                                  <p slResultStateDescription>{{ uninvoicedWords() }}</p>
                                }
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (invoice of detail()!.invoices; track invoice.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              <a
                                slLink
                                class="cell-text"
                                variant="neutral"
                                underline="hover"
                                data-testid="order-invoice"
                                [routerLink]="[invoicesRoute, invoice.id]"
                                [title]="invoice.invoiceNumber ?? 'Draft invoice'"
                              >
                                {{ invoice.invoiceNumber ?? 'Draft invoice' }}
                              </a>
                            </th>
                            <td slTableCell align="end" numeric>
                              {{ money(invoice.outstanding) }}
                            </td>
                            @if (!phone()) {
                              <td slTableCell>{{ date(invoice.dueDate) }}</td>
                              <td slTableCell>{{ invoiceState(invoice) }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
                <!-- What shipped and is not invoiced, and who invoices it, under the invoices it will join (RP-09). -->
                @if (detail() && store.uninvoicedLines().length > 0) {
                  <span slText size="sm" tone="muted" data-testid="uninvoiced">{{
                    uninvoicedWords()
                  }}</span>
                }
              }
              @case ('tickets') {
                <div slTable variant="framed" [columns]="phone() ? 2 : 4">
                  <div slTableContent>
                    <caption slTableCaption>
                      Tickets
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Ticket</th>
                        <th slTableColumnHeader>Subject</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Priority</th>
                          <th slTableColumnHeader>Status</th>
                        }
                      </tr>
                    </thead>
                    @if (!detail()) {
                      <tbody slTableLoader [skeletonRows]="3"></tbody>
                    } @else if (detail()!.tickets.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No support ticket touches this order</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (ticket of detail()!.tickets; track ticket.id) {
                          <tr slTableRow>
                            <th slTableRowHeader>
                              @if (session.can('support.view')) {
                                <a slLink variant="neutral" [routerLink]="[inboxRoute, ticket.id]">{{
                                  ticket.ticketNumber
                                }}</a>
                              } @else {
                                {{ ticket.ticketNumber }}
                              }
                            </th>
                            <td slTableCell>{{ ticket.subject }}</td>
                            @if (!phone()) {
                              <td slTableCell>{{ words(ticket.priority) }}</td>
                              <td slTableCell>{{ words(ticket.status) }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              }
            }
            <!--
              What some orders carry and others do not — a hold's reason, a cancellation's, the risks,
              an approval — stands under the section it is read beside, so it grows the page downward
              and moves nothing that was measured while the order was read.
            -->
            @if (order(); as o) {
              @if (
                (o.status === 'on_hold' && o.holdReason) ||
                (o.status === 'cancelled' && o.cancellationReason) ||
                o.riskFlags.length > 0
              ) {
                <div slStack [gap]="3" data-testid="order-concerns">
                  @if (o.status === 'on_hold' && o.holdReason) {
                    <div slInlineMessage tone="warning">
                      <span slInlineMessageIcon></span>
                      On hold: {{ o.holdReason }}
                    </div>
                  }
                  @if (o.status === 'cancelled' && o.cancellationReason) {
                    <div slInlineMessage tone="secondary">
                      <span slInlineMessageIcon></span>
                      Cancelled: {{ o.cancellationReason }}
                    </div>
                  }
                  @if (o.riskFlags.length > 0) {
                    <span slInline [gap]="2" wrap="wrap">
                      @for (flag of o.riskFlags; track flag) {
                        <span slBadge variant="soft" size="sm" [tone]="riskTone(flag)">
                          {{ risk(flag) }}
                        </span>
                      }
                    </span>
                  }
                </div>
              }
              @if (store.approval(); as approval) {
                <section slSection>
                  <div slSectionHeader>
                    <div slSectionTitle><h2 slSectionHeading>Approval</h2></div>
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
            }
          </div>
        </div>

        <ng-template #submitItem>
          <button slMenuItem type="button" (click)="submit()">Submit</button>
        </ng-template>
        <ng-template #holdItem>
          <button slMenuItem type="button" (click)="holdOpen.set(true)">Place on hold</button>
        </ng-template>
        <ng-template #releaseItem>
          <button slMenuItem type="button" (click)="release()">Release hold</button>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (click)="store.load()">Refresh</button>
        </ng-template>
        <ng-template #cancelItem>
          <button slMenuItem type="button" (click)="cancelOpen.set(true)">Cancel order</button>
        </ng-template>
        <ng-template #ticketItem>
          <a
            slMenuItem
            [routerLink]="newTicketRoute"
            [queryParams]="{ customer: order()?.customerId, order: order()?.id }"
            >New ticket</a
          >
        </ng-template>
        <ng-template #invoiceItem>
          <button slMenuItem type="button" (click)="createInvoice()">Create invoice</button>
        </ng-template>
        <ng-template #remainingItem>
          <button slMenuItem type="button" (click)="remainingOpen.set(true)">
            Cancel what is left
          </button>
        </ng-template>

        <app-reason-dialog
          [(open)]="holdOpen"
          title="Place this order on hold"
          description="Nothing ships while an order is held. The reservations stay where they are."
          label="Why is it held?"
          placeholder="Waiting on the customer's purchase order revision."
          confirmLabel="Place on hold"
          tone="warning"
          [busy]="store.busy() === 'hold'"
          (confirm)="hold($event)"
        />
        <app-reason-dialog
          [(open)]="cancelOpen"
          title="Cancel this order"
          description="The reservations are released and the open shipments are cancelled with it."
          label="Why is it cancelled?"
          placeholder="The customer moved the project to next quarter."
          confirmLabel="Cancel order"
          [busy]="store.busy() === 'cancel'"
          (confirm)="cancel($event)"
        />
        <app-reason-dialog
          [(open)]="remainingOpen"
          title="Cancel what has not shipped"
          description="What has already shipped stays on the order and will still be invoiced."
          label="Why is the rest cancelled?"
          placeholder="The customer took the balance from another supplier."
          confirmLabel="Cancel the rest"
          [busy]="store.busy() === 'cancelRemaining'"
          (confirm)="cancelRemaining($event)"
        />
        <app-reason-dialog
          [(open)]="rejectOpen"
          title="Reject this order"
          description="The order goes back to the person who submitted it, with your words."
          label="Why is it rejected?"
          placeholder="The discount is three points past policy for this segment."
          confirmLabel="Reject"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('reject', $event)"
        />
        <app-reason-dialog
          [(open)]="changesOpen"
          title="Ask for changes"
          description="The order stays where it is and its owner is told what to change."
          label="What has to change?"
          placeholder="Bring the freight onto the order and resubmit."
          confirmLabel="Ask for changes"
          tone="warning"
          [busy]="store.busy() === 'decision'"
          (confirm)="decided('changes', $event)"
        />
      </div>
    }
  `,
})
export class OrderPage {
  readonly store = inject(OrderStore);
  readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly detail = this.store.detail;
  readonly order = this.store.order;
  readonly view = signal<View>('lines');
  /** The names of the four figures: chrome, and known before the answer is. */
  readonly figureLabels = ['Order total', 'Margin', 'Reserved', 'Shipped'];
  readonly phone = phoneSignal();
  /** The sentence's lines, reserved while the order is read and kept once it has loaded. */
  readonly sentenceLines = computed(() => (this.phone() ? 2 : 1));
  /** A step's label and a detail of one or two words: a fifth of a phone wraps the detail to two lines. */
  readonly stepLines = computed(() => (this.phone() ? 3 : 2));
  readonly holdOpen = signal(false);
  readonly cancelOpen = signal(false);
  readonly remainingOpen = signal(false);
  readonly rejectOpen = signal(false);
  readonly changesOpen = signal(false);

  readonly statusWord = computed(() => {
    const order = this.order();
    return order === null ? '' : (ORDER_STATUS_LABEL[order.status] ?? order.status);
  });

  readonly statusTone = computed<'secondary' | 'accent' | 'warning' | 'success' | 'danger'>(() => {
    const order = this.order();
    return order === null ? 'secondary' : (ORDER_STATUS_TONE[order.status] ?? 'secondary');
  });

  readonly subheading = computed(() => {
    const detail = this.detail();
    if (detail === null) return '';
    const order = detail.order;
    return `${order.customerName} · ${order.ownerName} · ordered ${formatDate(order.orderDate)}`;
  });

  readonly marginPercent = computed(() => Math.round((this.order()?.grossMarginBps ?? 0) / 100));

  /**
   * The subtotal the margin is taken on, or the approval line it fell under
   * (§59: under 22% a Sales Manager approves, under 15% a Finance Manager as
   * well): the card's tone is the trend's (stat-card), so a crossing is words (RP-02).
   */
  readonly marginWords = computed(() => {
    const order = this.order();
    if (order === null) return '';
    if (order.grossMarginBps < 1_500) return 'under 15%: Finance';
    if (order.grossMarginBps < 2_200) return 'under 22%: Sales';
    // One line on a phone's card: the margin is measured on the goods, freight and tax left out.
    return 'on the goods alone';
  });

  readonly reservedPercent = computed(() => this.share('reservedQuantity'));
  readonly shippedPercent = computed(() => this.share('fulfilledQuantity'));

  readonly lineWord = computed(() => {
    const lines = this.store.lines().length;
    return lines === 1 ? '1 line' : `${lines} lines`;
  });

  readonly allocationWord = computed(() => {
    const order = this.order();
    return order === null ? '' : (ALLOCATION_LABEL[order.allocationStatus] ?? '');
  });

  readonly invoiceWord = computed(() => {
    const order = this.order();
    if (order === null) return '';
    // The value says how much has shipped; the line says the invoice, on one line of a phone's card.
    return INVOICE_LABEL[order.invoiceStatus] ?? '';
  });

  readonly canHold = computed(() => {
    const status = this.order()?.status;
    return status === 'confirmed' || status === 'pending_approval';
  });

  readonly canCancel = computed(() => {
    const status = this.order()?.status;
    return status !== 'cancelled' && status !== 'closed';
  });

  readonly invoicesRoute = INVOICES_ROUTE;
  readonly inboxRoute = INBOX_ROUTE;
  readonly newTicketRoute = NEW_TICKET_ROUTE;

  /** Shipped and not invoiced, for a reader who invoices, while the Invoices tab is open (RP-05, RP-09). */
  readonly canInvoice = computed(
    () =>
      this.view() === 'invoices' &&
      this.session.can('invoices.create') &&
      this.store.uninvoicedLines().length > 0,
  );

  readonly uninvoicedWords = computed(() => {
    const lines = this.store.uninvoicedLines().length;
    if (lines === 0)
      return this.hasShipped()
        ? 'Everything shipped is on an invoice.'
        : 'An order is invoiced as it ships (§66.4): nothing has shipped yet.';
    const what = `${lines} ${lines === 1 ? 'line has' : 'lines have'} shipped and not been invoiced.`;
    return this.session.can('invoices.create')
      ? `${what} Create invoice writes them on a draft.`
      : `${what} They are invoiced by holders of invoices.create — ${FINANCE_HOLDERS['invoices.create']}.`;
  });

  readonly hasShipped = computed(() =>
    this.store.lines().some((line) => Number(line.fulfilledQuantity) > 0),
  );

  constructor() {
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      // A link may name the tab it is about: a ticket's shipment opens the order on its shipments.
      const view = this.route.snapshot.queryParamMap.get('view');
      this.view.set(view === 'shipments' || view === 'invoices' || view === 'tickets' ? view : 'lines');
      void this.store.open(id);
    });
  }

  setView(view: string | undefined): void {
    this.view.set((view ?? 'lines') as View);
  }

  count(value: number | undefined): string {
    return value === undefined ? '' : `(${value})`;
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  date(iso: string): string {
    return formatDate(iso);
  }

  invoiceState(invoice: Invoice): string {
    return INVOICE_STATUS_LABEL[invoiceDisplayStatus(invoice)];
  }

  async createInvoice(): Promise<void> {
    const id = await this.store.createInvoice();
    if (id === null) return;
    this.toasts.show({
      title: 'Draft invoice created',
      description: 'It opens once it is checked.',
      tone: 'success',
    });
    void this.router.navigate([INVOICES_ROUTE, id]);
  }

  words(code: string): string {
    return code.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
  }

  risk(flag: string): string {
    return RISK_LABEL[flag] ?? flag;
  }

  riskTone(flag: string): 'warning' | 'danger' {
    return RISK_TONE[flag] ?? 'warning';
  }

  paymentWord(): string {
    const order = this.order();
    return order === null ? '' : (PAYMENT_LABEL[order.paymentStatus] ?? '');
  }

  /** A line the warehouse cannot cover yet, which is what the reader looks for first. */
  short(line: { orderedQuantity: string; reservedQuantity: string; available: string }): boolean {
    return Number(line.reservedQuantity) < Number(line.orderedQuantity);
  }

  shortWord(line: {
    orderedQuantity: string;
    reservedQuantity: string;
    available: string;
  }): string {
    const missing = Number(line.orderedQuantity) - Number(line.reservedQuantity);
    return `${missing} not reserved · ${Number(line.available)} available now`;
  }

  /** What the reader does next about the class of refusal they met. */
  advice(kind: string): string {
    return kind === 'conflict'
      ? 'The page has been read again: what you see below is what Nexora holds now.'
      : kind === 'transport'
        ? 'Nothing was changed. Try the same action again in a moment.'
        : kind === 'permission'
          ? 'Ask the order’s owner or a sales manager to do this one.'
          : 'Nothing was changed.';
  }

  async submit(): Promise<void> {
    if (await this.store.submit()) this.toasts.show({ title: 'Order submitted', tone: 'success' });
  }

  async release(): Promise<void> {
    if (await this.store.releaseHold())
      this.toasts.show({ title: 'Hold released', tone: 'success' });
  }

  async hold(reason: string): Promise<void> {
    if (await this.store.hold(reason)) {
      this.holdOpen.set(false);
      this.toasts.show({ title: 'Order placed on hold', tone: 'warning' });
    }
  }

  async cancel(reason: string): Promise<void> {
    if (await this.store.cancel(reason)) {
      this.cancelOpen.set(false);
      this.toasts.show({ title: 'Order cancelled', tone: 'warning' });
    }
  }

  async cancelRemaining(reason: string): Promise<void> {
    if (await this.store.cancelRemaining(reason)) {
      this.remainingOpen.set(false);
      this.toasts.show({ title: 'The rest of the order was cancelled', tone: 'warning' });
    }
  }

  /** Approve decides at once; the two that need words open their dialog first. */
  decide(decision: 'approve' | 'reject' | 'changes'): void {
    if (decision === 'reject') this.rejectOpen.set(true);
    else if (decision === 'changes') this.changesOpen.set(true);
    else void this.decided('approve', '');
  }

  async decided(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<void> {
    const done = await this.store.decide(decision, reason);
    if (!done) return;
    this.rejectOpen.set(false);
    this.changesOpen.set(false);
    this.toasts.show({
      title:
        decision === 'approve'
          ? 'Approved'
          : decision === 'reject'
            ? 'Rejected'
            : 'Changes asked for',
      tone: decision === 'approve' ? 'success' : 'warning',
    });
  }

  /** The share of the ordered quantity a field covers, across every line. */
  private share(field: 'reservedQuantity' | 'fulfilledQuantity'): number {
    const lines = this.store.lines();
    const ordered = lines.reduce((sum, line) => sum + Number(line.orderedQuantity), 0);
    if (ordered === 0) return 0;
    const covered = lines.reduce((sum, line) => sum + Number(line[field]), 0);
    return Math.round((covered / ordered) * 100);
  }
}
