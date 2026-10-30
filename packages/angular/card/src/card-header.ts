import { Directive } from '@angular/core';

/** A title and the line that supports it. Both of them are Typography. */
@Directive({
  selector: '[slCardHeader]',
  standalone: true,
  exportAs: 'slCardHeader',
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlCardHeader {}
