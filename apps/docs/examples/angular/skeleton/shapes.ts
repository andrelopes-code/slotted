import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton } from '@slotted/angular/skeleton';

@Component({
  selector: 'app-skeleton-shapes',
  imports: [SlInline, SlSkeleton],
  template: `
    <div slInline align="center" [gap]="5">
      <span slSkeleton shape="text" inlineSize="6rem"></span>
      <span slSkeleton shape="block" blockSize="4rem" inlineSize="6rem"></span>
      <span slSkeleton shape="circle" size="lg"></span>
      <span slSkeleton shape="square" size="lg"></span>
    </div>
  `,
})
export class SkeletonShapes {}
