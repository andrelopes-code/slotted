import {
  FX_RATES_TO_USD,
  ORGANIZATION_ID,
  money,
  addDays,
  businessDateToInstant,
  quantity,
  roundHalfUp,
  usd,
  type PriceListEntry,
  type Product,
  type Sku,
} from '../../domain';
import type { LeafCategoryDefinition, ProductTypeTemplate } from '../catalog-vocabulary';
import { PRODUCT_CLAIMS_BY_ROOT } from '../corpora';
import type { Random } from '../random';
import { withId, type SeedContext } from './context';
import type { TenantSeedResult } from './tenant';

export interface FlagshipProductSpec {
  name: string;
  leaf: string;
  brand: string;
  series: string;
  number: number;
  variants: string[];
  listPrice: number;
  cost: number;
}

/** Section 46 — flagship products; the first SKU of each is the narrative SKU. */
export const FLAGSHIP_PRODUCTS: FlagshipProductSpec[] = [
  {
    name: 'Servo Motor MX-240',
    leaf: 'Servo Motors',
    brand: 'Promethean Drives',
    series: 'MX',
    number: 240,
    variants: ['NEMA 34', 'IEC 100'],
    listPrice: 1_890,
    cost: 1_128,
  },
  {
    name: 'Inductive Sensor IS-18',
    leaf: 'Inductive Sensors',
    brand: 'Vertex Sensor Technologies',
    series: 'IS',
    number: 18,
    variants: ['8 mm', '12 mm', '4 mm'],
    listPrice: 86,
    cost: 41,
  },
  {
    name: 'Variable Frequency Drive VX-7',
    leaf: 'Variable Frequency Drives',
    brand: 'Kestrel Automation',
    series: 'VX',
    number: 7,
    variants: ['5 HP', '10 HP', '20 HP'],
    listPrice: 2_340,
    cost: 1_450,
  },
  {
    name: 'Safety Relay SR-420',
    leaf: 'Safety Relays',
    brand: 'Kestrel Automation',
    series: 'SR',
    number: 420,
    variants: ['3 N.O. + 1 N.C.', 'Dual channel'],
    listPrice: 312,
    cost: 176,
  },
  {
    name: 'Industrial Controller IC-900',
    leaf: 'Industrial Controllers',
    brand: 'Kestrel Automation',
    series: 'IC',
    number: 900,
    variants: ['32 I/O', '64 I/O', '128 I/O'],
    listPrice: 4_120,
    cost: 2_560,
  },
];

export interface CatalogSeedResult {
  /** SKU ids ordered by descending demand weight. */
  skuIds: string[];
  /** Cumulative demand weights aligned with `skuIds` for weighted picks. */
  cumulativeDemand: Float64Array;
  totalDemand: number;
  flagshipSkuIds: Map<string, string>;
  flagshipProductIds: Map<string, string>;
  /** Standard price-list entry id by SKU id. */
  standardEntryBySku: Map<string, string>;
  /** Price entries by price list id then SKU id. */
  entriesByList: Map<string, Map<string, PriceListEntry>>;
  skuCategoryLeaf: Map<string, string>;
}

const CATEGORY_CODES: Record<string, string> = {
  'Motion Control': 'MOT',
  'Sensors & Instrumentation': 'SEN',
  'Control & Automation': 'CTL',
  Electrical: 'ELE',
  'Pneumatics & Hydraulics': 'PNE',
  'Fasteners & Hardware': 'FAS',
  Safety: 'SAF',
  'Cutting Tools & Abrasives': 'CUT',
  'Material Handling': 'MHE',
  'Enclosures & Cable Management': 'ENC',
  'Fluid Handling': 'FLU',
  'MRO Consumables': 'MRO',
};

function logUniform(random: Random, min: number, max: number): number {
  return Math.exp(random.float(Math.log(min), Math.log(max)));
}

function priceMinor(dollars: number): number {
  const minor = roundHalfUp(dollars * 100);
  // Distributor-style price points: .00 / .50 / .95 / .99 by magnitude.
  if (minor >= 100_000) return Math.round(minor / 500) * 500;
  if (minor >= 10_000) return Math.round(minor / 100) * 100 - 5;
  if (minor >= 1_000) return Math.round(minor / 50) * 50 - 1;
  return minor;
}

function describe(
  template: ProductTypeTemplate,
  brand: string,
  name: string,
  random: Random,
  rootName: string,
): string {
  const claims =
    PRODUCT_CLAIMS_BY_ROOT[rootName] ?? PRODUCT_CLAIMS_BY_ROOT['MRO Consumables'] ?? [];
  const uses = [
    'OEM and MRO applications',
    'plant maintenance and machine builders',
    'production lines and facilities teams',
    'packaging and material handling lines',
    'panel builders and integrators',
  ];
  return `${brand} ${name}. ${template.noun} for ${random.pick(uses)}. ${random.sample(claims, 2).join(' ')}`;
}

export function seedCatalog(context: SeedContext, tenant: TenantSeedResult): CatalogSeedResult {
  const { dataset, scale } = context;
  const random = context.random('catalog');
  const createdAt = businessDateToInstant(addDays(context.today, -365 * 5), 9);

  const leaves = [...tenant.categoryDefinitions.entries()];
  const rootNameOf = (categoryId: string): string => {
    let current = dataset.categories.get(categoryId);
    while (current?.parentId) current = dataset.categories.get(current.parentId);
    return current?.name ?? 'MRO Consumables';
  };

  // Product allotment per leaf, proportional to summed type demand.
  const leafWeights = leaves.map(([, definition]) =>
    definition.types.reduce((sum, type) => sum + type.demand, 0),
  );
  const totalLeafWeight = leafWeights.reduce((sum, weight) => sum + weight, 0);

  const skuIds: string[] = [];
  const demandWeights: number[] = [];
  const flagshipSkuIds = new Map<string, string>();
  const flagshipProductIds = new Map<string, string>();
  const standardEntryBySku = new Map<string, string>();
  const entriesByList = new Map<string, Map<string, PriceListEntry>>();
  for (const listId of dataset.priceLists.keys()) entriesByList.set(listId, new Map());
  const skuCategoryLeaf = new Map<string, string>();
  const usedModelNames = new Set<string>();
  const serialByCategory = new Map<string, number>();

  const standardListId = tenant.priceListIdsByName.get('Standard') as string;
  const listAdjustments: [string, number][] = [
    ['SMB', 400],
    ['Enterprise', -600],
    ['Strategic Accounts', -1_100],
    ['Distributor', -1_500],
  ];

  const addPriceEntries = (sku: Sku, listPrice: number, onAllLists: boolean): void => {
    const validFrom = addDays(context.today, -random.int(60, 720));
    const standard: PriceListEntry = {
      id: context.nextId('priceEntry'),
      organizationId: ORGANIZATION_ID,
      priceListId: standardListId,
      skuId: sku.id,
      unitPrice: usd(listPrice),
      validFrom,
    };
    dataset.priceListEntries.set(standard.id, standard);
    standardEntryBySku.set(sku.id, standard.id);
    entriesByList.get(standardListId)?.set(sku.id, standard);
    // Brazil lists in BRL: landed price = USD list / FX × import factor; distributor at −12%.
    const brStandardId = tenant.priceListIdsByName.get('Brazil Standard');
    if (brStandardId) {
      const brl = priceMinor(((listPrice / Number(FX_RATES_TO_USD.BRL)) * 1.15) / 100);
      const entry: PriceListEntry = {
        id: context.nextId('priceEntry'),
        organizationId: ORGANIZATION_ID,
        priceListId: brStandardId,
        skuId: sku.id,
        unitPrice: money(brl, 'BRL'),
        validFrom,
      };
      dataset.priceListEntries.set(entry.id, entry);
      entriesByList.get(brStandardId)?.set(sku.id, entry);
      const brDistributorId = tenant.priceListIdsByName.get('Brazil Distributor');
      if (brDistributorId && (onAllLists || random.chance(0.35))) {
        const distributor: PriceListEntry = {
          id: context.nextId('priceEntry'),
          organizationId: ORGANIZATION_ID,
          priceListId: brDistributorId,
          skuId: sku.id,
          unitPrice: money(priceMinor((brl * 0.88) / 100), 'BRL'),
          validFrom,
        };
        dataset.priceListEntries.set(distributor.id, distributor);
        entriesByList.get(brDistributorId)?.set(sku.id, distributor);
      }
    }
    if (!onAllLists && !random.chance(0.35)) return;
    for (const [name, bps] of listAdjustments) {
      const listId = tenant.priceListIdsByName.get(name);
      if (!listId) continue;
      const entry: PriceListEntry = {
        id: context.nextId('priceEntry'),
        organizationId: ORGANIZATION_ID,
        priceListId: listId,
        skuId: sku.id,
        unitPrice: usd(priceMinor((listPrice * (1 + bps / 10_000)) / 100)),
        validFrom,
      };
      dataset.priceListEntries.set(entry.id, entry);
      entriesByList.get(listId)?.set(sku.id, entry);
    }
  };

  const createProduct = (
    leafId: string,
    definition: LeafCategoryDefinition,
    template: ProductTypeTemplate,
    spec: {
      brand: string;
      name: string;
      series: string;
      number: number;
      variants: string[];
      listPrice?: number;
      cost?: number;
      flagship?: boolean;
    },
  ): Product => {
    const status: Product['status'] = spec.flagship
      ? 'active'
      : random.weighted([
          { value: 'active', weight: 93 },
          { value: 'discontinued', weight: 5 },
          { value: 'draft', weight: 2 },
        ]);
    const product: Product = withId({
      id: context.nextId('product'),
      organizationId: ORGANIZATION_ID,
      name: spec.name,
      description: describe(template, spec.brand, spec.name, random, rootNameOf(leafId)),
      categoryId: leafId,
      brand: spec.brand,
      manufacturer: spec.brand,
      status,
      tags: random.chance(0.3)
        ? random.sample(
            ['best-seller', 'new', 'clearance', 'oem', 'made-in-usa', 'long-lead'],
            random.int(1, 2),
          )
        : [],
      metadata: context.metadata(addDays(createdAt, random.int(0, 1_500))),
    });
    dataset.products.set(product.id, product);

    const rootCode = CATEGORY_CODES[rootNameOf(leafId)] ?? 'GEN';
    const listPriceDollars =
      spec.listPrice ?? logUniform(random, template.priceMin, template.priceMax);
    const costRatio = random.float(template.costRatioMin, template.costRatioMax);
    for (const [index, variant] of spec.variants.entries()) {
      const serial = (serialByCategory.get(rootCode) ?? 0) + 1;
      serialByCategory.set(rootCode, serial);
      const variantPrice = priceMinor(listPriceDollars * (1 + index * random.float(0.04, 0.22)));
      const costMinor =
        spec.cost && index === 0 ? spec.cost * 100 : roundHalfUp(variantPrice * costRatio);
      const skuStatus: Sku['status'] =
        product.status === 'discontinued'
          ? 'discontinued'
          : spec.flagship
            ? 'active'
            : random.weighted([
                { value: 'active', weight: 95 },
                { value: 'restricted', weight: 2 },
                { value: 'discontinued', weight: 3 },
              ]);
      const reorderPoint =
        template.unitOfMeasure === 'EA' ? random.int(4, 60) : random.int(50, 400);
      const minMax = random.chance(0.72);
      const sku: Sku = withId({
        id: context.nextId('sku'),
        organizationId: ORGANIZATION_ID,
        productId: product.id,
        sku: `AST-${rootCode}-${String(serial).padStart(5, '0')}`,
        name: spec.variants.length > 1 ? `${spec.name} — ${variant}` : spec.name,
        manufacturerPartNumber: `${spec.series}-${spec.number}${spec.variants.length > 1 ? `-${String.fromCharCode(65 + index)}` : ''}`,
        status: skuStatus,
        unitOfMeasure: template.unitOfMeasure,
        quantityPrecision: template.precision,
        barcode: `0${random.digits(11)}`,
        weightGrams: random.int(template.weightGramsMin, template.weightGramsMax),
        taxClass: random.chance(0.03) ? 'exempt' : 'standard',
        standardCost: usd(costMinor),
        leadTimeDays: random.int(template.leadTimeMin, template.leadTimeMax),
        reorderPolicy: minMax
          ? {
              mode: 'min_max',
              reorderPoint: quantity(reorderPoint),
              safetyStock: quantity(Math.max(1, Math.round(reorderPoint * 0.4))),
              maxStock: quantity(reorderPoint * random.int(3, 6)),
            }
          : { mode: 'manual' },
        categoryId: leafId,
        metadata: context.metadata(product.metadata.createdAt),
        ...(spec.variants.length > 1 ? { variantLabel: variant } : {}),
      });
      if (random.chance(0.6)) {
        sku.dimensionsMm = {
          length: random.int(40, 900),
          width: random.int(30, 600),
          height: random.int(20, 500),
        };
      }
      dataset.skus.set(sku.id, sku);
      skuIds.push(sku.id);
      skuCategoryLeaf.set(sku.id, definition.name);
      demandWeights.push(
        (spec.flagship ? 8 : 1) *
          template.demand *
          random.logNormal(1, 1.35) *
          (skuStatus === 'active' ? 1 : 0.05),
      );
      addPriceEntries(sku, variantPrice, Boolean(spec.flagship));
      if (spec.flagship && index === 0) flagshipSkuIds.set(spec.name, sku.id);
    }
    if (spec.flagship) flagshipProductIds.set(spec.name, product.id);
    return product;
  };

  const modelName = (template: ProductTypeTemplate, series: string, number: number): string =>
    `${template.noun} ${series}-${number}`;

  // Flagship products first so their ids are stable and low.
  for (const flagship of FLAGSHIP_PRODUCTS) {
    const entry = leaves.find(([, definition]) => definition.name === flagship.leaf);
    if (!entry) continue;
    const [leafId, definition] = entry;
    const template = definition.types[0] as ProductTypeTemplate;
    usedModelNames.add(flagship.name);
    createProduct(leafId, definition, template, { ...flagship, flagship: true });
  }

  // Generated products, round-robin through leaves proportionally to weight.
  const targetProducts = Math.max(scale.products, FLAGSHIP_PRODUCTS.length);
  const allotments = leaves.map((_, index) =>
    Math.max(1, Math.round((targetProducts * (leafWeights[index] as number)) / totalLeafWeight)),
  );
  let produced = dataset.products.size;
  for (const [leafIndex, [leafId, definition]] of leaves.entries()) {
    const allotment = allotments[leafIndex] as number;
    for (let index = 0; index < allotment && produced < targetProducts; index += 1) {
      const template = random.pick(definition.types);
      const brand = random.pick(definition.brands);
      let series = random.pick(template.series);
      let number = random.int(10, 990);
      let name = modelName(template, series, number);
      let guard = 0;
      while (usedModelNames.has(`${brand} ${name}`) && guard < 20) {
        series = random.pick(template.series);
        number = random.int(10, 9_900);
        name = modelName(template, series, number);
        guard += 1;
      }
      usedModelNames.add(`${brand} ${name}`);
      const variantCount = random.weighted([
        { value: 1, weight: 40 },
        { value: 2, weight: 30 },
        { value: 3, weight: 20 },
        { value: 4, weight: 10 },
      ]);
      const variants = random.sample(
        template.variants,
        Math.min(variantCount, template.variants.length),
      );
      createProduct(leafId, definition, template, { brand, name, series, number, variants });
      produced += 1;
    }
  }

  // Trim or pad SKUs toward the requested count is unnecessary: the ratio of
  // variants already lands near the section 75 SKU/product ratio.

  // Sort by demand so the top of the list is the head of the Pareto curve.
  const order = skuIds
    .map((_, index) => index)
    .sort((a, b) => (demandWeights[b] as number) - (demandWeights[a] as number));
  const sortedIds = order.map((index) => skuIds[index] as string);
  const cumulative = new Float64Array(sortedIds.length);
  let running = 0;
  for (const [position, index] of order.entries()) {
    running += demandWeights[index] as number;
    cumulative[position] = running;
  }

  return {
    skuIds: sortedIds,
    cumulativeDemand: cumulative,
    totalDemand: running,
    flagshipSkuIds,
    flagshipProductIds,
    standardEntryBySku,
    entriesByList,
    skuCategoryLeaf,
  };
}

/** Weighted SKU pick following the demand curve (section 75.5). */
export function pickDemandSku(random: Random, catalog: CatalogSeedResult): string {
  const target = random.next() * catalog.totalDemand;
  let low = 0;
  let high = catalog.cumulativeDemand.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((catalog.cumulativeDemand[middle] as number) < target) low = middle + 1;
    else high = middle;
  }
  return catalog.skuIds[low] as string;
}
