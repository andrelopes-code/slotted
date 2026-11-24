import { Component } from '@angular/core';
import { SlAspectRatio } from '@slotted/angular/aspect-ratio';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-aspect-ratio-custom',
  imports: [SlAspectRatio, SlCard, SlCardBody, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slAspectRatio [ratio]="[2, 1]">
        <div slCard>
          <div slCardBody>
            <p slText size="sm">A pair, [2, 1]: written as 2 / 1.</p>
          </div>
        </div>
      </div>
      <div slAspectRatio [ratio]="1.85">
        <div slCard>
          <div slCardBody>
            <p slText size="sm">A number, 1.85: written as its quotient.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AspectRatioCustom {}
