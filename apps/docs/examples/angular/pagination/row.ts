import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationFirst,
  SlPaginationItems,
  SlPaginationLast,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-pagination-row',
  imports: [
    SlPagination,
    SlPaginationFirst,
    SlPaginationItems,
    SlPaginationLast,
    SlPaginationNext,
    SlPaginationPrevious,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">One page on each side of the current page and at each end</p>
      <nav slPagination aria-label="Invoices, default row" [count]="482" [defaultPage]="12">
        <button slPaginationFirst type="button"></button>
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items />
        <button slPaginationNext type="button"></button>
        <button slPaginationLast type="button"></button>
      </nav>
      <p slText size="sm" tone="muted">
        Two pages on each side of the current page and at each end
      </p>
      <nav
        slPagination
        aria-label="Invoices, wide row"
        [boundaryCount]="2"
        [count]="482"
        [defaultPage]="12"
        [siblingCount]="2"
      >
        <button slPaginationFirst type="button"></button>
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items />
        <button slPaginationNext type="button"></button>
        <button slPaginationLast type="button"></button>
      </nav>
    </div>
  `,
})
export class PaginationRow {}
