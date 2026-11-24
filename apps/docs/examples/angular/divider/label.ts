import { Component } from '@angular/core';
import { SlDivider } from '@slotted/angular/divider';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-label',
  imports: [SlDivider, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <p slText>Pay with the card on file, ending in 4242.</p>
      <div slDivider label="Or"></div>
      <p slText>Send a bank transfer to Northwind Freight, reference INV-20418.</p>
    </div>
  `,
})
export class DividerLabel {}
