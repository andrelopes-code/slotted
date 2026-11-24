import { Component, effect, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-cover',
  imports: [SlAvatar, SlBadge, SlButton, SlInline, SlSkeleton, SlSkeletonRegion, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline>
        <button slButton size="sm" variant="outline" (click)="loading.set(true)">
          Replay loading
        </button>
      </div>
      <div slSkeletonRegion [loading]="loading()" [messages]="{ label: 'Loading the invoice' }">
        <div slInline align="center" [gap]="4">
          <span slSkeleton shape="circle" size="lg">
            <span slAvatar name="Tomás Rivera" size="lg"></span>
          </span>
          <div slStack [gap]="1">
            <span slSkeleton>
              <span slText>Tomás Rivera</span>
            </span>
            <span slSkeleton>
              <span slText size="sm" tone="muted">Invoice 4821, due 30 Nov</span>
            </span>
          </div>
          <span slSkeleton>
            <span slBadge tone="success">Paid in full</span>
          </span>
        </div>
      </div>
    </div>
  `,
})
export class SkeletonCover {
  protected readonly loading = signal(true);

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) return;
      const timer = setTimeout(() => this.loading.set(false), 1500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
