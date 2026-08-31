import { Directive } from '@angular/core';

@Directive({
  selector: '[slCardFooter]',
  standalone: true,
  host: {
    'data-part': 'footer',
  },
})
export class SlCardFooter {}
