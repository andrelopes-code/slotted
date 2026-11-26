import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';

@Component({
  selector: 'app-pagination-wiring',
  imports: [SlButton, SlPagination, SlPaginationItems, SlPaginationNext, SlPaginationPrevious],
  template: `
    <nav slPagination #pager="slPagination" aria-label="Invoices" [count]="482" [defaultPage]="12">
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
      <button slButton (click)="pager.goToPage(1)">Back to page 1</button>
    </nav>
  `,
})
export class PaginationWiring {}
