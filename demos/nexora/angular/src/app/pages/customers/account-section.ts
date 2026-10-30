import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTagsInput } from '@slotted/angular/tags-input';
import { SlText } from '@slotted/angular/typography';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import type { CustomerListItem, Money } from '@slotted/demo-nexora-backend';

import { CrmLookupsStore } from '../../core/crm/crm-lookups.store';
import { CustomerEditStore } from '../../core/crm/customer-edit.store';
import { SessionStore } from '../../core/session/session.store';
import { formatMoney, SEGMENT_LABEL, TERMS_LABEL } from './customer-columns';

/**
 * The account's own facts, read as a description list and written in place.
 * The section keeps its heading and its place on the record while the form
 * stands in its body, so the reader never leaves the record to correct it.
 */
@Component({
  selector: 'app-account-section',
  imports: [
    SlButton,
    SlCheckbox,
    SlCurrencyField,
    SlCurrencyFieldInput,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlForm,
    SlFormActions,
    SlGrid,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlSkeleton,
    SlStack,
    SlTag,
    SlTagBody,
    SlTagsInput,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .muted {
      color: var(--slotted-text-muted);
    }
    /* The conflict's three columns read as one line per field until the width runs out. */
    .conflict-row {
      display: grid;
      grid-template-columns: minmax(8rem, 1fr) 2fr;
      gap: var(--slotted-space-2) var(--slotted-space-4);
    }
    .span-all {
      grid-column: 1 / -1;
    }
  `,
  template: `
    <section slSection>
      <div slSectionHeader>
        <div slSectionTitle><h2 slSectionHeading>Account</h2></div>
        @if (customer(); as c) {
          <div slSectionActions>
            @if (edit.editing()) {
              <button
                slButton
                size="sm"
                variant="ghost"
                tone="secondary"
                type="button"
                (click)="edit.cancel()"
              >
                Cancel
              </button>
            } @else if (canEdit()) {
              <button
                slButton
                size="sm"
                variant="outline"
                tone="secondary"
                type="button"
                [disabled]="c.status === 'closed'"
                (click)="edit.start(c)"
              >
                Edit
              </button>
            }
          </div>
        }
      </div>
      <div slSectionBody>
        @if (customer(); as c) {
          @if (c.status === 'closed' && canEdit()) {
            <div slInlineMessage tone="secondary">
              <span slInlineMessageIcon></span>
              An archived account is read-only. Its history stays where it is.
            </div>
          }
          @if (edit.editing() && edit.draft(); as draft) {
            <form
              slForm
              #form="slForm"
              [messages]="{ summaryTitle: 'This account was not saved' }"
              [errors]="edit.errors()"
              (errorsChange)="edit.errors.set($event.value)"
              [loading]="edit.saving()"
              (formSubmit)="save($event)"
            >
              @if (edit.conflict(); as fields) {
                <div slInlineMessage tone="warning">
                  <span slInlineMessageIcon></span>
                  <div slStack [gap]="3">
                    <span slText size="sm">
                      {{ conflictSentence(fields.length) }} Choose which version the account keeps.
                    </span>
                    <div slStack [gap]="2">
                      @for (field of fields; track field.label) {
                        <div class="conflict-row">
                          <span slText size="sm" weight="medium">{{ field.label }}</span>
                          <div slStack [gap]="1">
                            <span slText size="sm">Now on the account: {{ field.theirs }}</span>
                            @if (field.mine !== null) {
                              <span slText size="sm">In your form: {{ field.mine }}</span>
                            } @else {
                              <span slText size="sm" tone="muted">
                                You did not change this field.
                              </span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    <span slInline [gap]="3">
                      <button
                        slButton
                        size="sm"
                        type="button"
                        [loading]="edit.saving()"
                        [messages]="{ loading: 'Saving' }"
                        (click)="applyMine()"
                      >
                        Keep what I wrote
                      </button>
                      <button
                        slButton
                        size="sm"
                        variant="outline"
                        tone="secondary"
                        type="button"
                        (click)="edit.takeTheirs()"
                      >
                        Start from the account
                      </button>
                    </span>
                  </div>
                </div>
              }
              @if (edit.failure(); as failure) {
                <div slInlineMessage [tone]="failure.code === 'FORBIDDEN' ? 'warning' : 'danger'">
                  <span slInlineMessageIcon></span>
                  {{ failure.code === 'FORBIDDEN' ? ownerRefusal(c) : failure.message }}
                </div>
              }
              <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                <div slField class="span-all" required [invalid]="!!error('displayName')">
                  <label slFieldLabel>Account name</label>
                  <div slTextField>
                    <input
                      slTextFieldInput
                      name="displayName"
                      required
                      [value]="draft.displayName"
                      (valueChange)="edit.patch({ displayName: $event.value })"
                    />
                  </div>
                  @if (error('displayName'); as message) {
                    <p slFieldError>{{ message }}</p>
                  }
                </div>
                <div slField [invalid]="!!error('legalName')">
                  <label slFieldLabel>Legal name</label>
                  <div slTextField>
                    <input
                      slTextFieldInput
                      name="legalName"
                      [value]="draft.legalName"
                      (valueChange)="edit.patch({ legalName: $event.value })"
                    />
                  </div>
                </div>
                <div slField required [invalid]="!!error('industry')">
                  <label slFieldLabel>Industry</label>
                  <div slTextField>
                    <input
                      slTextFieldInput
                      name="industry"
                      required
                      [value]="draft.industry"
                      (valueChange)="edit.patch({ industry: $event.value })"
                    />
                  </div>
                  @if (error('industry'); as message) {
                    <p slFieldError>{{ message }}</p>
                  }
                </div>
                <div slField required [invalid]="!!error('segment')">
                  <label slFieldLabel>Segment</label>
                  <sl-select
                    name="segment"
                    [value]="draft.segment"
                    (valueChangeRequest)="edit.patch({ segment: $any($event.value) })"
                  >
                    @for (option of segments; track option.value) {
                      <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                    }
                  </sl-select>
                  @if (error('segment'); as message) {
                    <p slFieldError>{{ message }}</p>
                  }
                </div>
                <div slField>
                  <label slFieldLabel>Website</label>
                  <div slTextField>
                    <input
                      slTextFieldInput
                      name="website"
                      type="url"
                      placeholder="https://"
                      [value]="draft.website"
                      (valueChange)="edit.patch({ website: $event.value })"
                    />
                  </div>
                  @if (draft.website === '' && c.website) {
                    <span slFieldDescription>
                      Nexora keeps the address it has: this command does not clear one.
                    </span>
                  }
                </div>
                <div slField>
                  <label slFieldLabel>Employees</label>
                  <div slTextField>
                    <input
                      slTextFieldInput
                      name="employeeBand"
                      placeholder="201-500"
                      [value]="draft.employeeBand"
                      (valueChange)="edit.patch({ employeeBand: $event.value })"
                    />
                  </div>
                </div>
                <div slField>
                  <label slFieldLabel>Payment terms</label>
                  <sl-select
                    name="paymentTermsCode"
                    [value]="draft.paymentTermsCode"
                    (valueChangeRequest)="edit.patch({ paymentTermsCode: $any($event.value) })"
                  >
                    @for (option of termOptions; track option.value) {
                      <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                    }
                  </sl-select>
                </div>
                <div slField>
                  <label slFieldLabel>Price list</label>
                  <sl-select
                    name="priceListId"
                    [loading]="lookups.loading()"
                    [value]="draft.priceListId"
                    (valueChangeRequest)="edit.patch({ priceListId: $any($event.value) ?? '' })"
                  >
                    @for (list of priceLists(); track list.id) {
                      <sl-select-item [value]="list.id">{{ list.name }}</sl-select-item>
                    }
                  </sl-select>
                </div>
                @if (session.can('customers.credit_view')) {
                  <div
                    slField
                    [readOnly]="!canEditCredit()"
                    [invalid]="!!error('creditLimitMinor')"
                  >
                    <label slFieldLabel>Credit limit</label>
                    <div slCurrencyField>
                      <input
                        slCurrencyFieldInput
                        name="creditLimitMinor"
                        [currency]="c.preferredCurrency"
                        [locale]="c.regionCode === 'BR' ? 'pt-BR' : 'en-US'"
                        [min]="0"
                        [readOnly]="!canEditCredit()"
                        [value]="draft.creditLimit"
                        (valueChange)="edit.patch({ creditLimit: $event.value ?? 0 })"
                      />
                    </div>
                    @if (error('creditLimitMinor'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else if (!canEditCredit()) {
                      <span slFieldDescription>Finance sets the limit.</span>
                    }
                  </div>
                }
                <div slField>
                  <label slFieldLabel>Tax</label>
                  <div
                    slCheckbox
                    name="taxExempt"
                    [checked]="draft.taxExempt"
                    (checkedChange)="edit.patch({ taxExempt: $event.value })"
                  >
                    Tax exempt
                  </div>
                </div>
                <div slField class="span-all">
                  <label slFieldLabel>Tags</label>
                  <sl-tags-input
                    name="tags"
                    [value]="draft.tags"
                    (valueChangeRequest)="edit.patch({ tags: [...$event.value] })"
                  ></sl-tags-input>
                  <span slFieldDescription>
                    What the account is grouped by in a saved view — "key-account", "renewal-q4".
                  </span>
                </div>
              </div>
              <div slFormActions>
                <button
                  slButton
                  variant="ghost"
                  tone="secondary"
                  type="button"
                  (click)="edit.cancel()"
                >
                  Cancel
                </button>
                <button
                  slButton
                  type="submit"
                  [loading]="edit.saving()"
                  [messages]="{ loading: 'Saving the account' }"
                >
                  Save account
                </button>
              </div>
            </form>
          } @else {
            <div slDescriptionList layout="row">
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Legal name</dt>
                <dd slDescriptionListDescription>{{ c.legalName }}</dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Owner</dt>
                <dd slDescriptionListDescription>
                  {{ c.accountOwnerName }} · {{ c.salesTeamName }}
                </dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Segment</dt>
                <dd slDescriptionListDescription>{{ segment(c) }} · {{ c.industry }}</dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Payment terms</dt>
                <dd slDescriptionListDescription>{{ terms(c) }}</dd>
              </div>
              @if (session.can('customers.credit_view')) {
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Credit limit</dt>
                  <dd slDescriptionListDescription>{{ money(c.creditLimit) }}</dd>
                </div>
              }
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Currency</dt>
                <dd slDescriptionListDescription>
                  {{ c.preferredCurrency }} ·
                  {{ c.regionCode === 'BR' ? 'Brazil' : 'United States' }}
                </dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Customer since</dt>
                <dd slDescriptionListDescription>
                  {{ c.customerSince ? date(c.customerSince) : '—' }}
                </dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Employees</dt>
                <dd slDescriptionListDescription>{{ c.employeeBand ?? '—' }}</dd>
              </div>
              @if (c.website) {
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>Website</dt>
                  <dd slDescriptionListDescription>
                    <a slLink [href]="c.website" external>{{ c.website }}</a>
                  </dd>
                </div>
              }
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Tax</dt>
                <dd slDescriptionListDescription>
                  {{ c.taxProfile.type === 'exempt' ? 'Exempt' : 'Taxable' }}
                </dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Tags</dt>
                <dd slDescriptionListDescription>
                  @if (c.tags.length === 0) {
                    <span class="muted">None</span>
                  } @else {
                    <span slInline [gap]="2">
                      @for (tag of c.tags; track tag) {
                        <span slTag tone="secondary" size="sm"
                          ><span slTagBody>{{ tag }}</span></span
                        >
                      }
                    </span>
                  }
                </dd>
              </div>
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Contract prices</dt>
                <dd slDescriptionListDescription>
                  {{ contractPrices() }} SKUs at a negotiated price
                </dd>
              </div>
            </div>
          }
        } @else {
          <div slDescriptionList layout="row">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>
                  <span slSkeleton shape="text" inlineSize="60%"></span>
                </dt>
                <dd slDescriptionListDescription>
                  <span slSkeleton shape="text" inlineSize="80%"></span>
                </dd>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class AccountSection {
  readonly customer = input<CustomerListItem | null>(null);
  readonly contractPrices = input(0);

  readonly edit = inject(CustomerEditStore);
  readonly lookups = inject(CrmLookupsStore);
  readonly session = inject(SessionStore);
  private readonly toasts = inject(SlToastService);

  readonly segments = Object.entries(SEGMENT_LABEL).map(([value, label]) => ({ value, label }));
  readonly termOptions = Object.entries(TERMS_LABEL).map(([value, label]) => ({ value, label }));

  readonly canEdit = computed(() => this.session.can('customers.edit'));
  readonly canEditCredit = computed(() => this.session.can('customers.credit_edit'));
  readonly priceLists = computed(() => {
    const region = this.customer()?.regionCode;
    return region === undefined ? [] : this.lookups.priceListsFor(region);
  });

  constructor() {
    void this.lookups.load();
  }

  error(name: string): string | null {
    return this.edit.errors()[name]?.[0] ?? null;
  }

  segment(c: CustomerListItem): string {
    return SEGMENT_LABEL[c.segment] ?? c.segment;
  }

  terms(c: CustomerListItem): string {
    return TERMS_LABEL[c.paymentTermsCode] ?? c.paymentTermsCode;
  }

  money(value: Money): string {
    return formatMoney(value);
  }

  date(iso: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
  }

  /** A representative may edit the accounts they own; the backend answers for the rest. */
  ownerRefusal(c: CustomerListItem): string {
    return `${c.accountOwnerName} owns this account. Ask them, or your sales manager, to make the change.`;
  }

  conflictSentence(count: number): string {
    return count === 1
      ? 'Someone changed one field while this form was open.'
      : `Someone changed ${count} fields while this form was open.`;
  }

  save(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.run());
  }

  async applyMine(): Promise<void> {
    if (await this.edit.applyMine()) this.saved();
  }

  private async run(): Promise<void> {
    if (await this.edit.save()) this.saved();
  }

  private saved(): void {
    this.toasts.show({ title: 'Account saved', tone: 'success' });
  }
}
