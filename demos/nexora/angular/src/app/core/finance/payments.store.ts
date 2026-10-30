import { Injectable } from '@angular/core';
import type { ListQuery, ListResponse, NexoraApi } from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';
import type { PaymentListItem } from './finance.model';

/** Payments received (§66.7), filtered by amount in US dollars as `paymentResource` compares them. */
@Injectable({ providedIn: 'root' })
export class PaymentsStore extends ListStore<PaymentListItem> {
  protected readonly scales: ScaleMap = { amount: 100, unappliedAmount: 100 };
  protected readonly failureMessage = 'The payments could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<PaymentListItem>> {
    return api.finance.payments.list(query);
  }
}
