import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';

@Component({
  selector: 'app-pagination-messages',
  imports: [
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
    SlPaginationStatus,
  ],
  template: `
    <nav slPagination [count]="482" [defaultPage]="12" [messages]="messages">
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
      <p slPaginationStatus></p>
    </nav>
  `,
})
export class PaginationMessages {
  protected readonly messages = {
    label: 'Shipments',
    next: 'Later shipments',
    page: 'Shipments page {page}',
    previous: 'Earlier shipments',
    range: '{start} to {end} of {count} shipments',
  };
}
