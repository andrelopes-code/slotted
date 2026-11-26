import { Component } from '@angular/core';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-pagination-range',
  imports: [
    SlPagination,
    SlPaginationNext,
    SlPaginationPrevious,
    SlPaginationStatus,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">The range is announced after each page change</p>
      <nav slPagination aria-label="Invoices, announced" [count]="482" [defaultPage]="2">
        <button slPaginationPrevious type="button"></button>
        <p slPaginationStatus></p>
        <button slPaginationNext type="button"></button>
      </nav>
      <p slText size="sm" tone="muted">The range is displayed and never announced</p>
      <nav slPagination aria-label="Invoices, silent" live="off" [count]="482" [defaultPage]="2">
        <button slPaginationPrevious type="button"></button>
        <p slPaginationStatus></p>
        <button slPaginationNext type="button"></button>
      </nav>
    </div>
  `,
})
export class PaginationRange {}
