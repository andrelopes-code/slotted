import { Injectable } from '@angular/core';
import type {
  InvoiceListItem,
  ListQuery,
  ListResponse,
  NexoraApi,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';

/**
 * Invoices (§13, §66). The amounts are filtered in US dollars and travel in
 * cents: `invoiceResource` compares every invoice by what it is worth in
 * dollars, whatever currency it is written in.
 */
@Injectable({ providedIn: 'root' })
export class InvoicesStore extends ListStore<InvoiceListItem> {
  protected readonly scales: ScaleMap = { total: 100, outstanding: 100, paidAmount: 100 };
  protected readonly failureMessage = 'The invoices could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<InvoiceListItem>> {
    return api.finance.invoices.list(query);
  }
}
