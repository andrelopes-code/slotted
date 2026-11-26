import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';

@Component({
  selector: 'app-pagination-basic',
  imports: [SlPagination, SlPaginationItems, SlPaginationNext, SlPaginationPrevious],
  template: `
    <nav slPagination aria-label="Invoices" [count]="482" [defaultPage]="12">
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
    </nav>
  `,
})
export class PaginationBasic {}
