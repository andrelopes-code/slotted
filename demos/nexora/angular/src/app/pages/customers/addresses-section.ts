import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
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
import { SlText } from '@slotted/angular/typography';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import type { Address, RegionCode } from '@slotted/demo-nexora-backend';

import { AddressFormStore } from '../../core/crm/address-form.store';
import { SessionStore } from '../../core/session/session.store';

/**
 * Where the account is billed and delivered. The address book only grows:
 * the backend adds an address and changes none, because a document keeps the
 * snapshot of the address it used (§53.9).
 */
@Component({
  selector: 'app-addresses-section',
  imports: [
    SlBadge,
    SlButton,
    SlCheckbox,
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
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .addresses {
      display: grid;
      gap: var(--slotted-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .span-all {
      grid-column: 1 / -1;
    }
  `,
  template: `
    <section slSection>
      <div slSectionHeader>
        <div slSectionTitle><h2 slSectionHeading>Addresses</h2></div>
        @if (canAdd() && addresses() !== null) {
          <div slSectionActions>
            @if (form.open()) {
              <button
                slButton
                size="sm"
                variant="ghost"
                tone="secondary"
                type="button"
                (click)="form.cancel()"
              >
                Cancel
              </button>
            } @else {
              <button
                slButton
                size="sm"
                variant="outline"
                tone="secondary"
                type="button"
                (click)="form.start()"
              >
                Add address
              </button>
            }
          </div>
        }
      </div>
      <div slSectionBody>
        @if (form.open()) {
          <form
            slForm
            [messages]="{ summaryTitle: 'This address was not added' }"
            [errors]="form.errors()"
            (errorsChange)="form.errors.set($event.value)"
            [loading]="form.saving()"
            (formSubmit)="save($event)"
          >
            @if (form.failure(); as failure) {
              <div slInlineMessage [tone]="failure.code === 'FORBIDDEN' ? 'warning' : 'danger'">
                <span slInlineMessageIcon></span>
                {{ failure.message }}
              </div>
            }
            <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
              <div slField>
                <label slFieldLabel>Type</label>
                <sl-select
                  name="type"
                  [value]="form.draft().type"
                  (valueChangeRequest)="form.patch({ type: $any($event.value) })"
                >
                  <sl-select-item value="billing">Billing</sl-select-item>
                  <sl-select-item value="shipping">Shipping</sl-select-item>
                  <sl-select-item value="headquarters">Headquarters</sl-select-item>
                  <sl-select-item value="service_location">Service location</sl-select-item>
                </sl-select>
              </div>
              <div slField>
                <label slFieldLabel>Label</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="label"
                    placeholder="North plant"
                    [value]="form.draft().label"
                    (valueChange)="form.patch({ label: $event.value })"
                  />
                </div>
              </div>
              <div slField class="span-all" required [invalid]="!!error('line1')">
                <label slFieldLabel>Address</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="line1"
                    required
                    autocomplete="address-line1"
                    [value]="form.draft().line1"
                    (valueChange)="form.patch({ line1: $event.value })"
                  />
                </div>
                @if (error('line1'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField class="span-all">
                <label slFieldLabel>Suite, floor, unit</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="line2"
                    autocomplete="address-line2"
                    [value]="form.draft().line2"
                    (valueChange)="form.patch({ line2: $event.value })"
                  />
                </div>
              </div>
              <div slField required [invalid]="!!error('city')">
                <label slFieldLabel>City</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="city"
                    required
                    autocomplete="address-level2"
                    [value]="form.draft().city"
                    (valueChange)="form.patch({ city: $event.value })"
                  />
                </div>
                @if (error('city'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField required [invalid]="!!error('region')">
                <label slFieldLabel>{{ regionLabel() }}</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="region"
                    required
                    autocomplete="address-level1"
                    [value]="form.draft().region"
                    (valueChange)="form.patch({ region: $event.value })"
                  />
                </div>
                @if (error('region'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField required [invalid]="!!error('postalCode')">
                <label slFieldLabel>{{ postalLabel() }}</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="postalCode"
                    required
                    autocomplete="postal-code"
                    [value]="form.draft().postalCode"
                    (valueChange)="form.patch({ postalCode: $event.value })"
                  />
                </div>
                @if (error('postalCode'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField class="span-all">
                <label slFieldLabel>Delivery instructions</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="deliveryInstructions"
                    placeholder="Receiving hours 7:00–15:00."
                    [value]="form.draft().deliveryInstructions"
                    (valueChange)="form.patch({ deliveryInstructions: $event.value })"
                  />
                </div>
              </div>
              <div slField class="span-all">
                <label slFieldLabel>Default</label>
                <div
                  slCheckbox
                  name="isDefault"
                  [checked]="form.draft().isDefault"
                  (checkedChange)="form.patch({ isDefault: $event.value })"
                >
                  Use this address for new documents of this type
                </div>
                <span slFieldDescription>
                  Documents already issued keep the address they were issued with.
                </span>
              </div>
            </div>
            <div slFormActions>
              <button
                slButton
                variant="ghost"
                tone="secondary"
                type="button"
                (click)="form.cancel()"
              >
                Cancel
              </button>
              <button
                slButton
                type="submit"
                [loading]="form.saving()"
                [messages]="{ loading: 'Adding the address' }"
              >
                Add address
              </button>
            </div>
          </form>
        } @else if (addresses(); as list) {
          @if (list.length === 0) {
            <span slText size="sm" tone="muted">No address on file.</span>
          } @else {
            <ul class="addresses">
              @for (address of list; track address.id) {
                <li slStack [gap]="1">
                  <span slInline [gap]="2">
                    <span slText size="sm" weight="medium">{{ typeLabel(address.type) }}</span>
                    @if (address.label) {
                      <span slText size="sm" tone="muted">{{ address.label }}</span>
                    }
                    @if (address.isDefault) {
                      <span slBadge tone="secondary" variant="soft" size="sm">Default</span>
                    }
                  </span>
                  <span slText size="sm">{{ street(address) }}</span>
                  <span slText size="sm">
                    {{ address.city }}, {{ address.region }} {{ address.postalCode }} ·
                    {{ address.countryCode }}
                  </span>
                  @if (address.deliveryInstructions) {
                    <span slText size="sm" tone="muted">{{ address.deliveryInstructions }}</span>
                  }
                </li>
              }
            </ul>
          }
        } @else {
          <span slSkeleton shape="text" inlineSize="70%"></span>
        }
      </div>
    </section>
  `,
})
export class AddressesSection {
  readonly addresses = input<readonly Address[] | null>(null);
  readonly regionCode = input<RegionCode>('US');

  readonly form = inject(AddressFormStore);
  private readonly session = inject(SessionStore);
  private readonly toasts = inject(SlToastService);

  canAdd(): boolean {
    return this.session.can('customers.edit');
  }

  regionLabel(): string {
    return this.regionCode() === 'BR' ? 'State' : 'State or province';
  }

  postalLabel(): string {
    return this.regionCode() === 'BR' ? 'CEP' : 'ZIP code';
  }

  error(name: string): string | null {
    return this.form.errors()[name]?.[0] ?? null;
  }

  typeLabel(type: string): string {
    return type === 'service_location'
      ? 'Service location'
      : type.replace(/^\w/, (letter) => letter.toUpperCase());
  }

  street(address: { line1: string; line2?: string }): string {
    return address.line2 ? `${address.line1}, ${address.line2}` : address.line1;
  }

  save(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.run());
  }

  private async run(): Promise<void> {
    if (await this.form.save()) this.toasts.show({ title: 'Address added', tone: 'success' });
  }
}
