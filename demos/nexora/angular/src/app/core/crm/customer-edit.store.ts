import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  CustomerListItem,
  CustomerSegment,
  PaymentTermsCode,
  UpdateCustomerInput,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';
import { CustomerStore } from './customer.store';
import { CustomersStore } from './customers.store';

export interface AccountDraft {
  displayName: string;
  legalName: string;
  segment: CustomerSegment;
  industry: string;
  website: string;
  employeeBand: string;
  paymentTermsCode: PaymentTermsCode;
  priceListId: string;
  /** Major units of the account's own currency; the region is immutable after creation. */
  creditLimit: number;
  taxExempt: boolean;
  tags: string[];
}

/** One field two people wrote at the same time: what the reader started from and what is stored now. */
export interface ConflictField {
  label: string;
  /** The value the record held when the form opened. */
  base: string;
  /** The value the record holds now, written by someone else. */
  theirs: string;
  /** The value in the form, when the reader changed this field too. */
  mine: string | null;
}

const MESSAGES: Record<string, string> = {
  'displayName:REQUIRED': 'Give the account the name an operator would search for.',
  'segment:INVALID_VALUE': 'Choose the segment the account is sold to.',
  'creditLimitMinor:INVALID_VALUE': 'The credit limit is a whole amount, and never below zero.',
};

const LABELS: Record<keyof AccountDraft, string> = {
  displayName: 'Account name',
  legalName: 'Legal name',
  segment: 'Segment',
  industry: 'Industry',
  website: 'Website',
  employeeBand: 'Employees',
  paymentTermsCode: 'Payment terms',
  priceListId: 'Price list',
  creditLimit: 'Credit limit',
  taxExempt: 'Tax',
  tags: 'Tags',
};

export function draftOf(customer: CustomerListItem): AccountDraft {
  return {
    displayName: customer.displayName,
    legalName: customer.legalName,
    segment: customer.segment,
    industry: customer.industry,
    website: customer.website ?? '',
    employeeBand: customer.employeeBand ?? '',
    paymentTermsCode: customer.paymentTermsCode,
    priceListId: customer.priceListId,
    creditLimit: customer.creditLimit.minor / 100,
    taxExempt: customer.taxProfile.type === 'exempt',
    tags: [...customer.tags],
  };
}

const say = (key: keyof AccountDraft, value: AccountDraft[keyof AccountDraft]): string => {
  if (Array.isArray(value)) return value.length === 0 ? 'None' : value.join(', ');
  if (typeof value === 'boolean') return value ? 'Exempt' : 'Taxable';
  if (key === 'creditLimit') return String(value);
  return value === '' ? '—' : String(value);
};

/**
 * The account's own fields, edited in the record's section. The version the
 * form opened on travels with the command (§53.11); a version the backend has
 * moved past comes back as a conflict the reader answers, never as a silent
 * overwrite and never as a lost draft.
 */
@Injectable({ providedIn: 'root' })
export class CustomerEditStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly record = inject(CustomerStore);
  private readonly session = inject(SessionStore);
  private readonly list = inject(CustomersStore);

  readonly editing = signal(false);
  readonly draft = signal<AccountDraft | null>(null);
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<{ code: string; message: string } | null>(null);
  readonly saving = signal(false);
  /** Set when the backend answered STALE_VERSION: what the other writer changed. */
  readonly conflict = signal<readonly ConflictField[] | null>(null);

  /** The record as the form opened it: what every comparison and every patch is measured against. */
  private opened: AccountDraft | null = null;
  private baseVersion = 0;
  private customerId: string | null = null;

  readonly dirty = computed(() => {
    const draft = this.draft();
    return (
      draft !== null &&
      this.opened !== null &&
      JSON.stringify(draft) !== JSON.stringify(this.opened)
    );
  });

  start(customer: CustomerListItem): void {
    this.customerId = customer.id;
    this.baseVersion = customer.metadata.version;
    this.opened = draftOf(customer);
    this.draft.set(draftOf(customer));
    this.errors.set({});
    this.failure.set(null);
    this.conflict.set(null);
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
    this.draft.set(null);
    this.errors.set({});
    this.failure.set(null);
    this.conflict.set(null);
    this.opened = null;
    this.customerId = null;
  }

  patch(patch: Partial<AccountDraft>): void {
    this.draft.update((draft) => (draft === null ? draft : { ...draft, ...patch }));
  }

  /** Writes the account and closes the form; a refusal keeps both open. */
  async save(): Promise<boolean> {
    const draft = this.draft();
    const id = this.customerId;
    if (draft === null || id === null || this.saving()) return false;
    this.saving.set(true);
    this.errors.set({});
    this.failure.set(null);
    try {
      const patch = this.input(draft);
      if (Object.keys(patch).length === 0) {
        this.cancel();
        return true;
      }
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.customers.update(id, patch, { ifMatch: this.baseVersion }),
      );
      await this.record.load();
      if (this.list.total() !== null) void this.list.reload();
      this.cancel();
      return true;
    } catch (error) {
      if (isApiError(error, 'VALIDATION_FAILED')) {
        this.errors.set(this.fieldErrors(error.fieldErrors ?? []));
        if (Object.keys(this.errors()).length === 0)
          this.failure.set({ code: error.code, message: error.message });
      } else if (isApiError(error, 'STALE_VERSION')) {
        await this.readConflict();
      } else if (isApiError(error)) {
        this.failure.set({ code: error.code, message: error.message });
      } else {
        this.failure.set({ code: 'UNKNOWN', message: 'The account was not saved.' });
      }
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * The reader chose their own version: the same fields they changed are
   * written again over the version now stored, so what the other writer
   * changed elsewhere stays.
   */
  async applyMine(): Promise<boolean> {
    const current = this.record.customer();
    if (current === null) return false;
    this.baseVersion = current.metadata.version;
    this.conflict.set(null);
    return this.save();
  }

  /** The reader chose the stored version: the form starts again from the record. */
  takeTheirs(): void {
    const current = this.record.customer();
    if (current === null) return;
    this.start(current);
  }

  /**
   * Reads the record back and states the difference between what the form
   * opened on and what is stored now, field by field.
   */
  private async readConflict(): Promise<void> {
    await this.record.load();
    const current = this.record.customer();
    const draft = this.draft();
    if (current === null || draft === null || this.opened === null) return;
    const theirs = draftOf(current);
    const fields: ConflictField[] = [];
    for (const key of Object.keys(LABELS) as (keyof AccountDraft)[]) {
      const before = say(key, this.opened[key]);
      const now = say(key, theirs[key]);
      if (before === now) continue;
      const mine = say(key, draft[key]);
      fields.push({
        label: LABELS[key],
        base: before,
        theirs: now,
        mine: mine === before ? null : mine,
      });
    }
    this.conflict.set(fields);
  }

  private fieldErrors(
    errors: readonly { field: string; code: string; message: string }[],
  ): FormErrors {
    const map: Record<string, string[]> = {};
    for (const error of errors) {
      const message = MESSAGES[`${error.field}:${error.code}`] ?? error.message;
      map[error.field] = [...(map[error.field] ?? []), message];
    }
    return map;
  }

  /**
   * The command carries what the reader changed and nothing else: a field
   * they did not touch is a field another writer may keep, and the credit
   * limit is a permission the command asks for before it compares anything —
   * an unchanged amount would refuse an edit a representative may make.
   */
  private input(draft: AccountDraft): UpdateCustomerInput {
    const opened = this.opened;
    if (opened === null) return {};
    const changed = <K extends keyof AccountDraft>(key: K): boolean =>
      JSON.stringify(draft[key]) !== JSON.stringify(opened[key]);
    return {
      ...(changed('displayName') ? { displayName: draft.displayName } : {}),
      ...(changed('legalName') ? { legalName: draft.legalName } : {}),
      ...(changed('segment') ? { segment: draft.segment } : {}),
      ...(changed('industry') ? { industry: draft.industry } : {}),
      ...(changed('paymentTermsCode') ? { paymentTermsCode: draft.paymentTermsCode } : {}),
      ...(changed('priceListId') ? { priceListId: draft.priceListId } : {}),
      ...(changed('website') ? { website: draft.website } : {}),
      ...(changed('employeeBand') ? { employeeBand: draft.employeeBand } : {}),
      ...(changed('tags') ? { tags: draft.tags } : {}),
      ...(changed('taxExempt') ? { taxExempt: draft.taxExempt } : {}),
      ...(changed('creditLimit') && this.session.can('customers.credit_edit')
        ? { creditLimitMinor: Math.round(draft.creditLimit * 100) }
        : {}),
    };
  }
}
