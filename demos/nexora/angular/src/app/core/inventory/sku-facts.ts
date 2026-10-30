import type { NexoraApi } from '@slotted/demo-nexora-backend';

import type { TransportHealth } from '../backend/transport-health';

/** What a line needs to know about its SKU to be read and typed: its unit and its precision (§53.8). */
export interface SkuFacts {
  readonly unit: string;
  readonly precision: number;
  /** The standard cost, only where the caller holds `cost.view` and asked for it (PM-01). */
  readonly standardCostMinor: number | null;
}

/**
 * A transfer line and a count line name their SKU by code and name only; the
 * unit and the precision are the catalogue's, read for all the lines at once.
 */
export async function readSkuFacts(
  api: NexoraApi,
  health: TransportHealth,
  skuIds: readonly string[],
  withCost = false,
): Promise<ReadonlyMap<string, SkuFacts>> {
  const ids = [...new Set(skuIds)];
  if (ids.length === 0) return new Map();
  const answer = await health.read(
    () => api.catalog.skus({ pageSize: 100, filter: { id: { in: ids } } }),
    null,
  );
  return new Map(
    (answer?.data ?? []).map((sku) => [
      sku.id,
      {
        unit: sku.unitOfMeasure,
        precision: sku.quantityPrecision,
        standardCostMinor: withCost ? sku.standardCost.minor : null,
      },
    ]),
  );
}
