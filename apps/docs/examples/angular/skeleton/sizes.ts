import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-skeleton-sizes',
  imports: [SlInline, SlSkeleton, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline align="center" [gap]="3">
        @for (size of sizes; track size) {
          <span slSkeleton shape="circle" [size]="size"></span>
        }
      </div>
      <div slInline align="center" [gap]="3">
        @for (size of sizes; track size) {
          <span slSkeleton shape="square" [size]="size"></span>
        }
      </div>
    </div>
  `,
})
export class SkeletonSizes {
  protected readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
}
