import { Component } from '@angular/core';
import { SlDivider } from '@slotted/angular/divider';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-align',
  imports: [SlDivider, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slDivider align="start" label="Today"></div>
      <p slText size="sm">3 shipments left the Rotterdam warehouse.</p>
      <div slDivider align="center" label="Yesterday"></div>
      <p slText size="sm">5 shipments left, 1 was returned.</p>
      <div slDivider align="end" label="Earlier this week"></div>
      <p slText size="sm">11 shipments left, all delivered.</p>
    </div>
  `,
})
export class DividerAlign {}
