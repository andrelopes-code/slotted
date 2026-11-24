import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-align',
  imports: [SlCard, SlCardBody, SlGrid, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      @for (align of aligns; track align) {
        <div slStack [gap]="3">
          <p slText size="sm" tone="muted">align: {{ align }}</p>

          <div slGrid [align]="align" [columns]="3" [gap]="4" minItemWidth="xs">
            @for (shipment of shipments; track shipment) {
              <div slCard>
                <div slCardBody>
                  <span slText>{{ shipment }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class GridAlign {
  protected readonly aligns = ['start', 'center', 'end', 'stretch'] as const;

  protected readonly shipments = [
    'Ships today.',
    'Waits for the carrier pickup window on Thursday afternoon.',
    'Held until payment clears and the customs check for the destination country finishes.',
  ] as const;
}
