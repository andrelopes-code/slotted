import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  ApprovalRequest,
  CycleCountLine,
  CycleCountListItem,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { CycleCountsStore } from './cycle-counts.store';
import { classify, INVENTORY_CONFLICTS, without, type InventoryFailure } from './inventory-failure';
import { COUNT_APPROVAL_MINOR, fitsPrecision, fromMilli, milli, quantityText } from './inventory.model';
import { readSkuFacts, type SkuFacts } from './sku-facts';

export type CountLine = CycleCountLine & { skuCode: string; skuName: string; locationCode: string };

export interface CountLineRow extends CountLine {
  readonly unit: string;
  readonly precision: number;
  /** The variance the reader's count would give, before it is submitted. */
  readonly draftVariance: string | null;
}

export interface CountEntry {
  readonly quantity: number | null;
  readonly note: string;
}

export type CountBusy = 'start' | 'submit' | 'complete' | 'cancel' | 'decision';

const WORDS: Record<string, string> = {
  APPROVAL_ALREADY_DECIDED: 'Another approver decided this count a moment ago. The outcome below is the one that counts.',
  STALE_VERSION: 'Someone else moved this count on while the page was open.',
  INVALID_STATE_TRANSITION: 'The count is no longer in a state that allows this.',
  APPROVAL_REQUIRED: 'The count waits on a warehouse manager’s approval before it can complete.',
  FORBIDDEN: 'Your role does not count stock in this warehouse.',
};

/**
 * One cycle count (§62): its lines, the snapshot `start` takes, the counts the
 * reader types, the variance they give and, above US$2,500 at standard cost,
 * the approval the submission waits on. Commands carry the version the page
 * read (ER-03).
 *
 * `complete` is offered only where it would be accepted: a submitted count
 * that waits on no approval. A count under the threshold completes on
 * submission and one above it completes when its approval is decided
 * (`cycleCountHooks.onApproved`), so the command is left to counts submitted
 * without one — the seed holds such a count — and a count whose approval is
 * pending says whom it waits on instead (RP-09).
 */
@Injectable({ providedIn: 'root' })
export class CycleCountStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly list = inject(CycleCountsStore);

  readonly id = signal<string | null>(null);
  readonly count = signal<CycleCountListItem | null>(null);
  readonly lines = signal<readonly CountLine[]>([]);
  readonly facts = signal<ReadonlyMap<string, SkuFacts>>(new Map());
  readonly approval = signal<ApprovalRequest | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);
  readonly busy = signal<CountBusy | null>(null);
  readonly failure = signal<InventoryFailure | null>(null);

  /** What the reader counted, by line; kept through a refusal. */
  readonly entries = signal<Readonly<Record<string, CountEntry>>>({});
  readonly errors = signal<FormErrors>({});

  private sequence = 0;
  private version = 0;
  /** The approval's version as the page read it (ER-03). */
  private approvalVersion = 0;

  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });

  readonly canCount = computed(() => {
    void this.session.session();
    const count = this.count();
    return (
      count !== null &&
      this.session.can('inventory.cycle_count') &&
      this.warehouses.covers(count.warehouseId)
    );
  });

  readonly rows = computed<readonly CountLineRow[]>(() => {
    const facts = this.facts();
    const entries = this.entries();
    return this.lines().map((line) => {
      const text = quantityText(entries[line.id]?.quantity);
      return {
        ...line,
        unit: facts.get(line.skuId)?.unit ?? '',
        precision: facts.get(line.skuId)?.precision ?? 0,
        draftVariance: text === null ? null : fromMilli(milli(text) - milli(line.systemOnHand)),
      };
    });
  });

  readonly countedLines = computed(
    () => this.rows().filter((row) => quantityText(this.entries()[row.id]?.quantity) !== null).length,
  );

  /**
   * The variance's value at standard cost, for a reader who may be shown cost.
   * A reader without `cost.view` is told the rule and not the figure.
   */
  readonly impactMinor = computed(() => {
    if (!this.canSeeCost()) return null;
    let total = 0;
    for (const row of this.rows()) {
      const variance = row.variance ?? row.draftVariance;
      const cost = this.facts().get(row.skuId)?.standardCostMinor ?? null;
      if (variance === null || variance === undefined || cost === null) continue;
      total += Math.abs(Math.round((cost * milli(variance)) / 1000));
    }
    return total;
  });

  /** Submitted, and waiting on no approval: the one state `complete` accepts. */
  readonly completable = computed(() => {
    const count = this.count();
    const approval = this.approval();
    return (
      count?.status === 'submitted' &&
      (count.approvalRequestId === undefined || approval?.status === 'approved')
    );
  });

  readonly needsApproval = computed(() => {
    const impact = this.impactMinor();
    return impact !== null && impact >= COUNT_APPROVAL_MINOR;
  });

  async open(id: string): Promise<void> {
    if (this.id() !== id) {
      this.id.set(id);
      this.count.set(null);
      this.lines.set([]);
      this.facts.set(new Map());
      this.approval.set(null);
      this.error.set(null);
      this.failure.set(null);
      this.entries.set({});
      this.errors.set({});
    }
    await Promise.all([this.warehouses.open(), this.load()]);
  }

  async load(): Promise<void> {
    const id = this.id();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const detail = await api.inventory.cycleCounts.get(id);
      if (ticket !== this.sequence) return;
      // The count, its units and its approval land together, so no command is drawn for a state
      // whose own read-back is still on its way.
      const [facts, approval] = await Promise.all([
        this.facts().size > 0
          ? Promise.resolve(this.facts())
          : readSkuFacts(
              api,
              this.health,
              detail.lines.map((line) => line.skuId),
              this.canSeeCost(),
            ),
        detail.cycleCount.approvalRequestId
          ? this.health.read(() => api.approvals.get(detail.cycleCount.approvalRequestId!), null)
          : Promise.resolve(null),
      ]);
      if (ticket !== this.sequence) return;
      this.version = detail.cycleCount.metadata.version;
      this.facts.set(facts);
      this.approval.set(approval);
      this.approvalVersion = approval?.metadata.version ?? 0;
      this.count.set(detail.cycleCount);
      this.lines.set(detail.lines);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The count could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  start(): Promise<boolean> {
    return this.run('start', (api, id, version) =>
      api.inventory.cycleCounts.start(id, { ifMatch: version }),
    );
  }

  complete(): Promise<boolean> {
    return this.run('complete', (api, id, version) =>
      api.inventory.cycleCounts.complete(id, { ifMatch: version }),
    );
  }

  cancel(): Promise<boolean> {
    return this.run('cancel', (api, id, version) =>
      api.inventory.cycleCounts.cancel(id, { ifMatch: version }),
    );
  }

  patch(lineId: string, patch: Partial<CountEntry>): void {
    this.entries.update((entries) => ({
      ...entries,
      [lineId]: { ...(entries[lineId] ?? { quantity: null, note: '' }), ...patch },
    }));
    this.errors.set(without(this.errors(), `counted.${lineId}.quantity`));
  }

  /** Every line is counted, in the SKU's precision, and never below zero (§62.2, §53.8). */
  check(): FormErrors {
    const errors: Record<string, string[]> = {};
    for (const row of this.rows()) {
      const text = quantityText(this.entries()[row.id]?.quantity);
      const key = `counted.${row.id}.quantity`;
      if (text === null) errors[key] = ['Count this line before submitting.'];
      else if (milli(text) < 0) errors[key] = ['A count is never below zero.'];
      else if (!fitsPrecision(text, row.precision))
        errors[key] = [
          row.precision === 0
            ? `${row.skuCode} is counted in whole ${row.unit}.`
            : `${row.skuCode} is counted to ${row.precision} decimal places.`,
        ];
    }
    return errors;
  }

  async submit(): Promise<boolean> {
    const errors = this.check();
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) return false;
    const counted: Record<string, { quantity: string; note?: string }> = {};
    for (const row of this.rows()) {
      const entry = this.entries()[row.id]!;
      counted[row.id] = {
        quantity: quantityText(entry.quantity)!,
        ...(entry.note.trim() ? { note: entry.note.trim() } : {}),
      };
    }
    const ok = await this.run('submit', (api, id, version) =>
      api.inventory.cycleCounts.submit(id, { counted }, { ifMatch: version }),
    );
    if (ok) this.entries.set({});
    return ok;
  }

  /** The approval the submission waits on, decided from the count (§67). */
  async decide(decision: 'approve' | 'reject' | 'changes', reason: string): Promise<boolean> {
    const approval = this.approval();
    if (approval === null || this.busy() !== null) return false;
    this.busy.set('decision');
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const version = this.approvalVersion;
      await this.health.mutation(() =>
        decision === 'approve'
          ? api.approvals.approve(approval.id, { comment: reason }, { ifMatch: version })
          : decision === 'reject'
            ? api.approvals.reject(approval.id, { reason }, { ifMatch: version })
            : api.approvals.requestChanges(approval.id, { reason }, { ifMatch: version }),
      );
      await this.load();
      return true;
    } catch (error) {
      this.failure.set(classify(error, WORDS, 'The approval was not decided.'));
      await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  private async run(
    kind: CountBusy,
    action: (api: NexoraApi, id: string, version: number) => Promise<unknown>,
  ): Promise<boolean> {
    const count = this.count();
    if (count === null || this.busy() !== null) return false;
    this.busy.set(kind);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() => action(api, count.id, this.version));
      await this.load();
      if (this.list.total() !== null) void this.list.reload();
      return true;
    } catch (error) {
      const failure = classify(error, WORDS, 'The count was not changed.');
      this.failure.set(failure);
      if (INVENTORY_CONFLICTS.has(failure.code) || failure.code === 'INVALID_STATE_TRANSITION')
        await this.load();
      return false;
    } finally {
      this.busy.set(null);
    }
  }
}
