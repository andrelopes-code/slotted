import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlHeading, SlText } from '@slotted/angular/typography';
import type { Money, TicketPriority } from '@slotted/demo-nexora-backend';

import { formatMoney } from '../../core/catalog/catalog.model';
import { ClockService } from '../../core/session/clock.service';
import {
  BUSINESS_HOURS_WORDS,
  CATEGORY_LABEL,
  CHANNEL_LABEL,
  clockWords,
  firstResponseClock,
  PRIORITY_LABEL,
  RESOLUTION_LABEL,
  resolutionClock,
  SLA_EVENT_LABEL,
  SLA_LABEL,
  SLA_POLICY_WORDS,
  SLA_TONE,
  SUPPORT_HOLDERS,
  type TicketDetail,
} from '../../core/support/support.model';
import { TicketStore } from '../../core/support/ticket.store';

const HEALTH_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  at_risk: 'At risk',
};
const HEALTH_TONE: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  healthy: 'success',
  watch: 'warning',
  at_risk: 'danger',
};
const SEGMENT_LABEL: Record<string, string> = {
  strategic: 'Strategic',
  enterprise: 'Enterprise',
  mid_market: 'Mid-market',
  smb: 'Small business',
};

/**
 * What a ticket is read against (§34.6 "customer / order / SLA context"): its
 * two clocks and their history, who holds it and at what priority, the
 * customer, and the records it is linked to — each a link where the reader
 * may open it, plain words where the role does not reach.
 */
@Component({
  selector: 'app-ticket-context',
  imports: [
    RouterLink,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlHeading,
    SlInline,
    SlLink,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlTag,
    SlTagBody,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    section + section {
      padding-block-start: var(--slotted-space-5);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    .history {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* On a finger a link is a touch target's height, as on the record pages. */
    @media (pointer: coarse) {
      a[slLink] {
        display: inline-block;
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    @let detail = this.detail();
    @let ticket = detail.ticket;
    <div slStack [gap]="5">
      <section slStack [gap]="3" aria-labelledby="sla-heading" data-testid="sla">
        <h3 slHeading size="sm" id="sla-heading">Service level</h3>
        <div slDescriptionList>
          <div slDescriptionListItem data-testid="first-response">
            <dt slDescriptionListTerm>First response</dt>
            <dd slDescriptionListDescription>
              <span slStack [gap]="1" align="start">
                <span slTag size="sm" [tone]="slaTone(ticket.firstResponseSla)"
                  ><span slTagBody>{{ slaWord(ticket.firstResponseSla) }}</span></span
                >
                <span slText size="sm">{{ firstWords() }}</span>
              </span>
            </dd>
          </div>
          <div slDescriptionListItem data-testid="resolution">
            <dt slDescriptionListTerm>Resolution</dt>
            <dd slDescriptionListDescription>
              <span slStack [gap]="1" align="start">
                <span slTag size="sm" [tone]="slaTone(ticket.resolutionSla)"
                  ><span slTagBody>{{ slaWord(ticket.resolutionSla) }}</span></span
                >
                <span slText size="sm">{{ resolutionWords() }}</span>
              </span>
            </dd>
          </div>
        </div>
        <span slText size="sm" tone="muted">{{ policyWords() }}</span>
        @if (detail.slaEvents.length > 0) {
          <ul class="history" slStack [gap]="1" aria-label="Service-level history">
            @for (event of detail.slaEvents; track event.id) {
              <li>
                <span slText size="sm"
                  >{{ eventWord(event.type) }}
                  <span slText size="sm" tone="muted">· {{ when(event.occurredAt) }}</span></span
                >
              </li>
            }
          </ul>
        }
      </section>

      <section slStack [gap]="3" aria-labelledby="owner-heading" data-testid="owner">
        <h3 slHeading size="sm" id="owner-heading">Owner and priority</h3>
        @if (store.can('assign') && store.agents(); as agents) {
          <sl-select
            size="sm"
            aria-label="Assignee"
            data-testid="assignee"
            placeholder="Nobody holds it yet"
            [value]="ticket.assigneeId ?? null"
            [disabled]="store.busy() !== null"
            (valueChangeRequest)="assign($any($event.value))"
          >
            @for (agent of agents; track agent.id) {
              <sl-select-item [value]="agent.id"
                >{{ agent.displayName }} · {{ agent.openTicketCount }} open</sl-select-item
              >
            }
          </sl-select>
        } @else {
          <span slText size="sm">{{ ticket.assigneeName ?? 'Nobody holds it yet' }}</span>
        }
        @if (store.can('priority')) {
          <sl-select
            size="sm"
            aria-label="Priority"
            data-testid="priority"
            [value]="ticket.priority"
            [disabled]="store.busy() !== null"
            (valueChangeRequest)="prioritize($any($event.value))"
          >
            @for (priority of priorities; track priority) {
              <sl-select-item [value]="priority">{{ priorityWord(priority) }} priority</sl-select-item>
            }
          </sl-select>
          <span slText size="sm" tone="muted"
            >A new priority sets both clocks to its targets, counted from when the ticket was
            opened.</span
          >
        } @else {
          <span slText size="sm">{{ priorityWord(ticket.priority) }} priority</span>
        }
        @if (!store.holds('support.assign')) {
          <span slText size="sm" tone="muted">{{ assignHolders }}</span>
        }
      </section>

      <section slStack [gap]="3" aria-labelledby="customer-heading" data-testid="customer">
        <h3 slHeading size="sm" id="customer-heading">Customer</h3>
        <span slInline [gap]="2" wrap="wrap" align="center">
          @if (store.holds('customers.view')) {
            <a slLink [routerLink]="['/crm/customers', detail.customer.id]">{{
              detail.customer.displayName
            }}</a>
          } @else {
            <span slText size="sm" weight="medium">{{ detail.customer.displayName }}</span>
          }
          <span slTag size="sm" [tone]="healthTone(detail.customer.health)"
            ><span slTagBody>{{ healthWord(detail.customer.health) }}</span></span
          >
        </span>
        <div slDescriptionList>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Segment</dt>
            <dd slDescriptionListDescription>{{ segmentWord(detail.customer.segment) }}</dd>
          </div>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Account owner</dt>
            <dd slDescriptionListDescription>{{ detail.customer.accountOwnerName }}</dd>
          </div>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Contact</dt>
            <dd slDescriptionListDescription>{{ ticket.contactName ?? 'None named' }}</dd>
          </div>
        </div>
      </section>

      <section slStack [gap]="3" aria-labelledby="linked-heading" data-testid="linked">
        <h3 slHeading size="sm" id="linked-heading">Linked records</h3>
        @if (linkedCount() === 0) {
          <span slText size="sm" tone="muted">No order, invoice, product or shipment is linked.</span>
        } @else {
          <div slDescriptionList>
            @if (detail.relatedOrder; as order) {
              <div slDescriptionListItem data-testid="linked-order">
                <dt slDescriptionListTerm>Order</dt>
                <dd slDescriptionListDescription>
                  <span slStack [gap]="1">
                    @if (store.holds('orders.view')) {
                      <a slLink [routerLink]="['/sales/orders', order.id]">{{ order.orderNumber }}</a>
                    } @else {
                      <span>{{ order.orderNumber }}</span>
                    }
                    <span slText size="sm" tone="muted"
                      >{{ words(order.status) }} · {{ words(order.fulfillmentStatus) }}</span
                    >
                  </span>
                </dd>
              </div>
            }
            @if (detail.relatedShipment; as shipment) {
              <div slDescriptionListItem data-testid="linked-shipment">
                <dt slDescriptionListTerm>Shipment</dt>
                <dd slDescriptionListDescription>
                  <span slStack [gap]="1">
                    @if (detail.relatedOrder && store.holds('orders.view')) {
                      <a
                        slLink
                        [routerLink]="['/sales/orders', detail.relatedOrder.id]"
                        [queryParams]="{ view: 'shipments' }"
                        >{{ shipment.shipmentNumber }}</a
                      >
                    } @else {
                      <span>{{ shipment.shipmentNumber }}</span>
                    }
                    <span slText size="sm" tone="muted"
                      >{{ words(shipment.status) }} · {{ shipment.carrier
                      }}{{ shipment.trackingNumber ? ' · ' + shipment.trackingNumber : '' }}</span
                    >
                  </span>
                </dd>
              </div>
            }
            @if (detail.relatedInvoice; as invoice) {
              <div slDescriptionListItem data-testid="linked-invoice">
                <dt slDescriptionListTerm>Invoice</dt>
                <dd slDescriptionListDescription>
                  <span slStack [gap]="1">
                    @if (store.holds('invoices.view')) {
                      <a slLink [routerLink]="['/finance/invoices', invoice.id]">{{
                        invoice.invoiceNumber ?? 'Draft invoice'
                      }}</a>
                    } @else {
                      <span>{{ invoice.invoiceNumber ?? 'Draft invoice' }}</span>
                    }
                    <span slText size="sm" tone="muted"
                      >{{ money(invoice.outstanding) }} outstanding ·
                      {{ words(invoice.collectionState) }}</span
                    >
                  </span>
                </dd>
              </div>
            }
            @if (detail.relatedSku; as sku) {
              <div slDescriptionListItem data-testid="linked-sku">
                <dt slDescriptionListTerm>Product</dt>
                <dd slDescriptionListDescription>
                  <span slStack [gap]="1">
                    @if (store.holds('catalog.view')) {
                      <a slLink [routerLink]="['/catalog/skus', sku.id]">{{ sku.sku }}</a>
                    } @else {
                      <span>{{ sku.sku }}</span>
                    }
                    <span slText size="sm" tone="muted">{{ sku.name }}</span>
                  </span>
                </dd>
              </div>
            }
          </div>
        }
      </section>

      <section slStack [gap]="3" aria-labelledby="facts-heading" data-testid="facts">
        <h3 slHeading size="sm" id="facts-heading">Ticket</h3>
        <div slDescriptionList>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Opened</dt>
            <dd slDescriptionListDescription>
              {{ when(ticket.metadata.createdAt) }} by {{ channelWord(ticket.channel) }}
            </dd>
          </div>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Category</dt>
            <dd slDescriptionListDescription>{{ categoryWord(ticket.category) }}</dd>
          </div>
          @if (ticket.escalationReason) {
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Escalated because</dt>
              <dd slDescriptionListDescription>{{ ticket.escalationReason }}</dd>
            </div>
          }
          @if (ticket.resolutionCode) {
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Resolved as</dt>
              <dd slDescriptionListDescription>{{ resolutionWord(ticket.resolutionCode) }}</dd>
            </div>
          }
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Tags</dt>
            <dd slDescriptionListDescription>
              @if (ticket.tags.length === 0) {
                None
              } @else {
                <span slInline [gap]="1" wrap="wrap">
                  @for (tag of ticket.tags; track tag) {
                    <span slTag size="sm" tone="secondary"><span slTagBody>{{ tag }}</span></span>
                  }
                </span>
              }
            </dd>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class TicketContext {
  readonly store = inject(TicketStore);
  private readonly clock = inject(ClockService);

  readonly detail = input.required<TicketDetail>();

  readonly priorities: readonly TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
  readonly assignHolders = `Tickets are assigned by ${SUPPORT_HOLDERS['support.assign']}.`;

  readonly firstWords = computed(() =>
    clockWords(firstResponseClock(this.detail().ticket), (instant) => this.due(instant)),
  );
  readonly resolutionWords = computed(() =>
    clockWords(resolutionClock(this.detail().ticket), (instant) => this.due(instant)),
  );

  readonly policyWords = computed(() => {
    const priority = this.detail().ticket.priority;
    return `${PRIORITY_LABEL[priority]} priority: ${SLA_POLICY_WORDS[priority]}. ${BUSINESS_HOURS_WORDS}; time outside them is not counted.`;
  });

  readonly linkedCount = computed(() => {
    const detail = this.detail();
    return [detail.relatedOrder, detail.relatedInvoice, detail.relatedSku, detail.relatedShipment].filter(
      Boolean,
    ).length;
  });

  /** The due instant as a weekday and an hour in the organization's zone. */
  due(instant: string): string {
    return this.clock.formatDate(instant, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  when(instant: string): string {
    return this.clock.formatDate(instant, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  slaWord(state: keyof typeof SLA_LABEL): string {
    return SLA_LABEL[state];
  }

  slaTone(state: keyof typeof SLA_TONE) {
    return SLA_TONE[state];
  }

  eventWord(type: keyof typeof SLA_EVENT_LABEL): string {
    return SLA_EVENT_LABEL[type];
  }

  priorityWord(priority: TicketPriority): string {
    return PRIORITY_LABEL[priority];
  }

  channelWord(channel: keyof typeof CHANNEL_LABEL): string {
    return CHANNEL_LABEL[channel].toLowerCase();
  }

  categoryWord(category: string): string {
    return CATEGORY_LABEL[category] ?? this.words(category);
  }

  resolutionWord(code: string): string {
    return RESOLUTION_LABEL[code] ?? this.words(code);
  }

  healthWord(health: string): string {
    return HEALTH_LABEL[health] ?? this.words(health);
  }

  healthTone(health: string) {
    return HEALTH_TONE[health] ?? 'secondary';
  }

  segmentWord(segment: string): string {
    return SEGMENT_LABEL[segment] ?? this.words(segment);
  }

  words(value: string): string {
    const text = value.replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  money(value: unknown): string {
    return formatMoney(value as Money);
  }

  async assign(assigneeId: string | null): Promise<void> {
    if (assigneeId === null || assigneeId === this.detail().ticket.assigneeId) return;
    await this.store.assign(assigneeId);
  }

  async prioritize(priority: TicketPriority | null): Promise<void> {
    if (priority === null || priority === this.detail().ticket.priority) return;
    await this.store.setPriority(priority);
  }
}
