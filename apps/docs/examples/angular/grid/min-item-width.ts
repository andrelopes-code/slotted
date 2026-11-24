import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-min-item-width',
  imports: [SlCard, SlCardBody, SlGrid, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      @for (width of widths; track width.size) {
        <div slStack [gap]="3">
          <p slText size="sm" tone="muted">minItemWidth: {{ width.size }} ({{ width.rem }})</p>

          <div slGrid [gap]="3" [minItemWidth]="width.size">
            @for (bay of bays; track bay) {
              <div slCard>
                <div slCardBody>
                  <span slText>{{ bay }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class GridMinItemWidth {
  protected readonly widths = [
    { size: 'xs', rem: '8rem' },
    { size: 'sm', rem: '12rem' },
    { size: 'md', rem: '16rem' },
    { size: 'lg', rem: '20rem' },
    { size: 'xl', rem: '24rem' },
  ] as const;

  protected readonly bays = ['Bay A1', 'Bay A2', 'Bay B1', 'Bay B2'] as const;
}
