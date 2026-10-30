import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import type { WarehouseListItem } from '../inventory/inventory.model';
import { SessionStore } from '../session/session.store';

/**
 * The places a stock position can be in, by id. `SkuDetail.inventory` names a
 * warehouse by its id alone, so a catalogue screen that wants to say where the
 * stock is has to read the warehouse directory beside it — a second resource
 * under a second permission (`inventory.view`). See the ledger row "a stock
 * position carries no warehouse code".
 */
@Injectable({ providedIn: 'root' })
export class WarehousesStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly sessionStore = inject(SessionStore);

  readonly rows = signal<readonly WarehouseListItem[]>([]);
  readonly loaded = signal(false);

  readonly byId = computed(() => new Map(this.rows().map((row) => [row.id, row])));
  /** The warehouses this persona is scoped to; `all` for everyone else (§55.6). */
  readonly own = computed<readonly string[] | 'all'>(
    () => this.sessionStore.session()?.warehouseIds ?? 'all',
  );

  private tenant: string | null = null;
  private pending: Promise<void> | null = null;

  constructor() {
    this.tenant = untracked(() => this.tenantKey());
    effect(() => {
      const key = this.tenantKey();
      if (key === null) return;
      untracked(() => {
        if (this.tenant !== null && this.tenant !== key) {
          this.pending = null;
          this.rows.set([]);
          this.loaded.set(false);
        }
        this.tenant = key;
      });
    });
  }

  private tenantKey(): string | null {
    const session = this.sessionStore.session();
    return session === null
      ? null
      : `${session.user.id}|${session.demo.scenarioId}|${session.demo.demoClock}`;
  }

  open(): Promise<void> {
    this.pending ??= this.load();
    return this.pending;
  }

  private async load(): Promise<void> {
    if (!this.sessionStore.can('inventory.view')) {
      this.loaded.set(true);
      return;
    }
    const api = await this.backend.ready();
    const rows = await this.health.read(() => api.inventory.warehouses(), []);
    this.rows.set(rows);
    this.loaded.set(true);
  }

  /** The warehouse's code, or its id where the directory is out of reach. */
  code(warehouseId: string): string {
    return this.byId().get(warehouseId)?.code ?? warehouseId;
  }

  name(warehouseId: string): string {
    return this.byId().get(warehouseId)?.name ?? '';
  }

  /** True where the position stands in a warehouse this persona is scoped to. */
  isOwn(warehouseId: string): boolean {
    const own = this.own();
    return own !== 'all' && own.includes(warehouseId);
  }

  /** True where the persona reads one warehouse of several: the row it owns is marked. */
  readonly scoped = computed(() => this.own() !== 'all');

  /**
   * The warehouses the reader's scope covers. `GET /warehouses` answers all
   * six whatever the scope, so an inventory screen draws from this and never
   * from `rows` (the ledger row "the warehouse directory is not scoped").
   */
  readonly inScope = computed<readonly WarehouseListItem[]>(() => {
    const own = this.own();
    return own === 'all' ? this.rows() : this.rows().filter((row) => own.includes(row.id));
  });

  /** True where the warehouse is one the reader's scope covers. */
  covers(warehouseId: string): boolean {
    const own = this.own();
    return own === 'all' || own.includes(warehouseId);
  }
}
