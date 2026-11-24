import { Component } from '@angular/core';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-animation',
  imports: [SlSkeletonText, SlStack, SlText],
  template: `
    <div slStack [gap]="5">
      @for (animation of animations; track animation) {
        <div slStack [gap]="2">
          <span slText size="sm" tone="muted">{{ animation }}</span>
          <div slSkeletonText [animation]="animation" [lines]="2"></div>
        </div>
      }
    </div>
  `,
})
export class SkeletonAnimation {
  protected readonly animations = ['shimmer', 'pulse', 'none'] as const;
}
