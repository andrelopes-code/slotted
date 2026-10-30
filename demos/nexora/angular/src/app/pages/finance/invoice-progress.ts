import type { ApprovalRequest, InvoiceListItem } from '@slotted/demo-nexora-backend';

import { formatDate, formatMoney } from '../../core/catalog/catalog.model';
import { agingWords, daysBetween } from '../../core/finance/finance.model';
import type { ProgressStep } from '../record-progress/record-progress';

/**
 * An invoice's cycle (§66.5): drafted, opened, sent, settled. Paid in full is
 * the last step done; a write-off and a void stop the invoice on its last step
 * with the tone the page gives a stop — the warning tone for a balance written
 * off, the danger tone for an invoice voided.
 */
export function invoiceSteps(invoice: InvoiceListItem, today: string): readonly ProgressStep[] {
  const draft = invoice.lifecycle === 'draft';
  const closed = invoice.lifecycle === 'voided' || invoice.lifecycle === 'written_off';
  const paid = invoice.lifecycle === 'open' && invoice.settlement === 'paid';
  const sent = invoice.sentAt !== undefined;
  const settledDetail =
    invoice.lifecycle === 'voided'
      ? invoice.voidedAt
        ? `Voided ${formatDate(invoice.voidedAt)}`
        : 'Voided'
      : invoice.lifecycle === 'written_off'
        ? `Written off ${formatDate(invoice.writtenOffAt ?? invoice.dueDate)}`
        : paid
          ? invoice.total.minor === 0
            ? 'Nothing to pay'
            : 'Paid in full'
          : draft
            ? undefined
            : `${formatMoney(invoice.outstanding)} owed`;
  return [
    { key: 'drafted', label: 'Drafted', state: draft ? 'current' : 'done', detail: formatDate(invoice.issueDate) },
    {
      key: 'opened',
      label: 'Opened',
      state: draft ? 'todo' : 'done',
      ...(invoice.openedAt ? { detail: formatDate(invoice.openedAt) } : {}),
    },
    {
      key: 'sent',
      label: 'Sent',
      state: sent ? 'done' : draft || closed ? 'todo' : paid ? 'todo' : 'current',
      ...(sent ? { detail: formatDate(invoice.sentAt!) } : !draft && !closed && !paid ? { detail: 'Not sent yet' } : {}),
    },
    {
      key: 'settled',
      label: 'Settled',
      state: closed ? 'stopped' : paid ? 'done' : !draft && sent ? 'current' : 'todo',
      ...(settledDetail ? { detail: settledDetail } : {}),
      ...(invoice.lifecycle === 'open' && !paid && invoice.outstanding.minor > 0 && daysBetween(today, invoice.dueDate) > 0
        ? { detail: agingWords(invoice, today) }
        : {}),
    },
  ];
}

/** The stop's tone: a void is the danger tone, a balance written off the warning tone (RP-06). */
export function invoiceStop(invoice: InvoiceListItem): 'danger' | 'warning' | null {
  return invoice.lifecycle === 'voided' ? 'danger' : invoice.lifecycle === 'written_off' ? 'warning' : null;
}

/**
 * One sentence for what the invoice waits on and what happens next (RP-06),
 * with the three axes of §66.2 said in words: the lifecycle, the settlement
 * and the collection state.
 */
export function invoiceSentence(
  invoice: InvoiceListItem,
  today: string,
  approval: ApprovalRequest | null | undefined,
): string {
  const owed = formatMoney(invoice.outstanding);
  const customer = invoice.customerName;
  const aging = agingWords(invoice, today);
  const approvalWords =
    approval?.status === 'pending'
      ? ` A write-off of the balance waits on a Finance Manager's approval; until it is decided the invoice stays owed.`
      : '';
  switch (invoice.lifecycle) {
    case 'draft':
      return `A draft: ${customer} owes nothing on it yet. Opening it gives it its number, fixes its exchange rate and adds ${formatMoney(invoice.total)} to ${customer}'s receivables.`;
    case 'voided':
      return `Voided: it no longer counts in ${customer}'s receivables, and its shipped lines went back to the order to be invoiced again. The invoice is kept, as it was.`;
    case 'written_off':
      return `Written off: ${formatMoney(invoice.writtenOffAmount)} was written off and no longer counts in ${customer}'s receivables; it stays in invoiced revenue.`;
  }
  if (invoice.settlement === 'paid' && invoice.total.minor === 0)
    return `Worth nothing: an adjustment with no amount to collect, so ${customer} owes nothing on it.`;
  if (invoice.settlement === 'paid')
    return `Paid in full: ${formatMoney(invoice.paidAmount)} received or credited, nothing owed.`;
  const paid =
    invoice.settlement === 'partially_paid'
      ? ` ${formatMoney(invoice.paidAmount)} of ${formatMoney(invoice.total)} is paid or credited.`
      : '';
  if (invoice.collectionState === 'disputed')
    return `Disputed by ${customer}${invoice.disputeReason ? `: “${invoice.disputeReason}”` : ''}. ${owed} is still owed and the invoice keeps aging (${aging.toLowerCase()}); resolving the dispute returns it to collection.${paid}${approvalWords}`;
  if (invoice.collectionState === 'overdue')
    return `Overdue: ${aging.toLowerCase()} since ${formatDate(invoice.dueDate)}, ${owed} still owed by ${customer}.${paid}${approvalWords}`;
  const sent = invoice.sentAt ? '' : ' It has not been sent yet.';
  return `Open: ${owed} owed by ${customer}, ${aging.toLowerCase()} (${formatDate(invoice.dueDate)}).${sent}${paid}${approvalWords}`;
}
