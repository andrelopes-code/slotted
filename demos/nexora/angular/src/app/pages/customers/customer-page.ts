import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
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
  SlPageHeaderVisual,
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
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlSkeleton, SlSkeletonText } from '@slotted/angular/skeleton';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardUnit,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
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
import { SlTextarea } from '@slotted/angular/textarea';
import { SlTimeline, SlTimelineActions, SlTimelineItem, SlTimelineList } from '@slotted/angular/timeline';
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
import type { CustomerListItem, Money, NoteVisibility } from '@slotted/demo-nexora-backend';

import { phoneSignal } from '../../core/layout/phone';
import { AddressFormStore } from '../../core/crm/address-form.store';
import { ContactFormStore } from '../../core/crm/contact-form.store';
import { CustomerEditStore } from '../../core/crm/customer-edit.store';
import { CustomerStore } from '../../core/crm/customer.store';
import { activityActor, activityRun } from '../../core/activity/activity-actor';
import { NEW_PAYMENT_ROUTE } from '../../core/finance/finance.model';
import { INBOX_ROUTE, NEW_TICKET_ROUTE } from '../../core/support/support.model';
import { SessionStore } from '../../core/session/session.store';
import {
  formatMoney,
  HEALTH_LABEL,
  HEALTH_STATUS,
  STATUS_LABEL,
  STATUS_TONE,
} from './customer-columns';
import { AccountSection } from './account-section';
import { AddressesSection } from './addresses-section';
import { ContactsSection } from './contacts-section';
import { HoldDialog } from './hold-dialog';

type View = 'overview' | 'contacts' | 'orders' | 'invoices' | 'tickets' | 'notes' | 'activity';

/** The Customer 360 (§34.2): the record the list opened, its exposure and everything attached to it. */
@Component({
  selector: 'app-customer-page',
  imports: [
    NgIcon,
    RouterLink,
    SlAvatar,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlIconButton,
    SlField,
    SlFieldLabel,
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
    SlPageHeaderVisual,
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
    SlSelect,
    SlSelectItem,
    SlSkeleton,
    SlSkeletonText,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardUnit,
    SlStatCardValue,
    SlStatusIndicator,
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
    SlTextarea,
    SlTimeline,
    SlTimelineItem,
    SlTimelineList,
    SlTimelineActions,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlToolbarSeparator,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
    AccountSection,
    AddressesSection,
    ContactsSection,
    HoldDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * One column that cannot grow past the frame: a grid track is auto by
     * default and a table wider than the page would stretch it, pushing the
     * cards and the header out of the frame instead of scrolling inside its
     * own scroller (CP-03).
     */
    .body {
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .overview {
      display: grid;
      gap: var(--slotted-space-6);
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    }
    /* A form takes the page's measure: a third of it is a column of one field. */
    .overview.writing {
      grid-template-columns: minmax(0, 1fr);
    }
    /* One column where two would squeeze the facts under 400 pixels each. */
    @container (width < 800px) {
      .overview {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .addresses {
      display: grid;
      gap: var(--slotted-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .note-form {
      display: grid;
      gap: var(--slotted-space-4);
    }
    .note-form-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--slotted-space-4);
      justify-content: flex-end;
      align-items: center;
    }
    .notes {
      display: grid;
      gap: var(--slotted-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .note {
      display: grid;
      gap: var(--slotted-space-2);
    }
    .note-meta {
      color: var(--slotted-text-muted);
      font-size: var(--slotted-font-size-sm);
      display: flex;
      gap: var(--slotted-space-3);
      align-items: center;
    }
    .note-body {
      margin: 0;
      white-space: pre-wrap;
    }
    .load-more {
      display: flex;
      justify-content: center;
    }
    .muted {
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    @if (store.error(); as error) {
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack routerLink="/crm/customers">Customers</a>
            </div>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle><h1 slPageHeaderHeading>Customer</h1></div>
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
                    ? 'This customer does not exist'
                    : 'The customer could not be loaded'
                }}
              </h2>
              <p slResultStateDescription>{{ error.message }}</p>
            </div>
            <div slResultStateActions>
              @if (error.code !== 'NOT_FOUND') {
                <button slButton type="button" (click)="store.load()">Try again</button>
              }
              <a slButtonLink variant="outline" routerLink="/crm/customers">Back to customers</a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div slPage [loading]="store.loading() && store.detail() !== null">
        <header slPageHeader [loading]="customer() === null">
          <div slPageHeaderTitleArea>
            <div slPageHeaderNav>
              <a slPageHeaderBack routerLink="/crm/customers">Customers</a>
            </div>
            <div slPageHeaderTitleRow>
              <span slPageHeaderVisual>
                @if (customer(); as c) {
                  <span slAvatar shape="square" size="lg" [name]="c.displayName"></span>
                } @else {
                  <span slSkeleton shape="square" size="lg"></span>
                }
              </span>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>{{ customer()?.displayName ?? 'Customer' }}</h1>
                @if (customer(); as c) {
                  <span slPageHeaderMarks>
                    <span slTag size="sm" [tone]="statusTone(c)"
                      ><span slTagBody>{{ statusLabel(c) }}</span></span
                    >
                    <span slTag size="sm" [tone]="healthTone(c)"
                      ><span slTagBody>{{ healthLabel(c) }}</span></span
                    >
                  </span>
                  <p slPageHeaderSubheading>{{ subheading(c) }}</p>
                } @else {
                  <!-- Every account carries its state, its health and its subheading: their boxes are kept, two small tags and a line. -->
                  <span slPageHeaderMarks>
                    <span slTag size="sm" tone="secondary"
                      ><span slTagBody><span slSkeleton shape="text" inlineSize="3rem"></span></span
                    ></span>
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
              @if (customer(); as c) {
                <div slPageHeaderActions>
                  <div slToolbar aria-label="Customer actions" overflow="menu">
                    @if (session.can('customers.credit_edit')) {
                      <!-- A counterpart in the menu, so the hold folds like every other action on a phone. -->
                      <div slToolbarItem [slToolbarItemCounterpart]="holdItem">
                        @if (c.status === 'on_hold') {
                          <button
                            slButton
                            variant="outline"
                            type="button"
                            [loading]="store.busy() === 'release'"
                            [messages]="{ loading: 'Releasing hold' }"
                            (click)="releaseHold()"
                          >
                            Release hold
                          </button>
                        } @else if (c.status === 'active' || c.status === 'prospect') {
                          <button
                            slButton
                            variant="outline"
                            tone="danger"
                            type="button"
                            [loading]="store.busy() === 'hold'"
                            [messages]="{ loading: 'Placing on hold' }"
                            (click)="holdDialogOpen.set(true)"
                          >
                            Place on hold
                          </button>
                        }
                      </div>
                    }
                    <!-- The action that adds to the open tab, beside the record's own (RP-05). -->
                    @if (
                      view() === 'contacts' &&
                      session.can('contacts.manage') &&
                      c.status !== 'closed'
                    ) {
                      <div slToolbarItem [slToolbarItemCounterpart]="contactItem">
                        <button slButton variant="ghost" type="button" (click)="newContact()">
                          New contact
                        </button>
                      </div>
                    }
                    @if (view() === 'invoices' && session.can('payments.record')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="paymentItem">
                        <a
                          slButtonLink
                          variant="ghost"
                          data-testid="record-payment"
                          [routerLink]="newPaymentRoute"
                          [queryParams]="{ customer: c.id }"
                        >
                          Record payment
                        </a>
                      </div>
                    }
                    @if (view() === 'tickets' && session.can('support.create')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="ticketItem">
                        <a
                          slButtonLink
                          variant="ghost"
                          data-testid="new-ticket"
                          [routerLink]="newTicketRoute"
                          [queryParams]="{ customer: c.id }"
                        >
                          New ticket
                        </a>
                      </div>
                    }
                    @if (session.can('notes.create')) {
                      <div slToolbarItem [slToolbarItemCounterpart]="noteItem">
                        <button slButton variant="ghost" type="button" (click)="setView('notes')">
                          Add note
                        </button>
                      </div>
                    }
                    <!-- The clock moves the account's exposure while the page is open (AF-07): the read keeps the values and marks the page busy. -->
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
                          (click)="store.refresh()"
                        >
                          <ng-icon name="lucideRefreshCw" />
                        </button>
                        <ng-template slTooltipLayer
                          ><div slTooltipContent>Refresh</div></ng-template
                        >
                      </ng-container>
                    </div>
                    @if (session.can('customers.archive') && c.status !== 'closed') {
                      <div slToolbarSeparator></div>
                      <div slToolbarItem [slToolbarItemCounterpart]="archiveItem">
                        <button
                          slButton
                          variant="ghost"
                          tone="danger"
                          type="button"
                          [loading]="store.busy() === 'archive'"
                          [messages]="{ loading: 'Archiving' }"
                          (click)="archive()"
                        >
                          Archive
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
              <div slTabList aria-label="Customer sections">
                <div slTab value="overview">Overview</div>
                <div slTab value="contacts">Contacts {{ count(detail()?.contacts.length) }}</div>
                <div slTab value="orders">Orders {{ count(detail()?.recentOrders.length) }}</div>
                <div slTab value="invoices">
                  Invoices {{ count(detail()?.openInvoices.length) }}
                </div>
                <div slTab value="tickets">Tickets {{ count(detail()?.openTickets.length) }}</div>
                <div slTab value="notes">Notes {{ count(detail()?.notes.length) }}</div>
                <div slTab value="activity">Activity</div>
              </div>
            </div>
          </div>
        </header>

        <div slPageBody>
          <div class="body">
            <!-- The exposure, on every section: what a sales manager reads before anything else. -->
            @if (customer(); as c) {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Credit used</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue
                      >{{ percent(c.summary.creditUtilizationBps)
                      }}<span slStatCardUnit>%</span></span
                    >
                    <p slStatCardComparison>{{ creditWords(c) }}</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Exposure</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(c.summary.creditExposure) }}</span>
                    <p slStatCardComparison>{{ c.summary.openOrderCount }} open orders</p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Overdue</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(c.summary.overdueReceivables) }}</span>
                    <p slStatCardComparison>
                      {{ c.summary.overdueInvoiceCount }} of {{ c.summary.openInvoiceCount }} open
                      invoices
                    </p>
                  </div>
                </div>
                <div slStatCard size="sm">
                  <div slStatCardHeader><span slStatCardLabel>Revenue, 12 months</span></div>
                  <div slStatCardFigure>
                    <span slStatCardValue>{{ money(c.summary.lifetimeRevenue) }}</span>
                    <p slStatCardComparison>
                      {{ c.summary.ordersLast12Months }} orders · avg
                      {{ money(c.summary.averageOrderValueLast12Months) }}
                    </p>
                  </div>
                </div>
              </div>
            } @else {
              <div slGrid [columns]="phone() ? 2 : 4" minItemWidth="xs" [gap]="4">
                <!-- The four cards the answer brings, their names known before it: label, value, one comparison line. -->
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
            }
            @switch (view()) {
              @case ('overview') {
                <div class="overview" [class.writing]="writing()">
                  <app-account-section
                    [customer]="customer()"
                    [contractPrices]="detail()?.contractPrices?.length ?? 0"
                  />
                  <app-addresses-section
                    [addresses]="detail()?.addresses ?? null"
                    [regionCode]="customer()?.regionCode ?? 'US'"
                  />
                </div>
              }
              @case ('contacts') {
                <app-contacts-section [contacts]="detail()?.contacts ?? null" [phone]="phone()" />
              }
              @case ('orders') {
                <div
                  slTable
                  variant="framed"
                  [columns]="phone() ? 3 : 5"
                  [layout]="phone() ? 'fixed' : 'auto'"
                >
                  <div slTableContent>
                    <caption slTableCaption>
                      Recent orders
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Order</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Date</th>
                        }
                        <th slTableColumnHeader>Status</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Fulfillment</th>
                        }
                        <th slTableColumnHeader numeric>Total</th>
                      </tr>
                    </thead>
                    @if (!detail()) {
                      <tbody slTableLoader [skeletonRows]="3"></tbody>
                    } @else if (detail()!.recentOrders.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No orders yet</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (o of detail()!.recentOrders; track o.id) {
                          <tr slTableRow>
                            <th slTableRowHeader text="nowrap">
                              <a slLink variant="neutral" [routerLink]="'/sales/orders/' + o.id">{{
                                o.orderNumber
                              }}</a>
                            </th>
                            @if (!phone()) {
                              <td slTableCell>{{ date(o.orderDate) }}</td>
                            }
                            <td slTableCell>{{ words(o.status) }}</td>
                            @if (!phone()) {
                              <td slTableCell>{{ words(o.fulfillmentStatus) }}</td>
                            }
                            <td slTableCell numeric>{{ money(o.total) }}</td>
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              }
              @case ('invoices') {
                <div
                  slTable
                  variant="framed"
                  [columns]="phone() ? 3 : 5"
                  [layout]="phone() ? 'fixed' : 'auto'"
                >
                  <div slTableContent>
                    <caption slTableCaption>
                      Open invoices
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        <th slTableColumnHeader>Invoice</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Issued</th>
                        }
                        <th slTableColumnHeader>Due</th>
                        @if (!phone()) {
                          <th slTableColumnHeader>Collection</th>
                        }
                        <th slTableColumnHeader numeric>Outstanding</th>
                      </tr>
                    </thead>
                    @if (!detail()) {
                      <tbody slTableLoader [skeletonRows]="3"></tbody>
                    } @else if (detail()!.openInvoices.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>Nothing outstanding</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (i of detail()!.openInvoices; track i.id) {
                          <tr slTableRow>
                            <th slTableRowHeader text="nowrap">
                              <a
                                slLink
                                variant="neutral"
                                [routerLink]="'/finance/invoices/' + i.id"
                                >{{ i.invoiceNumber ?? 'Draft' }}</a
                              >
                            </th>
                            @if (!phone()) {
                              <td slTableCell>{{ date(i.issueDate) }}</td>
                            }
                            <td slTableCell>{{ date(i.dueDate) }}</td>
                            @if (!phone()) {
                              <td slTableCell>
                                <span
                                  slStatusIndicator
                                  size="sm"
                                  [status]="
                                    i.collectionState === 'overdue'
                                      ? 'danger'
                                      : i.collectionState === 'current'
                                        ? 'success'
                                        : 'warning'
                                  "
                                  >{{ words(i.collectionState) }}</span
                                >
                              </td>
                            }
                            <td slTableCell numeric>{{ money(i.outstanding) }}</td>
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              }
              @case ('tickets') {
                <div
                  slTable
                  variant="framed"
                  [columns]="phone() ? 2 : 4"
                  [layout]="phone() ? 'fixed' : 'auto'"
                >
                  <div slTableContent>
                    <caption slTableCaption>
                      Open tickets
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
                    } @else if (detail()!.openTickets.length === 0) {
                      <tbody slTableBody>
                        <tr slTableRow>
                          <td slTableEmpty>
                            <div slResultState status="empty" reach="section">
                              <div slResultStateContent>
                                <h3 slResultStateTitle>No open tickets</h3>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    } @else {
                      <tbody slTableBody>
                        @for (t of detail()!.openTickets; track t.id) {
                          <tr slTableRow>
                            <th slTableRowHeader text="nowrap">
                              @if (session.can('support.view')) {
                                <a slLink variant="neutral" [routerLink]="[inboxRoute, t.id]">{{
                                  t.ticketNumber
                                }}</a>
                              } @else {
                                {{ t.ticketNumber }}
                              }
                            </th>
                            <td slTableCell>{{ t.subject }}</td>
                            @if (!phone()) {
                              <td slTableCell>{{ words(t.priority) }}</td>
                              <td slTableCell>{{ words(t.status) }}</td>
                            }
                          </tr>
                        }
                      </tbody>
                    }
                  </div>
                </div>
              }
              @case ('notes') {
                @if (session.can('notes.create')) {
                  <section slSection>
                    <div slSectionHeader>
                      <div slSectionTitle><h2 slSectionHeading>Add a note</h2></div>
                    </div>
                    <div slSectionBody>
                      <form class="note-form" (submit)="addNote($event)">
                        <div
                          slField
                          required
                          [invalid]="noteSubmitted() && noteBody().trim().length === 0"
                        >
                          <label slFieldLabel>Note</label>
                          <textarea
                            slTextarea
                            [rows]="3"
                            [value]="noteBody()"
                            (valueChange)="noteBody.set($event.value)"
                            placeholder="Called about the September invoice; payment promised for the 30th."
                          ></textarea>
                        </div>
                        <div class="note-form-row">
                          <sl-select
                            aria-label="Visibility"
                            [value]="noteVisibility()"
                            (valueChangeRequest)="setVisibility($event.value)"
                          >
                            <sl-select-item value="organization">Everyone</sl-select-item>
                            <sl-select-item value="team">My team</sl-select-item>
                            <sl-select-item value="private">Only me</sl-select-item>
                          </sl-select>
                          <button
                            slButton
                            type="submit"
                            [loading]="store.busy() === 'note'"
                            [messages]="{ loading: 'Adding note' }"
                          >
                            Add note
                          </button>
                        </div>
                      </form>
                    </div>
                  </section>
                }
                @if (!detail()) {
                  <span slSkeleton shape="text" inlineSize="80%"></span>
                } @else if (detail()!.notes.length === 0) {
                  <div slResultState status="empty" reach="section">
                    <div slResultStateContent>
                      <h2 slResultStateTitle>No notes on this account</h2>
                    </div>
                  </div>
                } @else {
                  <ul class="notes">
                    @for (n of detail()!.notes; track n.id) {
                      <li class="note">
                        <span class="note-meta">
                          <span>{{ dateTime(n.metadata.createdAt) }}</span>
                          <span>{{ visibilityLabel(n.visibility) }}</span>
                          @if (n.isPinned) {
                            <span slBadge tone="secondary" variant="soft" size="sm">Pinned</span>
                          }
                        </span>
                        <p class="note-body">{{ n.body }}</p>
                      </li>
                    }
                  </ul>
                }
              }
              @case ('activity') {
                @if (store.activity().length === 0 && store.activityLoading()) {
                  <div class="notes">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <span slSkeleton shape="text" inlineSize="70%"></span>
                    }
                  </div>
                } @else if (store.activity().length === 0) {
                  <div slResultState status="empty" reach="section">
                    <div slResultStateContent><h2 slResultStateTitle>No activity recorded</h2></div>
                  </div>
                } @else {
                  <div slTimeline label="Customer activity">
                    <ol slTimelineList>
                      @for (e of store.activity(); track e.id) {
                        <li
                          slTimelineItem
                          [title]="e.summary"
                          [actor]="actorOf(e)"
                          [time]="e.occurredAt"
                          [tone]="activityTone(e.type)"
                        >
                          @if (runOf(e); as run) {
                            <div slTimelineActions>
                              <a slLink [routerLink]="run.path" [queryParams]="{ run: run.run }">Open the run</a>
                            </div>
                          }
                        </li>
                      }
                    </ol>
                  </div>
                  @if (store.activityHasMore()) {
                    <div class="load-more">
                      <button
                        slButton
                        variant="outline"
                        type="button"
                        [loading]="store.activityLoading()"
                        (click)="store.loadActivity(true)"
                      >
                        Load more
                      </button>
                    </div>
                  }
                }
              }
            }
            <!-- Only some accounts are held: the reason stands under the section, so nothing measured moves. -->
            @if (customer()?.status === 'on_hold' && customer()?.holdReason; as reason) {
              <div slInlineMessage tone="warning">
                <span slInlineMessageIcon></span>
                On hold: {{ reason }}
              </div>
            }
          </div>
        </div>
        <ng-template #contactItem>
          <button slMenuItem type="button" (click)="newContact()">New contact</button>
        </ng-template>
        <ng-template #ticketItem>
          <a slMenuItem [routerLink]="newTicketRoute" [queryParams]="{ customer: customer()?.id }"
            >New ticket</a
          >
        </ng-template>
        <ng-template #paymentItem>
          <a slMenuItem [routerLink]="newPaymentRoute" [queryParams]="{ customer: customer()?.id }"
            >Record payment</a
          >
        </ng-template>
        <ng-template #holdItem>
          @if (customer()?.status === 'on_hold') {
            <button slMenuItem type="button" (click)="releaseHold()">Release hold</button>
          } @else if (customer()?.status === 'active' || customer()?.status === 'prospect') {
            <button slMenuItem type="button" (click)="holdDialogOpen.set(true)">
              Place on hold
            </button>
          }
        </ng-template>
        <ng-template #noteItem>
          <button slMenuItem type="button" (click)="setView('notes')">Add note</button>
        </ng-template>
        <ng-template #refreshItem>
          <button slMenuItem type="button" (click)="store.refresh()">Refresh</button>
        </ng-template>
        <ng-template #archiveItem>
          <button slMenuItem type="button" (click)="archive()">Archive</button>
        </ng-template>
        <app-hold-dialog
          [(open)]="holdDialogOpen"
          [count]="1"
          [busy]="store.busy() === 'hold'"
          (confirm)="hold($event)"
        />
      </div>
    }
  `,
})
export class CustomerPage {
  readonly store = inject(CustomerStore);
  readonly contacts = inject(ContactFormStore);
  private readonly accountEdit = inject(CustomerEditStore);
  private readonly addressForm = inject(AddressFormStore);
  /** While a form is open in the overview, the overview is one column. */
  readonly writing = computed(() => this.accountEdit.editing() || this.addressForm.open());
  readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly detail = this.store.detail;
  readonly customer = this.store.customer;
  readonly view = signal<View>('overview');
  /** The figures' names: chrome, known before the answer is. */
  readonly figureLabels = ['Credit used', 'Exposure', 'Overdue', 'Revenue, 12 months'];
  /** The payment form on its own route, opened on this customer (FM-01). */
  readonly newPaymentRoute = NEW_PAYMENT_ROUTE;
  readonly inboxRoute = INBOX_ROUTE;
  readonly newTicketRoute = NEW_TICKET_ROUTE;
  readonly holdDialogOpen = signal(false);
  readonly noteBody = signal('');
  readonly noteVisibility = signal<NoteVisibility>('organization');
  readonly noteSubmitted = signal(false);
  readonly phone = phoneSignal();

  constructor() {
    // The id is the route's; a different id opens a different record.
    let opened: string | null = null;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === null || id === opened) return;
      opened = id;
      this.view.set('overview');
      void this.store.open(id);
    });
  }

  setView(view: string | undefined): void {
    if (this.view() === 'contacts') this.contacts.cancel();
    this.view.set((view ?? 'overview') as View);
  }

  newContact(): void {
    this.view.set('contacts');
    this.contacts.startNew();
  }

  count(n: number | undefined): string {
    return n === undefined ? '' : `(${n})`;
  }

  statusLabel(c: CustomerListItem): string {
    return STATUS_LABEL[c.status];
  }

  statusTone(c: CustomerListItem): 'secondary' | 'accent' | 'warning' | 'success' {
    return STATUS_TONE[c.status];
  }

  healthLabel(c: CustomerListItem): string {
    return HEALTH_LABEL[c.health];
  }

  healthTone(c: CustomerListItem): 'success' | 'warning' | 'danger' {
    return HEALTH_STATUS[c.health];
  }

  subheading(c: CustomerListItem): string {
    const place = c.city ? ` · ${c.city}${c.region ? `, ${c.region}` : ''}` : '';
    return `${c.accountNumber} · ${c.accountOwnerName}${place}`;
  }

  /**
   * The limit the share is taken of, and the line it crossed: above 75 percent
   * an account is watched, above 90 it is near its limit (§77.7). The card's
   * tone is the trend's (stat-card), so a crossing is words (RP-02).
   */
  creditWords(c: CustomerListItem): string {
    const limit = this.money(c.creditLimit);
    const used = c.summary.creditUtilizationBps;
    return used >= 9_000
      ? `above 90% of ${limit}`
      : used >= 7_500
        ? `above 75% of ${limit}`
        : `of ${limit}`;
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  percent(bps: number): string {
    return String(Math.round(bps / 100));
  }

  date(iso: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
  }

  dateTime(iso: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }

  words(code: string): string {
    return code.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
  }

  street(address: { line1: string; line2?: string }): string {
    return address.line2 ? `${address.line1}, ${address.line2}` : address.line1;
  }

  addressType(type: string): string {
    return type === 'service_location' ? 'Service location' : this.words(type);
  }

  visibilityLabel(visibility: NoteVisibility): string {
    return visibility === 'organization' ? 'Everyone' : visibility === 'team' ? 'Team' : 'Only me';
  }

  /** An entry a workflow wrote names its workflow, and opens its run for a reader of workflows. */
  actorOf(event: Parameters<typeof activityActor>[0]): string {
    return activityActor(event);
  }

  runOf(event: Parameters<typeof activityRun>[0]): { path: string; run: string } | null {
    return this.session.can('workflows.view') ? activityRun(event) : null;
  }

  activityTone(type: string): 'secondary' | 'accent' | 'success' | 'warning' | 'danger' {
    if (/hold_placed|overdue|escalat|fail/.test(type)) return 'warning';
    if (/archived|cancel/.test(type)) return 'danger';
    if (/paid|received|released|shipped|delivered|activated/.test(type)) return 'success';
    if (/created|note/.test(type)) return 'accent';
    return 'secondary';
  }

  async hold(reason: string): Promise<void> {
    try {
      await this.store.hold(reason);
      this.holdDialogOpen.set(false);
      this.toasts.show({
        title: `${this.customer()?.displayName ?? 'Customer'} placed on hold`,
        tone: 'success',
      });
    } catch {
      /* the transport told the reader; the dialog stays open with the reason */
    }
  }

  async releaseHold(): Promise<void> {
    try {
      await this.store.releaseHold();
      this.toasts.show({
        title: `${this.customer()?.displayName ?? 'Customer'} released from hold`,
        tone: 'success',
      });
    } catch {
      /* told by the transport */
    }
  }

  async archive(): Promise<void> {
    const name = this.customer()?.displayName ?? 'Customer';
    try {
      await this.store.archive();
      this.toasts.show({ title: `${name} archived`, tone: 'success' });
      await this.router.navigateByUrl('/crm/customers');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The customer could not be archived';
      this.toasts.show({
        title: `${name} was not archived`,
        description: message,
        tone: 'danger',
        duration: 10000,
      });
    }
  }

  setVisibility(value: string | readonly string[] | null): void {
    if (typeof value === 'string') this.noteVisibility.set(value as NoteVisibility);
  }

  async addNote(event: Event): Promise<void> {
    event.preventDefault();
    this.noteSubmitted.set(true);
    const body = this.noteBody().trim();
    if (body.length === 0) return;
    try {
      await this.store.addNote(body, this.noteVisibility());
      this.noteBody.set('');
      this.noteSubmitted.set(false);
    } catch {
      /* told by the transport */
    }
  }
}
