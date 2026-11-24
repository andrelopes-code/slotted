import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-gap',
  imports: [SlCard, SlCardBody, SlGrid, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      @for (gap of gaps; track gap) {
        <div slStack [gap]="3">
          <p slText size="sm" tone="muted">gap: {{ gap }}</p>

          <div slGrid [columns]="3" [gap]="gap" minItemWidth="xs">
            @for (order of orders; track order) {
              <div slCard>
                <div slCardBody>
                  <span slText numeric="tabular">{{ order }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class GridGap {
  protected readonly gaps = [0, 2, 6, 12] as const;

  protected readonly orders = ['SO-10482', 'SO-10483', 'SO-10484'] as const;
}
