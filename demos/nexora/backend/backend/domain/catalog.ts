import type {
  CurrencyCode,
  EntityMetadata,
  Money,
  PaymentTermsCode,
  Quantity,
  QuantityPrecision,
  RegionCode,
  UnitOfMeasure,
} from './common';

export interface Category {
  id: string;
  organizationId: string;
  parentId?: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  metadata: EntityMetadata;
}

export type ProductStatus = 'draft' | 'active' | 'discontinued';

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  categoryId: string;
  brand?: string;
  manufacturer?: string;
  status: ProductStatus;
  tags: string[];
  metadata: EntityMetadata;
}

export type SkuStatus = 'active' | 'restricted' | 'discontinued';
export type TaxClass = 'standard' | 'reduced' | 'exempt';

export interface ReorderPolicy {
  mode: 'min_max' | 'manual';
  reorderPoint?: Quantity;
  safetyStock?: Quantity;
  maxStock?: Quantity;
}

export interface Sku {
  id: string;
  organizationId: string;
  productId: string;
  sku: string;
  name: string;
  manufacturerPartNumber?: string;
  variantLabel?: string;
  status: SkuStatus;
  unitOfMeasure: UnitOfMeasure;
  quantityPrecision: QuantityPrecision;
  barcode?: string;
  weightGrams?: number;
  dimensionsMm?: { length: number; width: number; height: number };
  taxClass: TaxClass;
  standardCost: Money;
  leadTimeDays: number;
  reorderPolicy: ReorderPolicy;
  preferredSupplierId?: string;
  categoryId: string;
  metadata: EntityMetadata;
}

export interface PriceList {
  id: string;
  organizationId: string;
  regionCode: RegionCode;
  name: string;
  currency: CurrencyCode;
  status: 'active' | 'inactive';
  metadata: EntityMetadata;
}

export interface PriceListEntry {
  id: string;
  organizationId: string;
  priceListId: string;
  skuId: string;
  unitPrice: Money;
  validFrom: string;
  validTo?: string;
}

export interface ContractPrice {
  id: string;
  organizationId: string;
  customerId: string;
  skuId: string;
  currency: CurrencyCode;
  unitPrice: Money;
  minimumQuantity?: Quantity;
  validFrom: string;
  validTo: string;
  metadata: EntityMetadata;
}

export type SupplierStatus = 'active' | 'on_hold' | 'inactive';
export type SupplierTier = 'standard' | 'preferred' | 'conditional';

export interface Supplier {
  id: string;
  organizationId: string;
  supplierNumber: string;
  regionCode: RegionCode;
  legalName: string;
  displayName: string;
  status: SupplierStatus;
  relationshipTier: SupplierTier;
  category: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  paymentTermsCode: PaymentTermsCode;
  supportedCurrencies: CurrencyCode[];
  preferredShippingTerms?: string;
  tags: string[];
  metadata: EntityMetadata;
}

/** Section 89.12 — projection, never a writable Supplier field. */
export interface SupplierPerformance {
  supplierId: string;
  onTimeDeliveryBps: number;
  /** Section 72.10's counts: lines received in full, and those of them satisfied by their date. */
  completedLines: number;
  onTimeLines: number;
  qualityScore: number;
  defectRateBps: number;
  averageLeadTimeDays: number;
  openPurchaseOrderCount: number;
  annualSpendUsd: Money;
  projectedAt: string;
}

export interface SupplierSkuMapping {
  id: string;
  organizationId: string;
  supplierId: string;
  skuId: string;
  supplierSku: string;
  unitCost: Money;
  minimumOrderQuantity: Quantity;
  packMultiple: Quantity;
  leadTimeDays: number;
  currency: CurrencyCode;
  status: 'active' | 'inactive';
  isPreferred: boolean;
}
