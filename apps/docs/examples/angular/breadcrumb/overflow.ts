import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const LEVELS = [
  'Northwind',
  'Distribution centers',
  'Rotterdam',
  'Inbound receiving',
  'Purchase orders',
  'Kiln & Co.',
];

@Component({
  selector: 'app-breadcrumb-overflow',
  imports: [
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">overflow="collapse"</span>
        <nav slBreadcrumb>
          <ol slBreadcrumbList>
            @for (level of levels; track level) {
              <li slBreadcrumbItem>
                <a slBreadcrumbLink href="#">{{ level }}</a>
              </li>
            }
            <li slBreadcrumbItem><span slBreadcrumbPage>PO-2026-08-0412</span></li>
          </ol>
        </nav>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">overflow="wrap"</span>
        <nav slBreadcrumb overflow="wrap">
          <ol slBreadcrumbList>
            @for (level of levels; track level) {
              <li slBreadcrumbItem>
                <a slBreadcrumbLink href="#">{{ level }}</a>
              </li>
            }
            <li slBreadcrumbItem><span slBreadcrumbPage>PO-2026-08-0412</span></li>
          </ol>
        </nav>
      </div>
    </div>
  `,
})
export class BreadcrumbOverflow {
  protected readonly levels = LEVELS;
}
