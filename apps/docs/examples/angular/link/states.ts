import { Component } from '@angular/core';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-link-states',
  imports: [SlLink, SlStack],
  template: `
    <div slStack [gap]="3">
      <a slLink href="#order-4821">Open order 4821</a>
      <a slLink href="#order-4820" visited>Order 4820, in the visited color once followed</a>
      <a slLink disabled href="#order-4822">Order 4822, available once it ships</a>
    </div>
  `,
})
export class LinkStates {}
