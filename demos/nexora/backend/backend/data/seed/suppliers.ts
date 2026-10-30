import {
  FX_RATES_TO_USD,
  ORGANIZATION_ID,
  money,
  type RegionCode,
  addDays,
  businessDateToInstant,
  quantity,
  roundHalfUp,
  usd,
  type Address,
  type PaymentTermsCode,
  type Supplier,
  type SupplierSkuMapping,
} from '../../domain';
import { withId, type SeedContext } from './context';
import {
  COMPANY_STEMS,
  FIRST_NAMES,
  LAST_NAMES,
  STREET_NAMES,
  SUPPLIER_CATEGORIES,
  SUPPLIER_TAGS,
  US_CITIES,
} from '../vocabulary';
import {
  BR_CITIES,
  BR_COMPANY_DESCRIPTORS,
  BR_COMPANY_STEMS,
  BR_FIRST_NAMES,
  BR_LAST_NAMES,
  BR_STREET_NAMES,
} from '../vocabulary-br';

/** Section 46 — flagship suppliers; their names double as product brands. */
export const FLAGSHIP_SUPPLIERS: {
  name: string;
  category: string;
  tier: Supplier['relationshipTier'];
  brands: string[];
}[] = [
  {
    name: 'Arcwell Components',
    category: 'Electrical Components',
    tier: 'preferred',
    brands: ['Arcwell Components'],
  },
  {
    name: 'Kestrel Automation',
    category: 'Motion & Drives',
    tier: 'preferred',
    brands: ['Kestrel Automation'],
  },
  {
    name: 'Promethean Drives',
    category: 'Motion & Drives',
    tier: 'preferred',
    brands: ['Promethean Drives'],
  },
  {
    name: 'Vertex Sensor Technologies',
    category: 'Sensors & Instrumentation',
    tier: 'preferred',
    brands: ['Vertex Sensor Technologies'],
  },
  {
    name: 'DeltaForge Industrial',
    category: 'Fasteners & Hardware',
    tier: 'standard',
    brands: ['DeltaForge Industrial'],
  },
];

const SUPPLIER_DESCRIPTORS = [
  'Components',
  'Automation',
  'Drives',
  'Sensor Technologies',
  'Industrial',
  'Controls',
  'Manufacturing',
  'Fasteners',
  'Tooling',
  'Electric',
  'Pneumatics',
  'Bearings',
  'Supply',
  'Technologies',
  'Systems',
  'Products',
];

const CATEGORY_BY_ROOT: Record<string, string> = {
  'Motion Control': 'Motion & Drives',
  'Sensors & Instrumentation': 'Sensors & Instrumentation',
  'Control & Automation': 'Motion & Drives',
  Electrical: 'Electrical Components',
  'Pneumatics & Hydraulics': 'Pneumatics & Hydraulics',
  'Fasteners & Hardware': 'Fasteners & Hardware',
  Safety: 'Safety Products',
  'Cutting Tools & Abrasives': 'Cutting Tools',
  'Material Handling': 'Material Handling',
  'Enclosures & Cable Management': 'Enclosures & Cabling',
  'Fluid Handling': 'Fluid Handling',
  'Bearings & Power Transmission': 'Bearings & Power Transmission',
  'MRO Consumables': 'MRO Consumables',
};

export interface SupplierSeedResult {
  supplierIdsByCategory: Map<string, string[]>;
  flagshipSupplierIds: Map<string, string>;
  /** Preferred mapping id per SKU. */
  preferredMappingBySku: Map<string, SupplierSkuMapping>;
  mappingsBySku: Map<string, SupplierSkuMapping[]>;
  supplierAddress: Map<string, Address>;
}

export function seedSuppliers(context: SeedContext): SupplierSeedResult {
  const { dataset, scale } = context;
  const random = context.random('suppliers');
  const createdAt = businessDateToInstant(addDays(context.today, -365 * 5), 9);
  const supplierIdsByCategory = new Map<string, string[]>();
  const flagshipSupplierIds = new Map<string, string>();
  const supplierByBrand = new Map<string, string>();
  const supplierAddress = new Map<string, Address>();
  const usedNames = new Set<string>();

  const createSupplier = (
    name: string,
    category: string,
    tier: Supplier['relationshipTier'],
    flagship: boolean,
    regionCode: RegionCode = 'US',
  ): Supplier => {
    const status: Supplier['status'] = flagship
      ? 'active'
      : random.weighted([
          { value: 'active', weight: 88 },
          { value: 'on_hold', weight: 5 },
          { value: 'inactive', weight: 7 },
        ]);
    const brazil = regionCode === 'BR';
    const currencies = brazil
      ? (['BRL'] as Supplier['supportedCurrencies'])
      : random.chance(0.14)
        ? (['USD', random.pick(['EUR', 'GBP'])] as Supplier['supportedCurrencies'])
        : (['USD'] as Supplier['supportedCurrencies']);
    const contactFirst = random.pick(brazil ? BR_FIRST_NAMES : FIRST_NAMES);
    const contactLast = random.pick(brazil ? BR_LAST_NAMES : LAST_NAMES);
    const domain = `${name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')}.${brazil ? 'com.br' : 'example'}`;
    const supplier: Supplier = withId({
      id: context.nextId('supplier'),
      organizationId: ORGANIZATION_ID,
      supplierNumber: context.sequences.nextBusinessNumber('supplier'),
      regionCode,
      legalName: `${name}${random.chance(0.6) ? ', Inc.' : random.chance(0.5) ? ' LLC' : ' Corp.'}`,
      displayName: name,
      status,
      relationshipTier: tier,
      category,
      primaryContactName: `${contactFirst} ${contactLast}`,
      primaryContactEmail: `${contactFirst}.${contactLast}@${domain}`.toLowerCase(),
      paymentTermsCode: random.weighted<PaymentTermsCode>([
        { value: 'NET_30', weight: 55 },
        { value: 'NET_45', weight: 20 },
        { value: 'NET_60', weight: 15 },
        { value: 'NET_15', weight: 7 },
        { value: 'DUE_ON_RECEIPT', weight: 3 },
      ]),
      supportedCurrencies: currencies,
      preferredShippingTerms: random.pick([
        'FOB Origin',
        'FOB Destination',
        'Prepaid & Add',
        'Collect',
      ]),
      tags: random.sample(SUPPLIER_TAGS, random.int(0, 3)),
      metadata: context.metadata(addDays(createdAt, random.int(0, 1_500))),
    });
    dataset.suppliers.set(supplier.id, supplier);
    const bucket = supplierIdsByCategory.get(category) ?? [];
    bucket.push(supplier.id);
    supplierIdsByCategory.set(category, bucket);

    const city = random.pick(brazil ? BR_CITIES : US_CITIES);
    const address: Address = withId({
      id: context.nextId('address'),
      organizationId: ORGANIZATION_ID,
      ownerType: 'supplier',
      ownerId: supplier.id,
      type: 'headquarters',
      line1: brazil
        ? `${random.pick(BR_STREET_NAMES)}, ${random.int(100, 9_900)}`
        : `${random.int(100, 9_900)} ${random.pick(STREET_NAMES)}`,
      city: city.city,
      region: city.region,
      postalCode: brazil
        ? `${city.postalPrefix}${random.digits(3)}-${random.digits(3)}`
        : `${city.postalPrefix}${random.digits(2)}`,
      countryCode: brazil ? 'BR' : 'US',
      isDefault: true,
      metadata: context.metadata(supplier.metadata.createdAt),
    });
    dataset.addresses.set(address.id, address);
    supplierAddress.set(supplier.id, address);
    return supplier;
  };

  for (const flagship of FLAGSHIP_SUPPLIERS) {
    usedNames.add(flagship.name);
    const supplier = createSupplier(flagship.name, flagship.category, flagship.tier, true);
    flagshipSupplierIds.set(flagship.name, supplier.id);
    for (const brand of flagship.brands) supplierByBrand.set(brand, supplier.id);
  }

  const target = Math.max(scale.suppliers, FLAGSHIP_SUPPLIERS.length);
  const brazilEnabled = scale.warehouses > 5;
  while (dataset.suppliers.size < target) {
    const brazil = brazilEnabled && random.chance(0.1);
    const name = brazil
      ? `${random.pick(BR_COMPANY_STEMS)} ${random.pick(BR_COMPANY_DESCRIPTORS)}`
      : `${random.pick(COMPANY_STEMS)} ${random.pick(SUPPLIER_DESCRIPTORS)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const tier = random.weighted<Supplier['relationshipTier']>([
      { value: 'standard', weight: 62 },
      { value: 'preferred', weight: 28 },
      { value: 'conditional', weight: 10 },
    ]);
    createSupplier(name, random.pick(SUPPLIER_CATEGORIES), tier, false, brazil ? 'BR' : 'US');
  }

  // Supplier ↔ SKU mappings. Each SKU gets a preferred supplier aligned with its
  // brand when the brand is a flagship supplier, otherwise from its category pool.
  const rootNameOf = (categoryId: string): string => {
    let current = dataset.categories.get(categoryId);
    while (current?.parentId) current = dataset.categories.get(current.parentId);
    return current?.name ?? 'MRO Consumables';
  };
  const preferredMappingBySku = new Map<string, SupplierSkuMapping>();
  const mappingsBySku = new Map<string, SupplierSkuMapping[]>();
  const perSkuTarget = scale.supplierSkuMappings / Math.max(1, dataset.skus.size);
  const allSupplierIds = [...dataset.suppliers.keys()];

  for (const sku of dataset.skus.values()) {
    const product = dataset.products.get(sku.productId);
    const category = CATEGORY_BY_ROOT[rootNameOf(sku.categoryId)] ?? 'MRO Consumables';
    const pool = supplierIdsByCategory.get(category) ?? allSupplierIds;
    const count = Math.max(1, Math.round(perSkuTarget + random.normal(0, 0.6)));
    const brandSupplier = product?.brand ? supplierByBrand.get(product.brand) : undefined;
    const chosen = new Set<string>();
    if (brandSupplier) chosen.add(brandSupplier);
    let guard = 0;
    while (chosen.size < count && guard < 12) {
      chosen.add(random.pick(pool));
      guard += 1;
    }
    const mappings: SupplierSkuMapping[] = [];
    let first = true;
    for (const supplierId of chosen) {
      const supplier = dataset.suppliers.get(supplierId);
      const costRatio = first ? random.float(0.94, 1.04) : random.float(0.98, 1.16);
      const packMultiple = sku.unitOfMeasure === 'PK' ? 1 : random.pick([1, 1, 1, 5, 10, 25]);
      const mapping: SupplierSkuMapping = {
        id: context.nextId('supplierSkuMapping'),
        organizationId: ORGANIZATION_ID,
        supplierId,
        skuId: sku.id,
        supplierSku: `${random.letters(2)}${random.digits(random.int(5, 7))}`,
        unitCost:
          supplier?.regionCode === 'BR'
            ? money(
                roundHalfUp((sku.standardCost.minor * costRatio) / Number(FX_RATES_TO_USD.BRL)),
                'BRL',
              )
            : usd(roundHalfUp(sku.standardCost.minor * costRatio)),
        minimumOrderQuantity: quantity(packMultiple * random.pick([1, 1, 2, 4])),
        packMultiple: quantity(packMultiple),
        leadTimeDays: Math.max(1, sku.leadTimeDays + random.int(-3, 10)),
        currency: supplier?.regionCode === 'BR' ? 'BRL' : 'USD',
        status: supplier?.status === 'inactive' ? 'inactive' : 'active',
        isPreferred: first,
      };
      dataset.supplierSkuMappings.set(mapping.id, mapping);
      mappings.push(mapping);
      if (first) {
        preferredMappingBySku.set(sku.id, mapping);
        sku.preferredSupplierId = supplierId;
      }
      first = false;
    }
    mappingsBySku.set(sku.id, mappings);
  }

  return {
    supplierIdsByCategory,
    flagshipSupplierIds,
    preferredMappingBySku,
    mappingsBySku,
    supplierAddress,
  };
}
