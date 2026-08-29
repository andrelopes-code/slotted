import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import type { ButtonGroupOrientation } from './button.constants';

@Component({
  selector: 'div[slButtonGroup]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: './button-group.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button-group',
    role: 'group',
    'data-slotted-component': 'button-group',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SlButtonGroup {
  readonly orientation = input<ButtonGroupOrientation>('horizontal');
}
