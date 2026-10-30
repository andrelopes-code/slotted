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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlFilterBar, type FilterBarField, type FilterBarPreset } from '@slotted/angular/filter-bar';
import { SlInline } from '@slotted/angular/inline';
import { SlList, SlListEmpty } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
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
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlSplitter } from '@slotted/angular/splitter';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlHeading, SlText } from '@slotted/angular/typography';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex } from '@slotted/core/grid';
import { map } from 'rxjs';

import { options } from '../../core/catalog/catalog.model';
import { PaneSplit } from '../../core/layout/pane-split';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import {
  CATEGORY_LABEL,
  CHANNEL_LABEL,
  INBOX_ROUTE,
  leadingClock,
  metricDoors,
  NEW_TICKET_ROUTE,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  queueFor,
  shortClock,
  SLA_LABEL,
  STATUS_LABEL,
  type TicketListItem,
} from '../../core/support/support.model';
import { TicketStore } from '../../core/support/ticket.store';
import { inboxQuery, SupportQueuesStore, TicketsStore } from '../../core/support/tickets.store';
import { TicketView } from './ticket-view';
import { doorFilter, regionField, segmentField, type DoorBarField } from '../../core/backend/door';

/** The fields a report's door names on tickets (OV-01); the bar offers them beside its own. */
export const TICKET_DOOR_FIELDS: readonly DoorBarField[] = [
  { key: 'createdDate', label: 'Opened', kind: 'date', operators: ['is', 'between'], section: 'Ticket' },
  { key: 'resolvedDate', label: 'Resolved', kind: 'date', operators: ['is', 'between'], section: 'Ticket' },
  { key: 'escalated', label: 'Ever escalated', kind: 'boolean', operators: ['is'], section: 'Ticket' },
  {
    key: 'resolutionMinutes',
    label: 'Business minutes to resolve',
    kind: 'number',
    operators: ['greaterThanOrEqual', 'lessThanOrEqual', 'between'],
    section: 'Service level',
  },
  { key: 'satisfactionScore', label: 'Satisfaction', kind: 'number', operators: ['equals', 'notEmpty'], section: 'Customer' },
  { key: 'firstResponseSla', label: 'First-response SLA', kind: 'set', operators: ['anyOf'], section: 'Service level' },
  { key: 'priority', label: 'Priority', kind: 'set', operators: ['anyOf'] },
  { key: 'category', label: 'Category', kind: 'set', operators: ['anyOf'], section: 'Ticket' },
  { key: 'status', label: 'Status', kind: 'set', operators: ['anyOf'] },
  segmentField('Customer'),
  regionField('Customer'),
];

/**
 * The support inbox (§14, §34.6): the queue at the start, the ticket it opens
 * in the rest of the row — its conversation, and the customer, order and SLA
 * context beside it. The open ticket is the address's `:id`, so a selection
 * is a link and the back gesture returns; a phone reads one region at a time
 * (WS-01): the queue, then the ticket's page.
 *
 * The queues an agent works from are the filter bar's views: each is a tree
 * of the bar's own pills, so the pills say what the queue is and editing one
 * is a queue of the reader's own, marked as changed (OV-01, one source of
 * truth). J and K move through the queue without the pointer.
 */
@Component({
  selector: 'app-inbox-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlFilterBar,
    SlHeading,
    SlInline,
    SlList,
    SlListEmpty,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderHeading,
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
    SlSkeleton,
    SlSplitter,
    SlStack,
    SlTag,
    SlTagBody,
    SlText,
    TicketView,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'keyed($event)' },
  styles: `
    /*
     * From the compact size class, one row as tall as the body: the queue and the ticket scroll
     * inside it, the page does not (LP-12). The size is contained so a long conversation never
     * becomes the body's minimum. Below it the page scrolls and the body grows with its content,
     * so a contained size would be nought: the queue and the ticket take their own heights.
     */
    .inbox {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
      min-block-size: 0;
    }
    /*
     * literal: the compact size class (COMPACT_BELOW in @slotted/core/measure). Above it the queue
     * stands beside the ticket at the width the splitter holds: from 17rem, up to what leaves the
     * ticket 36rem — a conversation beside its context, or behind its tab.
     */
    @media (width >= 600px) {
      .inbox {
        display: flex;
        gap: var(--slotted-space-3);
        block-size: 100%;
        contain: size;
      }
      .queue {
        flex: none;
        inline-size: calc(var(--slotted-splitter-value, 0.3) * 100%);
      }
      app-ticket-view,
      .overview {
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
    .end {
      display: grid;
      justify-items: end;
      gap: var(--slotted-space-1);
      inline-size: 100%;
    }
    .overview {
      min-block-size: 0;
      overflow: auto;
    }
    .figure {
      flex: none;
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      @if (!(phone() && id())) {
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>Inbox</h1>
                <p slPageHeaderSubheading>Customer tickets, the most pressing resolution first</p>
              </div>
              @if (canCreate()) {
                <div slPageHeaderActions>
                  <a slButtonLink data-testid="new-ticket" [routerLink]="newRoute">New ticket</a>
                </div>
              }
            </div>
          </div>
        </header>
      }
      <div slPageBody>
        <div class="inbox" #inbox>
          @if (!phone() || !id()) {
            <div class="queue" data-testid="queue">
              <div
                slFilterBar
                aria-label="Ticket filters"
                [fields]="fields()"
                [presets]="presets()"
                [preset]="preset()"
                (presetChangeRequest)="preset.set($event.value)"
                [value]="queue.filter()"
                (valueChangeRequest)="queue.setFilter($event.value)"
                [query]="queue.search()"
                (queryChangeRequest)="queue.setSearch($event.value)"
                [messages]="countMessages"
                [count]="queue.total() ?? undefined"
                [total]="queue.total() === queue.grandTotal() ? undefined : (queue.grandTotal() ?? undefined)"
                [loading]="queue.loading()"
              ></div>
              <div slScrollArea class="rows" [messages]="{ label: 'Tickets' }">
                <ul
                  slList
                  variant="ruled"
                  aria-label="Tickets"
                  data-testid="queue-rows"
                  [loading]="queue.loading() && queue.rows().length > 0"
                >
                  @if (queue.rows().length === 0 && queue.error()) {
                    <li slListEmpty>
                      <div slResultState status="error" reach="section">
                        <div slResultStateContent>
                          <h2 slResultStateTitle>The tickets did not arrive</h2>
                          <p slResultStateDescription>Nothing was changed. Try again in a moment.</p>
                        </div>
                        <div slResultStateActions>
                          <button slButton size="sm" type="button" (click)="queue.reload()">
                            Try again
                          </button>
                        </div>
                      </div>
                    </li>
                  } @else if (queue.rows().length === 0 && (queue.loading() || queue.total() === null)) {
                    <!-- The first page's rows, each the anatomy of a row: the subject, the line under it, the clock. -->
                    @for (row of placeholderRows; track row) {
                      <li slListItem>
                        <div slListItemContent>
                          <span slListItemBody>
                            <span slListItemLabel
                              ><span
                                slSkeleton
                                shape="text"
                                [inlineSize]="row % 3 === 0 ? '55%' : '80%'"
                              ></span
                            ></span>
                            <span slListItemDescription
                              ><span slSkeleton shape="text" inlineSize="60%"></span
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
                      <div slResultState [status]="narrowed() ? 'no-results' : 'empty'" reach="section">
                        <div slResultStateContent>
                          <h2 slResultStateTitle>
                            {{ narrowed() ? 'No ticket matches these filters' : 'No ticket yet' }}
                          </h2>
                          <p slResultStateDescription>{{ emptyWords() }}</p>
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
                            <span slListItemLabel [title]="row.subject">{{ row.subject }}</span>
                            <span slListItemDescription [title]="rowWords(row)">{{ rowWords(row) }}</span>
                          </span>
                          <span slListItemEnd>
                            <span class="end">
                              <span slText size="sm" numeric="tabular" class="figure" [tone]="clockTone(row)">{{
                                rowClock(row)
                              }}</span>
                              @if (rowMark(row); as mark) {
                                <span slTag size="sm" [tone]="mark.tone"
                                  ><span slTagBody>{{ mark.label }}</span></span
                                >
                              }
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
                aria-label="Ticket pages"
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
                max="calc(100% - 36rem)"
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
              <app-ticket-view
                [phone]="phone()"
                [route]="route"
                [previousId]="neighbour(-1)"
                [nextId]="neighbour(1)"
                (step)="move($event)"
              />
            } @else {
              <div class="overview" data-testid="no-selection">
                <div slStack [gap]="5">
                  <div slResultState status="empty" reach="section">
                    <div slResultStateContent>
                      <h2 slResultStateTitle>Open a ticket from the queue</h2>
                      <p slResultStateDescription>
                        It opens here with its conversation, its two service-level clocks and the
                        customer, order and shipment it is about. J and K move to the next and the
                        previous ticket.
                      </p>
                    </div>
                  </div>
                  <section slStack [gap]="3" aria-labelledby="queues-heading" data-testid="queues">
                    <h2 slHeading size="sm" id="queues-heading">The inbox now</h2>
                    @if (queues.metrics(); as metrics) {
                      <ul slList variant="ruled" aria-label="Queues">
                        @for (door of doors(); track door.key) {
                          <li slListItem>
                            <a slListItemContent [routerLink]="route" [queryParams]="{ queue: door.key }">
                              <span slListItemBody>
                                <span slListItemLabel>{{ door.label }}</span>
                              </span>
                              <span slListItemEnd>
                                <span slText size="sm" weight="medium" numeric="tabular">{{
                                  door.value
                                }}</span>
                              </span>
                            </a>
                          </li>
                        }
                      </ul>
                      <span slText size="sm" tone="muted">{{ responseWords() }}</span>
                    } @else if (queues.metricsFailed()) {
                      <span slInline [gap]="2" wrap="wrap" align="center">
                        <span slText size="sm">The inbox's figures did not arrive.</span>
                        <button
                          slButton
                          size="sm"
                          variant="outline"
                          tone="secondary"
                          type="button"
                          (click)="queues.load()"
                        >
                          Try again
                        </button>
                      </span>
                    } @else {
                      <ul slList variant="ruled" aria-label="Queues" [loading]="true">
                        @for (row of [1, 2, 3, 4, 5]; track row) {
                          <li slListItem>
                            <div slListItemContent>
                              <span slListItemBody
                                ><span slListItemLabel
                                  ><span slSkeleton shape="text" [inlineSize]="row % 2 ? '7rem' : '5rem'"></span></span
                              ></span>
                              <span slListItemEnd><span slSkeleton shape="text" inlineSize="2rem"></span></span>
                            </div>
                          </li>
                        }
                      </ul>
                    }
                  </section>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class InboxPage {
  readonly queue = inject(TicketsStore);
  readonly queues = inject(SupportQueuesStore);
  readonly store = inject(TicketStore);
  private readonly session = inject(SessionStore);
  private readonly route$ = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly route = INBOX_ROUTE;
  readonly newRoute = NEW_TICKET_ROUTE;
  readonly phone = phoneSignal();
  /** The queue's width, kept in pixels as the window changes; it opens at 24rem. */
  readonly split = new PaneSplit('nexora.inbox.queue-width', 24);
  private readonly inbox = viewChild<ElementRef<HTMLElement>>('inbox');
  /** The queue's first page is 25 rows: the wait reserves them (loading-states §2). */
  readonly placeholderRows = Array.from({ length: 25 }, (_, index) => index);

  readonly id = toSignal(this.route$.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route$.snapshot.paramMap.get('id'),
  });
  private readonly queueParam = toSignal(
    this.route$.queryParamMap.pipe(map((params) => params.get('queue'))),
    { initialValue: this.route$.snapshot.queryParamMap.get('queue') },
  );
  /** A report's door (OV-01): its condition and period field by field, read as the bar's pills. */
  private readonly reportDoor = toSignal(
    this.route$.queryParamMap.pipe(map((params) => doorFilter(params, TICKET_DOOR_FIELDS))),
    { initialValue: doorFilter(this.route$.snapshot.queryParamMap, TICKET_DOOR_FIELDS) },
  );

  /** The queue the bar names; the bar marks it changed once a pill is edited. */
  readonly preset = signal<string | null>('open');

  readonly countMessages = { count: '{count} of {total} tickets', countOnly: '{count} tickets' };
  readonly pagerMessages = { range: 'Tickets {start}–{end} of {count}' };

  readonly canCreate = computed(() => {
    void this.session.session();
    return this.session.can('support.create');
  });

  /** Each queue with how many tickets it opens on, once the counts are in. */
  readonly presets = computed<readonly FilterBarPreset[]>(() => {
    const counts = this.queues.counts();
    return this.queues.queues().map((queue) => ({
      key: queue.key,
      label: counts ? `${queue.label} · ${counts[queue.key] ?? 0}` : queue.label,
      value: queue.value,
    }));
  });

  readonly fields = computed<readonly FilterBarField[]>(() => {
    const me = this.session.user();
    const agents = this.store.agents() ?? [];
    const assignees = agents.map((agent) => ({
      value: agent.id,
      label: agent.id === me?.id ? `${agent.displayName} (you)` : agent.displayName,
    }));
    return [
      { key: 'status', label: 'Status', kind: 'set', options: options(STATUS_LABEL), pinned: true, operators: ['anyOf'] },
      { key: 'priority', label: 'Priority', kind: 'set', options: options(PRIORITY_LABEL), pinned: true, operators: ['anyOf'] },
      { key: 'resolutionSla', label: 'Resolution SLA', kind: 'set', options: options(SLA_LABEL), operators: ['anyOf'], section: 'Service level' },
      { key: 'firstResponseSla', label: 'First-response SLA', kind: 'set', options: options(SLA_LABEL), operators: ['anyOf'], section: 'Service level' },
      { key: 'assigneeId', label: 'Assignee', kind: 'set', options: assignees, operators: ['anyOf'], section: 'Owner' },
      { key: 'assigned', label: 'Assigned', kind: 'boolean', operators: ['is'], section: 'Owner' },
      { key: 'channel', label: 'Channel', kind: 'set', options: options(CHANNEL_LABEL), operators: ['anyOf'], section: 'Ticket' },
      { key: 'category', label: 'Category', kind: 'set', options: options(CATEGORY_LABEL), operators: ['anyOf'], section: 'Ticket' },
      {
        key: 'customerSegment',
        label: 'Customer segment',
        kind: 'set',
        options: options({ strategic: 'Strategic', enterprise: 'Enterprise', mid_market: 'Mid-market', smb: 'Small business' }),
        operators: ['anyOf'],
        section: 'Customer',
      },
      // The fields a report's door names that the inbox's own bar has no pill for.
      ...(TICKET_DOOR_FIELDS.filter((field) =>
        ['createdDate', 'resolvedDate', 'escalated', 'resolutionMinutes', 'satisfactionScore', 'regionCode'].includes(field.key),
      ) as FilterBarField[]),
    ];
  });

  readonly narrowed = computed(() => this.queue.filter() !== null || this.queue.search().trim().length >= 2);

  readonly emptyWords = computed(() =>
    this.narrowed()
      ? 'Choose another queue, or remove a filter to see more tickets.'
      : 'Tickets arrive by email, phone, the portal and chat, and are created from a customer or an order.',
  );

  readonly doors = computed(() => {
    const metrics = this.queues.metrics();
    return metrics ? metricDoors(metrics) : [];
  });

  readonly responseWords = computed(() => {
    const metrics = this.queues.metrics();
    if (!metrics) return '';
    const percent = Math.round(metrics.firstResponseSlaBps / 100);
    const csat =
      metrics.averageCsat === null
        ? 'No satisfaction score has been given yet.'
        : `Customers rate the answers ${metrics.averageCsat} out of 5 on average.`;
    return `${percent}% of the tickets answered so far had their first reply within target (§72.11). ${csat}`;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const row = this.inbox()?.nativeElement;
      if (row) this.split.observe(row, destroyRef);
    });
    void this.store.ensureAgents();
    if (this.queues.counts() === null) void this.queues.load();
    // A door (`?queue=`) opens its queue: the bar's pills become the queue's tree.
    effect(() => {
      const key = this.queueParam();
      const door = this.reportDoor();
      untracked(() => {
        const queue = queueFor(key, this.session.user()?.id ?? null);
        if (door !== null && queue === null) {
          // A report's door is no queue: the bar holds its pills and names no view.
          this.preset.set(null);
          void this.queue.load({ ...emptyQuery({ index: 0, size: this.queue.page().size }), filter: door.filter });
          void this.queue.loadGrandTotal();
        } else if (queue !== null) {
          this.preset.set(queue.key);
          if (this.queue.total() === null) void this.queue.open(inboxQuery(queue));
          else void this.queue.load(inboxQuery(queue, this.queue.page().size));
        } else if (this.queue.total() === null) {
          const open = queueFor('open', null)!;
          void this.queue.open(inboxQuery(open));
        } else {
          this.preset.set(this.matchingPreset(this.queue.filter()));
        }
      });
    });
    effect(() => {
      const id = this.id();
      untracked(() => {
        if (id === null) this.store.clear();
        else void this.store.select(id);
      });
    });
    // A persona, a scenario or a day moved: the queue and the ticket read again from nothing.
    let tenant: string | null = null;
    effect(() => {
      const session = this.session.session();
      if (session === null) return;
      const key = `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
      untracked(() => {
        if (tenant !== null && tenant !== key) {
          const open = queueFor('open', null)!;
          this.preset.set('open');
          void this.queue.open(inboxQuery(open));
          void this.store.ensureAgents();
          void this.queues.load();
          if (this.id() !== null) void this.store.load();
        }
        tenant = key;
      });
    });
  }

  private matchingPreset(filter: FilterGroup | null): string | null {
    if (filter === null) return null;
    const tree = JSON.stringify(filter);
    return this.queues.queues().find((queue) => JSON.stringify(queue.value) === tree)?.key ?? null;
  }

  rowWords(row: TicketListItem): string {
    return [row.ticketNumber, row.customerName, STATUS_LABEL[row.status], row.assigneeName ?? 'unassigned'].join(' · ');
  }

  /** The clock the row is racing: the first response until it is given, then the resolution. */
  rowClock(row: TicketListItem): string {
    const { name, clock } = leadingClock(row);
    return `${name === 'First response' ? 'Reply' : 'Resolve'} ${shortClock(clock)}`;
  }

  clockTone(row: TicketListItem): 'danger' | 'warning' | 'muted' {
    const state = leadingClock(row).clock.state;
    return state === 'breached' ? 'danger' : state === 'at_risk' ? 'warning' : 'muted';
  }

  /** The row's one mark: an urgent or high priority (CP-06 — the clock already carries its state). */
  rowMark(row: TicketListItem): { label: string; tone: 'warning' | 'danger' | 'secondary' } | null {
    if (row.priority !== 'urgent' && row.priority !== 'high') return null;
    return { label: PRIORITY_LABEL[row.priority], tone: PRIORITY_TONE[row.priority] };
  }

  /** The ticket before (-1) or after (1) the open one on this page of the queue. */
  neighbour(direction: -1 | 1): string | null {
    const rows = this.queue.rows();
    const index = rows.findIndex((row) => row.id === this.id());
    if (index < 0) return direction === 1 ? (rows[0]?.id ?? null) : null;
    return rows[index + direction]?.id ?? null;
  }

  move(direction: -1 | 1): void {
    const next = this.neighbour(direction);
    if (next === null) return;
    void this.router.navigate([this.route, next], { replaceUrl: !this.phone() && this.id() !== null });
  }

  /** J and K, as a mail client has them, outside a field and outside a dialog. */
  keyed(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key !== 'j' && event.key !== 'k') return;
    const target = event.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    if (target?.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return;
    event.preventDefault();
    this.move(event.key === 'j' ? 1 : -1);
  }

  goTo(page: number): void {
    void this.queue.load(withPageIndex(this.queue.query(), page - 1).query);
  }

  clearFilters(): void {
    this.preset.set(null);
    void this.queue.load({
      ...this.queue.query(),
      filter: null,
      search: '',
      page: { index: 0, size: this.queue.page().size },
    });
  }

}
