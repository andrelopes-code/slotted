import { Injectable } from '@angular/core';
import type { ListQuery, ListResponse, NexoraApi } from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { ListStore } from '../backend/list.store';
import type { CreditMemoListItem } from './finance.model';

/** Credit memos (§66.11), filtered by amount in US dollars as `creditMemoResource` compares them. */
@Injectable({ providedIn: 'root' })
export class CreditMemosStore extends ListStore<CreditMemoListItem> {
  protected readonly scales: ScaleMap = { total: 100, unappliedAmount: 100 };
  protected readonly failureMessage = 'The credit memos could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<CreditMemoListItem>> {
    return api.finance.creditMemos.list(query);
  }
}
