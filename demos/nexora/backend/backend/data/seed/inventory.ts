import {
  ORGANIZATION_ID,
  addDays,
  addMs,
  businessDateOf,
  businessDateToInstant,
  compareDates,
  diffDays,
  formatBusinessNumber,
  formatId,
  milliToQuantity,
  quantity,
  quantityToMilli,
  type AdjustmentReasonCode,
  type CycleCount,
  type CycleCountLine,
  type InventoryTransfer,
  type InventoryTransferLine,
  type Sku,
  type StockMovement,
} from '../../domain';
import type { CatalogSeedResult } from './catalog';
import type { SeedContext } from './context';
import { instantOn, metadataAt, nextBusinessDayOnOrAfter } from './orders';
import type { ProcurementSeedResult } from './procurement';
import type { TenantSeedResult } from './tenant';

export interface InventorySeedResult {
  /** Opening on-hand (milli) by `${skuId}:${warehouseId}` at the window start. */
  openingMilli: Map<string, number>;
  /** SKUs whose available quantity is deliberately at or below zero with inbound supply. */
  shortageSkuIds: string[];
}

interface Position {
  shipped: number;
  received: number;
  returned: number;
  reserved: number;
}

export function seedInventory(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
  procurement: ProcurementSeedResult,
  options: { forcedShortages?: Map<string, number> } = {},
): InventorySeedResult {
  const { dataset, today, operationalStart } = context;
  const random = context.random('inventory');
  const positions = new Map<string, Position>();
  const position = (key: string): Position => {
    let entry = positions.get(key);
    if (!entry) {
      entry = { shipped: 0, received: 0, returned: 0, reserved: 0 };
      positions.set(key, entry);
    }
    return entry;
  };
  for (const movement of dataset.stockMovements.values()) {
    const key = `${movement.skuId}:${movement.warehouseId}`;
    const delta = quantityToMilli(movement.onHandDelta);
    if (movement.type === 'shipment') position(key).shipped += -delta;
    else if (movement.type === 'receipt') position(key).received += delta;
    else if (movement.type === 'customer_return') position(key).returned += delta;
  }
  for (const reservation of dataset.reservations.values()) {
    if (reservation.status !== 'active') continue;
    position(`${reservation.skuId}:${reservation.warehouseId}`).reserved +=
      quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
  }

  const warehouses = [...dataset.warehouses.values()];
  const primaryWarehouse = tenant.warehouseIdsByCode.get('CHI-01') ?? (warehouses[0]?.id as string);
  const windowDays = Math.max(1, diffDays(today, operationalStart));
  const openingMilli = new Map<string, number>();
  const shortageSkuIds: string[] = [];
  const openingAt = businessDateToInstant(operationalStart, 6);
  const systemActor = 'usr_system';
  let openingCounter = 0;

  const stockIn = (
    skuId: string,
    warehouseId: string,
    milli: number,
    locationId: string | undefined,
  ): void => {
    if (milli <= 0) return;
    openingCounter += 1;
    const movement: StockMovement = {
      id: formatId('stockMovement', 80_000_000 + openingCounter),
      organizationId: ORGANIZATION_ID,
      type: 'receipt',
      skuId,
      warehouseId,
      onHandDelta: milliToQuantity(milli),
      damagedDelta: '0',
      quarantineDelta: '0',
      sourceEntityType: 'opening_balance',
      sourceEntityId: `opening:${operationalStart}`,
      reason: 'Opening balance at demo window start',
      occurredAt: openingAt,
      actorId: systemActor,
      ...(locationId ? { locationId } : {}),
    };
    dataset.stockMovements.set(movement.id, movement);
    openingMilli.set(
      `${skuId}:${warehouseId}`,
      (openingMilli.get(`${skuId}:${warehouseId}`) ?? 0) + milli,
    );
  };

  const forced = options.forcedShortages ?? new Map<string, number>();
  const skus = [...dataset.skus.values()];
  const demandRank = new Map<string, number>();
  for (const [rank, skuId] of catalog.skuIds.entries()) demandRank.set(skuId, rank);

  for (const sku of skus) {
    if (sku.status === 'discontinued' && random.chance(0.7)) continue;
    const unitScale =
      sku.unitOfMeasure === 'FT' || sku.unitOfMeasure === 'M'
        ? 100
        : sku.unitOfMeasure === 'PK'
          ? 4
          : 1;
    const rank = demandRank.get(sku.id) ?? skus.length;
    const stockedWarehouses = new Set<string>();
    for (const warehouse of warehouses) {
      const key = `${sku.id}:${warehouse.id}`;
      const activity = positions.get(key);
      if (activity && (activity.shipped > 0 || activity.reserved > 0 || activity.received > 0))
        stockedWarehouses.add(warehouse.id);
    }
    if (stockedWarehouses.size === 0) {
      // Stock the primary warehouse for most active SKUs, and a second site for popular ones.
      if (rank < skus.length * 0.6 || random.chance(0.5)) stockedWarehouses.add(primaryWarehouse);
      if (rank < skus.length * 0.15 && random.chance(0.6))
        stockedWarehouses.add(random.pick(warehouses).id);
    } else if (rank < skus.length * 0.1 && random.chance(0.35)) {
      stockedWarehouses.add(random.pick(warehouses).id);
    }
    for (const warehouseId of stockedWarehouses) {
      const key = `${sku.id}:${warehouseId}`;
      const activity = positions.get(key) ?? { shipped: 0, received: 0, returned: 0, reserved: 0 };
      const dailyDemand = activity.shipped / windowDays;
      const coverDays = random.float(12, 60);
      const reorderPoint = sku.reorderPolicy.reorderPoint
        ? quantityToMilli(sku.reorderPolicy.reorderPoint)
        : 5_000 * unitScale;
      let buffer =
        Math.round(dailyDemand * coverDays) +
        (activity.shipped === 0
          ? Math.round(random.logNormal(reorderPoint * 1.5, 0.6))
          : Math.round(reorderPoint * random.float(0.2, 1.2)));
      // Low-stock tail: a share of positions sit at or below the reorder point.
      if (random.chance(0.07)) buffer = Math.round(reorderPoint * random.float(0, 0.6));
      const forcedShortage = forced.get(key);
      let opening =
        activity.shipped - activity.received - activity.returned + activity.reserved + buffer;
      if (forcedShortage !== undefined) {
        opening =
          activity.shipped -
          activity.received -
          activity.returned +
          activity.reserved -
          forcedShortage;
        shortageSkuIds.push(sku.id);
      } else if (random.chance(0.006) && (procurement.inboundMilli.get(key) ?? 0) > 0) {
        opening = activity.shipped - activity.received - activity.returned + activity.reserved;
        shortageSkuIds.push(sku.id);
      }
      opening = Math.max(0, Math.round(opening / (1_000 / unitScale)) * (1_000 / unitScale));
      const location = tenant.locationsByWarehouse.get(warehouseId);
      stockIn(sku.id, warehouseId, opening, location ? random.pick(location.storage) : undefined);
    }
  }

  seedAdjustments(context, tenant, random.fork('adjustments'));
  seedTransfers(context, tenant, random.fork('transfers'), openingMilli);
  seedCycleCounts(context, tenant, random.fork('cycle-counts'), openingMilli);

  return { openingMilli, shortageSkuIds };
}

function warehouseActors(context: SeedContext, warehouseId: string, fallback: string): string[] {
  const actors: string[] = [];
  for (const assignment of context.dataset.roleAssignments.values()) {
    if (
      assignment.scope.type !== 'warehouse' ||
      !assignment.scope.warehouseIds.includes(warehouseId)
    )
      continue;
    if (context.dataset.users.get(assignment.userId)?.status === 'active')
      actors.push(assignment.userId);
  }
  return actors.length > 0 ? actors : [fallback];
}

function seedAdjustments(
  context: SeedContext,
  tenant: TenantSeedResult,
  random: ReturnType<SeedContext['random']>,
): void {
  const { dataset, today, operationalStart } = context;
  const fallback = tenant.personaUserIds.get('jordan-wells') as string;
  const stocked = [...dataset.stockMovements.values()].filter(
    (movement) => movement.sourceEntityType === 'opening_balance',
  );
  const count = Math.min(stocked.length, Math.round(diffDays(today, operationalStart) * 0.6));
  const reasons: AdjustmentReasonCode[] = [
    'count_correction',
    'damage',
    'found_stock',
    'data_correction',
    'other',
  ];
  for (let index = 0; index < count; index += 1) {
    const source = random.pick(stocked);
    const sku = dataset.skus.get(source.skuId) as Sku;
    const date = addDays(
      operationalStart,
      random.int(1, Math.max(1, diffDays(today, operationalStart))),
    );
    const reason = random.pick(reasons);
    const magnitude = Math.max(1, Math.round(random.logNormal(3, 0.8)));
    const positive = reason === 'found_stock' || (reason !== 'damage' && random.chance(0.45));
    const actor = random.pick(warehouseActors(context, source.warehouseId, fallback));
    const movement: StockMovement = {
      id: formatId('stockMovement', 90_000_000 + index + 1),
      organizationId: ORGANIZATION_ID,
      type: reason === 'damage' ? 'damage' : positive ? 'adjustment_in' : 'adjustment_out',
      skuId: sku.id,
      warehouseId: source.warehouseId,
      onHandDelta:
        reason === 'damage'
          ? '0'
          : quantity(positive ? magnitude : -magnitude, sku.quantityPrecision),
      damagedDelta: reason === 'damage' ? quantity(magnitude, sku.quantityPrecision) : '0',
      quarantineDelta: '0',
      sourceEntityType: 'manual_adjustment',
      sourceEntityId: `adj:${index + 1}`,
      reason: `${reason}: ${random.pick(['Cycle count variance corrected', 'Damaged during put-away', 'Located in overflow bin', 'Receipt keyed to wrong SKU', 'Customer sample pulled', 'Water damage at dock', 'Found during reslotting'])}`,
      occurredAt: instantOn(date, random, 7, 18),
      actorId: actor,
      ...(source.locationId ? { locationId: source.locationId } : {}),
    };
    dataset.stockMovements.set(movement.id, movement);
  }
}

function seedTransfers(
  context: SeedContext,
  tenant: TenantSeedResult,
  random: ReturnType<SeedContext['random']>,
  openingMilli: Map<string, number>,
): void {
  const { dataset, today, operationalStart } = context;
  const warehouses = [...dataset.warehouses.values()];
  if (warehouses.length < 2) return;
  const fallback = tenant.personaUserIds.get('jordan-wells') as string;
  const stockedKeys = [...openingMilli.entries()]
    .filter(([, milli]) => milli >= 20_000)
    .map(([key]) => key);
  if (stockedKeys.length === 0) return;
  const count = Math.round(diffDays(today, operationalStart) * 0.35);
  for (let index = 0; index < count; index += 1) {
    const sourceKey = random.pick(stockedKeys);
    const [skuId, sourceWarehouseId] = sourceKey.split(':') as [string, string];
    const destination = random.pick(
      warehouses.filter((warehouse) => warehouse.id !== sourceWarehouseId),
    );
    if (!destination) continue;
    const requestedDate = addDays(
      operationalStart,
      random.int(0, Math.max(1, diffDays(today, operationalStart))),
    );
    const age = diffDays(today, requestedDate);
    const requestedBy = random.pick(warehouseActors(context, sourceWarehouseId, fallback));
    const createdAt = instantOn(requestedDate, random);
    const stages: InventoryTransfer['status'][] = ['draft', 'ready', 'in_transit', 'received'];
    const stage = Math.min(3, Math.floor(age / 2) + (random.chance(0.5) ? 1 : 0));
    let status = stages[stage] as InventoryTransfer['status'];
    if (random.chance(0.04)) status = 'cancelled';
    if (status === 'received' && random.chance(0.12)) status = 'partially_received';
    const transferId = formatId('transfer', index + 1);
    const lineCount = random.int(1, 4);
    const skuIds = new Set<string>([skuId]);
    while (skuIds.size < lineCount) {
      const key = random.pick(stockedKeys);
      if (key.endsWith(`:${sourceWarehouseId}`)) skuIds.add(key.split(':')[0] as string);
      else break;
    }
    const shippedAt =
      stage >= 2 && status !== 'cancelled'
        ? instantOn(addDays(requestedDate, 1), random)
        : undefined;
    const receivedAt =
      stage >= 3 && status !== 'cancelled'
        ? instantOn(addDays(requestedDate, random.int(2, 5)), random)
        : undefined;
    const transfer: InventoryTransfer = {
      id: transferId,
      organizationId: ORGANIZATION_ID,
      transferNumber: formatBusinessNumber('transfer', 3_000 + index + 1),
      sourceWarehouseId,
      destinationWarehouseId: destination.id,
      status,
      requestedBy,
      requestedDate,
      metadata: metadataAt(
        createdAt,
        requestedBy,
        receivedAt ?? shippedAt ?? createdAt,
        requestedBy,
        1 + stage,
      ),
      ...(shippedAt ? { shippedAt } : {}),
      ...(receivedAt ? { receivedAt } : {}),
      ...(random.chance(0.3)
        ? {
            notes: random.pick([
              'Rebalance for regional demand.',
              'Backorder relief for east-coast customers.',
              'Consolidating slow movers.',
              'Requested by branch manager.',
            ]),
          }
        : {}),
    };
    dataset.transfers.set(transferId, transfer);
    let lineNumber = 0;
    for (const lineSku of skuIds) {
      lineNumber += 1;
      const sku = dataset.skus.get(lineSku) as Sku;
      const requested = Math.max(1, Math.round(random.logNormal(12, 0.7)));
      const shipped = shippedAt ? requested : 0;
      const damaged = receivedAt && random.chance(0.08) ? 1 : 0;
      const received = receivedAt
        ? status === 'partially_received'
          ? Math.max(0, shipped - random.int(1, Math.max(1, shipped - 1)))
          : shipped
        : 0;
      const line: InventoryTransferLine = {
        id: formatId('transferLine', index * 10 + lineNumber),
        organizationId: ORGANIZATION_ID,
        transferId,
        lineNumber,
        skuId: lineSku,
        requestedQuantity: quantity(requested, sku.quantityPrecision),
        shippedQuantity: quantity(shipped, sku.quantityPrecision),
        receivedQuantity: quantity(received, sku.quantityPrecision),
        damagedQuantity: quantity(damaged, sku.quantityPrecision),
      };
      dataset.transferLines.set(line.id, line);
      if (shippedAt) {
        dataset.stockMovements.set(`mov_t${index}_${lineNumber}_out`, {
          id: `mov_t${index}_${lineNumber}_out`,
          organizationId: ORGANIZATION_ID,
          type: 'transfer_out',
          skuId: lineSku,
          warehouseId: sourceWarehouseId,
          onHandDelta: quantity(-shipped, sku.quantityPrecision),
          damagedDelta: '0',
          quarantineDelta: '0',
          sourceEntityType: 'transfer',
          sourceEntityId: transferId,
          occurredAt: shippedAt,
          actorId: requestedBy,
        });
      }
      if (receivedAt && received > 0) {
        dataset.stockMovements.set(`mov_t${index}_${lineNumber}_in`, {
          id: `mov_t${index}_${lineNumber}_in`,
          organizationId: ORGANIZATION_ID,
          type: 'transfer_in',
          skuId: lineSku,
          warehouseId: destination.id,
          onHandDelta: quantity(received, sku.quantityPrecision),
          damagedDelta: quantity(damaged, sku.quantityPrecision),
          quarantineDelta: '0',
          sourceEntityType: 'transfer',
          sourceEntityId: transferId,
          occurredAt: receivedAt,
          actorId: random.pick(warehouseActors(context, destination.id, fallback)),
        });
      }
    }
  }
}

function seedCycleCounts(
  context: SeedContext,
  tenant: TenantSeedResult,
  random: ReturnType<SeedContext['random']>,
  openingMilli: Map<string, number>,
): void {
  const { dataset, today, operationalStart } = context;
  const fallback = tenant.personaUserIds.get('jordan-wells') as string;
  const byWarehouse = new Map<string, string[]>();
  for (const key of openingMilli.keys()) {
    const [skuId, warehouseId] = key.split(':') as [string, string];
    const bucket = byWarehouse.get(warehouseId) ?? [];
    bucket.push(skuId);
    byWarehouse.set(warehouseId, bucket);
  }
  const count = Math.round(diffDays(today, operationalStart) * 0.2);
  for (let index = 0; index < count; index += 1) {
    const warehouseId = random.pick([...byWarehouse.keys()]);
    const skus = byWarehouse.get(warehouseId) ?? [];
    if (skus.length === 0) continue;
    const plannedDate = nextBusinessDayOnOrAfter(
      addDays(operationalStart, random.int(0, Math.max(1, diffDays(today, operationalStart) + 10))),
    );
    const age = diffDays(today, plannedDate);
    const actors = warehouseActors(context, warehouseId, fallback);
    let status: CycleCount['status'] =
      age < 0
        ? 'planned'
        : age === 0
          ? 'in_progress'
          : age <= 2
            ? random.pick(['in_progress', 'submitted'])
            : 'completed';
    if (age > 2 && random.chance(0.05)) status = 'cancelled';
    const createdAt = instantOn(addDays(plannedDate, -random.int(1, 7)), random);
    const startedAt =
      status !== 'planned' && status !== 'cancelled'
        ? instantOn(plannedDate, random, 7, 9)
        : undefined;
    const submittedAt =
      status === 'submitted' || status === 'completed'
        ? addMs(startedAt as string, random.int(2, 7) * 3_600_000)
        : undefined;
    const completedAt =
      status === 'completed'
        ? addMs(submittedAt as string, random.int(1, 30) * 3_600_000)
        : undefined;
    const cycleCountId = formatId('cycleCount', index + 1);
    const cycleCount: CycleCount = {
      id: cycleCountId,
      organizationId: ORGANIZATION_ID,
      cycleCountNumber: formatBusinessNumber('cycleCount', 1_100 + index + 1),
      warehouseId,
      status,
      assignedToIds: random.sample(actors, Math.min(actors.length, random.int(1, 2))),
      plannedDate,
      metadata: metadataAt(
        createdAt,
        actors[0] as string,
        completedAt ?? submittedAt ?? startedAt ?? createdAt,
        actors[0] as string,
        status === 'completed' ? 4 : status === 'submitted' ? 3 : startedAt ? 2 : 1,
      ),
      ...(startedAt ? { startedAt } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(completedAt ? { completedAt } : {}),
    };
    dataset.cycleCounts.set(cycleCountId, cycleCount);
    const locations = tenant.locationsByWarehouse.get(warehouseId);
    for (const [position, skuId] of random.sample(skus, random.int(4, 14)).entries()) {
      const sku = dataset.skus.get(skuId) as Sku;
      const systemOnHand = openingMilli.get(`${skuId}:${warehouseId}`) ?? 0;
      const varianceMilli =
        startedAt && random.chance(0.22) ? random.pick([-3, -2, -1, 1, 2]) * 1000 : 0;
      const line: CycleCountLine = {
        id: formatId('cycleCountLine', index * 20 + position + 1),
        organizationId: ORGANIZATION_ID,
        cycleCountId,
        skuId,
        locationId: locations ? random.pick(locations.storage) : '',
        systemOnHand: milliToQuantity(systemOnHand, sku.quantityPrecision),
        ...(startedAt
          ? {
              countedOnHand: milliToQuantity(
                Math.max(0, systemOnHand + varianceMilli),
                sku.quantityPrecision,
              ),
              variance: milliToQuantity(varianceMilli, sku.quantityPrecision),
            }
          : {}),
      };
      dataset.cycleCountLines.set(line.id, line);
      if (status === 'completed' && varianceMilli !== 0) {
        dataset.stockMovements.set(`mov_c${index}_${position}`, {
          id: `mov_c${index}_${position}`,
          organizationId: ORGANIZATION_ID,
          type: 'cycle_count_adjustment',
          skuId,
          warehouseId,
          locationId: line.locationId,
          onHandDelta: milliToQuantity(varianceMilli, sku.quantityPrecision),
          damagedDelta: '0',
          quarantineDelta: '0',
          sourceEntityType: 'cycle_count',
          sourceEntityId: cycleCountId,
          occurredAt: completedAt as string,
          actorId: cycleCount.assignedToIds[0] as string,
        });
      }
    }
  }
  void businessDateOf;
  void compareDates;
}
