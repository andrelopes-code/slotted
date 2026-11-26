import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { Component } from '@angular/core';

@Component({
  selector: 'app-breadcrumb-basic',
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlBreadcrumbPage],
  template: `
    <nav slBreadcrumb>
      <ol slBreadcrumbList>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#">Northwind</a></li>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#">Orders</a></li>
        <li slBreadcrumbItem><span slBreadcrumbPage>ORD-10248</span></li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbBasic {}
