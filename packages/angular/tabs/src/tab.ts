import { booleanAttribute, computed, Directive, inject, input } from '@angular/core';

import { SlTabs } from './tabs';

@Directive({
  selector: 'button[slTab]',
  standalone: true,
  host: {
    'data-part': 'tab',
    role: 'tab',
    type: 'button',
    '[attr.id]': 'tabs.tabId(value())',
    '[attr.data-value]': 'value()',
    '[attr.aria-controls]': 'tabs.panelId(value())',
    '[attr.aria-selected]': 'selected()',
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[disabled]': 'disabled()',
    '(click)': 'select()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class SlTab {
  readonly value = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly tabs = inject(SlTabs);

  readonly selected = computed(() => this.tabs.value() === this.value());

  select() {
    if (this.disabled()) return;
    this.tabs.select(this.value());
  }

  handleKeydown(event: KeyboardEvent) {
    if (this.tabs.activation() !== 'manual') return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.select();
  }
}
