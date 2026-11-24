import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlContainer } from '@slotted/angular/container';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-container-align',
  imports: [SlCard, SlCardBody, SlContainer, SlStack, SlText],
  template: `
    <div slStack style="--slotted-container-measure: 40ch" [gap]="4">
      @for (align of aligns; track align) {
        <div slCard>
          <div slContainer [align]="align" size="measure">
            <div slCard>
              <div slCardBody>
                <span slText>align: {{ align }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContainerAlign {
  protected readonly aligns = ['center', 'start', 'end'] as const;
}
