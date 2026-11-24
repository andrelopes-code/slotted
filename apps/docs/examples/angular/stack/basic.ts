import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-stack-basic',
  imports: [SlBadge, SlHeading, SlInline, SlStack, SlText],
  template: `
    <div slStack>
      <h2 slHeading size="md">Order SO-10482</h2>
      <span slText tone="muted">Placed by Maria Chen on March 4 for the Harbor Street store.</span>
      <div slInline [gap]="2">
        <span slBadge tone="success">Shipped</span>
        <span slBadge tone="info">Wholesale</span>
      </div>
      <span slText>Estimated delivery on March 9.</span>
    </div>
  `,
})
export class StackBasic {}
