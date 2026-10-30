import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderNav,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';
import type { CustomerListItem, TicketChannel, TicketPriority } from '@slotted/demo-nexora-backend';

import { formatDate } from '../../core/catalog/catalog.model';
import { toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import { NewTicketStore } from '../../core/support/new-ticket.store';
import {
  BUSINESS_HOURS_WORDS,
  CATEGORY_LABEL,
  CHANNEL_LABEL,
  INBOX_ROUTE,
  PRIORITY_LABEL,
  SLA_POLICY_WORDS,
  supportAdvice,
} from '../../core/support/support.model';

/**
 * A new ticket (§14, §68.5 "Create"), on its own route under the inbox it
 * returns to (FM-01). A customer or an order links here with `?customer=` and
 * `?order=`. The description is what the customer reported: it opens the
 * conversation, written as the customer unless the ticket is internal. The
 * priority's two targets are said beside it before the ticket is created.
 */
@Component({
  selector: 'app-new-ticket-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCombobox,
    SlComboboxItem,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlForm,
    SlFormActions,
    SlGrid,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderBack,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderNav,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack [routerLink]="inboxRoute">Inbox</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New ticket</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The ticket opens as new, with both service-level clocks running from now. It lands in
              the inbox's unassigned queue until an agent takes it.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <form
          slForm
          data-testid="new-ticket-form"
          [messages]="{ summaryTitle: 'This ticket was not created' }"
          [errors]="store.errors()"
          (errorsChange)="store.errors.set($event.value)"
          [loading]="store.creating()"
          (formSubmit)="submit($event)"
        >
          @if (store.failure(); as failure) {
            @if (failure.kind !== 'validation') {
              <div slInlineMessage [tone]="tone(failure.kind)" data-testid="failure">
                <span slInlineMessageIcon></span>
                <span slStack [gap]="1">
                  <span slText size="sm">{{ failure.message }}</span>
                  <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                </span>
              </div>
            }
          }
          <div slStack [gap]="5">
            <div slGrid [columns]="phone() ? 1 : 2" [gap]="5" minItemWidth="sm">
              <div slField required [invalid]="!!error('customerId')">
                <label slFieldLabel>Customer</label>
                <sl-combobox
                  name="customerId"
                  data-testid="customer-search"
                  placeholder="Search customers by name or number"
                  [filter]="null"
                  [loading]="store.searching()"
                  [inputValue]="store.customerQuery()"
                  (inputValueChangeRequest)="store.search($event.value)"
                  [value]="store.customer()?.id ?? null"
                  (valueChangeRequest)="choose($event.value)"
                >
                  @for (option of customerOptions(); track option.id) {
                    <sl-combobox-item [value]="option.id" [label]="customerLabel(option)" />
                  }
                </sl-combobox>
                @if (error('customerId'); as message) {
                  <p slFieldError>{{ message }}</p>
                } @else {
                  <span slFieldDescription>{{ customerWords() }}</span>
                }
              </div>
              <div slField>
                <label slFieldLabel>Contact</label>
                <sl-select
                  name="contactId"
                  data-testid="contact"
                  clearable
                  [placeholder]="contactPlaceholder()"
                  [disabled]="store.context() === null"
                  [value]="store.contactId()"
                  (valueChangeRequest)="store.contactId.set($any($event.value) ?? null)"
                >
                  @for (contact of store.context()?.contacts ?? []; track contact.id) {
                    <sl-select-item [value]="contact.id">{{ contact.displayName }}</sl-select-item>
                  }
                </sl-select>
                <span slFieldDescription>Who reported it: replies are addressed to them.</span>
              </div>
            </div>
            <div slField required [invalid]="!!error('subject')">
              <label slFieldLabel>Subject</label>
              <div slTextField>
                <input
                  slTextFieldInput
                  name="subject"
                  data-testid="subject"
                  placeholder="Pallet delivered to the wrong dock"
                  [value]="store.subject()"
                  (valueChange)="store.subject.set($event.value)"
                />
              </div>
              @if (error('subject'); as message) {
                <p slFieldError>{{ message }}</p>
              }
            </div>
            <div slField required [invalid]="!!error('description')">
              <label slFieldLabel>What the customer reported</label>
              <textarea
                slTextarea
                name="description"
                data-testid="description"
                [rows]="4"
                [value]="store.description()"
                (valueChange)="store.description.set($event.value)"
                placeholder="Three cartons of the order are missing from the delivery."
              ></textarea>
              @if (error('description'); as message) {
                <p slFieldError>{{ message }}</p>
              } @else {
                <span slFieldDescription>{{ descriptionWords() }}</span>
              }
            </div>
            <div slGrid [columns]="phone() ? 1 : 3" [gap]="5" minItemWidth="xs">
              <div slField required>
                <label slFieldLabel>Priority</label>
                <sl-select
                  name="priority"
                  data-testid="priority"
                  [value]="store.priority()"
                  (valueChangeRequest)="store.priority.set($any($event.value) ?? 'normal')"
                >
                  @for (priority of priorities; track priority) {
                    <sl-select-item [value]="priority">{{ priorityWord(priority) }}</sl-select-item>
                  }
                </sl-select>
              </div>
              <div slField required>
                <label slFieldLabel>Channel</label>
                <sl-select
                  name="channel"
                  data-testid="channel"
                  [value]="store.channel()"
                  (valueChangeRequest)="store.channel.set($any($event.value) ?? 'phone')"
                >
                  @for (channel of channels; track channel.value) {
                    <sl-select-item [value]="channel.value">{{ channel.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
              <div slField required>
                <label slFieldLabel>Category</label>
                <sl-select
                  name="category"
                  data-testid="category"
                  [value]="store.category()"
                  (valueChangeRequest)="store.category.set($any($event.value) ?? 'other')"
                >
                  @for (category of categories; track category.value) {
                    <sl-select-item [value]="category.value">{{ category.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
            </div>
            <span slText size="sm" tone="muted" data-testid="targets">{{ targetWords() }}</span>
            <div slField>
              <label slFieldLabel>Order it is about</label>
              <sl-select
                name="relatedOrderId"
                data-testid="related-order"
                clearable
                [placeholder]="orderPlaceholder()"
                [disabled]="store.context() === null"
                [value]="store.relatedOrderId()"
                (valueChangeRequest)="store.relatedOrderId.set($any($event.value) ?? null)"
              >
                @for (order of store.context()?.recentOrders ?? []; track order.id) {
                  <sl-select-item [value]="order.id"
                    >{{ order.orderNumber }} · {{ date(order.orderDate) }} ·
                    {{ words(order.fulfillmentStatus) }}</sl-select-item
                  >
                }
              </sl-select>
              <span slFieldDescription
                >Optional. The ticket shows the order, its shipments and its status to the agent.</span
              >
            </div>
          </div>
          <div slFormActions>
            <a slButtonLink variant="ghost" tone="secondary" [routerLink]="inboxRoute">Cancel</a>
            <button
              slButton
              type="submit"
              data-testid="create-ticket"
              [loading]="store.creating()"
              [messages]="{ loading: 'Creating the ticket' }"
            >
              Create ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class NewTicketPage {
  readonly store = inject(NewTicketStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(SlToastService);

  readonly inboxRoute = INBOX_ROUTE;
  readonly phone = phoneSignal();
  readonly priorities: readonly TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
  readonly channels = (Object.keys(CHANNEL_LABEL) as TicketChannel[]).map((value) => ({
    value,
    label: CHANNEL_LABEL[value],
  }));
  readonly categories = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

  /** The chosen customer stays an option while the search holds other names. */
  readonly customerOptions = computed(() => {
    const chosen = this.store.customer();
    const options = this.store.customerOptions();
    return chosen === null || options.some((option) => option.id === chosen.id)
      ? options
      : [chosen, ...options];
  });

  readonly customerWords = computed(() => {
    const customer = this.store.customer();
    return customer === null ? 'Two letters are enough to search.' : `${customer.accountNumber} · ${customer.displayName}`;
  });

  readonly contactPlaceholder = computed(() => {
    if (this.store.customer() === null) return 'Choose the customer first';
    if (this.store.context() === null) return 'Reading the customer’s contacts';
    return this.store.context()!.contacts.length === 0 ? 'The customer has no contact' : 'No contact named';
  });

  readonly orderPlaceholder = computed(() => {
    if (this.store.customer() === null) return 'Choose the customer first';
    if (this.store.context() === null) return 'Reading the customer’s orders';
    return this.store.context()!.recentOrders.length === 0 ? 'The customer has no recent order' : 'No order named';
  });

  readonly descriptionWords = computed(() =>
    this.store.channel() === 'internal'
      ? 'An internal ticket opens with these words as your message.'
      : 'It opens the conversation as the customer’s own message.',
  );

  readonly targetWords = computed(() => {
    const priority = this.store.priority();
    return `${PRIORITY_LABEL[priority]} priority: ${SLA_POLICY_WORDS[priority]}. ${BUSINESS_HOURS_WORDS}.`;
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    void this.store.prefill(params.get('customer'), params.get('order'));
  }

  customerLabel(option: CustomerListItem): string {
    return `${option.displayName} · ${option.accountNumber}`;
  }

  priorityWord(priority: TicketPriority): string {
    return PRIORITY_LABEL[priority];
  }

  words(value: string): string {
    const text = value.replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  date(iso: string): string {
    return formatDate(`${iso.slice(0, 10)}T12:00:00Z`);
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  choose(value: unknown): void {
    const customer = this.customerOptions().find((option) => option.id === value) ?? null;
    void this.store.choose(customer);
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof supportAdvice>[0]) {
    return supportAdvice(kind);
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const detail = await this.store.create();
    if (detail === null) return;
    this.toasts.show({ title: `${detail.ticket.ticketNumber} created`, tone: 'success' });
    // The form's entry is replaced: the back gesture from the ticket returns to where the form was opened from.
    void this.router.navigateByUrl(`${INBOX_ROUTE}/${detail.ticket.id}`, { replaceUrl: true });
  }
}
