import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';

import { isApiError } from '../backend/api-error';
import { formatDate, formatMoney } from '../catalog/catalog.model';
import { fieldErrors } from '../inventory/inventory-failure';
import { classifyFinance, FINANCE_WORDS, type InvoiceDetail } from './finance.model';
import { InvoiceStore } from './invoice.store';
import type { InventoryFailure } from '../inventory/inventory-failure';

/** What `PATCH /invoices/:id` edits on a draft (§66.5 "Edit draft"). */
export interface InvoiceEditDraft {
  billingContactId: string;
  customerPoNumber: string;
  /** Major units of the invoice's currency. */
  freight: number;
  dueDate: string;
}

export interface InvoiceConflictField {
  readonly label: string;
  readonly theirs: string;
  readonly mine: string | null;
}

function draftOf(detail: InvoiceDetail): InvoiceEditDraft {
  const invoice = detail.invoice;
  return {
    billingContactId: invoice.billingContactId ?? '',
    customerPoNumber: invoice.customerPoNumber ?? '',
    freight: invoice.freight.minor / 100,
    dueDate: invoice.dueDate,
  };
}

/**
 * A draft invoice's terms, edited where they are read (FM-07). The command
 * carries the fields that moved since the form opened (FM-09); the due date's
 * floor, the issue date, is applied as the reader types (FM-11); a version
 * someone else moved past is answered field by field (FM-08).
 */
@Injectable({ providedIn: 'root' })
export class InvoiceEditStore {
  private readonly record = inject(InvoiceStore);

  readonly draft = signal<InvoiceEditDraft | null>(null);
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly conflict = signal<readonly InvoiceConflictField[] | null>(null);

  private opened: InvoiceEditDraft | null = null;
  private for: string | null = null;
  private baseVersion = 0;

  /** The customer's contacts, the billing contact's choices. */
  readonly contacts = computed(() => this.record.customer()?.contacts ?? []);

  readonly changes = computed(() => {
    const draft = this.draft();
    const opened = this.opened;
    if (draft === null || opened === null) return {};
    return {
      ...(draft.billingContactId !== opened.billingContactId && draft.billingContactId
        ? { billingContactId: draft.billingContactId }
        : {}),
      ...(draft.customerPoNumber !== opened.customerPoNumber
        ? { customerPoNumber: draft.customerPoNumber }
        : {}),
      ...(draft.dueDate !== opened.dueDate && draft.dueDate ? { dueDate: draft.dueDate } : {}),
      ...(draft.freight !== opened.freight ? { freightMinor: Math.round(draft.freight * 100) } : {}),
    };
  });

  /** The rule the backend enforces on the due date, said at the field while it is typed (FM-11). */
  readonly dueDateError = computed(() => {
    const draft = this.draft();
    const issue = this.record.invoice()?.issueDate;
    if (draft === null || !issue || !draft.dueDate) return null;
    return draft.dueDate < issue ? `The due date cannot come before the issue date, ${formatDate(issue)}.` : null;
  });

  start(): void {
    const detail = this.record.detail();
    if (detail === null) return;
    if (this.for === detail.invoice.id && this.draft() !== null) return;
    this.for = detail.invoice.id;
    this.baseVersion = this.record.readVersion();
    this.opened = draftOf(detail);
    this.draft.set(draftOf(detail));
    this.errors.set({});
    this.failure.set(null);
    this.conflict.set(null);
  }

  cancel(): void {
    this.draft.set(null);
    this.opened = null;
    this.for = null;
    this.errors.set({});
    this.failure.set(null);
    this.conflict.set(null);
  }

  patch(patch: Partial<InvoiceEditDraft>): void {
    this.draft.update((draft) => (draft === null ? draft : { ...draft, ...patch }));
  }

  check(): FormErrors {
    const draft = this.draft();
    if (draft === null) return {};
    const errors: Record<string, string[]> = {};
    const due = this.dueDateError();
    if (due) errors['dueDate'] = [due];
    if (!draft.dueDate) errors['dueDate'] = ['A draft needs a due date.'];
    if (draft.freight < 0) errors['freightMinor'] = ['Freight is never below zero.'];
    return errors;
  }

  async save(): Promise<boolean> {
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0) return false;
    const changes = this.changes();
    if (Object.keys(changes).length === 0) {
      this.cancel();
      return true;
    }
    const version = this.baseVersion;
    const result = await this.record.write('save', (api, id) =>
      api.finance.invoices.updateDraft(id, changes, { ifMatch: version }),
    );
    if (result.ok) {
      this.cancel();
      return true;
    }
    if (isApiError(result.error, 'STALE_VERSION')) {
      this.readConflict();
      return false;
    }
    this.failure.set(classifyFinance(result.error, 'The draft was not saved.'));
    this.errors.set(fieldErrors(result.error));
    return false;
  }

  /** The reader keeps what they wrote: the same fields go again over the version now stored. */
  async applyMine(): Promise<boolean> {
    this.baseVersion = this.record.readVersion();
    this.conflict.set(null);
    return this.save();
  }

  /** The reader takes the stored version: the form starts again from the invoice. */
  takeTheirs(): void {
    this.cancel();
    this.start();
  }

  private readConflict(): void {
    const detail = this.record.detail();
    const draft = this.draft();
    const opened = this.opened;
    if (detail === null || draft === null || opened === null) return;
    const now = draftOf(detail);
    const currency = detail.invoice.currency;
    const contactName = (id: string) =>
      this.contacts().find((contact) => contact.id === id)?.displayName ?? (id ? id : '—');
    const say: Record<keyof InvoiceEditDraft, [string, (d: InvoiceEditDraft) => string]> = {
      billingContactId: ['Billing contact', (d) => contactName(d.billingContactId)],
      customerPoNumber: ['Customer PO', (d) => d.customerPoNumber || '—'],
      freight: ['Freight', (d) => formatMoney({ currency, minor: Math.round(d.freight * 100) })],
      dueDate: ['Due', (d) => (d.dueDate ? formatDate(d.dueDate) : '—')],
    };
    const fields: InvoiceConflictField[] = [];
    for (const key of Object.keys(say) as (keyof InvoiceEditDraft)[]) {
      const [label, text] = say[key];
      if (text(opened) === text(now)) continue;
      fields.push({ label, theirs: text(now), mine: text(opened) !== text(draft) ? text(draft) : null });
    }
    this.conflict.set(fields);
    this.failure.set({ code: 'STALE_VERSION', message: FINANCE_WORDS['STALE_VERSION']!, kind: 'conflict' });
  }
}
