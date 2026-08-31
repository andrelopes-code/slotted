import { Directive } from '@angular/core';

/**
 * A `summary`, which has to be the first child of the `details`. That is the
 * platform's constraint, not the library's, and it is the price of not
 * rebuilding a disclosure out of a button and four ARIA attributes.
 */
@Directive({
  selector: 'summary[slCollapsibleTrigger]',
  standalone: true,
  host: {
    'data-part': 'trigger',
  },
})
export class SlCollapsibleTrigger {}
