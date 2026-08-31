import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export type DescriptionListOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'dl[slDescriptionList]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/description-list/description-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-description-list',
    'data-slotted-component': 'description-list',
    'data-part': 'root',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SlDescriptionList {
  readonly orientation = input<DescriptionListOrientation>('vertical');
}
