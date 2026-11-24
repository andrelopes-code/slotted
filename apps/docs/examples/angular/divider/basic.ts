import { Component } from '@angular/core';
import { SlDivider } from '@slotted/angular/divider';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-basic',
  imports: [SlDivider, SlHeading, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slStack [gap]="1">
        <h2 slHeading size="sm">Billing</h2>
        <p slText size="sm" tone="muted">
          Invoices are issued on the first business day of each month.
        </p>
      </div>
      <hr slDivider />
      <div slStack [gap]="1">
        <h2 slHeading size="sm">Members</h2>
        <p slText size="sm" tone="muted">
          Eleven people in the Northwind operations team can approve orders.
        </p>
      </div>
    </div>
  `,
})
export class DividerBasic {}
