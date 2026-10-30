/**
 * Internal IDs and human-readable business numbers (sections 53.2 and 53.3).
 */

export const ID_PREFIXES = {
  organization: 'org',
  user: 'usr',
  team: 'tem',
  role: 'rol',
  roleAssignment: 'ras',
  customer: 'cus',
  contact: 'con',
  address: 'adr',
  customerNote: 'nte',
  product: 'prd',
  sku: 'sku',
  category: 'cat',
  priceList: 'prl',
  priceEntry: 'pre',
  contractPrice: 'ctp',
  supplier: 'sup',
  supplierSkuMapping: 'ssm',
  quote: 'qte',
  quoteLine: 'qln',
  salesOrder: 'ord',
  salesOrderLine: 'oln',
  approvalRequest: 'apr',
  approvalStep: 'aps',
  warehouse: 'wh',
  warehouseLocation: 'loc',
  inventoryReservation: 'res',
  stockMovement: 'mov',
  transfer: 'trf',
  transferLine: 'trl',
  cycleCount: 'ccn',
  cycleCountLine: 'ccl',
  shipment: 'shp',
  shipmentLine: 'shl',
  return: 'rma',
  returnLine: 'rml',
  purchaseOrder: 'po',
  purchaseOrderLine: 'pol',
  goodsReceipt: 'grc',
  goodsReceiptLine: 'grl',
  invoice: 'inv',
  invoiceLine: 'inl',
  payment: 'pay',
  paymentAllocation: 'pal',
  creditMemo: 'crm',
  creditMemoLine: 'crl',
  creditMemoApplication: 'cma',
  refund: 'rfd',
  bankTransaction: 'btx',
  ticket: 'tkt',
  conversationMessage: 'msg',
  slaEvent: 'sla',
  supportMacro: 'mac',
  workflow: 'wfl',
  workflowRun: 'wfr',
  activityEvent: 'act',
  auditEvent: 'aud',
  notification: 'ntf',
  savedView: 'svw',
  importJob: 'imp',
  task: 'tsk',
} as const;

export type IdEntity = keyof typeof ID_PREFIXES;

export function formatId(entity: IdEntity, sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new RangeError(`Sequence must be a positive integer, received ${sequence}`);
  }
  return `${ID_PREFIXES[entity]}_${String(sequence).padStart(6, '0')}`;
}

export function idSequence(id: string): number {
  const separator = id.lastIndexOf('_');
  return Number(id.slice(separator + 1));
}

export function idPrefix(id: string): string {
  return id.slice(0, id.lastIndexOf('_'));
}

/** Business-number families. Yearly families reset their counter every calendar year. */
export const BUSINESS_NUMBER_FORMATS = {
  customer: { prefix: 'CUS', digits: 6, yearly: false },
  quote: { prefix: 'Q', digits: 6, yearly: true },
  salesOrder: { prefix: 'SO', digits: 5, yearly: true },
  shipment: { prefix: 'SHP', digits: 6, yearly: false },
  return: { prefix: 'RMA', digits: 6, yearly: false },
  purchaseOrder: { prefix: 'PO', digits: 5, yearly: true },
  goodsReceipt: { prefix: 'GR', digits: 6, yearly: false },
  invoice: { prefix: 'INV', digits: 5, yearly: true },
  payment: { prefix: 'PAY', digits: 6, yearly: false },
  creditMemo: { prefix: 'CM', digits: 6, yearly: false },
  refund: { prefix: 'RF', digits: 6, yearly: false },
  transfer: { prefix: 'TR', digits: 6, yearly: false },
  cycleCount: { prefix: 'CC', digits: 6, yearly: false },
  ticket: { prefix: 'TCK', digits: 5, yearly: false },
  supplier: { prefix: 'SUP', digits: 6, yearly: false },
} as const;

export type BusinessNumberFamily = keyof typeof BUSINESS_NUMBER_FORMATS;

export function formatBusinessNumber(
  family: BusinessNumberFamily,
  sequence: number,
  year?: number,
): string {
  const format = BUSINESS_NUMBER_FORMATS[family];
  const digits = String(sequence).padStart(format.digits, '0');
  if (format.yearly) {
    if (year === undefined) throw new RangeError(`${family} numbers require a year`);
    return `${format.prefix}-${year}-${digits}`;
  }
  return `${format.prefix}-${digits}`;
}

/**
 * Allocates internal ids and business numbers deterministically. Seeded
 * records consume the first sequences; records created at runtime continue
 * from the seed's maximum (section 53.3).
 */
export class SequenceAllocator {
  private readonly ids = new Map<IdEntity, number>();
  private readonly numbers = new Map<string, number>();

  nextId(entity: IdEntity): string {
    const next = (this.ids.get(entity) ?? 0) + 1;
    this.ids.set(entity, next);
    return formatId(entity, next);
  }

  /** Reserves every sequence up to and including `sequence` for `entity`. */
  reserveId(entity: IdEntity, sequence: number): void {
    if ((this.ids.get(entity) ?? 0) < sequence) this.ids.set(entity, sequence);
  }

  peekId(entity: IdEntity): number {
    return this.ids.get(entity) ?? 0;
  }

  nextBusinessNumber(family: BusinessNumberFamily, year?: number): string {
    const key = BUSINESS_NUMBER_FORMATS[family].yearly ? `${family}:${year}` : family;
    let next = (this.numbers.get(key) ?? 0) + 1;
    while (this.reservedNumbers.has(formatBusinessNumber(family, next, year))) next += 1;
    this.numbers.set(key, next);
    return formatBusinessNumber(family, next, year);
  }

  private readonly reservedNumbers = new Set<string>();

  /** Reserves an explicit business number (curated records) so generation skips it. */
  reserveBusinessNumber(number: string): void {
    this.reservedNumbers.add(number);
  }

  snapshot(): { ids: Record<string, number>; numbers: Record<string, number> } {
    return {
      ids: Object.fromEntries(this.ids),
      numbers: Object.fromEntries(this.numbers),
    };
  }

  static restore(snapshot: { ids: Record<string, number>; numbers: Record<string, number> }) {
    const allocator = new SequenceAllocator();
    for (const [entity, value] of Object.entries(snapshot.ids)) {
      allocator.ids.set(entity as IdEntity, value);
    }
    for (const [key, value] of Object.entries(snapshot.numbers)) allocator.numbers.set(key, value);
    return allocator;
  }
}
