import { Injectable } from '@angular/core';
import type {
  ListQuery,
  ListResponse,
  NexoraApi,
  PurchaseOrderListItem,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/**
 * Purchase orders (§12, §65.3). A reader scoped to warehouses is answered the
 * orders bound for them by the backend itself: the scope is the list's place,
 * never one of the bar's pills (BR-01).
 */
@Injectable({ providedIn: 'root' })
export class PurchaseOrdersStore extends ListStore<PurchaseOrderListItem> {
  protected readonly scales: ScaleMap = { receivedShareBps: 100 };
  protected readonly failureMessage = 'The purchase orders could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<PurchaseOrderListItem>> {
    return api.purchaseOrders.list(query);
  }

}
