import { computed, inject, Injectable, signal, type WritableSignal } from '@angular/core';
import type {
  FilterValue,
  InventoryListItem,
  MovementListItem,
  NexoraApi,
  TransferListItem,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { WarehousesStore } from '../catalog/warehouses.store';
import { SessionStore } from '../session/session.store';
import { TRANSFERS_IN_FLIGHT } from './inventory.model';

/** The exceptions a warehouse is read by, each a count of positions (RP-08). */
export interface WarehouseExceptions {
  readonly warehouseId: string;
  readonly code: string;
  readonly belowSafety: number;
  readonly belowReorder: number;
  readonly backordered: number;
}

export interface Figures {
  readonly belowSafety: number;
  readonly belowReorder: number;
  readonly nothingAvailable: number;
  readonly backordered: number;
  readonly transfersInFlight: number;
}

/** Movements of one day, counted by the direction they moved on-hand stock. */
export interface MovementDay {
  readonly day: string;
  readonly in: number;
  readonly out: number;
}

/** A region of the overview: its answer, whether one is on its way, and whether the last one failed. */
export interface Region<T> {
  readonly value: T | null;
  readonly pending: boolean;
  readonly failed: boolean;
}

const idle = <T>(): Region<T> => ({ value: null, pending: false, failed: false });

/** The window the movement chart covers, ending on the demo's today. */
export const MOVEMENT_DAYS = 14;

/**
 * The inventory overview (§34.4): exceptions by warehouse, the positions that
 * need a decision, the transfers still moving and the ledger's last days.
 *
 * The backend has no summary endpoint, so every figure is a count the list
 * resource answers in `page.totalItems` — one request per figure and per
 * warehouse — and never a sum of rows read by the browser: the positions of a
 * light tenant are 11,159 rows a hundred at a time (the ledger row "no
 * inventory summary"). Quantities are not summed across SKUs, which are
 * counted in five units; a figure counts positions or movements (RP-08).
 */
@Injectable({ providedIn: 'root' })
export class OverviewStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);
  private readonly warehouses = inject(WarehousesStore);

  readonly figures = signal<Region<Figures>>(idle());
  readonly byWarehouse = signal<Region<readonly WarehouseExceptions[]>>(idle());
  readonly exceptions = signal<Region<{ rows: readonly InventoryListItem[]; total: number }>>(
    idle(),
  );
  readonly transfers = signal<Region<readonly TransferListItem[]>>(idle());
  readonly movementDays = signal<Region<readonly MovementDay[]>>(idle());
  readonly recent = signal<Region<readonly MovementListItem[]>>(idle());

  readonly today = computed(() => this.session.session()?.demo.today ?? '');
  /** One warehouse in scope: the overview is that warehouse's, and says so. */
  readonly single = computed(() => {
    const scope = this.warehouses.inScope();
    return scope.length === 1 ? scope[0]! : null;
  });

  private ticket = 0;

  async open(): Promise<void> {
    const ticket = ++this.ticket;
    await this.warehouses.open();
    if (ticket !== this.ticket) return;
    const api = await this.backend.ready();
    await Promise.all([
      this.region(this.byWarehouse, ticket, () => this.readByWarehouse(api)),
      this.region(this.figures, ticket, () => this.readFigures(api)),
      this.region(this.exceptions, ticket, () => this.readExceptions(api)),
      this.region(this.transfers, ticket, () => this.readTransfers(api)),
      this.region(this.movementDays, ticket, () => this.readMovementDays(api)),
      this.region(this.recent, ticket, () => this.readRecent(api)),
    ]);
  }

  /** A tenant read again — another persona, scenario or day — starts every region from nothing. */
  forget(): void {
    this.ticket++;
    this.figures.set(idle());
    this.byWarehouse.set(idle());
    this.exceptions.set(idle());
    this.transfers.set(idle());
    this.movementDays.set(idle());
    this.recent.set(idle());
  }

  /** A region keeps what it shows while a newer answer is on its way (AF-02). */
  private async region<T>(
    target: WritableSignal<Region<T>>,
    ticket: number,
    read: () => Promise<T>,
  ): Promise<void> {
    target.update((region) => ({ ...region, pending: true, failed: false }));
    try {
      const value = await read();
      if (ticket !== this.ticket) return;
      target.set({ value, pending: false, failed: false });
    } catch (error) {
      if (ticket !== this.ticket) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      target.update((region) => ({ ...region, pending: false, failed: true }));
    }
  }

  private async count(
    api: NexoraApi,
    filter: Record<string, FilterValue>,
  ): Promise<number> {
    const answer = await api.inventory.list({ pageSize: 25, sort: 'onHand', filter });
    return answer.page.totalItems;
  }

  private async readByWarehouse(api: NexoraApi): Promise<readonly WarehouseExceptions[]> {
    return Promise.all(
      this.warehouses.inScope().map(async (warehouse) => {
        const at = { warehouseId: { eq: warehouse.id } };
        const [belowSafety, belowReorder, backordered] = await Promise.all([
          this.count(api, { ...at, belowSafetyStock: true }),
          this.count(api, { ...at, belowReorderPoint: true }),
          this.count(api, { ...at, backordered: { gt: 0 } }),
        ]);
        return { warehouseId: warehouse.id, code: warehouse.code, belowSafety, belowReorder, backordered };
      }),
    );
  }

  private async readFigures(api: NexoraApi): Promise<Figures> {
    const [belowSafety, belowReorder, nothingAvailable, backordered, transfers] = await Promise.all([
      this.count(api, { belowSafetyStock: true }),
      this.count(api, { belowReorderPoint: true }),
      this.count(api, { available: { lte: 0 } }),
      this.count(api, { backordered: { gt: 0 } }),
      api.inventory.transfers.list({ pageSize: 25, filter: { status: { in: [...TRANSFERS_IN_FLIGHT] } } }),
    ]);
    return {
      belowSafety,
      belowReorder,
      nothingAvailable,
      backordered,
      transfersInFlight: transfers.page.totalItems,
    };
  }

  /** The positions below safety stock with the least available first: where the next order is refused. */
  private async readExceptions(
    api: NexoraApi,
  ): Promise<{ rows: readonly InventoryListItem[]; total: number }> {
    const answer = await api.inventory.list({
      pageSize: 25,
      sort: 'available,-backordered',
      filter: { belowSafetyStock: true },
    });
    return { rows: answer.data.slice(0, 8), total: answer.page.totalItems };
  }

  private async readTransfers(api: NexoraApi): Promise<readonly TransferListItem[]> {
    const answer = await api.inventory.transfers.list({
      pageSize: 25,
      sort: '-requestedDate',
      filter: { status: { in: [...TRANSFERS_IN_FLIGHT] } },
    });
    return answer.data;
  }

  /**
   * The ledger's last fourteen days, counted by direction: what came in and
   * what went out, day by day. Movements that only reclassify stock (damage,
   * quarantine) move no on-hand quantity and are in neither bar.
   */
  private async readMovementDays(api: NexoraApi): Promise<readonly MovementDay[]> {
    const today = this.today();
    if (today === '') return [];
    const days = Array.from({ length: MOVEMENT_DAYS }, (_, index) =>
      addDays(today, index - (MOVEMENT_DAYS - 1)),
    );
    const counted = (day: string, direction: 'gt' | 'lt') =>
      api.inventory
        .movements({
          pageSize: 25,
          filter: {
            occurredAt: { gte: `${day}T00:00:00Z`, lt: `${addDays(day, 1)}T00:00:00Z` },
            onHandDelta: { [direction]: 0 },
          },
        })
        .then((answer) => answer.page.totalItems);
    return Promise.all(
      days.map(async (day) => {
        const [into, out] = await Promise.all([counted(day, 'gt'), counted(day, 'lt')]);
        return { day, in: into, out };
      }),
    );
  }

  private async readRecent(api: NexoraApi): Promise<readonly MovementListItem[]> {
    const answer = await api.inventory.movements({
      pageSize: 25,
      filter: { occurredAt: { lt: `${addDays(this.today(), 1)}T00:00:00Z` } },
    });
    return answer.data.slice(0, 8);
  }
}

/** `YYYY-MM-DD` plus a number of days, on the UTC calendar the backend writes dates in. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
