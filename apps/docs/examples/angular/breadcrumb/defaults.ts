import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
  provideBreadcrumbDefaults,
} from '@slotted/angular/breadcrumb';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

@Component({
  selector: 'app-breadcrumb-defaults',
  imports: [
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlStack,
    SlText,
  ],
  providers: [provideBreadcrumbDefaults({ itemsAfterCollapse: 1, maxItems: 4 })],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">Inherits the defaults</span>
        <nav slBreadcrumb>
          <ol slBreadcrumbList>
            @for (level of levels; track level) {
              <li slBreadcrumbItem>
                <a slBreadcrumbLink href="#">{{ level }}</a>
              </li>
            }
            <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
          </ol>
        </nav>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">maxItems=0 and overflow="wrap" on the trail</span>
        <nav slBreadcrumb [maxItems]="0" overflow="wrap">
          <ol slBreadcrumbList>
            @for (level of levels; track level) {
              <li slBreadcrumbItem>
                <a slBreadcrumbLink href="#">{{ level }}</a>
              </li>
            }
            <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
          </ol>
        </nav>
      </div>
    </div>
  `,
})
export class BreadcrumbDefaults {
  protected readonly levels = LEVELS;
}
