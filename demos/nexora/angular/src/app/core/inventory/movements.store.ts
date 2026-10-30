import { computed, Injectable, signal } from '@angular/core';
import type { GridQuery } from '@slotted/core/grid';
import type {
  FilterValue,
  ListQuery,
  ListResponse,
  MovementListItem,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/** Where the ledger stands: one SKU, or what one source record moved. */
export interface LedgerPlace {
  readonly skuId: string | null;
  readonly sourceId: string | null;
}

const NOWHERE: LedgerPlace = { skuId: null, sourceId: null };

/**
 * The stock ledger (§60.1, `GET /stock-movements`): immutable, newest first,
 * scoped by the backend to the reader's warehouses.
 *
 * A SKU and a source record are places rather than pills (BR-01): the reader
 * arrives from the SKU's stock or from a transfer, a notification or a count,
 * and the identifier the backend filters by is not a value anyone types.
 */
@Injectable({ providedIn: 'root' })
export class MovementsStore extends ListStore<MovementListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The movements could not be loaded';

  readonly place = signal<LedgerPlace>(NOWHERE);
  readonly placed = computed(() => this.place().skuId !== null || this.place().sourceId !== null);

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<MovementListItem>> {
    return api.inventory.movements(query);
  }

  protected override scopeFilter(): Record<string, FilterValue> {
    const place = this.place();
    return {
      ...(place.skuId === null ? {} : { skuId: { eq: place.skuId } }),
      ...(place.sourceId === null ? {} : { sourceEntityId: { eq: place.sourceId } }),
    };
  }

  async openAt(place: LedgerPlace, initial: GridQuery | null = null): Promise<void> {
    const current = this.place();
    if (current.skuId !== place.skuId || current.sourceId !== place.sourceId) {
      this.place.set(place);
      this.forget();
    }
    await this.open(initial);
  }

  /** A door's query read in the whole ledger, whatever the list held before (OV-01). */
  async openDoor(query: GridQuery): Promise<void> {
    const current = this.place();
    if (current.skuId !== null || current.sourceId !== null) {
      this.place.set({ skuId: null, sourceId: null });
      this.forget();
    }
    await Promise.all([this.load(query), this.loadGrandTotal()]);
  }

  /** One movement by its id: the resource has no `GET /stock-movements/:id`, so it is a filter of one. */
  async one(id: string): Promise<MovementListItem | null> {
    const api = await this.backend.ready();
    const answer = await api.inventory.movements({ filter: { id: { eq: id } }, pageSize: 25 });
    return answer.data[0] ?? null;
  }
}
