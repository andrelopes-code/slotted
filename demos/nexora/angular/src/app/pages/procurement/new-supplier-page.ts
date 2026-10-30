import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
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
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';
import { REGIONS } from '@slotted/demo-nexora-backend';

import { options } from '../../core/catalog/catalog.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import {
  PAYMENT_TERMS_LABEL,
  SUPPLIER_TIER_LABEL,
  SUPPLIERS_ROUTE,
} from '../../core/procurement/procurement.model';
import {
  SupplierCreateStore,
  type NewSupplierDraft,
} from '../../core/procurement/supplier-create.store';

/**
 * A supplier written from nothing (§65.1), on its own route under the list
 * (FM-01). It arrives active; its region sets the one currency its orders are
 * written in, which is said beside the choice because it cannot be changed
 * afterwards through the form.
 */
@Component({
  selector: 'app-new-supplier-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
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
            <a slPageHeaderBack [routerLink]="listRoute">Suppliers</a>
          </div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New supplier</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              The supplier arrives active, with no SKU mapped and no delivery on record: its
              scorecard fills as its orders are received.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="work">
          <form
            slForm
            data-testid="new-supplier-form"
            [messages]="{ summaryTitle: 'This supplier was not written' }"
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
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle><h2 slSectionHeading>Supplier</h2></div>
              </div>
              <div slSectionBody>
                <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
                  <div slField required [invalid]="!!error('displayName')">
                    <label slFieldLabel>Name</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="displayName"
                        [value]="store.draft().displayName"
                        (valueChange)="patch('displayName', $event.value)"
                      />
                    </div>
                    @if (error('displayName'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription>The name a buyer searches for.</span>
                    }
                  </div>
                  <div slField>
                    <label slFieldLabel>Legal name</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="legalName"
                        [value]="store.draft().legalName"
                        (valueChange)="patch('legalName', $event.value)"
                      />
                    </div>
                    <span slFieldDescription>Left empty, the name is used.</span>
                  </div>
                  <div slField required [invalid]="!!error('category')">
                    <label slFieldLabel>Category</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="category"
                        placeholder="Fasteners & Hardware"
                        [value]="store.draft().category"
                        (valueChange)="patch('category', $event.value)"
                      />
                    </div>
                    @if (error('category'); as message) {
                      <p slFieldError>{{ message }}</p>
                    } @else {
                      <span slFieldDescription
                        >Written as the other suppliers of the category write it: the scorecard
                        compares within it.</span
                      >
                    }
                  </div>
                  <div slField>
                    <label slFieldLabel>Region</label>
                    <sl-select
                      name="regionCode"
                      [value]="store.draft().regionCode"
                      (valueChangeRequest)="store.patch({ regionCode: $any($event.value) ?? 'US' })"
                    >
                      @for (region of regions; track region.code) {
                        <sl-select-item [value]="region.code"
                          >{{ region.name }} · {{ region.currency }}</sl-select-item
                        >
                      }
                    </sl-select>
                    <span slFieldDescription>Its orders are written in the region’s currency.</span>
                  </div>
                  <div slField>
                    <label slFieldLabel>Payment terms</label>
                    <sl-select
                      name="paymentTermsCode"
                      [value]="store.draft().paymentTermsCode"
                      (valueChangeRequest)="
                        store.patch({ paymentTermsCode: $any($event.value) ?? 'NET_30' })
                      "
                    >
                      @for (option of termOptions; track option.value) {
                        <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                      }
                    </sl-select>
                  </div>
                  <div slField>
                    <label slFieldLabel>Relationship</label>
                    <sl-select
                      name="relationshipTier"
                      [value]="store.draft().relationshipTier"
                      (valueChangeRequest)="
                        store.patch({ relationshipTier: $any($event.value) ?? 'standard' })
                      "
                    >
                      @for (option of tierOptions; track option.value) {
                        <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                      }
                    </sl-select>
                    <span slFieldDescription
                      >A conditional supplier’s every order waits on a Procurement Manager.</span
                    >
                  </div>
                  <div slField>
                    <label slFieldLabel>Contact</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        name="primaryContactName"
                        [value]="store.draft().primaryContactName"
                        (valueChange)="patch('primaryContactName', $event.value)"
                      />
                    </div>
                  </div>
                  <div slField>
                    <label slFieldLabel>Contact email</label>
                    <div slTextField>
                      <input
                        slTextFieldInput
                        type="email"
                        name="primaryContactEmail"
                        [value]="store.draft().primaryContactEmail"
                        (valueChange)="patch('primaryContactEmail', $event.value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute">Cancel</a>
              <button
                slButton
                type="submit"
                data-testid="create-supplier"
                [loading]="store.creating()"
                [messages]="{ loading: 'Writing the supplier' }"
              >
                Write the supplier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NewSupplierPage {
  readonly store = inject(SupplierCreateStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = SUPPLIERS_ROUTE;
  readonly regions = REGIONS;
  readonly termOptions = options(PAYMENT_TERMS_LABEL);
  readonly tierOptions = options(SUPPLIER_TIER_LABEL);

  error(name: string): string | null {
    return this.store.errors()[name]?.[0] ?? null;
  }

  patch(key: keyof NewSupplierDraft, value: string): void {
    this.store.patch({ [key]: value } as Partial<NewSupplierDraft>);
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }

  submit(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.write());
  }

  private async write(): Promise<void> {
    const supplier = await this.store.create();
    if (supplier === null) return;
    this.toasts.show({
      title: `${supplier.displayName} written`,
      description: supplier.supplierNumber,
      tone: 'success',
    });
    void this.router.navigateByUrl(`${SUPPLIERS_ROUTE}/${supplier.id}`);
  }
}
