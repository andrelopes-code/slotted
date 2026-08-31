import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * A surface with three optional regions and no configuration. Everything that
 * differs between one card and another in an application is a token, so the
 * component has nothing to decide.
 */
@Component({
  selector: '[slCard]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/card/card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-card',
    'data-slotted-component': 'card',
    'data-part': 'root',
  },
})
export class SlCard {}
