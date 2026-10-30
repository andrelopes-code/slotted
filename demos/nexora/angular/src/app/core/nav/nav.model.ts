export interface NavDestination {
  id: string;
  label: string;
  path: string;
  /** Any one of them opens the destination. */
  permissions?: string[];
  /** Every one of them is needed as well: a report reads its records under `analytics.view`. */
  requires?: string[];
  count?: 'approvals' | 'support';
  /** False where the destination has no record of its own to open: no `:id` route is made. */
  record?: false;
}

export interface NavModule {
  id: string;
  label: string;
  icon: string;
  section: 'home' | 'operate' | 'insight' | 'manage';
  path: string;
  permissions?: string[];
  destinations: NavDestination[];
  key?: string;
  slice: string;
}

const d = (
  module: string,
  id: string,
  label: string,
  path: string,
  extra: Partial<NavDestination> = {},
): NavDestination => ({ id: `${module}.${id}`, label, path, ...extra });

export const NAV_MODULES: readonly NavModule[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'lucideLayoutDashboard',
    section: 'home',
    path: '/dashboard',
    destinations: [],
    key: 'h',
    slice: 'Shell',
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: 'lucideUsers',
    section: 'operate',
    path: '/crm',
    permissions: ['customers.view'],
    key: 'c',
    slice: 'CRM',
    destinations: [
      d('crm', 'customers', 'Customers', '/crm/customers'),
      // A contact is read on its account: there is no page of one, and no backend resource for it.
      d('crm', 'contacts', 'Contacts', '/crm/contacts', {
        permissions: ['contacts.view'],
        record: false,
      }),
      d('crm', 'imports', 'Imports', '/crm/imports', { permissions: ['imports.run'] }),
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: 'lucideShoppingCart',
    section: 'operate',
    path: '/sales',
    permissions: ['orders.view', 'quotes.view'],
    key: 's',
    slice: 'Sales',
    destinations: [
      d('sales', 'quotes', 'Quotes', '/sales/quotes', { permissions: ['quotes.view'] }),
      d('sales', 'orders', 'Orders', '/sales/orders', { permissions: ['orders.view'] }),
      d('sales', 'approvals', 'Approvals', '/sales/approvals', {
        // The queue holds purchase orders too (§67): a procurement manager decides theirs here.
        permissions: ['orders.approve', 'quotes.approve', 'purchase_orders.approve'],
        count: 'approvals',
      }),
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: 'lucidePackage',
    section: 'operate',
    path: '/catalog',
    permissions: ['catalog.view'],
    slice: 'Catalog',
    destinations: [
      d('catalog', 'products', 'Products', '/catalog/products'),
      // A SKU is the other grain of the same concept, with the stock filters a
      // product has none of, and the record `/catalog/skus/:id` opens (BR-04).
      d('catalog', 'skus', 'SKUs', '/catalog/skus'),
      // The tree leads to a place in the catalogue; it has no record of its own.
      d('catalog', 'categories', 'Categories', '/catalog/categories', { record: false }),
      d('catalog', 'price-lists', 'Price lists', '/catalog/price-lists', {
        permissions: ['pricing.view'],
        record: false,
      }),
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'lucideWarehouse',
    section: 'operate',
    path: '/inventory',
    permissions: ['inventory.view'],
    key: 'i',
    slice: 'Inventory',
    destinations: [
      // The overview summarises and leads; it has no record of its own.
      d('inventory', 'overview', 'Overview', '/inventory/overview', { record: false }),
      // The positions are the list an operator lives in, and a list fills its page
      // (LP-12): it is a destination of its own that every figure of the overview
      // opens with its filter applied (OV-01). `:id` is one SKU's stock.
      d('inventory', 'stock', 'Stock', '/inventory/stock'),
      d('inventory', 'warehouses', 'Warehouses', '/inventory/warehouses'),
      d('inventory', 'transfers', 'Transfers', '/inventory/transfers'),
      // `:id` is one movement, drawn over the ledger it belongs to.
      d('inventory', 'movements', 'Movements', '/inventory/movements'),
      d('inventory', 'cycle-counts', 'Cycle counts', '/inventory/cycle-counts'),
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: 'lucideTruck',
    section: 'operate',
    path: '/procurement',
    permissions: ['suppliers.view', 'purchase_orders.view'],
    slice: 'Procurement',
    destinations: [
      d('procurement', 'suppliers', 'Suppliers', '/procurement/suppliers', {
        permissions: ['suppliers.view'],
      }),
      d('procurement', 'purchase-orders', 'Purchase orders', '/procurement/purchase-orders', {
        permissions: ['purchase_orders.view'],
      }),
      // No endpoint lists goods receipts: the destination is the queue of purchase orders a
      // receipt is written against (LP-09), and its `:id` is one goods receipt, the one
      // address a receipt has.
      d('procurement', 'receiving', 'Receiving', '/procurement/receiving', {
        permissions: ['receipts.view'],
      }),
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'lucideLandmark',
    section: 'operate',
    path: '/finance',
    permissions: ['finance.dashboard', 'invoices.view'],
    key: 'f',
    slice: 'Finance',
    destinations: [
      // The overview summarises and leads; it has no record of its own.
      d('finance', 'overview', 'Overview', '/finance/overview', {
        permissions: ['finance.dashboard'],
        record: false,
      }),
      d('finance', 'invoices', 'Invoices', '/finance/invoices', { permissions: ['invoices.view'] }),
      d('finance', 'payments', 'Payments', '/finance/payments', { permissions: ['payments.view'] }),
      d('finance', 'reconciliation', 'Reconciliation', '/finance/reconciliation', {
        permissions: ['reconciliation.view'],
      }),
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'lucideLifeBuoy',
    section: 'operate',
    path: '/support',
    permissions: ['support.view'],
    slice: 'Support',
    destinations: [d('support', 'inbox', 'Inbox', '/support/inbox', { count: 'support' })],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'lucideChartColumn',
    section: 'insight',
    path: '/analytics',
    permissions: ['analytics.view'],
    slice: 'Analytics',
    // Section 16's report types. Each reads one area's records beside `analytics.view`, so a
    // reader who cannot read the area is not offered its report; a report has no record of its own.
    destinations: [
      d('analytics', 'executive', 'Executive', '/analytics/executive', { record: false }),
      d('analytics', 'sales', 'Sales', '/analytics/sales', {
        permissions: ['orders.view'],
        requires: ['analytics.view'],
        record: false,
      }),
      d('analytics', 'inventory', 'Inventory', '/analytics/inventory', {
        permissions: ['inventory.view'],
        requires: ['analytics.view'],
        record: false,
      }),
      d('analytics', 'procurement', 'Procurement', '/analytics/procurement', {
        permissions: ['purchase_orders.view'],
        requires: ['analytics.view'],
        record: false,
      }),
      d('analytics', 'finance', 'Finance', '/analytics/finance', {
        permissions: ['invoices.view', 'payments.view', 'finance.dashboard'],
        requires: ['analytics.view'],
        record: false,
      }),
      d('analytics', 'support', 'Support', '/analytics/support', {
        permissions: ['support.view'],
        requires: ['analytics.view'],
        record: false,
      }),
    ],
  },
  {
    id: 'automations',
    label: 'Automations',
    icon: 'lucideWorkflow',
    section: 'insight',
    path: '/automations',
    permissions: ['workflows.view'],
    slice: 'Workflow',
    destinations: [d('automations', 'workflows', 'Workflows', '/automations/workflows')],
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: 'lucideActivity',
    section: 'insight',
    path: '/activity',
    destinations: [],
    slice: 'Activity',
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: 'lucideScrollText',
    section: 'insight',
    path: '/audit',
    permissions: ['audit.view'],
    destinations: [],
    slice: 'Activity',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'lucideSettings',
    section: 'manage',
    path: '/settings',
    permissions: ['organization.view', 'users.view', 'roles.view'],
    slice: 'Administration',
    destinations: [
      d('settings', 'organization', 'Organization', '/settings/organization', {
        permissions: ['organization.view'],
      }),
      d('settings', 'users', 'Users', '/settings/users', { permissions: ['users.view'] }),
      d('settings', 'teams', 'Teams', '/settings/teams', { permissions: ['teams.view'] }),
      d('settings', 'roles', 'Roles & permissions', '/settings/roles', {
        permissions: ['roles.view'],
      }),
      d('settings', 'warehouses', 'Warehouses', '/settings/warehouses', {
        permissions: ['organization.view'],
      }),
      d('settings', 'integrations', 'Integrations', '/settings/integrations', {
        permissions: ['organization.edit'],
      }),
    ],
  },
];

export const SECTION_LABELS: Record<NavModule['section'], string | null> = {
  home: null,
  operate: 'Operate',
  insight: 'Insight',
  manage: 'Manage',
};

const allowed = (can: (p: string) => boolean, permissions?: string[], requires?: string[]) =>
  (permissions === undefined || permissions.some(can)) && (requires ?? []).every(can);

export function visibleModules(can: (p: string) => boolean): NavModule[] {
  return NAV_MODULES.filter((m) => allowed(can, m.permissions)).map((m) => ({
    ...m,
    destinations: m.destinations.filter((x) => allowed(can, x.permissions, x.requires)),
  }));
}

export function moduleFor(url: string): NavModule | undefined {
  const path = url.split('?')[0] ?? '';
  return NAV_MODULES.find((m) => path === m.path || path.startsWith(`${m.path}/`));
}

export function destinationFor(
  url: string,
): { module: NavModule; destination: NavDestination } | undefined {
  const module = moduleFor(url);
  if (module === undefined) return undefined;
  const path = url.split('?')[0] ?? '';
  const destination = module.destinations.find(
    (x) => path === x.path || path.startsWith(`${x.path}/`),
  );
  return destination === undefined ? undefined : { module, destination };
}
