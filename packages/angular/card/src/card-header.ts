import { Directive } from '@angular/core';

@Directive({
  selector: '[slCardHeader]',
  standalone: true,
  host: {
    'data-part': 'header',
  },
})
export class SlCardHeader {}
