import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

@Component({
  selector: 'app-breadcrumb-collapse',
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlBreadcrumbPage],
  template: `
    <nav slBreadcrumb [maxItems]="4" [itemsBeforeCollapse]="1" [itemsAfterCollapse]="2">
      <ol slBreadcrumbList>
        @for (level of levels; track level) {
          <li slBreadcrumbItem>
            <a slBreadcrumbLink href="#">{{ level }}</a>
          </li>
        }
        <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbCollapse {
  protected readonly levels = LEVELS;
}
