import {
  notFound,
  quantityToMilli,
  type Category,
  type PriceList,
  type PriceListEntry,
  type Product,
  type Sku,
  type SupplierSkuMapping,
} from '../../domain';
import type { InventoryPosition } from '../projections';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

export interface ProductListItem extends Product {
  categoryName: string;
  categoryPath: string[];
  skuCount: number;
  activeSkuCount: number;
}

export interface SkuListItem extends Sku {
  productName: string;
  categoryName: string;
  brand?: string;
  listPrice?: { currency: 'USD'; minor: number };
  /** Aggregated across warehouses. */
  onHand: string;
  available: string;
  reserved: string;
  inbound: string;
  backordered: boolean;
  belowReorderPoint: boolean;
  preferredSupplierName?: string;
}

export interface SkuDetail {
  sku: SkuListItem;
  product: Product;
  category: Category;
  categoryPath: Category[];
  priceEntries: (PriceListEntry & { priceListName: string })[];
  supplierMappings: (SupplierSkuMapping & { supplierName: string; supplierStatus: string })[];
  inventory: InventoryPosition[];
  reorderSuggestions: InventoryPosition[];
  recentMovements: {
    id: string;
    type: string;
    warehouseId: string;
    onHandDelta: string;
    damagedDelta: string;
    quarantineDelta: string;
    occurredAt: string;
    sourceEntityType: string;
    sourceEntityId: string;
    reason?: string;
  }[];
}

export interface ProductDetail {
  product: ProductListItem;
  skus: SkuListItem[];
  category: Category;
  categoryPath: Category[];
}

export function categoryPath(runtime: ApiRuntime, categoryId: string): Category[] {
  const path: Category[] = [];
  let current = runtime.store.dataset.categories.get(categoryId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? runtime.store.dataset.categories.get(current.parentId) : undefined;
  }
  return path;
}

interface InventoryAggregate {
  onHand: number;
  available: number;
  reserved: number;
  inbound: number;
  backordered: number;
  belowReorderPoint: boolean;
}

const EMPTY_AGGREGATE: InventoryAggregate = {
  onHand: 0,
  available: 0,
  reserved: 0,
  inbound: 0,
  backordered: 0,
  belowReorderPoint: false,
};

/** One pass over the inventory projection; reused across a whole list call. */
export function aggregateInventoryBySku(runtime: ApiRuntime): Map<string, InventoryAggregate> {
  const map = new Map<string, InventoryAggregate>();
  for (const position of runtime.projections.inventory().values()) {
    let entry = map.get(position.skuId);
    if (!entry) {
      entry = { ...EMPTY_AGGREGATE };
      map.set(position.skuId, entry);
    }
    entry.onHand += quantityToMilli(position.onHand);
    entry.available += quantityToMilli(position.available);
    entry.reserved += quantityToMilli(position.reserved);
    entry.inbound += quantityToMilli(position.inbound);
    entry.backordered += quantityToMilli(position.backordered);
    entry.belowReorderPoint = entry.belowReorderPoint || position.belowReorderPoint;
  }
  return map;
}

function aggregateInventory(
  runtime: ApiRuntime,
  skuId: string,
  aggregates?: Map<string, InventoryAggregate>,
): InventoryAggregate {
  if (aggregates) return aggregates.get(skuId) ?? EMPTY_AGGREGATE;
  const entry: InventoryAggregate = { ...EMPTY_AGGREGATE };
  for (const position of runtime.projections.inventoryForSku(skuId)) {
    entry.onHand += quantityToMilli(position.onHand);
    entry.available += quantityToMilli(position.available);
    entry.reserved += quantityToMilli(position.reserved);
    entry.inbound += quantityToMilli(position.inbound);
    entry.backordered += quantityToMilli(position.backordered);
    entry.belowReorderPoint = entry.belowReorderPoint || position.belowReorderPoint;
  }
  return entry;
}

function quantityString(milli: number, precision: Sku['quantityPrecision']): string {
  const negative = milli < 0;
  const absolute = Math.abs(milli);
  const whole = Math.floor(absolute / 1000);
  const fraction = String(absolute % 1000)
    .padStart(3, '0')
    .slice(0, precision)
    .replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function skuListItem(
  runtime: ApiRuntime,
  sku: Sku,
  context?: { aggregates: Map<string, InventoryAggregate>; standardListId: string | undefined },
): SkuListItem {
  const { dataset } = runtime.store;
  const product = dataset.products.get(sku.productId);
  const category = dataset.categories.get(sku.categoryId);
  const standardListId = context
    ? context.standardListId
    : [...dataset.priceLists.values()].find((list) => list.name === 'Standard')?.id;
  const entry = runtime.indexes.priceEntriesBySku
    .get(sku.id)
    .find((candidate) => candidate.priceListId === standardListId);
  const supplier = sku.preferredSupplierId
    ? dataset.suppliers.get(sku.preferredSupplierId)
    : undefined;
  const inventory = aggregateInventory(runtime, sku.id, context?.aggregates);
  return {
    ...sku,
    productName: product?.name ?? sku.name,
    categoryName: category?.name ?? '',
    onHand: quantityString(inventory.onHand, sku.quantityPrecision),
    available: quantityString(inventory.available, sku.quantityPrecision),
    reserved: quantityString(inventory.reserved, sku.quantityPrecision),
    inbound: quantityString(inventory.inbound, sku.quantityPrecision),
    backordered: inventory.backordered > 0,
    belowReorderPoint: inventory.belowReorderPoint,
    ...(product?.brand ? { brand: product.brand } : {}),
    ...(entry ? { listPrice: { currency: 'USD' as const, minor: entry.unitPrice.minor } } : {}),
    ...(supplier ? { preferredSupplierName: supplier.displayName } : {}),
  };
}

export const skuResource: ResourceDefinition<SkuListItem> = {
  fields: fields<SkuListItem>({
    id: ['string', (item) => item.id],
    sku: ['string', (item) => item.sku],
    name: ['string', (item) => item.name],
    productId: ['string', (item) => item.productId],
    productName: ['string', (item) => item.productName],
    categoryId: ['string', (item) => item.categoryId],
    categoryName: ['string', (item) => item.categoryName],
    brand: ['string', (item) => item.brand],
    status: ['enum', (item) => item.status],
    unitOfMeasure: ['enum', (item) => item.unitOfMeasure],
    taxClass: ['enum', (item) => item.taxClass],
    standardCost: ['money', (item) => item.standardCost],
    listPrice: ['money', (item) => item.listPrice],
    leadTimeDays: ['number', (item) => item.leadTimeDays],
    preferredSupplierId: ['string', (item) => item.preferredSupplierId],
    onHand: ['quantity', (item) => item.onHand],
    available: ['quantity', (item) => item.available],
    reserved: ['quantity', (item) => item.reserved],
    inbound: ['quantity', (item) => item.inbound],
    backordered: ['boolean', (item) => item.backordered],
    belowReorderPoint: ['boolean', (item) => item.belowReorderPoint],
    reorderMode: ['enum', (item) => item.reorderPolicy.mode],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [
    item.sku,
    item.name,
    item.manufacturerPartNumber,
    item.productName,
    item.brand,
    item.barcode,
  ],
  defaultSort: 'sku',
};

export const productResource: ResourceDefinition<ProductListItem> = {
  fields: fields<ProductListItem>({
    id: ['string', (item) => item.id],
    name: ['string', (item) => item.name],
    brand: ['string', (item) => item.brand],
    status: ['enum', (item) => item.status],
    categoryId: ['string', (item) => item.categoryId],
    categoryName: ['string', (item) => item.categoryName],
    skuCount: ['number', (item) => item.skuCount],
    activeSkuCount: ['number', (item) => item.activeSkuCount],
    tags: ['array', (item) => item.tags],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.name, item.brand, item.manufacturer, item.categoryName],
  defaultSort: 'name',
};

export function productListItem(runtime: ApiRuntime, product: Product): ProductListItem {
  const skus = runtime.indexes.skusByProduct.get(product.id);
  const path = categoryPath(runtime, product.categoryId);
  return {
    ...product,
    categoryName: path[path.length - 1]?.name ?? '',
    categoryPath: path.map((category) => category.name),
    skuCount: skus.length,
    activeSkuCount: skus.filter((sku) => sku.status === 'active').length,
  };
}

export function listProducts(runtime: ApiRuntime, query: ListQuery): ListResponse<ProductListItem> {
  runtime.require('catalog.view');
  const items: ProductListItem[] = [];
  for (const product of runtime.store.dataset.products.values())
    items.push(productListItem(runtime, product));
  return runListQuery(items, productResource, query);
}

export function getProduct(runtime: ApiRuntime, id: string): ProductDetail {
  runtime.require('catalog.view');
  const product = runtime.store.dataset.products.get(id);
  if (!product) throw notFound('Product', id);
  const path = categoryPath(runtime, product.categoryId);
  return {
    product: productListItem(runtime, product),
    skus: runtime.indexes.skusByProduct.get(id).map((sku) => skuListItem(runtime, sku)),
    category: path[path.length - 1] as Category,
    categoryPath: path,
  };
}

export function listSkus(runtime: ApiRuntime, query: ListQuery): ListResponse<SkuListItem> {
  runtime.require('catalog.view');
  const context = {
    aggregates: aggregateInventoryBySku(runtime),
    standardListId: [...runtime.store.dataset.priceLists.values()].find(
      (list) => list.name === 'Standard',
    )?.id,
  };
  const items: SkuListItem[] = [];
  for (const sku of runtime.store.dataset.skus.values())
    items.push(skuListItem(runtime, sku, context));
  return runListQuery(items, skuResource, query);
}

export function getSku(runtime: ApiRuntime, id: string): SkuDetail {
  runtime.require('catalog.view');
  const { dataset } = runtime.store;
  const sku = dataset.skus.get(id);
  if (!sku) throw notFound('SKU', id);
  const product = dataset.products.get(sku.productId);
  if (!product) throw notFound('Product', sku.productId);
  const path = categoryPath(runtime, sku.categoryId);
  const canSeePricing = runtime.can('pricing.view');
  const canSeeCost = runtime.can('cost.view');
  const item = skuListItem(runtime, sku);
  if (!canSeeCost) item.standardCost = { currency: 'USD', minor: 0 };
  return {
    sku: item,
    product,
    category: path[path.length - 1] as Category,
    categoryPath: path,
    priceEntries: canSeePricing
      ? runtime.indexes.priceEntriesBySku.get(id).map((entry) => ({
          ...entry,
          priceListName: dataset.priceLists.get(entry.priceListId)?.name ?? entry.priceListId,
        }))
      : [],
    supplierMappings: runtime.indexes.mappingsBySku.get(id).map((mapping) => {
      const supplier = dataset.suppliers.get(mapping.supplierId);
      return {
        ...mapping,
        supplierName: supplier?.displayName ?? mapping.supplierId,
        supplierStatus: supplier?.status ?? 'inactive',
        ...(canSeeCost ? {} : { unitCost: { currency: 'USD' as const, minor: 0 } }),
      };
    }),
    inventory: runtime.projections.inventoryForSku(id),
    reorderSuggestions: runtime.projections.reorderSuggestions(sku),
    recentMovements: runtime.indexes.movementsBySku
      .get(id)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 25)
      .map((movement) => ({
        id: movement.id,
        type: movement.type,
        warehouseId: movement.warehouseId,
        onHandDelta: movement.onHandDelta,
        damagedDelta: movement.damagedDelta,
        quarantineDelta: movement.quarantineDelta,
        occurredAt: movement.occurredAt,
        sourceEntityType: movement.sourceEntityType,
        sourceEntityId: movement.sourceEntityId,
        ...(movement.reason ? { reason: movement.reason } : {}),
      })),
  };
}

export function listPriceLists(runtime: ApiRuntime): (PriceList & { entryCount: number })[] {
  runtime.require('pricing.view');
  return [...runtime.store.dataset.priceLists.values()].map((list) => ({
    ...list,
    entryCount: runtime.indexes.priceEntriesByList.get(list.id).length,
  }));
}

export function listCategories(
  runtime: ApiRuntime,
): (Category & { depth: number; productCount: number })[] {
  runtime.require('catalog.view');
  const counts = new Map<string, number>();
  for (const product of runtime.store.dataset.products.values())
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  return [...runtime.store.dataset.categories.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      ...category,
      depth: categoryPath(runtime, category.id).length,
      productCount: counts.get(category.id) ?? 0,
    }));
}
