/**
 * Seed scale (section 75). Master-data counts are absolute; transactional
 * volume is expressed per year so the 24-month logical history and the
 * materialized operational window derive from the same rates.
 */
export interface ScaleProfile {
  id: 'canonical' | 'demo' | 'light' | 'new_tenant' | 'enterprise' | 'heavy_data' | 'smoke';
  users: number;
  activeUsers: number;
  teams: number;
  warehouses: number;
  customers: number;
  contactsPerCustomer: number;
  addressesPerCustomer: number;
  suppliers: number;
  products: number;
  skus: number;
  supplierSkuMappings: number;
  contractPriceCustomersShare: number;
  /** Logical history depth in months. */
  historyMonths: number;
  /** Trailing window materialized with full mutable records. */
  operationalDays: number;
  ordersPerYear: number;
  quotesPerYear: number;
  purchaseOrdersPerYear: number;
  ticketsPerYear: number;
  bankTransactionsPerYear: number;
  linesPerOrderMedian: number;
}

export const SCALE_PROFILES: Record<ScaleProfile['id'], ScaleProfile> = {
  /** Canonical master data with a 45-day materialized window: the recommended browser default. */
  demo: {
    id: 'demo',
    users: 205,
    activeUsers: 170,
    teams: 16,
    warehouses: 6,
    customers: 4_800,
    contactsPerCustomer: 11_600 / 4_800,
    addressesPerCustomer: 8_900 / 4_800,
    suppliers: 1_200,
    products: 9_400,
    skus: 18_000,
    supplierSkuMappings: 28_000,
    contractPriceCustomersShare: 0.12,
    historyMonths: 24,
    operationalDays: 45,
    ordersPerYear: 80_000,
    quotesPerYear: 26_000,
    purchaseOrdersPerYear: 15_000,
    ticketsPerYear: 20_000,
    bankTransactionsPerYear: 39_000,
    linesPerOrderMedian: 3,
  },
  /** Reduced volume for fast local iteration (~2 s): same distributions and narrative. */
  light: {
    id: 'light',
    users: 205,
    activeUsers: 170,
    teams: 16,
    warehouses: 6,
    customers: 1_200,
    contactsPerCustomer: 11_600 / 4_800,
    addressesPerCustomer: 8_900 / 4_800,
    suppliers: 400,
    products: 2_400,
    skus: 4_500,
    supplierSkuMappings: 7_000,
    contractPriceCustomersShare: 0.12,
    historyMonths: 24,
    operationalDays: 30,
    ordersPerYear: 20_000,
    quotesPerYear: 6_500,
    purchaseOrdersPerYear: 3_800,
    ticketsPerYear: 5_000,
    bankTransactionsPerYear: 9_800,
    linesPerOrderMedian: 3,
  },
  canonical: {
    id: 'canonical',
    users: 205,
    activeUsers: 170,
    teams: 16,
    warehouses: 6,
    customers: 4_800,
    contactsPerCustomer: 11_600 / 4_800,
    addressesPerCustomer: 8_900 / 4_800,
    suppliers: 1_200,
    products: 9_400,
    skus: 18_000,
    supplierSkuMappings: 28_000,
    contractPriceCustomersShare: 0.12,
    historyMonths: 24,
    operationalDays: 120,
    ordersPerYear: 80_000,
    quotesPerYear: 26_000,
    purchaseOrdersPerYear: 15_000,
    ticketsPerYear: 20_000,
    bankTransactionsPerYear: 39_000,
    linesPerOrderMedian: 3,
  },
  enterprise: {
    id: 'enterprise',
    users: 205,
    activeUsers: 170,
    teams: 16,
    warehouses: 6,
    customers: 19_200,
    contactsPerCustomer: 11_600 / 4_800,
    addressesPerCustomer: 8_900 / 4_800,
    suppliers: 1_200,
    products: 28_200,
    skus: 54_000,
    supplierSkuMappings: 84_000,
    contractPriceCustomersShare: 0.12,
    historyMonths: 24,
    operationalDays: 120,
    ordersPerYear: 400_000,
    quotesPerYear: 130_000,
    purchaseOrdersPerYear: 75_000,
    ticketsPerYear: 100_000,
    bankTransactionsPerYear: 195_000,
    linesPerOrderMedian: 3,
  },
  heavy_data: {
    id: 'heavy_data',
    users: 205,
    activeUsers: 170,
    teams: 16,
    warehouses: 6,
    customers: 4_800,
    contactsPerCustomer: 11_600 / 4_800,
    addressesPerCustomer: 8_900 / 4_800,
    suppliers: 1_200,
    products: 9_400,
    skus: 18_000,
    supplierSkuMappings: 28_000,
    contractPriceCustomersShare: 0.12,
    historyMonths: 24,
    operationalDays: 120,
    ordersPerYear: 80_000,
    quotesPerYear: 26_000,
    purchaseOrdersPerYear: 15_000,
    ticketsPerYear: 20_000,
    bankTransactionsPerYear: 39_000,
    linesPerOrderMedian: 3,
  },
  new_tenant: {
    id: 'new_tenant',
    users: 3,
    activeUsers: 3,
    teams: 3,
    warehouses: 1,
    customers: 14,
    contactsPerCustomer: 1.6,
    addressesPerCustomer: 1.4,
    suppliers: 2,
    products: 12,
    skus: 24,
    supplierSkuMappings: 30,
    contractPriceCustomersShare: 0,
    historyMonths: 1,
    operationalDays: 30,
    ordersPerYear: 480,
    quotesPerYear: 240,
    purchaseOrdersPerYear: 60,
    ticketsPerYear: 60,
    bankTransactionsPerYear: 120,
    linesPerOrderMedian: 2,
  },
  smoke: {
    id: 'smoke',
    users: 24,
    activeUsers: 20,
    teams: 16,
    warehouses: 6,
    customers: 120,
    contactsPerCustomer: 2.2,
    addressesPerCustomer: 1.8,
    suppliers: 40,
    products: 160,
    skus: 320,
    supplierSkuMappings: 500,
    contractPriceCustomersShare: 0.12,
    historyMonths: 24,
    operationalDays: 120,
    ordersPerYear: 2_400,
    quotesPerYear: 800,
    purchaseOrdersPerYear: 480,
    ticketsPerYear: 600,
    bankTransactionsPerYear: 1_200,
    linesPerOrderMedian: 3,
  },
};
