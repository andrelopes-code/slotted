import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import {
  SlCard,
  SlCardActions,
  SlCardBody,
  SlCardFooter,
  SlCardHeader,
} from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-regions',
  imports: [
    SlBadge,
    SlButton,
    SlCard,
    SlCardActions,
    SlCardBody,
    SlCardFooter,
    SlCardHeader,
    SlHeading,
    SlInline,
    SlText,
  ],
  template: `
    <div slCard>
      <div slCardHeader>
        <h2 slHeading size="md">Invoice 20418</h2>
        <p slText size="sm" tone="muted">Meridian Packaging</p>
        <div slCardActions>
          <span slBadge tone="warning">Overdue</span>
        </div>
      </div>
      <div slCardBody>
        <p slText>$4,820.00 was due on 15 November. A late fee of 1.5% applies from 1 December.</p>
      </div>
      <div slCardFooter>
        <div slInline>
          <button slButton>Pay invoice</button>
          <button slButton tone="secondary" variant="outline">Download PDF</button>
        </div>
      </div>
    </div>
  `,
})
export class CardRegions {}
