import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlCardLink } from '@slotted/angular/card';
import { SlLink } from '@slotted/angular/link';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-link',
  imports: [SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlCardLink, SlHeading, SlLink, SlText],
  template: `
    <div slCard>
      <div slCardHeader>
        <a slCardLink href="#meridian">
          <h2 slHeading size="md">Meridian Packaging</h2>
        </a>
        <p slText size="sm" tone="muted">Supplier since 2019</p>
      </div>
      <div slCardBody>
        <p slText>12 open invoices totaling $31,460.00.</p>
      </div>
      <div slCardFooter>
        <a slLink href="#meridian-terms">Payment terms</a>
      </div>
    </div>
  `,
})
export class CardLinkExample {}
