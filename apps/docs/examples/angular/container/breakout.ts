import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlContainer, SlContainerBreakout } from '@slotted/angular/container';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-container-breakout',
  imports: [SlCard, SlCardBody, SlContainer, SlContainerBreakout, SlHeading, SlStack, SlText],
  template: `
    <div
      slContainer
      size="measure"
      style="--slotted-container-measure: 40ch; row-gap: var(--slotted-space-5)"
    >
      <div slStack [gap]="3">
        <h2 slHeading size="md">Quarter-end stock count</h2>
        <p slText>
          Counts finished at 14 of 14 sites. Three sites report a variance above 2% and are listed
          below.
        </p>
      </div>

      <div slContainerBreakout>
        <div slCard>
          <div slCardBody>
            <span slText>Singapore +2.4%, Chicago -3.1%, Osaka +2.2%. 41,926 units counted.</span>
          </div>
        </div>
      </div>

      <p slText>The text returns to the same column after the breakout.</p>
    </div>
  `,
})
export class ContainerBreakoutExample {}
