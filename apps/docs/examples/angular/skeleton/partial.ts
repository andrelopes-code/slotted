import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton, SlSkeletonRegion, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-partial',
  imports: [SlBadge, SlHeading, SlInline, SlSkeleton, SlSkeletonRegion, SlSkeletonText, SlStack],
  template: `
    <div slSkeletonRegion [messages]="{ label: 'Loading shipment SO-10482' }">
      <div slStack [gap]="3">
        <h2 slHeading size="md">Shipment SO-10482</h2>
        <div slInline align="center" [gap]="3">
          <span slSkeleton [loading]="false">
            <span slBadge tone="info">In transit</span>
          </span>
          <span slSkeleton inlineSize="8rem"></span>
        </div>
        <div slSkeletonText [lines]="2"></div>
      </div>
    </div>
  `,
})
export class SkeletonPartial {}
