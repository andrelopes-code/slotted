import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
import { SlTextarea } from '@slotted/angular/textarea';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';
import { toISODate, type PlainDate } from '@slotted/core/date';
import type { SupplierListItem } from '@slotted/demo-nexora-backend';

import { formatMoney } from '../../core/catalog/catalog.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { phoneSignal } from '../../core/layout/phone';
import {
  FINANCE_APPROVAL_USD,
  PAYMENT_TERMS_LABEL,
  PROCUREMENT_APPROVAL_USD,
  PURCHASE_ORDERS_ROUTE,
  reasonWords,
  roleWords,
  SUPPLIER_STATUS_LABEL,
  SUPPLIER_TIER_LABEL,
} from '../../core/procurement/procurement.model';
import { PurchaseOrderDraftStore } from '../../core/procurement/purchase-order-draft.store';
import { PoLines } from './po-lines';
import { chosenDate } from '../../core/chosen-date';

/**
 * A purchase order written from nothing, or from a stock position below its
 * reorder point (§65.3–§65.5). The supplier sets the currency, the prices and
 * the terms; the warehouse is where the goods are delivered and received.
 *
 * What the submit will ask for is said in the form as the lines and the
 * freight are typed, by the policy the backend runs: the steps, the roles
 * and each reason, with the value in US dollars beside the order's own
 * currency (FM-11, FM-13). The draft outlives the page (FM-05).
 */
@Component({
  selector: 'app-new-purchase-order-page',
  imports: [
    PoLines,
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
    SlTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .work {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .reasons {
      display: grid;
      gap: var(--slotted-space-1);
      margin: 0;
      padding-inline-start: var(--slotted-space-5);
    }
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack [routerLink]="listRoute">Purchase orders</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New purchase order</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The order is written as a draft. Submitting it approves it at once or sends it for
              approval, as the form says below; nothing reaches the supplier until it is sent.
            </p>
          </div>
        </div>
      </header>

      <div slPageBody>
        <div class="work">
          <form
            slForm
            data-testid="new-po-form"
            [messages]="{ summaryTitle: 'This purchase order was not written' }"
            [errors]="store.errors()"
            (errorsChange)="store.errors.set($event.value)"
            [loading]="store.creating() !== null"
            (formSubmit)="submit($event, false)"
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
            <div slStack [gap]="6">
              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Supplier and delivery</h2>
                    <p slSectionDescription>
                      Who the order goes to and where the goods are received.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                    <div slField required [invalid]="!!error('supplierId')">
                      <label slFieldLabel>Supplier</label>
                      <sl-combobox
                        name="supplierId"
                        data-testid="supplier-search"
                        placeholder="Search suppliers by name or number"
                        [filter]="null"
                        [loading]="store.searchingSuppliers()"
                        [inputValue]="store.supplierQuery()"
                        (inputValueChangeRequest)="store.searchSuppliers($event.value)"
                        [value]="store.supplier()?.id ?? null"
                        (valueChangeRequest)="chooseSupplier($event.value)"
                      >
                        @for (option of supplierOptions(); track option.id) {
                          <sl-combobox-item [value]="option.id" [label]="supplierLabel(option)" />
                        }
                      </sl-combobox>
                      @if (error('supplierId'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription data-testid="supplier-words">{{
                          supplierWords()
                        }}</span>
                      }
                    </div>
                    <div slField required [invalid]="!!error('destinationWarehouseId')">
                      <label slFieldLabel>Deliver to</label>
                      <sl-select
                        name="destinationWarehouseId"
                        data-testid="destination"
                        placeholder="Choose the warehouse"
                        [value]="store.destinationWarehouseId()"
                        (valueChangeRequest)="
                          store.destinationWarehouseId.set($any($event.value) ?? null)
                        "
                      >
                        @for (row of store.destinations(); track row.id) {
                          <sl-select-item [value]="row.id"
                            >{{ row.code }} — {{ row.name }}</sl-select-item
                          >
                        }
                      </sl-select>
                      @if (error('destinationWarehouseId'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else {
                        <span slFieldDescription
                          >The warehouse receives the goods; a closed one receives nothing.</span
                        >
                      }
                    </div>
                    <div slField>
                      <label slFieldLabel>Expected</label>
                      <div
                        slDatePicker
                        name="expectedDate"
                        [value]="expected()"
                        (valueChange)="setExpected(chosenDate($event.value))"
                      ></div>
                      <span slFieldDescription
                        >Left empty, the order is expected ten business days from today.</span
                      >
                    </div>
                    @if (store.canSeeCost()) {
                      <div slField [invalid]="!!error('freightMinor')">
                        <label slFieldLabel>Freight ({{ store.currency() }})</label>
                        <div slCurrencyField>
                          <input
                            slCurrencyFieldInput
                            name="freightMinor"
                            [currency]="store.currency()"
                            [min]="0"
                            [value]="store.freight()"
                            (valueChange)="store.freight.set($event.value ?? null)"
                          />
                        </div>
                        @if (error('freightMinor'); as message) {
                          <p slFieldError>{{ message }}</p>
                        } @else {
                          <span slFieldDescription
                            >Counted in the approval value with the lines, before tax.</span
                          >
                        }
                      </div>
                    }
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Lines</h2>
                    <p slSectionDescription>
                      Each line is one SKU the supplier maps, in the SKU’s own unit and priced in
                      {{ store.currency() }}.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <app-po-lines
                    caption="Lines on this draft"
                    [lines]="store.lines()"
                    [currency]="store.currency()"
                    [errors]="store.errors()"
                    [phone]="phone()"
                    [showCost]="store.canSeeCost()"
                    [options]="store.lineOptions()"
                    [query]="store.lineQuery()"
                    [reading]="store.readingSupplier()"
                    [disabled]="store.supplier() === null"
                    (queryChange)="store.lineQuery.set($event)"
                    (add)="store.addSku($event)"
                    (quantityChange)="store.setQuantity($event.skuId, $event.value)"
                    (unitCostChange)="store.setUnitCost($event.skuId, $event.value)"
                    (remove)="store.remove($event)"
                  />
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle>
                    <h2 slSectionHeading>Approval</h2>
                    <p slSectionDescription>
                      What submitting this order asks for, by the rules Nexora applies on submit.
                    </p>
                  </div>
                </div>
                <div slSectionBody>
                  <div slInlineMessage [tone]="approvalTone()" data-testid="approval-preview">
                    <span slInlineMessageIcon></span>
                    <span slStack [gap]="2">
                      <span slText size="sm">{{ approvalHeadline() }}</span>
                      @if (store.approval(); as approval) {
                        @if (approval.required) {
                          <ul class="reasons">
                            @for (why of approval.reasons; track why) {
                              <li>
                                <span slText size="sm">{{ reason(why) }}</span>
                              </li>
                            }
                          </ul>
                        }
                      }
                      <span slText size="sm" tone="muted">{{ approvalFootnote() }}</span>
                    </span>
                  </div>
                </div>
              </section>

              <section slSection>
                <div slSectionHeader>
                  <div slSectionTitle><h2 slSectionHeading>Notes</h2></div>
                </div>
                <div slSectionBody>
                  <div slField>
                    <label slFieldLabel>Notes</label>
                    <textarea
                      slTextarea
                      name="notes"
                      [rows]="3"
                      [value]="store.notes()"
                      (valueChange)="store.notes.set($event.value)"
                      placeholder="Expedite: the Meridian backorder waits on this lot."
                    ></textarea>
                  </div>
                </div>
              </section>
            </div>

            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute">Cancel</a>
              <button
                slButton
                type="submit"
                variant="outline"
                tone="secondary"
                data-testid="save-draft"
                [loading]="store.creating() === 'draft'"
                [disabled]="store.creating() === 'submit'"
                [messages]="{ loading: 'Writing the draft' }"
              >
                Save as draft
              </button>
              <button
                slButton
                type="button"
                data-testid="create-and-submit"
                [loading]="store.creating() === 'submit'"
                [disabled]="store.creating() === 'draft'"
                [messages]="{ loading: 'Writing and submitting' }"
                (click)="writeAndSubmit()"
              >
                {{ submitLabel() }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NewPurchaseOrderPage {
  readonly chosenDate = chosenDate;
  readonly store = inject(PurchaseOrderDraftStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = PURCHASE_ORDERS_ROUTE;
  readonly phone = phoneSignal();

  /** The chosen supplier stays an option while the search holds other names. */
  readonly supplierOptions = computed(() => {
    const chosen = this.store.supplier();
    const options = this.store.supplierOptions();
    return chosen === null || options.some((option) => option.id === chosen.id)
      ? options
      : [chosen, ...options];
  });

  readonly expected = computed<PlainDate | null>(() => {
    const iso = this.store.expectedDate();
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    return year && month && day ? { year, month, day } : null;
  });

  readonly supplierWords = computed(() => {
    const supplier = this.store.supplier();
    if (supplier === null)
      return 'Two letters are enough to search. On-hold and inactive suppliers are listed and receive no orders.';
    const tier = SUPPLIER_TIER_LABEL[supplier.relationshipTier];
    const conditional =
      supplier.relationshipTier === 'conditional'
        ? ' A conditional supplier: every order waits on a Procurement Manager.'
        : '';
    return `${tier} · ${PAYMENT_TERMS_LABEL[supplier.paymentTermsCode]} · orders in ${this.store.currency()}.${conditional}`;
  });

  readonly submitLabel = computed(() =>
    this.store.approval()?.required ? 'Save and submit for approval' : 'Save and submit',
  );

  readonly approvalTone = computed(() =>
    this.store.approval()?.required ? 'warning' : 'secondary',
  );

  readonly approvalHeadline = computed(() => {
    const approval = this.store.approval();
    if (!this.store.canSeeCost())
      return `Submitting approves the order at once unless it is worth US$${PROCUREMENT_APPROVAL_USD.toLocaleString('en-US')} or more with freight, the supplier is conditional, or a unit cost is more than 15% above the last one accepted — then a Procurement Manager approves it, and from US$${FINANCE_APPROVAL_USD.toLocaleString('en-US')} or 30% a Finance Manager as well.`;
    if (this.store.supplier() === null || this.store.lines().length === 0)
      return 'Choose the supplier and add a line: the form then says whether submitting needs an approval.';
    if (approval === null) return '';
    if (!approval.required)
      return `Submitting approves it at once: ${this.usd(approval.valueUsdMinor)} with freight is under US$${PROCUREMENT_APPROVAL_USD.toLocaleString('en-US')}, the supplier is not conditional, and no unit cost is more than 15% above the last one accepted.`;
    const roles = approval.steps.map((step) => roleWords(step.requiredRole)).join(', then a ');
    return `Submitting sends it to a ${roles} for approval, because:`;
  });

  readonly approvalFootnote = computed(() => {
    const approval = this.store.approval();
    if (approval === null)
      return 'The approval is decided by the backend on submit; the buyer who submits never approves their own order.';
    const currency = this.store.currency();
    const value =
      currency === 'USD'
        ? `The approval value is ${this.usd(approval.valueUsdMinor)}: the lines and the freight, before tax.`
        : `The approval value is ${this.usd(approval.valueUsdMinor)}: ${formatMoney({ currency, minor: this.store.subtotal() + this.store.freightMinor() })} of lines and freight, before tax, in US dollars.`;
    return `${value} The buyer who submits never approves their own order.`;
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    void this.store.prefill({
      sku: params.get('sku'),
      warehouse: params.get('warehouse'),
      quantity: params.get('quantity'),
      supplier: params.get('supplier'),
    });
  }

  usd(minor: number): string {
    return formatMoney({ currency: 'USD', minor });
  }

  reason(value: string): string {
    return reasonWords(value);
  }

  supplierLabel(option: SupplierListItem): string {
    const state = option.status === 'active' ? '' : ` · ${SUPPLIER_STATUS_LABEL[option.status]}`;
    return `${option.displayName} · ${option.supplierNumber}${state}`;
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  setExpected(value: PlainDate | null | undefined): void {
    this.store.expectedDate.set(value ? toISODate(value) : '');
  }

  chooseSupplier(value: unknown): void {
    const supplier = this.supplierOptions().find((option) => option.id === value) ?? null;
    void this.store.chooseSupplier(supplier);
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  submit(event: { pending: (work: Promise<void>) => void }, submit: boolean): void {
    event.pending(this.write(submit));
  }

  writeAndSubmit(): void {
    void this.write(true);
  }

  private async write(submit: boolean): Promise<void> {
    const result = await this.store.create(submit);
    if (result === null) return;
    const { po, submitFailure } = result;
    if (submitFailure !== null)
      this.toasts.show({
        title: `${po.purchaseOrderNumber} written as a draft, not submitted`,
        description: submitFailure.message,
        tone: 'warning',
      });
    else
      this.toasts.show({
        title:
          po.status === 'pending_approval'
            ? `${po.purchaseOrderNumber} submitted for approval`
            : po.status === 'approved'
              ? `${po.purchaseOrderNumber} submitted and approved`
              : `${po.purchaseOrderNumber} written as a draft`,
        tone: 'success',
      });
    void this.router.navigateByUrl(`${PURCHASE_ORDERS_ROUTE}/${po.id}`);
  }
}
