import { Component, signal } from '@angular/core';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';

@Component({
  selector: 'app-pagination-cursor',
  imports: [SlPagination, SlPaginationNext, SlPaginationPrevious, SlPaginationStatus],
  template: `
    <nav slPagination aria-label="Shipments" [page]="page()" (pageChange)="page.set($event.value)">
      <button slPaginationPrevious type="button"></button>
      <p slPaginationStatus>Shipments, page {{ page() }}</p>
      <button slPaginationNext type="button"></button>
    </nav>
  `,
})
export class PaginationCursor {
  protected readonly page = signal(1);
}
