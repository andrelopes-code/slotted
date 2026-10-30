import type { FormErrors } from '@slotted/core/form';
import type { CurrencyCode, InvoiceListItem, NexoraApi } from '@slotted/demo-nexora-backend';

import type { TransportHealth } from '../backend/transport-health';
import { formatMoney } from '../catalog/catalog.model';
import { FINANCE_WORDS } from './finance.model';

/** One open invoice of the payment's customer, and what the reader gives it of the payment. */
export interface AllocationLine {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly dueDate: string;
  readonly outstandingMinor: number;
  readonly currency: CurrencyCode;
  /** In the currency's major unit, as the currency field holds it; null where nothing is given. */
  readonly amount: number | null;
}

/** The map key of a line's amount: the field the backend calls `allocations[].amountMinor`, per invoice. */
export const allocationKey = (invoiceId: string): string => `allocations.${invoiceId}`;
/** The key the sum is refused under, against the payment (`ALLOCATION_EXCEEDS_PAYMENT`). */
export const ALLOCATIONS_KEY = 'allocations';

export const toMinor = (amount: number | null | undefined): number =>
  amount === null || amount === undefined || !Number.isFinite(amount) ? 0 : Math.round(amount * 100);

export function allocatedMinor(lines: readonly AllocationLine[]): number {
  return lines.reduce((sum, line) => sum + toMinor(line.amount), 0);
}

/**
 * The limits §66.8 puts on an allocation, applied as the reader types (FM-11):
 * each amount is positive and no larger than what the invoice still owes, and
 * together they are no larger than what the payment has to give. The words are
 * the ones the backend's codes carry in the module (`ALLOCATION_EXCEEDS_*`),
 * with the figure that was crossed. The currency is never a limit to check: a
 * line is offered only for an invoice in the payment's own currency.
 */
export function allocationErrors(lines: readonly AllocationLine[], availableMinor: number): FormErrors {
  const errors: Record<string, string[]> = {};
  for (const line of lines) {
    const minor = toMinor(line.amount);
    if (line.amount !== null && minor < 0)
      errors[allocationKey(line.invoiceId)] = ['An allocation is a positive amount.'];
    else if (minor > line.outstandingMinor)
      errors[allocationKey(line.invoiceId)] = [
        `${FINANCE_WORDS['ALLOCATION_EXCEEDS_OUTSTANDING']} ${line.invoiceNumber} owes ${formatMoney({ currency: line.currency, minor: line.outstandingMinor })}.`,
      ];
  }
  const total = allocatedMinor(lines);
  const currency = lines[0]?.currency ?? 'USD';
  if (total > availableMinor)
    errors[ALLOCATIONS_KEY] = [
      `${FINANCE_WORDS['ALLOCATION_EXCEEDS_PAYMENT']} They come to ${formatMoney({ currency, minor: total })} of ${formatMoney({ currency, minor: availableMinor })}.`,
    ];
  return errors;
}

/** The lines the command carries: the invoices given something, in minor units. */
export function allocationsOf(lines: readonly AllocationLine[]): { invoiceId: string; amountMinor: number }[] {
  return lines
    .filter((line) => toMinor(line.amount) > 0)
    .map((line) => ({ invoiceId: line.invoiceId, amountMinor: toMinor(line.amount) }));
}

/**
 * The customer's open invoices that still owe, oldest due first, split by
 * whether they are written in the payment's currency: only those can take it
 * (§53.7, §66.8), and the others are counted so the form can say why they are
 * not offered.
 */
export async function openInvoicesOf(
  api: NexoraApi,
  health: TransportHealth,
  customerId: string,
  currency: CurrencyCode,
): Promise<{ lines: AllocationLine[]; otherCurrency: number } | null> {
  const answer = await health.read(
    () =>
      api.finance.invoices.list({
        pageSize: 100,
        sort: 'dueDate',
        filter: { customerId: { eq: customerId }, lifecycle: { in: ['open'] }, outstanding: { gt: 0 } },
      }),
    null,
  );
  if (answer === null) return null;
  const owing = answer.data.filter((row: InvoiceListItem) => row.outstanding.minor > 0);
  return {
    lines: owing
      .filter((row) => row.currency === currency)
      .map((row) => ({
        invoiceId: row.id,
        invoiceNumber: row.invoiceNumber ?? row.id,
        dueDate: row.dueDate,
        outstandingMinor: row.outstanding.minor,
        currency: row.currency,
        amount: null,
      })),
    otherCurrency: owing.filter((row) => row.currency !== currency).length,
  };
}
