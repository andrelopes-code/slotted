import { quantityToMilli } from './quantity';
import type { Invoice } from './finance';
import type { SalesOrder, SalesOrderLine } from './sales';

/** Derived sales-order dimensions (section 59.1). */

export function allocationStatusOf(
  lines: readonly SalesOrderLine[],
): SalesOrder['allocationStatus'] {
  let open = 0;
  let covered = 0;
  for (const line of lines) {
    const openMilli =
      quantityToMilli(line.orderedQuantity) -
      quantityToMilli(line.cancelledQuantity) -
      quantityToMilli(line.fulfilledQuantity);
    if (openMilli <= 0) continue;
    open += openMilli;
    covered += Math.min(openMilli, quantityToMilli(line.reservedQuantity));
  }
  if (open === 0) return 'allocated';
  if (covered === 0) return 'unallocated';
  return covered >= open ? 'allocated' : 'partially_allocated';
}

export function fulfillmentStatusOf(
  lines: readonly SalesOrderLine[],
): SalesOrder['fulfillmentStatus'] {
  let ordered = 0;
  let fulfilled = 0;
  let returned = 0;
  for (const line of lines) {
    ordered += quantityToMilli(line.orderedQuantity) - quantityToMilli(line.cancelledQuantity);
    fulfilled += quantityToMilli(line.fulfilledQuantity);
    returned += quantityToMilli(line.returnedQuantity);
  }
  if (returned > 0 && returned >= fulfilled) return 'returned';
  if (returned > 0) return 'partially_returned';
  if (fulfilled === 0) return 'unfulfilled';
  return fulfilled >= ordered ? 'fulfilled' : 'partially_fulfilled';
}

export function invoiceStatusOf(lines: readonly SalesOrderLine[]): SalesOrder['invoiceStatus'] {
  let fulfilled = 0;
  let invoiced = 0;
  for (const line of lines) {
    fulfilled += quantityToMilli(line.fulfilledQuantity);
    invoiced += quantityToMilli(line.invoicedQuantity);
  }
  if (invoiced === 0) return 'not_invoiced';
  const ordered = lines.reduce(
    (sum, line) =>
      sum + quantityToMilli(line.orderedQuantity) - quantityToMilli(line.cancelledQuantity),
    0,
  );
  return invoiced >= ordered && fulfilled >= ordered ? 'invoiced' : 'partially_invoiced';
}

export function paymentStatusOf(invoices: readonly Invoice[]): SalesOrder['paymentStatus'] {
  const open = invoices.filter(
    (invoice) => invoice.lifecycle === 'open' || invoice.lifecycle === 'written_off',
  );
  if (open.length === 0) return 'not_invoiced';
  if (open.some((invoice) => invoice.collectionState === 'overdue')) return 'overdue';
  const total = open.reduce((sum, invoice) => sum + invoice.total.minor, 0);
  const paid = open.reduce(
    (sum, invoice) => sum + invoice.paidAmount.minor + invoice.writtenOffAmount.minor,
    0,
  );
  if (paid <= 0) return 'unpaid';
  return paid >= total ? 'paid' : 'partially_paid';
}
