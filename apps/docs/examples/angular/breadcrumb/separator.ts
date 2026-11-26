import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';

@Component({
  selector: 'app-breadcrumb-separator',
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlBreadcrumbPage],
  template: `
    <ng-template #mark>›</ng-template>

    <nav slBreadcrumb [separator]="mark">
      <ol slBreadcrumbList>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#">Northwind</a></li>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#">Finance</a></li>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#">Receivables</a></li>
        <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbSeparator {}
