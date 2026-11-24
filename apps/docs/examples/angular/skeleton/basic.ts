import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-skeleton-basic',
  imports: [SlInline, SlSkeleton, SlSkeletonRegion, SlStack],
  template: `
    <div slSkeletonRegion [messages]="{ label: 'Loading the dock supervisor' }">
      <div slInline align="center" [gap]="4">
        <span slSkeleton shape="circle" size="lg"></span>
        <div slStack [gap]="2">
          <span slSkeleton inlineSize="9rem"></span>
          <span slSkeleton inlineSize="6rem"></span>
        </div>
      </div>
    </div>
  `,
})
export class SkeletonBasic {}
