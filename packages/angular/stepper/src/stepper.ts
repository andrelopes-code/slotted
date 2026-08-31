import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * An ordered list, because the steps are a sequence and their order is the
 * information. The component adds no role: a list of steps is a list.
 */
@Component({
  selector: 'ol[slStepper]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/stepper/stepper.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-stepper',
    'data-slotted-component': 'stepper',
    'data-part': 'root',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SlStepper {
  readonly orientation = input<StepperOrientation>('horizontal');
}
