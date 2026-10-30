import { Directive, inject } from '@angular/core';

import { SlSwitchIdFactory } from './switch-defaults';

/**
 * Help text under a switch's label.
 *
 * It is a directive on the consumer's own element, so a `p`, a `span` or an
 * `inline-message` all work and none of them loses its own semantics. It
 * carries an identifier the switch points `aria-describedby` at, which is what
 * makes the sentence a description rather than part of the name — and it is
 * projected outside the `label` for the same reason.
 */
@Directive({
  selector: '[slSwitchDescription]',
  standalone: true,
  exportAs: 'slSwitchDescription',
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[attr.id]': 'id',
  },
})
export class SlSwitchDescription {
  readonly id = `${inject(SlSwitchIdFactory).next()}-description`;
}
