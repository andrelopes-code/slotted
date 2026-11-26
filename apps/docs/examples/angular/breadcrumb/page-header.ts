import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-breadcrumb-page-header',
  imports: [
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlHeading,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="2">
      <nav slBreadcrumb>
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><a slBreadcrumbLink href="#">Northwind</a></li>
          <li slBreadcrumbItem><a slBreadcrumbLink href="#">Finance</a></li>
          <li slBreadcrumbItem><a slBreadcrumbLink href="#">Invoices</a></li>
          <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>
        </ol>
      </nav>
      <h1 slHeading size="lg">INV-2026-08-0041</h1>
      <p slText size="sm" tone="muted">Kiln &amp; Co. · Net 30 · due September 12, 2026</p>
    </div>
  `,
})
export class BreadcrumbPageHeader {}
