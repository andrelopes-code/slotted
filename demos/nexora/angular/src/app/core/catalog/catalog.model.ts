import type { Money, ProductStatus, SkuStatus, UnitOfMeasure } from '@slotted/demo-nexora-backend';

/** The words the module says for the states the catalogue stores (§89.9, §57). */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  discontinued: 'Discontinued',
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, 'secondary' | 'success' | 'warning'> = {
  draft: 'secondary',
  active: 'success',
  discontinued: 'warning',
};

export const SKU_STATUS_LABEL: Record<SkuStatus, string> = {
  active: 'Active',
  restricted: 'Restricted',
  discontinued: 'Discontinued',
};

export const SKU_STATUS_TONE: Record<SkuStatus, 'secondary' | 'success' | 'warning'> = {
  active: 'success',
  restricted: 'warning',
  discontinued: 'secondary',
};

/** The five units §53.8 allows, in the words an operator reads on a row. */
export const UNIT_LABEL: Record<string, string> = {
  EA: 'each',
  PK: 'pack',
  FT: 'foot',
  M: 'metre',
  KG: 'kilogram',
};

export const REORDER_MODE_LABEL: Record<string, string> = {
  min_max: 'Min/max',
  manual: 'Manual',
};

export const TAX_CLASS_LABEL: Record<string, string> = {
  standard: 'Standard',
  reduced: 'Reduced',
  exempt: 'Exempt',
};

/** The tags the catalogue seeds (§89.8); a product carries any number of them. */
export const PRODUCT_TAG_LABEL: Record<string, string> = {
  'best-seller': 'Best seller',
  clearance: 'Clearance',
  'long-lead': 'Long lead',
  'made-in-usa': 'Made in USA',
  new: 'New',
  oem: 'OEM',
};

export const MOVEMENT_LABEL: Record<string, string> = {
  receipt: 'Received',
  shipment: 'Shipped',
  customer_return: 'Customer return',
  supplier_return: 'Returned to supplier',
  transfer_out: 'Transferred out',
  transfer_in: 'Transferred in',
  adjustment_in: 'Adjusted up',
  adjustment_out: 'Adjusted down',
  damage: 'Damaged',
  damage_reversal: 'Damage reversed',
  quarantine: 'Quarantined',
  quarantine_release: 'Released from quarantine',
  cycle_count_adjustment: 'Cycle count',
};

/**
 * What the movement came from, in the words of the record that caused it.
 * Every `sourceEntityType` the backend writes has a word here: the commands
 * write `manual_adjustment` and the returns write `return`.
 */
export const MOVEMENT_SOURCE_LABEL: Record<string, string> = {
  shipment: 'Shipment',
  goods_receipt: 'Goods receipt',
  opening_balance: 'Opening balance',
  purchase_order: 'Purchase order',
  transfer: 'Transfer',
  cycle_count: 'Cycle count',
  adjustment: 'Adjustment',
  manual_adjustment: 'Manual adjustment',
  return: 'Customer return',
};

/** A source the table has no word for is named as a record, never by its raw type or id. */
export function movementSourceLabel(type: string): string {
  return MOVEMENT_SOURCE_LABEL[type] ?? 'Another record';
}

export const options = (labels: Record<string, string>): { value: string; label: string }[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * A money value in the currency of the thing being shown, never the tenant's:
 * a price list in BRL prints its own entries in BRL beside a USD list.
 */
export function formatMoney(money: Money, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
  }).format(money.minor / 100);
}

/**
 * A quantity as §53.8 stores it: a decimal string at the SKU's own precision.
 * The backend already trims the fraction, so the only work here is grouping
 * the integer part — a reformat through a number would turn "12" into
 * "12.000" on a three-digit unit and read as twelve thousand.
 */
export function formatQuantity(value: string, locale = 'en-US'): string {
  const negative = value.startsWith('-');
  const [whole = '0', fraction] = (negative ? value.slice(1) : value).split('.');
  const grouped = new Intl.NumberFormat(locale).format(Number(whole));
  return `${negative ? '-' : ''}${grouped}${fraction ? `.${fraction}` : ''}`;
}

/** A quantity with the unit it is counted in, which a bare number never says. */
export function formatQuantityWithUnit(value: string, unit: UnitOfMeasure | string): string {
  return `${formatQuantity(value)} ${unit}`;
}

export function quantityValue(value: string): number {
  return Number(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export const CATALOG_ROUTE = '/catalog';
export const PRODUCTS_ROUTE = '/catalog/products';
export const SKUS_ROUTE = '/catalog/skus';
export const CATEGORIES_ROUTE = '/catalog/categories';
export const PRICE_LISTS_ROUTE = '/catalog/price-lists';
