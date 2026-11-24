import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader } from '@slotted/angular/card';
import { SlDivider } from '@slotted/angular/divider';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-dividers',
  imports: [SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlDivider, SlHeading, SlText],
  template: `
    <div slCard>
      <div slCardHeader>
        <h2 slHeading size="md">Rotterdam warehouse</h2>
        <p slText size="sm" tone="muted">Pallet capacity</p>
      </div>
      <hr slDivider decorative />
      <div slCardBody>
        <p slText>8,420 of 10,000 pallet positions are in use.</p>
      </div>
      <hr slDivider decorative inset />
      <div slCardFooter>
        <p slText size="sm" tone="muted">Counted on 24 November at 06:00.</p>
      </div>
    </div>
  `,
})
export class CardDividers {}
