import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-breadcrumb-content',
  imports: [
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlStack,
  ],
  template: `
    <div slStack [gap]="4">
      <nav slBreadcrumb>
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><a slBreadcrumbLink href="#">Northwind</a></li>
          <li slBreadcrumbItem>
            <a slBreadcrumbLink href="#">Intercompany freight reconciliation guidelines</a>
          </li>
          <li slBreadcrumbItem><span slBreadcrumbPage>Carrier surcharges</span></li>
        </ol>
      </nav>
      <nav slBreadcrumb>
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><a slBreadcrumbLink href="#">Shipments</a></li>
          <li slBreadcrumbItem>
            <span slBreadcrumbPage>7f3a9c0e5b2d4186a9e1c7d3f0b85a62e4d91c07</span>
          </li>
        </ol>
      </nav>
      <nav slBreadcrumb>
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><span slBreadcrumbPage>Orders</span></li>
        </ol>
      </nav>
    </div>
  `,
})
export class BreadcrumbContent {}
