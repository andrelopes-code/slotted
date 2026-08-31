import { Directive } from '@angular/core';

@Directive({
  selector: 'li[slBreadcrumbItem]',
  standalone: true,
  host: {
    'data-part': 'item',
  },
})
export class SlBreadcrumbItem {}
