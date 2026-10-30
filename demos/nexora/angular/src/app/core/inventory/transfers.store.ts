import { Injectable } from '@angular/core';
import type {
  ListQuery,
  ListResponse,
  NexoraApi,
  TransferListItem,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/** Stock moving between warehouses (§61), scoped to the transfers that leave or reach the reader's. */
@Injectable({ providedIn: 'root' })
export class TransfersStore extends ListStore<TransferListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The transfers could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<TransferListItem>> {
    return api.inventory.transfers.list(query);
  }
}
