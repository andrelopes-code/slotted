import { Directive } from '@angular/core';

/** The content. It takes whatever a card stretched to a row height has left. */
@Directive({
  selector: '[slCardBody]',
  standalone: true,
  exportAs: 'slCardBody',
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlCardBody {}
