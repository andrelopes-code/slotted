import { computed, inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type {
  AdjustmentReasonCode,
  InventoryListItem,
  SkuDetail,
  StockMovement,
  WarehouseLocation,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { classify, fieldErrors, type InventoryFailure } from './inventory-failure';
import {
  fitsPrecision,
  fromMilli,
  milli,
  NOTE_UNITS_MILLI,
  NOTE_VALUE_MINOR,
  quantityText,
} from './inventory.model';

/** One warehouse's position of the SKU, with the place named and the reader's own marked. */
export interface PositionRow extends InventoryListItem {
  readonly warehouseName: string;
  readonly isOwn: boolean;
}

/** A movement of the chosen warehouse, with the on-hand quantity it left behind. */
export interface LedgerRow extends StockMovement {
  /** On hand after this movement, derived backwards from the position's current quantity. */
  readonly balanceAfter: string;
}

export interface AdjustDraft {
  readonly direction: 'add' | 'remove';
  readonly quantity: number | null;
  readonly reason: AdjustmentReasonCode | null;
  readonly note: string;
  readonly locationId: string | null;
}

const EMPTY_DRAFT: AdjustDraft = {
  direction: 'remove',
  quantity: null,
  reason: null,
  note: '',
  locationId: null,
};

/** The module's words for the refusals an adjustment can meet (§60.7, §80.2). */
const WORDS: Record<string, string> = {
  INSUFFICIENT_AVAILABILITY:
    'Nexora holds less sellable stock in this warehouse than this adjustment takes out.',
  WAREHOUSE_CLOSED: 'This warehouse is closed: its stock cannot be adjusted.',
  LOCATION_BLOCKED: 'That location is blocked and cannot take the adjustment.',
  ADJUSTMENT_NOTE_REQUIRED: 'An adjustment of this size needs a note that explains it.',
  QUANTITY_PRECISION_EXCEEDED: 'The quantity carries more decimals than this SKU is counted in.',
  FORBIDDEN: 'Your role does not adjust stock in this warehouse.',
};

/**
 * One SKU's stock (`GET /inventory/:skuId`): its position in every warehouse
 * the reader's scope covers and the last hundred movements, with one warehouse
 * chosen. The catalogue's answer for the same SKU is read beside it for the
 * two facts the inventory answer lacks: the precision the SKU is counted in
 * and its standard cost — the cost only for a reader holding `cost.view`,
 * since `GET /inventory` fills it for everyone (PM-01).
 *
 * The adjustment (§60.7) is written from here, on the chosen warehouse.
 */
@Injectable({ providedIn: 'root' })
export class PositionStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);

  readonly skuId = signal<string | null>(null);
  readonly warehouseId = signal<string | null>(null);
  readonly positions = signal<readonly InventoryListItem[] | null>(null);
  readonly movements = signal<readonly StockMovement[]>([]);
  readonly catalog = signal<SkuDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<{ code: string; message: string } | null>(null);

  readonly draft = signal<AdjustDraft>(EMPTY_DRAFT);
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<InventoryFailure | null>(null);
  readonly saving = signal(false);
  /** The movement the last adjustment wrote, found in the ledger read back after it. */
  readonly written = signal<StockMovement | null>(null);
  readonly locations = signal<readonly WarehouseLocation[]>([]);

  readonly sku = computed(() => this.catalog()?.sku ?? null);
  readonly precision = computed(() => this.sku()?.quantityPrecision ?? 0);
  readonly unit = computed(() => this.sku()?.unitOfMeasure ?? this.positions()?.[0]?.unitOfMeasure ?? '');
  readonly canSeeCost = computed(() => {
    void this.session.session();
    return this.session.can('cost.view');
  });
  /** The unit cost, only where the reader may be shown it; never the value `GET /inventory` leaks. */
  readonly unitCostMinor = computed(() =>
    this.canSeeCost() ? (this.catalog()?.sku.standardCost.minor ?? null) : null,
  );

  readonly rows = computed<readonly PositionRow[]>(() =>
    (this.positions() ?? []).map((position) => ({
      ...position,
      warehouseName: this.warehouses.name(position.warehouseId),
      isOwn: this.warehouses.isOwn(position.warehouseId),
    })),
  );

  readonly selected = computed<PositionRow | null>(() => {
    const rows = this.rows();
    const id = this.warehouseId();
    return rows.find((row) => row.warehouseId === id) ?? rows[0] ?? null;
  });

  readonly canAdjust = computed(() => {
    void this.session.session();
    const row = this.selected();
    return (
      row !== null &&
      this.session.can('inventory.adjust') &&
      this.warehouses.covers(row.warehouseId) &&
      this.warehouses.byId().get(row.warehouseId)?.status !== 'closed'
    );
  });

  /**
   * The chosen warehouse's movements, newest first, each with what it left on
   * hand. The answer holds the hundred newest movements of the SKU, so the
   * ones of one warehouse are its newest ones without a gap, and the balance
   * walks back from the position's own quantity (LG-02).
   */
  readonly ledger = computed<readonly LedgerRow[]>(() => {
    const row = this.selected();
    if (row === null) return [];
    let balance = milli(row.onHand);
    return this.movements()
      .filter((movement) => movement.warehouseId === row.warehouseId)
      .map((movement) => {
        const entry = { ...movement, balanceAfter: fromMilli(balance) };
        balance -= milli(movement.onHandDelta);
        return entry;
      });
  });

  // ---------------------------------------------------------------------------
  // The adjustment

  /** The signed change the draft asks for, in thousandths, or null while it is not a number. */
  readonly deltaMilli = computed(() => {
    const draft = this.draft();
    const text = quantityText(draft.quantity);
    if (text === null) return null;
    const amount = Math.abs(milli(text));
    return draft.direction === 'remove' ? -amount : amount;
  });

  readonly isDamage = computed(
    () => this.draft().reason === 'damage' && this.draft().direction === 'remove',
  );

  /** The value of the change at standard cost, where the reader may be shown it. */
  readonly valueMinor = computed(() => {
    const delta = this.deltaMilli();
    const cost = this.unitCostMinor();
    if (delta === null || cost === null) return null;
    return Math.round((cost * Math.abs(delta)) / 1000);
  });

  /** §60.7's threshold, said before the submit and not after it (FM-11). */
  readonly noteRequired = computed(() => {
    const delta = this.deltaMilli();
    if (delta === null) return false;
    if (Math.abs(delta) >= NOTE_UNITS_MILLI) return true;
    const value = this.valueMinor();
    return value !== null && value >= NOTE_VALUE_MINOR;
  });

  /** What may be taken out: the sellable stock, the backend's own bound. */
  readonly removable = computed(() => this.selected()?.sellableOnHand ?? '0');

  /** The buckets after the change, as the backend will write them. */
  readonly preview = computed(() => {
    const row = this.selected();
    const delta = this.deltaMilli();
    if (row === null || delta === null || delta === 0) return null;
    if (this.isDamage())
      return {
        onHand: row.onHand,
        damaged: fromMilli(milli(row.damaged) - delta),
        available: fromMilli(milli(row.available) + delta),
      };
    return {
      onHand: fromMilli(milli(row.onHand) + delta),
      damaged: row.damaged,
      available: fromMilli(milli(row.available) + delta),
    };
  });

  private sequence = 0;
  private draftKey = '';

  async open(skuId: string, warehouseId: string | null): Promise<void> {
    if (this.skuId() !== skuId) {
      this.skuId.set(skuId);
      this.positions.set(null);
      this.movements.set([]);
      this.catalog.set(null);
      this.error.set(null);
    }
    this.choose(warehouseId);
    await Promise.all([this.warehouses.open(), this.load()]);
  }

  /** The warehouse the page stands on; a new one starts a new draft. */
  choose(warehouseId: string | null): void {
    this.warehouseId.set(warehouseId);
    const key = `${this.skuId()}|${warehouseId}`;
    if (key !== this.draftKey) {
      this.draftKey = key;
      this.draft.set(EMPTY_DRAFT);
      this.errors.set({});
      this.failure.set(null);
      this.written.set(null);
      this.locations.set([]);
    }
  }

  async load(): Promise<void> {
    const id = this.skuId();
    if (id === null) return;
    const ticket = ++this.sequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const api = await this.backend.ready();
      const [stock, catalog] = await Promise.all([
        api.inventory.sku(id),
        this.catalog() === null ? api.catalog.sku(id) : Promise.resolve(this.catalog()!),
      ]);
      if (ticket !== this.sequence) return;
      this.positions.set(stock.positions);
      this.movements.set(stock.movements);
      this.catalog.set(catalog);
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The stock could not be loaded' },
      );
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  /** The chosen warehouse's locations, for the optional place of the adjustment. */
  async loadLocations(): Promise<void> {
    const row = this.selected();
    if (row === null || this.locations().length > 0) return;
    const api = await this.backend.ready();
    const locations = await this.health.read(() => api.inventory.locations(row.warehouseId), []);
    this.locations.set(locations);
  }

  patch(patch: Partial<AdjustDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  discard(): void {
    this.draft.set(EMPTY_DRAFT);
    this.errors.set({});
    this.failure.set(null);
  }

  /**
   * The rules §60.7 and §53.8 state, checked where the reader types, so the
   * backend's refusal is never the first time the reader hears of them.
   */
  check(): FormErrors {
    const draft = this.draft();
    const errors: Record<string, string[]> = {};
    const text = quantityText(draft.quantity);
    const precision = this.precision();
    if (text === null || milli(text) === 0)
      errors['quantityDelta'] = ['Enter how many units the adjustment moves; zero moves nothing.'];
    else if (!fitsPrecision(text, precision))
      errors['quantityDelta'] = [
        precision === 0
          ? `This SKU is counted in whole ${this.unit()}.`
          : `This SKU is counted to ${precision} decimal places.`,
      ];
    else if (draft.direction === 'remove' && Math.abs(milli(text)) > milli(this.removable()))
      errors['quantityDelta'] = [
        `At most ${this.removable()} ${this.unit()} can be taken out: the sellable stock here.`,
      ];
    if (draft.reason === null) errors['reason'] = ['Choose why the stock is adjusted.'];
    if (this.noteRequired() && draft.note.trim().length === 0)
      errors['note'] = [WORDS['ADJUSTMENT_NOTE_REQUIRED']!];
    return errors;
  }

  /**
   * Writes the adjustment. The position on screen moves at once and comes back
   * if Nexora refuses (§33, optimistic mutation and rollback); the answer is
   * then read back, and the movement the command wrote is found in the ledger.
   */
  async adjust(): Promise<boolean> {
    const row = this.selected();
    const delta = this.deltaMilli();
    const id = this.skuId();
    if (row === null || delta === null || id === null || this.saving()) return false;
    const errors = this.check();
    this.errors.set(errors);
    this.failure.set(null);
    if (Object.keys(errors).length > 0) return false;

    const draft = this.draft();
    const before = this.positions();
    const preview = this.preview();
    this.saving.set(true);
    if (preview !== null && before !== null)
      this.positions.set(
        before.map((position) =>
          position.warehouseId === row.warehouseId ? { ...position, ...preview } : position,
        ),
      );
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.inventory.adjust({
          skuId: id,
          warehouseId: row.warehouseId,
          quantityDelta: fromMilli(delta),
          reason: draft.reason!,
          ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
          ...(draft.locationId ? { locationId: draft.locationId } : {}),
        }),
      );
      await this.load();
      const userId = this.session.user()?.id;
      this.written.set(
        this.movements().find(
          (movement) =>
            movement.warehouseId === row.warehouseId &&
            movement.sourceEntityType === 'manual_adjustment' &&
            movement.actorId === userId,
        ) ?? null,
      );
      this.draft.set(EMPTY_DRAFT);
      return true;
    } catch (error) {
      this.positions.set(before);
      const failure = classify(error, WORDS, 'The stock was not adjusted.');
      const byField = fieldErrors(error);
      if (failure.code === 'INSUFFICIENT_AVAILABILITY')
        byField['quantityDelta'] = [failure.message];
      if (failure.code === 'LOCATION_BLOCKED') byField['locationId'] = [failure.message];
      this.errors.set(byField);
      this.failure.set(failure);
      // A refusal on the stock itself means the picture moved: read it again (ER-02).
      if (failure.code === 'INSUFFICIENT_AVAILABILITY') await this.load();
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
