import { Component } from '@angular/core';
import {
  providePaginationDefaults,
  SlPagination,
  SlPaginationItems,
  SlPaginationPageSize,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-pagination-defaults',
  imports: [
    SlPagination,
    SlPaginationItems,
    SlPaginationPageSize,
    SlPaginationStatus,
    SlStack,
    SlText,
  ],
  providers: [
    providePaginationDefaults({
      defaultPageSize: 50,
      pageSizeOptions: [25, 50, 100],
      siblingCount: 2,
    }),
  ],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">Inherits two siblings and 50 rows</p>
      <nav slPagination aria-label="Orders, inherited" [count]="1200" [defaultPage]="10">
        <sl-pagination-page-size />
        <p slPaginationStatus></p>
        <sl-pagination-items />
      </nav>
      <p slText size="sm" tone="muted">States no siblings and keeps the rest</p>
      <nav
        slPagination
        aria-label="Orders, own row"
        [count]="1200"
        [defaultPage]="10"
        [siblingCount]="0"
      >
        <sl-pagination-page-size />
        <p slPaginationStatus></p>
        <sl-pagination-items />
      </nav>
    </div>
  `,
})
export class PaginationApplicationDefaults {}
