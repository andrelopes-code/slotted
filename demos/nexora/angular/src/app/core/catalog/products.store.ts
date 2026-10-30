import { Injectable } from '@angular/core';
import type { FilterDescriptor } from '@slotted/core/filter';
import type {
  ListQuery,
  ListResponse,
  NexoraApi,
  ProductListItem,
} from '@slotted/demo-nexora-backend';

import type { ScaleMap } from '../backend/list-query';
import { CatalogListStore } from './catalog-list.store';
import { PRODUCTS_ROUTE } from './catalog.model';

/** The filter kinds the list offers, by the backend field each one reads. */
export const PRODUCT_FILTER_KINDS: Readonly<Record<string, FilterDescriptor['kind']>> = {
  status: 'set',
  brand: 'text',
  categoryName: 'text',
  tags: 'text',
  skuCount: 'number',
  activeSkuCount: 'number',
  updatedAt: 'date',
};

/**
 * The products of the catalogue, and — when the reader arrived from the tree —
 * of one place in it. A product is the header of a family: `GET /products`
 * answers with the category, the tags and how many of its SKUs are active, and
 * with nothing a warehouse counts.
 */
@Injectable({ providedIn: 'root' })
export class ProductsStore extends CatalogListStore<ProductListItem> {
  protected readonly scales: ScaleMap = {};
  protected readonly failureMessage = 'The products could not be loaded';

  protected read(api: NexoraApi, query: ListQuery): Promise<ListResponse<ProductListItem>> {
    return api.catalog.products(query);
  }

  routeFor(id: string): string {
    return `${PRODUCTS_ROUTE}/${id}`;
  }
}
