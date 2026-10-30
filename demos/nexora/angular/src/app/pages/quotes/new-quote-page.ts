import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
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
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { toISODate, type PlainDate } from '@slotted/core/date';
import type { SkuListItem } from '@slotted/demo-nexora-backend';

import { QuoteDraftStore } from '../../core/sales/quote-draft.store';
import { formatMoney } from '../orders/order-labels';
import { chosenDate } from '../../core/chosen-date';

/**
 * A quote written from nothing (§58.1): the account, the items and the
 * quantities. Prices, taxes and the margin are the backend's answer, so the
 * screen shows what the catalogue asks as an estimate and says so.
 */
@Component({
  selector: 'app-new-quote-page',
  imports: [
    RouterLink,
    SlBadge,
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
    SlIconButton,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlNumberField,
    SlNumberFieldInput,
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
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
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
    .picker {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto;
      column-gap: var(--slotted-space-3);
      row-gap: 0;
    }
    /* Label, control and description share three rows across the fields: a field with a
       description keeps its control on the same line as a field without one. */
    .picker > [slField] {
      grid-row: span 3;
      grid-template-rows: subgrid;
    }
    .picker > [slButton] {
      grid-column: -2;
      grid-row: 2;
      align-self: center;
    }
    @container (width < 720px) {
      .picker {
        grid-template-columns: minmax(0, 1fr);
        row-gap: var(--slotted-space-3);
      }
      .picker > [slField],
      .picker > [slButton] {
        grid-column: auto;
        grid-row: auto;
      }
      .picker > [slField] {
        grid-template-rows: none;
      }
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      gap: var(--slotted-space-3);
    }
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack routerLink="/sales/quotes">Quotes</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New quote</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The quote opens as a draft. Nexora prices every line from the account's price list
              when the draft is written, and the draft is what the customer never sees.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="work">
          <form
            slForm
            [messages]="{ summaryTitle: 'This quote was not written' }"
            [errors]="store.errors()"
            (errorsChange)="store.errors.set($event.value)"
            [loading]="store.creating()"
            (formSubmit)="submit($event)"
          >
            @if (store.failure(); as failure) {
              <div slInlineMessage [tone]="failure.code === 'FORBIDDEN' ? 'warning' : 'danger'">
                <span slInlineMessageIcon></span>
                {{ failure.message }}
              </div>
            }

            <div slStack [gap]="6">
              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Account</h2>
                    <p slSectionDescription>
                      Who the quote is for. Its price list, its currency and its primary contact
                      come with it.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                    <div slField required [invalid]="!!error('customerId')">
                      <label slFieldLabel>Customer</label>
                      <sl-combobox
                        name="customerId"
                        placeholder="Search accounts by name or number"
                        [filter]="null"
                        [loading]="store.searchingCustomers()"
                        [inputValue]="store.customerQuery()"
                        (inputValueChangeRequest)="searchCustomers($event.value)"
                        [value]="store.customer()?.id ?? null"
                        (valueChangeRequest)="chooseCustomer($event.value)"
                      >
                        @for (option of store.customerOptions(); track option.id) {
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
                    <div slField>
                      <label slFieldLabel>Good until</label>
                      <div
                        slDatePicker
                        name="expirationDate"
                        [value]="expiration()"
                        (valueChange)="setExpiration(chosenDate($event.value))"
                      ></div>
                      <span slFieldDescription>Left empty, Nexora gives the quote 30 days.</span>
                    </div>
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Lines</h2>
                    <p slSectionDescription>
                      What is being quoted. The price beside each item is the catalogue's; the
                      quote's own prices are written when it is saved.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slStack [gap]="5">
                    <div class="picker">
                      <div slField>
                        <label slFieldLabel>Item</label>
                        <sl-combobox
                          placeholder="Search the catalogue by code or name"
                          [filter]="null"
                          [loading]="store.searchingSkus()"
                          [inputValue]="store.skuQuery()"
                          (inputValueChangeRequest)="searchSkus($event.value)"
                          [value]="chosenSku()?.id ?? null"
                          (valueChangeRequest)="chooseSku($event.value)"
                        >
                          @for (option of store.skuOptions(); track option.id) {
                            <sl-combobox-item
                              [value]="option.id"
                              [label]="option.sku + ' — ' + option.name"
                            />
                          }
                        </sl-combobox>
                        @if (chosenSku(); as sku) {
                          <span slFieldDescription>{{ skuWords(sku) }}</span>
                        }
                      </div>
                      <div slField>
                        <label slFieldLabel>Quantity</label>
                        <div slNumberField>
                          <input
                            slNumberFieldInput
                            [min]="1"
                            [value]="quantity()"
                            (valueChange)="quantity.set($event.value ?? 1)"
                          />
                        </div>
                      </div>
                      <div slField>
                        <label slFieldLabel>Discount</label>
                        <div slNumberField>
                          <input
                            slNumberFieldInput
                            [min]="0"
                            [max]="60"
                            [value]="discount()"
                            (valueChange)="discount.set($event.value ?? 0)"
                          />
                        </div>
                        <span slFieldDescription>Percent off the list price.</span>
                      </div>
                      <button
                        slButton
                        type="button"
                        [disabled]="chosenSku() === null"
                        (click)="addLine()"
                      >
                        Add line
                      </button>
                    </div>

                    @if (store.lines().length === 0) {
                      <div slInlineMessage tone="secondary">
                        <span slInlineMessageIcon></span>
                        A quote needs at least one line before Nexora will take it.
                      </div>
                    } @else {
                      <div slTable variant="framed" [columns]="5">
                        <div slTableContent>
                          <caption slTableCaption>
                            Lines on this draft
                          </caption>
                          <thead slTableHead>
                            <tr slTableRow>
                              <th slTableColumnHeader>Item</th>
                              <th slTableColumnHeader>Quantity</th>
                              <th slTableColumnHeader>Discount</th>
                              <th slTableColumnHeader>Catalogue estimate</th>
                              <th slTableColumnHeader>Remove</th>
                            </tr>
                          </thead>
                          <tbody slTableBody>
                            @for (line of store.lines(); track line.skuId) {
                              <tr slTableRow>
                                <th slTableRowHeader>
                                  <span slStack [gap]="1">
                                    <span slText size="sm" weight="medium">{{ line.skuName }}</span>
                                    <span slText size="sm" tone="muted">{{ line.skuCode }}</span>
                                  </span>
                                </th>
                                <td slTableCell>
                                  <div slNumberField size="sm">
                                    <input
                                      slNumberFieldInput
                                      [min]="1"
                                      [attr.aria-label]="'Quantity of ' + line.skuName"
                                      [value]="number(line.quantity)"
                                      (valueChange)="setQuantity(line.skuId, $event.value)"
                                    />
                                  </div>
                                </td>
                                <td slTableCell>
                                  <div slNumberField size="sm">
                                    <input
                                      slNumberFieldInput
                                      [min]="0"
                                      [max]="60"
                                      [attr.aria-label]="'Discount on ' + line.skuName"
                                      [value]="line.discountBps / 100"
                                      (valueChange)="setDiscount(line.skuId, $event.value)"
                                    />
                                  </div>
                                </td>
                                <td slTableCell>{{ lineEstimate(line) }}</td>
                                <td slTableCell>
                                  <button
                                    slIconButton
                                    variant="ghost"
                                    tone="secondary"
                                    size="sm"
                                    type="button"
                                    [attr.aria-label]="'Remove ' + line.skuName"
                                    (click)="store.removeLine(line.skuId)"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </div>
                      </div>
                      <div class="totals">
                        <span slInline [gap]="2">
                          <span slText size="sm" tone="muted">Catalogue estimate</span>
                          <span slText weight="medium">{{ estimate() }}</span>
                          <span slBadge variant="soft" size="sm" tone="secondary">
                            before tax and freight
                          </span>
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Freight and notes</h2>
                  </div>
                </div>
                <div slSectionBody>
                  <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                    <div slField>
                      <label slFieldLabel>Freight</label>
                      <div slCurrencyField>
                        <input
                          slCurrencyFieldInput
                          name="freightMinor"
                          [currency]="currency()"
                          [min]="0"
                          [value]="store.freight()"
                          (valueChange)="store.freight.set($event.value)"
                        />
                      </div>
                    </div>
                    <div slField>
                      <label slFieldLabel>Notes</label>
                      <textarea
                        slTextarea
                        name="notes"
                        [rows]="3"
                        [value]="store.notes()"
                        (valueChange)="store.notes.set($event.value)"
                        placeholder="Lead time confirmed with the plant for week 42."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" routerLink="/sales/quotes">Cancel</a>
              <button
                slButton
                type="submit"
                tone="accent"
                [disabled]="!store.ready()"
                [loading]="store.creating()"
                [messages]="{ loading: 'Writing the quote' }"
              >
                Write the quote
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NewQuotePage {
  readonly chosenDate = chosenDate;
  readonly store = inject(QuoteDraftStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly chosenSku = signal<SkuListItem | null>(null);
  readonly quantity = signal(1);
  readonly discount = signal(0);

  readonly currency = computed(() => this.store.customer()?.preferredCurrency ?? 'USD');

  /** The field speaks in parts; the command speaks in `YYYY-MM-DD` (§53.6). */
  readonly expiration = computed<PlainDate | null>(() => {
    const iso = this.store.expirationDate();
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    return year && month && day ? { year, month, day } : null;
  });

  readonly customerWords = computed(() => {
    const customer = this.store.customer();
    if (customer === null) return 'Two letters are enough to search.';
    return `${customer.segment.replace('_', ' ')} · ${customer.paymentTermsCode.replace(/_/g, ' ')} · ${customer.preferredCurrency}`;
  });

  setExpiration(value: PlainDate | null | undefined): void {
    this.store.expirationDate.set(value ? toISODate(value) : '');
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  async searchCustomers(query: string): Promise<void> {
    await this.store.searchCustomers(query);
  }

  chooseCustomer(value: unknown): void {
    const id = typeof value === 'string' ? value : null;
    const customer = this.store.customerOptions().find((option) => option.id === id) ?? null;
    this.store.choose(customer);
    if (customer) this.store.customerQuery.set(customer.displayName);
  }

  async searchSkus(query: string): Promise<void> {
    await this.store.searchSkus(query);
  }

  chooseSku(value: unknown): void {
    const id = typeof value === 'string' ? value : null;
    const sku = this.store.skuOptions().find((option) => option.id === id) ?? null;
    this.chosenSku.set(sku);
    if (sku) this.store.skuQuery.set(`${sku.sku} — ${sku.name}`);
  }

  skuWords(sku: SkuListItem): string {
    const price = sku.listPrice ? formatMoney(sku.listPrice) : 'no list price';
    return `${price} · ${Number(sku.available)} available now`;
  }

  addLine(): void {
    const sku = this.chosenSku();
    if (sku === null) return;
    this.store.addLine(sku, String(this.quantity()), Math.round(this.discount() * 100));
    this.chosenSku.set(null);
    this.store.skuQuery.set('');
    this.store.skuOptions.set([]);
    this.quantity.set(1);
    this.discount.set(0);
  }

  number(quantity: string): number {
    return Number(quantity);
  }

  setQuantity(skuId: string, value: number | null): void {
    this.store.patchLine(skuId, { quantity: String(value ?? 1) });
  }

  setDiscount(skuId: string, value: number | null): void {
    this.store.patchLine(skuId, { discountBps: Math.round((value ?? 0) * 100) });
  }

  lineEstimate(line: { listPriceMinor?: number; quantity: string; discountBps: number }): string {
    if (line.listPriceMinor === undefined) return '—';
    const minor = line.listPriceMinor * (1 - line.discountBps / 10_000) * Number(line.quantity);
    return formatMoney({ currency: this.currency(), minor: Math.round(minor) });
  }

  estimate(): string {
    return formatMoney({ currency: this.currency(), minor: Math.round(this.store.estimate()) });
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const detail = await this.store.create();
    if (detail === null) return;
    this.toasts.show({
      title: `${detail.quote.quoteNumber} written as a draft`,
      description: 'Submit it for approval, or send it straight to the customer.',
      tone: 'success',
    });
    void this.router.navigateByUrl(`/sales/quotes/${detail.quote.id}`);
  }
}
