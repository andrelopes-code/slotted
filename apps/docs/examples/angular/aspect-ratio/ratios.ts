import { Component } from '@angular/core';
import { SlAspectRatio } from '@slotted/angular/aspect-ratio';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-aspect-ratio-ratios',
  imports: [SlAspectRatio, SlCard, SlCardBody, SlGrid, SlText],
  template: `
    <div slGrid [columns]="3" [gap]="4" minItemWidth="xs">
      @for (ratio of ratios; track ratio.name) {
        <div slAspectRatio [ratio]="ratio.name">
          <div slCard>
            <div slCardBody>
              <p slText size="sm">{{ ratio.label }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AspectRatioRatios {
  protected readonly ratios = [
    { name: 'square', label: 'square, 1:1' },
    { name: 'landscape', label: 'landscape, 4:3' },
    { name: 'portrait', label: 'portrait, 3:4' },
    { name: 'video', label: 'video, 16:9' },
    { name: 'wide', label: 'wide, 21:9' },
  ] as const;
}
