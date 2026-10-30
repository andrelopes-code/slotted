import {
  ORGANIZATION_ID,
  money,
  regionByCode,
  type RegionCode,
  addDays,
  addMinutes,
  businessDateToInstant,
  quantity,
  roundHalfUp,
  type Address,
  type Contact,
  type ContractPrice,
  type Customer,
  type CustomerHealth,
  type CustomerNote,
  type CustomerSegment,
  type CustomerStatus,
  type PaymentTermsCode,
} from '../../domain';
import type { CatalogSeedResult } from './catalog';
import { pickDemandSku } from './catalog';
import { withId, type SeedContext } from './context';
import type { TenantSeedResult } from './tenant';
import {
  COMPANY_DESCRIPTORS,
  COMPANY_STEMS,
  COMPANY_SUFFIXES,
  CUSTOMER_TAGS,
  EMPLOYEE_BANDS,
  FIRST_NAMES,
  INDUSTRIES,
  LAST_NAMES,
  STREET_NAMES,
  US_CITIES,
  type CityRecord,
} from '../vocabulary';
import {
  BR_CITIES,
  BR_COMPANY_DESCRIPTORS,
  BR_COMPANY_PATTERNS,
  BR_COMPANY_STEMS,
  BR_COMPANY_SUFFIXES,
  BR_FIRST_NAMES,
  BR_LAST_NAMES,
  BR_STREET_NAMES,
} from '../vocabulary-br';
import { CUSTOMER_NOTE_BODIES, HOLD_REASONS_LONG } from '../corpora';

const CENTRAL_STATES = new Set([
  'IL',
  'WI',
  'MN',
  'IA',
  'MO',
  'NE',
  'KS',
  'SD',
  'IN',
  'MI',
  'OH',
  'KY',
]);
const EAST_STATES = new Set([
  'NJ',
  'PA',
  'NY',
  'CT',
  'MA',
  'RI',
  'MD',
  'VA',
  'NC',
  'SC',
  'GA',
  'FL',
  'TN',
  'AL',
]);

export interface FlagshipCustomerSpec {
  key: string;
  displayName: string;
  legalName: string;
  accountNumber?: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  health: CustomerHealth;
  industry: string;
  city: string;
  region: string;
  creditLimit: number;
  paymentTerms: PaymentTermsCode;
  customerSince: string;
  employeeBand: string;
  ownerPersona?: string;
  tags: string[];
}

/** Section 46 and 76 — flagship customers. */
export const FLAGSHIP_CUSTOMERS: FlagshipCustomerSpec[] = [
  {
    key: 'meridian',
    displayName: 'Meridian Controls Group',
    legalName: 'Meridian Controls Group, Inc.',
    accountNumber: 'CUS-010428',
    segment: 'enterprise',
    status: 'active',
    health: 'at_risk',
    industry: 'Industrial Machinery',
    city: 'Naperville',
    region: 'IL',
    creditLimit: 500_000,
    paymentTerms: 'NET_45',
    customerSince: '2019-04-12',
    employeeBand: '1,001-5,000',
    ownerPersona: 'noah-bennett',
    tags: ['key-account', 'renewal-q4', 'contract-pricing', 'multi-site'],
  },
  {
    key: 'helios',
    displayName: 'Helios Manufacturing',
    legalName: 'Helios Manufacturing Co.',
    segment: 'mid_market',
    status: 'active',
    health: 'healthy',
    industry: 'Metal Fabrication',
    city: 'Milwaukee',
    region: 'WI',
    creditLimit: 150_000,
    paymentTerms: 'NET_30',
    customerSince: '2021-02-03',
    employeeBand: '201-500',
    ownerPersona: 'noah-bennett',
    tags: ['repeat', 'portal-user'],
  },
  {
    key: 'northstar',
    displayName: 'Northstar Process Systems',
    legalName: 'Northstar Process Systems LLC',
    segment: 'strategic',
    status: 'active',
    health: 'healthy',
    industry: 'Chemical Processing',
    city: 'Houston',
    region: 'TX',
    creditLimit: 1_200_000,
    paymentTerms: 'NET_60',
    customerSince: '2017-09-18',
    employeeBand: '5,000+',
    tags: ['key-account', 'contract-pricing', 'multi-site'],
  },
  {
    key: 'redline',
    displayName: 'Redline Packaging',
    legalName: 'Redline Packaging Corp.',
    segment: 'smb',
    status: 'active',
    health: 'watch',
    industry: 'Packaging',
    city: 'Atlanta',
    region: 'GA',
    creditLimit: 40_000,
    paymentTerms: 'NET_30',
    customerSince: '2023-06-27',
    employeeBand: '51-200',
    tags: ['seasonal'],
  },
  {
    key: 'cascade',
    displayName: 'Cascade Energy Services',
    legalName: 'Cascade Energy Services, Inc.',
    segment: 'enterprise',
    status: 'on_hold',
    health: 'at_risk',
    industry: 'Oil & Gas Services',
    city: 'Denver',
    region: 'CO',
    creditLimit: 350_000,
    paymentTerms: 'NET_45',
    customerSince: '2018-11-05',
    employeeBand: '501-1,000',
    tags: ['key-account'],
  },
  {
    key: 'vantage',
    displayName: 'Vantage Motion Labs',
    legalName: 'Vantage Motion Labs LLC',
    segment: 'mid_market',
    status: 'prospect',
    health: 'healthy',
    industry: 'Electronics Assembly',
    city: 'Edison',
    region: 'NJ',
    creditLimit: 75_000,
    paymentTerms: 'NET_30',
    customerSince: '2026-07-14',
    employeeBand: '51-200',
    tags: ['net-new-2026', 'referral'],
  },
];

export interface CustomerSeedResult {
  customerIds: string[];
  /** Customer ids weighted for order generation (revenue skew, section 23). */
  orderWeightedCustomerIds: string[];
  flagshipCustomerIds: Map<string, string>;
  contactsByCustomer: Map<string, Contact[]>;
  addressesByCustomer: Map<string, Address[]>;
  salesRepsByTeam: Map<string, string[]>;
  contractPricesByCustomer: Map<string, ContractPrice[]>;
  cityByCustomer: Map<string, CityRecord>;
}

function creditLimitFor(random: import('../random').Random, segment: CustomerSegment): number {
  switch (segment) {
    case 'smb':
      return random.pick([10_000, 15_000, 20_000, 25_000, 35_000, 50_000]);
    case 'mid_market':
      return random.pick([50_000, 75_000, 100_000, 150_000, 200_000, 250_000]);
    case 'enterprise':
      return random.pick([250_000, 350_000, 500_000, 750_000, 1_000_000]);
    case 'strategic':
      return random.pick([500_000, 750_000, 1_000_000, 1_500_000, 2_000_000]);
  }
}

function termsFor(random: import('../random').Random, segment: CustomerSegment): PaymentTermsCode {
  switch (segment) {
    case 'smb':
      return random.weighted([
        { value: 'NET_30', weight: 55 },
        { value: 'NET_15', weight: 20 },
        { value: 'DUE_ON_RECEIPT', weight: 15 },
        { value: 'NET_45', weight: 10 },
      ]);
    case 'mid_market':
      return random.weighted([
        { value: 'NET_30', weight: 60 },
        { value: 'NET_45', weight: 25 },
        { value: 'NET_15', weight: 10 },
        { value: 'NET_60', weight: 5 },
      ]);
    case 'enterprise':
      return random.weighted([
        { value: 'NET_30', weight: 35 },
        { value: 'NET_45', weight: 40 },
        { value: 'NET_60', weight: 25 },
      ]);
    case 'strategic':
      return random.weighted([
        { value: 'NET_45', weight: 40 },
        { value: 'NET_60', weight: 50 },
        { value: 'NET_30', weight: 10 },
      ]);
  }
}

export function seedCustomers(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
): CustomerSeedResult {
  const { dataset, scale } = context;
  const random = context.random('customers');

  // Sales reps per team code.
  const salesRepsByTeam = new Map<string, string[]>();
  const salesRepRole = tenant.roleIdsByKey.get('sales_representative');
  const repUserIds = new Set(
    [...dataset.roleAssignments.values()]
      .filter((assignment) => assignment.roleId === salesRepRole)
      .map((assignment) => assignment.userId),
  );
  for (const membership of dataset.teamMemberships) {
    const team = dataset.teams.get(membership.teamId);
    if (!team || team.type !== 'sales') continue;
    const user = dataset.users.get(membership.userId);
    if (!user || user.status !== 'active' || (!repUserIds.has(user.id) && !membership.isLead))
      continue;
    const bucket = salesRepsByTeam.get(team.code) ?? [];
    bucket.push(user.id);
    salesRepsByTeam.set(team.code, bucket);
  }
  const teamCodeFor = (
    region: string,
    segment: CustomerSegment,
    regionCode: RegionCode,
  ): string => {
    if (regionCode === 'BR' && tenant.teamIdsByCode.has('SALES-BR')) return 'SALES-BR';
    if (segment === 'strategic' && tenant.teamIdsByCode.has('SALES-SA')) return 'SALES-SA';
    if (CENTRAL_STATES.has(region) && tenant.teamIdsByCode.has('SALES-C')) return 'SALES-C';
    if (EAST_STATES.has(region) && tenant.teamIdsByCode.has('SALES-E')) return 'SALES-E';
    return tenant.teamIdsByCode.has('SALES-W') ? 'SALES-W' : 'SALES-C';
  };

  const priceListFor = (segment: CustomerSegment, regionCode: RegionCode): string => {
    if (regionCode === 'BR') {
      const brName =
        segment === 'smb' || random.chance(0.6) ? 'Brazil Standard' : 'Brazil Distributor';
      return (
        tenant.priceListIdsByName.get(brName) ??
        (tenant.priceListIdsByName.get('Standard') as string)
      );
    }
    const name =
      segment === 'smb'
        ? 'SMB'
        : segment === 'mid_market'
          ? random.chance(0.4)
            ? 'Standard'
            : 'SMB'
          : segment === 'enterprise'
            ? 'Enterprise'
            : 'Strategic Accounts';
    return (
      tenant.priceListIdsByName.get(name) ?? (tenant.priceListIdsByName.get('Standard') as string)
    );
  };

  const customerIds: string[] = [];
  const flagshipCustomerIds = new Map<string, string>();
  const contactsByCustomer = new Map<string, Contact[]>();
  const addressesByCustomer = new Map<string, Address[]>();
  const contractPricesByCustomer = new Map<string, ContractPrice[]>();
  const cityByCustomer = new Map<string, CityRecord>();
  const usedNames = new Set<string>();
  const usedAccountNumbers = new Set<string>();

  // Account numbers start above 10,000 so the flagship CUS-010428 sits inside the range.
  for (let sequence = 1; sequence <= 10_000; sequence += 1)
    context.sequences.reserveBusinessNumber(`CUS-${String(sequence).padStart(6, '0')}`);
  for (const flagship of FLAGSHIP_CUSTOMERS)
    if (flagship.accountNumber) context.sequences.reserveBusinessNumber(flagship.accountNumber);

  const makeContacts = (
    customer: Customer,
    count: number,
    options: { noPhone?: boolean } = {},
  ): Contact[] => {
    const brazil = customer.regionCode === 'BR';
    const domain = `${customer.displayName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')}.${brazil ? 'com.br' : 'example'}`;
    const phone = (): string =>
      brazil
        ? `+55 (${random.pick(['11', '11', '19', '21', '31', '41', '47', '51'])}) ${random.int(2000, 5999)}-${random.digits(4)}`
        : `(${random.int(201, 989)}) ${random.int(200, 999)}-${random.digits(4)}`;
    const mobile = (): string =>
      brazil
        ? `+55 (${random.pick(['11', '11', '19', '21', '31', '41', '47', '51'])}) 9${random.digits(4)}-${random.digits(4)}`
        : phone();
    const contacts: Contact[] = [];
    const roles: [string, string][] = [
      ['Purchasing Manager', 'Procurement'],
      ['Buyer', 'Procurement'],
      ['Plant Manager', 'Operations'],
      ['Maintenance Supervisor', 'Maintenance'],
      ['Accounts Payable Specialist', 'Finance'],
      ['Controller', 'Finance'],
      ['Operations Director', 'Operations'],
      ['Engineering Manager', 'Engineering'],
      ['Receiving Lead', 'Warehouse'],
      ['Owner', 'Executive'],
    ];
    for (let index = 0; index < count; index += 1) {
      const firstName = random.pick(brazil ? BR_FIRST_NAMES : FIRST_NAMES);
      const lastName = random.pick(brazil ? BR_LAST_NAMES : LAST_NAMES);
      const [title, department] = index === 0 ? (roles[0] as [string, string]) : random.pick(roles);
      const hasPhone = !options.noPhone && random.chance(0.8);
      const contact: Contact = withId({
        id: context.nextId('contact'),
        organizationId: ORGANIZATION_ID,
        customerId: customer.id,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        title,
        department,
        email: `${firstName}.${lastName}@${domain}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9.@]/g, ''),
        isPrimary: index === 0,
        status: index > 0 && random.chance(0.08) ? 'inactive' : 'active',
        metadata: context.metadata(addDays(customer.metadata.createdAt, random.int(0, 400))),
        ...(hasPhone ? { phone: phone() } : {}),
        ...(hasPhone && random.chance(0.4) ? { mobile: mobile() } : {}),
        ...(random.chance(0.6)
          ? { preferredContactMethod: hasPhone && random.chance(0.3) ? 'phone' : 'email' }
          : {}),
        ...(random.chance(0.7)
          ? { lastContactedAt: addMinutes(context.now, -random.int(60, 60 * 24 * 120)) }
          : {}),
      } as Contact);
      dataset.contacts.set(contact.id, contact);
      contacts.push(contact);
    }
    contactsByCustomer.set(customer.id, contacts);
    if (contacts[0]) customer.primaryContactId = contacts[0].id;
    return contacts;
  };

  const makeAddresses = (
    customer: Customer,
    city: CityRecord,
    count: number,
    options: { noDefaultShipping?: boolean } = {},
  ): Address[] => {
    const addresses: Address[] = [];
    const add = (
      type: Address['type'],
      isDefault: boolean,
      label?: string,
      cityRecord: CityRecord = city,
    ): Address => {
      const address: Address = withId({
        id: context.nextId('address'),
        organizationId: ORGANIZATION_ID,
        ownerType: 'customer',
        ownerId: customer.id,
        type,
        line1:
          customer.regionCode === 'BR'
            ? `${random.pick(BR_STREET_NAMES)}, ${random.int(100, 9_900)}`
            : `${random.int(100, 9_900)} ${random.pick(STREET_NAMES)}`,
        city: cityRecord.city,
        region: cityRecord.region,
        postalCode:
          customer.regionCode === 'BR'
            ? `${cityRecord.postalPrefix}${random.digits(3)}-${random.digits(3)}`
            : `${cityRecord.postalPrefix}${random.digits(2)}`,
        countryCode: customer.regionCode === 'BR' ? 'BR' : 'US',
        isDefault,
        metadata: context.metadata(customer.metadata.createdAt),
        ...(label ? { label } : {}),
        ...(random.chance(0.25)
          ? { line2: random.pick(['Suite 200', 'Building B', 'Dock 4', 'Unit 12', 'Floor 3']) }
          : {}),
        ...(type === 'shipping' && random.chance(0.35)
          ? {
              deliveryInstructions: random.pick([
                'Deliver to rear dock; call 30 minutes ahead.',
                'Receiving hours 7:00–15:00.',
                'Lift gate required.',
                'No deliveries on Fridays after noon.',
                'Check in at guard shack.',
              ]),
            }
          : {}),
      });
      dataset.addresses.set(address.id, address);
      addresses.push(address);
      return address;
    };
    const billing = add('billing', true, 'Headquarters');
    customer.billingAddressId = billing.id;
    if (!options.noDefaultShipping) {
      if (count <= 1 || random.chance(0.3)) {
        customer.defaultShippingAddressId = billing.id;
      } else {
        const shipping = add('shipping', true, count > 2 ? 'Main plant' : 'Plant');
        customer.defaultShippingAddressId = shipping.id;
      }
    }
    for (let index = addresses.length; index < count; index += 1) {
      const otherCity = random.chance(0.5) ? random.pick(US_CITIES) : city;
      add(
        random.chance(0.8) ? 'shipping' : 'service_location',
        false,
        random.pick([
          'Plant 2',
          'North site',
          'Distribution center',
          'Service depot',
          'Satellite facility',
          'Line 4 receiving',
        ]),
        otherCity,
      );
    }
    addressesByCustomer.set(customer.id, addresses);
    return addresses;
  };

  const makeNotes = (customer: Customer, count: number): void => {
    const owner = dataset.users.get(customer.accountOwnerId);
    for (let index = 0; index < count; index += 1) {
      const createdAt = addMinutes(context.now, -random.int(60 * 24, 60 * 24 * 300));
      const note: CustomerNote = withId({
        id: context.nextId('customerNote'),
        organizationId: ORGANIZATION_ID,
        customerId: customer.id,
        authorId: owner?.id ?? customer.accountOwnerId,
        body: random.pick(CUSTOMER_NOTE_BODIES),
        visibility: random.weighted([
          { value: 'organization', weight: 70 },
          { value: 'team', weight: 22 },
          { value: 'private', weight: 8 },
        ]),
        isPinned: index === 0 && random.chance(0.3),
        mentionedUserIds: [],
        attachmentIds: [],
        metadata: context.metadata(createdAt, owner?.id ?? customer.accountOwnerId),
      });
      if (note.visibility === 'team') note.teamId = customer.salesTeamId;
      dataset.customerNotes.set(note.id, note);
    }
  };

  const createCustomer = (spec: {
    displayName: string;
    legalName: string;
    accountNumber?: string;
    segment: CustomerSegment;
    status: CustomerStatus;
    health: CustomerHealth;
    industry: string;
    city: CityRecord;
    creditLimit: number;
    paymentTerms: PaymentTermsCode;
    customerSince: string;
    employeeBand: string;
    ownerId?: string;
    tags: string[];
    flagship?: boolean;
    regionCode?: RegionCode;
  }): Customer => {
    const regionCode = spec.regionCode ?? 'US';
    const region = regionByCode(regionCode);
    const teamCode = teamCodeFor(spec.city.region, spec.segment, regionCode);
    const reps = salesRepsByTeam.get(teamCode) ??
      [...salesRepsByTeam.values()][0] ?? [tenant.personaUserIds.get('noah-bennett') as string];
    const ownerId = spec.ownerId ?? random.pick(reps);
    const createdAt = businessDateToInstant(spec.customerSince, random.int(8, 16));
    const customer: Customer = withId({
      id: context.nextId('customer'),
      organizationId: ORGANIZATION_ID,
      accountNumber: spec.accountNumber ?? context.sequences.nextBusinessNumber('customer'),
      regionCode,
      legalName: spec.legalName,
      displayName: spec.displayName,
      status: spec.status,
      segment: spec.segment,
      industry: spec.industry,
      employeeBand: spec.employeeBand,
      website: `https://www.${spec.displayName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')}.${regionCode === 'BR' ? 'com.br' : 'example'}`,
      accountOwnerId: ownerId,
      salesTeamId: tenant.teamIdsByCode.get(teamCode) as string,
      paymentTermsCode: spec.paymentTerms,
      creditLimit: money(
        regionCode === 'BR'
          ? Math.round(spec.creditLimit / Number(region.fxRateToUsd) / 1_000) * 1_000 * 100
          : spec.creditLimit * 100,
        region.currency,
      ),
      priceListId: priceListFor(spec.segment, regionCode),
      taxProfile: random.chance(0.08)
        ? {
            type: 'exempt',
            exemptionReason: random.pick([
              'Resale certificate on file',
              'Manufacturing exemption',
              'Non-profit',
            ]),
          }
        : { type: 'taxable' },
      preferredCurrency: region.currency,
      customerSince: spec.customerSince,
      annualRevenueEstimate: money(
        roundHalfUp((spec.creditLimit * random.float(6, 30)) / Number(region.fxRateToUsd)) * 100,
        region.currency,
      ),
      health: spec.health,
      tags: spec.tags,
      metadata: context.metadata(
        createdAt,
        ownerId,
        addMinutes(context.now, -random.int(60, 60 * 24 * 200)),
        ownerId,
      ),
    });
    if (spec.status === 'on_hold') customer.holdReason = random.pick(HOLD_REASONS_LONG);
    if (spec.status === 'closed' || spec.status === 'inactive') {
      if (random.chance(0.5))
        customer.metadata.archivedAt = addMinutes(
          context.now,
          -random.int(60 * 24 * 30, 60 * 24 * 400),
        );
    }
    usedAccountNumbers.add(customer.accountNumber);
    dataset.customers.set(customer.id, customer);
    customerIds.push(customer.id);
    cityByCustomer.set(customer.id, spec.city);
    return customer;
  };

  // Flagship customers
  for (const flagship of FLAGSHIP_CUSTOMERS) {
    const city =
      US_CITIES.find((record) => record.city === flagship.city) ?? (US_CITIES[0] as CityRecord);
    const ownerId = flagship.ownerPersona
      ? tenant.personaUserIds.get(flagship.ownerPersona)
      : undefined;
    usedNames.add(flagship.displayName);
    const customer = createCustomer({
      ...flagship,
      city,
      ...(ownerId ? { ownerId } : {}),
      flagship: true,
    });
    flagshipCustomerIds.set(flagship.key, customer.id);
    makeContacts(customer, flagship.key === 'meridian' ? 6 : random.int(2, 4));
    makeAddresses(customer, city, flagship.key === 'meridian' ? 5 : random.int(2, 3));
    makeNotes(customer, flagship.key === 'meridian' ? 4 : 2);
  }

  // Generated customers
  const target = Math.max(scale.customers, FLAGSHIP_CUSTOMERS.length);
  let generatedIndex = 0;
  const brazilEnabled = scale.warehouses > 5;
  while (dataset.customers.size < target) {
    const brazil = brazilEnabled && generatedIndex >= 12 && random.chance(0.2);
    const stem = random.pick(brazil ? BR_COMPANY_STEMS : COMPANY_STEMS);
    const descriptor = random.pick(brazil ? BR_COMPANY_DESCRIPTORS : COMPANY_DESCRIPTORS);
    const suffix = random.weighted(brazil ? BR_COMPANY_SUFFIXES : COMPANY_SUFFIXES);
    const displayName = brazil
      ? random.weighted(BR_COMPANY_PATTERNS).replace('{d}', descriptor).replace('{s}', stem)
      : `${stem} ${descriptor}`;
    if (usedNames.has(displayName)) {
      if (random.chance(0.5)) continue;
    }
    usedNames.add(displayName);
    const segment = random.weighted<CustomerSegment>([
      { value: 'smb', weight: 58 },
      { value: 'mid_market', weight: 28 },
      { value: 'enterprise', weight: 11 },
      { value: 'strategic', weight: 3 },
    ]);
    const status = random.weighted<CustomerStatus>([
      { value: 'active', weight: 82 },
      { value: 'prospect', weight: 7 },
      { value: 'on_hold', weight: 2 },
      { value: 'inactive', weight: 8 },
      { value: 'closed', weight: 1 },
    ]);
    const health: CustomerHealth =
      status === 'on_hold'
        ? 'at_risk'
        : random.weighted([
            { value: 'healthy', weight: 70 },
            { value: 'watch', weight: 22 },
            { value: 'at_risk', weight: 8 },
          ]);
    const city = random.pick(brazil ? BR_CITIES : US_CITIES);
    const sinceDays = status === 'prospect' ? random.int(5, 120) : random.int(120, 365 * 7);
    const creditLimit = creditLimitFor(random, segment);
    const legalName = suffix
      ? `${displayName}${suffix === 'Group' ? ' Group' : brazil ? ` ${suffix}` : `, ${suffix}`}`
      : displayName;
    const customer = createCustomer({
      displayName,
      legalName:
        generatedIndex === 7
          ? `${displayName} of North America Holdings and Subsidiaries, ${suffix || 'Inc.'}`
          : legalName,
      segment,
      status,
      health,
      industry: random.pick(INDUSTRIES),
      city,
      creditLimit,
      paymentTerms: termsFor(random, segment),
      customerSince: addDays(context.today, -sinceDays),
      employeeBand: EMPLOYEE_BANDS[
        Math.min(
          EMPLOYEE_BANDS.length - 1,
          (segment === 'smb'
            ? 0
            : segment === 'mid_market'
              ? 2
              : segment === 'enterprise'
                ? 4
                : 5) + random.int(0, 1),
        )
      ] as string,
      tags: random.chance(0.45) ? random.sample(CUSTOMER_TAGS, random.int(1, 3)) : [],
      regionCode: brazil ? 'BR' : 'US',
    });
    const contactCount = Math.max(
      1,
      Math.round(
        scale.contactsPerCustomer -
          0.4 +
          random.normal(0, 1.0) +
          (segment === 'enterprise' || segment === 'strategic' ? 1.5 : 0),
      ),
    );
    const noPhone = generatedIndex === 3;
    makeContacts(customer, generatedIndex === 11 ? 28 : contactCount, { noPhone });
    const addressCount = Math.max(
      1,
      Math.round(
        scale.addressesPerCustomer + random.normal(0, 0.6) + (segment === 'strategic' ? 2 : 0),
      ),
    );
    makeAddresses(customer, city, generatedIndex === 5 ? 7 : addressCount, {
      noDefaultShipping: generatedIndex === 4,
    });
    if (random.chance(0.3)) makeNotes(customer, random.int(1, 3));
    if (generatedIndex === 3) dataset.fixtures.set('edge.customer.no_phone', customer.id);
    if (generatedIndex === 4)
      dataset.fixtures.set('edge.customer.no_shipping_address', customer.id);
    if (generatedIndex === 5) dataset.fixtures.set('edge.customer.many_addresses', customer.id);
    if (generatedIndex === 7) dataset.fixtures.set('edge.customer.long_name', customer.id);
    if (generatedIndex === 11) dataset.fixtures.set('edge.customer.many_contacts', customer.id);
    generatedIndex += 1;
  }
  // Edge fixtures must be active customers.
  for (const key of [
    'edge.customer.no_phone',
    'edge.customer.no_shipping_address',
    'edge.customer.many_addresses',
    'edge.customer.long_name',
    'edge.customer.many_contacts',
  ]) {
    const customer = dataset.customers.get(dataset.fixtures.get(key) ?? '');
    if (customer) {
      customer.status = 'active';
      delete customer.holdReason;
      delete customer.metadata.archivedAt;
      if (key === 'edge.customer.long_name') customer.segment = 'enterprise';
    }
  }
  dataset.fixtures.set('edge.customer.on_hold', flagshipCustomerIds.get('cascade') as string);
  dataset.fixtures.set(
    'edge.customer.prospect_accepted_quote',
    flagshipCustomerIds.get('vantage') as string,
  );
  dataset.fixtures.set('flagship.customer.meridian', flagshipCustomerIds.get('meridian') as string);

  // Contract prices for high-value customers.
  const eligible = customerIds.filter((id) => {
    const customer = dataset.customers.get(id) as Customer;
    return (
      customer.status === 'active' &&
      (customer.segment === 'enterprise' || customer.segment === 'strategic' || random.chance(0.05))
    );
  });
  const contractCustomerCount = Math.round(customerIds.length * scale.contractPriceCustomersShare);
  const contractCustomers = new Set([
    flagshipCustomerIds.get('meridian') as string,
    flagshipCustomerIds.get('northstar') as string,
    ...random.sample(eligible, contractCustomerCount),
  ]);
  for (const customerId of contractCustomers) {
    const customer = dataset.customers.get(customerId) as Customer;
    const count = customerId === flagshipCustomerIds.get('meridian') ? 12 : random.int(3, 20);
    const chosen = new Set<string>();
    if (customerId === flagshipCustomerIds.get('meridian'))
      chosen.add(catalog.flagshipSkuIds.get('Servo Motor MX-240') as string);
    while (chosen.size < count) chosen.add(pickDemandSku(random, catalog));
    const prices: ContractPrice[] = [];
    for (const skuId of chosen) {
      const standard = catalog.entriesByList
        .get(
          tenant.priceListIdsByName.get(
            customer.regionCode === 'BR' ? 'Brazil Standard' : 'Standard',
          ) as string,
        )
        ?.get(skuId);
      if (!standard) continue;
      const validFrom = addDays(context.today, -random.int(30, 400));
      const price: ContractPrice = withId({
        id: context.nextId('contractPrice'),
        organizationId: ORGANIZATION_ID,
        customerId,
        skuId,
        currency: customer.preferredCurrency,
        unitPrice: money(
          roundHalfUp(standard.unitPrice.minor * random.float(0.78, 0.92)),
          customer.preferredCurrency,
        ),
        validFrom,
        validTo: addDays(validFrom, random.pick([365, 365, 540, 730])),
        metadata: context.metadata(businessDateToInstant(validFrom, 10), customer.accountOwnerId),
        ...(random.chance(0.4)
          ? { minimumQuantity: quantity(random.pick([5, 10, 25, 50, 100])) }
          : {}),
      });
      dataset.contractPrices.set(price.id, price);
      prices.push(price);
    }
    contractPricesByCustomer.set(customerId, prices);
  }

  // Revenue skew: a small share of customers generate most orders.
  const orderWeightedCustomerIds: string[] = [];
  for (const id of customerIds) {
    const customer = dataset.customers.get(id) as Customer;
    if (customer.status === 'prospect' || customer.status === 'closed') continue;
    const base =
      customer.segment === 'strategic'
        ? 26
        : customer.segment === 'enterprise'
          ? 12
          : customer.segment === 'mid_market'
            ? 4
            : 1;
    const weight = Math.max(
      1,
      Math.round(base * random.logNormal(1, 0.5) * (customer.status === 'inactive' ? 0.15 : 1)),
    );
    for (let index = 0; index < weight; index += 1) orderWeightedCustomerIds.push(id);
  }

  return {
    customerIds,
    orderWeightedCustomerIds,
    flagshipCustomerIds,
    contactsByCustomer,
    addressesByCustomer,
    salesRepsByTeam,
    contractPricesByCustomer,
    cityByCustomer,
  };
}
