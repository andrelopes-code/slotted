import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import { SlDatePicker } from '@slotted/angular/date-picker';
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
import {
  SlSection,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';
import { toISODate, type PlainDate } from '@slotted/core/date';
import type { PaymentMethod } from '@slotted/demo-nexora-backend';

import { formatMoney } from '../../core/catalog/catalog.model';
import {
  financeAdvice,
  PAYMENT_METHOD_LABEL,
  PAYMENTS_ROUTE,
} from '../../core/finance/finance.model';
import { RecordPaymentStore } from '../../core/finance/record-payment.store';
import { toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import { AllocationLines } from './allocation-lines';
import { chosenDate } from '../../core/chosen-date';
import type { CalendarValue } from '@slotted/angular/calendar';

const plainDate = (iso: string): PlainDate | null => {
  const [year, month, day] = iso.split('-').map(Number);
  return year && month && day ? { year, month, day } : null;
};

/**
 * Record payment (§66.9, FM-01): a payment received from a customer, posted at
 * once and allocated to the customer's open invoices in its currency. The
 * limits of §66.8 are applied as the reader types (FM-11), and what no invoice
 * takes is said before the submit as what it becomes: the customer's credit,
 * unapplied — the partial success of §33 stated as an outcome, not a warning.
 *
 * The form opens on its own route under the list it returns to; an invoice's
 * record opens it with `?customer=…&invoice=…`, which chooses the account and
 * gives that invoice what it owes. The draft lives in the store (FM-05).
 */
@Component({
  selector: 'app-record-payment-page',
  imports: [
    AllocationLines,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCombobox,
    SlComboboxItem,
    SlCurrencyField,
    SlCurrencyFieldInput,
    SlDatePicker,
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
    SlSection,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack [routerLink]="listRoute">Payments</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Record payment</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              Posted as it is recorded, in the customer’s currency; what no invoice takes stays
              their credit.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <form
          slForm
          data-testid="record-payment-form"
          [messages]="{ summaryTitle: 'The payment was not recorded' }"
          [errors]="store.errors()"
          (errorsChange)="store.acceptErrors($event.value)"
          [loading]="store.creating()"
          (formSubmit)="submit($event)"
        >
          @if (store.failure(); as failure) {
            <div slInlineMessage [tone]="tone(failure.kind)" data-testid="record-failure">
              <span slInlineMessageIcon></span>
              <span slStack [gap]="1">
                <span slText size="sm">{{ failure.message }}</span>
                <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
              </span>
            </div>
          }
          <div slStack [gap]="6">
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Payment</h2>
                  <p slSectionDescription>Who paid, how much, how and when.</p>
                </div>
              </div>
              <div slSectionBody>
                <div slGrid [columns]="phone() ? 1 : 2" [gap]="5" minItemWidth="sm">
                  <div slField required [invalid]="!!error('customerId')">
                    <label slFieldLabel>Customer</label>
                    <sl-combobox
                      name="customerId"
                      placeholder="Search accounts by name or number"
                      data-testid="payment-customer"
                      [filter]="null"
                      [loading]="store.searchingCustomers()"
                      [inputValue]="store.customerQuery()"
                      (inputValueChangeRequest)="store.searchCustomers($event.value)"
                      [value]="store.customer()?.id ?? null"
                      (valueChangeRequest)="chooseCustomer($event.value)"
                    >
                      @if (store.customer(); as chosen) {
                        <sl-combobox-item [value]="chosen.id" [label]="chosen.displayName" />
                      }
                      @for (option of otherOptions(); track option.id) {
                        <sl-combobox-item
                          [value]="option.id"
                          [label]="option.displayName + ' · ' + option.accountNumber"
                        />
                      }
                    </sl-combobox>
                    @if (error('customerId'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription>{{ customerWords() }}</span>
                    }
                  </div>
                  <div slField required [invalid]="!!error('amountMinor')">
                    <label slFieldLabel>Amount received</label>
                    <div slCurrencyField>
                      <input
                        slCurrencyFieldInput
                        name="amountMinor"
                        data-testid="payment-amount-input"
                        [currency]="store.currency()"
                        [min]="0"
                        [value]="store.amount()"
                        (valueChange)="store.setAmount($event.value ?? null)"
                      />
                    </div>
                    @if (error('amountMinor'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription
                        >In {{ store.currency() }}, the customer’s currency, which the payment is
                        recorded in.</span
                      >
                    }
                  </div>
                  <div slField required [invalid]="!!error('method')">
                    <label slFieldLabel>Method</label>
                    <sl-select
                      name="method"
                      [value]="store.method()"
                      (valueChangeRequest)="store.method.set($any($event.value) ?? store.method())"
                    >
                      @for (m of store.methods(); track m) {
                        <sl-select-item [value]="m">{{ methodWord(m) }}</sl-select-item>
                      }
                    </sl-select>
                    @if (error('method'); as message) {
                      <p slFieldError>{{ message }}</p>
                    }
                  </div>
                  <div slField>
                    <label slFieldLabel>Received on</label>
                    <div
                      slDatePicker
                      name="receivedDate"
                      [value]="dateOf(store.receivedDate())"
                      (valueChange)="store.receivedDate.set(isoOf($event.value))"
                    ></div>
                    <span slFieldDescription
                      >The day the money arrived; the bank deposit it is matched to later is dated
                      near it.</span
                    >
                  </div>
                  <div slField>
                    <label slFieldLabel>Reference</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="reference"
                        data-testid="payment-reference"
                        placeholder="ACH-24224149"
                        [value]="store.reference()"
                        (valueChange)="store.reference.set($event.value)"
                      />
                    </div>
                    <span slFieldDescription
                      >The bank’s own reference: the reconciliation scores a deposit carrying it
                      higher.</span
                    >
                  </div>
                </div>
              </div>
            </section>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Allocation</h2>
                  <p slSectionDescription>{{ allocationWords() }}</p>
                </div>
              </div>
              <div slSectionBody>
                @if (store.customer()) {
                  <app-allocation-lines
                    [lines]="store.lines()"
                    [pending]="store.readingInvoices()"
                    [errors]="store.errors()"
                    [currency]="store.currency()"
                    [available]="store.amountMinor()"
                    [otherCurrency]="store.otherCurrency()"
                    [phone]="phone()"
                    (lineChange)="store.setLine($event.invoiceId, $event.amount)"
                    (fill)="store.fillOldestFirst()"
                  />
                } @else {
                  <span slText size="sm" tone="muted"
                    >Choose the customer: their open invoices are listed here.</span
                  >
                }
              </div>
            </section>
          </div>

          <div slFormActions>
            <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute">Cancel</a>
            <button
              slButton
              type="submit"
              data-testid="record-submit"
              [loading]="store.creating()"
              [messages]="{ loading: 'Recording' }"
            >
              Record payment
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RecordPaymentPage {
  readonly store = inject(RecordPaymentStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = PAYMENTS_ROUTE;
  readonly phone = phoneSignal();

  /** The chosen account stays an option while the search lists others, so the field keeps its label. */
  readonly otherOptions = computed(() =>
    this.store.customerOptions().filter((option) => option.id !== this.store.customer()?.id),
  );

  readonly customerWords = computed(() => {
    const customer = this.store.customer();
    return customer
      ? `${customer.accountNumber} · pays in ${customer.preferredCurrency}.`
      : 'The account the money came from.';
  });

  readonly allocationWords = computed(() => {
    const amount = this.store.amountMinor();
    const currency = this.store.currency();
    if (amount <= 0) return 'Enter the amount received, then give each open invoice what it pays.';
    return `${formatMoney({ currency, minor: amount })} to give. Each invoice takes at most what it owes.`;
  });

  constructor() {
    const subscription = this.route.queryParamMap.subscribe(
      (params) => void this.store.start(params.get('customer'), params.get('invoice')),
    );
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  chooseCustomer(value: unknown): void {
    const id = typeof value === 'string' ? value : null;
    if (id === this.store.customer()?.id) return;
    const customer = this.store.customerOptions().find((option) => option.id === id) ?? null;
    void this.store.choose(customer);
  }

  methodWord(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABEL[method];
  }

  dateOf(iso: string): PlainDate | null {
    return iso ? plainDate(iso) : null;
  }

  iso(value: PlainDate): string {
    return toISODate(value);
  }

  isoOf(value: CalendarValue): string {
    const date = chosenDate(value);
    return date ? this.iso(date) : '';
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof financeAdvice>[0]) {
    return financeAdvice(kind);
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.record());
  }

  private async record(): Promise<void> {
    const detail = await this.store.record();
    if (detail === null) return;
    const payment = detail.payment;
    this.toasts.show({
      title: `${payment.paymentNumber} recorded`,
      description:
        payment.unappliedAmount.minor > 0
          ? `${formatMoney(payment.allocatedAmount)} went to ${payment.invoiceNumbers.length} ${payment.invoiceNumbers.length === 1 ? 'invoice' : 'invoices'}; ${formatMoney(payment.unappliedAmount)} stays unapplied as the customer’s credit.`
          : `${formatMoney(payment.allocatedAmount)} went to ${payment.invoiceNumbers.join(', ')}.`,
      tone: 'success',
    });
    // The form's entry is replaced by the payment, so the back gesture returns to where the form was opened from.
    void this.router.navigate([PAYMENTS_ROUTE, payment.id], { replaceUrl: true });
  }
}
