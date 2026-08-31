import { Directive } from '@angular/core';

/**
 * An unordered list, where Breadcrumb uses an ordered one. The pages are
 * siblings a reader may visit in any order, and numbering them twice tells a
 * screen reader nothing it cannot already read on the controls.
 */
@Directive({
  selector: 'ul[slPaginationList]',
  standalone: true,
  host: {
    'data-part': 'list',
  },
})
export class SlPaginationList {}
