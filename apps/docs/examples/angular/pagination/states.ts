import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-pagination-states',
  imports: [
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">At the last page</p>
      <nav slPagination aria-label="Invoices, last page" [count]="482" [defaultPage]="25">
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items />
        <button slPaginationNext type="button"></button>
      </nav>
      <p slText size="sm" tone="muted">Loading the next page</p>
      <nav slPagination aria-label="Invoices, loading" loading [count]="482" [defaultPage]="3">
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items />
        <button slPaginationNext type="button"></button>
      </nav>
      <p slText size="sm" tone="muted">Disabled</p>
      <nav slPagination aria-label="Invoices, disabled" disabled [count]="482" [defaultPage]="3">
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items />
        <button slPaginationNext type="button"></button>
      </nav>
    </div>
  `,
})
export class PaginationStates {}
