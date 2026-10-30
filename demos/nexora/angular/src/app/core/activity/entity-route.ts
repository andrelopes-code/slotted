/**
 * Where a record lives in the client, by the entity types the backend writes
 * on a notification, a task and a workflow run. The backend records what a
 * row is about, not where it lives; the address is the client's.
 */
const ROUTE_BY_ENTITY: Record<string, string> = {
  customer: '/crm/customers',
  sales_order: '/sales/orders',
  quote: '/sales/quotes',
  invoice: '/finance/invoices',
  product: '/catalog/products',
  sku: '/catalog/skus',
  support_ticket: '/support/inbox',
  purchase_order: '/procurement/purchase-orders',
  supplier: '/procurement/suppliers',
  workflow: '/automations/workflows',
};

/** The canonical address of a record, or null where its type has no screen. */
export function entityRoute(type: string | undefined, id: string | undefined): string | null {
  if (type === undefined || id === undefined) return null;
  // A shipment has no screen of its own: it opens the ledger narrowed to what it moved.
  if (type === 'shipment') return `/inventory/movements?source=${encodeURIComponent(id)}`;
  // An approval request has no page of its own: it is decided in the approvals queue.
  if (type === 'approval_request') return '/sales/approvals';
  const base = ROUTE_BY_ENTITY[type];
  return base === undefined ? null : `${base}/${id}`;
}
