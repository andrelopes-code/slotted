import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-stack-gap',
  imports: [SlBadge, SlInline, SlStack, SlText],
  template: `
    <div slInline align="start" [gap]="8">
      @for (gap of gaps; track gap) {
        <div slStack [gap]="1">
          <span slText size="xs" tone="muted">Gap {{ gap }}</span>
          <div slStack [gap]="gap">
            <span slBadge tone="success">Packed</span>
            <span slBadge tone="warning">Late</span>
            <span slBadge tone="danger">Held</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class StackGap {
  protected readonly gaps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
}
