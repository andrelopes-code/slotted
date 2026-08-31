import { Directive } from '@angular/core';

/**
 * An ordered list, because the crumbs are a path and their order is the
 * information. A ul would say these are siblings.
 */
@Directive({
  selector: 'ol[slBreadcrumbList]',
  standalone: true,
  host: {
    'data-part': 'list',
  },
})
export class SlBreadcrumbList {}
