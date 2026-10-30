import type { EntityMetadata, Money, Quantity } from './common';

export type ShipmentStatus =
  | 'pending'
  | 'picking'
  | 'packed'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'exception'
  | 'returned'
  | 'cancelled';

export interface Shipment {
  id: string;
  organizationId: string;
  shipmentNumber: string;
  orderId: string;
  customerId: string;
  warehouseId: string;
  carrier: string;
  service: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  exceptionCode?: string;
  exceptionMessage?: string;
  metadata: EntityMetadata;
}

export interface ShipmentLine {
  id: string;
  organizationId: string;
  shipmentId: string;
  orderLineId: string;
  skuId: string;
  quantity: Quantity;
  reservationIds: string[];
  pickedQuantity: Quantity;
  packedQuantity: Quantity;
}

export type ReturnStatus =
  | 'requested'
  | 'authorized'
  | 'in_transit'
  | 'received'
  | 'inspected'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ReturnReason =
  | 'damaged'
  | 'wrong_item'
  | 'defective'
  | 'not_needed'
  | 'shipment_damage'
  | 'quality_issue'
  | 'other';

export type ReturnDisposition = 'restock' | 'quarantine' | 'scrap' | 'return_to_supplier';

export interface Return {
  id: string;
  organizationId: string;
  returnNumber: string;
  orderId: string;
  customerId: string;
  status: ReturnStatus;
  requestedAt: string;
  authorizedAt?: string;
  receivedAt?: string;
  inspectedAt?: string;
  completedAt?: string;
  receivingWarehouseId: string;
  creditMemoId?: string;
  notes?: string;
  metadata: EntityMetadata;
}

export interface ReturnLine {
  id: string;
  organizationId: string;
  returnId: string;
  orderLineId: string;
  shipmentLineId?: string;
  skuId: string;
  requestedQuantity: Quantity;
  receivedQuantity: Quantity;
  acceptedQuantity: Quantity;
  rejectedQuantity: Quantity;
  reason: ReturnReason;
  disposition?: ReturnDisposition;
  unitCreditAmount?: Money;
}
