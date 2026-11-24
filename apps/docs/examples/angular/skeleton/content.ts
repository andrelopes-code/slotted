import { Component } from '@angular/core';
import { SlSkeleton, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-content',
  imports: [SlHeading, SlSkeleton, SlSkeletonText, SlStack],
  template: `
    <div slStack [gap]="6">
      <h2 slHeading size="2xl">
        <span slSkeleton inlineSize="60%"></span>
      </h2>
      <h2 slHeading size="md">
        <span slSkeleton inlineSize="45%"></span>
      </h2>
      <div dir="rtl">
        <div slSkeletonText [lines]="3"></div>
      </div>
    </div>
  `,
})
export class SkeletonContent {}
