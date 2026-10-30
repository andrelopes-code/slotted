import {
  CANONICAL_SEED_INSTANT,
  ORGANIZATION_ID,
  SYSTEM_ACTOR_ID,
  SequenceAllocator,
  addDays,
  businessDateOf,
  type EntityMetadata,
  type IdEntity,
} from '../../domain';
import { createRandom, Random } from '../random';
import type { ScaleProfile } from '../scale';
import { createEmptyDataset, type Dataset } from '../dataset';

export interface SeedContext {
  seed: string;
  scale: ScaleProfile;
  /** Canonical demo instant the seed is built against. */
  now: string;
  /** Business date of `now` in the organization timezone. */
  today: string;
  /** First business date of the logical history. */
  historyStart: string;
  /** First business date of the materialized operational window. */
  operationalStart: string;
  dataset: Dataset;
  sequences: SequenceAllocator;
  random(namespace: string): Random;
  nextId(entity: IdEntity): string;
  metadata(
    createdAt: string,
    createdBy?: string,
    updatedAt?: string,
    updatedBy?: string,
  ): EntityMetadata;
}

export function createSeedContext(
  seed: string,
  scale: ScaleProfile,
  now = CANONICAL_SEED_INSTANT,
): SeedContext {
  const today = businessDateOf(now);
  const sequences = new SequenceAllocator();
  const root = createRandom(seed, 'nexora');
  const dataset = createEmptyDataset(placeholderOrganization(now));
  const context: SeedContext = {
    seed,
    scale,
    now,
    today,
    historyStart: addDays(today, -Math.round(scale.historyMonths * 30.4375)),
    operationalStart: addDays(today, -scale.operationalDays),
    dataset,
    sequences,
    random: (namespace) => root.fork(namespace),
    nextId: (entity) => sequences.nextId(entity),
    metadata(createdAt, createdBy = SYSTEM_ACTOR_ID, updatedAt = createdAt, updatedBy = createdBy) {
      return {
        id: '',
        organizationId: ORGANIZATION_ID,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        version: 1,
      };
    },
  };
  return context;
}

function placeholderOrganization(now: string) {
  return {
    id: ORGANIZATION_ID,
    legalName: '',
    displayName: '',
    industry: '',
    primaryCurrency: 'USD' as const,
    supportedCurrencies: ['USD' as const],
    regions: [],
    timezone: 'America/Chicago' as const,
    fiscalYearStartMonth: 1 as const,
    billingAddress: { line1: '', city: '', region: '', postalCode: '', countryCode: 'US' },
    operationalRegions: [],
    status: 'active' as const,
    metadata: {
      id: ORGANIZATION_ID,
      organizationId: ORGANIZATION_ID,
      createdAt: now,
      createdBy: SYSTEM_ACTOR_ID,
      updatedAt: now,
      updatedBy: SYSTEM_ACTOR_ID,
      version: 1,
    },
  };
}

/** Attaches the entity id to freshly created metadata. */
export function withId<T extends { id: string; metadata: EntityMetadata }>(entity: T): T {
  entity.metadata.id = entity.id;
  return entity;
}
