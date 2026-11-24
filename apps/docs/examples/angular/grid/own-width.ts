import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-own-width',
  imports: [SlBadge, SlCard, SlCardBody, SlGrid, SlHeading, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      <div slStack [gap]="3">
        <p slText size="sm" tone="muted">Across the whole preview</p>

        <div slGrid [columns]="4" [gap]="4" justify="start" minItemWidth="xs">
          @for (bay of bays; track bay.name) {
            <span slBadge [tone]="bay.tone">{{ bay.name }}: {{ bay.status }}</span>
          }
        </div>
      </div>

      <div slStack [gap]="3">
        <p slText size="sm" tone="muted">The same grid inside two half-width cards</p>

        <div slGrid [columns]="2" [gap]="6">
          @for (zone of zones; track zone) {
            <div slCard>
              <div slCardBody>
                <div slStack [gap]="3">
                  <h2 slHeading size="md">{{ zone }}</h2>
                  <div slGrid [columns]="4" [gap]="4" justify="start" minItemWidth="xs">
                    @for (bay of bays; track bay.name) {
                      <span slBadge [tone]="bay.tone">{{ bay.name }}: {{ bay.status }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class GridOwnWidth {
  protected readonly zones = ['Zone A', 'Zone B'] as const;

  protected readonly bays = [
    { name: 'Bay 1', status: 'Full', tone: 'success' },
    { name: 'Bay 2', status: 'Half', tone: 'info' },
    { name: 'Bay 3', status: 'Low', tone: 'warning' },
    { name: 'Bay 4', status: 'Empty', tone: 'danger' },
  ] as const;
}
