import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
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
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';
import type {
  CreditMemoReason,
  CustomerListItem,
  InvoiceListItem,
} from '@slotted/demo-nexora-backend';

import { formatDate, formatMoney } from '../../core/catalog/catalog.model';
import { CreditMemoDraftStore } from '../../core/finance/credit-memo-draft.store';
import {
  CREDIT_MEMO_REASON_LABEL,
  CREDIT_MEMOS_ROUTE,
  financeAdvice,
  INVOICE_STATUS_LABEL,
} from '../../core/finance/finance.model';
import { toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';

/**
 * A new credit memo (§66.11), on its own route under the list it returns to
 * (FM-01). An invoice record links here with `?customer=` and `?invoice=`, so
 * the memo that corrects it opens on its customer and names it as its source.
 * The memo is written as a draft in the customer's currency; the page header
 * says what it will be on arrival and what opening and applying it do.
 */
@Component({
  selector: 'app-new-credit-memo-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCombobox,
    SlComboboxItem,
    SlCurrencyField,
    SlCurrencyFieldInput,
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
    SlTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .work {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack [routerLink]="listRoute">Credit memos</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New credit memo</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The memo is written as a draft, and nothing changes until it is opened: opening it
              makes the credit usable, applying it lowers what an open invoice of the customer owes,
              and what is not applied stays as credit or is refunded.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="work">
          <form
            slForm
            data-testid="new-credit-memo-form"
            [messages]="{ summaryTitle: 'This credit memo was not written' }"
            [errors]="store.errors()"
            (errorsChange)="store.errors.set($event.value)"
            [loading]="store.creating()"
            (formSubmit)="submit($event)"
          >
            @if (store.failure(); as failure) {
              @if (failure.kind !== 'validation') {
                <div slInlineMessage [tone]="tone(failure.kind)">
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
                    <span slFieldDescription data-testid="customer-words">{{
                      customerWords()
                    }}</span>
                  }
                </div>
                <div slField required [invalid]="!!error('reason')">
                  <label slFieldLabel>Reason</label>
                  <sl-select
                    name="reason"
                    data-testid="reason"
                    placeholder="Choose why the credit is given"
                    [value]="store.reason()"
                    (valueChangeRequest)="store.reason.set($any($event.value) ?? null)"
                  >
                    @for (reason of reasons; track reason.value) {
                      <sl-select-item [value]="reason.value">{{ reason.label }}</sl-select-item>
                    }
                  </sl-select>
                  @if (error('reason'); as message) {
                    <p slFieldError>{{ message }}</p>
                  }
                </div>
                <div slField required [invalid]="!!error('amountMinor')">
                  <label slFieldLabel>Amount ({{ store.currency() }})</label>
                  <div slCurrencyField>
                    <input
                      slCurrencyFieldInput
                      name="amountMinor"
                      data-testid="amount"
                      [currency]="store.currency()"
                      [min]="0"
                      [value]="store.amount()"
                      (valueChange)="store.amount.set($event.value ?? null)"
                    />
                  </div>
                  @if (error('amountMinor'); as message) {
                    <p slFieldError>{{ message }}</p>
                  } @else {
                    <span slFieldDescription
                      >Before tax, in the customer’s currency: a credit is applied only to invoices
                      in it.</span
                    >
                  }
                </div>
                <div slField [invalid]="!!error('taxMinor')">
                  <label slFieldLabel>Tax ({{ store.currency() }})</label>
                  <div slCurrencyField>
                    <input
                      slCurrencyFieldInput
                      name="taxMinor"
                      [currency]="store.currency()"
                      [min]="0"
                      [value]="store.tax()"
                      (valueChange)="store.tax.set($event.value ?? null)"
                    />
                  </div>
                  @if (error('taxMinor'); as message) {
                    <p slFieldError>{{ message }}</p>
                  } @else {
                    <span slFieldDescription>The tax the credit gives back, if any.</span>
                  }
                </div>
              </div>
              <div slField [invalid]="!!error('sourceInvoiceId')">
                <label slFieldLabel>Invoice it corrects</label>
                <sl-select
                  name="sourceInvoiceId"
                  data-testid="source-invoice"
                  clearable
                  [placeholder]="sourcePlaceholder()"
                  [disabled]="store.customer() === null"
                  [value]="store.sourceInvoiceId()"
                  (valueChangeRequest)="store.sourceInvoiceId.set($any($event.value) ?? null)"
                >
                  @for (invoice of store.invoices() ?? []; track invoice.id) {
                    <sl-select-item [value]="invoice.id">{{
                      invoiceLabel(invoice)
                    }}</sl-select-item>
                  }
                </sl-select>
                @if (error('sourceInvoiceId'); as message) {
                  <p slFieldError>{{ message }}</p>
                } @else {
                  <span slFieldDescription
                    >Optional. The memo names it; the credit is applied from the memo once it is
                    open.</span
                  >
                }
              </div>
              <div slField required [invalid]="!!error('description')">
                <label slFieldLabel>Description</label>
                <textarea
                  slTextarea
                  name="description"
                  data-testid="description"
                  [rows]="2"
                  [value]="store.description()"
                  (valueChange)="store.description.set($event.value)"
                  placeholder="Price corrected to the contract rate on two lines."
                ></textarea>
                @if (error('description'); as message) {
                  <p slFieldError>{{ message }}</p>
                } @else {
                  <span slFieldDescription
                    >The memo’s one line: the customer reads it on the document.</span
                  >
                }
              </div>
              <span slText size="sm" tone="muted" data-testid="memo-outcome">{{ outcome() }}</span>
            </div>
            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute">Cancel</a>
              <button
                slButton
                type="submit"
                data-testid="create-credit-memo"
                [loading]="store.creating()"
                [messages]="{ loading: 'Writing the draft' }"
              >
                Write the draft
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NewCreditMemoPage {
  readonly store = inject(CreditMemoDraftStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = CREDIT_MEMOS_ROUTE;
  readonly phone = phoneSignal();
  readonly reasons = (Object.keys(CREDIT_MEMO_REASON_LABEL) as CreditMemoReason[]).map((value) => ({
    value,
    label: CREDIT_MEMO_REASON_LABEL[value],
  }));

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
    return customer === null
      ? 'Two letters are enough to search.'
      : `${customer.accountNumber} · the memo is written in ${customer.preferredCurrency}.`;
  });

  readonly sourcePlaceholder = computed(() => {
    const invoices = this.store.invoices();
    if (this.store.customer() === null) return 'Choose the customer first';
    if (invoices === null) return 'Reading the customer’s invoices';
    return invoices.length === 0 ? 'The customer has no open invoice' : 'No invoice named';
  });

  readonly outcome = computed(() => {
    const total = this.store.totalMinor();
    const customer = this.store.customer();
    if (customer === null || total <= 0)
      return 'The total, amount and tax, is said here once the customer and the amount are known.';
    return `A draft for ${formatMoney({ currency: this.store.currency(), minor: total })} of credit to ${customer.displayName}. It changes no invoice until it is opened and applied.`;
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    void this.store.prefill(params.get('customer'), params.get('invoice'));
  }

  customerLabel(option: CustomerListItem): string {
    return `${option.displayName} · ${option.accountNumber}`;
  }

  invoiceLabel(invoice: InvoiceListItem): string {
    return `${invoice.invoiceNumber ?? 'Draft'} · ${INVOICE_STATUS_LABEL[invoice.displayStatus]} · due ${formatDate(invoice.dueDate)} · owes ${formatMoney(invoice.outstanding)}`;
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

  advice(kind: Parameters<typeof financeAdvice>[0]) {
    return financeAdvice(kind);
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const memo = await this.store.create();
    if (memo === null) return;
    this.toasts.show({ title: `${memo.creditMemoNumber} written as a draft`, tone: 'success' });
    // The form's entry is replaced: the back gesture from the memo returns to where the form was opened from.
    void this.router.navigateByUrl(`${CREDIT_MEMOS_ROUTE}/${memo.id}`, { replaceUrl: true });
  }
}
