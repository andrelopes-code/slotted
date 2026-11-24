import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader } from '@slotted/angular/card';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-basic',
  imports: [SlButton, SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlHeading, SlText],
  template: `
    <div slCard>
      <div slCardHeader>
        <h2 slHeading size="md">Meridian Packaging</h2>
        <p slText size="sm" tone="muted">Supplier since 2019</p>
      </div>
      <div slCardBody>
        <p slText>Delivers pallets of cartons to Rotterdam every Tuesday and Friday.</p>
      </div>
      <div slCardFooter>
        <button slButton variant="outline">View orders</button>
      </div>
    </div>
  `,
})
export class CardBasic {}
