import {
  documentTotals,
  priceLine,
  quantityFitsPrecision,
  taxRateBpsFor,
  fromUsd,
  money,
  type Customer,
  type DocumentTotals,
  type FieldError,
  type Money,
  type PricedLine,
  type Sku,
  validationFailed,
} from '../../domain';
import type { ApiRuntime } from '../runtime';

export interface LineInput {
  skuId: string;
  quantity: string;
  discountBps?: number;
  /** Explicit override; requires `orders.override_price`. */
  unitPriceMinor?: number;
  preferredWarehouseId?: string;
  promisedDate?: string;
}

export interface PricedLineInput extends LineInput {
  sku: Sku;
  priced: PricedLine;
  source: 'contract' | 'customer_list' | 'standard' | 'override';
}

/** Section 57.5 pricing priority at runtime. */
export function resolveListPrice(
  runtime: ApiRuntime,
  customer: Customer,
  sku: Sku,
  businessDate: string,
): { unitPrice: Money; source: 'contract' | 'customer_list' | 'standard' } | undefined {
  for (const contract of runtime.indexes.contractPricesByCustomer.get(customer.id)) {
    if (
      contract.skuId === sku.id &&
      contract.validFrom <= businessDate &&
      businessDate <= contract.validTo
    )
      return { unitPrice: contract.unitPrice, source: 'contract' };
  }
  const entries = runtime.indexes.priceEntriesBySku.get(sku.id);
  const customerEntry = entries.find(
    (entry) =>
      entry.priceListId === customer.priceListId &&
      entry.validFrom <= businessDate &&
      (!entry.validTo || entry.validTo >= businessDate),
  );
  if (customerEntry) return { unitPrice: customerEntry.unitPrice, source: 'customer_list' };
  const lists = [...runtime.store.dataset.priceLists.values()];
  const standardId =
    lists.find(
      (list) =>
        list.regionCode === customer.regionCode && list.currency === customer.preferredCurrency,
    )?.id ?? lists.find((list) => list.name === 'Standard')?.id;
  const standard = entries.find(
    (entry) => entry.priceListId === standardId && entry.validFrom <= businessDate,
  );
  if (standard) return { unitPrice: standard.unitPrice, source: 'standard' };
  return undefined;
}

/** Validates and prices commercial lines (sections 57.3, 57.7, 58.2). */
export function priceLines(
  runtime: ApiRuntime,
  customer: Customer,
  inputs: LineInput[],
  shippingRegion: string,
  businessDate: string,
  options: { allowOverride: boolean; historicalDiscontinuedOk?: boolean },
): { lines: PricedLineInput[]; totals: (freight: Money) => DocumentTotals } {
  const errors: FieldError[] = [];
  const lines: PricedLineInput[] = [];
  if (inputs.length === 0)
    errors.push({ field: 'lines', code: 'REQUIRED', message: 'At least one line is required' });
  for (const [index, input] of inputs.entries()) {
    const field = `lines[${index}]`;
    const sku = runtime.store.dataset.skus.get(input.skuId);
    if (!sku) {
      errors.push({
        field: `${field}.skuId`,
        code: 'NOT_FOUND',
        message: `SKU ${input.skuId} does not exist`,
      });
      continue;
    }
    if (sku.status === 'discontinued' && !options.historicalDiscontinuedOk)
      errors.push({
        field: `${field}.skuId`,
        code: 'SKU_DISCONTINUED',
        message: `${sku.sku} is discontinued and cannot be added`,
      });
    if (sku.status === 'restricted')
      errors.push({
        field: `${field}.skuId`,
        code: 'SKU_RESTRICTED',
        message: `${sku.sku} is restricted and cannot be added to a commercial transaction`,
      });
    if (!quantityFitsPrecision(input.quantity, sku.quantityPrecision))
      errors.push({
        field: `${field}.quantity`,
        code: 'QUANTITY_PRECISION_EXCEEDED',
        message: `${sku.sku} allows ${sku.quantityPrecision} decimal places`,
      });
    else if (Number(input.quantity) <= 0)
      errors.push({
        field: `${field}.quantity`,
        code: 'INVALID_VALUE',
        message: 'quantity must be positive',
      });
    const discountBps = input.discountBps ?? 0;
    if (!Number.isInteger(discountBps) || discountBps < 0 || discountBps > 10_000)
      errors.push({
        field: `${field}.discountBps`,
        code: 'INVALID_VALUE',
        message: 'discountBps must be between 0 and 10000',
      });
    let listUnitPrice: Money | undefined;
    let source: PricedLineInput['source'] = 'standard';
    if (input.unitPriceMinor !== undefined) {
      if (!options.allowOverride)
        errors.push({
          field: `${field}.unitPriceMinor`,
          code: 'FORBIDDEN',
          message: 'Price override requires orders.override_price',
        });
      listUnitPrice = money(input.unitPriceMinor, customer.preferredCurrency);
      source = 'override';
    } else {
      const resolved = resolveListPrice(runtime, customer, sku, businessDate);
      if (!resolved)
        errors.push({
          field: `${field}.skuId`,
          code: 'PRICE_NOT_FOUND',
          message: `No price is available for ${sku.sku}`,
        });
      else {
        listUnitPrice = resolved.unitPrice;
        source = resolved.source;
      }
    }
    if (!listUnitPrice) continue;
    const priced = priceLine({
      quantity: input.quantity,
      listUnitPrice,
      discountBps,
      taxRateBps: taxRateBpsFor(
        shippingRegion,
        customer.taxProfile,
        sku.taxClass,
        customer.regionCode,
      ),
      unitCost: fromUsd(sku.standardCost, customer.preferredCurrency),
    });
    if (priced.netAmount.minor < 0)
      errors.push({
        field: `${field}.discountBps`,
        code: 'NEGATIVE_NET',
        message: 'Line net value cannot be negative',
      });
    lines.push({ ...input, sku, priced, source });
  }
  if (errors.length > 0) throw validationFailed(errors, 'Lines are invalid');
  return {
    lines,
    totals: (freight: Money) =>
      documentTotals(
        lines.map((line) => line.priced),
        freight,
        customer.preferredCurrency,
      ),
  };
}
