import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-pagination-compact',
  imports: [
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlGrid,
    SlHeading,
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
  ],
  template: `
    <div slGrid [columns]="3" [gap]="4" minItemWidth="xs">
      <div slCard>
        <div slCardHeader>
          <h2 slHeading size="md">Receiving</h2>
        </div>
        <div slCardBody>
          <nav slPagination aria-label="Receiving queue" [count]="140" [defaultPage]="3">
            <button slPaginationPrevious type="button"></button>
            <sl-pagination-items />
            <button slPaginationNext type="button"></button>
          </nav>
        </div>
      </div>

      <div slCard>
        <div slCardHeader>
          <h2 slHeading size="md">Picking</h2>
        </div>
        <div slCardBody>
          <nav slPagination aria-label="Picking queue" [count]="482" [defaultPage]="12">
            <button slPaginationPrevious type="button"></button>
            <sl-pagination-items />
            <button slPaginationNext type="button"></button>
          </nav>
        </div>
      </div>

      <div slCard>
        <div slCardHeader>
          <h2 slHeading size="md">Packing</h2>
        </div>
        <div slCardBody>
          <nav slPagination aria-label="Packing queue" [count]="96" [defaultPage]="2">
            <button slPaginationPrevious type="button"></button>
            <sl-pagination-items />
            <button slPaginationNext type="button"></button>
          </nav>
        </div>
      </div>
    </div>
  `,
})
export class PaginationCompact {}
