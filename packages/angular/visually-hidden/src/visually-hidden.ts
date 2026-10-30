import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Content that assistive technology reaches and sight does not. Bound to an
 * attribute rather than to an element, because the element is the consumer's
 * decision: a live region is a span, a skip link is an anchor.
 *
 * The family paints nothing. `focusable` stops the hiding while focus is
 * inside, and what appears is the element the consumer wrote — a skip link's
 * appearance belongs to the link, not to a hiding rule.
 */
@Component({
  selector: '[slVisuallyHidden]',
  standalone: true,
  exportAs: 'slVisuallyHidden',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/visually-hidden/visually-hidden.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'visually-hidden',
    'data-ui-visually-hidden': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-focusable]': "focusable() ? '' : null",
  },
})
export class SlVisuallyHidden {
  readonly focusable = input(false, { transform: booleanAttribute });
}
