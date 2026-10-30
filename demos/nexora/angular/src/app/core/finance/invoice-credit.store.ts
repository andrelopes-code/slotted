import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';

import { formatMoney } from '../catalog/catalog.model';
import { fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { classifyFinance } from './finance.model';
import { InvoiceStore } from './invoice.store';

/**
 * Credit applied to an invoice from one of the customer's open credit memos
 * (§66.11). The amount may exceed neither the memo's unapplied credit nor the
 * invoice's outstanding, and the form applies both limits as the reader types
 * (FM-11) rather than meeting `CREDIT_EXCEEDED` after the submit.
 */
@Injectable({ providedIn: 'root' })
export class InvoiceCreditStore {
  private readonly record = inject(InvoiceStore);

  readonly memoId = signal<string | null>(null);
  /** Major units of the invoice's currency; null while empty. */
  readonly amount = signal<number | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);
  private readonly serverErrors = signal<FormErrors>({});

  readonly memos = this.record.openCredits;
  readonly memo = computed(() => this.memos().find((memo) => memo.id === this.memoId()) ?? null);

  /** The most that can be applied, in minor units: the smaller of the two limits. */
  readonly limitMinor = computed(() => {
    const memo = this.memo();
    const invoice = this.record.invoice();
    if (memo === null || invoice === null) return 0;
    return Math.min(memo.unappliedAmount.minor, invoice.outstanding.minor);
  });

  readonly limitWords = computed(() => {
    const memo = this.memo();
    const invoice = this.record.invoice();
    if (memo === null || invoice === null) return '';
    const byMemo = memo.unappliedAmount.minor <= invoice.outstanding.minor;
    return `Up to ${formatMoney({ currency: invoice.currency, minor: this.limitMinor() })}: ${
      byMemo
        ? `the credit ${memo.creditMemoNumber} has left, less than the ${formatMoney(invoice.outstanding)} owed`
        : `what the invoice still owes, less than the ${formatMoney(memo.unappliedAmount)} ${memo.creditMemoNumber} has left`
    }.`;
  });

  /** The limits, applied while the amount is typed; the server's own answer joins them. */
  readonly errors = computed<FormErrors>(() => {
    const errors: Record<string, string[]> = { ...this.serverErrors() } as Record<string, string[]>;
    const amount = this.amount();
    const invoice = this.record.invoice();
    if (amount !== null && invoice !== null) {
      const minor = Math.round(amount * 100);
      if (minor <= 0) errors['amountMinor'] = ['Apply more than nothing.'];
      else if (minor > this.limitMinor())
        errors['amountMinor'] = [
          `At most ${formatMoney({ currency: invoice.currency, minor: this.limitMinor() })} can be applied.`,
        ];
    }
    return errors;
  });

  setErrors(errors: FormErrors): void {
    this.serverErrors.set(errors);
  }

  /** Opens on the first memo with its whole usable credit as the amount. */
  start(): void {
    if (this.memo() !== null) return;
    const first = this.memos()[0];
    if (!first) return;
    this.choose(first.id);
  }

  choose(memoId: string | null): void {
    this.memoId.set(memoId);
    this.serverErrors.set({});
    this.amount.set(memoId === null ? null : this.limitMinor() / 100);
  }

  reset(): void {
    this.memoId.set(null);
    this.amount.set(null);
    this.serverErrors.set({});
    this.failure.set(null);
  }

  async apply(): Promise<boolean> {
    const memo = this.memo();
    const invoice = this.record.invoice();
    if (memo === null || invoice === null) return false;
    const amount = this.amount();
    if (amount === null) {
      this.serverErrors.set({ amountMinor: ['Say how much of the credit to apply.'] });
      return false;
    }
    if (Object.keys(this.errors()).length > 0) return false;
    const version = this.record.readCreditVersion(memo.id);
    const result = await this.record.write('credit', (api) =>
      api.finance.creditMemos.apply(
        memo.id,
        { invoiceId: invoice.id, amountMinor: Math.round(amount * 100) },
        { ifMatch: version },
      ),
    );
    if (result.ok) {
      this.reset();
      return true;
    }
    if (result.error !== null) {
      this.failure.set(classifyFinance(result.error, 'No credit was applied.'));
      this.serverErrors.set(fieldErrors(result.error));
    }
    return false;
  }
}
