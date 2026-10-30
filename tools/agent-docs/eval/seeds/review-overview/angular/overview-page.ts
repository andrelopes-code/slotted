import { Component } from '@angular/core';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionTitle,
} from '@slotted/angular/section';
import {
  SlStatCard,
  SlStatCardDelta,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardValue,
} from '@slotted/angular/stat-card';

@Component({
  selector: 'app-overview-page',
  imports: [
    SlSection,
    SlSectionBody,
    SlSectionHeader,
    SlSectionTitle,
    SlStatCard,
    SlStatCardDelta,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardValue,
  ],
  template: `
    <section slSection ground="surface">
      <header slSectionHeader><h2 slSectionTitle>Revenue this month</h2></header>
      <div slSectionBody>
        <div slStatCard [delta]="0.124">
          <div slStatCardHeader><span slStatCardLabel>Revenue</span></div>
          <div slStatCardFigure>
            <span slStatCardValue [value]="48200"></span>
            <span slStatCardDelta></span>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class OverviewPage {}
