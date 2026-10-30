import type {
  ActivityEvent,
  Address,
  ApprovalRequest,
  AuditEvent,
  BankTransaction,
  Category,
  Contact,
  ContractPrice,
  CreditMemo,
  CreditMemoApplication,
  CreditMemoLine,
  Customer,
  CustomerNote,
  CycleCount,
  CycleCountLine,
  GoodsReceipt,
  GoodsReceiptLine,
  ImportJob,
  InventoryReservation,
  InventoryTransfer,
  InventoryTransferLine,
  Invoice,
  InvoiceLine,
  Notification,
  Organization,
  Payment,
  PaymentAllocation,
  PriceList,
  PriceListEntry,
  Product,
  PurchaseOrder,
  PurchaseOrderLine,
  Quote,
  QuoteLine,
  Refund,
  Return,
  ReturnLine,
  Role,
  RoleAssignment,
  SalesOrder,
  SalesOrderLine,
  SavedView,
  Shipment,
  ShipmentLine,
  Sku,
  SlaEvent,
  StockMovement,
  Supplier,
  SupplierSkuMapping,
  SupportMacro,
  SupportTicket,
  Task,
  Team,
  TeamMembership,
  User,
  Warehouse,
  WarehouseLocation,
  Workflow,
  WorkflowRun,
  ConversationMessage,
} from '../domain';

/**
 * Materialized dataset. Every collection is keyed by id; child collections are
 * also indexed by their parent id so aggregate reads stay O(children).
 */
export interface Dataset {
  organization: Organization;
  users: Map<string, User>;
  teams: Map<string, Team>;
  teamMemberships: TeamMembership[];
  roles: Map<string, Role>;
  roleAssignments: Map<string, RoleAssignment>;
  warehouses: Map<string, Warehouse>;
  warehouseLocations: Map<string, WarehouseLocation>;
  priceLists: Map<string, PriceList>;
  priceListEntries: Map<string, PriceListEntry>;
  categories: Map<string, Category>;
  products: Map<string, Product>;
  skus: Map<string, Sku>;
  suppliers: Map<string, Supplier>;
  supplierSkuMappings: Map<string, SupplierSkuMapping>;
  customers: Map<string, Customer>;
  contacts: Map<string, Contact>;
  addresses: Map<string, Address>;
  customerNotes: Map<string, CustomerNote>;
  contractPrices: Map<string, ContractPrice>;
  quotes: Map<string, Quote>;
  quoteLines: Map<string, QuoteLine>;
  salesOrders: Map<string, SalesOrder>;
  salesOrderLines: Map<string, SalesOrderLine>;
  approvalRequests: Map<string, ApprovalRequest>;
  reservations: Map<string, InventoryReservation>;
  stockMovements: Map<string, StockMovement>;
  transfers: Map<string, InventoryTransfer>;
  transferLines: Map<string, InventoryTransferLine>;
  cycleCounts: Map<string, CycleCount>;
  cycleCountLines: Map<string, CycleCountLine>;
  shipments: Map<string, Shipment>;
  shipmentLines: Map<string, ShipmentLine>;
  returns: Map<string, Return>;
  returnLines: Map<string, ReturnLine>;
  purchaseOrders: Map<string, PurchaseOrder>;
  purchaseOrderLines: Map<string, PurchaseOrderLine>;
  goodsReceipts: Map<string, GoodsReceipt>;
  goodsReceiptLines: Map<string, GoodsReceiptLine>;
  invoices: Map<string, Invoice>;
  invoiceLines: Map<string, InvoiceLine>;
  payments: Map<string, Payment>;
  paymentAllocations: Map<string, PaymentAllocation>;
  creditMemos: Map<string, CreditMemo>;
  creditMemoLines: Map<string, CreditMemoLine>;
  creditMemoApplications: Map<string, CreditMemoApplication>;
  refunds: Map<string, Refund>;
  bankTransactions: Map<string, BankTransaction>;
  tickets: Map<string, SupportTicket>;
  conversationMessages: Map<string, ConversationMessage>;
  slaEvents: Map<string, SlaEvent>;
  supportMacros: Map<string, SupportMacro>;
  workflows: Map<string, Workflow>;
  workflowRuns: Map<string, WorkflowRun>;
  activityEvents: Map<string, ActivityEvent>;
  auditEvents: Map<string, AuditEvent>;
  notifications: Map<string, Notification>;
  tasks: Map<string, Task>;
  savedViews: Map<string, SavedView>;
  importJobs: Map<string, ImportJob>;
  /** Developer-facing fixture keys (section 82) → entity id. */
  fixtures: Map<string, string>;
}

export type DatasetCollection = {
  [K in keyof Dataset]: Dataset[K] extends Map<string, infer V> ? V : never;
};

export type CollectionName = {
  [K in keyof Dataset]: Dataset[K] extends Map<string, unknown> ? K : never;
}[keyof Dataset];

export function createEmptyDataset(organization: Organization): Dataset {
  return {
    organization,
    users: new Map(),
    teams: new Map(),
    teamMemberships: [],
    roles: new Map(),
    roleAssignments: new Map(),
    warehouses: new Map(),
    warehouseLocations: new Map(),
    priceLists: new Map(),
    priceListEntries: new Map(),
    categories: new Map(),
    products: new Map(),
    skus: new Map(),
    suppliers: new Map(),
    supplierSkuMappings: new Map(),
    customers: new Map(),
    contacts: new Map(),
    addresses: new Map(),
    customerNotes: new Map(),
    contractPrices: new Map(),
    quotes: new Map(),
    quoteLines: new Map(),
    salesOrders: new Map(),
    salesOrderLines: new Map(),
    approvalRequests: new Map(),
    reservations: new Map(),
    stockMovements: new Map(),
    transfers: new Map(),
    transferLines: new Map(),
    cycleCounts: new Map(),
    cycleCountLines: new Map(),
    shipments: new Map(),
    shipmentLines: new Map(),
    returns: new Map(),
    returnLines: new Map(),
    purchaseOrders: new Map(),
    purchaseOrderLines: new Map(),
    goodsReceipts: new Map(),
    goodsReceiptLines: new Map(),
    invoices: new Map(),
    invoiceLines: new Map(),
    payments: new Map(),
    paymentAllocations: new Map(),
    creditMemos: new Map(),
    creditMemoLines: new Map(),
    creditMemoApplications: new Map(),
    refunds: new Map(),
    bankTransactions: new Map(),
    tickets: new Map(),
    conversationMessages: new Map(),
    slaEvents: new Map(),
    supportMacros: new Map(),
    workflows: new Map(),
    workflowRuns: new Map(),
    activityEvents: new Map(),
    auditEvents: new Map(),
    notifications: new Map(),
    tasks: new Map(),
    savedViews: new Map(),
    importJobs: new Map(),
    fixtures: new Map(),
  };
}

/** Secondary indexes rebuilt on demand by the store; kept separate from the dataset. */
export interface ChildIndex<T> {
  byParent: Map<string, T[]>;
}

export function indexBy<T>(
  values: Iterable<T>,
  key: (value: T) => string | undefined,
): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const value of values) {
    const parent = key(value);
    if (parent === undefined) continue;
    const bucket = index.get(parent);
    if (bucket) bucket.push(value);
    else index.set(parent, [value]);
  }
  return index;
}
