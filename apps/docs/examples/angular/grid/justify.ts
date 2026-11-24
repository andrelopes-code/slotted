import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-justify',
  imports: [SlCard, SlCardBody, SlGrid, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      @for (justify of justifies; track justify) {
        <div slStack [gap]="3">
          <p slText size="sm" tone="muted">justify: {{ justify }}</p>

          <div slGrid [columns]="3" [gap]="4" [justify]="justify" minItemWidth="xs">
            @for (action of actions; track action) {
              <div slCard>
                <div slCardBody>
                  <span slText>{{ action }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class GridJustify {
  protected readonly justifies = ['start', 'center', 'end', 'stretch'] as const;

  protected readonly actions = ['Ship', 'Hold for review', 'Return to supplier'] as const;
}
