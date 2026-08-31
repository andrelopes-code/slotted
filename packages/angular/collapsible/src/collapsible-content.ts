import { Directive } from '@angular/core';

@Directive({
  selector: 'div[slCollapsibleContent]',
  standalone: true,
  host: {
    'data-part': 'content',
  },
})
export class SlCollapsibleContent {}
