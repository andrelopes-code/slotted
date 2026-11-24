import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlContainer } from '@slotted/angular/container';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-container-size',
  imports: [SlCard, SlCardBody, SlContainer, SlStack, SlText],
  template: `
    <div
      slStack
      style="--slotted-container-measure: 40ch; --slotted-container-content: 28rem; --slotted-container-wide: 34rem; --slotted-container-full: 38rem"
      [gap]="4"
    >
      @for (size of sizes; track size) {
        <div slContainer [inset]="0" [size]="size">
          <div slCard>
            <div slCardBody>
              <span slText>{{ size }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContainerSize {
  protected readonly sizes = ['measure', 'content', 'wide', 'full', 'bleed'] as const;
}
