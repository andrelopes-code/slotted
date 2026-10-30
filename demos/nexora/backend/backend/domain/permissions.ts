import type { DefaultScope, PermissionGrant } from './identity';

/** Section 55.4 — canonical permission catalog. */
export const PERMISSIONS = [
  'organization.view',
  'organization.edit',
  'users.view',
  'users.invite',
  'users.edit',
  'users.suspend',
  'teams.view',
  'teams.manage',
  'roles.view',
  'roles.manage',
  'customers.view',
  'customers.create',
  'customers.edit',
  'customers.archive',
  'customers.export',
  'customers.credit_view',
  'customers.credit_edit',
  'contacts.view',
  'contacts.manage',
  'notes.view',
  'notes.create',
  'notes.delete_own',
  'catalog.view',
  'catalog.manage',
  'pricing.view',
  'pricing.manage',
  'cost.view',
  'quotes.view',
  'quotes.create',
  'quotes.edit',
  'quotes.send',
  'quotes.approve',
  'quotes.convert',
  'orders.view',
  'orders.create',
  'orders.edit_draft',
  'orders.edit_confirmed',
  'orders.submit',
  'orders.approve',
  'orders.hold',
  'orders.release_hold',
  'orders.cancel',
  'orders.override_price',
  'orders.export',
  'inventory.view',
  'inventory.allocate',
  'inventory.deallocate',
  'inventory.adjust',
  'inventory.transfer',
  'inventory.cycle_count',
  'shipments.view',
  'shipments.create',
  'shipments.pick',
  'shipments.pack',
  'shipments.ship',
  'shipments.mark_delivered',
  'returns.view',
  'returns.create',
  'returns.authorize',
  'returns.receive',
  'returns.inspect',
  'suppliers.view',
  'suppliers.manage',
  'purchase_orders.view',
  'purchase_orders.create',
  'purchase_orders.edit',
  'purchase_orders.submit',
  'purchase_orders.approve',
  'purchase_orders.send',
  'purchase_orders.cancel',
  'receipts.view',
  'receipts.create',
  'finance.dashboard',
  'invoices.view',
  'invoices.create',
  'invoices.edit_draft',
  'invoices.open',
  'invoices.send',
  'invoices.void',
  'invoices.write_off',
  'payments.view',
  'payments.record',
  'payments.reverse',
  'credit_memos.view',
  'credit_memos.create',
  'credit_memos.open',
  'refunds.create',
  'reconciliation.view',
  'reconciliation.manage',
  'support.view',
  'support.create',
  'support.reply',
  'support.assign',
  'support.change_status',
  'support.escalate',
  'support.manage',
  'workflows.view',
  'workflows.create',
  'workflows.edit',
  'workflows.activate',
  'workflows.archive',
  'analytics.view',
  'audit.view',
  'audit.export',
  'notifications.manage_own',
  'saved_views.manage_own',
  'imports.run',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_SET = new Set<string>(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

function grants(
  permissions: readonly Permission[],
  defaultScope: DefaultScope = 'all',
): PermissionGrant[] {
  return permissions.map((permission) => ({ permission, defaultScope }));
}

function withPrefix(prefixes: readonly string[]): Permission[] {
  return PERMISSIONS.filter((permission) =>
    prefixes.some((prefix) => permission.startsWith(`${prefix}.`)),
  );
}

const VIEW_PERMISSIONS = PERMISSIONS.filter(
  (permission) =>
    permission.endsWith('.view') ||
    permission === 'finance.dashboard' ||
    permission === 'cost.view',
);

const PERSONAL_PERMISSIONS: Permission[] = ['notifications.manage_own', 'saved_views.manage_own'];

export type RoleKey =
  | 'administrator'
  | 'executive'
  | 'sales_manager'
  | 'sales_representative'
  | 'finance_manager'
  | 'accountant'
  | 'procurement_manager'
  | 'buyer'
  | 'warehouse_manager'
  | 'warehouse_operator'
  | 'support_manager'
  | 'support_agent'
  | 'auditor';

export interface RoleDefinition {
  key: RoleKey;
  name: string;
  description: string;
  grants: PermissionGrant[];
}

/** Section 55.5 — canonical demo roles in seed order. */
export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    key: 'administrator',
    name: 'Administrator',
    description: 'All permissions across all scopes.',
    grants: grants(PERMISSIONS),
  },
  {
    key: 'executive',
    name: 'Executive',
    description:
      'Read-only access to all business data plus analytics, finance dashboard and audit.',
    grants: grants([...VIEW_PERMISSIONS, 'analytics.view', 'audit.view', ...PERSONAL_PERMISSIONS]),
  },
  {
    key: 'sales_manager',
    name: 'Sales Manager',
    description: 'CRM, quotes, orders and sales approvals across all customer and sales records.',
    grants: grants([
      ...withPrefix(['customers', 'contacts', 'notes', 'quotes', 'orders']),
      'catalog.view',
      'pricing.view',
      'cost.view',
      'inventory.view',
      'shipments.view',
      'returns.view',
      'returns.create',
      'invoices.view',
      'payments.view',
      'credit_memos.view',
      'support.view',
      'support.create',
      'analytics.view',
      'workflows.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'sales_representative',
    name: 'Sales Representative',
    description:
      'Customer and order workflow for owned accounts; read access to all customers and orders.',
    grants: [
      ...grants(['customers.view', 'orders.view', 'quotes.view', 'contacts.view', 'notes.view']),
      ...grants(
        [
          'customers.create',
          'customers.edit',
          'customers.credit_view',
          'contacts.manage',
          'notes.create',
          'quotes.create',
          'quotes.edit',
          'quotes.send',
          'quotes.convert',
          'orders.create',
          'orders.edit_draft',
          'orders.submit',
        ],
        'own',
      ),
      ...grants([
        'catalog.view',
        'pricing.view',
        'inventory.view',
        'shipments.view',
        'invoices.view',
        'support.view',
        'analytics.view',
        ...PERSONAL_PERMISSIONS,
      ]),
    ],
  },
  {
    key: 'finance_manager',
    name: 'Finance Manager',
    description: 'Receivables, credit, order financial approvals and reconciliation.',
    grants: grants([
      ...withPrefix(['invoices', 'payments', 'credit_memos', 'refunds', 'reconciliation']),
      'finance.dashboard',
      'customers.view',
      'customers.credit_view',
      'customers.credit_edit',
      'customers.export',
      'contacts.view',
      'notes.view',
      'notes.create',
      'orders.view',
      'orders.approve',
      'orders.hold',
      'orders.release_hold',
      'orders.export',
      'quotes.view',
      'quotes.approve',
      'purchase_orders.view',
      'purchase_orders.approve',
      'catalog.view',
      'pricing.view',
      'cost.view',
      'inventory.view',
      'shipments.view',
      'returns.view',
      'suppliers.view',
      'support.view',
      'analytics.view',
      'audit.view',
      'workflows.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'accountant',
    name: 'Accountant',
    description:
      'Operational invoicing, payments and reconciliation without credit or approval authority.',
    grants: grants([
      'finance.dashboard',
      'invoices.view',
      'invoices.create',
      'invoices.edit_draft',
      'invoices.open',
      'invoices.send',
      'invoices.void',
      'invoices.write_off',
      'payments.view',
      'payments.record',
      'payments.reverse',
      'credit_memos.view',
      'credit_memos.create',
      'credit_memos.open',
      'refunds.create',
      'reconciliation.view',
      'reconciliation.manage',
      'customers.view',
      'customers.credit_view',
      'contacts.view',
      'notes.view',
      'orders.view',
      'shipments.view',
      'returns.view',
      'catalog.view',
      'pricing.view',
      'support.view',
      'analytics.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'procurement_manager',
    name: 'Procurement Manager',
    description: 'Supplier management, purchase-order management and approval.',
    grants: grants([
      ...withPrefix(['suppliers', 'purchase_orders', 'receipts']),
      'catalog.view',
      'cost.view',
      'inventory.view',
      'inventory.transfer',
      'analytics.view',
      'workflows.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'buyer',
    name: 'Buyer',
    description: 'Purchase-order creation, submission and sending; supplier and receipt view.',
    grants: grants([
      'suppliers.view',
      'purchase_orders.view',
      'purchase_orders.create',
      'purchase_orders.edit',
      'purchase_orders.submit',
      'purchase_orders.send',
      'receipts.view',
      'catalog.view',
      'cost.view',
      'inventory.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'warehouse_manager',
    name: 'Warehouse Manager',
    description:
      'Inventory, transfers, cycle counts, shipments and return receipts for assigned warehouses.',
    grants: [
      ...grants(
        [
          ...withPrefix(['inventory', 'shipments']),
          'returns.view',
          'returns.receive',
          'returns.inspect',
          'receipts.view',
          'receipts.create',
          // Section 55.5: a warehouse role reads what arrives at its own warehouses.
          'purchase_orders.view',
        ],
        'warehouse',
      ),
      ...grants([
        'catalog.view',
        'orders.view',
        'customers.view',
        'suppliers.view',
        'analytics.view',
        ...PERSONAL_PERMISSIONS,
      ]),
    ],
  },
  {
    key: 'warehouse_operator',
    name: 'Warehouse Operator',
    description: 'Pick, pack, ship, receive and count for assigned warehouses.',
    grants: [
      ...grants(
        [
          'inventory.view',
          'inventory.cycle_count',
          'shipments.view',
          'shipments.pick',
          'shipments.pack',
          'shipments.ship',
          'shipments.mark_delivered',
          'receipts.view',
          'receipts.create',
          'returns.view',
          'returns.receive',
          // Section 55.5: a warehouse role reads what arrives at its own warehouses.
          'purchase_orders.view',
        ],
        'warehouse',
      ),
      ...grants(['catalog.view', 'orders.view', ...PERSONAL_PERMISSIONS]),
    ],
  },
  {
    key: 'support_manager',
    name: 'Support Manager',
    description: 'All support permissions plus customer, order, invoice and product read access.',
    grants: grants([
      ...withPrefix(['support']),
      'customers.view',
      'contacts.view',
      'notes.view',
      'notes.create',
      'orders.view',
      'shipments.view',
      'returns.view',
      'invoices.view',
      'catalog.view',
      'analytics.view',
      'workflows.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'support_agent',
    name: 'Support Agent',
    description:
      'Support operations with customer, contact and related order, invoice and product read access.',
    grants: grants([
      'support.view',
      'support.create',
      'support.reply',
      'support.assign',
      'support.change_status',
      'support.escalate',
      'customers.view',
      'contacts.view',
      'notes.view',
      'notes.create',
      'orders.view',
      'shipments.view',
      'returns.view',
      'returns.create',
      'invoices.view',
      'catalog.view',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
  {
    key: 'auditor',
    name: 'Auditor',
    description: 'Read-only access to all modules and audit export.',
    grants: grants([
      ...VIEW_PERMISSIONS,
      'analytics.view',
      'audit.view',
      'audit.export',
      ...PERSONAL_PERMISSIONS,
    ]),
  },
];

export interface PersonaDefinition {
  key: string;
  firstName: string;
  lastName: string;
  role: RoleKey;
  title: string;
  department: string;
  context: string;
  /** Warehouse codes the persona is scoped to (warehouse-scoped roles only). */
  warehouseCodes?: string[];
}

/** Section 55.6 — switchable demo personas. */
export const PERSONAS: readonly PersonaDefinition[] = [
  {
    key: 'maya-chen',
    firstName: 'Maya',
    lastName: 'Chen',
    role: 'administrator',
    title: 'Head of Business Systems',
    department: 'Administration',
    context: 'System administration',
  },
  {
    key: 'evan-brooks',
    firstName: 'Evan',
    lastName: 'Brooks',
    role: 'executive',
    title: 'Chief Operating Officer',
    department: 'Executive',
    context: 'Executive dashboards',
  },
  {
    key: 'sofia-ramirez',
    firstName: 'Sofia',
    lastName: 'Ramirez',
    role: 'sales_manager',
    title: 'Director of Sales',
    department: 'Sales',
    context: 'Sales approvals and portfolio',
  },
  {
    key: 'noah-bennett',
    firstName: 'Noah',
    lastName: 'Bennett',
    role: 'sales_representative',
    title: 'Account Executive',
    department: 'Sales',
    context: 'Customer/order workflow',
  },
  {
    key: 'priya-shah',
    firstName: 'Priya',
    lastName: 'Shah',
    role: 'finance_manager',
    title: 'Finance Manager',
    department: 'Finance',
    context: 'AR and credit',
  },
  {
    key: 'marcus-lee',
    firstName: 'Marcus',
    lastName: 'Lee',
    role: 'buyer',
    title: 'Senior Buyer',
    department: 'Procurement',
    context: 'Procurement',
  },
  {
    key: 'jordan-wells',
    firstName: 'Jordan',
    lastName: 'Wells',
    role: 'warehouse_operator',
    title: 'Warehouse Associate',
    department: 'Warehouse',
    context: 'Chicago warehouse',
    warehouseCodes: ['CHI-01'],
  },
  {
    key: 'aisha-grant',
    firstName: 'Aisha',
    lastName: 'Grant',
    role: 'support_agent',
    title: 'Customer Support Specialist',
    department: 'Support',
    context: 'Support inbox',
  },
  {
    key: 'owen-price',
    firstName: 'Owen',
    lastName: 'Price',
    role: 'auditor',
    title: 'Internal Auditor',
    department: 'Finance',
    context: 'Read-only/audit',
  },
];

export const DEFAULT_PERSONA_KEY = 'sofia-ramirez';

/**
 * A seeded user offered as a persona where section 55.6 leaves a role, or a
 * decision, to no persona. None of the nine holds `procurement_manager`, and
 * every purchase order that needs an approval waits on that role first
 * (section 65.5). Priya Shah is the one Finance Manager, and she is the one
 * who asks for a write-off above US$5,000 (section 66.5), which a requester
 * never decides (section 67.4): the finance controller is the Finance team's
 * other Finance Manager. No persona is an Accountant, whose write-off
 * authority stops at US$500: the staff accountant is the team's own. No
 * persona is a Support Manager, who receives an escalation by default and
 * alone reopens a ticket past the seven-day window or from closed (section
 * 68.5): the support lead is the Support team's own. A
 * stand-in is the team's active holder of the role, never one of the nine,
 * found after the users are seeded: it creates no user and draws nothing from
 * the seed's random sequence, so every other record keeps its identity.
 */
export interface StandInPersona {
  key: string;
  role: RoleKey;
  teamCode: string;
  context: string;
}

export const STAND_IN_PERSONAS: readonly StandInPersona[] = [
  {
    key: 'procurement-lead',
    role: 'procurement_manager',
    teamCode: 'PROC',
    context: 'Purchase-order approvals',
  },
  {
    key: 'finance-controller',
    role: 'finance_manager',
    teamCode: 'FIN',
    context: 'Write-off approvals',
  },
  {
    key: 'staff-accountant',
    role: 'accountant',
    teamCode: 'FIN',
    context: 'Receivables and reconciliation',
  },
  {
    key: 'support-lead',
    role: 'support_manager',
    teamCode: 'SUPPORT',
    context: 'Escalations and reopened tickets',
  },
];

/**
 * Section 69.3 — the automation actor (`usr_system_automation`) holds only the
 * permissions its supported actions use, in every scope: assigning a ticket or
 * an account, tagging a ticket or a customer, holding a customer or an order,
 * sending a confirmed order back for approval, and drafting a purchase order.
 * Notifications and tasks need none. It holds no role: no person can sign in
 * as it, and no role listing counts it.
 */
export const AUTOMATION_PERMISSIONS: readonly Permission[] = [
  'support.assign',
  'support.change_status',
  'customers.edit',
  'customers.credit_edit',
  'orders.edit_confirmed',
  'orders.hold',
  'purchase_orders.create',
];

/** Approval policy role names referenced by section 58.3, 59.4, 65.5, 66.5 and 62.2. */
export const APPROVER_ROLES = {
  salesManager: 'sales_manager',
  financeManager: 'finance_manager',
  procurementManager: 'procurement_manager',
  warehouseManager: 'warehouse_manager',
} as const;
