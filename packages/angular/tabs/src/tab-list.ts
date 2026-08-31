import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';

import { SlTabs } from './tabs';

@Directive({
  selector: 'div[slTabList]',
  standalone: true,
  host: {
    'data-part': 'list',
    role: 'tablist',
    '[attr.aria-orientation]': 'tabs.orientation()',
  },
})
export class SlTabList implements AfterViewInit, OnDestroy {
  protected readonly tabs = inject(SlTabs);
  private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private handle: RovingTabindexHandle | null = null;

  constructor() {
    // Reading the selected value in an effect keeps the tab stop on the
    // selected tab without recreating the handle, which would drop focus.
    effect(() => {
      const value = this.tabs.value();
      const handle = this.handle;
      if (handle === null) return;
      handle.refresh();
      const items = [...this.element.querySelectorAll<HTMLElement>('[role="tab"]')];
      const index = items.findIndex((item) => item.dataset['value'] === value);
      if (index !== -1) handle.setActive(index);
    });
    inject(DestroyRef).onDestroy(() => this.ngOnDestroy());
  }

  ngAfterViewInit() {
    this.handle = createRovingTabindex(this.element, {
      itemSelector: '[role="tab"]',
      onMove: (_index, item) => {
        const value = item.dataset['value'];
        if (this.tabs.activation() === 'automatic' && value !== undefined) this.tabs.select(value);
      },
      orientation: () => this.tabs.orientation(),
    });
  }

  ngOnDestroy() {
    this.handle?.destroy();
    this.handle = null;
  }
}
