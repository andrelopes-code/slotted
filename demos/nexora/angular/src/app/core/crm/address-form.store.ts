import { inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { Address } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { CustomerStore } from './customer.store';

export interface AddressDraft {
  type: Address['type'];
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  deliveryInstructions: string;
  isDefault: boolean;
}

export const EMPTY_ADDRESS: AddressDraft = {
  type: 'shipping',
  label: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  deliveryInstructions: '',
  isDefault: false,
};

const MESSAGES: Record<string, string> = {
  'line1:REQUIRED': 'Write the street and number the carrier reads.',
  'city:REQUIRED': 'Name the city.',
  'region:REQUIRED': 'Name the state or province.',
  'postalCode:REQUIRED': 'Write the postal code.',
};

/**
 * An address the account is billed or delivered at. The backend has a command
 * that adds one and none that changes one: a commercial document keeps a
 * snapshot of the address it used (§53.9), and the address book only grows.
 */
@Injectable({ providedIn: 'root' })
export class AddressFormStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly record = inject(CustomerStore);

  readonly open = signal(false);
  readonly draft = signal<AddressDraft>({ ...EMPTY_ADDRESS });
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<{ code: string; message: string } | null>(null);
  readonly saving = signal(false);

  start(): void {
    this.draft.set({ ...EMPTY_ADDRESS });
    this.errors.set({});
    this.failure.set(null);
    this.open.set(true);
  }

  cancel(): void {
    this.open.set(false);
    this.errors.set({});
    this.failure.set(null);
  }

  patch(patch: Partial<AddressDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  async save(): Promise<boolean> {
    const customer = this.record.customer();
    if (customer === null || this.saving()) return false;
    this.saving.set(true);
    this.errors.set({});
    this.failure.set(null);
    const draft = this.draft();
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.customers.addresses.create(customer.id, {
          type: draft.type,
          line1: draft.line1,
          city: draft.city,
          region: draft.region,
          postalCode: draft.postalCode,
          countryCode: customer.regionCode,
          isDefault: draft.isDefault,
          ...(draft.label.trim() ? { label: draft.label } : {}),
          ...(draft.line2.trim() ? { line2: draft.line2 } : {}),
          ...(draft.deliveryInstructions.trim()
            ? { deliveryInstructions: draft.deliveryInstructions }
            : {}),
        }),
      );
      await this.record.load();
      this.cancel();
      return true;
    } catch (error) {
      if (isApiError(error, 'VALIDATION_FAILED')) {
        const map: Record<string, string[]> = {};
        for (const field of error.fieldErrors ?? []) {
          const message = MESSAGES[`${field.field}:${field.code}`] ?? field.message;
          map[field.field] = [...(map[field.field] ?? []), message];
        }
        this.errors.set(map);
        if (Object.keys(map).length === 0)
          this.failure.set({ code: error.code, message: error.message });
      } else if (isApiError(error)) {
        this.failure.set({ code: error.code, message: error.message });
      } else {
        this.failure.set({ code: 'UNKNOWN', message: 'The address was not added.' });
      }
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
