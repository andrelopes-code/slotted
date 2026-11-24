import { Component } from '@angular/core';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-skeleton-text',
  imports: [SlSkeletonText, SlStack],
  template: `
    <div slStack [gap]="6">
      <div slSkeletonText></div>
      <div slSkeletonText [lines]="5" lastLineSize="40%"></div>
      <div slSkeletonText [lines]="1" inlineSize="12rem"></div>
    </div>
  `,
})
export class SkeletonTextRows {}
