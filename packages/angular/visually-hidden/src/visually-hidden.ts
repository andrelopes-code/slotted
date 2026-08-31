import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Bound to an attribute rather than to an element, because the element is the
 * consumer's decision: a live region is a span, a skip link is an anchor. This
 * is the same reasoning that makes `slFieldControl` element-agnostic.
 */
@Component({
  selector: '[slVisuallyHidden]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/visually-hidden/visually-hidden.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-visually-hidden',
    'data-slotted-component': 'visually-hidden',
    'data-part': 'root',
    '[attr.data-focusable]': "focusable() ? '' : null",
  },
})
export class SlVisuallyHidden {
  readonly focusable = input(false, { transform: booleanAttribute });
}
