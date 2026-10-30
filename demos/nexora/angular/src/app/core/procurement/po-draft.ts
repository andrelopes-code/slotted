import {
  ratioBps,
  type CurrencyCode,
  type PurchaseOrderLineInput,
  type SupplierDetail,
} from '@slotted/demo-nexora-backend';

import { fitsPrecision, milli, quantityText } from '../inventory/inventory.model';

export type SupplierMapping = SupplierDetail['mappings'][number];

/** One line of a purchase order being written or edited, in the units the reader types. */
export interface PoDraftLine {
  readonly skuId: string;
  readonly skuCode: string;
  readonly skuName: string;
  readonly unit: string;
  readonly precision: number;
  readonly quantity: number | null;
  /** Major units of the order's currency; null leaves the price to the backend's default. */
  readonly unitCost: number | null;
  /** The supplier's terms for this SKU, where the supplier maps it. */
  readonly minimumOrderQuantity: string | null;
  readonly packMultiple: string | null;
  readonly leadTimeDays: number | null;
  /** The unit cost of the last goods receipt accepted from this supplier for this SKU, in minor units. */
  readonly lastAcceptedMinor: number | null;
}

export const lineKey = (skuId: string, field: 'quantity' | 'unitCost'): string =>
  `lines.${skuId}.${field}`;

export function unitCostMinor(line: PoDraftLine): number | null {
  return line.unitCost === null ? null : Math.round(line.unitCost * 100);
}

/** The line's value as `buildLines` computes it: unit cost times quantity, rounded to the cent. */
export function lineTotalMinor(line: PoDraftLine): number {
  const cost = unitCostMinor(line);
  const text = quantityText(line.quantity);
  if (cost === null || text === null) return 0;
  return Math.round((cost * milli(text)) / 1000);
}

export function subtotalMinor(lines: readonly PoDraftLine[]): number {
  return lines.reduce((total, line) => total + lineTotalMinor(line), 0);
}

/** The line's rise over the last accepted cost, in basis points; null where nothing was accepted before. */
export function varianceBps(line: PoDraftLine): number | null {
  const cost = unitCostMinor(line);
  if (cost === null || line.lastAcceptedMinor === null || line.lastAcceptedMinor === 0) return null;
  return ratioBps(cost - line.lastAcceptedMinor, line.lastAcceptedMinor);
}

export function maxVarianceBps(lines: readonly PoDraftLine[]): number {
  return lines.reduce((max, line) => Math.max(max, varianceBps(line) ?? 0), 0);
}

/** §65.6's rules for a line, said at the line before the command is sent. */
export function checkLines(lines: readonly PoDraftLine[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (lines.length === 0) errors['lines'] = ['A purchase order carries at least one line.'];
  for (const line of lines) {
    const text = quantityText(line.quantity);
    const key = lineKey(line.skuId, 'quantity');
    if (text === null || milli(text) <= 0) errors[key] = ['More than zero.'];
    else if (!fitsPrecision(text, line.precision))
      errors[key] = [
        line.precision === 0
          ? `${line.skuCode} is counted in whole ${line.unit}.`
          : `${line.skuCode} is counted to ${line.precision} decimal places.`,
      ];
    if (line.unitCost !== null && line.unitCost < 0)
      errors[lineKey(line.skuId, 'unitCost')] = ['A unit cost is never below zero.'];
  }
  return errors;
}

export function linesInput(lines: readonly PoDraftLine[]): PurchaseOrderLineInput[] {
  return lines.map((line) => {
    const cost = unitCostMinor(line);
    return {
      skuId: line.skuId,
      quantity: quantityText(line.quantity)!,
      ...(cost === null ? {} : { unitCostMinor: cost }),
    };
  });
}

/** A line opened from the supplier's own terms for the SKU; the price is theirs where it is in the order's currency. */
export function lineFromMapping(
  mapping: SupplierMapping,
  currency: CurrencyCode,
  facts: { unit: string; precision: number } | undefined,
  lastAcceptedMinor: number | null,
  quantity: number | null = null,
): PoDraftLine {
  return {
    skuId: mapping.skuId,
    skuCode: mapping.skuCode,
    skuName: mapping.skuName,
    unit: facts?.unit ?? '',
    precision: facts?.precision ?? 0,
    quantity,
    unitCost: mapping.currency === currency ? mapping.unitCost.minor / 100 : null,
    minimumOrderQuantity: mapping.minimumOrderQuantity,
    packMultiple: mapping.packMultiple,
    leadTimeDays: mapping.leadTimeDays,
    lastAcceptedMinor,
  };
}

/**
 * The unit cost last accepted from a supplier, per SKU, as `GET /suppliers/:id`
 * states it on each mapping (§65.7) — what `submit` measures a line's variance
 * against. The backend writes it only for a reader who may see a cost.
 */
export function lastAcceptedCosts(mappings: readonly SupplierMapping[]): ReadonlyMap<string, number> {
  return new Map(
    mappings.flatMap((mapping) =>
      mapping.lastAcceptedUnitCost ? [[mapping.skuId, mapping.lastAcceptedUnitCost.minor] as const] : [],
    ),
  );
}
