import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';

@Component({
  selector: 'app-link-current',
  imports: [SlInline, SlLink],
  template: `
    <nav aria-label="Workspace">
      <div slInline [gap]="4">
        <a slLink aria-current="page" href="#orders" underline="hover">Orders</a>
        <a slLink href="#shipments" underline="hover">Shipments</a>
        <a slLink href="#returns" underline="hover">Returns</a>
        <a slLink href="#suppliers" underline="hover">Suppliers</a>
      </div>
    </nav>
  `,
})
export class LinkCurrent {}
