import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  CreateCustomerInput,
  CustomerListItem,
  CustomerSegment,
  PaymentTermsCode,
  RegionCode,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { CustomersStore } from './customers.store';

export interface ContactDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

export interface AddressDraft {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
}

export interface CustomerDraft {
  displayName: string;
  legalName: string;
  segment: CustomerSegment | '';
  industry: string;
  regionCode: RegionCode;
  paymentTermsCode: PaymentTermsCode;
  /** Major units of the region's currency; null is empty, which is not zero. */
  creditLimit: number | null;
  priceListId: string;
  accountOwnerId: string;
  salesTeamId: string;
  taxExempt: boolean;
  withContact: boolean;
  contact: ContactDraft;
  withAddress: boolean;
  address: AddressDraft;
}

export const EMPTY_DRAFT: CustomerDraft = {
  displayName: '',
  legalName: '',
  segment: '',
  industry: '',
  regionCode: 'US',
  paymentTermsCode: 'NET_30',
  creditLimit: null,
  priceListId: '',
  accountOwnerId: '',
  salesTeamId: '',
  taxExempt: false,
  withContact: false,
  contact: { firstName: '', lastName: '', email: '', phone: '', title: '' },
  withAddress: false,
  address: { line1: '', line2: '', city: '', region: '', postalCode: '' },
};

/**
 * The words the form says for a rule the backend states by code. A field error
 * the client does not know keeps the server's own sentence: a message a reader
 * cannot be given is worse than one written for a developer.
 */
const MESSAGES: Record<string, string> = {
  'displayName:REQUIRED': 'Give the account the name an operator would search for.',
  'industry:REQUIRED': 'Name the industry, as “Industrial Machinery”.',
  'segment:INVALID_VALUE': 'Choose the segment the account is sold to.',
  'segment:REQUIRED': 'Choose the segment the account is sold to.',
  'creditLimitMinor:INVALID_VALUE': 'The credit limit is a whole amount, and never below zero.',
};

/** Where a nested field error is shown: the backend names the leaf, the form names the control. */
const CONTROL_OF: Record<string, string> = {
  firstName: 'contact.firstName',
  lastName: 'contact.lastName',
  email: 'contact.email',
  line1: 'address.line1',
  city: 'address.city',
  region: 'address.region',
  postalCode: 'address.postalCode',
};

/**
 * The draft of one new account, kept while the reader is in the module: the
 * back gesture out of the form and back into it finds what was typed. A
 * successful create empties it; Discard empties it on demand.
 */
@Injectable({ providedIn: 'root' })
export class CustomerCreateStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly list = inject(CustomersStore);

  readonly draft = signal<CustomerDraft>(structuredClone(EMPTY_DRAFT));
  /** Keyed by the control's name, which is the key the server's field errors use. */
  readonly errors = signal<FormErrors>({});
  /** A refusal the form cannot place on a field: a permission, a state, a transport. */
  readonly failure = signal<{ code: string; message: string } | null>(null);
  readonly submitting = signal(false);

  readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(EMPTY_DRAFT));

  /** Held across a failed attempt so a retry of the same payload is the same command. */
  private idempotencyKey: string | null = null;

  patch(patch: Partial<CustomerDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  patchContact(patch: Partial<ContactDraft>): void {
    this.draft.update((draft) => ({ ...draft, contact: { ...draft.contact, ...patch } }));
  }

  patchAddress(patch: Partial<AddressDraft>): void {
    this.draft.update((draft) => ({ ...draft, address: { ...draft.address, ...patch } }));
  }

  reset(): void {
    this.draft.set(structuredClone(EMPTY_DRAFT));
    this.errors.set({});
    this.failure.set(null);
    this.idempotencyKey = null;
  }

  /**
   * Creates the account and answers with it. A refusal stays on the screen:
   * the draft is never cleared by a failure, and the errors land on the
   * controls the server named.
   */
  async submit(): Promise<CustomerListItem | null> {
    if (this.submitting()) return null;
    this.submitting.set(true);
    this.errors.set({});
    this.failure.set(null);
    this.idempotencyKey ??= `customer-create-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    try {
      const api = await this.backend.ready();
      const created = await this.health.mutation(() =>
        api.customers.create(this.input(), { idempotencyKey: this.idempotencyKey as string }),
      );
      this.reset();
      if (this.list.total() !== null) void this.list.reload();
      return created;
    } catch (error) {
      if (isApiError(error, 'VALIDATION_FAILED')) {
        this.errors.set(this.fieldErrors(error.fieldErrors ?? []));
        // The next attempt carries a different payload, so it is a different command.
        this.idempotencyKey = null;
        if (Object.keys(this.errors()).length === 0)
          this.failure.set({ code: error.code, message: error.message });
      } else if (isApiError(error)) {
        this.failure.set({ code: error.code, message: error.message });
        if (error.code !== 'SERVICE_UNAVAILABLE') this.idempotencyKey = null;
      } else {
        this.failure.set({ code: 'UNKNOWN', message: 'The account was not created.' });
      }
      return null;
    } finally {
      this.submitting.set(false);
    }
  }

  private fieldErrors(
    errors: readonly { field: string; code: string; message: string }[],
  ): FormErrors {
    const map: Record<string, string[]> = {};
    for (const error of errors) {
      const control = CONTROL_OF[error.field] ?? error.field;
      const message = MESSAGES[`${error.field}:${error.code}`] ?? error.message;
      map[control] = [...(map[control] ?? []), message];
    }
    return map;
  }

  /** The draft as the command's input: what is empty is not sent (§53.10). */
  private input(): CreateCustomerInput {
    const draft = this.draft();
    const contact = draft.contact;
    const address = draft.address;
    return {
      displayName: draft.displayName,
      // An unchosen segment travels as it is: the rule is the backend's and comes back on the field.
      segment: draft.segment as CustomerSegment,
      industry: draft.industry,
      regionCode: draft.regionCode,
      paymentTermsCode: draft.paymentTermsCode,
      taxExempt: draft.taxExempt,
      ...(draft.legalName.trim() ? { legalName: draft.legalName } : {}),
      ...(draft.creditLimit === null
        ? {}
        : { creditLimitMinor: Math.round(draft.creditLimit * 100) }),
      ...(draft.priceListId ? { priceListId: draft.priceListId } : {}),
      ...(draft.accountOwnerId ? { accountOwnerId: draft.accountOwnerId } : {}),
      ...(draft.salesTeamId ? { salesTeamId: draft.salesTeamId } : {}),
      ...(draft.withContact
        ? {
            primaryContact: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              ...(contact.email.trim() ? { email: contact.email } : {}),
              ...(contact.phone.trim() ? { phone: contact.phone } : {}),
              ...(contact.title.trim() ? { title: contact.title } : {}),
            },
          }
        : {}),
      ...(draft.withAddress
        ? {
            billingAddress: {
              line1: address.line1,
              city: address.city,
              region: address.region,
              postalCode: address.postalCode,
              countryCode: draft.regionCode,
              ...(address.line2.trim() ? { line2: address.line2 } : {}),
            },
          }
        : {}),
    };
  }
}
