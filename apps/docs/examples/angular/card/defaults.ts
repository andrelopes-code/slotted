import { Component } from '@angular/core';
import { provideCardDefaults, SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-defaults',
  imports: [SlCard, SlCardBody, SlCardHeader, SlGrid, SlHeading, SlText],
  providers: [provideCardDefaults({ fill: 'elevated', size: 'lg' })],
  template: `
    <div slGrid [columns]="2" [gap]="4" minItemWidth="xs">
      <div slCard>
        <div slCardHeader>
          <h2 slHeading size="md">Orders shipped</h2>
          <p slText size="sm" tone="muted">elevated, lg</p>
        </div>
        <div slCardBody>
          <p slText>312 orders left the Reno warehouse today.</p>
        </div>
      </div>

      <div slCard fill="outline" size="sm">
        <div slCardHeader>
          <h2 slHeading size="md">Returns received</h2>
          <p slText size="sm" tone="muted">outline, sm</p>
        </div>
        <div slCardBody>
          <p slText>18 returns arrived and 11 are restocked.</p>
        </div>
      </div>
    </div>
  `,
})
export class CardDefaults {}
