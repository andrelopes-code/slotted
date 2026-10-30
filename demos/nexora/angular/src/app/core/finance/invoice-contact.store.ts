import { inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';

import { formatDate } from '../catalog/catalog.model';
import { fieldErrors, type InventoryFailure } from '../inventory/inventory-failure';
import { classifyFinance } from './finance.model';
import { contactAttemptPrefix, InvoiceStore, type ContactChannel } from './invoice.store';

/**
 * A contact attempt on an invoice (Journey C, §20), written as the customer
 * note §47 calls a collection note: `notes.create` on the customer, its body
 * the invoice's own prefix, the channel and what was agreed. The draft lives
 * here, so leaving the form and coming back finds it (FM-05); a save empties it.
 */
@Injectable({ providedIn: 'root' })
export class InvoiceContactStore {
  private readonly record = inject(InvoiceStore);

  readonly channel = signal<ContactChannel>('Phone');
  readonly said = signal('');
  /** A payment date the customer promised, as a business date; empty for none. */
  readonly promised = signal('');
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);

  /** The note's body: the prefix the invoice finds its attempts by, then the channel and the words. */
  body(invoiceNumber: string): string {
    const promise = this.promised() ? ` Payment promised by ${formatDate(this.promised())}.` : '';
    return `${contactAttemptPrefix(invoiceNumber)}${this.channel()}: ${this.said().trim()}${promise}`;
  }

  reset(): void {
    this.channel.set('Phone');
    this.said.set('');
    this.promised.set('');
    this.errors.set({});
    this.failure.set(null);
  }

  async save(): Promise<boolean> {
    const invoice = this.record.invoice();
    if (invoice === null || !invoice.invoiceNumber) return false;
    const errors: Record<string, string[]> = {};
    if (this.said().trim().length === 0) errors['body'] = ['Say what was said or agreed.'];
    if (this.promised() && this.promised() < this.record.today())
      errors['promised'] = ['A promised date is today or later.'];
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0) return false;
    const body = this.body(invoice.invoiceNumber);
    const result = await this.record.write('contact', (api) =>
      api.customers.notes.add(invoice.customerId, { body, visibility: 'organization' }),
    );
    if (result.ok) {
      this.reset();
      return true;
    }
    if (result.error !== null) {
      this.failure.set(classifyFinance(result.error, 'The contact attempt was not recorded.'));
      this.errors.set(fieldErrors(result.error));
    }
    return false;
  }
}
