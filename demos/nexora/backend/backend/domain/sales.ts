import type {
  AddressSnapshot,
  CurrencyCode,
  EntityMetadata,
  Money,
  OrderRiskFlag,
  PaymentTermsCode,
  Quantity,
} from './common';

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'cancelled';

export interface Quote {
  id: string;
  organizationId: string;
  quoteNumber: string;
  customerId: string;
  contactId: string;
  ownerId: string;
  createdBusinessDate: string;
  expirationDate: string;
  currency: CurrencyCode;
  fxRateToUsd?: string;
  priceListId: string;
  status: QuoteStatus;
  approvalRequestId?: string;
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  costTotal: Money;
  grossMargin: Money;
  grossMarginBps: number;
  notes?: string;
  terms?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  convertedOrderId?: string;
  metadata: EntityMetadata;
}

export interface QuoteLine {
  id: string;
  organizationId: string;
  quoteId: string;
  lineNumber: number;
  skuId: string;
  skuCode: string;
  description: string;
  unitOfMeasure: string;
  quantity: Quantity;
  listUnitPrice: Money;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  unitCost: Money;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
}

export type OrderStatus =
  'draft' | 'pending_approval' | 'confirmed' | 'on_hold' | 'cancelled' | 'closed';

export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type AllocationStatus = 'unallocated' | 'partially_allocated' | 'allocated';
export type FulfillmentStatus =
  'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'partially_returned' | 'returned';
export type InvoiceStatusOfOrder = 'not_invoiced' | 'partially_invoiced' | 'invoiced';
export type PaymentStatusOfOrder =
  | 'not_invoiced'
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'partially_refunded'
  | 'refunded';

export interface SalesOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerId: string;
  sourceQuoteId?: string;
  customerPoNumber?: string;
  contactId: string;
  ownerId: string;
  salesTeamId: string;
  orderDate: string;
  requestedDeliveryDate?: string;
  defaultWarehouseId: string;
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
  currency: CurrencyCode;
  fxRateToUsd: string;
  paymentTermsCode: PaymentTermsCode;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  approvalRequestId?: string;
  holdReason?: string;
  riskFlags: OrderRiskFlag[];
  /** Derived dimensions (section 59.1); recalculated after every mutation. */
  allocationStatus: AllocationStatus;
  fulfillmentStatus: FulfillmentStatus;
  invoiceStatus: InvoiceStatusOfOrder;
  paymentStatus: PaymentStatusOfOrder;
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  costTotal: Money;
  grossMargin: Money;
  grossMarginBps: number;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  closedAt?: string;
  notes?: string;
  metadata: EntityMetadata;
}

export interface SalesOrderLine {
  id: string;
  organizationId: string;
  orderId: string;
  lineNumber: number;
  skuId: string;
  skuCode: string;
  description: string;
  unitOfMeasure: string;
  orderedQuantity: Quantity;
  cancelledQuantity: Quantity;
  /** projection */
  reservedQuantity: Quantity;
  /** projection */
  fulfilledQuantity: Quantity;
  /** projection */
  returnedQuantity: Quantity;
  /** projection */
  invoicedQuantity: Quantity;
  listUnitPrice: Money;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  unitCost: Money;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
  preferredWarehouseId: string;
  promisedDate?: string;
}

export type ApprovalTargetType =
  'quote' | 'sales_order' | 'purchase_order' | 'invoice_write_off' | 'cycle_count';

export type ApprovalRequestStatus =
  'pending' | 'approved' | 'rejected' | 'changes_requested' | 'cancelled';

export interface ApprovalStep {
  id: string;
  sequence: number;
  requiredRole: string;
  assignedUserId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decidedBy?: string;
  decidedAt?: string;
  comment?: string;
}

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  targetType: ApprovalTargetType;
  targetId: string;
  /** Human-readable target reference (order number, quote number, ...). */
  targetNumber: string;
  policyCode: string;
  reasons: string[];
  status: ApprovalRequestStatus;
  requestedBy: string;
  requestedAt: string;
  decidedAt?: string;
  amount?: Money;
  steps: ApprovalStep[];
  metadata: EntityMetadata;
}
