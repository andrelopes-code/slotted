import type {
  AddressSnapshot,
  EntityMetadata,
  Quantity,
  RegionCode,
  SignedQuantity,
} from './common';

export type WarehouseStatus = 'operational' | 'restricted' | 'closed';

export interface Warehouse {
  id: string;
  organizationId: string;
  regionCode: RegionCode;
  code: string;
  name: string;
  address: AddressSnapshot;
  managerId: string;
  timezone: string;
  capacityCubicMeters: number;
  status: WarehouseStatus;
  metadata: EntityMetadata;
}

export type LocationType = 'storage' | 'receiving' | 'staging' | 'quarantine' | 'damaged';

export interface WarehouseLocation {
  id: string;
  organizationId: string;
  warehouseId: string;
  code: string;
  zone: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  type: LocationType;
  capacityCubicMeters?: number;
  status: 'active' | 'blocked';
  metadata: EntityMetadata;
}

export interface InventoryBalance {
  organizationId: string;
  skuId: string;
  warehouseId: string;
  locationId?: string;
  onHand: Quantity;
  damaged: Quantity;
  quarantine: Quantity;
  reserved: Quantity;
  available: Quantity;
  inbound: Quantity;
  safetyStock: Quantity;
  reorderPoint: Quantity;
  projectedAt: string;
}

export type StockMovementType =
  | 'receipt'
  | 'shipment'
  | 'customer_return'
  | 'supplier_return'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'damage'
  | 'damage_reversal'
  | 'quarantine'
  | 'quarantine_release'
  | 'cycle_count_adjustment';

export interface StockMovement {
  id: string;
  organizationId: string;
  type: StockMovementType;
  skuId: string;
  warehouseId: string;
  locationId?: string;
  onHandDelta: SignedQuantity;
  damagedDelta: SignedQuantity;
  quarantineDelta: SignedQuantity;
  sourceEntityType: string;
  sourceEntityId: string;
  reason?: string;
  occurredAt: string;
  actorId: string;
}

export type ReservationStatus = 'active' | 'consumed' | 'released' | 'cancelled';

export interface InventoryReservation {
  id: string;
  organizationId: string;
  orderId: string;
  orderLineId: string;
  skuId: string;
  warehouseId: string;
  locationId?: string;
  quantity: Quantity;
  consumedQuantity: Quantity;
  status: ReservationStatus;
  createdAt: string;
}

export type TransferStatus =
  'draft' | 'ready' | 'in_transit' | 'partially_received' | 'received' | 'cancelled';

export interface InventoryTransfer {
  id: string;
  organizationId: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: TransferStatus;
  requestedBy: string;
  requestedDate: string;
  shippedAt?: string;
  receivedAt?: string;
  notes?: string;
  metadata: EntityMetadata;
}

export interface InventoryTransferLine {
  id: string;
  organizationId: string;
  transferId: string;
  lineNumber: number;
  skuId: string;
  requestedQuantity: Quantity;
  shippedQuantity: Quantity;
  receivedQuantity: Quantity;
  damagedQuantity: Quantity;
  sourceLocationId?: string;
  destinationLocationId?: string;
}

export type CycleCountStatus = 'planned' | 'in_progress' | 'submitted' | 'completed' | 'cancelled';

export interface CycleCount {
  id: string;
  organizationId: string;
  cycleCountNumber: string;
  warehouseId: string;
  status: CycleCountStatus;
  assignedToIds: string[];
  plannedDate: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  approvalRequestId?: string;
  metadata: EntityMetadata;
}

export interface CycleCountLine {
  id: string;
  organizationId: string;
  cycleCountId: string;
  skuId: string;
  locationId: string;
  systemOnHand: Quantity;
  countedOnHand?: Quantity;
  variance?: SignedQuantity;
  note?: string;
}

export type AdjustmentReasonCode =
  'count_correction' | 'damage' | 'found_stock' | 'data_correction' | 'other';
