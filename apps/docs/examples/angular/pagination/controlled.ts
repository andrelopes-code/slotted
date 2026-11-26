import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-pagination-controlled',
  imports: [
    SlButton,
    SlInline,
    SlPagination,
    SlPaginationItems,
    SlPaginationNext,
    SlPaginationPrevious,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <nav
        slPagination
        aria-label="Invoices"
        [count]="count()"
        [page]="page()"
        (pageChange)="page.set($event.value); reason.set($event.reason)"
      >
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items />
        <button slPaginationNext type="button"></button>
      </nav>
      <p slText size="sm" tone="muted">
        {{ count() }} invoices, page {{ page() }}. Last change: {{ reason() }}.
      </p>
      <div slInline>
        <button slButton (click)="count.set(96)">Show open invoices</button>
        <button slButton (click)="count.set(482)">Show all invoices</button>
      </div>
    </div>
  `,
})
export class PaginationControlled {
  protected readonly count = signal(482);
  protected readonly page = signal(25);
  protected readonly reason = signal('none yet');
}
