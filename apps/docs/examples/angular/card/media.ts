import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlCardMedia } from '@slotted/angular/card';
import { SlHeading, SlText } from '@slotted/angular/typography';

const COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'%3E%3Crect width='320' height='160' fill='%23c7d2fe'/%3E%3Crect x='40' y='70' width='80' height='90' fill='%234338ca'/%3E%3Crect x='130' y='40' width='70' height='120' fill='%236366f1'/%3E%3Crect x='210' y='85' width='70' height='75' fill='%234338ca'/%3E%3C/svg%3E";

@Component({
  selector: 'app-card-media',
  imports: [
    SlButton,
    SlCard,
    SlCardBody,
    SlCardFooter,
    SlCardHeader,
    SlCardMedia,
    SlHeading,
    SlText,
  ],
  template: `
    <div slCard>
      <figure slCardMedia><img alt="" [src]="cover" /></figure>
      <div slCardHeader>
        <h2 slHeading size="md">Meridian Packaging</h2>
        <p slText size="sm" tone="muted">Rotterdam, 3 warehouses</p>
      </div>
      <div slCardBody>
        <p slText>14 purchase orders are open, and the next delivery arrives on Tuesday.</p>
      </div>
      <div slCardFooter>
        <button slButton variant="outline">View supplier</button>
      </div>
    </div>
  `,
})
export class CardMediaExample {
  protected readonly cover = COVER;
}
