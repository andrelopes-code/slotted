import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';

@Component({
  selector: 'app-pagination-rows',
  imports: [
    SlPagination,
    SlPaginationNext,
    SlPaginationPageSize,
    SlPaginationPrevious,
    SlPaginationStatus,
  ],
  template: `
    <nav
      slPagination
      aria-label="Orders"
      [count]="482"
      [defaultPage]="5"
      [defaultPageSize]="25"
      [pageSizeOptions]="[25, 50, 100]"
    >
      <sl-pagination-page-size>Orders per page</sl-pagination-page-size>
      <p slPaginationStatus></p>
      <button slPaginationPrevious type="button"></button>
      <button slPaginationNext type="button"></button>
    </nav>
  `,
})
export class PaginationRows {}
