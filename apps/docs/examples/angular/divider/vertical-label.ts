import { Component } from '@angular/core';
import { SlDivider } from '@slotted/angular/divider';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-vertical-label',
  imports: [SlDivider, SlInline, SlStack, SlText],
  template: `
    <div slInline [gap]="4">
      <div slStack [gap]="1">
        <p slText weight="semibold">Pay by card</p>
        <p slText size="sm" tone="muted">Charged today</p>
        <p slText size="sm" tone="muted">Receipt by email</p>
      </div>
      <div slDivider label="Or" orientation="vertical"></div>
      <div slStack [gap]="1">
        <p slText weight="semibold">Pay by transfer</p>
        <p slText size="sm" tone="muted">Due in 30 days</p>
        <p slText size="sm" tone="muted">Reference INV-20418</p>
      </div>
    </div>
  `,
})
export class DividerVerticalLabel {}
