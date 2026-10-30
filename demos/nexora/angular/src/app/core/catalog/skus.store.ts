import { Injectable } from '@angular/core';
import type { FilterDescriptor } from '@slotted/core/filter';
import type { ListQuery, ListResponse, NexoraApi, SkuListItem } from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { CatalogListStore } from './catalog-list.store';
import { SKUS_ROUTE } from './catalog.model';

/**
 * The filter kinds the list offers, by the backend field each one reads. The
 * quantity fields are declared as numbers: the backend parses a quantity
 * filter through `quantityToMilli`, so a plain number travels as it is.
 */
export const SKU_FILTER_KINDS: Readonly<Record<string, FilterDescriptor['kind']>> = {
  status: 'set',
  brand: 'text',
  categoryName: 'text',
  productName: 'text',
  unitOfMeasure: 'set',
  taxClass: 'set',
  reorderMode: 'set',
  onHand: 'number',
  available: 'number',
  reserved: 'number',
  inbound: 'number',
  backordered: 'boolean',
  belowReorderPoint: 'boolean',
  leadTimeDays: 'number',
  listPrice: 'number',
  standardCost: 'number',
  updatedAt: 'date',
};

/**
 * Money travels in minor units (`comparableValue` reads `Money.minor`), so a
 * filter typed in dollars is multiplied before it leaves and divided when a
 * saved tree is read back.
 */
export const SKU_SCALES: ScaleMap = { listPrice: 100, standardCost: 100 };

/**
 * The stockable items. A product is a family header; this is what a warehouse
 * counts and an order buys, and it is the only catalogue resource that answers
 * "what is below its reorder point" — `GET /skus` filters by thirteen fields
 * the product does not have.
 */
@Injectable({ providedIn: 'root' })
export class SkusStore extends CatalogListStore<SkuListItem> {
  protected readonly scales = SKU_SCALES;
  protected readonly failureMessage = 'The SKUs could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<SkuListItem>> {
    return api.catalog.skus(query);
  }

  routeFor(id: string): string {
    return `${SKUS_ROUTE}/${id}`;
  }
}
