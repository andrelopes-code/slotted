import { inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  PaymentTermsCode,
  RegionCode,
  SupplierListItem,
  SupplierTier,
} from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { classify, fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { SuppliersStore } from './suppliers.store';

export interface NewSupplierDraft {
  displayName: string;
  legalName: string;
  category: string;
  regionCode: RegionCode;
  paymentTermsCode: PaymentTermsCode;
  relationshipTier: SupplierTier;
  primaryContactName: string;
  primaryContactEmail: string;
}

const EMPTY: NewSupplierDraft = {
  displayName: '',
  legalName: '',
  category: '',
  regionCode: 'US',
  paymentTermsCode: 'NET_30',
  relationshipTier: 'standard',
  primaryContactName: '',
  primaryContactEmail: '',
};

/**
 * A supplier being written (§65.1). It arrives active; its region sets the
 * one currency its orders are written in. The draft outlives the page (FM-05).
 */
@Injectable({ providedIn: 'root' })
export class SupplierCreateStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly list = inject(SuppliersStore);

  readonly draft = signal<NewSupplierDraft>({ ...EMPTY });
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly creating = signal(false);

  patch(patch: Partial<NewSupplierDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  check(): FormErrors {
    const draft = this.draft();
    const errors: Record<string, string[]> = {};
    if (draft.displayName.trim() === '') errors['displayName'] = ['A supplier has a name.'];
    if (draft.category.trim() === '') errors['category'] = ['A supplier has a category.'];
    return errors;
  }

  async create(): Promise<SupplierListItem | null> {
    if (this.creating()) return null;
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0) return null;
    const draft = this.draft();
    this.creating.set(true);
    try {
      const api = await this.backend.ready();
      const supplier = await this.health.mutation(() =>
        api.suppliers.create({
          displayName: draft.displayName.trim(),
          category: draft.category.trim(),
          regionCode: draft.regionCode,
          paymentTermsCode: draft.paymentTermsCode,
          relationshipTier: draft.relationshipTier,
          ...(draft.legalName.trim() ? { legalName: draft.legalName.trim() } : {}),
          ...(draft.primaryContactName.trim() ? { primaryContactName: draft.primaryContactName.trim() } : {}),
          ...(draft.primaryContactEmail.trim() ? { primaryContactEmail: draft.primaryContactEmail.trim() } : {}),
        }),
      );
      this.draft.set({ ...EMPTY });
      if (this.list.total() !== null) void this.list.reload();
      return supplier;
    } catch (error) {
      this.failure.set(classify(error, { FORBIDDEN: 'Your role does not manage suppliers.' }, 'The supplier was not written.'));
      this.errors.set(fieldErrors(error));
      return null;
    } finally {
      this.creating.set(false);
    }
  }
}
