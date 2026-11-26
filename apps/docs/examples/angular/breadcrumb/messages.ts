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
  selector: 'app-breadcrumb-messages',
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlBreadcrumbPage],
  template: `
    <nav
      slBreadcrumb
      [maxItems]="4"
      [messages]="{ label: 'Where this invoice sits', showHidden: 'Reveal {count} more levels' }"
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
  `,
})
export class BreadcrumbMessages {
  protected readonly levels = LEVELS;
}
