import { Component } from '@angular/core';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbTrigger,
} from '@slotted/angular/breadcrumb';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';

@Component({
  selector: 'app-breadcrumb-switcher',
  imports: [
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbTrigger,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
  ],
  template: `
    <nav slBreadcrumb>
      <ol slBreadcrumbList>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#">Northwind</a></li>
        <li slBreadcrumbItem>
          <button slBreadcrumbTrigger [slMenuTriggerFor]="ledgers">Accounts receivable</button>
          <sl-menu #ledgers>
            <button slMenuItem>Accounts payable</button>
            <button slMenuItem>Accounts receivable</button>
            <button slMenuItem>General ledger</button>
          </sl-menu>
        </li>
        <li slBreadcrumbItem>
          <button slBreadcrumbTrigger current [slMenuTriggerFor]="periods">August 2026</button>
          <sl-menu #periods>
            <button slMenuItem>July 2026</button>
            <button slMenuItem>August 2026</button>
            <button slMenuItem>September 2026</button>
          </sl-menu>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbSwitcher {}
