import { computed, inject, signal } from '@angular/core';
import type { GridQuery } from '@slotted/core/grid';
import type { FilterValue } from '@slotted/demo-nexora-backend';

import { ListStore } from '../backend/list.store';
import { CategoriesStore, type CategoryNode } from './categories.store';

/**
 * What the two catalogue listings share beside `ListStore`: the category the
 * list stands in. The catalogue is read-only (`backend/api/index.ts` spreads
 * no command group into `catalog`), so there is no selection, no bulk action
 * and no mutation to read back.
 */
export abstract class CatalogListStore<Row> extends ListStore<Row> {
  protected readonly categories = inject(CategoriesStore);

  /**
   * The place the list stands in, or null for the whole catalogue. Both
   * resources carry `categoryId`, so a branch narrows either list; the
   * category is not one of the bar's pills, it is where the reader is (BR-01).
   */
  readonly categoryId = signal<string | null>(null);
  readonly category = computed<CategoryNode | null>(() => this.categories.node(this.categoryId()));
  /** How many categories the place covers beside the one that names it. */
  readonly categoriesUnder = computed(() => Math.max(0, (this.category()?.subtree.length ?? 1) - 1));

  protected override scopeFilter(): Record<string, FilterValue> {
    const node = this.category();
    return node === null ? {} : { categoryId: { in: [...node.subtree] } };
  }

  /**
   * Opening the list in a place: the tree has to be in hand before the query
   * can say what the place holds, so the categories are read first and the
   * rows follow. A place that no longer exists opens the whole catalogue.
   */
  async openIn(categoryId: string | null, initial: GridQuery | null = null): Promise<void> {
    if (categoryId !== null) await this.categories.open();
    const resolved = categoryId !== null && this.categories.node(categoryId) ? categoryId : null;
    if (resolved !== this.categoryId()) {
      this.categoryId.set(resolved);
      this.forget();
    }
    await this.open(initial);
  }
}
