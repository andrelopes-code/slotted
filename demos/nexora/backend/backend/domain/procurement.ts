import type { CurrencyCode, EntityMetadata, Money, Quantity } from './common';

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'acknowledged'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled';

export type PurchaseOrderExceptionFlag = 'delayed' | 'disputed';

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  buyerId: string;
  destinationWarehouseId: string;
  status: PurchaseOrderStatus;
  exceptionFlags: PurchaseOrderExceptionFlag[];
  createdBusinessDate: string;
  expectedDate: string;
  currency: CurrencyCode;
  fxRateToUsd?: string;
  subtotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  approvalRequestId?: string;
  sentAt?: string;
  supplierAcknowledgedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  notes?: string;
  metadata: EntityMetadata;
}

export interface PurchaseOrderLine {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  lineNumber: number;
  skuId: string;
  supplierSku: string;
  description: string;
  orderedQuantity: Quantity;
  receivedAcceptedQuantity: Quantity;
  receivedDamagedQuantity: Quantity;
  rejectedQuantity: Quantity;
  unitCost: Money;
  taxRateBps: number;
  lineTotal: Money;
  expectedDate: string;
}

export interface GoodsReceipt {
  id: string;
  organizationId: string;
  receiptNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  warehouseId: string;
  receivedBy: string;
  receivedAt: string;
  notes?: string;
  /** Section 65.7: why a line went past the 5% tolerance, kept with the receipt that did it. */
  overReceiptReason?: string;
  metadata: EntityMetadata;
}

export interface GoodsReceiptLine {
  id: string;
  organizationId: string;
  goodsReceiptId: string;
  purchaseOrderLineId: string;
  skuId: string;
  acceptedQuantity: Quantity;
  damagedQuantity: Quantity;
  rejectedQuantity: Quantity;
  unitCost: Money;
  locationId?: string;
  note?: string;
}
