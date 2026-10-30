import {
  AUTOMATION_ACTOR_ID,
  ORGANIZATION_ID,
  REGIONS,
  PERSONAS,
  STAND_IN_PERSONAS,
  ROLE_DEFINITIONS,
  SYSTEM_ACTOR_ID,
  addDays,
  addMinutes,
  businessDateToInstant,
  type Category,
  type CurrencyCode,
  type PermissionScope,
  type RegionCode,
  type PriceList,
  type Role,
  type RoleAssignment,
  type RoleKey,
  type Team,
  type TeamType,
  type User,
  type Warehouse,
  type WarehouseLocation,
} from '../../domain';
import {
  CATEGORY_TREE,
  isLeaf,
  type CategoryDefinition,
  type LeafCategoryDefinition,
} from '../catalog-vocabulary';
import { FIRST_NAMES, LAST_NAMES } from '../vocabulary';
import { BR_FIRST_NAMES, BR_LAST_NAMES } from '../vocabulary-br';
import { withId, type SeedContext } from './context';

export const EMAIL_DOMAIN = 'asteronsupply.com';

interface TeamSpec {
  code: string;
  name: string;
  type: TeamType;
  /** Number of generated members at canonical scale (personas are added on top). */
  size: number;
  warehouseCode?: string;
  regionCode?: RegionCode;
}

const TEAM_SPECS: TeamSpec[] = [
  { code: 'EXEC', name: 'Executive Leadership', type: 'executive', size: 6 },
  { code: 'SALES-C', name: 'Sales — Central', type: 'sales', size: 16 },
  { code: 'SALES-E', name: 'Sales — East', type: 'sales', size: 14 },
  { code: 'SALES-W', name: 'Sales — West', type: 'sales', size: 12 },
  { code: 'SALES-SA', name: 'Strategic Accounts', type: 'sales', size: 8 },
  { code: 'FIN', name: 'Finance & Accounting', type: 'finance', size: 18 },
  { code: 'PROC', name: 'Procurement', type: 'procurement', size: 10 },
  {
    code: 'WH-CHI',
    name: 'Warehouse — Chicago Central',
    type: 'warehouse',
    size: 34,
    warehouseCode: 'CHI-01',
  },
  {
    code: 'WH-DAL',
    name: 'Warehouse — Dallas Distribution',
    type: 'warehouse',
    size: 24,
    warehouseCode: 'DAL-01',
  },
  {
    code: 'WH-ATL',
    name: 'Warehouse — Atlanta Hub',
    type: 'warehouse',
    size: 20,
    warehouseCode: 'ATL-01',
  },
  {
    code: 'WH-DEN',
    name: 'Warehouse — Denver Regional',
    type: 'warehouse',
    size: 14,
    warehouseCode: 'DEN-01',
  },
  {
    code: 'WH-NJ',
    name: 'Warehouse — New Jersey East',
    type: 'warehouse',
    size: 18,
    warehouseCode: 'NJ-01',
  },
  { code: 'SUPPORT', name: 'Customer Support', type: 'support', size: 14 },
  { code: 'SALES-BR', name: 'Sales — Brazil', type: 'sales', size: 8, regionCode: 'BR' },
  {
    code: 'WH-SAO',
    name: 'Warehouse — Seattle',
    type: 'warehouse',
    size: 14,
    warehouseCode: 'SAO-01',
    regionCode: 'BR',
  },
  { code: 'SYS', name: 'Business Systems', type: 'administration', size: 4 },
];

const PERSONA_TEAM: Record<string, string> = {
  'maya-chen': 'SYS',
  'evan-brooks': 'EXEC',
  'sofia-ramirez': 'SALES-C',
  'noah-bennett': 'SALES-C',
  'priya-shah': 'FIN',
  'marcus-lee': 'PROC',
  'jordan-wells': 'WH-CHI',
  'aisha-grant': 'SUPPORT',
  'owen-price': 'FIN',
};

interface WarehouseSpec {
  code: string;
  regionCode: RegionCode;
  countryCode: 'US' | 'BR';
  name: string;
  city: string;
  region: string;
  line1: string;
  postalCode: string;
  timezone: string;
  capacity: number;
}

export const WAREHOUSE_SPECS: WarehouseSpec[] = [
  {
    code: 'CHI-01',
    regionCode: 'US',
    countryCode: 'US',
    name: 'Chicago Central',
    city: 'Chicago',
    region: 'IL',
    line1: '2200 W Pershing Rd',
    postalCode: '60609',
    timezone: 'America/Chicago',
    capacity: 42_000,
  },
  {
    code: 'DAL-01',
    regionCode: 'US',
    countryCode: 'US',
    name: 'Dallas Distribution',
    city: 'Dallas',
    region: 'TX',
    line1: '4801 Irving Blvd',
    postalCode: '75247',
    timezone: 'America/Chicago',
    capacity: 31_000,
  },
  {
    code: 'ATL-01',
    regionCode: 'US',
    countryCode: 'US',
    name: 'Atlanta Hub',
    city: 'Atlanta',
    region: 'GA',
    line1: '1900 Fulton Industrial Blvd SW',
    postalCode: '30336',
    timezone: 'America/New_York',
    capacity: 27_500,
  },
  {
    code: 'DEN-01',
    regionCode: 'US',
    countryCode: 'US',
    name: 'Denver Regional',
    city: 'Denver',
    region: 'CO',
    line1: '5400 E 56th Ave',
    postalCode: '80022',
    timezone: 'America/Denver',
    capacity: 16_000,
  },
  {
    code: 'NJ-01',
    regionCode: 'US',
    countryCode: 'US',
    name: 'New Jersey East',
    city: 'Edison',
    region: 'NJ',
    line1: '90 Raritan Center Pkwy',
    postalCode: '08837',
    timezone: 'America/New_York',
    capacity: 22_000,
  },
  {
    code: 'SAO-01',
    regionCode: 'BR',
    countryCode: 'BR',
    name: 'Seattle Distribution',
    city: 'Tacoma',
    region: 'SP',
    line1: 'Av. Guarulhos, 3100',
    postalCode: '07030-000',
    timezone: 'America/Sao_Paulo',
    capacity: 19_000,
  },
];

export const PRICE_LIST_NAMES = [
  'Standard',
  'SMB',
  'Enterprise',
  'Strategic Accounts',
  'Distributor',
];

/** Brazil region lists priced in BRL; the first is the region's standard list. */
export const BR_PRICE_LIST_NAMES = ['Brazil Standard', 'Brazil Distributor'];

const TITLES_BY_TEAM: Record<TeamType, { lead: string; members: string[] }> = {
  executive: {
    lead: 'Chief Executive Officer',
    members: [
      'Chief Financial Officer',
      'VP Operations',
      'VP Sales',
      'VP Supply Chain',
      'Chief of Staff',
    ],
  },
  sales: {
    lead: 'Regional Sales Manager',
    members: [
      'Account Executive',
      'Senior Account Executive',
      'Inside Sales Representative',
      'Sales Engineer',
      'Account Manager',
    ],
  },
  finance: {
    lead: 'Controller',
    members: [
      'Staff Accountant',
      'Senior Accountant',
      'AR Specialist',
      'Billing Specialist',
      'Credit Analyst',
    ],
  },
  procurement: {
    lead: 'Procurement Manager',
    members: ['Buyer', 'Senior Buyer', 'Sourcing Specialist', 'Supplier Quality Analyst'],
  },
  warehouse: {
    lead: 'Warehouse Manager',
    members: [
      'Warehouse Associate',
      'Forklift Operator',
      'Shipping Clerk',
      'Receiving Clerk',
      'Inventory Control Specialist',
      'Shift Supervisor',
    ],
  },
  support: {
    lead: 'Support Manager',
    members: ['Customer Support Specialist', 'Technical Support Engineer', 'Support Team Lead'],
  },
  administration: {
    lead: 'Head of Business Systems',
    members: ['Systems Administrator', 'Data Analyst', 'IT Support Specialist'],
  },
};

function roleForMember(teamType: TeamType, title: string, index: number): RoleKey {
  switch (teamType) {
    case 'executive':
      return 'executive';
    case 'sales':
      return 'sales_representative';
    case 'finance':
      if (title === 'Credit Analyst') return 'finance_manager';
      return index % 7 === 6 ? 'auditor' : 'accountant';
    case 'procurement':
      return 'buyer';
    case 'warehouse':
      return title === 'Shift Supervisor' ? 'warehouse_manager' : 'warehouse_operator';
    case 'support':
      return title === 'Support Team Lead' ? 'support_manager' : 'support_agent';
    case 'administration':
      return 'administrator';
  }
}

function leadRole(teamType: TeamType): RoleKey {
  switch (teamType) {
    case 'executive':
      return 'executive';
    case 'sales':
      return 'sales_manager';
    case 'finance':
      return 'finance_manager';
    case 'procurement':
      return 'procurement_manager';
    case 'warehouse':
      return 'warehouse_manager';
    case 'support':
      return 'support_manager';
    case 'administration':
      return 'administrator';
  }
}

export interface TenantSeedResult {
  personaUserIds: Map<string, string>;
  roleIdsByKey: Map<RoleKey, string>;
  warehouseIdsByCode: Map<string, string>;
  teamIdsByCode: Map<string, string>;
  priceListIdsByName: Map<string, string>;
  leafCategoryIds: Map<string, string>;
  categoryDefinitions: Map<string, LeafCategoryDefinition>;
  /** Warehouse locations grouped by warehouse id and type. */
  locationsByWarehouse: Map<
    string,
    { storage: string[]; receiving: string; staging: string; quarantine: string; damaged: string }
  >;
}

export function seedTenant(context: SeedContext): TenantSeedResult {
  const { dataset, scale } = context;
  const random = context.random('tenant');
  const foundedAt = businessDateToInstant(addDays(context.today, -365 * 6), 9);

  dataset.organization = withId({
    id: ORGANIZATION_ID,
    legalName: 'Asteron Industrial Supply, Inc.',
    displayName: 'Asteron Industrial Supply',
    industry: 'Industrial Distribution',
    primaryCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'BRL'],
    regions: [...REGIONS],
    timezone: 'America/Chicago',
    fiscalYearStartMonth: 1,
    billingAddress: {
      name: 'Asteron Industrial Supply, Inc.',
      line1: '2200 W Pershing Rd',
      line2: 'Suite 400',
      city: 'Chicago',
      region: 'IL',
      postalCode: '60609',
      countryCode: 'US',
    },
    operationalRegions: ['Midwest', 'South', 'Northeast', 'Mountain'],
    status: 'active',
    metadata: context.metadata(foundedAt),
  });

  // Roles
  const roleIdsByKey = new Map<RoleKey, string>();
  for (const definition of ROLE_DEFINITIONS) {
    const role: Role = withId({
      id: context.nextId('role'),
      organizationId: ORGANIZATION_ID,
      name: definition.name,
      description: definition.description,
      isSystem: true,
      grants: definition.grants,
      metadata: context.metadata(foundedAt),
    });
    dataset.roles.set(role.id, role);
    roleIdsByKey.set(definition.key, role.id);
  }

  // Teams (scaled)
  const teamSpecs = TEAM_SPECS.slice(0, Math.max(3, Math.min(TEAM_SPECS.length, scale.teams)));
  if (!teamSpecs.some((team) => team.code === 'SALES-C')) teamSpecs.push(TEAM_SPECS[1] as TeamSpec);
  const teamIdsByCode = new Map<string, string>();
  for (const spec of teamSpecs) {
    const team: Team = withId({
      id: context.nextId('team'),
      organizationId: ORGANIZATION_ID,
      code: spec.code,
      name: spec.name,
      type: spec.type,
      status: 'active',
      metadata: context.metadata(foundedAt),
    });
    dataset.teams.set(team.id, team);
    teamIdsByCode.set(spec.code, team.id);
  }

  // Warehouses (managers assigned after users exist)
  const warehouseIdsByCode = new Map<string, string>();
  const warehouseSpecs = WAREHOUSE_SPECS.slice(0, scale.warehouses);
  for (const spec of warehouseSpecs) {
    const warehouse: Warehouse = withId({
      id: context.nextId('warehouse'),
      organizationId: ORGANIZATION_ID,
      regionCode: spec.regionCode,
      code: spec.code,
      name: spec.name,
      address: {
        name: `Asteron ${spec.name}`,
        line1: spec.line1,
        city: spec.city,
        region: spec.region,
        postalCode: spec.postalCode,
        countryCode: spec.countryCode,
      },
      managerId: SYSTEM_ACTOR_ID,
      timezone: spec.timezone,
      capacityCubicMeters: spec.capacity,
      status: 'operational',
      metadata: context.metadata(foundedAt),
    });
    dataset.warehouses.set(warehouse.id, warehouse);
    warehouseIdsByCode.set(spec.code, warehouse.id);
  }

  // Users: system actors, personas, then generated members per team.
  const usedEmails = new Set<string>();
  const personaUserIds = new Map<string, string>();
  const teamLeadIds = new Map<string, string>();
  const userTeam = new Map<string, string>();
  const userRole = new Map<string, RoleKey>();

  const createUser = (
    firstName: string,
    lastName: string,
    teamCode: string,
    title: string,
    role: RoleKey,
    status: User['status'],
    createdAt: string,
  ): User => {
    const spec = teamSpecs.find((team) => team.code === teamCode) ?? (teamSpecs[0] as TeamSpec);
    let email = `${firstName}.${lastName}@${EMAIL_DOMAIN}`
      .toLowerCase()
      .replace(/[^a-z0-9.@]/g, '');
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = `${firstName}.${lastName}${suffix}@${EMAIL_DOMAIN}`
        .toLowerCase()
        .replace(/[^a-z0-9.@]/g, '');
      suffix += 1;
    }
    usedEmails.add(email);
    const warehouseTimezone = spec.warehouseCode
      ? (WAREHOUSE_SPECS.find((warehouse) => warehouse.code === spec.warehouseCode)?.timezone ??
        'America/Chicago')
      : 'America/Chicago';
    const user: User = withId({
      id: context.nextId('user'),
      organizationId: ORGANIZATION_ID,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      email,
      title,
      department: spec.name,
      status,
      locale: 'en-US',
      timezone: warehouseTimezone,
      notificationPreferences: {
        emailApprovals: random.chance(0.7),
        emailMentions: random.chance(0.5),
        inAppApprovals: true,
        inAppMentions: true,
        inAppOperationalAlerts: random.chance(0.8),
      },
      metadata: context.metadata(createdAt),
    });
    if (status === 'active') {
      user.lastActiveAt = addMinutes(context.now, -random.int(5, 60 * 24 * 6));
      if (random.chance(0.35))
        user.avatarUrl = `https://i.pravatar.cc/128?u=${encodeURIComponent(user.id)}`;
    }
    dataset.users.set(user.id, user);
    userTeam.set(user.id, teamCode);
    userRole.set(user.id, role);
    return user;
  };

  // System actors are reserved ids outside the usr_ sequence.
  for (const [id, name] of [
    [SYSTEM_ACTOR_ID, 'Nexora System'],
    [AUTOMATION_ACTOR_ID, 'Workflow Automation'],
  ] as const) {
    const [firstName, lastName] = name.split(' ') as [string, string];
    const user: User = withId({
      id,
      organizationId: ORGANIZATION_ID,
      firstName,
      lastName,
      displayName: name,
      email: `${id.replace('usr_', '')}@${EMAIL_DOMAIN}`,
      title: 'System actor',
      department: 'Business Systems',
      status: 'active',
      locale: 'en-US',
      timezone: 'America/Chicago',
      notificationPreferences: {
        emailApprovals: false,
        emailMentions: false,
        inAppApprovals: true,
        inAppMentions: true,
        inAppOperationalAlerts: false,
      },
      metadata: context.metadata(foundedAt),
    });
    dataset.users.set(user.id, user);
  }

  for (const persona of PERSONAS) {
    const teamCode = PERSONA_TEAM[persona.key] ?? 'SALES-C';
    const user = createUser(
      persona.firstName,
      persona.lastName,
      teamIdsByCode.has(teamCode) ? teamCode : 'SALES-C',
      persona.title,
      persona.role,
      'active',
      addDays(foundedAt, random.int(30, 900)),
    );
    personaUserIds.set(persona.key, user.id);
    if (persona.key === 'sofia-ramirez') teamLeadIds.set('SALES-C', user.id);
    if (persona.key === 'priya-shah') teamLeadIds.set('FIN', user.id);
    if (persona.key === 'maya-chen') teamLeadIds.set('SYS', user.id);
    if (persona.key === 'evan-brooks') teamLeadIds.set('EXEC', user.id);
  }

  const generatedTarget = Math.max(0, scale.users - PERSONAS.length);
  const totalSpecSize = teamSpecs.reduce((sum, team) => sum + team.size, 0);
  const statusPlan: User['status'][] = [];
  const invited = Math.round(generatedTarget * (20 / 205));
  const suspended = Math.round(generatedTarget * (10 / 205));
  const deactivated = Math.round(generatedTarget * (5 / 205));
  for (let index = 0; index < generatedTarget; index += 1) {
    statusPlan.push(
      index < invited
        ? 'invited'
        : index < invited + suspended
          ? 'suspended'
          : index < invited + suspended + deactivated
            ? 'deactivated'
            : 'active',
    );
  }
  const statuses = random.shuffle(statusPlan);
  let statusCursor = 0;
  for (const spec of teamSpecs) {
    const share = Math.round((spec.size / totalSpecSize) * generatedTarget);
    const titles = TITLES_BY_TEAM[spec.type];
    for (let index = 0; index < share && statusCursor < statuses.length; index += 1) {
      const isLead = !teamLeadIds.has(spec.code) && index === 0;
      const title = isLead ? titles.lead : random.pick(titles.members);
      const status = isLead ? 'active' : (statuses[statusCursor++] as User['status']);
      const user = createUser(
        random.pick(spec.regionCode === 'BR' ? BR_FIRST_NAMES : FIRST_NAMES),
        random.pick(spec.regionCode === 'BR' ? BR_LAST_NAMES : LAST_NAMES),
        spec.code,
        title,
        isLead ? leadRole(spec.type) : roleForMember(spec.type, title, index),
        status,
        addDays(foundedAt, random.int(0, 2_000)),
      );
      if (isLead) teamLeadIds.set(spec.code, user.id);
    }
  }
  // Guarantee a lead per team even at small scales.
  for (const spec of teamSpecs) {
    if (teamLeadIds.has(spec.code)) continue;
    const user = createUser(
      random.pick(spec.regionCode === 'BR' ? BR_FIRST_NAMES : FIRST_NAMES),
      random.pick(spec.regionCode === 'BR' ? BR_LAST_NAMES : LAST_NAMES),
      spec.code,
      TITLES_BY_TEAM[spec.type].lead,
      leadRole(spec.type),
      'active',
      foundedAt,
    );
    teamLeadIds.set(spec.code, user.id);
  }

  // Managers, memberships and role assignments.
  const executiveLead = teamLeadIds.get('EXEC');
  for (const user of dataset.users.values()) {
    const teamCode = userTeam.get(user.id);
    if (!teamCode) continue;
    const leadId = teamLeadIds.get(teamCode);
    if (leadId && leadId !== user.id) user.managerId = leadId;
    else if (executiveLead && executiveLead !== user.id) user.managerId = executiveLead;
    const teamId = teamIdsByCode.get(teamCode);
    if (teamId)
      dataset.teamMemberships.push({ teamId, userId: user.id, isLead: leadId === user.id });
    const role = userRole.get(user.id) as RoleKey;
    const spec = teamSpecs.find((team) => team.code === teamCode) as TeamSpec;
    const scope: PermissionScope =
      role === 'warehouse_manager' || role === 'warehouse_operator'
        ? {
            type: 'warehouse',
            warehouseIds: [
              warehouseIdsByCode.get(spec.warehouseCode ?? 'CHI-01') ??
                (warehouseIdsByCode.values().next().value as string),
            ],
          }
        : role === 'sales_representative'
          ? { type: 'own' }
          : { type: 'all' };
    const assignment: RoleAssignment = {
      id: context.nextId('roleAssignment'),
      organizationId: ORGANIZATION_ID,
      userId: user.id,
      roleId: roleIdsByKey.get(role) as string,
      scope,
      createdAt: user.metadata.createdAt,
      createdBy: SYSTEM_ACTOR_ID,
    };
    dataset.roleAssignments.set(assignment.id, assignment);
  }

  for (const spec of warehouseSpecs) {
    const warehouse = dataset.warehouses.get(
      warehouseIdsByCode.get(spec.code) as string,
    ) as Warehouse;
    const teamCode = teamSpecs.find((team) => team.warehouseCode === spec.code)?.code;
    warehouse.managerId =
      (teamCode && teamLeadIds.get(teamCode)) || (teamLeadIds.get('EXEC') as string);
  }

  // Warehouse locations
  const locationsByWarehouse: TenantSeedResult['locationsByWarehouse'] = new Map();
  for (const warehouse of dataset.warehouses.values()) {
    const special = { receiving: '', staging: '', quarantine: '', damaged: '' };
    const storage: string[] = [];
    const addLocation = (
      code: string,
      zone: string,
      type: WarehouseLocation['type'],
      extra: Partial<WarehouseLocation> = {},
    ): string => {
      const location: WarehouseLocation = withId({
        id: context.nextId('warehouseLocation'),
        organizationId: ORGANIZATION_ID,
        warehouseId: warehouse.id,
        code,
        zone,
        type,
        status: 'active',
        metadata: context.metadata(foundedAt),
        ...extra,
      });
      dataset.warehouseLocations.set(location.id, location);
      return location.id;
    };
    special.receiving = addLocation('RECEIVING', 'DOCK', 'receiving');
    special.staging = addLocation('STAGING', 'DOCK', 'staging');
    special.quarantine = addLocation('QUARANTINE', 'QC', 'quarantine');
    special.damaged = addLocation('DAMAGED', 'QC', 'damaged');
    const zones = warehouse.capacityCubicMeters > 30_000 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];
    for (const zone of zones) {
      for (let aisle = 1; aisle <= 6; aisle += 1) {
        for (let rack = 1; rack <= 3; rack += 1) {
          const code = `${zone}-${String(aisle).padStart(2, '0')}-${rack}`;
          const blocked = random.chance(0.015);
          const id = addLocation(code, zone, 'storage', {
            aisle: String(aisle).padStart(2, '0'),
            rack: String(rack),
            bin: `${zone}${aisle}${rack}`,
            capacityCubicMeters: random.int(18, 48),
            status: blocked ? 'blocked' : 'active',
          });
          if (!blocked) storage.push(id);
        }
      }
    }
    locationsByWarehouse.set(warehouse.id, { storage, ...special });
  }

  // Price lists
  const priceListIdsByName = new Map<string, string>();
  const listSpecs: [string, RegionCode, CurrencyCode][] = [
    ...PRICE_LIST_NAMES.map((name): [string, RegionCode, CurrencyCode] => [name, 'US', 'USD']),
    ...(scale.warehouses > 5
      ? BR_PRICE_LIST_NAMES.map((name): [string, RegionCode, CurrencyCode] => [name, 'BR', 'BRL'])
      : []),
  ];
  for (const [name, regionCode, currency] of listSpecs) {
    const priceList: PriceList = withId({
      id: context.nextId('priceList'),
      organizationId: ORGANIZATION_ID,
      regionCode,
      name,
      currency,
      status: 'active',
      metadata: context.metadata(foundedAt),
    });
    dataset.priceLists.set(priceList.id, priceList);
    priceListIdsByName.set(name, priceList.id);
  }

  // Categories
  const leafCategoryIds = new Map<string, string>();
  const categoryDefinitions = new Map<string, LeafCategoryDefinition>();
  let sortOrder = 0;
  const slugOf = (name: string): string =>
    name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const walk = (
    node: CategoryDefinition | LeafCategoryDefinition,
    parentId: string | undefined,
    path: string,
  ): void => {
    sortOrder += 1;
    const category: Category = withId({
      id: context.nextId('category'),
      organizationId: ORGANIZATION_ID,
      name: node.name,
      slug: slugOf(path ? `${path}-${node.name}` : node.name),
      status: 'active',
      sortOrder,
      metadata: context.metadata(foundedAt),
      ...(parentId ? { parentId } : {}),
    });
    dataset.categories.set(category.id, category);
    if (isLeaf(node)) {
      leafCategoryIds.set(node.name, category.id);
      categoryDefinitions.set(category.id, node);
      return;
    }
    for (const child of node.children) walk(child, category.id, node.name);
  };
  for (const root of CATEGORY_TREE) walk(root, undefined, '');

  // The stand-ins: the team's lead where it holds the role and is active, else an active holder
  // in the team, else any active holder — never one of the nine personas, whose role is already
  // theirs: a stand-in decides what a persona asked for, and a requester never decides (§67.4).
  const personaIds = new Set(personaUserIds.values());
  for (const standIn of STAND_IN_PERSONAS) {
    const holds = (userId: string | undefined): userId is string =>
      userId !== undefined &&
      !personaIds.has(userId) &&
      userRole.get(userId) === standIn.role &&
      dataset.users.get(userId)?.status === 'active';
    const lead = teamLeadIds.get(standIn.teamCode);
    const members = [...userRole.keys()];
    const userId = holds(lead)
      ? lead
      : (members.find(
          (candidate) => userTeam.get(candidate) === standIn.teamCode && holds(candidate),
        ) ?? members.find((candidate) => holds(candidate)));
    if (userId !== undefined) personaUserIds.set(standIn.key, userId);
  }

  return {
    personaUserIds,
    roleIdsByKey,
    warehouseIdsByCode,
    teamIdsByCode,
    priceListIdsByName,
    leafCategoryIds,
    categoryDefinitions,
    locationsByWarehouse,
  };
}
