import {
  ORGANIZATION_ID,
  addBusinessDays,
  addDays,
  addMs,
  businessDateOf,
  compareDates,
  diffDays,
  evaluatePurchaseOrderApproval,
  formatBusinessNumber,
  formatId,
  milliToQuantity,
  quantity,
  quantityToMilli,
  roundHalfUp,
  money,
  FX_RATES_TO_USD,
  type ApprovalRequest,
  type GoodsReceipt,
  type GoodsReceiptLine,
  type PurchaseOrder,
  type PurchaseOrderLine,
  type Sku,
  type StockMovement,
  type Supplier,
  type SupplierSkuMapping,
  type Warehouse,
} from '../../domain';
import type { Random } from '../random';
import { PO_NOTES_LONG } from '../corpora';
import type { SeedContext } from './context';
import { instantOn, metadataAt, nextBusinessDayOnOrAfter } from './orders';
import { dailyVolumeFactor } from './timeline';
import type { TenantSeedResult } from './tenant';

export interface PurchaseOrderOverride {
  supplierId?: string;
  warehouseId?: string;
  skuIds?: string[];
  quantities?: number[];
  status?: PurchaseOrder['status'];
  expectedDate?: string;
  delayed?: boolean;
  receiptPlan?: { fraction: number; damagedFraction?: number; daysAfterExpected?: number }[];
  notes?: string;
}

export interface ProcurementSeedResult {
  /** Open inbound quantity (milli) by `${skuId}:${warehouseId}`. */
  inboundMilli: Map<string, number>;
  purchaseOrderCount: number;
}

interface PurchaseOrderSkeleton {
  index: number;
  createdDate: string;
  supplierId: string;
  warehouseId: string;
  buyerId: string;
}

export interface ExtraPurchaseOrder extends PurchaseOrderOverride {
  createdDaysAgo: number;
  fixtureKey?: string;
}

/** The first business date from which every purchase order of the tenant is materialized. */
export function purchaseOrderWindowStart(context: Pick<SeedContext, 'today' | 'scale'>): string {
  return addDays(context.today, -Math.max(context.scale.operationalDays * 2, 180));
}

export function seedProcurement(
  context: SeedContext,
  tenant: TenantSeedResult,
  options: {
    overrides?: Map<number, PurchaseOrderOverride>;
    reservedNumbers?: Set<string>;
    extra?: ExtraPurchaseOrder[];
  } = {},
): ProcurementSeedResult {
  const { dataset, scale, today } = context;
  const random = context.random('timeline/purchase-orders');
  const reserved = options.reservedNumbers ?? new Set<string>();

  // Actors
  const buyerRole = tenant.roleIdsByKey.get('buyer');
  const procurementManagerRole = tenant.roleIdsByKey.get('procurement_manager');
  const buyers = [...dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        assignment.roleId === buyerRole &&
        dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  const procurementManagers = [...dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        assignment.roleId === procurementManagerRole &&
        dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  const financeManagers = [...dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        assignment.roleId === tenant.roleIdsByKey.get('finance_manager') &&
        dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  const receivers = new Map<string, string[]>();
  for (const assignment of dataset.roleAssignments.values()) {
    if (assignment.scope.type !== 'warehouse') continue;
    const user = dataset.users.get(assignment.userId);
    if (!user || user.status !== 'active') continue;
    for (const warehouseId of assignment.scope.warehouseIds) {
      const bucket = receivers.get(warehouseId) ?? [];
      bucket.push(user.id);
      receivers.set(warehouseId, bucket);
    }
  }
  const fallbackBuyer = tenant.personaUserIds.get('marcus-lee') as string;
  if (buyers.length === 0) buyers.push(fallbackBuyer);
  if (procurementManagers.length === 0) procurementManagers.push(fallbackBuyer);
  if (financeManagers.length === 0)
    financeManagers.push(tenant.personaUserIds.get('priya-shah') as string);

  // Supplier pools
  const skusBySupplier = new Map<string, SupplierSkuMapping[]>();
  for (const mapping of dataset.supplierSkuMappings.values()) {
    if (mapping.status !== 'active') continue;
    const bucket = skusBySupplier.get(mapping.supplierId) ?? [];
    bucket.push(mapping);
    skusBySupplier.set(mapping.supplierId, bucket);
  }
  const weightedSuppliers: string[] = [];
  for (const supplier of dataset.suppliers.values()) {
    if (supplier.status !== 'active' || !skusBySupplier.has(supplier.id)) continue;
    const mappings = skusBySupplier.get(supplier.id)?.length ?? 0;
    const weight = Math.max(
      1,
      Math.round(
        Math.sqrt(mappings) *
          (supplier.relationshipTier === 'preferred'
            ? 2.2
            : supplier.relationshipTier === 'conditional'
              ? 0.5
              : 1),
      ),
    );
    for (let index = 0; index < weight; index += 1) weightedSuppliers.push(supplier.id);
  }
  const warehouses = [...dataset.warehouses.values()];
  const weightedWarehouses: Warehouse[] = [];
  for (const warehouse of warehouses)
    for (
      let index = 0;
      index < Math.max(1, Math.round(warehouse.capacityCubicMeters / 8_000));
      index += 1
    )
      weightedWarehouses.push(warehouse);

  // Skeleton: materialize twice the operational window (at least 180 days) for supplier performance, plus curated overrides.
  const materializeStart = purchaseOrderWindowStart(context);
  const perDay = scale.purchaseOrdersPerYear / 365;
  const skeletons: PurchaseOrderSkeleton[] = [];
  for (let date = context.historyStart; compareDates(date, today) <= 0; date = addDays(date, 1)) {
    const expected = perDay * dailyVolumeFactor(date, today, scale.historyMonths / 12);
    const count = Math.max(
      0,
      Math.round(expected + random.normal(0, Math.sqrt(Math.max(1, expected)))),
    );
    for (let position = 0; position < count; position += 1) {
      const index = skeletons.length;
      const stream = context.random(`purchase-order/${index}/skeleton`);
      const override = options.overrides?.get(index);
      skeletons.push({
        index,
        createdDate: date,
        supplierId: override?.supplierId ?? stream.pick(weightedSuppliers),
        warehouseId: override?.warehouseId ?? stream.pick(weightedWarehouses).id,
        buyerId: stream.pick(buyers),
      });
    }
  }
  const firstIndexOfYear = new Map<number, number>();
  for (const skeleton of skeletons) {
    const year = Number(skeleton.createdDate.slice(0, 4));
    if (!firstIndexOfYear.has(year)) firstIndexOfYear.set(year, skeleton.index);
  }

  const inboundMilli = new Map<string, number>();
  const receiptsToNumber: GoodsReceipt[] = [];
  const lastAcceptedCost = new Map<string, number>();

  const poNumber = (year: number, sequence: number): string => {
    let candidate = sequence;
    for (let guard = 0; guard < 8; guard += 1) {
      const number = formatBusinessNumber('purchaseOrder', candidate, year);
      if (!reserved.has(number)) return number;
      candidate += 1;
    }
    return formatBusinessNumber('purchaseOrder', candidate, year);
  };

  for (const skeleton of skeletons) {
    const override = options.overrides?.get(skeleton.index);
    if (compareDates(skeleton.createdDate, materializeStart) < 0 && !override) continue;
    const stream = context.random(`purchase-order/${skeleton.index}`);
    const supplier = dataset.suppliers.get(skeleton.supplierId) as Supplier;
    const mappings = skusBySupplier.get(supplier.id) ?? [];
    if (mappings.length === 0 && !override?.skuIds) continue;
    buildPurchaseOrder(context, skeleton, stream, supplier, mappings, override, {
      poNumber: (year, sequence) => poNumber(year, sequence),
      firstIndexOfYear,
      procurementManagers,
      financeManagers,
      receivers: receivers.get(skeleton.warehouseId) ?? [
        tenant.personaUserIds.get('jordan-wells') as string,
      ],
      inboundMilli,
      receiptsToNumber,
      lastAcceptedCost,
      today,
    });
  }

  // Curated purchase orders appended after the generated timeline.
  let extraIndex = skeletons.length;
  for (const extra of options.extra ?? []) {
    const date = addDays(today, -extra.createdDaysAgo);
    const stream = context.random(`purchase-order/${extraIndex}`);
    const supplierId = extra.supplierId ?? stream.pick(weightedSuppliers);
    const supplier = dataset.suppliers.get(supplierId) as Supplier;
    const skeleton: PurchaseOrderSkeleton = {
      index: extraIndex,
      createdDate: date,
      supplierId,
      warehouseId: extra.warehouseId ?? stream.pick(weightedWarehouses).id,
      buyerId: tenant.personaUserIds.get('marcus-lee') ?? stream.pick(buyers),
    };
    buildPurchaseOrder(
      context,
      skeleton,
      stream,
      supplier,
      skusBySupplier.get(supplierId) ?? [],
      extra,
      {
        poNumber: (year) =>
          poNumber(
            year,
            skeletons.length -
              (firstIndexOfYear.get(year) ?? 0) +
              (skeleton.index - skeletons.length) +
              1,
          ),
        firstIndexOfYear,
        procurementManagers,
        financeManagers,
        receivers: receivers.get(skeleton.warehouseId) ?? [
          tenant.personaUserIds.get('jordan-wells') as string,
        ],
        inboundMilli,
        receiptsToNumber,
        lastAcceptedCost,
        today,
      },
    );
    if (extra.fixtureKey)
      dataset.fixtures.set(extra.fixtureKey, formatId('purchaseOrder', extraIndex + 1));
    extraIndex += 1;
  }

  // Goods receipt numbers in receipt order.
  receiptsToNumber.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  const historicalReceipts = Math.round((skeletons.length - receiptsToNumber.length) * 1.3);
  for (const [position, receipt] of receiptsToNumber.entries()) {
    receipt.receiptNumber = formatBusinessNumber('goodsReceipt', historicalReceipts + position + 1);
  }
  return { inboundMilli, purchaseOrderCount: extraIndex };
}

interface BuildDependencies {
  poNumber: (year: number, sequence: number) => string;
  firstIndexOfYear: Map<number, number>;
  procurementManagers: string[];
  financeManagers: string[];
  receivers: string[];
  inboundMilli: Map<string, number>;
  receiptsToNumber: GoodsReceipt[];
  lastAcceptedCost: Map<string, number>;
  today: string;
}

function buildPurchaseOrder(
  context: SeedContext,
  skeleton: PurchaseOrderSkeleton,
  random: Random,
  supplier: Supplier,
  mappings: SupplierSkuMapping[],
  override: PurchaseOrderOverride | undefined,
  deps: BuildDependencies,
): void {
  const { dataset, today } = context;
  const index = skeleton.index;
  const id = formatId('purchaseOrder', index + 1);
  const year = Number(skeleton.createdDate.slice(0, 4));
  const createdAt = instantOn(skeleton.createdDate, random);
  const age = diffDays(today, skeleton.createdDate);

  // Lines
  const lineCount =
    override?.skuIds?.length ??
    random.weighted([
      { value: 1, weight: 25 },
      { value: 2, weight: 25 },
      { value: 3, weight: 18 },
      { value: random.int(4, 6), weight: 20 },
      { value: random.int(7, 12), weight: 10 },
      { value: random.int(13, 40), weight: 2 },
    ]);
  const chosen: SupplierSkuMapping[] = [];
  if (override?.skuIds) {
    for (const skuId of override.skuIds) {
      const mapping =
        mappings.find((entry) => entry.skuId === skuId) ??
        [...dataset.supplierSkuMappings.values()].find((entry) => entry.skuId === skuId);
      if (mapping) chosen.push(mapping);
    }
  } else {
    const pool = mappings.length > 40 ? random.sample(mappings, 40) : mappings;
    for (const mapping of random.sample(pool, Math.min(lineCount, pool.length)))
      chosen.push(mapping);
  }
  if (chosen.length === 0) return;
  const lead = Math.max(
    2,
    Math.round(chosen.reduce((sum, mapping) => sum + mapping.leadTimeDays, 0) / chosen.length),
  );
  const expectedDate =
    override?.expectedDate ?? addBusinessDays(skeleton.createdDate, lead + random.int(0, 5));
  const currency = chosen[0]?.currency ?? 'USD';
  const fxRateToUsd = FX_RATES_TO_USD[currency];
  const cash = (minor: number) => money(minor, currency);
  const lines: PurchaseOrderLine[] = [];
  let subtotalMinor = 0;
  let maxVarianceBps = 0;
  for (const [position, mapping] of chosen.entries()) {
    const sku = dataset.skus.get(mapping.skuId) as Sku;
    const pack = Math.max(1, quantityToMilli(mapping.packMultiple) / 1000);
    const minimum = Math.max(pack, quantityToMilli(mapping.minimumOrderQuantity) / 1000);
    const base =
      override?.quantities?.[position] ??
      Math.max(
        minimum,
        Math.round(
          random.logNormal(
            sku.unitOfMeasure === 'PK'
              ? 12
              : sku.unitOfMeasure === 'FT' || sku.unitOfMeasure === 'M'
                ? 300
                : 24,
            0.9,
          ) / pack,
        ) * pack,
      );
    const unitCostMinor = roundHalfUp(mapping.unitCost.minor * random.float(0.97, 1.05));
    const previous = deps.lastAcceptedCost.get(`${supplier.id}:${sku.id}`);
    if (previous)
      maxVarianceBps = Math.max(
        maxVarianceBps,
        roundHalfUp(((unitCostMinor - previous) / previous) * 10_000),
      );
    const lineTotal = roundHalfUp(unitCostMinor * base);
    subtotalMinor += lineTotal;
    lines.push({
      id: formatId('purchaseOrderLine', index * 50 + position + 1),
      organizationId: ORGANIZATION_ID,
      purchaseOrderId: id,
      lineNumber: position + 1,
      skuId: sku.id,
      supplierSku: mapping.supplierSku,
      description: sku.name,
      orderedQuantity: quantity(base, sku.quantityPrecision),
      receivedAcceptedQuantity: '0',
      receivedDamagedQuantity: '0',
      rejectedQuantity: '0',
      unitCost: cash(unitCostMinor),
      taxRateBps: 0,
      lineTotal: cash(lineTotal),
      expectedDate,
    });
  }
  const freightMinor = random.chance(0.45)
    ? 0
    : roundHalfUp(random.float(40, 900) / Number(fxRateToUsd)) * 100;
  const evaluation = evaluatePurchaseOrderApproval({
    approvalValueUsdMinor: roundHalfUp((subtotalMinor + freightMinor) * Number(fxRateToUsd)),
    supplierConditional: supplier.relationshipTier === 'conditional',
    maxCostVarianceBps: maxVarianceBps,
  });

  // Lifecycle by timing
  const submittedAt = addMs(createdAt, random.int(10, 300) * 60_000);
  const approvedAt = evaluation.required
    ? addMs(submittedAt, random.int(3, 48) * 3_600_000)
    : submittedAt;
  const sentAt = addMs(approvedAt, random.int(1, 24) * 3_600_000);
  const acknowledged = random.chance(0.7);
  const acknowledgedAt = acknowledged ? addMs(sentAt, random.int(4, 72) * 3_600_000) : undefined;
  let status: PurchaseOrder['status'];
  const forced = override?.status;
  if (forced) status = forced;
  else if (age <= 3 && random.chance(0.35))
    status = random.pick(['draft', 'pending_approval', 'approved', 'sent']);
  else if (random.chance(0.03)) status = 'cancelled';
  else status = acknowledged ? 'acknowledged' : 'sent';
  if (status === 'pending_approval' && !evaluation.required) status = 'approved';

  const po: PurchaseOrder = {
    id,
    organizationId: ORGANIZATION_ID,
    purchaseOrderNumber: deps.poNumber(year, index - (deps.firstIndexOfYear.get(year) ?? 0) + 1),
    supplierId: supplier.id,
    buyerId: skeleton.buyerId,
    destinationWarehouseId: skeleton.warehouseId,
    status,
    exceptionFlags: [],
    createdBusinessDate: skeleton.createdDate,
    expectedDate,
    currency,
    fxRateToUsd,
    subtotal: cash(subtotalMinor),
    taxTotal: cash(0),
    freight: cash(freightMinor),
    total: cash(subtotalMinor + freightMinor),
    metadata: metadataAt(createdAt, skeleton.buyerId, createdAt, skeleton.buyerId, 1),
    ...(override?.notes
      ? { notes: override.notes }
      : random.chance(0.25)
        ? { notes: random.pick(PO_NOTES_LONG) }
        : {}),
  };
  dataset.purchaseOrders.set(id, po);
  for (const line of lines) dataset.purchaseOrderLines.set(line.id, line);

  if (evaluation.required && status !== 'draft') {
    const pending = status === 'pending_approval';
    const approval: ApprovalRequest = {
      id: formatId('approvalRequest', 1_000_000 + index + 1),
      organizationId: ORGANIZATION_ID,
      targetType: 'purchase_order',
      targetId: id,
      targetNumber: po.purchaseOrderNumber,
      policyCode: evaluation.policyCode,
      reasons: evaluation.reasons,
      status: pending ? 'pending' : status === 'cancelled' ? 'cancelled' : 'approved',
      requestedBy: skeleton.buyerId,
      requestedAt: submittedAt,
      amount: cash(subtotalMinor + freightMinor),
      steps: evaluation.steps.map((step, position) => {
        const pool =
          step.requiredRole === 'finance_manager' ? deps.financeManagers : deps.procurementManagers;
        const approver = random.pick(pool);
        return {
          id: formatId('approvalStep', 1_000_000 + index * 4 + position + 1),
          sequence: step.sequence,
          requiredRole: step.requiredRole,
          assignedUserId: approver,
          status: pending ? 'pending' : 'approved',
          ...(pending
            ? {}
            : {
                decidedBy: approver,
                decidedAt: approvedAt,
                comment: random.pick([
                  'Approved.',
                  'Approved — within budget.',
                  'OK, expedite.',
                  'Approved after supplier review.',
                ]),
              }),
        };
      }),
      metadata: metadataAt(
        submittedAt,
        skeleton.buyerId,
        pending ? submittedAt : approvedAt,
        skeleton.buyerId,
        pending ? 1 : 2,
      ),
      ...(pending ? {} : { decidedAt: approvedAt }),
    };
    dataset.approvalRequests.set(approval.id, approval);
    po.approvalRequestId = approval.id;
  }

  if (status === 'draft') return;
  po.metadata.version = 2;
  po.metadata.updatedAt = submittedAt;
  if (status === 'pending_approval') return;
  po.metadata.version = 3;
  po.metadata.updatedAt = approvedAt;
  if (status === 'approved') return;
  po.sentAt = sentAt;
  po.metadata.version = 4;
  po.metadata.updatedAt = sentAt;
  if (status === 'cancelled') {
    po.cancelledAt = addMs(sentAt, random.int(1, 120) * 3_600_000);
    po.metadata.updatedAt = po.cancelledAt;
    po.metadata.version = 5;
    return;
  }
  if (acknowledgedAt) {
    po.supplierAcknowledgedAt = acknowledgedAt;
    po.metadata.version = 5;
    po.metadata.updatedAt = acknowledgedAt;
  }
  // A sent order the supplier never acknowledged still arrives: it goes through the same receipts,
  // is late when its date has passed, and counts as inbound until it is received.

  // Receipts (section 65.7). On-time probability depends on the supplier tier.
  const onTimeProbability =
    supplier.relationshipTier === 'preferred'
      ? 0.88
      : supplier.relationshipTier === 'conditional'
        ? 0.55
        : 0.74;
  const onTime = !override?.delayed && random.chance(onTimeProbability);
  const slipDays = onTime ? random.int(-3, 0) : random.int(1, 21);
  const plan =
    override?.receiptPlan ??
    (random.chance(0.15)
      ? [
          { fraction: random.float(0.35, 0.7), daysAfterExpected: slipDays },
          { fraction: 1, daysAfterExpected: slipDays + random.int(3, 14) },
        ]
      : [{ fraction: 1, daysAfterExpected: slipDays }]);
  let receiptCounter = 0;
  const receivedMilli = new Map<string, number>();
  let anyOpen = false;
  for (const step of plan) {
    const receiptDate = nextBusinessDayOnOrAfter(
      addDays(expectedDate, step.daysAfterExpected ?? 0),
    );
    if (compareDates(receiptDate, today) > 0) {
      anyOpen = true;
      break;
    }
    receiptCounter += 1;
    const receiptId = formatId('goodsReceipt', index * 4 + receiptCounter);
    const receivedAt = instantOn(receiptDate, random, 7, 16);
    const receiver = random.pick(deps.receivers);
    const receipt: GoodsReceipt = {
      id: receiptId,
      organizationId: ORGANIZATION_ID,
      receiptNumber: '',
      purchaseOrderId: id,
      supplierId: supplier.id,
      warehouseId: skeleton.warehouseId,
      receivedBy: receiver,
      receivedAt,
      metadata: metadataAt(receivedAt, receiver, receivedAt, receiver, 1),
      ...(random.chance(0.2)
        ? {
            notes: random.pick([
              'Two cartons showed forklift damage; logged as damaged.',
              'Supplier packing list matched.',
              'Short one carton — supplier notified.',
              'Received at dock 3.',
            ]),
          }
        : {}),
    };
    dataset.goodsReceipts.set(receiptId, receipt);
    deps.receiptsToNumber.push(receipt);
    for (const [position, line] of lines.entries()) {
      const orderedMilli = quantityToMilli(line.orderedQuantity);
      const alreadyMilli = receivedMilli.get(line.id) ?? 0;
      // Section 53.8: every quantity at the SKU's own precision — a share of an each is no quantity.
      const precision = dataset.skus.get(line.skuId)?.quantityPrecision ?? 0;
      const unitMilli = 10 ** (3 - precision);
      const toUnit = (milli: number) => Math.round(milli / unitMilli) * unitMilli;
      const targetMilli = Math.min(orderedMilli, toUnit(orderedMilli * step.fraction));
      const thisMilli = Math.max(0, targetMilli - alreadyMilli);
      if (thisMilli <= 0) continue;
      const damagedShare =
        step.damagedFraction ?? (random.chance(0.04) ? random.float(0.05, 0.3) : 0);
      const rejectedShare = random.chance(0.015) ? random.float(0.05, 0.2) : 0;
      const damagedMilli = toUnit(thisMilli * damagedShare);
      const rejectedMilli = Math.min(thisMilli - damagedMilli, toUnit(thisMilli * rejectedShare));
      const acceptedMilli = thisMilli - damagedMilli - rejectedMilli;
      const receiptLine: GoodsReceiptLine = {
        id: formatId('goodsReceiptLine', (index * 4 + receiptCounter - 1) * 50 + position + 1),
        organizationId: ORGANIZATION_ID,
        goodsReceiptId: receiptId,
        purchaseOrderLineId: line.id,
        skuId: line.skuId,
        acceptedQuantity: milliToQuantity(acceptedMilli),
        damagedQuantity: milliToQuantity(damagedMilli),
        rejectedQuantity: milliToQuantity(rejectedMilli),
        unitCost: line.unitCost,
      };
      dataset.goodsReceiptLines.set(receiptLine.id, receiptLine);
      receivedMilli.set(line.id, alreadyMilli + thisMilli);
      line.receivedAcceptedQuantity = milliToQuantity(
        quantityToMilli(line.receivedAcceptedQuantity) + acceptedMilli,
      );
      line.receivedDamagedQuantity = milliToQuantity(
        quantityToMilli(line.receivedDamagedQuantity) + damagedMilli,
      );
      line.rejectedQuantity = milliToQuantity(
        quantityToMilli(line.rejectedQuantity) + rejectedMilli,
      );
      if (acceptedMilli > 0)
        deps.lastAcceptedCost.set(`${supplier.id}:${line.skuId}`, line.unitCost.minor);
      const physicalMilli = acceptedMilli + damagedMilli;
      if (physicalMilli > 0) {
        const movement: StockMovement = {
          id: formatId(
            'stockMovement',
            40_000_000 + (index * 4 + receiptCounter - 1) * 50 + position + 1,
          ),
          organizationId: ORGANIZATION_ID,
          type: 'receipt',
          skuId: line.skuId,
          warehouseId: skeleton.warehouseId,
          onHandDelta: milliToQuantity(physicalMilli),
          damagedDelta: '0',
          quarantineDelta: '0',
          sourceEntityType: 'goods_receipt',
          sourceEntityId: receiptId,
          occurredAt: receivedAt,
          actorId: receiver,
        };
        dataset.stockMovements.set(movement.id, movement);
        if (damagedMilli > 0) {
          const damage: StockMovement = {
            ...movement,
            id: formatId(
              'stockMovement',
              60_000_000 + (index * 4 + receiptCounter - 1) * 50 + position + 1,
            ),
            type: 'damage',
            onHandDelta: '0',
            damagedDelta: milliToQuantity(damagedMilli),
            reason: 'Damaged on receipt',
          };
          dataset.stockMovements.set(damage.id, damage);
        }
      }
    }
    po.metadata.version += 1;
    po.metadata.updatedAt = receivedAt;
  }

  const fullyReceived = lines.every((line) => {
    const ordered = quantityToMilli(line.orderedQuantity);
    const received =
      quantityToMilli(line.receivedAcceptedQuantity) +
      quantityToMilli(line.receivedDamagedQuantity) +
      quantityToMilli(line.rejectedQuantity);
    return received >= ordered * 0.95;
  });
  const anyReceived = lines.some(
    (line) =>
      quantityToMilli(line.receivedAcceptedQuantity) +
        quantityToMilli(line.receivedDamagedQuantity) >
      0,
  );
  if (fullyReceived && !anyOpen) {
    po.status = 'received';
    if (age > 45 && random.chance(0.9)) {
      po.status = 'closed';
      po.closedAt = addMs(po.metadata.updatedAt, random.int(1, 10) * 24 * 3_600_000);
      if (compareDates(businessDateOf(po.closedAt), today) > 0)
        po.closedAt = addMs(po.metadata.updatedAt, 3_600_000);
      po.metadata.updatedAt = po.closedAt;
    }
  } else if (anyReceived) {
    po.status = 'partially_received';
  }
  if (
    (po.status === 'sent' || po.status === 'acknowledged' || po.status === 'partially_received') &&
    compareDates(expectedDate, today) < 0
  ) {
    po.exceptionFlags.push('delayed');
  }
  if (override?.delayed && !po.exceptionFlags.includes('delayed'))
    po.exceptionFlags.push('delayed');
  if (random.chance(0.02) && po.status !== 'closed') po.exceptionFlags.push('disputed');
  if (po.status === 'sent' || po.status === 'acknowledged' || po.status === 'partially_received') {
    for (const line of lines) {
      const openMilli =
        quantityToMilli(line.orderedQuantity) -
        quantityToMilli(line.receivedAcceptedQuantity) -
        quantityToMilli(line.receivedDamagedQuantity) -
        quantityToMilli(line.rejectedQuantity);
      if (openMilli <= 0) continue;
      const key = `${line.skuId}:${skeleton.warehouseId}`;
      deps.inboundMilli.set(key, (deps.inboundMilli.get(key) ?? 0) + openMilli);
    }
  }
}
