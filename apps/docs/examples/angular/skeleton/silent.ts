import { Component, effect, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-silent',
  imports: [SlAvatar, SlButton, SlHeading, SlInline, SlSkeleton, SlSkeletonRegion, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline align="center" [gap]="3">
        <h2 slHeading size="md">Recently active</h2>
        <button slButton size="sm" variant="outline" (click)="loading.set(true)">
          Replay loading
        </button>
      </div>
      <div slSkeletonRegion live="off" [loading]="loading()">
        <div slInline [gap]="2">
          @for (name of active; track name) {
            @if (loading()) {
              <span slSkeleton shape="circle" size="md"></span>
            } @else {
              <span slAvatar [name]="name" size="md"></span>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class SkeletonSilent {
  protected readonly active = ['Maria Chen', 'Tomás Rivera', 'Priya Nair', 'Jonas Weber'];

  protected readonly loading = signal(true);

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) return;
      const timer = setTimeout(() => this.loading.set(false), 1500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
