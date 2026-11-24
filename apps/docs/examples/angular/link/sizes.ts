import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-link-sizes',
  imports: [SlInline, SlLink, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline align="baseline" [gap]="4">
        <a slLink href="#orders" size="xs">Orders</a>
        <a slLink href="#shipments" size="sm">Shipments</a>
        <a slLink href="#returns" size="md">Returns</a>
      </div>
      <span slText size="lg">
        Without a size, a link takes the text around it:
        <a slLink href="#forecast">open the demand forecast</a>.
      </span>
    </div>
  `,
})
export class LinkSizes {}
