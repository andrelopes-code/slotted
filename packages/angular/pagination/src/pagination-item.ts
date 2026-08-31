import { Directive } from '@angular/core';

@Directive({
  selector: 'li[slPaginationItem]',
  standalone: true,
  host: {
    'data-part': 'item',
  },
})
export class SlPaginationItem {}
