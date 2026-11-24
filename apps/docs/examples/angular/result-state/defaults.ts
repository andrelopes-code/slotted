import { Component } from '@angular/core';
import {
  provideResultStateDefaults,
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-result-state-defaults',
  imports: [
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlStack,
  ],
  providers: [provideResultStateDefaults({ align: 'start', reach: 'inline' })],
  template: `
    <div slStack [gap]="6">
      <section slResultState status="empty">
        <div slResultStateContent>
          <div slResultStateTitle>No late shipments</div>
          <p slResultStateDescription>Every carrier picked up on time this week.</p>
        </div>
      </section>

      <section slResultState status="no-results">
        <div slResultStateContent>
          <div slResultStateTitle>No returns in this period</div>
          <p slResultStateDescription>Widen the date range to see earlier returns.</p>
        </div>
      </section>

      <section slResultState align="center" reach="section" status="error">
        <div slResultStateContent>
          <div slResultStateTitle>Inventory counts did not load</div>
          <p slResultStateDescription>This region sets its own reach and alignment.</p>
        </div>
      </section>
    </div>
  `,
})
export class ResultStateDefaults {}
