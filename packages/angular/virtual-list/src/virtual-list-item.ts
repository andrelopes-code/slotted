import { computed, Directive, inject, input, isDevMode, numberAttribute } from '@angular/core';

import { SlVirtualList } from './virtual-list';

/**
 * A row. Everything about where it sits and what it claims is derived from the
 * one index it is given and the list it is inside, so there is no arrangement
 * in which a consumer places a row at the wrong offset or has it report the
 * wrong position in the set.
 */
@Directive({
  selector: 'div[slVirtualListItem]',
  standalone: true,
  host: {
    'data-part': 'item',
    role: 'listitem',
    '[attr.aria-posinset]': 'position()',
    '[attr.aria-setsize]': 'setSize()',
    '[style.block-size.px]': 'size()',
    '[style.inset-block-start.px]': 'offset()',
  },
})
export class SlVirtualListItem {
  readonly index = input.required<number, unknown>({ transform: numberAttribute });

  private readonly list = inject(SlVirtualList, { optional: true });

  protected readonly setSize = computed(() => this.list?.itemCount() ?? null);

  protected readonly position = computed(() => (this.list === null ? null : this.index() + 1));

  protected readonly size = computed(() => this.list?.itemSize() ?? null);

  protected readonly offset = computed(() =>
    this.list === null ? null : this.index() * this.list.itemSize(),
  );

  constructor() {
    if (!isDevMode() || this.list !== null) return;
    console.warn(
      'SlVirtualListItem was used outside an slVirtualList. It takes its size, its position and its place in the set from the list, and has none of them here.',
    );
  }
}
