import type { Address, AddressSnapshot, Customer, Money, RegionCode, Sku } from '../../domain';
import { taxRateBpsFor } from '../../domain';
import type { Dataset } from '../dataset';
import type { CatalogSeedResult } from './catalog';

export interface PriceResolution {
  listUnitPrice: Money;
  source: 'contract' | 'customer_list' | 'standard';
}

/**
 * Section 57.5 pricing priority: active contract price, then the customer's
 * default price list, then the Standard list.
 */
export class PricingResolver {
  private readonly contractByCustomerSku = new Map<
    string,
    { unitPrice: Money; validFrom: string; validTo: string }[]
  >();
  private readonly customersWithContracts = new Set<string>();

  constructor(
    private readonly dataset: Dataset,
    private readonly catalog: CatalogSeedResult,
    private readonly standardListIds: Record<RegionCode, string | undefined>,
  ) {
    for (const price of dataset.contractPrices.values()) {
      const key = `${price.customerId}\u0000${price.skuId}`;
      const bucket = this.contractByCustomerSku.get(key) ?? [];
      bucket.push({
        unitPrice: price.unitPrice,
        validFrom: price.validFrom,
        validTo: price.validTo,
      });
      this.contractByCustomerSku.set(key, bucket);
      this.customersWithContracts.add(price.customerId);
    }
  }

  /** Registers a contract price created after construction. */
  addContractPrice(
    customerId: string,
    skuId: string,
    unitPrice: Money,
    validFrom: string,
    validTo: string,
  ): void {
    const key = `${customerId}\u0000${skuId}`;
    const bucket = this.contractByCustomerSku.get(key) ?? [];
    bucket.push({ unitPrice, validFrom, validTo });
    this.contractByCustomerSku.set(key, bucket);
    this.customersWithContracts.add(customerId);
  }

  resolve(customer: Customer, sku: Sku, businessDate: string): PriceResolution | undefined {
    const contracts = this.customersWithContracts.has(customer.id)
      ? this.contractByCustomerSku.get(`${customer.id}\u0000${sku.id}`)
      : undefined;
    if (contracts) {
      for (const contract of contracts) {
        if (contract.validFrom <= businessDate && businessDate <= contract.validTo) {
          return { listUnitPrice: contract.unitPrice, source: 'contract' };
        }
      }
    }
    const customerEntry = this.catalog.entriesByList.get(customer.priceListId)?.get(sku.id);
    if (customerEntry && customerEntry.validFrom <= businessDate) {
      return { listUnitPrice: customerEntry.unitPrice, source: 'customer_list' };
    }
    const standardListId = this.standardListIds[customer.regionCode] ?? this.standardListIds.US;
    const standard = standardListId
      ? this.catalog.entriesByList.get(standardListId)?.get(sku.id)
      : undefined;
    if (standard) return { listUnitPrice: standard.unitPrice, source: 'standard' };
    return undefined;
  }

  taxRateBps(customer: Customer, shippingRegion: string, sku: Sku): number {
    return taxRateBpsFor(shippingRegion, customer.taxProfile, sku.taxClass, customer.regionCode);
  }
}

export function snapshotAddress(address: Address | undefined, name: string): AddressSnapshot {
  if (!address) {
    return {
      name,
      line1: 'Address on file',
      city: 'Chicago',
      region: 'IL',
      postalCode: '60609',
      countryCode: 'US',
    };
  }
  return {
    name,
    line1: address.line1,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    ...(address.line2 ? { line2: address.line2 } : {}),
  };
}
