import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
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
import type { RegionCode } from '@slotted/demo-nexora-backend';

import { CrmLookupsStore } from '../../core/crm/crm-lookups.store';
import { CustomerCreateStore } from '../../core/crm/customer-create.store';
import { SessionStore } from '../../core/session/session.store';
import { SEGMENT_LABEL, TERMS_LABEL } from './customer-columns';

/** The two regions the tenant bills in (§53.7); the region decides the currency and the price lists. */
const REGION_LABEL: Record<RegionCode, string> = { US: 'United States', BR: 'Brazil' };
const REGION_CURRENCY: Record<RegionCode, string> = { US: 'USD', BR: 'BRL' };
const REGION_LOCALE: Record<RegionCode, string> = { US: 'en-US', BR: 'pt-BR' };

@Component({
  selector: 'app-new-customer-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlCheckbox,
    SlCheckboxDescription,
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
    SlSection,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* A field that carries the account's name is not paired with another. */
    .span-all {
      grid-column: 1 / -1;
    }
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav>
            <a slPageHeaderBack routerLink="/crm/customers">Customers</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New customer</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The account opens as a prospect and takes the next account number. Quotes can go out
              at once; an order is confirmed after the first activation.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <form
          slForm
          #form="slForm"
          [messages]="{ summaryTitle: 'This account was not created' }"
          [errors]="store.errors()"
          (errorsChange)="store.errors.set($event.value)"
          [loading]="store.submitting()"
          (formSubmit)="submit($event)"
        >
          @if (store.failure(); as failure) {
            <div slInlineMessage [tone]="failure.code === 'FORBIDDEN' ? 'warning' : 'danger'">
              <span slInlineMessageIcon></span>
              {{ failure.message }}
            </div>
          }

          <div slStack [gap]="7">
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Account</h2>
                  <p slSectionDescription>
                    What an operator searches for, and where the account is sold.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                  <div slField class="span-all" required [invalid]="!!error('displayName')">
                    <label slFieldLabel>Account name</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="displayName"
                        required
                        autocomplete="organization"
                        placeholder="Meridian Controls Group"
                        [value]="draft().displayName"
                        (valueChange)="store.patch({ displayName: $event.value })"
                      />
                    </div>
                    @if (error('displayName'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription>The name the account is known by in Nexora.</span>
                    }
                  </div>
                  <div slField [invalid]="!!error('legalName')">
                    <label slFieldLabel>Legal name</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="legalName"
                        placeholder="Meridian Controls Group, Inc."
                        [value]="draft().legalName"
                        (valueChange)="store.patch({ legalName: $event.value })"
                      />
                    </div>
                    @if (error('legalName'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription>
                        The name on an invoice. Left empty, it follows the account name.
                      </span>
                    }
                  </div>
                  <div slField required [invalid]="!!error('industry')">
                    <label slFieldLabel>Industry</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="industry"
                        required
                        placeholder="Industrial Machinery"
                        [value]="draft().industry"
                        (valueChange)="store.patch({ industry: $event.value })"
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
                      placeholder="Choose a segment"
                      [value]="draft().segment || null"
                      (valueChangeRequest)="store.patch({ segment: $any($event.value) ?? '' })"
                    >
                      @for (option of segments; track option.value) {
                        <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                      }
                    </sl-select>
                    @if (error('segment'); as message) {
                      <p slFieldError>{{ message }}</p>
                    }
                  </div>
                  <div slField [invalid]="!!error('regionCode')">
                    <label slFieldLabel>Region</label>
                    <sl-select
                      name="regionCode"
                      [value]="draft().regionCode"
                      (valueChangeRequest)="setRegion($event.value)"
                    >
                      @for (option of regions; track option.value) {
                        <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                      }
                    </sl-select>
                    <span slFieldDescription>
                      Sets the currency the account is billed in: {{ currency() }}.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Commercial terms</h2>
                  <p slSectionDescription>
                    What the account is charged on, and how far its credit runs.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                  <div slField [invalid]="!!error('paymentTermsCode')">
                    <label slFieldLabel>Payment terms</label>
                    <sl-select
                      name="paymentTermsCode"
                      [value]="draft().paymentTermsCode"
                      (valueChangeRequest)="store.patch({ paymentTermsCode: $any($event.value) })"
                    >
                      @for (option of terms; track option.value) {
                        <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                      }
                    </sl-select>
                  </div>
                  <div slField [invalid]="!!error('priceListId')">
                    <label slFieldLabel>Price list</label>
                    <sl-select
                      name="priceListId"
                      placeholder="Region standard"
                      [loading]="lookups.loading()"
                      [value]="draft().priceListId || null"
                      (valueChangeRequest)="store.patch({ priceListId: $any($event.value) ?? '' })"
                    >
                      @for (list of priceLists(); track list.id) {
                        <sl-select-item [value]="list.id">{{ list.name }}</sl-select-item>
                      }
                    </sl-select>
                    <span slFieldDescription>
                      Left as the region standard, the backend chooses the list of {{ currency() }}.
                    </span>
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
                          [currency]="currency()"
                          [locale]="locale()"
                          [min]="0"
                          [readOnly]="!canEditCredit()"
                          [value]="canEditCredit() ? draft().creditLimit : 0"
                          (valueChange)="store.patch({ creditLimit: $event.value })"
                        />
                      </div>
                      @if (error('creditLimitMinor'); as message) {
                        <p slFieldError>{{ message }}</p>
                      } @else if (canEditCredit()) {
                        <span slFieldDescription>
                          Orders above the limit go to Finance for approval.
                        </span>
                      } @else {
                        <span slFieldDescription>
                          Finance sets the limit. A new account starts without credit.
                        </span>
                      }
                    </div>
                  }
                  <div slField>
                    <label slFieldLabel>Tax</label>
                    <div
                      slCheckbox
                      name="taxExempt"
                      [checked]="draft().taxExempt"
                      (checkedChange)="store.patch({ taxExempt: $event.value })"
                    >
                      Tax exempt
                      <p slCheckboxDescription>
                        An exemption certificate is on file for this account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Ownership</h2>
                  <p slSectionDescription>
                    Who the account answers to, and whose numbers it counts in.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                  <div slField [readOnly]="!canChooseOwner()" [invalid]="!!error('accountOwnerId')">
                    <label slFieldLabel>Account owner</label>
                    @if (canChooseOwner()) {
                      <sl-select
                        name="accountOwnerId"
                        [placeholder]="ownerName()"
                        [loading]="lookups.loading()"
                        [value]="draft().accountOwnerId || null"
                        (valueChangeRequest)="
                          store.patch({ accountOwnerId: $any($event.value) ?? '' })
                        "
                      >
                        @for (user of lookups.users(); track user.id) {
                          <sl-select-item [value]="user.id">{{ user.displayName }}</sl-select-item>
                        }
                      </sl-select>
                    } @else {
                      <div slTextField>
                        <input slTextFieldInput readOnly [value]="ownerName()" />
                      </div>
                    }
                    @if (error('accountOwnerId'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else if (!canChooseOwner()) {
                      <span slFieldDescription>
                        An account you create is yours. Your sales manager can hand it over.
                      </span>
                    }
                  </div>
                  @if (canChooseTeam()) {
                    <div slField [invalid]="!!error('salesTeamId')">
                      <label slFieldLabel>Sales team</label>
                      <sl-select
                        name="salesTeamId"
                        placeholder="The owner's team"
                        [loading]="lookups.loading()"
                        [value]="draft().salesTeamId || null"
                        (valueChangeRequest)="
                          store.patch({ salesTeamId: $any($event.value) ?? '' })
                        "
                      >
                        @for (team of salesTeams(); track team.id) {
                          <sl-select-item [value]="team.id">{{ team.name }}</sl-select-item>
                        }
                      </sl-select>
                    </div>
                  }
                </div>
              </div>
            </section>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Primary contact</h2>
                  <p slSectionDescription>
                    One person per account carries the primary mark. More contacts are added from
                    the account itself.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="5">
                  <div
                    slCheckbox
                    name="withContact"
                    [checked]="draft().withContact"
                    (checkedChange)="store.patch({ withContact: $event.value })"
                  >
                    Add the primary contact now
                  </div>
                  @if (draft().withContact) {
                    <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                      <div slField required [invalid]="!!error('contact.firstName')">
                        <label slFieldLabel>First name</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="contact.firstName"
                            required
                            autocomplete="given-name"
                            [value]="draft().contact.firstName"
                            (valueChange)="store.patchContact({ firstName: $event.value })"
                          />
                        </div>
                        @if (error('contact.firstName'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                      <div slField required [invalid]="!!error('contact.lastName')">
                        <label slFieldLabel>Last name</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="contact.lastName"
                            required
                            autocomplete="family-name"
                            [value]="draft().contact.lastName"
                            (valueChange)="store.patchContact({ lastName: $event.value })"
                          />
                        </div>
                        @if (error('contact.lastName'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                      <div slField [invalid]="!!error('contact.email')">
                        <label slFieldLabel>Email</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="contact.email"
                            type="email"
                            autocomplete="email"
                            placeholder="name@company.com"
                            [value]="draft().contact.email"
                            (valueChange)="store.patchContact({ email: $event.value })"
                          />
                        </div>
                        @if (error('contact.email'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                      <div slField>
                        <label slFieldLabel>Phone</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="contact.phone"
                            type="tel"
                            autocomplete="tel"
                            [value]="draft().contact.phone"
                            (valueChange)="store.patchContact({ phone: $event.value })"
                          />
                        </div>
                      </div>
                      <div slField class="span-all">
                        <label slFieldLabel>Title</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="contact.title"
                            placeholder="Procurement Manager"
                            [value]="draft().contact.title"
                            (valueChange)="store.patchContact({ title: $event.value })"
                          />
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </section>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Billing address</h2>
                  <p slSectionDescription>
                    Where the invoices go. It becomes the default shipping address until another one
                    is added.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="5">
                  <div
                    slCheckbox
                    name="withAddress"
                    [checked]="draft().withAddress"
                    (checkedChange)="store.patch({ withAddress: $event.value })"
                  >
                    Add the billing address now
                  </div>
                  @if (draft().withAddress) {
                    <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                      <div slField class="span-all" required [invalid]="!!error('address.line1')">
                        <label slFieldLabel>Address</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="address.line1"
                            required
                            autocomplete="address-line1"
                            [value]="draft().address.line1"
                            (valueChange)="store.patchAddress({ line1: $event.value })"
                          />
                        </div>
                        @if (error('address.line1'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                      <div slField class="span-all">
                        <label slFieldLabel>Suite, floor, unit</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="address.line2"
                            autocomplete="address-line2"
                            [value]="draft().address.line2"
                            (valueChange)="store.patchAddress({ line2: $event.value })"
                          />
                        </div>
                      </div>
                      <div slField required [invalid]="!!error('address.city')">
                        <label slFieldLabel>City</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="address.city"
                            required
                            autocomplete="address-level2"
                            [value]="draft().address.city"
                            (valueChange)="store.patchAddress({ city: $event.value })"
                          />
                        </div>
                        @if (error('address.city'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                      <div slField required [invalid]="!!error('address.region')">
                        <label slFieldLabel>{{ regionFieldLabel() }}</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="address.region"
                            required
                            autocomplete="address-level1"
                            [value]="draft().address.region"
                            (valueChange)="store.patchAddress({ region: $event.value })"
                          />
                        </div>
                        @if (error('address.region'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                      <div slField required [invalid]="!!error('address.postalCode')">
                        <label slFieldLabel>{{ postalFieldLabel() }}</label>
                        <div slTextField>
                          <input
                            slTextFieldInput
                            name="address.postalCode"
                            required
                            autocomplete="postal-code"
                            [value]="draft().address.postalCode"
                            (valueChange)="store.patchAddress({ postalCode: $event.value })"
                          />
                        </div>
                        @if (error('address.postalCode'); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </section>
          </div>

          <div slFormActions>
            <a slButtonLink variant="ghost" tone="secondary" routerLink="/crm/customers">Cancel</a>
            <button
              slButton
              type="submit"
              tone="accent"
              [loading]="store.submitting()"
              [messages]="{ loading: 'Creating the account' }"
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class NewCustomerPage {
  readonly store = inject(CustomerCreateStore);
  readonly lookups = inject(CrmLookupsStore);
  readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);
  private readonly form = viewChild.required<SlForm>('form');

  readonly draft = this.store.draft;
  readonly segments = Object.entries(SEGMENT_LABEL).map(([value, label]) => ({ value, label }));
  readonly terms = Object.entries(TERMS_LABEL).map(([value, label]) => ({ value, label }));
  readonly regions = Object.entries(REGION_LABEL).map(([value, label]) => ({ value, label }));

  readonly currency = computed(() => REGION_CURRENCY[this.draft().regionCode]);
  readonly locale = computed(() => REGION_LOCALE[this.draft().regionCode]);
  readonly priceLists = computed(() => this.lookups.priceListsFor(this.draft().regionCode));
  readonly salesTeams = computed(() =>
    this.lookups.teams().filter((team) => team.type === 'sales' && team.status === 'active'),
  );
  /** A Sales Manager holds no `users.view`: the owner is stated rather than chosen. */
  readonly canChooseOwner = computed(
    () => this.session.can('users.view') && this.lookups.users().length > 0,
  );
  readonly canChooseTeam = computed(
    () => this.session.can('teams.view') && this.salesTeams().length > 0,
  );
  readonly canEditCredit = computed(() => this.session.can('customers.credit_edit'));
  readonly ownerName = computed(() => this.session.user()?.displayName ?? 'You');
  /** The words a postal division goes by in the region the account is billed in. */
  readonly regionFieldLabel = computed(() =>
    this.draft().regionCode === 'BR' ? 'State' : 'State or province',
  );
  readonly postalFieldLabel = computed(() =>
    this.draft().regionCode === 'BR' ? 'CEP' : 'ZIP code',
  );

  constructor() {
    void this.lookups.load();
  }

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  /** The region decides the currency, so a price list of the old region is dropped with it. */
  setRegion(value: unknown): void {
    if (typeof value !== 'string') return;
    this.store.patch({ regionCode: value as RegionCode, priceListId: '' });
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.create());
  }

  private async create(): Promise<void> {
    const created = await this.store.submit();
    if (created === null) {
      this.form().focusFirstError();
      return;
    }
    this.toasts.show({
      title: `${created.displayName} created as a prospect`,
      description: `Account ${created.accountNumber}. Add quotes, contacts and addresses from here.`,
      tone: 'success',
    });
    void this.router.navigateByUrl(`/crm/customers/${created.id}`);
  }
}
