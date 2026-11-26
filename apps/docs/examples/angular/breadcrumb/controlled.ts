import { Component, signal } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

@Component({
  selector: 'app-breadcrumb-controlled',
  imports: [
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlButton,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <nav
        slBreadcrumb
        [expanded]="expanded()"
        [maxItems]="4"
        (expandedChange)="expanded.set($event.value)"
      >
        <ol slBreadcrumbList>
          @for (level of levels; track level) {
            <li slBreadcrumbItem>
              <a slBreadcrumbLink href="#">{{ level }}</a>
            </li>
          }
          <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
        </ol>
      </nav>
      <div slInline [gap]="3">
        <button slButton variant="outline" [disabled]="!expanded()" (click)="expanded.set(false)">
          Fold the trail
        </button>
        <span slText size="sm" tone="muted">{{ expanded() ? 'Expanded' : 'Folded' }}</span>
      </div>
    </div>
  `,
})
export class BreadcrumbControlled {
  protected readonly expanded = signal(false);
  protected readonly levels = LEVELS;
}
