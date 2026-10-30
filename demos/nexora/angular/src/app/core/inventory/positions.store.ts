import { Injectable } from '@angular/core';
import type {
  InventoryListItem,
  ListQuery,
  ListResponse,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/**
 * The stock positions, one SKU in one warehouse per row (`GET /inventory`),
 * scoped by the backend to the reader's warehouses. It is the list an
 * operator asks "what is below its reorder point in CHI-01" of.
 */
@Injectable({ providedIn: 'root' })
export class PositionsStore extends ListStore<InventoryListItem> {
  /** The value is money and travels in minor units; the reader types it in dollars. */
  protected readonly scales: ScaleMap = { onHandValue: 100 };
  protected readonly failureMessage = 'The stock positions could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<InventoryListItem>> {
    return api.inventory.list(query);
  }
}
