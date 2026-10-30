export type PermissionArea =
  | 'identity'
  | 'crm'
  | 'catalog'
  | 'sales'
  | 'inventory'
  | 'procurement'
  | 'finance'
  | 'support'
  | 'administration';

const AREA_BY_PREFIX: Record<string, PermissionArea> = {
  organization: 'identity',
  users: 'identity',
  teams: 'identity',
  roles: 'identity',
  customers: 'crm',
  contacts: 'crm',
  notes: 'crm',
  catalog: 'catalog',
  pricing: 'catalog',
  cost: 'catalog',
  quotes: 'sales',
  orders: 'sales',
  inventory: 'inventory',
  shipments: 'inventory',
  returns: 'inventory',
  suppliers: 'procurement',
  purchase_orders: 'procurement',
  receipts: 'procurement',
  finance: 'finance',
  invoices: 'finance',
  payments: 'finance',
  credit_memos: 'finance',
  refunds: 'finance',
  reconciliation: 'finance',
  support: 'support',
};

export const AREA_LABELS: Record<PermissionArea, string> = {
  identity: 'Organization & identity',
  crm: 'CRM',
  catalog: 'Catalog',
  sales: 'Sales',
  inventory: 'Inventory & fulfillment',
  procurement: 'Procurement',
  finance: 'Finance',
  support: 'Support',
  administration: 'Workflow & administration',
};

/** The §55.4 area of a permission key, by its prefix; anything unlisted is administration. */
export function permissionArea(permission: string): PermissionArea {
  return AREA_BY_PREFIX[permission.split('.')[0] ?? ''] ?? 'administration';
}

/** `sales_manager` → `Sales manager`: the persona list carries the role key, not its name. */
export function roleLabel(key: string): string {
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
