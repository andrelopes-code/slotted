import { Directive } from '@angular/core';

/**
 * A term may be followed by several of these. The stylesheet pins them to one
 * column so they stay under their term rather than displacing the next one.
 */
@Directive({
  selector: 'dd[slDescriptionDetails]',
  standalone: true,
  host: {
    'data-part': 'details',
  },
})
export class SlDescriptionDetails {}
