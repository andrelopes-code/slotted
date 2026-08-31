import { computed, Directive, inject, input } from '@angular/core';

import { SlTabs } from './tabs';

@Directive({
  selector: 'div[slTabPanel]',
  standalone: true,
  host: {
    'data-part': 'panel',
    role: 'tabpanel',
    '[attr.id]': 'tabs.panelId(value())',
    '[attr.aria-labelledby]': 'tabs.tabId(value())',
    '[attr.hidden]': "selected() ? null : ''",
    '[attr.tabindex]': "selected() ? '0' : null",
  },
})
export class SlTabPanel {
  readonly value = input.required<string>();

  protected readonly tabs = inject(SlTabs);

  readonly selected = computed(() => this.tabs.value() === this.value());
}
