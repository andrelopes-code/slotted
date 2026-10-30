import { Directive, inject } from '@angular/core';

import { SlCheckboxIdFactory } from './checkbox-defaults';

/**
 * Help text under a box's label.
 *
 * It is a directive on the consumer's own element, so a `p`, a `span` or an
 * `inline-message` all work and none of them loses its own semantics. It
 * carries an identifier the box points `aria-describedby` at, which is what
 * makes the sentence a description rather than part of the name — and it is
 * projected outside the `label` for the same reason.
 */
@Directive({
  selector: '[slCheckboxDescription]',
  standalone: true,
  exportAs: 'slCheckboxDescription',
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[attr.id]': 'id',
  },
})
export class SlCheckboxDescription {
  readonly id = `${inject(SlCheckboxIdFactory).next()}-description`;
}
