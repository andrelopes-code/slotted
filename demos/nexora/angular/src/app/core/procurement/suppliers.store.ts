import { Injectable } from '@angular/core';
import type {
  ListQuery,
  ListResponse,
  NexoraApi,
  SupplierListItem,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/**
 * The supplier directory (§12, §65.1) with each supplier's performance. The
 * on-time share is filtered in percent and travels in basis points; the spend
 * is filtered in dollars and travels in cents.
 */
@Injectable({ providedIn: 'root' })
export class SuppliersStore extends ListStore<SupplierListItem> {
  protected readonly scales: ScaleMap = { onTimeDeliveryBps: 100, annualSpendUsd: 100 };
  protected readonly failureMessage = 'The suppliers could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<SupplierListItem>> {
    return api.suppliers.list(query);
  }
}
