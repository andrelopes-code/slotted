import { Directive } from '@angular/core';

@Directive({
  selector: '[slCardBody]',
  standalone: true,
  host: {
    'data-part': 'body',
  },
})
export class SlCardBody {}
