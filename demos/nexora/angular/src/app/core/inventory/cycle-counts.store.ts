import { Injectable } from '@angular/core';
import type {
  CycleCountListItem,
  ListQuery,
  ListResponse,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/** Periodic counts of a warehouse's stock (§62), scoped to the reader's warehouses. */
@Injectable({ providedIn: 'root' })
export class CycleCountsStore extends ListStore<CycleCountListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The cycle counts could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<CycleCountListItem>> {
    return api.inventory.cycleCounts.list(query);
  }
}
