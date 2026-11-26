import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';

@Component({
  selector: 'app-pagination-links',
  imports: [SlPagination, SlPaginationItems, SlPaginationNext, SlPaginationPrevious],
  template: `
    <nav slPagination aria-label="Invoices" [count]="482" [itemHref]="pageUrl">
      <a slPaginationPrevious></a>
      <sl-pagination-items />
      <a slPaginationNext></a>
    </nav>
  `,
})
export class PaginationLinks {
  protected readonly pageUrl = (page: number) => `#invoices-page-${page}`;
}
