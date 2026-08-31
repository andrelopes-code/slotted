import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';

import { SlTabsIdFactory } from './tabs-id';
import type { TabsActivation, TabsOrientation } from './tabs.constants';

@Component({
  selector: 'div[slTabs]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/tabs/tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-tabs',
    'data-slotted-component': 'tabs',
    'data-part': 'root',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SlTabs {
  readonly activation = input<TabsActivation>('automatic');
  readonly orientation = input<TabsOrientation>('horizontal');
  readonly value = model<string | undefined>(undefined);
  readonly tabsId = input<string | null>(null, { alias: 'id' });

  private readonly generatedId = inject(SlTabsIdFactory).next();

  readonly base = computed(() => this.tabsId() ?? this.generatedId);

  tabId(value: string) {
    return `${this.base()}-tab-${value}`;
  }

  panelId(value: string) {
    return `${this.base()}-panel-${value}`;
  }

  select(value: string) {
    this.value.set(value);
  }
}
