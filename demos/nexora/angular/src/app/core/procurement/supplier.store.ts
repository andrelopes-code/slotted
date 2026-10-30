import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  PaymentTermsCode,
  SupplierDetail,
  SupplierListItem,
  SupplierStatus,
  SupplierTier,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { classify, fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { SessionStore } from '../session/session.store';
import {
  BLOCKS_INACTIVATION,
  hasDeliveryRecord,
  hasQualityRecord,
  median,
  PAYMENT_TERMS_LABEL,
  SUPPLIER_TIER_LABEL,
} from './procurement.model';
import { readMappedSkus, type MappedSku } from './purchase-order-draft.store';
import { SuppliersStore } from './suppliers.store';

/** The fields `suppliers.update` writes, as the form holds them. */
export interface SupplierDraft {
  displayName: string;
  legalName: string;
  category: string;
  paymentTermsCode: PaymentTermsCode;
  relationshipTier: SupplierTier;
  primaryContactName: string;
  primaryContactEmail: string;
  preferredShippingTerms: string;
}

export interface SupplierConflictField {
  readonly label: string;
  readonly theirs: string;
  readonly mine: string | null;
}

const LABELS: Record<keyof SupplierDraft, string> = {
  displayName: 'Name',
  legalName: 'Legal name',
  category: 'Category',
  paymentTermsCode: 'Payment terms',
  relationshipTier: 'Relationship',
  primaryContactName: 'Contact',
  primaryContactEmail: 'Contact email',
  preferredShippingTerms: 'Shipping terms',
};

export function supplierDraftOf(supplier: SupplierListItem): SupplierDraft {
  return {
    displayName: supplier.displayName,
    legalName: supplier.legalName,
    category: supplier.category,
    paymentTermsCode: supplier.paymentTermsCode,
    relationshipTier: supplier.relationshipTier,
    primaryContactName: supplier.primaryContactName ?? '',
    primaryContactEmail: supplier.primaryContactEmail ?? '',
    preferredShippingTerms: supplier.preferredShippingTerms ?? '',
  };
}

const say = (key: keyof SupplierDraft, draft: SupplierDraft): string => {
  if (key === 'paymentTermsCode') return PAYMENT_TERMS_LABEL[draft.paymentTermsCode];
  if (key === 'relationshipTier') return SUPPLIER_TIER_LABEL[draft.relationshipTier];
  return draft[key] === '' ? '—' : draft[key];
};

const WORDS: Record<string, string> = {
  SUPPLIER_HAS_OPEN_POS:
    'This supplier still has open purchase orders, so it cannot be made inactive until they are received, closed or cancelled.',
  STALE_VERSION: 'Someone else changed this supplier while the page was open.',
  FORBIDDEN: 'Your role does not manage suppliers.',
};

/** The category's median of each scorecard figure, over the suppliers that have delivered anything. */
export interface PeerFigures {
  readonly category: string;
  readonly count: number;
  readonly withRecord: number;
  readonly onTimeBps: number | null;
  readonly quality: number | null;
  readonly leadTimeDays: number | null;
}

/**
 * One supplier (§12, §65.1–§65.2): its scorecard read against the suppliers
 * of its own category, the SKUs it maps and its recent orders, and — for a
 * holder of `suppliers.manage` — its facts edited in place and its status.
 */
@Injectable({ providedIn: 'root' })
export class SupplierStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly list = inject(SuppliersStore);

  readonly id = signal<string | null>(null);
  readonly detail = signal<SupplierDetail | null>(null);
  readonly skus = signal<ReadonlyMap<string, MappedSku>>(new Map());
  readonly peers = signal<{ value: PeerFigures | null; failed: boolean }>({
    value: null,
    failed: false,
  });
  /** The orders that refuse an inactivation, counted as `suppliers.update` counts them; null before the answer. */
  readonly blockingOrders = signal<number | null>(null);
  /** A read is on its way; the supplier already shown stays until the answer replaces it (AF-02). */
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<'status' | 'save' | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  readonly draft = signal<SupplierDraft | null>(null);
  readonly errors = signal<FormErrors>({});
  readonly conflict = signal<readonly SupplierConflictField[] | null>(null);

  private sequence = 0;
  private version = 0;
  private opened: SupplierDraft | null = null;
  private baseVersion = 0;

  readonly supplier = computed(() => this.detail()?.supplier ?? null);

  readonly canManage = computed(() => {
    void this.session.session();
    return this.session.can('suppliers.manage');
  });
  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });
  readonly canSeeOrders = computed(() => {
    void this.session.session();
    return this.session.can('purchase_orders.view');
  });

  readonly hasRecord = computed(() => {
    const supplier = this.supplier();
    return supplier !== null && hasDeliveryRecord(supplier.performance);
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.detail.set(null);
      this.skus.set(new Map());
      this.peers.set({ value: null, failed: false });
      this.blockingOrders.set(null);
      this.error.set(null);
      this.failure.set(null);
      this.cancelEdit();
    }
    await this.load();
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.suppliers.get(id);
      if (ticket !== this.sequence) return;
      const skus = await readMappedSkus(
        api,
        this.health,
        detail.mappings.map((mapping) => mapping.skuId),
      );
      if (ticket !== this.sequence) return;
      this.version = detail.supplier.metadata.version;
      this.skus.set(skus);
      this.detail.set(detail);
      void this.loadPeers(detail.supplier.category);
      if (this.canManage()) void this.loadBlockingOrders(id);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The supplier could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /**
   * The suppliers of the same category, a hundred at a time: the scorecard's
   * comparison lines are their medians. A supplier that has received no line
   * in full carries nought for its on-time share and its lead time, which is
   * no delivery rather than a bad one, so it is left out of those two medians.
   */
  private async loadPeers(category: string): Promise<void> {
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () => api.suppliers.list({ pageSize: 100, filter: { category: { eq: category } } }),
      null,
    );
    if (answer === null) {
      this.peers.set({ value: null, failed: true });
      return;
    }
    const delivered = answer.data.filter((row) => hasDeliveryRecord(row.performance));
    this.peers.set({
      failed: false,
      value: {
        category,
        count: answer.page.totalItems,
        withRecord: delivered.length,
        onTimeBps: median(delivered.map((row) => row.performance.onTimeDeliveryBps)),
        quality: median(
          answer.data
            .filter((row) => hasQualityRecord(row.performance))
            .map((row) => row.performance.qualityScore),
        ),
        leadTimeDays: median(delivered.map((row) => row.performance.averageLeadTimeDays)),
      },
    });
  }

  private async loadBlockingOrders(id: string): Promise<void> {
    const api = await this.backend.ready();
    const answer = await this.health.read(
      () =>
        api.purchaseOrders.list({
          pageSize: 25,
          filter: { supplierId: { eq: id }, status: { in: [...BLOCKS_INACTIVATION] } },
        }),
      null,
    );
    if (answer !== null) this.blockingOrders.set(answer.page.totalItems);
  }

  async setStatus(status: SupplierStatus): Promise<boolean> {
    const supplier = this.supplier();
    if (supplier === null || this.busy() !== null) return false;
    this.busy.set('status');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.suppliers.update(supplier.id, { status }, { ifMatch: this.version }),
      );
      await this.load();
      if (this.list.total() !== null) void this.list.reload();
      return true;
    } catch (error) {
      this.failure.set(classify(error, WORDS, 'The supplier was not changed.'));
      if (
        isApiError(error) &&
        (error.code === 'STALE_VERSION' || error.code === 'SUPPLIER_HAS_OPEN_POS')
      )
        await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  startEdit(): void {
    const supplier = this.supplier();
    if (supplier === null) return;
    this.opened = supplierDraftOf(supplier);
    this.baseVersion = this.version;
    this.draft.set(supplierDraftOf(supplier));
    this.errors.set({});
    this.conflict.set(null);
    this.failure.set(null);
  }

  cancelEdit(): void {
    this.draft.set(null);
    this.opened = null;
    this.errors.set({});
    this.conflict.set(null);
  }

  patch(patch: Partial<SupplierDraft>): void {
    this.draft.update((draft) => (draft === null ? draft : { ...draft, ...patch }));
  }

  /** The fields that moved since the form opened (FM-09). */
  private changes(): Partial<SupplierDraft> {
    const draft = this.draft();
    const opened = this.opened;
    if (draft === null || opened === null) return {};
    const changes: Record<string, string> = {};
    for (const key of Object.keys(LABELS) as (keyof SupplierDraft)[])
      if (draft[key] !== opened[key]) changes[key] = draft[key];
    return changes as Partial<SupplierDraft>;
  }

  check(): FormErrors {
    const draft = this.draft();
    const errors: Record<string, string[]> = {};
    if (draft === null) return errors;
    if (draft.displayName.trim() === '') errors['displayName'] = ['A supplier has a name.'];
    if (draft.category.trim() === '') errors['category'] = ['A supplier has a category.'];
    return errors;
  }

  async save(): Promise<boolean> {
    const supplier = this.supplier();
    if (supplier === null || this.busy() !== null) return false;
    const errors = this.check();
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) return false;
    const changes = this.changes();
    if (Object.keys(changes).length === 0) {
      this.cancelEdit();
      return true;
    }
    this.busy.set('save');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.suppliers.update(supplier.id, changes, { ifMatch: this.baseVersion }),
      );
      await this.load();
      if (this.list.total() !== null) void this.list.reload();
      this.cancelEdit();
      return true;
    } catch (error) {
      if (isApiError(error, 'STALE_VERSION')) {
        await this.load();
        this.readConflict();
      } else {
        this.failure.set(classify(error, WORDS, 'The supplier was not saved.'));
        this.errors.set(fieldErrors(error));
      }
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  async applyMine(): Promise<boolean> {
    this.baseVersion = this.version;
    this.conflict.set(null);
    return this.save();
  }

  takeTheirs(): void {
    this.startEdit();
  }

  private readConflict(): void {
    const supplier = this.supplier();
    const draft = this.draft();
    const opened = this.opened;
    if (supplier === null || draft === null || opened === null) return;
    const now = supplierDraftOf(supplier);
    const fields: SupplierConflictField[] = [];
    for (const key of Object.keys(LABELS) as (keyof SupplierDraft)[]) {
      if (say(key, opened) === say(key, now)) continue;
      fields.push({
        label: LABELS[key],
        theirs: say(key, now),
        mine: draft[key] !== opened[key] ? say(key, draft) : null,
      });
    }
    this.conflict.set(fields);
    this.failure.set({ code: 'STALE_VERSION', message: WORDS['STALE_VERSION']!, kind: 'conflict' });
  }
}
