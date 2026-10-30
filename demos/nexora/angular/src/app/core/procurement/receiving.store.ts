import { inject, Injectable, signal } from '@angular/core';
import type {
  FilterValue,
  ListQuery,
  ListResponse,
  NexoraApi,
  PurchaseOrderListItem,
} from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import type { ScaleMap } from '../backend/list-query';
import { LIST_PAGE_SIZE } from '../backend/list-query';
import { ListStore } from '../backend/list.store';
import { WarehousesStore } from '../catalog/warehouses.store';
import { RECEIVABLE } from './procurement.model';

/** One warehouse's inbound work: the orders it waits on, late and not. */
export interface InboundByWarehouse {
  readonly warehouseId: string;
  readonly code: string;
  readonly late: number;
  readonly due: number;
}

/**
 * The receiving queue. The backend has no list of goods receipts and no
 * queue of its own (the ledger row "no GET /goods-receipts"), so the work is
 * read where it is made: the purchase orders a receipt can be written
 * against — sent, acknowledged or partly received. The states are the queue's
 * place (BR-01), the backend answers a warehouse role its own warehouses, and
 * the bar's pills narrow within both.
 */
@Injectable({ providedIn: 'root' })
export class ReceivingStore extends ListStore<PurchaseOrderListItem> {
  private readonly warehouses = inject(WarehousesStore);

  protected readonly scales: ScaleMap = { receivedShareBps: 100 };
  protected readonly failureMessage = 'The receiving queue could not be loaded';

  /** The queue counted per warehouse of the reader's scope; null before the answer. */
  readonly byWarehouse = signal<{ value: readonly InboundByWarehouse[] | null; failed: boolean }>({
    value: null,
    failed: false,
  });

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<PurchaseOrderListItem>> {
    return api.purchaseOrders.list(query);
  }

  protected override scopeFilter(): Record<string, FilterValue> {
    return { status: { in: [...RECEIVABLE] } };
  }

  /** A status pill narrows inside the queue's three states rather than replacing them. */
  protected override withScope(query: ListQuery): ListQuery {
    const scoped = super.withScope(query);
    const chosen = query.filter?.['status'];
    return chosen === undefined ? scoped : { ...scoped, filter: { ...scoped.filter, status: chosen } };
  }

  protected override forget(): void {
    super.forget();
    this.byWarehouse.set({ value: null, failed: false });
  }

  /** Two counts per warehouse — late and not yet late — each the `totalItems` of a filtered read. */
  async loadByWarehouse(): Promise<void> {
    await this.warehouses.open();
    const places = this.warehouses.inScope();
    this.byWarehouse.set({ value: null, failed: false });
    try {
      const api = await this.backend.ready();
      const count = (warehouseId: string, daysLate: FilterValue) =>
        api.purchaseOrders
          .list({
            page: 1,
            pageSize: LIST_PAGE_SIZE,
            filter: { status: { in: [...RECEIVABLE] }, warehouseId: { eq: warehouseId }, daysLate },
          })
          .then((answer) => answer.page.totalItems);
      const rows = await Promise.all(
        places.map(async (place) => {
          const [late, due] = await Promise.all([
            count(place.id, { gt: 0 }),
            count(place.id, { eq: 0 }),
          ]);
          return { warehouseId: place.id, code: place.code, late, due };
        }),
      );
      this.byWarehouse.set({ value: rows, failed: false });
    } catch (error) {
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.byWarehouse.set({ value: null, failed: true });
    }
  }
}
